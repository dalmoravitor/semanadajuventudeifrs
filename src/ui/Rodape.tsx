import { Link } from "react-router";
import { EDICAO } from "@/content/edicao";

export function Rodape() {
  return (
    <footer className="mt-20 border-t border-cal bg-gramado">
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-10 text-sm text-tinta-suave sm:grid-cols-[2fr_1fr] sm:px-6">
        <p className="medida">
          Projeto acadêmico desenvolvido no {EDICAO.campus} com os dados da {EDICAO.numeral}{" "}
          {EDICAO.nome} ({EDICAO.ano}). Não é um canal oficial do IFRS.
        </p>
        <ul className="space-y-2 sm:text-right">
          <li>
            <Link to="/sobre" className="underline underline-offset-4 hover:text-tinta">
              Sobre o projeto
            </Link>
          </li>
          <li>
            <a
              href={EDICAO.repositorio}
              className="underline underline-offset-4 hover:text-tinta"
              rel="noreferrer"
            >
              Código no GitHub
            </a>
          </li>
          <li>
            <Link to="/admin" className="underline underline-offset-4 hover:text-tinta">
              Área da organização
            </Link>
          </li>
        </ul>
      </div>
    </footer>
  );
}
