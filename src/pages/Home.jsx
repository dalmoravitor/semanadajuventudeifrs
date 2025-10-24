// Home: mostra o Ranking Geral atual (Top 5) calculado a partir dos rankings das modalidades
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Home.css";
import Header from "../components/Header";
import Loader from "../components/Loader";
import Alert from "../components/Alert";
import { getModalidades } from "../api/modalidades";
import { calcularRankingGeralFromFirestore } from "../services/rankingGeralService";

export default function Home() {
	const [top5, setTop5] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		const fetchTop5 = async () => {
			setLoading(true);
			setError(null);
			try {
				const mods = await getModalidades();
				if (!mods.success) {
					setError(mods.error || "Erro ao carregar modalidades");
					setLoading(false);
					return;
				}
				const ranking = await calcularRankingGeralFromFirestore(mods.data || []);
				// ranking é por turmas (com distribuição). Pegar top 5
				const top = (ranking || []).slice(0, 5).map((t) => ({ equipe: t.turma, pontos: Math.round(t.totalPontos) }));
				setTop5(top);
			} catch (err) {
				console.error("Erro ao buscar ranking geral (Home):", err);
				setError("Erro ao conectar com o servidor");
			} finally {
				setLoading(false);
			}
		};
		fetchTop5();
	}, []);

	const resultadosRecentes = [
		{ modalidade: "Futsal", campeao: "Turma 11", pontos: 160 },
		{ modalidade: "Handebol", campeao: "Turma 31", pontos: 160 },
		{ modalidade: "Xadrez", campeao: "Turma 24", pontos: 160 },
		{ modalidade: "Culinária", campeao: "Turma 13", pontos: 160 },
	];

	const destaques = [
		{ nome: "Futsal", status: "Ao vivo" },
		{ nome: "Handebol", status: "Hoje" },
		{ nome: "Basquete", status: "Hoje" },
		{ nome: "Vôlei de Praia", status: "Ao vivo" },
	];


	const styles = {
  container: {
    color: "var(--text)",
    background: "linear-gradient(180deg, #0b1020 0%, #0f172a 100%)",
    padding: "40px 20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "24px",
  },
  title: {
    fontSize: "2em",
    fontWeight: "700",
    textAlign: "center",
    marginBottom: "12px",
    color: "var(--primary)",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "16px",
    width: "100%",
    maxWidth: "1100px",
  },
  card: {
    background: "var(--card)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "12px",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  cardHeader: {
    padding: "12px 16px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    fontWeight: "600",
    color: "var(--accent)",
  },
  turno: {
    padding: "10px 16px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(255,255,255,0.02)",
    color: "var(--text)",
  },
  atividade: {
    padding: "10px 16px",
    color: "var(--muted)",
    lineHeight: "1.5em",
  },
  strong: { color: "var(--text)", fontWeight: 600 },
  local: { color: "var(--accent)", fontSize: "0.9em" },
};

	const cronograma = [
  {
    dia: "Segunda-feira (25/09)",
    turnos: [
      {
        nome: "Manhã",
        atividades: [
          { nome: "Abertura + Chamada dos estudantes", local: "Campo de futebol", docente: "Lia Balestrin", colaboradores: "Marina, Maria Cláudia, Pablo, Juliano" },
          { nome: "Atletismo Feminino", local: "Campo de futebol", docente: "SEL", colaboradores: "Clever, Clóvis, Vânia, Rafael, Taís" },
          { nome: "Atletismo Masculino", local: "Campo de futebol", docente: "SEL", colaboradores: "Roberto V., Renata, Carla" },
        ],
      },
      {
        nome: "Tarde",
        atividades: [
          { nome: "Basquete Feminino", local: "Quadra de basquete", docente: "SEL", colaboradores: "Henrique, Manuela, Taís" },
          { nome: "Futsal Masculino", local: "Ginásio", docente: "SEL", colaboradores: "Pablo, Marcos, Marcos R." },
          { nome: "Culinária", local: "Refeitório", docente: "Angélica Mantelli", colaboradores: "Maria Tereza, Paulo" },
          { nome: "Práticas TMSI", local: "Sala de Hardware", docente: "Maria Helena", colaboradores: "-" },
        ],
      },
      {
        nome: "Noite",
        atividades: [
          { nome: "Gincana Técnico Cultural", local: "Ginásio", docente: "Roberto Sander", colaboradores: "Comissão Semana da Juventude, Gabriella" },
        ],
      },
    ],
  },
  {
    dia: "Terça-feira (26/09)",
    turnos: [
      {
        nome: "Manhã",
        atividades: [
          { nome: "Laço (F/M)", local: "Campo de futebol", docente: "Jorge Nunes Portela", colaboradores: "Augusto, Marina" },
          { nome: "Bocha", local: "Campo de futebol", docente: "Valdir Tamanho", colaboradores: "Clever, Heron" },
          { nome: "Escape Room", local: "Vestiário do ginásio", docente: "Leandro/Deise", colaboradores: "Maire, Juliana R." },
          { nome: "Jogo online - FIFA", local: "A102", docente: "Rodrigo Toniato e Raphael Mourão", colaboradores: "Maria Cláudia" },
          { nome: "Jogo online - Mortal Kombat", local: "A103", docente: "Rodrigo Toniato e Raphael Mourão", colaboradores: "Carlos" },
          { nome: "Jogo online - CS", local: "Lab de informática", docente: "Rodrigo Toniato", colaboradores: "Paulo K., Rubilar" },
        ],
      },
      {
        nome: "Tarde",
        atividades: [
          { nome: "Basquete Masculino", local: "Quadra de basquete", docente: "SEL", colaboradores: "Cheila, Renata, Maire, Manuela" },
          { nome: "Futsal Feminino", local: "Ginásio", docente: "SEL", colaboradores: "Rubilar, Gustavo M" },
          { nome: "Culinária", local: "Refeitório", docente: "Angélica Mantelli", colaboradores: "Maria Helena, Vanessa, Rosilene" },
          { nome: "Prática TMSI", local: "Sala de Hardware", docente: "Paulo Knob", colaboradores: "-" },
        ],
      },
      {
        nome: "Noite",
        atividades: [
          { nome: "Show de Talentos", local: "Auditório", docente: "Deise Caldart Roscioli", colaboradores: "Comissão Semana da Juventude" },
        ],
      },
    ],
  },
  {
    dia: "Quarta-feira (27/09)",
    turnos: [
      {
        nome: "Manhã",
        atividades: [
          { nome: "Escape Room", local: "Vestiário do ginásio", docente: "Leandro / Deise Caldart Roscioli", colaboradores: "Márcio, Rudimar, Gabriella" },
          { nome: "Soletrando", local: "Auditório", docente: "Maísa Helana Brum", colaboradores: "Vanessa, Marina, Juliana S." },
          { nome: "Sudoku", local: "A104", docente: "Leandro da Silva Friedrich e Thiago Muhlbeier", colaboradores: "Maria Medianeira, Sergiomar, Andreia" },
          { nome: "Jogo online - FIFA", local: "A102", docente: "Rodrigo Toniato e Raphael Mourão", colaboradores: "Vanderleia, Adriano" },
          { nome: "Jogo online - Mortal Kombat", local: "A103", docente: "Rodrigo Toniato e Raphael Mourão", colaboradores: "-" },
          { nome: "Jogo online - CS", local: "Lab de informática", docente: "Rodrigo Toniato", colaboradores: "Henrique, Roberto S." },
          { nome: "Práticas TMSI", local: "Sala de Hardware", docente: "Cheila", colaboradores: "-" },
        ],
      },
      {
        nome: "Tarde",
        atividades: [
          { nome: "Handebol Masculino", local: "Ginásio", docente: "SEL", colaboradores: "Vanderleia, Maria H., Juliano" },
          { nome: "Handebol Feminino", local: "Ginásio", docente: "SEL", colaboradores: "Marcos R., Mônica, Carlos" },
          { nome: "Culinária", local: "Refeitório", docente: "Angélica Mantelli", colaboradores: "Sergiomar, Rudimar, Lilian" },
        ],
      },
      {
        nome: "Noite",
        atividades: [
          { nome: "Jogos de mesa - Truco", local: "Coopera", docente: "Rodrigo Toniato, Ricardo e Raphael Mourão", colaboradores: "Comissão Semana da Juventude" },
          { nome: "Jogos de mesa - Bisca", local: "Coopera", docente: "Rodrigo Toniato, Ricardo e Raphael Mourão", colaboradores: "Comissão Semana da Juventude" },
          { nome: "Jogos de mesa - Xadrez", local: "Coopera", docente: "Rodrigo Toniato", colaboradores: "Comissão Semana da Juventude" },
        ],
      },
    ],
  },
  {
    dia: "Quinta-feira (28/09)",
    turnos: [
      {
        nome: "Manhã",
        atividades: [
          { nome: "Escape Room", local: "Vestiário do ginásio", docente: "Leandro / Deise / Raphael Mourão", colaboradores: "Marcionei, Marina, Renata" },
          { nome: "Gincana Recreativa", local: "Ginásio", docente: "Daniela Lippstein", colaboradores: "Maria Medianeira, Augusto, Mônica, Heron" },
          { nome: "Prática TMSI", local: "Sala de Hardware", docente: "Gabriel", colaboradores: "-" },
        ],
      },
      {
        nome: "Tarde",
        atividades: [
          { nome: "Vôlei Feminino", local: "Ginásio", docente: "SEL", colaboradores: "Heron, Paulo K., Roberto V., Henrique" },
          { nome: "Vôlei Masculino", local: "Ginásio", docente: "SEL", colaboradores: "Marcia S., David, Vanessa, Maire, Paulo, Eloi" },
        ],
      },
      {
        nome: "Noite",
        atividades: [
          { nome: "Confraternização", local: "Ginásio", docente: "Thiago Muhlbeier e Deise Caldart Roscioli", colaboradores: "Comissão Semana da Juventude" },
        ],
      },
    ],
  },
  {
    dia: "Sexta-feira (29/09)",
    turnos: [
      {
        nome: "Manhã",
        atividades: [
          { nome: "Cabo de Guerra", local: "Ginásio", docente: "SEL", colaboradores: "Márcia S., Sergiomar, Maria M., Rafael, Raquel D." },
        ],
      },
    ],
  },
];

	return (
		<div className="home">
			{/* Header simples da Home (apenas front) */}
			<Header />

			{/* Hero */}
			<section className="home-hero">
				<div className="home-hero__content">
					<h1 className="home-hero__title">XXIX Semana da Juventude 2025</h1>
					<p className="home-hero__subtitle">Esporte, cultura e união. Dê o seu melhor e inspire sua turma!</p>
					
				</div>
			</section>

			{/* Ranking Geral com abas */}
			<section className="home-ranking" aria-labelledby="ranking-title">
				<div className="section-header">
					<h2 id="ranking-title">Ranking Geral</h2>
				</div>

				{loading ? (
					<div style={{ display: "flex", justifyContent: "center", padding: "20px" }}>
						<Loader />
					</div>
				) : error ? (
					<div style={{ padding: "20px" }}>
						<Alert type="error" message={error} />
					</div>
				) : (
					<div className="table-wrapper">
						<table className="home-table">
							<thead>
								<tr>
									<th>#</th>
									<th>Turma</th>
									<th>Pontos</th>
								</tr>
							</thead>
							<tbody>
								{top5.map((row, idx) => (
									<tr key={`geral-${row.equipe}`}>
										<td>{idx + 1}</td>
										<td>{row.equipe}</td>
										<td>{row.pontos}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}

				<div className="section-actions">
					<Link to="/ranking" className="btn btn--ghost">Ver ranking completo</Link>
				</div>
			</section>

			{/* Últimos Resultados */}
			<section className="home-ultimos" aria-labelledby="ultimos-title">
				<div className="section-header">
					<h2 id="ultimos-title">Últimos Resultados</h2>
				</div>
				<div className="cards-grid">
					{resultadosRecentes.map((r) => (
						<article className="card" key={`res-${r.modalidade}`}>
							<div className="card__header">
								<h3 className="card__title">{r.modalidade}</h3>
							</div>
							<div className="card__body">
								<p><strong>Campeão:</strong> {r.campeao}</p>
								<p><strong>Pontuação:</strong> {r.pontos}</p>
							</div>
						</article>
					))}
				</div>
				<div className="section-actions">
					<Link to="/modalidades" className="btn btn--ghost">Ver todas as modalidades</Link>
				</div>
			</section>

			{/* Modalidades em Destaque / Em Andamento */}
			<section className="home-destaques" aria-labelledby="destaques-title">
				<div style={styles.container}>
      <h2 style={styles.title}>📅 Cronograma da Semana da Juventude</h2>
      <div style={styles.grid}>
        {cronograma.map((dia, i) => (
          <div key={i} style={styles.card}>
            <div style={styles.cardHeader}>{dia.dia}</div>
            {dia.turnos.map((turno, t) => (
              <div key={t}>
                <div style={styles.turno}>🌞 {turno.nome}</div>
                {turno.atividades.map((a, j) => (
                  <div key={j} style={styles.atividade}>
                    <div style={styles.strong}>{a.nome}</div>
                    <div style={styles.local}>{a.local}</div>
                    <div><span style={styles.strong}>Docente: </span>{a.docente}</div>
                    <div><span style={styles.strong}>Colaboradores: </span>{a.colaboradores}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
			</section>

			{/* Créditos / frase */}
			<footer className="home-footer">
				<p className="home-footer__quote">“O espírito de equipe transforma esforço em vitória.”</p>
				<nav className="home-footer__links" aria-label="Links úteis">
					<button type="button" className="linklike" aria-label="Regulamento">Regulamento</button>
					<button type="button" className="linklike" aria-label="Cronograma">Cronograma</button>
					<button type="button" className="linklike" aria-label="Contato">Contato</button>
				</nav>
			</footer>
		</div>
	);
}

