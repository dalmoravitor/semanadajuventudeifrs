import React from "react";
import { Link } from "react-router-dom";

export default function CardModalidade({ modalidade }) {
  const { id, nome, categoria, tipo, descricao, sistema } = modalidade;

  const badgeClass =
    categoria === "masculino" ? "badge badge--masc" :
    categoria === "feminino" ? "badge badge--fem" :
    "badge badge--misto";

  // Normaliza o tipo para exibição
  const tipoExibicao = tipo.includes("coletiva") ? "Coletiva" : 
                       tipo === "individual" ? "Individual" : 
                       tipo.charAt(0).toUpperCase() + tipo.slice(1);

  // Gera um ícone baseado no sistema
  const iconesSistema = {
    "chaves+eliminacao": "⚔️",
    "eliminacao-simples": "🎯",
    "pontuacao-fixa": "📊",
    "pontuacao-decadent": "📉",
    "tempo": "⏱️",
    "melhor-de-3": "🎲",
    "suíço": "♟️",
  };

  const icone = iconesSistema[sistema] || "🏆";

  return (
    <article className="card modalidade-card">
      <div className="card__header">
        <h3 className="card__title">
          <span style={{ marginRight: 8 }}>{icone}</span>
          {nome}
        </h3>
      </div>
      <div className="card__body">
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
          <span className={badgeClass}>{categoria}</span>
          <span className="badge" style={{ background: "var(--card)", border: "1px solid var(--muted)" }}>
            {tipoExibicao}
          </span>
        </div>
        {descricao && (
          <p style={{ margin: "8px 0 0", color: "var(--muted)", fontSize: 14, lineHeight: 1.5 }}>
            {descricao}
          </p>
        )}
        <p style={{ marginTop: 8, fontSize: 13, color: "var(--muted)" }}>
          Sistema: <strong style={{ color: "var(--text)" }}>{sistema}</strong>
        </p>
      </div>
      <div className="card__body" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <Link to={`/modalidade/${id}`} className="btn btn--ghost">Ver detalhes →</Link>
      </div>
    </article>
  );
}
