import clsx from "clsx";
import { Link } from "react-router";
import type { LinhaPontuacao } from "@/domain/tipos";
import { formatarPontos, ordinal } from "@/domain/textos";

interface Degrau {
  colocacao: number;
  linhas: LinhaPontuacao[];
}

/** Pódio com as três primeiras colocações (empates dividem o degrau). */
export function Podio({ linhas }: { linhas: readonly LinhaPontuacao[] }) {
  const degraus: Degrau[] = [];
  for (const linha of linhas) {
    const atual = degraus.at(-1);
    if (atual && atual.colocacao === linha.colocacao) atual.linhas.push(linha);
    else if (linha.colocacao <= 3) degraus.push({ colocacao: linha.colocacao, linhas: [linha] });
  }
  if (degraus.length === 0) return null;

  // Ordem visual clássica: 2º, 1º, 3º.
  const ordemVisual = [degraus[1], degraus[0], degraus[2]].filter(
    (degrau): degrau is Degrau => degrau !== undefined,
  );
  const altura: Record<number, string> = {
    1: "h-28 sm:h-32",
    2: "h-20 sm:h-24",
    3: "h-14 sm:h-16",
  };

  return (
    <ol aria-label="Pódio" className="grid grid-cols-3 items-end gap-2 sm:max-w-xl">
      {ordemVisual.map((degrau) => (
        <li
          key={degrau.colocacao}
          className={clsx(
            "flex flex-col items-center text-center",
            degrau.colocacao === 1 ? "order-2" : degrau.colocacao === 2 ? "order-1" : "order-3",
          )}
        >
          <span className="sr-only">{ordinal(degrau.colocacao)} lugar: </span>
          <ul className="mb-2 space-y-0.5">
            {degrau.linhas.map((linha) => (
              <li key={linha.equipeId}>
                <LinkDaEquipe linha={linha} />
                <span className="block text-sm text-tinta-suave tabular-nums">
                  {formatarPontos(linha.pontos)} pts
                </span>
              </li>
            ))}
          </ul>
          <span
            aria-hidden
            className={clsx(
              "flex w-full items-start justify-center rounded-t-[3px] pt-2 text-2xl placar text-papel",
              altura[degrau.colocacao],
              degrau.colocacao === 1 ? "bg-campea" : "bg-campo-escuro",
            )}
          >
            {ordinal(degrau.colocacao)}
          </span>
        </li>
      ))}
    </ol>
  );
}

function LinkDaEquipe({ linha }: { linha: LinhaPontuacao }) {
  const texto = <span className="text-xl placar sm:text-2xl">{linha.codigo}</span>;
  const turmaId = linha.turmaIds[0];
  if (linha.combinada || !turmaId) return texto;
  return (
    <Link to={`/turmas/${linha.codigo.toLowerCase()}`} className="hover:text-campo-escuro">
      {texto}
    </Link>
  );
}
