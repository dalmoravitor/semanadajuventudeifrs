import { createBrowserRouter, Navigate } from "react-router";
import { PaginaCronograma } from "@/features/cronograma/PaginaCronograma";
import { PaginaInicio } from "@/features/inicio/PaginaInicio";
import { PaginaModalidade } from "@/features/modalidade/PaginaModalidade";
import { PaginaModalidades } from "@/features/modalidades/PaginaModalidades";
import { PaginaNaoEncontrada } from "@/features/nao-encontrada/PaginaNaoEncontrada";
import { PaginaRanking } from "@/features/ranking/PaginaRanking";
import { PaginaSobre } from "@/features/sobre/PaginaSobre";
import { PaginaTurma } from "@/features/turma/PaginaTurma";
import { Layout } from "./Layout";
import { RedirecionarModalidadeAntiga } from "./RedirecionarModalidadeAntiga";

export const roteador = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: <PaginaInicio /> },
      { path: "ranking", element: <PaginaRanking /> },
      { path: "modalidades", element: <PaginaModalidades /> },
      { path: "modalidades/:id", element: <PaginaModalidade /> },
      { path: "modalidade/:id", element: <RedirecionarModalidadeAntiga /> },
      { path: "turmas/:codigo", element: <PaginaTurma /> },
      { path: "cronograma", element: <PaginaCronograma /> },
      { path: "sobre", element: <PaginaSobre /> },
      { path: "login", element: <Navigate to="/admin/entrar" replace /> },
      // A área da organização (e o Firebase Authentication) é carregada sob demanda:
      // o público não baixa esse código.
      {
        path: "admin",
        lazy: async () => ({ Component: (await import("@/features/admin/AreaAdmin")).AreaAdmin }),
        children: [
          {
            index: true,
            lazy: async () => ({
              Component: (await import("@/features/admin/PaginaPainel")).PaginaPainel,
            }),
          },
          {
            path: "entrar",
            lazy: async () => ({
              Component: (await import("@/features/admin/PaginaEntrar")).PaginaEntrar,
            }),
          },
          {
            path: "modalidades/:id",
            lazy: async () => ({
              Component: (await import("@/features/admin/PaginaEditarPontuacao"))
                .PaginaEditarPontuacao,
            }),
          },
        ],
      },
      { path: "*", element: <PaginaNaoEncontrada /> },
    ],
  },
]);
