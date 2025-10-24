import React from 'react';

/**
 * Sistema de Disciplina e Organização
 * COPIADO EXATAMENTE DO ORIGINAL ModalidadeDetalhe.jsx linha 3354-3684
 */
function SistemaDisciplina({ adminMode, resultados = [], setResultados, equipesInscritas = [], modalidadeId }) {
	const calcularPontuacao = (ocorrencias, avaliacoesSujas) => {
		const base = 160;
		const penalidade = (ocorrencias + avaliacoesSujas) * 10;
		return Math.max(0, base - penalidade);
	};

	// Carregar dados das equipes com resultados do Firestore
	const dadosEquipes = equipesInscritas.map(equipe => {
		const resultado = resultados.find(r => r.equipeId === equipe.id || r.equipeId === equipe.equipeId);
		
		const ocorrencias = resultado?.ocorrencias || 0;
		const avaliacoesSujas = resultado?.avaliacoesSujas || 0;
		
		return {
			id: equipe.id || equipe.equipeId,
			nome: equipe.nome || equipe.nomeEquipe,
			ocorrencias,
			avaliacoesSujas,
			pontuacao: resultado?.pontos || calcularPontuacao(ocorrencias, avaliacoesSujas),
			resultadoId: resultado?.id
		};
	});

	const handleAlterarOcorrencias = (equipeId, delta) => {
		if (!adminMode) return;
		
		const equipe = dadosEquipes.find(e => e.id === equipeId);
		if (!equipe) return;
		
		const novasOcorrencias = Math.max(0, equipe.ocorrencias + delta);
		const novaPontuacao = calcularPontuacao(novasOcorrencias, equipe.avaliacoesSujas);
		
		const resultadoId = equipe.resultadoId || `resultado_${modalidadeId}_${equipeId}`;
		
		const novoResultado = {
			id: resultadoId,
			modalidadeId: modalidadeId,
			equipeId: equipeId,
			ocorrencias: novasOcorrencias,
			avaliacoesSujas: equipe.avaliacoesSujas,
			pontos: novaPontuacao,
			tipo: 'pontuacao-decadente'
		};
		
		setResultados(prev => {
			const index = prev.findIndex(r => r.id === resultadoId || r.equipeId === equipeId);
			if (index >= 0) {
				const updated = [...prev];
				updated[index] = novoResultado;
				return updated;
			} else {
				return [...prev, novoResultado];
			}
		});
	};

	const handleAlterarAvaliacoes = (equipeId, delta) => {
		if (!adminMode) return;
		
		const equipe = dadosEquipes.find(e => e.id === equipeId);
		if (!equipe) return;
		
		const novasAvaliacoes = Math.max(0, equipe.avaliacoesSujas + delta);
		const novaPontuacao = calcularPontuacao(equipe.ocorrencias, novasAvaliacoes);
		
		const resultadoId = equipe.resultadoId || `resultado_${modalidadeId}_${equipeId}`;
		
		const novoResultado = {
			id: resultadoId,
			modalidadeId: modalidadeId,
			equipeId: equipeId,
			ocorrencias: equipe.ocorrencias,
			avaliacoesSujas: novasAvaliacoes,
			pontos: novaPontuacao,
			tipo: 'pontuacao-decadente'
		};
		
		setResultados(prev => {
			const index = prev.findIndex(r => r.id === resultadoId || r.equipeId === equipeId);
			if (index >= 0) {
				const updated = [...prev];
				updated[index] = novoResultado;
				return updated;
			} else {
				return [...prev, novoResultado];
			}
		});
	};

	const turmasOrdenadas = [...dadosEquipes].sort((a, b) => b.pontuacao - a.pontuacao);

	return (
		<div style={{ marginTop: 24, maxWidth: "100%", overflowX: "hidden" }}>
			{/* Card de Informações */}
			<article className="card" style={{ maxWidth: "90vw", margin: "0 auto" }}>
				<div className="card__header">
					<h2 className="card__title">ℹ️ Sistema de Pontuação Decadente</h2>
				</div>
				<div className="card__body">
					<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
						<p style={{ margin: 0, display: "flex", gap: 8 }}>
							<strong style={{ color: "var(--primary)" }}>Base Inicial:</strong> 
							<span style={{ color: "var(--muted)" }}>Cada turma inicia com <strong>160 pontos</strong></span>
						</p>
						<p style={{ margin: 0, display: "flex", gap: 8 }}>
							<strong style={{ color: "#ef4444" }}>Penalidade por Ocorrência:</strong> 
							<span style={{ color: "var(--muted)" }}><strong>-10 pontos</strong> por ocorrência registrada (individual ou coletiva)</span>
						</p>
						<p style={{ margin: 0, display: "flex", gap: 8 }}>
							<strong style={{ color: "#ef4444" }}>Penalidade por Sala Suja:</strong> 
							<span style={{ color: "var(--muted)" }}><strong>-10 pontos</strong> por avaliação de sala suja</span>
						</p>
						<p style={{ margin: 0, display: "flex", gap: 8 }}>
							<strong style={{ color: "var(--primary)" }}>Pontuação Máxima:</strong> 
							<span style={{ color: "var(--muted)" }}>Sem ocorrências e sala sempre limpa = <strong>160 pontos</strong></span>
						</p>
						<p style={{ margin: 0, display: "flex", gap: 8 }}>
							<strong style={{ color: "var(--muted)" }}>Pontuação Mínima:</strong> 
							<span style={{ color: "var(--muted)" }}><strong>0 pontos</strong></span>
						</p>
					</div>
				</div>
			</article>

			{/* Card de Registro de Penalidades */}
			<article className="card" style={{ maxWidth: "90vw", margin: "24px auto 0" }}>
				<div className="card__header">
					<h2 className="card__title">📊 Ranking de Disciplina e Organização</h2>
				</div>
				<div className="card__body">
					<div style={{ overflowX: "auto" }}>
						<table className="home-table" style={{ fontSize: 14 }}>
							<thead>
								<tr style={{ background: "rgba(45, 212, 191, 0.1)" }}>
									<th style={{ padding: "12px", width: 60, textAlign: "center", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Pos.</th>
									<th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Turma</th>
									<th style={{ padding: "12px", width: 140, textAlign: "center", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Ocorrências</th>
									<th style={{ padding: "12px", width: 140, textAlign: "center", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Sala Suja</th>
									<th style={{ padding: "12px", width: 120, textAlign: "center", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Penalidades</th>
									<th style={{ padding: "12px", width: 120, textAlign: "center", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Pontuação</th>
								</tr>
							</thead>
							<tbody>
								{turmasOrdenadas.map((turma, index) => {
									const isPerfect = turma.pontuacao === 160;
									const hasPenalty = turma.pontuacao < 160;
									
									return (
										<tr 
											key={turma.id}
											style={{ 
												borderBottom: "1px solid rgba(255,255,255,0.05)",
												background: isPerfect ? "rgba(45, 212, 191, 0.05)" : "transparent"
											}}
										>
											<td style={{ padding: "12px", textAlign: "center" }}>
												<span style={{ 
													fontWeight: 700,
													color: index === 0 ? "var(--primary)" : "var(--text)"
												}}>
													{index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : ""} {index + 1}º
												</span>
											</td>
											<td style={{ padding: "12px", fontWeight: isPerfect ? "600" : "normal" }}>
												{turma.nome}
											</td>
											<td style={{ padding: "12px" }}>
												{adminMode ? (
													<div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
														<button 
															onClick={() => handleAlterarOcorrencias(turma.id, -1)}
															disabled={turma.ocorrencias === 0}
															style={{
																padding: "4px 10px",
																background: turma.ocorrencias === 0 ? "rgba(255,255,255,0.05)" : "rgba(239, 68, 68, 0.2)",
																border: "1px solid rgba(239, 68, 68, 0.4)",
																borderRadius: 6,
																color: turma.ocorrencias === 0 ? "var(--muted)" : "#ef4444",
																cursor: turma.ocorrencias === 0 ? "not-allowed" : "pointer",
																fontSize: 16,
																fontWeight: "bold"
															}}
														>
															−
														</button>
														<span style={{ 
															fontWeight: 600, 
															minWidth: 30, 
															textAlign: "center",
															color: turma.ocorrencias > 0 ? "#ef4444" : "var(--muted)",
															fontSize: 16
														}}>
															{turma.ocorrencias}
														</span>
														<button 
															onClick={() => handleAlterarOcorrencias(turma.id, 1)}
															style={{
																padding: "4px 10px",
																background: "rgba(239, 68, 68, 0.2)",
																border: "1px solid rgba(239, 68, 68, 0.4)",
																borderRadius: 6,
																color: "#ef4444",
																cursor: "pointer",
																fontSize: 16,
																fontWeight: "bold"
															}}
														>
															+
														</button>
													</div>
												) : (
													<span style={{ 
														color: turma.ocorrencias > 0 ? "#ef4444" : "var(--muted)",
														fontWeight: turma.ocorrencias > 0 ? "600" : "normal"
													}}>
														{turma.ocorrencias}
													</span>
												)}
											</td>
											<td style={{ padding: "12px" }}>
												{adminMode ? (
													<div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
														<button 
															onClick={() => handleAlterarAvaliacoes(turma.id, -1)}
															disabled={turma.avaliacoesSujas === 0}
															style={{
																padding: "4px 10px",
																background: turma.avaliacoesSujas === 0 ? "rgba(255,255,255,0.05)" : "rgba(239, 68, 68, 0.2)",
																border: "1px solid rgba(239, 68, 68, 0.4)",
																borderRadius: 6,
																color: turma.avaliacoesSujas === 0 ? "var(--muted)" : "#ef4444",
																cursor: turma.avaliacoesSujas === 0 ? "not-allowed" : "pointer",
																fontSize: 16,
																fontWeight: "bold"
															}}
														>
															−
														</button>
														<span style={{ 
															fontWeight: 600, 
															minWidth: 30, 
															textAlign: "center",
															color: turma.avaliacoesSujas > 0 ? "#ef4444" : "var(--muted)",
															fontSize: 16
														}}>
															{turma.avaliacoesSujas}
														</span>
														<button 
															onClick={() => handleAlterarAvaliacoes(turma.id, 1)}
															style={{
																padding: "4px 10px",
																background: "rgba(239, 68, 68, 0.2)",
																border: "1px solid rgba(239, 68, 68, 0.4)",
																borderRadius: 6,
																color: "#ef4444",
																cursor: "pointer",
																fontSize: 16,
																fontWeight: "bold"
															}}
														>
															+
														</button>
													</div>
												) : (
													<span style={{ 
														color: turma.avaliacoesSujas > 0 ? "#ef4444" : "var(--muted)",
														fontWeight: turma.avaliacoesSujas > 0 ? "600" : "normal"
													}}>
														{turma.avaliacoesSujas}
													</span>
												)}
											</td>
											<td style={{ padding: "12px", textAlign: "center" }}>
												<span style={{ 
													color: hasPenalty ? "#ef4444" : "var(--muted)", 
													fontWeight: hasPenalty ? "700" : "normal",
													fontSize: hasPenalty ? 15 : 14
												}}>
													{hasPenalty ? "-" : ""}{(turma.ocorrencias + turma.avaliacoesSujas) * 10}
												</span>
											</td>
											<td style={{ padding: "12px", textAlign: "center" }}>
												<span style={{ 
													fontWeight: 700, 
													fontSize: 17,
													color: isPerfect ? "var(--primary)" : hasPenalty ? "#ef4444" : "var(--text)"
												}}>
													{turma.pontuacao}
													{isPerfect && <span style={{ marginLeft: 6 }}>✨</span>}
												</span>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>

					{/* Legenda */}
					<div style={{ 
						marginTop: 20, 
						padding: 16, 
						background: "rgba(255,255,255,0.02)", 
						borderRadius: 8,
						border: "1px solid rgba(255,255,255,0.08)"
					}}>
						<h4 style={{ margin: "0 0 12px 0", fontSize: 14, color: "var(--text)" }}>📌 Legenda:</h4>
						<div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}>
							<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
								<span style={{ color: "var(--primary)", fontSize: 16 }}>✨</span>
								<span style={{ color: "var(--muted)" }}>Turma com pontuação perfeita (160 pontos)</span>
							</div>
							<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
								<span style={{ color: "#ef4444", fontSize: 16 }}>●</span>
								<span style={{ color: "var(--muted)" }}>Valores em vermelho indicam penalidades aplicadas</span>
							</div>
							{adminMode && (
								<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
									<span style={{ color: "var(--primary)", fontSize: 16 }}>⚙️</span>
									<span style={{ color: "var(--muted)" }}>Use os botões <strong>+ / −</strong> para registrar ocorrências e avaliações</span>
								</div>
							)}
						</div>
					</div>
				</div>
			</article>
		</div>
	);
}

export default SistemaDisciplina;
