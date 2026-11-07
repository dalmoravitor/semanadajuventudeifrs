import { Link } from "react-router";
import { CRONOGRAMA, type Atividade } from "@/content/cronograma";
import { categoriaEmTexto } from "@/domain/textos";
import { useEdicao } from "@/hooks/useEdicao";
import { CabecalhoDaPagina } from "@/ui/Pagina";

const dataPorExtenso = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

export function PaginaCronograma() {
  return (
    <>
      <CabecalhoDaPagina titulo="Cronograma" tituloDaAba="Cronograma">
        A programação dos cinco dias, como foi publicada para o evento.
      </CabecalhoDaPagina>
      <ol className="space-y-12">
        {CRONOGRAMA.map((dia) => (
          <li key={dia.data} className="grid gap-4 md:grid-cols-[13rem_1fr]">
            <h2 className="leading-none">
              <span className="block text-4xl placar">{dia.diaDaSemana}</span>
              <time dateTime={dia.data} className="mt-2 block text-tinta-suave">
                {dataPorExtenso.format(new Date(dia.data))}
              </time>
            </h2>
            <div className="divide-y divide-cal border-t-2 border-campo">
              {dia.turnos.map((turno) => (
                <section key={turno.nome} className="grid gap-2 py-4 sm:grid-cols-[9rem_1fr]">
                  <h3 className="font-bold">
                    {turno.nome}
                    <span className="block text-sm font-normal text-tinta-suave">
                      {turno.horario}
                    </span>
                  </h3>
                  <ul className="space-y-2">
                    {turno.atividades.map((atividade) => (
                      <ItemDaAgenda key={atividade.nome} atividade={atividade} />
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}

function ItemDaAgenda({ atividade }: { atividade: Atividade }) {
  const estado = useEdicao();
  const modalidades =
    estado.status === "pronto"
      ? (atividade.modalidades ?? []).flatMap((id) => {
          const modalidade = estado.edicao.modalidadePorId.get(id);
          return modalidade ? [modalidade] : [];
        })
      : [];

  return (
    <li>
      <span className="font-semibold">{atividade.nome}</span>
      {(atividade.local || atividade.horario) && (
        <span className="text-tinta-suave">
          {", "}
          {[atividade.horario, atividade.local].filter(Boolean).join(", ")}
        </span>
      )}
      {modalidades.length > 0 && (
        <span className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm">
          {modalidades.map((m) => (
            <Link
              key={m.id}
              to={`/modalidades/${m.id}`}
              className="text-campo-escuro underline decoration-cal underline-offset-4 hover:decoration-campo-escuro"
            >
              {modalidades.length > 1 && atividade.modalidades && atividade.modalidades.length > 1
                ? `${m.nome} ${categoriaEmTexto(m.categoria).toLowerCase()}`
                : "Ver resultado"}
            </Link>
          ))}
        </span>
      )}
    </li>
  );
}
