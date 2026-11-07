import { ExternalLink } from "lucide-react";
import { EDICAO } from "@/content/edicao";
import { CabecalhoDaPagina, Secao } from "@/ui/Pagina";

const TECNOLOGIAS = [
  ["React 19 e TypeScript", "interface com tipos verificados em todo o código"],
  ["Vite", "build e servidor de desenvolvimento"],
  ["Tailwind CSS", "estilos a partir dos tokens da marca IF"],
  ["Firebase", "Firestore com atualização em tempo real, login e hospedagem"],
  ["Zod", "validação dos documentos que chegam do banco"],
  ["Vitest e Testing Library", "testes do cálculo do ranking e das telas"],
] as const;

export function PaginaSobre() {
  return (
    <>
      <CabecalhoDaPagina titulo="Sobre" tituloDaAba="Sobre">
        O evento, o site e como ele foi feito.
      </CabecalhoDaPagina>

      <div className="medida space-y-4 text-lg">
        <p>
          A {EDICAO.nome} é um evento anual do {EDICAO.campus} que reúne as turmas do ensino médio
          integrado em competições esportivas, jogos e atividades culturais. A edição de{" "}
          {EDICAO.ano}, a {EDICAO.numeral}, aconteceu de {EDICAO.periodo} e envolveu cerca de 400
          alunos e 80 servidores.
        </p>
        <p>
          Antes, sorteios, chaves e resultados eram controlados à mão, em papel e planilhas. Em
          2025, este site passou a mostrar a pontuação das turmas durante a semana, alimentado pela
          organização a cada modalidade encerrada.
        </p>
      </div>

      <Secao titulo="Esta versão" id="versao">
        <div className="medida space-y-4 text-tinta-suave">
          <p>
            Depois do evento, o site foi reconstruído como projeto de portfólio. A interface foi
            refeita com a identidade visual do IFRS, pensada primeiro para o celular. O código
            passou a ser organizado em camadas, e um teste confere que o ranking calculado é o mesmo
            exibido durante o evento.
          </p>
          <p>
            Os dados são os mesmos que a organização lançou na semana, lidos do Firebase. Nenhum
            resultado foi alterado.
          </p>
        </div>
        <ul className="mt-6 grid max-w-3xl gap-x-8 gap-y-3 sm:grid-cols-2">
          {TECNOLOGIAS.map(([nome, papel]) => (
            <li key={nome} className="border-t border-cal pt-2">
              <span className="font-semibold">{nome}</span>
              <span className="block text-sm text-tinta-suave">{papel}</span>
            </li>
          ))}
        </ul>
        <p className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
          <a
            href={EDICAO.repositorio}
            className="inline-flex items-center gap-1.5 font-semibold text-campo-escuro underline underline-offset-4"
            rel="noreferrer"
          >
            Código-fonte no GitHub
            <ExternalLink aria-hidden className="size-4" />
          </a>
          <a
            href={`${EDICAO.repositorio}/tree/v2025-original`}
            className="inline-flex items-center gap-1.5 font-semibold text-campo-escuro underline underline-offset-4"
            rel="noreferrer"
          >
            Versão usada no evento
            <ExternalLink aria-hidden className="size-4" />
          </a>
        </p>
      </Secao>

      <Secao titulo="Créditos" id="creditos">
        <dl className="grid max-w-2xl gap-x-6 gap-y-2 sm:grid-cols-[12rem_1fr]">
          <dt className="font-semibold">Desenvolvimento</dt>
          <dd className="text-tinta-suave">Vitor Dal Mora</dd>
          <dt className="font-semibold">Organização do evento</dt>
          <dd className="text-tinta-suave">Setor de Esporte e Lazer (SEL) do {EDICAO.campus}</dd>
        </dl>
        <p className="mt-6 medida text-sm text-tinta-suave">
          Projeto acadêmico, sem vínculo oficial com a comunicação do IFRS. Cores e tipografia
          seguem o Manual de Aplicação da Marca dos Institutos Federais.
        </p>
      </Secao>
    </>
  );
}
