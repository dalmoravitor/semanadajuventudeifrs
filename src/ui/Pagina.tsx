import type { ReactNode } from "react";
import { EDICAO } from "@/content/edicao";

/** Cabeçalho padrão de página: título (também na aba do navegador) e um parágrafo de apoio. */
export function CabecalhoDaPagina({
  titulo,
  tituloDaAba,
  children,
  antes,
}: {
  titulo: ReactNode;
  tituloDaAba: string;
  children?: ReactNode;
  antes?: ReactNode;
}) {
  return (
    <header className="pt-8 pb-6 sm:pt-12">
      <title>{`${tituloDaAba} | ${EDICAO.nome} ${EDICAO.ano}`}</title>
      {antes}
      <h1 className="text-[2.6rem] placar sm:text-6xl">{titulo}</h1>
      {children && <div className="mt-3 medida text-lg text-tinta-suave">{children}</div>}
    </header>
  );
}

export function Secao({
  titulo,
  id,
  children,
  className,
}: {
  titulo: string;
  id: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section aria-labelledby={id} className={className ?? "mt-12"}>
      <h2 id={id} className="mb-4 text-2xl font-bold">
        {titulo}
      </h2>
      {children}
    </section>
  );
}
