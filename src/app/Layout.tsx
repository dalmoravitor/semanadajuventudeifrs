import { Outlet, ScrollRestoration } from "react-router";
import { Cabecalho } from "@/ui/Cabecalho";
import { Rodape } from "@/ui/Rodape";

export function Layout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-10 focus:rounded focus:bg-campo-escuro focus:px-3 focus:py-2 focus:text-papel"
      >
        Pular para o conteúdo
      </a>
      <Cabecalho />
      <main id="conteudo" className="mx-auto w-full max-w-6xl flex-1 px-4 sm:px-6">
        <Outlet />
      </main>
      <Rodape />
      <ScrollRestoration />
    </div>
  );
}
