import clsx from "clsx";
import { ArrowLeft } from "lucide-react";
import { useMemo } from "react";
import { Link, useParams } from "react-router";
import type { Edicao } from "@/app/contextos";
import { pontuacaoDaModalidade, temVencedor } from "@/domain/ranking";
import type { LinhaPontuacao, Modalidade } from "@/domain/tipos";
import { categoriaEmTexto, formatarPontos, ordinal, sistemaEmTexto } from "@/domain/textos";
import { useChaves } from "@/hooks/useChaves";
import { ComEdicao } from "@/ui/ComEdicao";
import { Vazio } from "@/ui/Estados";
import { IconeModalidade } from "@/ui/IconeModalidade";
import { CabecalhoDaPagina, Secao } from "@/ui/Pagina";
import { Podio } from "@/ui/Podio";
import { ConteudoNaoEncontrado } from "@/features/nao-encontrada/PaginaNaoEncontrada";

export function PaginaModalidade() {
  const { id = "" } = useParams();
  return (
    <ComEdicao>
      {(edicao) => {
        const modalidade = edicao.modalidadePorId.get(id);
        return modalidade ? (
          <Conteudo modalidade={modalidade} edicao={edicao} />
        ) : (
          <ConteudoNaoEncontrado
            titulo="Modalidade não encontrada"
            link={{ para: "/modalidades", rotulo: "Ver todas as modalidades" }}
          />
        );
      }}
    </ComEdicao>
  );
}

function Conteudo({ modalidade, edicao }: { modalidade: Modalidade; edicao: Edicao }) {
  const { linhas, combinadasSemPontos } = useMemo(
    () => pontuacaoDaModalidade(edicao.rankings.get(modalidade.id) ?? [], edicao.equipes),
    [modalidade.id, edicao],
  );
  const disputada = temVencedor(linhas);
  const criterios = modalidade.criteriosDesempate.filter((c) => !/não se aplica/i.test(c));

  return (
    <>
      <CabecalhoDaPagina
        titulo={modalidade.nome}
        tituloDaAba={`${modalidade.nome} ${categoriaEmTexto(modalidade.categoria).toLowerCase()}`}
        antes={
          <Link
            to="/modalidades"
            className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-campo-escuro hover:underline"
          >
            <ArrowLeft aria-hidden className="size-4" />
            Modalidades
          </Link>
        }
      >
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-base">
          <IconeModalidade id={modalidade.id} className="size-5 text-campo-escuro" />
          <span className="font-semibold text-tinta">{categoriaEmTexto(modalidade.categoria)}</span>
          <span>{sistemaEmTexto(modalidade.sistema)}</span>
        </p>
      </CabecalhoDaPagina>

      {modalidade.descricao && <p className="medida text-lg">{modalidade.descricao}</p>}
      {criterios.length > 0 && (
        <p className="mt-2 medida text-tinta-suave">Desempate: {criterios.join("; ")}.</p>
      )}

      {linhas.length === 0 ? (
        <Vazio titulo="O resultado desta modalidade não foi lançado no sistema." />
      ) : (
        <>
          {disputada ? (
            <Secao titulo="Pódio" id="podio">
              <Podio linhas={linhas} />
            </Secao>
          ) : (
            <Vazio
              titulo={`Todas as equipes receberam ${formatarPontos(linhas[0]?.pontos ?? 0)} pontos.`}
            >
              Nesta prova a pontuação é fixa para quem cumpre a tarefa, então não há colocação.
            </Vazio>
          )}

          <Secao titulo="Pontos por equipe" id="pontos">
            <TabelaPontos linhas={linhas} mostrarColocacao={disputada} />
            {combinadasSemPontos.length > 0 && (
              <p className="mt-4 medida text-sm text-tinta-suave">
                {combinadasSemPontos.join(", ")}{" "}
                {combinadasSemPontos.length === 1
                  ? "competiu como equipe combinada"
                  : "competiram como equipes combinadas"}
                , mas os pontos foram lançados direto em cada turma, nas linhas acima.
              </p>
            )}
          </Secao>
        </>
      )}

      <ComposicaoDasChaves modalidadeId={modalidade.id} />
    </>
  );
}

function TabelaPontos({
  linhas,
  mostrarColocacao,
}: {
  linhas: readonly LinhaPontuacao[];
  mostrarColocacao: boolean;
}) {
  return (
    <table className="w-full max-w-2xl border-collapse text-left">
      <thead>
        <tr className="border-b-2 border-tinta text-sm text-tinta-suave">
          {mostrarColocacao && (
            <th scope="col" className="w-16 py-2 font-semibold">
              Posição
            </th>
          )}
          <th scope="col" className="py-2 font-semibold">
            Equipe
          </th>
          <th scope="col" className="py-2 text-right font-semibold">
            Pontos
          </th>
        </tr>
      </thead>
      <tbody>
        {linhas.map((linha) => (
          <tr key={linha.equipeId} className="border-b border-cal">
            {mostrarColocacao && (
              <td
                className={clsx(
                  "py-2.5 text-xl placar",
                  linha.colocacao === 1 ? "text-campea" : "text-tinta-suave",
                )}
              >
                {ordinal(linha.colocacao)}
              </td>
            )}
            <th scope="row" className="py-2.5 font-semibold">
              {linha.combinada ? (
                <>
                  {linha.equipeNome}
                  <span className="ml-2 text-sm font-normal text-tinta-suave">
                    equipe combinada
                  </span>
                </>
              ) : (
                <Link
                  to={`/turmas/${linha.codigo.toLowerCase()}`}
                  className="hover:text-campo-escuro hover:underline"
                >
                  {linha.equipeNome}
                </Link>
              )}
            </th>
            <td className="py-2.5 text-right font-semibold tabular-nums">
              {formatarPontos(linha.pontos)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ComposicaoDasChaves({ modalidadeId }: { modalidadeId: string }) {
  const estado = useChaves(modalidadeId);
  if (estado.status !== "pronto" || estado.dados.length === 0) return null;
  return (
    <Secao titulo="Chaves da fase de grupos" id="chaves">
      <p className="mb-4 medida text-tinta-suave">
        Como as equipes foram sorteadas. Os placares dos jogos não foram registrados no sistema.
      </p>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {estado.dados.map((chave) => (
          <li key={chave.nome} className="border-t-2 border-campo pt-2">
            <h3 className="font-bold">{chave.nome}</h3>
            <ul className="mt-1 text-tinta-suave">
              {chave.equipes
                .filter((nome) => nome.trim() !== "")
                .map((nome) => (
                  <li key={nome}>{nome}</li>
                ))}
            </ul>
          </li>
        ))}
      </ul>
    </Secao>
  );
}
