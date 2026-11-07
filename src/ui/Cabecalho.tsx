import clsx from "clsx";
import { Link, NavLink } from "react-router";
import { EDICAO } from "@/content/edicao";

const LINKS = [
  { para: "/", rotulo: "Início" },
  { para: "/ranking", rotulo: "Ranking" },
  { para: "/modalidades", rotulo: "Modalidades" },
  { para: "/cronograma", rotulo: "Cronograma" },
  { para: "/sobre", rotulo: "Sobre" },
] as const;

function LinksDeNavegacao({ className, semInicio }: { className?: string; semInicio?: boolean }) {
  const links = semInicio ? LINKS.filter(({ para }) => para !== "/") : LINKS;
  return (
    <ul className={className}>
      {links.map(({ para, rotulo }) => (
        <li key={para}>
          <NavLink
            to={para}
            end={para === "/"}
            className={({ isActive }) =>
              clsx(
                "inline-flex min-h-11 items-center border-b-[3px] px-1 font-semibold whitespace-nowrap transition-colors",
                isActive
                  ? "border-campo text-tinta"
                  : "border-transparent text-tinta-suave hover:text-tinta",
              )
            }
          >
            {rotulo}
          </NavLink>
        </li>
      ))}
    </ul>
  );
}

export function Cabecalho() {
  return (
    <header className="border-b border-cal bg-papel">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
        <Link to="/" className="flex flex-col py-3 leading-none">
          <span className="text-[1.6rem] placar">{EDICAO.nome}</span>
          <span className="mt-1 text-xs font-semibold text-tinta-suave">
            {EDICAO.numeral} edição, {EDICAO.campus}
          </span>
        </Link>
        <nav aria-label="Principal" className="hidden md:block">
          <LinksDeNavegacao className="flex gap-5" />
        </nav>
      </div>
      {/* No celular, o nome do evento já leva ao início; os quatro links cabem lado a lado. */}
      <nav aria-label="Principal (celular)" className="border-t border-cal md:hidden">
        <LinksDeNavegacao semInicio className="flex justify-between px-4 text-[0.95rem]" />
      </nav>
    </header>
  );
}
