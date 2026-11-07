import clsx from "clsx";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useMemo } from "react";
import { Link, useParams } from "react-router";
import type { Edicao } from "@/app/contextos";
import { resumoDaTurma } from "@/domain/ranking";
import type { Turma } from "@/domain/tipos";
import { anoEmTexto, categoriaEmTexto, formatarPontos, ordinal } from "@/domain/textos";
import { ComEdicao } from "@/ui/ComEdicao";
import { CabecalhoDaPagina, Secao } from "@/ui/Pagina";
import { ConteudoNaoEncontrado } from "@/features/nao-encontrada/PaginaNaoEncontrada";

export function PaginaTurma() {
  const { codigo = "" } = useParams();
  return (
    <ComEdicao>
      {(edicao) => {
        const turma = edicao.turmas.find((t) => t.codigo.toLowerCase() === codigo.toLowerCase());
        return turma ? (
          <Conteudo turma={turma} edicao={edicao} />
        ) : (
          <ConteudoNaoEncontrado
            titulo="Turma não encontrada"
            link={{ para: "/ranking", rotulo: "Ver o ranking geral" }}
          />
        );
      }}
    </ComEdicao>
  );
}

function linkDaTurma(turma: Turma): string {
  return `/turmas/${turma.codigo.toLowerCase()}`;
}

function Conteudo({ turma, edicao }: { turma: Turma; edicao: Edicao }) {
  const resumo = useMemo(
    () =>
      resumoDaTurma(
        turma.id,
        edicao.rankingGeral,
        edicao.modalidades,
        edicao.rankings,
        edicao.equipes,
      ),
    [turma.id, edicao],
  );
  if (!resumo) return null;

  const { posicao, resultados, primeirosLugares, podios } = resumo;
  const anterior = edicao.rankingGeral[posicao.colocacao - 2];
  const seguinte = edicao.rankingGeral[posicao.colocacao];
  const campea = posicao.colocacao === 1;

  return (
    <>
      <CabecalhoDaPagina
        titulo={`Turma ${turma.codigo}`}
        tituloDaAba={`Turma ${turma.codigo}`}
        antes={<p className="mb-3 font-semibold text-campo-escuro">{anoEmTexto(turma)}</p>}
      />

      <div className="flex flex-wrap items-end gap-x-10 gap-y-4 border-y border-cal py-6">
        <p>
          <span className={clsx("block text-7xl placar", campea ? "text-campea" : "text-tinta")}>
            {ordinal(posicao.colocacao)}
          </span>
          <span className="text-tinta-suave">
            {campea ? "lugar geral, campeã da edição" : "lugar no ranking geral"}
          </span>
        </p>
        <p>
          <span className="block text-7xl placar">{formatarPontos(posicao.pontos)}</span>
          <span className="text-tinta-suave">pontos somados</span>
        </p>
        <p className="medida text-lg sm:ml-auto sm:max-w-xs">
          {primeirosLugares > 0
            ? `Ficou em primeiro lugar em ${primeirosLugares} ${primeirosLugares === 1 ? "modalidade" : "modalidades"}`
            : "Não ficou em primeiro lugar em nenhuma modalidade"}{" "}
          e chegou ao pódio em {podios}.
        </p>
      </div>

      <Secao titulo="Resultado em cada modalidade" id="resultados">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b-2 border-tinta text-sm text-tinta-suave">
              <th scope="col" className="py-2 font-semibold">
                Modalidade
              </th>
              <th scope="col" className="w-24 py-2 text-right font-semibold">
                Posição
              </th>
              <th scope="col" className="w-24 py-2 text-right font-semibold">
                Pontos
              </th>
            </tr>
          </thead>
          <tbody>
            {resultados.map((r) => (
              <tr key={r.modalidade.id} className="border-b border-cal">
                <th scope="row" className="py-2.5 pr-3 font-normal">
                  <Link
                    to={`/modalidades/${r.modalidade.id}`}
                    className="font-semibold hover:text-campo-escuro hover:underline"
                  >
                    {r.modalidade.nome}
                  </Link>{" "}
                  <span className="text-tinta-suave">
                    {categoriaEmTexto(r.modalidade.categoria)}
                  </span>
                  {r.combinada && (
                    <span className="block text-sm text-tinta-suave">como {r.equipeNome}</span>
                  )}
                </th>
                <td
                  className={clsx(
                    "py-2.5 text-right font-semibold tabular-nums",
                    r.colocacao === 1 && "text-campea",
                  )}
                >
                  {r.colocacao === null ? (
                    <span className="font-normal text-tinta-suave">pontos fixos</span>
                  ) : (
                    ordinal(r.colocacao)
                  )}
                </td>
                <td className="py-2.5 text-right font-semibold tabular-nums">
                  {formatarPontos(r.pontos)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Secao>

      <nav aria-label="Outras turmas" className="mt-10 flex flex-wrap justify-between gap-4">
        {anterior ? (
          <Link
            to={linkDaTurma(anterior.turma)}
            className="inline-flex items-center gap-2 font-semibold text-campo-escuro"
          >
            <ArrowLeft aria-hidden className="size-4" />
            {ordinal(anterior.colocacao)} Turma {anterior.turma.codigo}
          </Link>
        ) : (
          <span />
        )}
        {seguinte && (
          <Link
            to={linkDaTurma(seguinte.turma)}
            className="inline-flex items-center gap-2 font-semibold text-campo-escuro"
          >
            {ordinal(seguinte.colocacao)} Turma {seguinte.turma.codigo}
            <ArrowRight aria-hidden className="size-4" />
          </Link>
        )}
      </nav>
    </>
  );
}
