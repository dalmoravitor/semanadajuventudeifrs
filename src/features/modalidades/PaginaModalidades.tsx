import { Search } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";
import { Link } from "react-router";
import type { Edicao } from "@/app/contextos";
import { pontuacaoDaModalidade, temVencedor } from "@/domain/ranking";
import type { Categoria } from "@/domain/tipos";
import { categoriaEmTexto, sistemaEmTexto } from "@/domain/textos";
import { ComEdicao } from "@/ui/ComEdicao";
import { Vazio } from "@/ui/Estados";
import { Filtros, type OpcaoDeFiltro } from "@/ui/Filtros";
import { IconeModalidade } from "@/ui/IconeModalidade";
import { CabecalhoDaPagina } from "@/ui/Pagina";

type FiltroCategoria = Categoria | "todas";

const CATEGORIAS: OpcaoDeFiltro<FiltroCategoria>[] = [
  { valor: "todas", rotulo: "Todas" },
  { valor: "feminino", rotulo: "Feminino" },
  { valor: "masculino", rotulo: "Masculino" },
  { valor: "misto", rotulo: "Misto" },
];

/** Busca sem diferenciar acentos e maiúsculas: "volei" encontra "Vôlei de Praia". */
function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

export function PaginaModalidades() {
  return (
    <>
      <CabecalhoDaPagina titulo="Modalidades" tituloDaAba="Modalidades">
        Esportes, jogos e provas culturais da edição, com a turma que ficou em primeiro em cada uma.
      </CabecalhoDaPagina>
      <ComEdicao>{(edicao) => <ListaModalidades edicao={edicao} />}</ComEdicao>
    </>
  );
}

function ListaModalidades({ edicao }: { edicao: Edicao }) {
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState<FiltroCategoria>("todas");
  const buscaAdiada = useDeferredValue(busca);

  const itens = useMemo(
    () =>
      edicao.modalidades.map((modalidade) => {
        const { linhas } = pontuacaoDaModalidade(
          edicao.rankings.get(modalidade.id) ?? [],
          edicao.equipes,
        );
        const primeiras = temVencedor(linhas) ? linhas.filter((l) => l.colocacao === 1) : [];
        return { modalidade, primeiras, lancada: linhas.length > 0 };
      }),
    [edicao],
  );

  const termo = normalizar(buscaAdiada.trim());
  const visiveis = itens.filter(
    ({ modalidade }) =>
      (categoria === "todas" || modalidade.categoria === categoria) &&
      (termo === "" || normalizar(modalidade.nome).includes(termo)),
  );

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative block w-full sm:max-w-xs">
          <span className="sr-only">Buscar modalidade</span>
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-tinta-suave"
          />
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar modalidade"
            className="min-h-11 w-full rounded-md border border-cal bg-papel pr-3 pl-9 placeholder:text-tinta-suave focus:border-campo-escuro"
          />
        </label>
        <Filtros
          rotulo="Filtrar por categoria"
          opcoes={CATEGORIAS}
          valor={categoria}
          aoMudar={setCategoria}
        />
      </div>

      <p className="mt-6 text-sm text-tinta-suave" aria-live="polite">
        {visiveis.length === itens.length
          ? `${itens.length} modalidades`
          : `${visiveis.length} de ${itens.length} modalidades`}
      </p>

      {visiveis.length === 0 ? (
        <Vazio titulo={`Nenhuma modalidade encontrada para "${busca}".`}>
          Confira a grafia ou limpe os filtros.
        </Vazio>
      ) : (
        <ul className="mt-2 divide-y divide-cal border-y border-cal">
          {visiveis.map(({ modalidade, primeiras, lancada }) => (
            <li key={modalidade.id}>
              <Link
                to={`/modalidades/${modalidade.id}`}
                className="grid grid-cols-[2.25rem_1fr] items-center gap-x-3 py-3.5 hover:bg-gramado/60 sm:grid-cols-[2.5rem_1fr_14rem] sm:gap-x-4"
              >
                <span className="flex size-9 items-center justify-center rounded-full bg-gramado text-campo-escuro">
                  <IconeModalidade id={modalidade.id} />
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold">
                    {modalidade.nome}{" "}
                    <span className="font-normal text-tinta-suave">
                      {categoriaEmTexto(modalidade.categoria)}
                    </span>
                  </span>
                  <span className="block text-sm text-tinta-suave">
                    {sistemaEmTexto(modalidade.sistema)}
                  </span>
                </span>
                <span className="col-start-2 mt-1 text-sm sm:col-start-3 sm:mt-0 sm:text-right">
                  {primeiras.length > 0 ? (
                    <>
                      <span
                        aria-hidden
                        className="mr-1.5 inline-block size-2.5 rounded-full bg-campea"
                      />
                      <span className="text-tinta-suave">Primeiro lugar: </span>
                      <span className="font-semibold">
                        {primeiras.map((l) => l.equipeNome).join(", ")}
                      </span>
                    </>
                  ) : (
                    <span className="text-tinta-suave">
                      {lancada ? "Mesma pontuação para todas" : "Sem resultado lançado"}
                    </span>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
