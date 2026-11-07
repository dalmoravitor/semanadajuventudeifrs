import type { ReactNode } from "react";
import type { Edicao } from "@/app/contextos";
import { useEdicao } from "@/hooks/useEdicao";
import { Carregando, MensagemErro } from "./Estados";

/** Mostra carregamento ou erro e só renderiza o conteúdo quando os dados da edição chegam. */
export function ComEdicao({ children }: { children: (edicao: Edicao) => ReactNode }) {
  const estado = useEdicao();
  if (estado.status === "carregando") return <Carregando />;
  if (estado.status === "erro") {
    return <MensagemErro erro={estado.erro} tentarDeNovo={estado.tentarDeNovo} />;
  }
  return children(estado.edicao);
}
