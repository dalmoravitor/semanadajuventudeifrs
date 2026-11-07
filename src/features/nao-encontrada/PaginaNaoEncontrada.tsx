import { BotaoLink } from "@/ui/Botao";
import { CabecalhoDaPagina } from "@/ui/Pagina";

export function ConteudoNaoEncontrado({
  titulo = "Página não encontrada",
  link = { para: "/", rotulo: "Voltar ao início" },
}: {
  titulo?: string;
  link?: { para: string; rotulo: string };
}) {
  return (
    <>
      <CabecalhoDaPagina titulo={titulo} tituloDaAba={titulo}>
        O endereço pode ter mudado. As páginas da edição 2025 continuam no ranking e na lista de
        modalidades.
      </CabecalhoDaPagina>
      <BotaoLink to={link.para}>{link.rotulo}</BotaoLink>
    </>
  );
}

export function PaginaNaoEncontrada() {
  return <ConteudoNaoEncontrado />;
}
