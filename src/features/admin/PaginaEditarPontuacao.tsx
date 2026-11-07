import { ArrowLeft, ArrowUpDown, CircleCheck, Plus, Save, Trash2 } from "lucide-react";
import { useId, useState } from "react";
import { Link, useParams } from "react-router";
import type { Edicao } from "@/app/contextos";
import { salvarPontuacao } from "@/data/colecoes";
import type { Equipe, LinhaRanking, Modalidade } from "@/domain/tipos";
import { categoriaEmTexto } from "@/domain/textos";
import { useUsuario } from "@/hooks/useUsuario";
import { Botao } from "@/ui/Botao";
import { ComEdicao } from "@/ui/ComEdicao";
import { CabecalhoDaPagina } from "@/ui/Pagina";
import { ConteudoNaoEncontrado } from "@/features/nao-encontrada/PaginaNaoEncontrada";
import { AvisoModoLeitura } from "./AvisoModoLeitura";
import { validarLinhas, type LinhaEditavel } from "./validacao";

export function PaginaEditarPontuacao() {
  const { id = "" } = useParams();
  return (
    <ComEdicao>
      {(edicao) => {
        const modalidade = edicao.modalidadePorId.get(id);
        if (!modalidade) {
          return (
            <ConteudoNaoEncontrado
              titulo="Modalidade não encontrada"
              link={{ para: "/admin", rotulo: "Voltar ao painel" }}
            />
          );
        }
        // A `key` recria o editor ao trocar de modalidade, descartando o rascunho anterior.
        return (
          <Editor
            key={modalidade.id}
            modalidade={modalidade}
            edicao={edicao}
            iniciais={edicao.rankings.get(modalidade.id) ?? []}
          />
        );
      }}
    </ComEdicao>
  );
}

let proximaChave = 0;
const novaChave = () => `linha-${proximaChave++}`;

function paraEditaveis(linhas: readonly LinhaRanking[]): LinhaEditavel[] {
  return [...linhas]
    .sort((a, b) => a.posicaoInformada - b.posicaoInformada)
    .map((l) => ({ chave: novaChave(), equipeId: l.equipeId, pontos: String(l.pontos) }));
}

type Envio =
  | { estado: "ocioso" }
  | { estado: "salvando" }
  | { estado: "salvo" }
  | { estado: "erro"; mensagem: string };

function Editor({
  modalidade,
  edicao,
  iniciais,
}: {
  modalidade: Modalidade;
  edicao: Edicao;
  iniciais: readonly LinhaRanking[];
}) {
  const { usuario } = useUsuario();
  const somenteLeitura = !usuario;
  const [linhas, setLinhas] = useState(() => paraEditaveis(iniciais));
  const [alterado, setAlterado] = useState(false);
  const [envio, setEnvio] = useState<Envio>({ estado: "ocioso" });
  const idErros = useId();

  const problemas = validarLinhas(linhas);
  const equipesPorId = new Map(edicao.equipes.map((e) => [e.id, e]));

  function atualizar(proximas: LinhaEditavel[]) {
    setLinhas(proximas);
    setAlterado(true);
    setEnvio({ estado: "ocioso" });
  }

  async function salvar() {
    if (problemas.length > 0) return;
    setEnvio({ estado: "salvando" });
    try {
      await salvarPontuacao(
        modalidade.id,
        linhas.map((l) => ({
          equipeId: l.equipeId,
          equipeNome: equipesPorId.get(l.equipeId)?.nome ?? l.equipeId,
          pontos: Number(l.pontos),
        })),
      );
      setAlterado(false);
      setEnvio({ estado: "salvo" });
    } catch (erro) {
      const semPermissao = erro instanceof Error && /permission/i.test(erro.message);
      setEnvio({
        estado: "erro",
        mensagem: semPermissao
          ? "Sua conta não tem permissão para gravar. Use a conta da organização."
          : "Não foi possível salvar. Verifique a internet e tente de novo.",
      });
    }
  }

  return (
    <>
      <CabecalhoDaPagina
        titulo={modalidade.nome}
        tituloDaAba={`Pontuação: ${modalidade.nome}`}
        antes={
          <Link
            to="/admin"
            className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-campo-escuro hover:underline"
          >
            <ArrowLeft aria-hidden className="size-4" />
            Painel
          </Link>
        }
      >
        {categoriaEmTexto(modalidade.categoria)}. Lance uma linha por equipe, na ordem de
        classificação. O ranking geral é recalculado assim que a pontuação é salva.
      </CabecalhoDaPagina>

      {somenteLeitura && <AvisoModoLeitura />}

      <fieldset disabled={somenteLeitura} className="mt-6">
        <legend className="sr-only">Pontuação por equipe</legend>
        <ol className="max-w-2xl divide-y divide-cal border-y border-cal">
          {linhas.map((linha, indice) => (
            <li
              key={linha.chave}
              className="grid grid-cols-[2rem_1fr_6rem_2.75rem] items-center gap-2 py-2"
            >
              <span className="text-xl placar text-tinta-suave">{indice + 1}º</span>
              <SeletorDeEquipe
                equipes={edicao.equipes}
                valor={linha.equipeId}
                rotulo={`Equipe na posição ${indice + 1}`}
                aoMudar={(equipeId) =>
                  atualizar(linhas.map((l) => (l.chave === linha.chave ? { ...l, equipeId } : l)))
                }
              />
              <input
                type="number"
                inputMode="numeric"
                min={0}
                step={10}
                aria-label={`Pontos na posição ${indice + 1}`}
                value={linha.pontos}
                onChange={(e) =>
                  atualizar(
                    linhas.map((l) =>
                      l.chave === linha.chave ? { ...l, pontos: e.target.value } : l,
                    ),
                  )
                }
                className="min-h-11 w-full rounded-md border border-cal bg-papel px-2 text-right tabular-nums focus:border-campo-escuro disabled:bg-gramado"
              />
              <button
                type="button"
                aria-label={`Remover a linha da posição ${indice + 1}`}
                onClick={() => atualizar(linhas.filter((l) => l.chave !== linha.chave))}
                className="flex size-11 items-center justify-center rounded-md text-tinta-suave hover:bg-gramado hover:text-campea disabled:hover:bg-transparent disabled:hover:text-tinta-suave"
              >
                <Trash2 aria-hidden className="size-4" />
              </button>
            </li>
          ))}
        </ol>

        <div className="mt-4 flex flex-wrap gap-2">
          <Botao
            variante="secundario"
            onClick={() =>
              atualizar([...linhas, { chave: novaChave(), equipeId: "", pontos: "0" }])
            }
          >
            <Plus aria-hidden className="size-4" />
            Adicionar equipe
          </Botao>
          <Botao
            variante="secundario"
            onClick={() =>
              atualizar([...linhas].sort((a, b) => Number(b.pontos) - Number(a.pontos)))
            }
          >
            <ArrowUpDown aria-hidden className="size-4" />
            Ordenar por pontos
          </Botao>
        </div>
      </fieldset>

      {problemas.length > 0 && !somenteLeitura && (
        <ul id={idErros} className="mt-6 max-w-2xl list-disc space-y-1 pl-5 text-campea">
          {problemas.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      )}

      {!somenteLeitura && (
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Botao
            onClick={() => void salvar()}
            disabled={!alterado || problemas.length > 0 || envio.estado === "salvando"}
            aria-describedby={problemas.length > 0 ? idErros : undefined}
          >
            <Save aria-hidden className="size-4" />
            {envio.estado === "salvando" ? "Salvando…" : "Salvar pontuação"}
          </Botao>
          {alterado && (
            <Botao
              variante="discreto"
              onClick={() => {
                setLinhas(paraEditaveis(iniciais));
                setAlterado(false);
              }}
            >
              Descartar alterações
            </Botao>
          )}
          <p role="status" aria-live="polite" className="text-sm">
            {envio.estado === "salvo" && (
              <span className="inline-flex items-center gap-1.5 font-semibold text-campo-escuro">
                <CircleCheck aria-hidden className="size-4" />
                Pontuação salva.
              </span>
            )}
            {envio.estado === "erro" && (
              <span className="font-semibold text-campea">{envio.mensagem}</span>
            )}
          </p>
        </div>
      )}
    </>
  );
}

function SeletorDeEquipe({
  equipes,
  valor,
  rotulo,
  aoMudar,
}: {
  equipes: readonly Equipe[];
  valor: string;
  rotulo: string;
  aoMudar: (equipeId: string) => void;
}) {
  return (
    <select
      aria-label={rotulo}
      value={valor}
      onChange={(e) => aoMudar(e.target.value)}
      className="min-h-11 w-full rounded-md border border-cal bg-papel px-2 font-semibold focus:border-campo-escuro disabled:bg-gramado"
    >
      <option value="">Escolha a equipe</option>
      {equipes.map((equipe) => (
        <option key={equipe.id} value={equipe.id}>
          {equipe.nome}
        </option>
      ))}
    </select>
  );
}
