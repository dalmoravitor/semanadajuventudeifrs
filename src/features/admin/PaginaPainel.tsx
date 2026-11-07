import { LogOut } from "lucide-react";
import { Link } from "react-router";
import { sair } from "@/data/autenticacao";
import { categoriaEmTexto } from "@/domain/textos";
import { useUsuario } from "@/hooks/useUsuario";
import { Botao } from "@/ui/Botao";
import { ComEdicao } from "@/ui/ComEdicao";
import { CabecalhoDaPagina } from "@/ui/Pagina";
import { AvisoModoLeitura } from "./AvisoModoLeitura";

export function PaginaPainel() {
  const { usuario, carregando } = useUsuario();

  return (
    <>
      <CabecalhoDaPagina titulo="Área da organização" tituloDaAba="Área da organização">
        Pontuação final de cada modalidade, que alimenta o ranking geral em tempo real.
      </CabecalhoDaPagina>

      {!carregando &&
        (usuario ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-cal px-4 py-3">
            <p>
              Conectado como <strong>{usuario.email}</strong>
            </p>
            <Botao variante="secundario" onClick={() => void sair()}>
              <LogOut aria-hidden className="size-4" />
              Sair
            </Botao>
          </div>
        ) : (
          <AvisoModoLeitura />
        ))}

      <ComEdicao>
        {(edicao) => (
          <ul className="mt-8 divide-y divide-cal border-y border-cal">
            {edicao.modalidades.map((modalidade) => {
              const linhas = edicao.rankings.get(modalidade.id) ?? [];
              return (
                <li key={modalidade.id} className="flex items-center justify-between gap-4 py-3">
                  <span className="min-w-0">
                    <span className="block font-semibold">
                      {modalidade.nome}{" "}
                      <span className="font-normal text-tinta-suave">
                        {categoriaEmTexto(modalidade.categoria)}
                      </span>
                    </span>
                    <span className="block text-sm text-tinta-suave">
                      {linhas.length > 0 ? (
                        `${linhas.length} equipes lançadas`
                      ) : (
                        <span className="text-campea">Sem lançamento</span>
                      )}
                    </span>
                  </span>
                  <Link
                    to={`/admin/modalidades/${modalidade.id}`}
                    aria-label={`${usuario ? "Editar" : "Ver"} a pontuação de ${modalidade.nome} ${categoriaEmTexto(modalidade.categoria).toLowerCase()}`}
                    className="shrink-0 font-semibold text-campo-escuro underline underline-offset-4"
                  >
                    {usuario ? "Editar" : "Ver"}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </ComEdicao>
    </>
  );
}
