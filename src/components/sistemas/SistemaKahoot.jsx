import React, { useState, useEffect, useMemo } from "react";
import { db } from "../../api/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getEquipes } from "../../api/equipes";
import { saveRankingModalidade } from "../../api/ranking";

/**
 * Sistema para Gincana Técnico-Cultural (Kahoot)
 * 
 * Como o Kahoot já gera a lista de pontuação automaticamente,
 * este sistema apenas registra a colocação de cada equipe
 * e gera o ranking final com a pontuação padrão do evento.
 * 
 * Pontuação: 1º = 160, 2º = 150, 3º = 140, ..., 16º = 10
 */

const SistemaKahoot = ({ adminMode, modalidade }) => {
	const [participantes, setParticipantes] = useState([]);
	const [colocacoes, setColocacoes] = useState({}); // { equipeId: "1", "2", "3"... }
	const [todasEquipes, setTodasEquipes] = useState([]);
	const [equipeSelecionada, setEquipeSelecionada] = useState("");
	const [loading, setLoading] = useState(true);
	const [savingRanking, setSavingRanking] = useState(false);
	const [msgRanking, setMsgRanking] = useState(null);

	// ========================================
	// CARREGAR DADOS
	// ========================================

	useEffect(() => {
		carregarEquipes();
		carregarDoFirebase();
	}, [modalidade.id]);

	const carregarEquipes = async () => {
		try {
			const response = await getEquipes();
			if (response.success) {
				setTodasEquipes(response.data);
			}
		} catch (error) {
			console.error("Erro ao carregar equipes:", error);
		}
	};

	const carregarDoFirebase = async () => {
		try {
			const docRef = doc(db, "sistemaKahoot", modalidade.id);
			const docSnap = await getDoc(docRef);

			if (docSnap.exists()) {
				const dados = docSnap.data();
				setParticipantes(dados.participantes || []);
				setColocacoes(dados.colocacoes || {});
			}
		} catch (error) {
			console.error("Erro ao carregar dados do Firestore:", error);
		} finally {
			setLoading(false);
		}
	};

	const salvarNoFirebase = async (dados) => {
		try {
			const docRef = doc(db, "sistemaKahoot", modalidade.id);
			await setDoc(docRef, {
				...dados,
				modalidadeId: modalidade.id,
				ultimaAtualizacao: new Date().toISOString(),
			});
		} catch (error) {
			console.error("Erro ao salvar no Firestore:", error);
			alert("Erro ao salvar dados!");
		}
	};

	// ========================================
	// ADICIONAR/REMOVER PARTICIPANTES
	// ========================================

	const handleAdicionarParticipante = () => {
		if (!equipeSelecionada) {
			alert("Selecione uma equipe!");
			return;
		}

		// Verificar se já está participando
		if (participantes.find((p) => p.id === equipeSelecionada)) {
			alert("Esta equipe já está participando!");
			return;
		}

		const equipe = todasEquipes.find((e) => e.id === equipeSelecionada);
		if (!equipe) return;

		const novosParticipantes = [...participantes, { id: equipe.id, nome: equipe.nome }];
		setParticipantes(novosParticipantes);
		setEquipeSelecionada("");

		salvarNoFirebase({
			participantes: novosParticipantes,
			colocacoes,
		});
	};

	const handleRemoverParticipante = (equipeId) => {
		if (!window.confirm("Remover esta equipe?")) return;

		const novosParticipantes = participantes.filter((p) => p.id !== equipeId);
		const novasColocacoes = { ...colocacoes };
		delete novasColocacoes[equipeId];

		setParticipantes(novosParticipantes);
		setColocacoes(novasColocacoes);

		salvarNoFirebase({
			participantes: novosParticipantes,
			colocacoes: novasColocacoes,
		});
	};

	// ========================================
	// REGISTRAR COLOCAÇÃO
	// ========================================

	const handleColocacaoChange = (equipeId, valor) => {
		const novasColocacoes = {
			...colocacoes,
			[equipeId]: valor,
		};

		setColocacoes(novasColocacoes);

		salvarNoFirebase({
			participantes,
			colocacoes: novasColocacoes,
		});
	};

	// ========================================
	// PONTUAÇÃO POR COLOCAÇÃO
	// ========================================

	const getPontuacaoPorColocacao = (colocacao) => {
		const pontos = {
			1: 160, 2: 150, 3: 140, 4: 130, 5: 120, 6: 110, 7: 100, 8: 90,
			9: 80, 10: 70, 11: 60, 12: 50, 13: 40, 14: 30, 15: 20, 16: 10,
		};
		return pontos[parseInt(colocacao)] || 0;
	};

	// ========================================
	// RANKING FINAL
	// ========================================

	const ranking = useMemo(() => {
		// Filtrar apenas equipes com colocação registrada
		const equipesComColocacao = participantes
			.filter((p) => colocacoes[p.id] && colocacoes[p.id] !== "")
			.map((p) => ({
				...p,
				colocacao: parseInt(colocacoes[p.id]),
				pontos: getPontuacaoPorColocacao(colocacoes[p.id]),
			}));

		// Ordenar por colocação (menor = melhor)
		return equipesComColocacao.sort((a, b) => a.colocacao - b.colocacao);
	}, [participantes, colocacoes]);

	// ========================================
	// EQUIPES DISPONÍVEIS
	// ========================================

	const equipesDisponiveis = useMemo(() => {
		return todasEquipes.filter((eq) => !participantes.find((p) => p.id === eq.id));
	}, [todasEquipes, participantes]);

	// ========================================
	// RENDERIZAÇÃO
	// ========================================

	if (loading) {
		return (
			<div style={{ textAlign: "center", padding: "40px 20px" }}>
				<p style={{ fontSize: 16, color: "var(--muted)" }}>⏳ Carregando dados...</p>
			</div>
		);
	}

	return (
		<div style={{ marginTop: 24, maxWidth: "100%", overflowX: "hidden" }}>
			{/* ADICIONAR PARTICIPANTES (ADMIN) */}
			{adminMode && (
				<article className="card" style={{ maxWidth: "90vw", margin: "0 auto 16px" }}>
					<div className="card__header">
						<h2 className="card__title">🎯 Gincana Técnico-Cultural (Kahoot)</h2>
						<p style={{ fontSize: 13, color: "var(--muted)", margin: "8px 0 0 0" }}>
							<strong>ℹ️ Como funciona:</strong> 40 perguntas • 20 seg/questão • 
							Pontuação dinâmica por tempo • 3 representantes por equipe
						</p>
					</div>
					<div className="card__body">
						<div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
							<select
								value={equipeSelecionada}
								onChange={(e) => setEquipeSelecionada(e.target.value)}
								style={{
									flex: 1,
									minWidth: "200px",
									padding: "10px 14px",
									borderRadius: 8,
									border: "1px solid var(--border)",
									background: "var(--card)",
									color: "var(--text)",
									fontSize: 15
								}}
							>
								<option value="">Selecione uma equipe...</option>
								{equipesDisponiveis.map((eq) => (
									<option key={eq.id} value={eq.id}>
										{eq.nome}
									</option>
								))}
							</select>
							<button
								onClick={handleAdicionarParticipante}
								className="btn btn--primary"
								style={{ padding: "10px 24px", whiteSpace: "nowrap" }}
								disabled={!equipeSelecionada}
							>
								➕ Adicionar
							</button>
						</div>

						{participantes.length > 0 ? (
							<div style={{ 
								display: "grid", 
								gridTemplateColumns: "repeat(auto-fill, minmax(min(200px, 100%), 1fr))", 
								gap: 8 
							}}>
								{participantes.map((p) => (
									<div
										key={p.id}
										style={{
											background: "rgba(255,255,255,0.06)",
											padding: "8px 12px",
											borderRadius: 8,
											display: "flex",
											alignItems: "center",
											justifyContent: "space-between",
											gap: 8
										}}
									>
										<span style={{ fontSize: 14, fontWeight: 600 }}>{p.nome}</span>
										<button
											onClick={() => handleRemoverParticipante(p.id)}
											className="btn btn--ghost"
											style={{ 
												padding: "4px 8px", 
												fontSize: 12,
												minWidth: 0,
												borderRadius: 6
											}}
										>
											❌
										</button>
									</div>
								))}
							</div>
						) : (
							<p style={{ fontSize: 13, color: "var(--muted)", textAlign: "center", marginTop: 12 }}>
								Nenhuma equipe adicionada ainda
							</p>
						)}
					</div>
				</article>
			)}

			{/* REGISTRAR COLOCAÇÕES (ADMIN) */}
			{adminMode && participantes.length > 0 && (
				<article className="card" style={{ maxWidth: "90vw", margin: "0 auto 16px" }}>
					<div className="card__header">
						<h2 className="card__title">📊 Registrar Colocações do Kahoot</h2>
					</div>
					<div className="card__body" style={{ padding: 0, overflowX: "auto" }}>
						<table className="home-table">
							<thead>
								<tr>
									<th style={{ textAlign: "left" }}>Equipe</th>
									<th style={{ textAlign: "center", minWidth: 180 }}>Colocação no Kahoot</th>
									<th style={{ textAlign: "center", width: 120 }}>Pontos</th>
								</tr>
							</thead>
							<tbody>
								{participantes.map((equipe) => {
									const colocacao = colocacoes[equipe.id] || "";
									const pontos = colocacao ? getPontuacaoPorColocacao(colocacao) : "-";

									return (
										<tr key={equipe.id}>
											<td style={{ fontWeight: 600 }}>{equipe.nome}</td>
											<td style={{ textAlign: "center", padding: "8px 12px" }}>
												<select
													value={colocacao}
													onChange={(e) =>
														handleColocacaoChange(equipe.id, e.target.value)
													}
													style={{
														width: "100%",
														maxWidth: 160,
														padding: "8px 12px",
														borderRadius: 8,
														border: "1px solid var(--border)",
														background: "var(--card)",
														color: "var(--text)",
														fontSize: 14
													}}
												>
													<option value="">Selecione...</option>
													{Array.from({ length: 16 }, (_, i) => i + 1).map((pos) => (
														<option key={pos} value={pos}>
															{pos}º lugar
														</option>
													))}
												</select>
											</td>
											<td style={{ textAlign: "center", fontSize: 16, fontWeight: 700 }}>
												{pontos !== "-" ? (
													<span style={{ color: "var(--primary)" }}>{pontos}</span>
												) : (
													<span style={{ color: "var(--muted)" }}>-</span>
												)}
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				</article>
			)}

			{/* RANKING FINAL */}
			{ranking.length > 0 && (
				<article className="card" style={{ maxWidth: "90vw", margin: "0 auto 16px" }}>
					<div className="card__header">
						<h2 className="card__title">🏆 Ranking Final</h2>
						<p style={{ fontSize: 12, color: "var(--muted)", margin: "6px 0 0 0" }}>
							💡 Pontuação baseada na colocação do Kahoot (1º=160pts, 2º=150pts, 3º=140pts...)
						</p>
					</div>
					<div className="card__body" style={{ padding: 0, overflowX: "auto" }}>
						<table className="home-table">
							<thead>
								<tr style={{ background: "rgba(34,197,94,0.12)" }}>
									<th style={{ textAlign: "center", width: 80 }}>Posição</th>
									<th style={{ textAlign: "left" }}>Equipe</th>
									<th style={{ textAlign: "center", width: 140 }}>Colocação Kahoot</th>
									<th style={{ textAlign: "center", width: 120 }}>Pontos</th>
								</tr>
							</thead>
							<tbody>
								{ranking.map((item, index) => {
									let medalha = "";
									if (index === 0) medalha = "🥇";
									else if (index === 1) medalha = "🥈";
									else if (index === 2) medalha = "🥉";

									return (
										<tr 
											key={item.id}
											style={{
												background: index < 3 
													? "rgba(34,197,94,0.08)" 
													: undefined
											}}
										>
											<td style={{ textAlign: "center", fontSize: 16, fontWeight: 700 }}>
												{medalha} {index + 1}º
											</td>
											<td style={{ fontWeight: 600 }}>{item.nome}</td>
											<td style={{ textAlign: "center", fontSize: 15, fontWeight: 600 }}>
												{item.colocacao}º lugar
											</td>
											<td style={{ textAlign: "center" }}>
												<span 
													style={{
														display: "inline-block",
														background: "var(--primary)",
														color: "#092227",
														fontWeight: 700,
														padding: "4px 14px",
														borderRadius: 20,
														fontSize: 15
													}}
												>
													{item.pontos}
												</span>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>

					{/* Ação Admin: Salvar no Ranking Geral */}
					{adminMode && (
						<div style={{ padding: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
							<button
								className="btn btn--primary"
								disabled={savingRanking}
								onClick={async () => {
									setSavingRanking(true);
									setMsgRanking(null);
									try {
										const payload = ranking.map((item) => ({
											// item.index já ordena por colocação; API definirá posicao
											equipe: item.nome,
											equipeId: item.id,
											pontos: item.pontos,
										}));

										const res = await saveRankingModalidade(modalidade.id, payload);
										if (res.success) {
											setMsgRanking({ tipo: 'sucesso', texto: '✅ Ranking salvo no Ranking Geral!' });
										} else {
											setMsgRanking({ tipo: 'erro', texto: `❌ Falha ao salvar: ${res.error || 'Desconhecido'}` });
										}
									} catch (err) {
										console.error('Erro ao salvar ranking geral (Kahoot):', err);
										setMsgRanking({ tipo: 'erro', texto: '❌ Erro ao salvar no Ranking Geral.' });
									} finally {
										setSavingRanking(false);
										setTimeout(() => setMsgRanking(null), 3000);
									}
								}}
							>
								💾 Salvar no Ranking Geral
							</button>
							{msgRanking && (
								<div style={{
									marginTop: 8,
									padding: '8px 12px',
									borderRadius: 8,
									fontSize: 14,
									background: msgRanking.tipo === 'sucesso' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
									color: msgRanking.tipo === 'sucesso' ? '#22c55e' : '#ef4444',
									border: `1px solid ${msgRanking.tipo === 'sucesso' ? '#22c55e' : '#ef4444'}20`
								}}>
									{msgRanking.texto}
								</div>
							)}
						</div>
					)}
				</article>
			)}

			{/* MENSAGEM SE NÃO HOUVER DADOS */}
			{!adminMode && ranking.length === 0 && (
				<article className="card" style={{ maxWidth: "90vw", margin: "0 auto" }}>
					<div className="card__body" style={{ textAlign: "center", padding: "40px 20px" }}>
						<p style={{ fontSize: 15, color: "var(--muted)" }}>
							⏳ Ainda não há resultados registrados para esta modalidade.
						</p>
					</div>
				</article>
			)}
		</div>
	);
};

export default SistemaKahoot;
