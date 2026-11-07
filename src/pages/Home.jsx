// Home: mostra o Ranking Geral atual (Top 5) + cronograma simples
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
        const top = (ranking || [])
          .slice(0, 5)
          .map((t) => ({ equipe: t.turma, pontos: Math.round(t.totalPontos) }));
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
	    dia: "Segunda-feira (03/11)",
	    turnos: [
	      {
	        nome: "Manhã (8h10 às 12h)",
	        atividades: [
	          { nome: "Abertura", local: "Ginásio" },
			  { nome: "Atletismo Masculino e Feminino", local: "Pista/Campo" },
			  { nome: "Tiro de Laço", local: "Campo" },
	        ],
	      },
	      {
	        nome: "Tarde (13h10 às 18h30)",
	        atividades: [
	          { nome: "Culinária", local: "Refeitório" },
	          { nome: "Futsal Masculino", local: "Ginásio" },
	          { nome: "Basquete Feminino", local: "Quadra" },
	        ],
	      },
	      {
	        nome: "Noite (19h às 22h)",
	        atividades: [
	          { nome: "Show de talentos", local: "Auditório" },
	        ],
	      },
	    ],
	  },
	  {
	    dia: "Terça-feira (04/11)",
	    turnos: [
	      {
	        nome: "Manhã (8h10 às 12h)",
					atividades: [
						{ nome: "Xadrez" },
						{ nome: "Vôlei de praia (Misto)" },
						{ nome: "Gincana Recreativa" },
					],
	      },
	      {
	        nome: "Tarde (13h10 às 18h30)",
	        atividades: [
	          { nome: "Culinária", local: "Refeitório" },
	          { nome: "Futsal Feminino", local: "Ginásio" },
	          { nome: "Basquete Masculino", local: "Quadra" },
	        ],
	      },
	      {
	        nome: "Noite (19h às 22h)",
	        atividades: [
	          { nome: "Show de talentos", local: "Auditório" },
	        ],
	      },
	    ],
	  },
	  {
	    dia: "Quarta-feira (05/11)",
	    turnos: [
	      {
	        nome: "Manhã (8h10 às 12h)",
	        atividades: [
			  { nome: "Soletrando" },
			  { nome: "Gincana Cultural (kahoot) 10h" },
			  { nome: "Jogos online: Fifa, Morta Kombat e CS" },
			  { nome: "Bisca" },
	        ],
	      },
	      {
	        nome: "Tarde (13h10 às 18h30)",
	        atividades: [
	          { nome: "Handbal Masculino e Feminino", local: "Ginásio" },
	        ],
	      },
	    ],
	  },
	  {
	    dia: "Quinta-feira (06/11)",
	    turnos: [
	      {
	        nome: "Manhã (8h10 às 12h)",
	        atividades: [
			  { nome: "Sudoku" },
			  { nome: "Bocha campeira" },
			  { nome: "Jogos online: Fifa, Morta Kombat e CS" },
			  { nome: "Truco" },
	        ],
	      },
	      {
	        nome: "Tarde (13h10 às 18h30)",
	        atividades: [
	          { nome: "Vôlei Masculino e Feminino", local: "Ginásio" },
	        ],
	      },
	    ],
	  },
	  {
	    dia: "Sexta-feira (07/11)",
	    turnos: [
	      {
	        nome: "Manhã (8h10 às 12h)",
	        atividades: [
	          { nome: "cabo de guerra", local: "Ginásio/Campo" },
	          { nome: "Encerramento", local: "Ginásio" },
	        ],
	      },
	    ],
	  },
	];

	return (
		<div className="home">
			{/* Header e Hero */}
			<Header />

			<section className="home-hero">
				<div className="home-hero__content">
					<h1 className="home-hero__title">XXIX Semana da Juventude 2025</h1>
					<p className="home-hero__subtitle">Esporte, cultura e união. Dê o seu melhor e inspire sua turma!</p>
				</div>
			</section>

			{/* Ranking Geral com Top 5 */}
			<section className="home-ranking" aria-labelledby="ranking-title">
				<div className="section-header">
					<h2 id="ranking-title">Ranking Geral</h2>
				</div>

				{/* Banner informativo */}
				<div style={{
					margin: "8px 0 16px",
					padding: "10px 14px",
					borderRadius: 8,
					background: "#fff7ed",
					border: "1px solid #fed7aa",
					color: "#7c2d12",
					fontWeight: 600,
				}}>
					As pontuações ainda estão sendo processadas...
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

			{/* Cronograma simples */}
			<section className="home-destaques" aria-labelledby="destaques-title">
				<div style={styles.container}>
      <div style={styles.grid}>
        {cronograma.map((dia, i) => (
          <div key={i} style={styles.card}>
            <div style={styles.cardHeader}>{dia.dia}</div>
						{dia.turnos.map((turno, t) => (
              <div key={t}>
								<div style={styles.turno}>{turno.nome}</div>
                {turno.atividades.map((a, j) => (
                  <div key={j} style={styles.atividade}>
										<div style={styles.strong}>{a.nome}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
			</section>
		</div>
	);
}

