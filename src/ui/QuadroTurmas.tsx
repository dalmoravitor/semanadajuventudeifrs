import clsx from "clsx";
import { Link } from "react-router";
import type { PosicaoGeral } from "@/domain/tipos";
import { formatarPontos, ordinal } from "@/domain/textos";

/**
 * As 16 turmas em quadro, na ordem do ranking: quadrados verdes e a campeã como
 * círculo vermelho, as duas formas e cores do símbolo dos Institutos Federais.
 */
export function QuadroTurmas({ ranking }: { ranking: readonly PosicaoGeral[] }) {
  return (
    <ol aria-label="Ranking geral em quadro" className="grid grid-cols-4 gap-1.5 sm:gap-2">
      {ranking.map(({ turma, pontos, colocacao }) => {
        const campea = colocacao === 1;
        return (
          <li key={turma.id}>
            <Link
              to={`/turmas/${turma.codigo.toLowerCase()}`}
              aria-label={`${ordinal(colocacao)} lugar: Turma ${turma.codigo}, ${formatarPontos(pontos)} pontos`}
              className={clsx(
                "group relative flex aspect-square flex-col items-center justify-center text-papel transition-transform hover:-translate-y-0.5 focus-visible:-translate-y-0.5",
                campea
                  ? "rounded-full bg-campea"
                  : "rounded-[3px] bg-campo-escuro hover:bg-campo-noite",
              )}
            >
              {!campea && (
                <span className="absolute top-1 left-1.5 text-[0.7rem] font-semibold opacity-80 sm:top-1.5 sm:left-2 sm:text-xs">
                  {colocacao}
                </span>
              )}
              <span
                className={clsx(
                  "placar",
                  campea ? "text-[1.35rem] sm:text-3xl" : "text-xl sm:text-[1.7rem]",
                )}
              >
                {turma.codigo}
              </span>
              <span className="mt-0.5 text-[0.7rem] font-semibold tabular-nums opacity-90 sm:mt-1 sm:text-xs">
                {formatarPontos(pontos)}
              </span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
