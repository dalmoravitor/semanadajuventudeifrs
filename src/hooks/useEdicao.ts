import { use } from "react";
import { ContextoEdicao, type EstadoEdicao } from "@/app/contextos";

export function useEdicao(): EstadoEdicao {
  const estado = use(ContextoEdicao);
  if (!estado) throw new Error("useEdicao precisa estar dentro de <EdicaoProvider>.");
  return estado;
}
