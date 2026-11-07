import { useEffect, useState, type ReactNode } from "react";
import { observarUsuario } from "@/data/autenticacao";
import { ContextoUsuario, type EstadoUsuario } from "./contextos";

export function UsuarioProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<EstadoUsuario>({ carregando: true, usuario: null });
  useEffect(() => observarUsuario((usuario) => setEstado({ carregando: false, usuario })), []);
  return <ContextoUsuario value={estado}>{children}</ContextoUsuario>;
}
