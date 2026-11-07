import clsx from "clsx";

export interface OpcaoDeFiltro<T extends string> {
  valor: T;
  rotulo: string;
}

/** Grupo de botões de filtro em que só um fica ativo. */
export function Filtros<T extends string>({
  rotulo,
  opcoes,
  valor,
  aoMudar,
}: {
  rotulo: string;
  opcoes: readonly OpcaoDeFiltro<T>[];
  valor: T;
  aoMudar: (valor: T) => void;
}) {
  return (
    <div role="group" aria-label={rotulo} className="-mx-1 flex flex-wrap gap-1.5">
      {opcoes.map((opcao) => {
        const ativo = opcao.valor === valor;
        return (
          <button
            key={opcao.valor}
            type="button"
            aria-pressed={ativo}
            onClick={() => aoMudar(opcao.valor)}
            className={clsx(
              "min-h-10 rounded-full border px-3.5 text-sm font-semibold transition-colors",
              ativo
                ? "border-campo-escuro bg-campo-escuro text-papel"
                : "border-cal bg-papel text-tinta hover:border-campo-escuro",
            )}
          >
            {opcao.rotulo}
          </button>
        );
      })}
    </div>
  );
}
