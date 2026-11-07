import clsx from "clsx";
import { ChevronDown } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { Link } from "react-router";
import type { Edicao } from "@/app/contextos";
import type { PosicaoGeral } from "@/domain/tipos";
import { anoEmTexto, categoriaEmTexto, formatarPontos, ordinal } from "@/domain/textos";
import { ComEdicao } from "@/ui/ComEdicao";
import { Vazio } from "@/ui/Estados";
import { Filtros, type OpcaoDeFiltro } from "@/ui/Filtros";
import { CabecalhoDaPagina } from "@/ui/Pagina";

type Recorte = "todas" | "1" | "2" | "3" | "informatica";

const RECORTES: OpcaoDeFiltro<Recorte>[] = [
  { valor: "todas", rotulo: "Todas" },
  { valor: "1", rotulo: "1º ano" },
  { valor: "2", rotulo: "2º ano" },
  { valor: "3", rotulo: "3º ano" },
  { valor: "informatica", rotulo: "Informática" },
];

function noRecorte(posicao: PosicaoGeral, recorte: Recorte): boolean {
  if (recorte === "todas") return true;
  if (recorte === "informatica") return posicao.turma.informatica;
  return String(posicao.turma.ano) === recorte;
}

export function PaginaRanking() {
  return (
    <>
      <CabecalhoDaPagina titulo="Ranking geral" tituloDaAba="Ranking geral">
        Soma dos pontos de todas as modalidades. Toque numa turma para ver de onde vieram os pontos.
      </CabecalhoDaPagina>
      <ComEdicao>{(edicao) => <ListaRanking edicao={edicao} />}</ComEdicao>
    </>
  );
}

function ListaRanking({ edicao }: { edicao: Edicao }) {
  const [recorte, setRecorte] = useState<Recorte>("todas");
  const maximo = edicao.rankingGeral[0]?.pontos ?? 0;
  const visiveis = edicao.rankingGeral.filter((p) => noRecorte(p, recorte));

  return (
    <>
      <Filtros rotulo="Filtrar turmas" opcoes={RECORTES} valor={recorte} aoMudar={setRecorte} />
      {visiveis.length === 0 ? (
        <Vazio titulo="Nenhuma turma nesse recorte." />
      ) : (
        <ol className="mt-6 divide-y divide-cal border-y border-cal">
          {visiveis.map((posicao) => (
            <Raia key={posicao.turma.id} posicao={posicao} maximo={maximo} edicao={edicao} />
          ))}
        </ol>
      )}
    </>
  );
}

function Raia({
  posicao,
  maximo,
  edicao,
}: {
  posicao: PosicaoGeral;
  maximo: number;
  edicao: Edicao;
}) {
  const [aberta, setAberta] = useState(false);
  const idDetalhes = useId();
  const { turma, pontos, colocacao } = posicao;
  const campea = colocacao === 1;
  const largura = maximo > 0 ? `${(pontos / maximo) * 100}%` : "0%";

  return (
    <li>
      <button
        type="button"
        aria-expanded={aberta}
        aria-controls={idDetalhes}
        onClick={() => setAberta((v) => !v)}
        className="grid w-full grid-cols-[3rem_1fr_auto] items-center gap-x-3 py-4 text-left hover:bg-gramado/60 sm:grid-cols-[4rem_1fr_auto] sm:gap-x-5"
      >
        <span
          className={clsx(
            "text-3xl placar sm:text-4xl",
            campea ? "text-campea" : "text-tinta-suave",
          )}
        >
          {ordinal(colocacao)}
        </span>
        <span className="min-w-0">
          <span className="flex items-baseline justify-between gap-3">
            <span className="text-2xl placar sm:text-3xl">Turma {turma.codigo}</span>
            <span className="text-2xl placar tabular-nums sm:text-3xl">
              {formatarPontos(pontos)}
            </span>
          </span>
          <span className="mt-0.5 block text-sm text-tinta-suave">{anoEmTexto(turma)}</span>
          <span aria-hidden className="mt-2 block h-2.5 overflow-hidden rounded-full bg-gramado">
            <span
              className={clsx("block h-full rounded-full", campea ? "bg-campea" : "bg-campo")}
              style={{ width: largura }}
            />
          </span>
        </span>
        <ChevronDown
          aria-hidden
          className={clsx("size-5 text-tinta-suave transition-transform", aberta && "rotate-180")}
        />
      </button>
      <div id={idDetalhes} hidden={!aberta}>
        {aberta && <DetalhesDaRaia posicao={posicao} edicao={edicao} />}
      </div>
    </li>
  );
}

function DetalhesDaRaia({ posicao, edicao }: { posicao: PosicaoGeral; edicao: Edicao }) {
  const porModalidade = useMemo(() => {
    const soma = new Map<string, number>();
    for (const c of posicao.contribuicoes) {
      soma.set(c.modalidadeId, (soma.get(c.modalidadeId) ?? 0) + c.pontos);
    }
    return [...soma]
      .map(([id, pontos]) => ({ modalidade: edicao.modalidadePorId.get(id), pontos }))
      .filter((item) => item.modalidade !== undefined)
      .sort((a, b) => b.pontos - a.pontos);
  }, [posicao, edicao]);

  return (
    <div className="pb-6 sm:pl-[5.25rem]">
      <p className="mb-3 text-sm text-tinta-suave">
        Pontos em {porModalidade.length} modalidades, do maior para o menor.
      </p>
      <ul className="grid gap-x-8 gap-y-1.5 text-[0.95rem] sm:grid-cols-2">
        {porModalidade.map(({ modalidade, pontos }) =>
          modalidade ? (
            <li
              key={modalidade.id}
              className="flex justify-between gap-4 border-b border-gramado py-1"
            >
              <Link to={`/modalidades/${modalidade.id}`} className="hover:text-campo-escuro">
                {modalidade.nome}{" "}
                <span className="text-tinta-suave">({categoriaEmTexto(modalidade.categoria)})</span>
              </Link>
              <span className="font-semibold tabular-nums">{formatarPontos(pontos)}</span>
            </li>
          ) : null,
        )}
      </ul>
      <Link
        to={`/turmas/${posicao.turma.codigo.toLowerCase()}`}
        className="mt-4 inline-block font-semibold text-campo-escuro underline underline-offset-4"
      >
        Ver a página da Turma {posicao.turma.codigo}
      </Link>
    </div>
  );
}
