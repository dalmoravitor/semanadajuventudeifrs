/**
 * Converte documentos do Firestore, como estão salvos, em objetos do domínio.
 *
 * O banco de 2025 guarda números como texto ("posicao": "1", "pontos": "160") e
 * tem campos que mudaram de nome ao longo do projeto. Toda essa tolerância fica
 * aqui, validada com Zod, para o resto do app só ver tipos limpos.
 */
import * as z from "zod/mini";
import { codigoDaTurma } from "@/domain/ranking";
import type {
  AnoEscolar,
  Categoria,
  ChaveDeGrupo,
  Equipe,
  LinhaRanking,
  Modalidade,
  Turma,
} from "@/domain/tipos";

// zod/mini tem a mesma validação do Zod com API funcional, o que deixa o bundle
// levar só o que é usado (cerca de 70 KB a menos que o Zod completo).

/** Aceita número ou texto numérico ("160") e devolve número; recusa NaN e Infinity. */
const numero = z.pipe(
  z.union([z.number(), z.string()]),
  z.pipe(
    z.transform((valor: number | string) => Number(String(valor).replace(",", "."))),
    z.number(),
  ),
);

const texto = z.string();
const textoNaoVazio = z.string().check(z.minLength(1));

const linhaRankingDoc = z.object({
  posicao: z.optional(numero),
  equipe: z.optional(texto),
  equipeId: textoNaoVazio,
  pontos: numero,
});

const rankingDoc = z.object({
  ranking: z._default(z.array(linhaRankingDoc), []),
});

const modalidadeDoc = z.object({
  nome: textoNaoVazio,
  categoria: z.catch(z.enum(["masculino", "feminino", "misto"]), "misto"),
  tipo: z._default(texto, ""),
  sistema: z._default(texto, ""),
  descricao: z._default(texto, ""),
  ordem: z.optional(numero),
  criterioDesempate: z._default(z.array(texto), []),
});

const turmaConfig = z.object({
  id: textoNaoVazio,
  nome: textoNaoVazio,
  numero: numero,
  serie: z._default(texto, ""),
});

const turmasRankingDoc = z.object({ turmas: z.array(turmaConfig) });

const equipeConfig = z.object({
  id: textoNaoVazio,
  nome: textoNaoVazio,
  distribuicaoPontos: z
    .array(z.object({ turmaId: textoNaoVazio, percentual: numero }))
    .check(z.minLength(1)),
});

const equipesCompetindoDoc = z.object({ equipes: z.array(equipeConfig) });

const chavesDoc = z.object({
  chaves: z._default(
    z.array(z.object({ nome: texto, equipes: z._default(z.array(texto), []) })),
    [],
  ),
});

export class DocumentoInvalido extends Error {
  constructor(caminho: string, detalhe: string) {
    super(`Documento ${caminho} fora do formato esperado: ${detalhe}`);
    this.name = "DocumentoInvalido";
  }
}

function validar<S extends z.ZodMiniType>(
  esquema: S,
  dados: unknown,
  caminho: string,
): z.output<S> {
  const resultado = esquema.safeParse(dados);
  if (!resultado.success) {
    throw new DocumentoInvalido(caminho, z.prettifyError(resultado.error));
  }
  return resultado.data;
}

export function mapearModalidade(id: string, dados: unknown): Modalidade {
  const doc = validar(modalidadeDoc, dados, `modalidades/${id}`);
  return {
    id,
    nome: doc.nome,
    categoria: doc.categoria satisfies Categoria,
    tipo: doc.tipo,
    sistema: doc.sistema,
    descricao: doc.descricao,
    ordem: doc.ordem ?? 0,
    criteriosDesempate: doc.criterioDesempate,
  };
}

export function mapearRanking(id: string, dados: unknown): LinhaRanking[] {
  const doc = validar(rankingDoc, dados, `ranking/${id}`);
  return doc.ranking.map((linha, indice) => ({
    equipeId: linha.equipeId,
    equipeNome: linha.equipe ?? linha.equipeId,
    pontos: linha.pontos,
    posicaoInformada: linha.posicao ?? indice + 1,
  }));
}

function anoDaSerie(serie: string): AnoEscolar | null {
  const ano = Number(/(\d)\s*º/.exec(serie)?.[1]);
  return ano === 1 || ano === 2 || ano === 3 ? ano : null;
}

/** Lê `configuracoes/turmas_ranking`: as 16 turmas que disputam o ranking geral. */
export function mapearTurmas(dados: unknown): Turma[] {
  const doc = validar(turmasRankingDoc, dados, "configuracoes/turmas_ranking");
  return doc.turmas.map((turma) => ({
    id: turma.id,
    nome: turma.nome,
    codigo: codigoDaTurma(turma.nome),
    numero: turma.numero,
    ano: anoDaSerie(turma.serie),
    informatica: /\bTI\b/.test(turma.serie),
  }));
}

/** Lê `configuracoes/equipes_competindo`: as 21 equipes e para quais turmas vão seus pontos. */
export function mapearEquipes(dados: unknown): Equipe[] {
  const doc = validar(equipesCompetindoDoc, dados, "configuracoes/equipes_competindo");
  return doc.equipes.map((equipe) => ({
    id: equipe.id,
    nome: equipe.nome,
    codigo: codigoDaTurma(equipe.nome),
    distribuicao: equipe.distribuicaoPontos,
  }));
}

export function mapearChaves(id: string, dados: unknown): ChaveDeGrupo[] {
  const doc = validar(chavesDoc, dados, `chaves/${id}`);
  return doc.chaves.filter((chave) => chave.equipes.some((nome) => nome.trim() !== ""));
}
