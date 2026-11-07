import { Lock } from "lucide-react";
import { Link } from "react-router";

export function AvisoModoLeitura() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-md border border-cal bg-gramado px-4 py-3">
      <Lock aria-hidden className="size-5 shrink-0 text-campo-escuro" />
      <p className="flex-1">
        <strong>Modo leitura.</strong>{" "}
        <span className="text-tinta-suave">
          Você está vendo o painel como visitante. Só a conta da organização pode lançar resultados.
        </span>
      </p>
      <Link
        to="/admin/entrar"
        className="font-semibold text-campo-escuro underline underline-offset-4"
      >
        Entrar
      </Link>
    </div>
  );
}
