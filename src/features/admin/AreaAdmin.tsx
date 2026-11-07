import { Outlet } from "react-router";
import { UsuarioProvider } from "@/app/UsuarioProvider";

/** Rota-mãe da área da organização: só aqui o Firebase Authentication é carregado. */
export function AreaAdmin() {
  return (
    <UsuarioProvider>
      <Outlet />
    </UsuarioProvider>
  );
}
