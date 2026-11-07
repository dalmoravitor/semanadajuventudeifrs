import { useMemo } from "react";
import { Link } from "react-router";
import type { Edicao } from "@/app/contextos";
import { EDICAO } from "@/content/edicao";
import { CRONOGRAMA } from "@/content/cronograma";
import { resumoDaTurma } from "@/domain/ranking";
import { formatarPontos } from "@/domain/textos";
import { BotaoLink } from "@/ui/Botao";
import { ComEdicao } from "@/ui/ComEdicao";
import { Secao } from "@/ui/Pagina";
import { QuadroTurmas } from "@/ui/QuadroTurmas";

export function PaginaInicio() {
  return (
    <>
      <title>{`${EDICAO.numeral} ${EDICAO.nome} ${EDICAO.ano} | ${EDICAO.campus}`}</title>
      <meta
        name="description"
        content={`Resultados da ${EDICAO.numeral} ${EDICAO.nome} do ${EDICAO.campus}: ranking geral das turmas e pontos de cada modalidade.`}
      />
      <ComEdicao>{(edicao) => <Conteudo edicao={edicao} />}</ComEdicao>
    </>
  );
}

function Conteudo({ edicao }: { edicao: Edicao }) {
  const [primeira, segunda] = edicao.rankingGeral;
  const resumoCampea = useMemo(
    () =>
      primeira
        ? resumoDaTurma(
            primeira.turma.id,
            edicao.rankingGeral,
            edicao.modalidades,
            edicao.rankings,
            edicao.equipes,
          )
        : null,
    [primeira, edicao],
  );

  return (
    <>
      <section className="grid items-center gap-10 py-10 sm:py-16 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
        <div>
          <p className="font-semibold text-campo-escuro">
            {EDICAO.campus}, {EDICAO.periodo}
          </p>
          <h1 className="mt-4 text-[3.6rem] placar sm:text-[5.5rem]">
            {EDICAO.numeral} Semana
            <br />
            da Juventude
          </h1>
          {primeira && segunda && (
            <p className="mt-6 medida text-xl leading-relaxed">
              A{" "}
              <Link
                to={`/turmas/${primeira.turma.codigo.toLowerCase()}`}
                className="font-bold text-campea underline decoration-2 underline-offset-4"
              >
                Turma {primeira.turma.codigo}
              </Link>{" "}
              venceu a edição com {formatarPontos(primeira.pontos)} pontos,{" "}
              {formatarPontos(primeira.pontos - segunda.pontos)} à frente da Turma{" "}
              {segunda.turma.codigo}
              {resumoCampea && resumoCampea.primeirosLugares > 0
                ? `, e ficou em primeiro lugar em ${resumoCampea.primeirosLugares} das ${edicao.modalidades.length} modalidades.`
                : "."}
            </p>
          )}
          <div className="mt-8 flex flex-wrap gap-3">
            <BotaoLink to="/ranking">Ver o ranking completo</BotaoLink>
            <BotaoLink to="/modalidades" variante="secundario">
              Resultados por modalidade
            </BotaoLink>
          </div>
        </div>

        <figure className="w-full max-w-md justify-self-center lg:max-w-none">
          <QuadroTurmas ranking={edicao.rankingGeral} />
          <figcaption className="mt-3 text-sm text-tinta-suave">
            As {edicao.turmas.length} turmas na ordem final, da esquerda para a direita. Toque numa
            turma para ver o desempenho dela.
          </figcaption>
        </figure>
      </section>

      <Secao
        titulo="Como a pontuação funciona"
        id="pontuacao"
        className="border-t border-cal pt-10"
      >
        <div className="grid gap-x-10 gap-y-5 text-tinta-suave md:grid-cols-3">
          <p>
            <strong className="text-tinta">Na maioria das modalidades</strong>, a primeira colocada
            leva 160 pontos e cada posição seguinte leva 10 a menos, até 10 pontos no 16º lugar.
            Provas como o Kit Solidário dão pontos fixos a quem cumpre a tarefa.
          </p>
          <p>
            <strong className="text-tinta">O ranking geral</strong> soma os pontos das{" "}
            {edicao.modalidades.length} modalidades. Em caso de empate, fica à frente a turma de
            número menor.
          </p>
          <p>
            <strong className="text-tinta">Equipes combinadas</strong>, como a Turma 12/13, reúnem
            alunos de duas turmas. Os pontos delas contam inteiros para cada uma das turmas.
          </p>
        </div>
      </Secao>

      <Secao titulo="A semana" id="semana" className="mt-12 border-t border-cal pt-10">
        <p className="medida text-lg text-tinta-suave">
          Foram {edicao.modalidades.length} modalidades em {CRONOGRAMA.length} dias, de atletismo e
          futsal a truco, bocha campeira e soletrando, disputadas por {edicao.equipes.length}{" "}
          equipes.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <BotaoLink to="/cronograma" variante="secundario">
            Ver o cronograma
          </BotaoLink>
          <BotaoLink to="/sobre" variante="discreto">
            Sobre o evento e o projeto
          </BotaoLink>
        </div>
      </Secao>
    </>
  );
}
