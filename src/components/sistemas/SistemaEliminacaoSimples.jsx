import React, { useState, useEffect } from "react";
import { useEliminacaoSimples } from "../../hooks/useEliminacaoSimples";
import { calcularColocacaoEliminacao, calcularPontosPorColocacao } from "../../services/rankingEliminacaoService";
import { gerarRankingEliminacaoSimples } from "../../utils/rankingHelpers";
import { saveRankingModalidade, getRankingModalidade } from "../../api/ranking";

/**
 * ========================================
 * COMPONENTE DE RANKING FINAL
 * ========================================
 */
function RankingFinal({ confrontoFinal, confrontosSemis, confrontosQuartas, confrontosOitavas, resultados }) {
	const dados = {
		confrontos: {
			final: confrontoFinal,
			semis: confrontosSemis,
			quartas: confrontosQuartas,
			oitavas: confrontosOitavas
		},
		resultados
	};

	const ranking = calcularColocacaoEliminacao(dados);

	if (ranking.length === 0) {
		return <p style={{ textAlign: "center", color: "var(--muted)" }}>Calculando classificação...</p>;
	}

	return (
		<table className="home-table" style={{ marginBottom: 0 }}>
			<thead>
				<tr>
					<th style={{ width: 60 }}>Pos.</th>
					<th>Equipe</th>
					<th>Fase Eliminação</th>
					<th style={{ width: 100 }}>Pontos</th>
				</tr>
			</thead>
			<tbody>
				{ranking.map((item, idx) => {
					const pontos = calcularPontosPorColocacao(item.colocacao);
					const isCampeao = item.colocacao === 1;
					const isVice = item.colocacao === 2;
					const isBronze = item.colocacao === 3 || item.colocacao === 4;
					
					return (
						<tr key={idx} style={{ 
							background: isCampeao ? "rgba(251, 191, 36, 0.1)" : 
									   isVice ? "rgba(156, 163, 175, 0.1)" : 
									   isBronze ? "rgba(205, 127, 50, 0.1)" : "transparent"
						}}>
							<td style={{ 
								fontWeight: 700, 
								fontSize: isCampeao || isVice ? 16 : 14,
								color: isCampeao ? "var(--accent)" : isVice ? "var(--primary)" : "var(--text)"
							}}>
								{isCampeao ? "🥇" : isVice ? "🥈" : isBronze ? "🥉" : `${item.colocacao}º`}
							</td>
							<td style={{ 
								fontWeight: isCampeao || isVice ? 700 : 500,
								fontSize: isCampeao || isVice ? 15 : 14
							}}>
								{item.equipe.nome}
							</td>
							<td style={{ color: "var(--muted)", fontSize: 13 }}>
								{item.fase}
							</td>
							<td style={{ 
								fontWeight: 700, 
								color: isCampeao ? "var(--accent)" : "var(--primary)",
								fontSize: 14
							}}>
								{pontos} pts
							</td>
						</tr>
					);
				})}
			</tbody>
		</table>
	);
}

/**
 * ========================================
 * SISTEMA DE ELIMINAÇÃO SIMPLES
 * ========================================
 * 
 * Sistema usado para modalidades como CS:GO, Truco, Bisca
 * 
 * Funcionalidades:
 * - Inscrição de 16 equipes
 * - Embaralhamento aleatório
 * - Chaveamento automático: Oitavas → Quartas → Semis → Final
 * - Bracket visual interativo
 * - Modo admin para inserir/editar resultados
 * - Cálculo automático de confrontos subsequentes
 * - **Persistência no Firebase** com sincronização em tempo real
 * 
 * Props:
 * - adminMode (boolean): Habilita edição de resultados
 * - modalidade (Object): Objeto da modalidade com id, nome, etc
 */

function SistemaEliminacaoSimples({ adminMode, modalidade }) {
	const _id = (modalidade?.id || '').toLowerCase();
	const idLower = (modalidade?.id || "").toLowerCase();
	const isCSGO = /cs[_-]?go/.test(idLower);
	const numEquipes = 16;
	
	// Hook customizado com Firebase
	const {
		loading,
		equipes,
		equipesLocal,
		todasEquipes,
		confrontosOitavas,
		confrontosQuartas,
		confrontosSemis,
		confrontoFinal,
		resultados,
		status,
		handleEquipeChange,
		handleSalvarEquipes,
		saveResultado
	} = useEliminacaoSimples(modalidade?.id, numEquipes);
	
	const [modalJogo, setModalJogo] = useState({
		open: false,
		confrontoId: null,
		equipeA: "",
		equipeB: "",
		scoreA: "",
		scoreB: "",
		fase: ""
	});

	const [rankingSalvo, setRankingSalvo] = useState(false);

	// Carregar ranking existente
	useEffect(() => {
		const carregarRanking = async () => {
			if (!modalidade?.id) return;
			const result = await getRankingModalidade(modalidade.id);
			if (result.success && result.data && result.data.ranking) {
				console.log('📊 Ranking já existe para esta modalidade');
				setRankingSalvo(true);
			}
		};
		carregarRanking();
	}, [modalidade?.id]);

	// Gerar e salvar ranking quando a final for concluída
	useEffect(() => {
		const gerarESalvarRanking = async () => {
			// Verificar se a final existe e tem resultado
			if (!confrontoFinal || !resultados[confrontoFinal.id]) {
				return;
			}

			// Verificar se o ranking já foi salvo
			if (rankingSalvo) {
				console.log('ℹ️ Ranking já foi salvo anteriormente');
				return;
			}

			console.log('🔍 Gerando ranking da eliminação simples...');

			try {
				const ranking = gerarRankingEliminacaoSimples(
					confrontoFinal,
					confrontosSemis,
					confrontosQuartas,
					confrontosOitavas,
					resultados,
					todasEquipes
				);

				console.log('📊 Ranking gerado:', ranking);

				if (ranking.length > 0) {
					const result = await saveRankingModalidade(modalidade.id, ranking);
					if (result.success) {
						console.log('✅ Ranking salvo com sucesso no Firestore!');
						setRankingSalvo(true);
					} else {
						console.error('❌ Erro ao salvar ranking:', result.error);
					}
				}
			} catch (error) {
				console.error('❌ Erro ao gerar ranking:', error);
			}
		};

		gerarESalvarRanking();
	}, [confrontoFinal, confrontosSemis, confrontosQuartas, confrontosOitavas, resultados, todasEquipes, rankingSalvo, modalidade?.id]);

	const openModalJogo = (confrontoId, equipeA, equipeB, fase) => {
		const resultado = resultados[confrontoId];
		setModalJogo({
			open: true,
			confrontoId,
			equipeA: equipeA.nome,
			equipeB: equipeB.nome,
			scoreA: resultado?.scoreA ?? "",
			scoreB: resultado?.scoreB ?? "",
			fase
		});
	};

	const closeModalJogo = () => setModalJogo(s => ({ ...s, open: false }));

	const saveModalJogo = (e) => {
		e.preventDefault();
		const { confrontoId, scoreA, scoreB } = modalJogo;
		
		// Salvar usando o hook (que persiste no Firebase)
		saveResultado(confrontoId, scoreA, scoreB);
		
		closeModalJogo();
	};

	// Função para obter equipes disponíveis para seleção
	const getEquipesDisponiveis = (idxAtual) => {
		const selecionadas = equipesLocal
			.filter((eq, idx) => idx !== idxAtual && eq.id && typeof eq.id === 'string' && eq.id.startsWith('turma_'))
			.map(eq => eq.id);
		
		return todasEquipes.filter(eq => !selecionadas.includes(eq.id));
	};

	// Loading state
	if (loading) {
		return (
			<div style={{ textAlign: "center", padding: "40px 20px" }}>
				<p style={{ color: "var(--muted)" }}>Carregando dados...</p>
			</div>
		);
	}

	const renderConfrontos = (confrontos, titulo) => {
		if (confrontos.length === 0) return null;

		return (
			<article className="card" style={{ marginBottom: 24 }}>
				<div className="card__header">
					<h3 className="card__title">{titulo}</h3>
				</div>
				<div className="card__body">
					<table className="home-table" style={{ marginBottom: 0 }}>
						<thead>
							<tr>
								<th>Confronto</th>
								<th>Equipe A</th>
								<th>Equipe B</th>
								<th>Resultado</th>
							</tr>
						</thead>
						<tbody>
							{confrontos.map(confronto => {
								const resultado = resultados[confronto.id];
								return (
									<tr key={confronto.id}>
										<td style={{ fontWeight: 600 }}>{confronto.fase} {confronto.jogo}</td>
										<td>{confronto.equipeA.nome}</td>
										<td>{confronto.equipeB.nome}</td>
										<td>
											{resultado ? (
												<span style={{ fontWeight: 700 }}>
													{resultado.scoreA} x {resultado.scoreB}
													{adminMode && (
														<button 
															className="btn btn--ghost" 
															onClick={() => openModalJogo(confronto.id, confronto.equipeA, confronto.equipeB, confronto.fase)}
															style={{ marginLeft: 8, padding: "4px 8px", fontSize: 12 }}
														>
															Editar
														</button>
													)}
												</span>
											) : adminMode ? (
												<button 
													className="btn btn--primary" 
													onClick={() => openModalJogo(confronto.id, confronto.equipeA, confronto.equipeB, confronto.fase)}
													style={{ padding: "6px 12px", fontSize: 13 }}
												>
													Inserir Resultado
												</button>
											) : (
												<span style={{ color: "var(--muted)" }}>Aguardando</span>
											)}
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			</article>
		);
	};

	return (
		<div style={{ margin: "24px auto", maxWidth: 1200 }}>
			{/* Tabela de inscrição das equipes */}
			{equipes.length === 0 && (
				<article className="card" style={{ marginBottom: 24 }}>
					<div className="card__header">
						<h2 className="card__title">📝 Inscrição de Equipes</h2>
					</div>
					<div className="card__body">
						{isCSGO ? (
							<>
								<p style={{ color: 'var(--muted)', marginBottom: 12 }}>
									Insira as 8 duplas — cada linha representa uma partida das Oitavas de Final (Equipe A × Equipe B). A ordem será preservada.
								</p>
								<div style={{ display: 'grid', gap: 12 }}>
									{Array.from({ length: 8 }).map((_, pairIdx) => {
										const idxA = pairIdx * 2;
										const idxB = pairIdx * 2 + 1;
										return (
											<div key={pairIdx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
												<div>
													<label style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6, display: 'block' }}>Dupla {pairIdx + 1} — Equipe A</label>
													<select className="inputLogin" value={equipesLocal[idxA]?.id || ''} onChange={(e) => {
														const equipeId = e.target.value;
														if (equipeId) {
															const selecionada = todasEquipes.find(eq => eq.id === equipeId);
															if (selecionada) handleEquipeChange(idxA, { id: selecionada.id, nome: selecionada.nome });
														} else {
															handleEquipeChange(idxA, { id: `slot-${idxA}`, nome: '' });
														}
													}} disabled={!adminMode} style={{ width: '100%' }}>
														<option value="">-- Selecione --</option>
														{todasEquipes.map(eq => (<option key={eq.id} value={eq.id}>{eq.nome}</option>))}
													</select>
												</div>
												<div>
													<label style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6, display: 'block' }}>Dupla {pairIdx + 1} — Equipe B</label>
													<select className="inputLogin" value={equipesLocal[idxB]?.id || ''} onChange={(e) => {
														const equipeId = e.target.value;
														if (equipeId) {
															const selecionada = todasEquipes.find(eq => eq.id === equipeId);
															if (selecionada) handleEquipeChange(idxB, { id: selecionada.id, nome: selecionada.nome });
														} else {
															handleEquipeChange(idxB, { id: `slot-${idxB}`, nome: '' });
														}
													}} disabled={!adminMode} style={{ width: '100%' }}>
														<option value="">-- Selecione --</option>
														{todasEquipes.map(eq => (<option key={eq.id} value={eq.id}>{eq.nome}</option>))}
													</select>
												</div>
											</div>
										);
									})}
								</div>
								{adminMode && (
									<div style={{ marginTop: 12, textAlign: 'right' }}>
										<button className="btn btn--primary" onClick={handleSalvarEquipes}>💾 Salvar Oitavas (usar duplas informadas)</button>
									</div>
								)}
							</>
						) : (
							<>
								<p style={{ color: "var(--muted)", marginBottom: 16 }}>
									Selecione as {numEquipes} equipes participantes. Elas serão embaralhadas aleatoriamente para gerar os confrontos.
								</p>
								<div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, padding: "0 8px" }}>
									{equipesLocal.map((equipe, idx) => {
										const equipesDisponiveis = getEquipesDisponiveis(idx);
										return (
											<div key={idx} style={{ minWidth: 0 }}>
												<label style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4, display: "block" }}>
													Posição {idx + 1}
												</label>
												<select
													className="inputLogin"
													value={equipe.id || ""}
													onChange={(e) => {
														const equipeId = e.target.value;
														if (equipeId) {
															const equipeSelecionada = todasEquipes.find(eq => eq.id === equipeId);
															if (equipeSelecionada) {
																handleEquipeChange(idx, {
																	id: equipeSelecionada.id,
																	nome: equipeSelecionada.nome,
																	cor: equipeSelecionada.cor,
																	anoSerie: equipeSelecionada.anoSerie,
																	numeroTurma: equipeSelecionada.numeroTurma
																});
															}
														} else {
															handleEquipeChange(idx, { id: `slot-${idx}`, nome: "" });
														}
													}}
													style={{ width: "100%", boxSizing: "border-box" }}
													disabled={!adminMode}
												>
													<option value="">-- Selecione --</option>
													{equipesDisponiveis.map(eq => (
														<option key={eq.id} value={eq.id}>
															{eq.nome}
														</option>
													))}
													{equipe.id && typeof equipe.id === 'string' && equipe.id.startsWith('turma_') && (
														<option value={equipe.id} style={{ fontWeight: 'bold' }}>
															{equipe.nome} (selecionada)
														</option>
													)}
												</select>
											</div>
										);
									})}
								</div>
								{adminMode && (
									<div style={{ marginTop: 16, textAlign: "right" }}>
										<button className="btn btn--primary" onClick={handleSalvarEquipes}>
											Salvar e Embaralhar Equipes
										</button>
									</div>
								)}
							</>
						)}
					</div>
				</article>
			)}

			{/* Confrontos */}
			{renderConfrontos(confrontosOitavas, "⚔️ Oitavas de Final")}
			{renderConfrontos(confrontosQuartas, "🔥 Quartas de Final")}
			{renderConfrontos(confrontosSemis, "💪 Semifinais")}
			
			{/* Final */}
			{confrontoFinal && (
				<article className="card" style={{ border: "2px solid var(--primary)" }}>
					<div className="card__header" style={{ background: "linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)" }}>
						<h3 className="card__title" style={{ fontSize: 18 }}>👑 GRANDE FINAL</h3>
					</div>
					<div className="card__body">
						<table className="home-table" style={{ marginBottom: 0 }}>
							<thead>
								<tr>
									<th>Equipe A</th>
									<th>Equipe B</th>
									<th>Resultado</th>
								</tr>
							</thead>
							<tbody>
								{(() => {
									const resultado = resultados[confrontoFinal.id];
									return (
										<tr>
											<td style={{ fontSize: 15, fontWeight: 600 }}>{confrontoFinal.equipeA.nome}</td>
											<td style={{ fontSize: 15, fontWeight: 600 }}>{confrontoFinal.equipeB.nome}</td>
											<td>
												{resultado ? (
													<span style={{ fontWeight: 700, fontSize: 16, color: "var(--primary)" }}>
														{resultado.scoreA} x {resultado.scoreB}
														{adminMode && (
															<button 
																className="btn btn--ghost" 
																onClick={() => openModalJogo(confrontoFinal.id, confrontoFinal.equipeA, confrontoFinal.equipeB, 'Final')}
																style={{ marginLeft: 8, padding: "4px 8px", fontSize: 12 }}
															>
																Editar
															</button>
														)}
													</span>
												) : adminMode ? (
													<button 
														className="btn btn--primary" 
														onClick={() => openModalJogo(confrontoFinal.id, confrontoFinal.equipeA, confrontoFinal.equipeB, 'Final')}
														style={{ padding: "6px 12px", fontSize: 13 }}
													>
														Inserir Resultado
													</button>
												) : (
													<span style={{ color: "var(--muted)" }}>Aguardando</span>
												)}
											</td>
										</tr>
									);
								})()}
							</tbody>
						</table>
					</div>
				</article>
			)}

			{/* Ranking Final (se competição concluída) */}
			{status === "concluido" && confrontoFinal && resultados[confrontoFinal.id] && (
				<article className="card" style={{ marginTop: 24, border: "2px solid var(--accent)" }}>
					<div className="card__header" style={{ background: "linear-gradient(135deg, var(--accent) 0%, var(--primary) 100%)" }}>
						<h2 className="card__title" style={{ fontSize: 18 }}>🏅 Classificação Final</h2>
					</div>
					<div className="card__body">
						<RankingFinal 
							confrontoFinal={confrontoFinal}
							confrontosSemis={confrontosSemis}
							confrontosQuartas={confrontosQuartas}
							confrontosOitavas={confrontosOitavas}
							resultados={resultados}
						/>
					</div>
				</article>
			)}

			{/* Espelho Visual - Bracket de Eliminação Simples */}
			{equipes.length > 0 && (
				<article className="card bracket-visual-card" style={{ marginTop: 24 }}>
					<div className="card__header">
						<h2 className="card__title">🏆 Chave de Eliminação</h2>
					</div>
					<div className="card__body">
						<div style={{ display: "flex", gap: 24, justifyContent: "space-around", overflowX: "auto", padding: "20px 0" }}>
							{/* Oitavas */}
							{confrontosOitavas.length > 0 && (
								<div style={{ minWidth: 200 }}>
									<h4 style={{ textAlign: "center", marginBottom: 16, color: "var(--primary)" }}>Oitavas</h4>
									<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
										{confrontosOitavas.map(confronto => {
											const resultado = resultados[confronto.id];
											const vencedor = resultado?.scoreA > resultado?.scoreB ? confronto.equipeA.nome :
															resultado?.scoreB > resultado?.scoreA ? confronto.equipeB.nome : null;
											return (
												<div key={confronto.id} style={{ 
													background: "var(--card)", 
													padding: "8px 12px", 
													borderRadius: 6,
													border: "1px solid rgba(45, 212, 191, 0.2)"
												}}>
													<div style={{ fontSize: 13, color: vencedor === confronto.equipeA.nome ? "var(--primary)" : "var(--text)", fontWeight: vencedor === confronto.equipeA.nome ? 700 : 400 }}>
														{confronto.equipeA.nome} {resultado ? `(${resultado.scoreA})` : ""}
													</div>
													<div style={{ fontSize: 13, color: vencedor === confronto.equipeB.nome ? "var(--primary)" : "var(--text)", fontWeight: vencedor === confronto.equipeB.nome ? 700 : 400 }}>
														{confronto.equipeB.nome} {resultado ? `(${resultado.scoreB})` : ""}
													</div>
												</div>
											);
										})}
									</div>
								</div>
							)}

							{/* Quartas */}
							{confrontosQuartas.length > 0 && (
								<div style={{ minWidth: 200 }}>
									<h4 style={{ textAlign: "center", marginBottom: 16, color: "var(--primary)" }}>Quartas</h4>
									<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
										{confrontosQuartas.map(confronto => {
											const resultado = resultados[confronto.id];
											const vencedor = resultado?.scoreA > resultado?.scoreB ? confronto.equipeA.nome :
															resultado?.scoreB > resultado?.scoreA ? confronto.equipeB.nome : null;
											return (
												<div key={confronto.id} style={{ 
													background: "var(--card)", 
													padding: "8px 12px", 
													borderRadius: 6,
													border: "1px solid rgba(45, 212, 191, 0.3)"
												}}>
													<div style={{ fontSize: 13, color: vencedor === confronto.equipeA.nome ? "var(--primary)" : "var(--text)", fontWeight: vencedor === confronto.equipeA.nome ? 700 : 400 }}>
														{confronto.equipeA.nome} {resultado ? `(${resultado.scoreA})` : ""}
													</div>
													<div style={{ fontSize: 13, color: vencedor === confronto.equipeB.nome ? "var(--primary)" : "var(--text)", fontWeight: vencedor === confronto.equipeB.nome ? 700 : 400 }}>
														{confronto.equipeB.nome} {resultado ? `(${resultado.scoreB})` : ""}
													</div>
												</div>
											);
										})}
									</div>
								</div>
							)}

							{/* Semifinais */}
							{confrontosSemis.length > 0 && (
								<div style={{ minWidth: 200 }}>
									<h4 style={{ textAlign: "center", marginBottom: 16, color: "var(--primary)" }}>Semifinais</h4>
									<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
										{confrontosSemis.map(confronto => {
											const resultado = resultados[confronto.id];
											const vencedor = resultado?.scoreA > resultado?.scoreB ? confronto.equipeA.nome :
															resultado?.scoreB > resultado?.scoreA ? confronto.equipeB.nome : null;
											return (
												<div key={confronto.id} style={{ 
													background: "var(--card)", 
													padding: "8px 12px", 
													borderRadius: 6,
													border: "1px solid rgba(45, 212, 191, 0.4)"
												}}>
													<div style={{ fontSize: 13, color: vencedor === confronto.equipeA.nome ? "var(--primary)" : "var(--text)", fontWeight: vencedor === confronto.equipeA.nome ? 700 : 400 }}>
														{confronto.equipeA.nome} {resultado ? `(${resultado.scoreA})` : ""}
													</div>
													<div style={{ fontSize: 13, color: vencedor === confronto.equipeB.nome ? "var(--primary)" : "var(--text)", fontWeight: vencedor === confronto.equipeB.nome ? 700 : 400 }}>
														{confronto.equipeB.nome} {resultado ? `(${resultado.scoreB})` : ""}
													</div>
												</div>
											);
										})}
									</div>
								</div>
							)}

							{/* Final */}
							{confrontoFinal && (
								<div style={{ minWidth: 200 }}>
									<h4 style={{ textAlign: "center", marginBottom: 16, color: "var(--accent)" }}>🏆 Final</h4>
									<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
										{(() => {
											const resultado = resultados[confrontoFinal.id];
											const vencedor = resultado?.scoreA > resultado?.scoreB ? confrontoFinal.equipeA.nome :
															resultado?.scoreB > resultado?.scoreA ? confrontoFinal.equipeB.nome : null;
											return (
												<div style={{ 
													background: "linear-gradient(135deg, rgba(45, 212, 191, 0.1) 0%, rgba(251, 191, 36, 0.1) 100%)", 
													padding: "12px 14px", 
													borderRadius: 6,
													border: "2px solid var(--primary)"
												}}>
													<div style={{ fontSize: 14, color: vencedor === confrontoFinal.equipeA.nome ? "var(--accent)" : "var(--text)", fontWeight: vencedor === confrontoFinal.equipeA.nome ? 700 : 500 }}>
														{confrontoFinal.equipeA.nome} {resultado ? `(${resultado.scoreA})` : ""}
														{vencedor === confrontoFinal.equipeA.nome && " 👑"}
													</div>
													<div style={{ fontSize: 14, color: vencedor === confrontoFinal.equipeB.nome ? "var(--accent)" : "var(--text)", fontWeight: vencedor === confrontoFinal.equipeB.nome ? 700 : 500 }}>
														{confrontoFinal.equipeB.nome} {resultado ? `(${resultado.scoreB})` : ""}
														{vencedor === confrontoFinal.equipeB.nome && " 👑"}
													</div>
												</div>
											);
										})()}
									</div>
								</div>
							)}
						</div>
					</div>
				</article>
			)}

			{/* Modal de edição de jogo */}
			{modalJogo.open && (
				<div className="modal-overlay" onClick={closeModalJogo}>
					<div className="modal" onClick={(e) => e.stopPropagation()}>
						<h3>Editar Resultado - {modalJogo.fase}</h3>
						<p style={{ color: "var(--muted)", fontSize: 14, margin: "8px 0" }}>
							{modalJogo.equipeA} vs {modalJogo.equipeB}
						</p>
						<form onSubmit={saveModalJogo} className="form">
							<div className="row">
								<label>Rounds — {modalJogo.equipeA}</label>
								<input 
									type="number" 
									min="0" 
									max="16"
									value={modalJogo.scoreA} 
									onChange={(e) => setModalJogo(s => ({ ...s, scoreA: e.target.value }))} 
									required 
								/>
							</div>
							<div className="row">
								<label>Rounds — {modalJogo.equipeB}</label>
								<input 
									type="number" 
									min="0" 
									max="16"
									value={modalJogo.scoreB} 
									onChange={(e) => setModalJogo(s => ({ ...s, scoreB: e.target.value }))} 
									required 
								/>
							</div>
							<div className="actions">
								<button type="button" className="btn btn--ghost" onClick={closeModalJogo}>Cancelar</button>
								<button type="submit" className="btn btn--primary">Salvar</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}

export default SistemaEliminacaoSimples;
