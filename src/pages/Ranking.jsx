import React, { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Home.css";
import "./Ranking.css";
import Header from "../components/Header";
import Loader from "../components/Loader";
import Alert from "../components/Alert";
import { getModalidades } from "../api/modalidades";
import { calcularRankingGeralFromFirestore } from "../services/rankingGeralService";
import { fetchRankingGeralEquipes } from "../services/rankingGeral";

export default function Ranking() {
	const [aba, setAba] = useState("geral");
	const [rankingGeral, setRankingGeral] = useState([]); // por turmas (com distribuição)
	const [rankingEquipes, setRankingEquipes] = useState([]); // por equipes (bruto)
	const [totalModalidades, setTotalModalidades] = useState(0);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [detalhesVisiveis, setDetalhesVisiveis] = useState({});

	// Buscar ranking geral do Firestore
	useEffect(() => {
			const fetchRanking = async () => {
			setLoading(true);
			setError(null);
			
			try {
				// Busca todas as modalidades
				const resultModalidades = await getModalidades();
				
						if (!resultModalidades.success) {
					setError(resultModalidades.error || "Erro ao carregar modalidades");
					return;
				}
						setTotalModalidades((resultModalidades.data || []).length);

				// Calcula o ranking geral considerando o mapeamento de equipes
				const ranking = await calcularRankingGeralFromFirestore(resultModalidades.data);
				setRankingGeral(ranking);

					// Calcula o ranking bruto por equipes
					const rankingBruto = await fetchRankingGeralEquipes();
					setRankingEquipes(rankingBruto);
				
			} catch (err) {
				console.error("Erro ao buscar ranking:", err);
				setError("Erro ao conectar com o servidor");
			} finally {
				setLoading(false);
			}
		};

		fetchRanking();
	}, []);

	// Organizar ranking (já está calculado pelo serviço)
		const rankingPorAba = useMemo(() => ({
			geral: rankingGeral,
			equipes: rankingEquipes,
		}), [rankingGeral, rankingEquipes]);

	// Toggle detalhes de uma turma
	const toggleDetalhes = (turmaId) => {
		setDetalhesVisiveis(prev => ({
			...prev,
			[turmaId]: !prev[turmaId]
		}));
	};

			const tabela = (lista) => {
		if (lista.length === 0) {
			return (
				<div style={{ padding: "40px 20px", textAlign: "center" }}>
					<p style={{ color: "var(--muted)", fontSize: "1.125rem" }}>
						Nenhuma turma encontrada nesta categoria.
					</p>
				</div>
			);
		}

				const maxPontos = Math.max(...lista.map((it) => (typeof it.totalPontos === 'number' ? it.totalPontos : 0)), 0);

				return (
			<div className="table-wrapper">
				<table className="home-table ranking-table">
					<thead>
						<tr>
								<th>Posição</th>
								{aba === 'equipes' ? (
									<>
										<th>Equipe</th>
										<th className="text-right">Pontuação</th>
										<th className="text-right">Modalidades</th>
										<th className="text-center">Detalhes</th>
									</>
								) : (
									<>
										<th>Turma</th>
										<th className="text-right">Pontuação</th>
										<th className="text-right">Equipes</th>
										<th className="text-center">Detalhes</th>
									</>
								)}
						</tr>
					</thead>
					<tbody>
							{lista.map((item, i) => (
								<React.Fragment key={aba === 'equipes' ? item.equipeId : item.turmaId}>
												<tr className={i === 0 ? "r1" : i === 1 ? "r2" : i === 2 ? "r3" : undefined}>
													<td className="pos">{aba === 'equipes' ? item.posicao : item.colocacao}º</td>
										<td>
										<div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
												{aba === 'equipes' ? (
													<div>
														<strong>{item.equipe}</strong>
													</div>
												) : (
													<>
														<div 
															style={{ 
																width: "12px", 
																height: "12px", 
																borderRadius: "50%", 
																backgroundColor: item.cor,
																flexShrink: 0
															}}
														/>
														<div>
															<strong>{item.turma}</strong>
															<br />
															<span style={{ fontSize: "0.875rem", color: "var(--muted)" }}>
																{item.serie}
															</span>
														</div>
													</>
												)}
										</div>
									</td>
									<td className="text-right">
															<strong style={{ fontSize: "1.25rem", color: "var(--primary)" }}>
																{typeof item.totalPontos === 'number' ? item.totalPontos : 0}
															</strong>
															<div className="points-bar">
																<div
																	className="points-bar__fill"
																	style={{ width: `${maxPontos > 0 ? Math.min(100, (100 * (item.totalPontos || 0)) / maxPontos) : 0}%` }}
																/>
															</div>
									</td>
										<td className="text-right" style={{ color: "var(--muted)", fontSize: "0.875rem" }}>
											{aba === 'equipes' 
												? (item.modalidades?.length || 0) + ' mod.'
												: `${item.numeroEquipesContribuintes} ${item.numeroEquipesContribuintes === 1 ? 'equipe' : 'equipes'}`}
										</td>
									<td className="text-center">
										<button
												onClick={() => toggleDetalhes(aba === 'equipes' ? item.equipeId : item.turmaId)}
											className="btn btn--sm"
											style={{ 
												padding: "4px 12px", 
												fontSize: "0.875rem",
																	background: detalhesVisiveis[aba === 'equipes' ? item.equipeId : item.turmaId] ? "var(--primary)" : "var(--card)",
																	color: detalhesVisiveis[aba === 'equipes' ? item.equipeId : item.turmaId] ? 'var(--text)' : 'var(--muted)'
											}}
										>
												{detalhesVisiveis[aba === 'equipes' ? item.equipeId : item.turmaId] ? '▲ Ocultar' : '▼ Ver'}
										</button>
									</td>
								</tr>
								
								{/* Linha de detalhes expandível */}
									{detalhesVisiveis[aba === 'equipes' ? item.equipeId : item.turmaId] && (
									<tr className="detalhes-row">
										<td colSpan="5" style={{ padding: "16px", background: "var(--background)", borderTop: "1px solid var(--border)" }}>
												{aba === 'equipes' ? (
													<div>
														<div style={{ marginBottom: "8px" }}>
															<strong>Contribuições por modalidade</strong>
														</div>
														<ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
															{item.modalidades?.map((m, idx) => (
																<li key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px dashed var(--border)' }}>
																	<span>• {m.modalidadeNome}</span>
																	<span style={{ fontWeight: 600 }}>{m.colocacao}º — {m.pontos} pts</span>
																</li>
															))}
														</ul>
													</div>
												) : (
													<div style={{ display: "grid", gap: "12px" }}>
														{Object.entries(
															item.modalidades.reduce((acc, modalidade) => {
																if (!acc[modalidade.equipeId]) {
																	acc[modalidade.equipeId] = {
																		equipeNome: modalidade.equipeNome,
																		modalidades: [],
																		totalPontos: 0
																	};
																}
																acc[modalidade.equipeId].modalidades.push(modalidade);
																acc[modalidade.equipeId].totalPontos += modalidade.pontos;
																return acc;
															}, {})
														).map(([equipeId, dados]) => (
															<div key={equipeId} style={{ 
																padding: "12px", 
																background: "var(--card)", 
																borderRadius: "8px",
																border: "1px solid var(--border)"
															}}>
																<div style={{ marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
																	<strong style={{ color: "var(--text)" }}>{dados.equipeNome}</strong>
																	<span style={{ 
																		background: "var(--primary)", 
																		color: "white", 
																		padding: "4px 12px", 
																		borderRadius: "12px",
																		fontSize: "0.875rem",
																		fontWeight: "bold"
																	}}>
																		{dados.totalPontos} pts
																	</span>
																</div>
																<div style={{ fontSize: "0.875rem", color: "var(--muted)" }}>
																	{dados.modalidades.length} {dados.modalidades.length === 1 ? 'modalidade' : 'modalidades'}:
																</div>
																<ul style={{ 
																	margin: "8px 0 0 0", 
																	padding: "0", 
																	listStyle: "none",
																	display: "grid",
																	gap: "4px"
																}}>
																	{dados.modalidades.map((mod, idx) => (
																		<li key={idx} style={{ 
																			fontSize: "0.875rem",
																			display: "flex",
																			justifyContent: "space-between",
																			padding: "4px 0"
																		}}>
																			<span>• {mod.modalidadeNome}</span>
																			<span style={{ fontWeight: "500" }}>
																				{mod.colocacao}º lugar ({mod.pontos} pts)
																			</span>
																		</li>
																	))}
																</ul>
															</div>
														))}
													</div>
												)}
										</td>
									</tr>
								)}
							</React.Fragment>
						))}
					</tbody>
				</table>
			</div>
		);
	};

	// Loading state
	if (loading) {
		return (
			<section className="ranking">
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
			<section className="ranking">
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
		if (rankingGeral.length === 0 && rankingEquipes.length === 0) {
		return (
			<section className="ranking">
				<Header />
				<div style={{ padding: "40px 20px", maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
					<h2 style={{ fontSize: "1.5rem", marginBottom: "16px" }}>🏆 Ranking não disponível</h2>
					<p style={{ color: "var(--muted)" }}>
						O ranking ainda não foi calculado. Aguarde os resultados das modalidades.
					</p>
					<Link to="/" className="btn btn--primary" style={{ marginTop: "20px" }}>
						Voltar para Home
					</Link>
				</div>
			</section>
		);
	}

	return (
		<section className="ranking">
			<Header />
				<div className="section-header ranking-hero">
					<div className="ranking-hero__head">
						<h1>🏆 Ranking Geral</h1>
						<p className="ranking-hero__subtitle">
							{aba === 'equipes' ? `${rankingEquipes.length} equipes no ranking` : `${rankingGeral.length} turmas no ranking`}
						</p>
						<div className="metrics">
							<div className="chip"><span className="chip__dot chip__dot--accent" /> Modalidades: <strong>{totalModalidades}</strong></div>
							<div className="chip"><span className="chip__dot chip__dot--primary" /> Turmas: <strong>{rankingGeral.length}</strong></div>
							<div className="chip"><span className="chip__dot chip__dot--neutral" /> Equipes: <strong>{rankingEquipes.length}</strong></div>
						</div>
					</div>
					{/* Podium */}
					{(() => {
						const atual = aba === 'equipes' ? rankingEquipes : rankingGeral;
						if (!atual || atual.length === 0) return null;
						const top3 = atual.slice(0, 3);
						return (
							<div className="podium">
								{top3.map((p, i) => (
									<div key={i} className={`podium__item ${i===0?'podium__item--gold':i===1?'podium__item--silver':'podium__item--bronze'}`}>
										<div className="podium__medal">{i===0?'🥇':i===1?'🥈':'🥉'}</div>
										<div className="podium__name">{aba==='equipes' ? p.equipe : p.turma}</div>
										<div className="podium__points">{(p.totalPontos||0)} pts</div>
									</div>
								))}
							</div>
						);
					})()}
					<div className="tabs tabs--pill" role="tablist" aria-label="Categorias do ranking">
					<button
						role="tab"
						aria-selected={aba === "geral"}
							className={`tab ${aba === "geral" ? "is-active" : ""}`}
						onClick={() => setAba("geral")}
					>
						Geral
						<span style={{ marginLeft: "8px", opacity: 0.7 }}>
									({rankingGeral.length})
						</span>
					</button>
							<button
								role="tab"
								aria-selected={aba === "equipes"}
							className={`tab ${aba === "equipes" ? "is-active" : ""}`}
								onClick={() => setAba("equipes")}
							>
								Equipes
								<span style={{ marginLeft: "8px", opacity: 0.7 }}>
									({rankingEquipes.length})
								</span>
							</button>
				</div>
			</div>

			{tabela(rankingPorAba[aba])}

			<div className="section-actions" style={{ alignItems: 'center', gap: 12, display: 'flex' }}>
						<Link to="/modalidades" className="btn btn--ghost">Ver resultados por modalidade →</Link>
			</div>
		</section>
	);
}

