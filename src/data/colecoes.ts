/**
 * Leitura em tempo real e gravação das coleções usadas pelo site.
 *
 * Cada função `observar*` assina um listener do Firestore, converte os documentos
 * com os mapeadores e devolve a função que cancela a assinatura.
 */
import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type DocumentData,
  type FirestoreError,
} from "firebase/firestore";
import type { ChaveDeGrupo, Equipe, LinhaRanking, Modalidade, Turma } from "@/domain/tipos";
import { db } from "./firebase";
import {
  mapearChaves,
  mapearEquipes,
  mapearModalidade,
  mapearRanking,
  mapearTurmas,
} from "./mapeadores";

export type AoMudar<T> = (dados: T) => void;
export type AoFalhar = (erro: Error) => void;
export type Cancelar = () => void;

/** Converte cada documento; um documento inválido é ignorado e reportado, sem derrubar a tela. */
function converterTodos<T>(
  docs: { id: string; data: () => DocumentData }[],
  mapear: (id: string, dados: unknown) => T,
): T[] {
  const convertidos: T[] = [];
  for (const documento of docs) {
    try {
      convertidos.push(mapear(documento.id, documento.data()));
    } catch (erro) {
      console.warn(erro);
    }
  }
  return convertidos;
}

function traduzirErro(erro: FirestoreError): Error {
  if (erro.code === "permission-denied") {
    return new Error("Sem permissão para ler os dados do evento.");
  }
  if (erro.code === "unavailable") {
    return new Error("Não foi possível conectar ao banco de dados. Verifique a internet.");
  }
  return new Error(`Erro ao carregar os dados (${erro.code}).`);
}

export function observarModalidades(aoMudar: AoMudar<Modalidade[]>, aoFalhar: AoFalhar): Cancelar {
  return onSnapshot(
    collection(db, "modalidades"),
    (snap) => {
      const modalidades = converterTodos(snap.docs, mapearModalidade);
      modalidades.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR") || a.ordem - b.ordem);
      aoMudar(modalidades);
    },
    (erro) => aoFalhar(traduzirErro(erro)),
  );
}

/** Rankings finais de cada modalidade, por id da modalidade. */
export function observarRankings(
  aoMudar: AoMudar<Map<string, LinhaRanking[]>>,
  aoFalhar: AoFalhar,
): Cancelar {
  return onSnapshot(
    collection(db, "ranking"),
    (snap) => {
      // O documento "geral" era um cache antigo do ranking geral; o site calcula na hora.
      const docs = snap.docs.filter((d) => d.id !== "geral");
      const pares = converterTodos(docs, (id, dados) => [id, mapearRanking(id, dados)] as const);
      aoMudar(new Map(pares));
    },
    (erro) => aoFalhar(traduzirErro(erro)),
  );
}

function observarConfiguracao<T>(
  id: string,
  mapear: (dados: unknown) => T,
  aoMudar: AoMudar<T>,
  aoFalhar: AoFalhar,
): Cancelar {
  return onSnapshot(
    doc(db, "configuracoes", id),
    (snap) => {
      if (!snap.exists()) {
        aoFalhar(new Error(`Configuração "${id}" não encontrada no banco.`));
        return;
      }
      try {
        aoMudar(mapear(snap.data()));
      } catch (erro) {
        aoFalhar(erro instanceof Error ? erro : new Error(String(erro)));
      }
    },
    (erro) => aoFalhar(traduzirErro(erro)),
  );
}

export function observarTurmas(aoMudar: AoMudar<Turma[]>, aoFalhar: AoFalhar): Cancelar {
  return observarConfiguracao("turmas_ranking", mapearTurmas, aoMudar, aoFalhar);
}

export function observarEquipes(aoMudar: AoMudar<Equipe[]>, aoFalhar: AoFalhar): Cancelar {
  return observarConfiguracao("equipes_competindo", mapearEquipes, aoMudar, aoFalhar);
}

/** Composição das chaves (fase de grupos) de uma modalidade; lista vazia se não houver. */
export function observarChaves(
  modalidadeId: string,
  aoMudar: AoMudar<ChaveDeGrupo[]>,
  aoFalhar: AoFalhar,
): Cancelar {
  return onSnapshot(
    doc(db, "chaves", modalidadeId),
    (snap) => {
      if (!snap.exists()) {
        aoMudar([]);
        return;
      }
      try {
        aoMudar(mapearChaves(modalidadeId, snap.data()));
      } catch (erro) {
        console.warn(erro);
        aoMudar([]);
      }
    },
    (erro) => aoFalhar(traduzirErro(erro)),
  );
}

export interface LinhaParaSalvar {
  equipeId: string;
  equipeNome: string;
  pontos: number;
}

/**
 * Salva a pontuação final de uma modalidade no mesmo documento que o site de 2025
 * usava (`ranking/{modalidadeId}`). As regras do Firestore só aceitam a conta admin.
 */
export async function salvarPontuacao(
  modalidadeId: string,
  linhas: readonly LinhaParaSalvar[],
): Promise<void> {
  await setDoc(
    doc(db, "ranking", modalidadeId),
    {
      modalidadeId,
      ranking: linhas.map((linha, indice) => ({
        posicao: indice + 1,
        equipe: linha.equipeNome,
        equipeId: linha.equipeId,
        pontos: linha.pontos,
      })),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
