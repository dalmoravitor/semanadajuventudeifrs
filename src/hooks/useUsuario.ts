import { use } from "react";
import { ContextoUsuario, type EstadoUsuario } from "@/app/contextos";

export function useUsuario(): EstadoUsuario {
  const estado = use(ContextoUsuario);
  if (!estado) throw new Error("useUsuario precisa estar dentro de <UsuarioProvider>.");
  return estado;
}
