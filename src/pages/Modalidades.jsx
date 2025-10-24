import React, { useState, useMemo, useEffect } from "react";
import CardModalidade from "../components/CardModalidade";
import "./Home.css"; // Reutiliza variáveis e componentes visuais (cards, botões, etc.)
import "./Modalidades.css";
import Header from "../components/Header";
import Loader from "../components/Loader";
import Alert from "../components/Alert";
import { getModalidades } from "../api/modalidades";

export default function Modalidades() {
  const [filtroCategoria, setFiltroCategoria] = useState("todas");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [modalidades, setModalidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Buscar modalidades do Firestore
  useEffect(() => {
    const fetchModalidades = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const result = await getModalidades();
        
        if (result.success) {
          setModalidades(result.data);
        } else {
          setError(result.error || "Erro ao carregar modalidades");
        }
      } catch (err) {
        console.error("Erro ao buscar modalidades:", err);
        setError("Erro ao conectar com o servidor");
      } finally {
        setLoading(false);
      }
    };

    fetchModalidades();
  }, []);

  // Extrai os tipos únicos para o filtro
  const tiposDisponiveis = useMemo(() => {
    const tipos = new Set();
    modalidades.forEach(mod => {
      if (mod.tipo.includes("coletiva")) {
        tipos.add("coletiva");
      } else if (mod.tipo === "individual") {
        tipos.add("individual");
      }
    });
    return Array.from(tipos).sort();
  }, [modalidades]);

  const modalidadesFiltradas = useMemo(() => {
    return modalidades.filter((m) => {
      const categoriaMatch = filtroCategoria === "todas" || m.categoria === filtroCategoria;
      
      let tipoMatch = true;
      if (filtroTipo !== "todos") {
        if (filtroTipo === "coletiva") {
          tipoMatch = m.tipo.includes("coletiva");
        } else {
          tipoMatch = m.tipo === filtroTipo;
        }
      }
      
      return categoriaMatch && tipoMatch;
    });
  }, [modalidades, filtroCategoria, filtroTipo]);

  // Loading state
  if (loading) {
    return (
      <section className="modalidades">
        <Header />
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
          <Loader />
        </div>
      </section>
    );
  }

  // Error state
  if (error) {
    return (
      <section className="modalidades">
        <Header />
        <div style={{ padding: "40px 20px", maxWidth: "800px", margin: "0 auto" }}>
          <Alert type="error" message={error} />
          <button 
            onClick={() => window.location.reload()} 
            className="btn btn--primary"
            style={{ marginTop: "20px" }}
          >
            Tentar Novamente
          </button>
        </div>
      </section>
    );
  }

  // Empty state
  if (modalidades.length === 0) {
    return (
      <section className="modalidades">
        <Header />
        <div style={{ padding: "40px 20px", maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "16px" }}>📋 Nenhuma modalidade cadastrada</h2>
          <p style={{ color: "var(--muted)" }}>
            As modalidades ainda não foram migradas para o sistema. Entre em contato com o administrador.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="modalidades">
      <Header />
      <div className="modalidades__header">
        <h1>🏅 Modalidades</h1>
        <p style={{ color: "var(--muted)", marginTop: 8, marginBottom: 16 }}>
          {modalidades.length} modalidades • {modalidadesFiltradas.length} exibidas
        </p>
        <div className="modalidades__filtros">
          <div>
            <label htmlFor="filtro-categoria" className="sr-only">Categoria</label>
            <select
              id="filtro-categoria"
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="select"
            >
              <option value="todas">Todas as categorias</option>
              <option value="masculino">Masculino</option>
              <option value="feminino">Feminino</option>
              <option value="misto">Misto</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="filtro-tipo" className="sr-only">Tipo</label>
            <select
              id="filtro-tipo"
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="select"
            >
              <option value="todos">Todos os tipos</option>
              <option value="coletiva">Coletiva</option>
              <option value="individual">Individual</option>
            </select>
          </div>
        </div>
      </div>

      {modalidadesFiltradas.length === 0 ? (
        <div style={{ padding: "40px 20px", textAlign: "center" }}>
          <p style={{ color: "var(--muted)", fontSize: "1.125rem" }}>
            Nenhuma modalidade encontrada com os filtros selecionados.
          </p>
        </div>
      ) : (
        <div className="cards-grid">
          {modalidadesFiltradas.map((mod) => (
            <CardModalidade key={mod.id} modalidade={mod} />
          ))}
        </div>
      )}
    </section>
  );
}
