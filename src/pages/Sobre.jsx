import React from "react";
import { Link } from "react-router-dom";
import "./Home.css";
import "./Sobre.css";
import Header from "../components/Header";

export default function Sobre() {
  return (
    <div className="sobre">
        <Header />
      {/* Hero */}
      <section className="sobre-hero">
        <div className="sobre-hero__content">
          <h1 className="sobre-hero__title">Semana da Juventude</h1>
          <p className="sobre-hero__subtitle">
            Um evento que celebra o esporte, a cultura e a união entre as turmas!
          </p>
          <div className="sobre-hero__actions">
            <Link to="/modalidades" className="btn btn--accent">Ver modalidades</Link>
          </div>
        </div>
      </section>

      {/* Seção 1: História e propósito */}
      <section className="sobre-section">
        <div className="section-header">
          <h2>🏫 História</h2>
        </div>
        <div className="sobre-text">
          <p>
            A Semana da Juventude é um dos eventos mais tradicionais da escola, reunindo
            turmas do Ensino Médio e dos cursos técnicos em uma semana repleta de
            competições esportivas, atividades culturais e integração entre os alunos.
          </p>
          <p>
            Criada com o objetivo de fortalecer o espírito de equipe, o respeito e a convivência
            saudável, ela se tornou um símbolo de união e celebração da juventude escolar.
          </p>
        </div>
      </section>

      {/* Seção 2: Categorias e modalidades */}
      <section className="sobre-section">
        <div className="section-header">
          <h2>⚽ Categorias e Modalidades</h2>
        </div>
        <p className="sobre-text center">A Semana da Juventude é dividida em três categorias:</p>
        <div className="cards-grid categorias-grid">
          <article className="card">
            <div className="card__header"><h3 className="card__title">Masculino</h3></div>
            <div className="card__body">
              <span className="badge badge--masc">Masculino</span>
              <p style={{ marginTop: 8 }}>15 turmas competindo em modalidades esportivas e culturais.</p>
            </div>
          </article>
          <article className="card">
            <div className="card__header"><h3 className="card__title">Feminino</h3></div>
            <div className="card__body">
              <span className="badge badge--fem">Feminino</span>
              <p style={{ marginTop: 8 }}>12 turmas unidas em uma disputa de talento e cooperação.</p>
            </div>
          </article>
          <article className="card">
            <div className="card__header"><h3 className="card__title">Misto</h3></div>
            <div className="card__body">
              <span className="badge badge--misto">Misto</span>
              <p style={{ marginTop: 8 }}>Modalidades que envolvem todos — esporte e cultura em conjunto.</p>
            </div>
          </article>
        </div>
        <div className="section-actions">
          <Link to="/modalidades" className="btn btn--ghost">Ver todas as modalidades</Link>
        </div>
      </section>

      {/* Seção 3: Sobre o sistema */}
      <section className="sobre-section">
        <div className="section-header">
          <h2>💻 O Sistema</h2>
        </div>
        <div className="sobre-text">
          <p>
            Este site foi desenvolvido para digitalizar e modernizar o acompanhamento da Semana da Juventude.
            Agora, alunos, professores e visitantes podem acompanhar <strong>placares em tempo real</strong>,
            rankings atualizados automaticamente e resultados de cada modalidade.
          </p>
          <p>
            O sistema foi desenvolvido pela <span style={{ color: 'var(--accent)', fontWeight: 600 }}>WeApp</span>,
            com o objetivo de unir tecnologia e espírito esportivo.
          </p>
        </div>
      </section>

      {/* Seção 4: Valores e mensagem final */}
      <section className="sobre-section">
        <div className="section-header">
          <h2>🌱 Nossos Valores</h2>
        </div>
        <p className="sobre-text">
          A Semana da Juventude é mais do que uma competição — é um <strong>encontro de talentos, amizades e superação</strong>.
        </p>
        <ul className="tags-list" style={{ justifyContent: 'center' }}>
          <li className="tag">União</li>
          <li className="tag">Respeito</li>
          <li className="tag">Esporte</li>
          <li className="tag">Cultura</li>
          <li className="tag">Inovação</li>
        </ul>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <p className="home-footer__quote">Desenvolvido por WeApp — 2025</p>
      </footer>
    </div>
  );
}
