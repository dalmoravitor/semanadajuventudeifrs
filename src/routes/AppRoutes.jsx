import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import Modalidades from "../pages/Modalidades";
import ModalidadeDetalhe from "../pages/ModalidadeDetalhe";
import Ranking from "../pages/Ranking";
import Sobre from "../pages/Sobre";
import Login from "../pages/Login";
import Placar from "../pages/Placar";
import ProtectedRoute from "./ProtectedRoute";

import Dashboard from "../pages/admin/Dashboard";
import AdminModalidades from "../pages/admin/AdminModalidades";
import AdminModalidadeDetalhe from "../pages/admin/AdminModalidadeDetalhe";
import AdminEquipes from "../pages/admin/AdminEquipes";
import Configuracoes from "../pages/admin/Configuracoes";
import MigratePage from "../pages/admin/MigratePage";
import LimparDatabase from "../pages/admin/LimparDatabase";
import InicializarModalidades from "../pages/admin/InicializarModalidades";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Público */}
      <Route path="/" element={<Home />} />
      <Route path="/modalidades" element={<Modalidades />} />
      <Route path="/modalidade/:id" element={<ModalidadeDetalhe />} />
      <Route path="/ranking" element={<Ranking />} />
      <Route path="/sobre" element={<Sobre />} />
      <Route path="/placar" element={<Placar />} />
      <Route path="/login" element={<Login />} />

      {/* Admin (rotas aninhadas sob /admin) */}
      <Route path="/admin" element={<ProtectedRoute />}>
        <Route index element={<Dashboard />} />
        <Route path="modalidades" element={<AdminModalidades />} />
        <Route path="modalidade/:id" element={<AdminModalidadeDetalhe />} />
        <Route path="equipes" element={<AdminEquipes />} />
        <Route path="config" element={<Configuracoes />} />
        <Route path="migrate" element={<MigratePage />} />
        <Route path="limpar-database" element={<LimparDatabase />} />
        <Route path="inicializar-modalidades" element={<InicializarModalidades />} />
      </Route>
    </Routes>
  );
}