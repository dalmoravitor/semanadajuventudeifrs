import clsx from "clsx";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link, type LinkProps } from "react-router";

type Variante = "primario" | "secundario" | "discreto";

const estilos: Record<Variante, string> = {
  primario:
    "bg-campo-escuro text-papel hover:bg-campo-noite disabled:bg-cal disabled:text-tinta-suave",
  secundario:
    "border border-cal bg-papel text-tinta hover:border-campo-escuro disabled:text-tinta-suave",
  discreto: "text-campo-escuro hover:bg-gramado disabled:text-tinta-suave",
};

const base =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 text-[0.95rem] font-semibold transition-colors disabled:cursor-not-allowed";

export function Botao({
  variante = "primario",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante }) {
  return <button type="button" className={clsx(base, estilos[variante], className)} {...props} />;
}

export function BotaoLink({
  variante = "primario",
  className,
  children,
  ...props
}: LinkProps & { variante?: Variante; children: ReactNode }) {
  return (
    <Link className={clsx(base, estilos[variante], className)} {...props}>
      {children}
    </Link>
  );
}
