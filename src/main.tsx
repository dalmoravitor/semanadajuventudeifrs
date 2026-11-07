import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";
import { EdicaoProvider } from "@/app/EdicaoProvider";
import { roteador } from "@/app/rotas";
import "./estilos.css";

const raiz = document.getElementById("raiz");
if (!raiz) throw new Error("Elemento #raiz não encontrado em index.html.");

createRoot(raiz).render(
  <StrictMode>
    <EdicaoProvider>
      <RouterProvider router={roteador} />
    </EdicaoProvider>
  </StrictMode>,
);
