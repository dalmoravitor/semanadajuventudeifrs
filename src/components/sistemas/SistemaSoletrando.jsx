import React, { useState, useMemo, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../api/firebase';
import { getEquipes } from '../../api/equipes';

/**
 * Sistema Específico para Soletrando
 * 
 * REGRAS:
 * - Times de 3 estudantes
 * - Fase Classificatória: 3 rodadas, 1 ponto por acerto (máx 3 pontos)
 * - Classificam-se 5 equipes para a final
 * - Fase Final: Eliminatória
 * - Classificação final: 1º-5º por ordem de eliminação inversa
 * - 6º-14º lugar: Por pontuação da classificatória
 */
function SistemaSoletrando({ adminMode, modalidade }) {
	// Estados
	const [participantes, setParticipantes] = useState([]);
	const [todasEquipes, setTodasEquipes] = useState([]);
	const [equipesSelecionada, setEquipeSelecionada] = useState("");
	const [loading, setLoading] = useState(true);
	
	// Pontuações da fase classificatória (até 6 rodadas para critério de desempate)
	const [pontosClassificatoria, setPontosClassificatoria] = useState({});
	
	// Fase Final
	const [faseAtual, setFaseAtual] = useState("classificatoria"); // "classificatoria" ou "final"
	const [classificadosFinal, setClassificadosFinal] = useState([]);
	const [ordemEliminacao, setOrdemEliminacao] = useState([]); // IDs das equipes eliminadas (ordem de eliminação)

	const NUM_RODADAS_OBRIGATORIAS = 3; // Rodadas obrigatórias
	const NUM_RODADAS_DESEMPATE = 6; // Total de rodadas incluindo desempate
	const NUM_CLASSIFICADOS_FINAL = 5;

	// ========================================
	// CARREGAR DADOS
	// ========================================
	
	useEffect(() => {
		const carregarDados = async () => {
			try {
				console.log('🔄 Carregando dados do Soletrando...');
				
				// Carregar equipes
				const response = await getEquipes();
				if (response.success && response.data) {
					console.log('✅ Equipes carregadas:', response.data.length);
					setTodasEquipes(response.data);
				} else {
					setTodasEquipes([]);
				}

				// Carregar dados salvos
				if (modalidade?.id) {
					const docRef = doc(db, 'soletrando', modalidade.id);
					const docSnap = await getDoc(docRef);
					
					if (docSnap.exists()) {
						const dados = docSnap.data();
						setParticipantes(dados.participantes || []);
						setPontosClassificatoria(dados.pontosClassificatoria || {});
						setFaseAtual(dados.faseAtual || "classificatoria");
						setClassificadosFinal(dados.classificadosFinal || []);
						setOrdemEliminacao(dados.ordemEliminacao || []);
					}
				}
			} catch (error) {
				console.error("❌ Erro ao carregar dados:", error);
				setTodasEquipes([]);
			} finally {
				setLoading(false);
			}
		};

		carregarDados();
	}, [modalidade?.id]);

	// ========================================
	// SALVAR NO FIRESTORE
	// ========================================
	
	const salvarNoFirebase = async (dadosAtualizados) => {
		if (!modalidade?.id) return;

		try {
			const docRef = doc(db, 'soletrando', modalidade.id);
			const docSnap = await getDoc(docRef);

			const dadosParaSalvar = {
				...dadosAtualizados,
				modalidadeId: modalidade.id,
				modalidadeNome: modalidade.nome,
				ultimaAtualizacao: new Date().toISOString()
			};

			if (docSnap.exists()) {
				await updateDoc(docRef, dadosParaSalvar);
			} else {
				await setDoc(docRef, dadosParaSalvar);
			}
			
			console.log('✅ Dados salvos no Firestore');
		} catch (error) {
			console.error("❌ Erro ao salvar:", error);
			alert("Erro ao salvar dados. Tente novamente.");
		}
	};

	// ========================================
	// GERENCIAR PARTICIPANTES
	// ========================================
	
	const handleAdicionarParticipante = () => {
		if (!equipesSelecionada) {
			alert("Selecione uma equipe");
			return;
		}

		const equipeSelecionada = todasEquipes.find(eq => eq.id === equipesSelecionada);
		if (!equipeSelecionada) return;

		if (participantes.some(p => p.id === equipeSelecionada.id)) {
			alert("Esta equipe já foi adicionada");
			return;
		}
		
		// Inicializar pontos da classificatória (até 6 rodadas)
		const novosPontos = {};
		for (let i = 1; i <= NUM_RODADAS_DESEMPATE; i++) {
			novosPontos[`rodada${i}`] = 0;
		}
		
		const novosParticipantes = [...participantes, equipeSelecionada];
		const novosPontosClassificatoria = {
			...pontosClassificatoria,
			[equipeSelecionada.id]: novosPontos
		};

		setParticipantes(novosParticipantes);
		setPontosClassificatoria(novosPontosClassificatoria);
		setEquipeSelecionada("");

		salvarNoFirebase({
			participantes: novosParticipantes,
			pontosClassificatoria: novosPontosClassificatoria,
			faseAtual,
			classificadosFinal,
			ordemEliminacao
		});
	};

	const handleRemoverParticipante = (equipeId) => {
		const equipe = participantes.find(p => p.id === equipeId);
		if (window.confirm(`Remover "${equipe?.nome}"?`)) {
			const novosParticipantes = participantes.filter(p => p.id !== equipeId);
			const novosPontos = { ...pontosClassificatoria };
			delete novosPontos[equipeId];

			setParticipantes(novosParticipantes);
			setPontosClassificatoria(novosPontos);

			salvarNoFirebase({
				participantes: novosParticipantes,
				pontosClassificatoria: novosPontos,
				faseAtual,
				classificadosFinal,
				ordemEliminacao
			});
		}
	};

	// ========================================
	// FASE CLASSIFICATÓRIA
	// ========================================
	
	const handlePontoChange = (equipeId, rodada, valor) => {
		const valorNum = Math.min(1, Math.max(0, parseInt(valor) || 0)); // 0 ou 1
		
		const novosPontos = {
			...pontosClassificatoria,
			[equipeId]: {
				...pontosClassificatoria[equipeId],
				[rodada]: valorNum
			}
		};

		setPontosClassificatoria(novosPontos);

		salvarNoFirebase({
			participantes,
			pontosClassificatoria: novosPontos,
			faseAtual,
			classificadosFinal,
			ordemEliminacao
		});
	};

	const calcularTotalClassificatoria = (equipeId) => {
		const pontos = pontosClassificatoria[equipeId] || {};
		let total = 0;
		// Contar apenas as 3 rodadas obrigatórias para o total
		for (let i = 1; i <= NUM_RODADAS_OBRIGATORIAS; i++) {
			total += (pontos[`rodada${i}`] || 0);
		}
		return total;
	};

	// Ranking da fase classificatória
	const rankingClassificatoria = useMemo(() => {
		return participantes
			.map(equipe => ({
				id: equipe.id,
				nome: equipe.nome,
				pontuacao: calcularTotalClassificatoria(equipe.id),
				pontos: pontosClassificatoria[equipe.id] || {}
			}))
			.sort((a, b) => b.pontuacao - a.pontuacao);
	}, [participantes, pontosClassificatoria]);

	// ========================================
	// AVANÇAR PARA FASE FINAL
	// ========================================
	
	const handleAvancarParaFinal = () => {
		if (rankingClassificatoria.length < NUM_CLASSIFICADOS_FINAL) {
			alert(`É necessário ter pelo menos ${NUM_CLASSIFICADOS_FINAL} equipes para avançar para a final.`);
			return;
		}

		if (!window.confirm(`Confirmar avanço para fase final? As ${NUM_CLASSIFICADOS_FINAL} primeiras equipes serão classificadas.`)) {
			return;
		}

		const top5 = rankingClassificatoria.slice(0, NUM_CLASSIFICADOS_FINAL);
		
		setFaseAtual("final");
		setClassificadosFinal(top5);
		setOrdemEliminacao([]);

		salvarNoFirebase({
			participantes,
			pontosClassificatoria,
			faseAtual: "final",
			classificadosFinal: top5,
			ordemEliminacao: []
		});
	};

	// ========================================
	// FASE FINAL - ELIMINAÇÃO
	// ========================================
	
	const handleEliminar = (equipeId) => {
		if (!window.confirm("Confirmar eliminação desta equipe?")) return;

		const novaOrdem = [...ordemEliminacao, equipeId];
		setOrdemEliminacao(novaOrdem);

		salvarNoFirebase({
			participantes,
			pontosClassificatoria,
			faseAtual,
			classificadosFinal,
			ordemEliminacao: novaOrdem
		});
	};

	const handleCancelarEliminacao = () => {
		if (ordemEliminacao.length === 0) return;
		
		if (!window.confirm("Cancelar última eliminação?")) return;

		const novaOrdem = ordemEliminacao.slice(0, -1);
		setOrdemEliminacao(novaOrdem);

		salvarNoFirebase({
			participantes,
			pontosClassificatoria,
			faseAtual,
			classificadosFinal,
			ordemEliminacao: novaOrdem
		});
	};

	// ========================================
	// RANKING FINAL
	// ========================================
	
	const rankingFinal = useMemo(() => {
		if (faseAtual === "classificatoria") {
			return rankingClassificatoria;
		}

		// Fase Final: ranking especial
		const resultado = [];
		
		// 1º lugar: equipe não eliminada (se houver apenas 1 restante)
		const equipesRestantes = classificadosFinal.filter(eq => !ordemEliminacao.includes(eq.id));
		if (equipesRestantes.length === 1) {
			resultado.push({
				...equipesRestantes[0],
				posicao: 1,
				classificacao: "Campeão",
				pontuacaoClassificatoria: calcularTotalClassificatoria(equipesRestantes[0].id)
			});
		} else {
			// Ainda há equipes na disputa
			equipesRestantes.forEach(eq => {
				resultado.push({
					...eq,
					posicao: null,
					classificacao: "Em disputa",
					pontuacaoClassificatoria: calcularTotalClassificatoria(eq.id)
				});
			});
		}

		// 2º a 5º lugar: ordem inversa de eliminação
		const eliminadas = [...ordemEliminacao].reverse();
		eliminadas.forEach((equipeId, idx) => {
			const equipe = classificadosFinal.find(eq => eq.id === equipeId);
			if (equipe) {
				resultado.push({
					...equipe,
					posicao: equipesRestantes.length === 1 ? idx + 2 : null,
					classificacao: equipesRestantes.length === 1 ? `${idx + 2}º lugar` : "Eliminado",
					pontuacaoClassificatoria: calcularTotalClassificatoria(equipe.id),
					ordemEliminacao: idx + 1
				});
			}
		});

		// 6º a 14º lugar: equipes não classificadas, ordenadas por pontos da classificatória
		const naoClassificados = rankingClassificatoria
			.filter(eq => !classificadosFinal.some(c => c.id === eq.id))
			.map((eq, idx) => ({
				...eq,
				posicao: NUM_CLASSIFICADOS_FINAL + idx + 1,
				classificacao: `${NUM_CLASSIFICADOS_FINAL + idx + 1}º lugar`,
				pontuacaoClassificatoria: eq.pontuacao
			}));

		resultado.push(...naoClassificados);

		return resultado;
	}, [faseAtual, classificadosFinal, ordemEliminacao, rankingClassificatoria, pontosClassificatoria]);

	// Pontuação final por posição
	const getPontuacaoPorPosicao = (posicao) => {
		const pontos = [160, 150, 140, 130, 120, 110, 100, 90, 80, 70, 60, 50, 40, 30, 20, 10];
		return pontos[posicao - 1] || 0;
	};

	// Equipes disponíveis
	const equipesDisponiveis = Array.isArray(todasEquipes)
		? todasEquipes.filter(eq => !participantes.some(p => p.id === eq.id))
		: [];

	if (loading) {
		return (
			<div style={{ textAlign: "center", padding: "40px 20px" }}>
				<p style={{ color: "var(--muted)" }}>Carregando dados...</p>
			</div>
		);
	}

	return (
		<div style={{ marginTop: 24, maxWidth: "100%", overflowX: "hidden" }}>
			{/* GERENCIAR PARTICIPANTES */}
			{adminMode && faseAtual === "classificatoria" && (
				<article className="card" style={{ maxWidth: "90vw", margin: "0 auto" }}>
					<div className="card__header">
						<h2 className="card__title">👥 Gerenciar Participantes</h2>
					</div>
					<div className="card__body">
						<div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
							<select
								value={equipesSelecionada}
								onChange={(e) => setEquipeSelecionada(e.target.value)}
								className="inputLogin"
								style={{
									flex: 1,
									minWidth: "200px",
									padding: "10px 14px",
									borderRadius: 8,
									fontSize: 15
								}}
							>
								<option value="">-- Selecione uma equipe --</option>
								{equipesDisponiveis.map(equipe => (
									<option key={equipe.id} value={equipe.id}>
										{equipe.nome}
									</option>
								))}
							</select>
							<button
								onClick={handleAdicionarParticipante}
								className="btn btn--primary"
								style={{ padding: "10px 24px", whiteSpace: "nowrap" }}
								disabled={!equipesSelecionada}
							>
								➕ Adicionar
							</button>
						</div>

						{participantes.length > 0 ? (
							<div style={{ 
								display: "grid", 
								gridTemplateColumns: "repeat(auto-fill, minmax(min(200px, 100%), 1fr))", 
								gap: 12,
								maxWidth: "100%"
							}}>
								{participantes.map((equipe) => (
									<div
										key={equipe.id}
										style={{
											padding: "10px 14px",
											background: "rgba(45, 212, 191, 0.1)",
											border: "1px solid rgba(45, 212, 191, 0.3)",
											borderRadius: 8,
											display: "flex",
											alignItems: "center",
											justifyContent: "space-between"
										}}
									>
										<span style={{ fontWeight: 500, fontSize: 14 }}>{equipe.nome}</span>
										<button
											onClick={() => handleRemoverParticipante(equipe.id)}
											style={{
												padding: "2px 6px",
												background: "rgba(239, 68, 68, 0.2)",
												border: "1px solid rgba(239, 68, 68, 0.4)",
												borderRadius: 4,
												cursor: "pointer",
												fontSize: 11
											}}
											title="Remover"
										>
											🗑️
										</button>
									</div>
								))}
							</div>
						) : (
							<p style={{ textAlign: "center", color: "var(--muted)", padding: "20px 0" }}>
								Nenhum participante adicionado.
							</p>
						)}
					</div>
				</article>
			)}

			{/* FASE CLASSIFICATÓRIA - REGISTRO DE PONTOS */}
			{adminMode && participantes.length > 0 && faseAtual === "classificatoria" && (
				<article className="card" style={{ marginTop: 24, maxWidth: "90vw", margin: "24px auto 0" }}>
					<div className="card__header">
						<h2 className="card__title">📊 Fase Classificatória - Registro de Acertos</h2>
					</div>
					<div className="card__body">
						<div style={{ overflowX: "auto" }}>
							<table className="table">
								<thead>
									<tr>
										<th style={{ minWidth: 150 }}>Equipe</th>
										<th style={{ minWidth: 100 }}>Rodada 1 *</th>
										<th style={{ minWidth: 100 }}>Rodada 2 *</th>
										<th style={{ minWidth: 100 }}>Rodada 3 *</th>
										<th style={{ minWidth: 100 }}>Rodada 4</th>
										<th style={{ minWidth: 100 }}>Rodada 5</th>
										<th style={{ minWidth: 100 }}>Rodada 6</th>
										<th style={{ minWidth: 100 }}>Total</th>
									</tr>
								</thead>
								<tbody>
									{participantes.map(equipe => (
										<tr key={equipe.id}>
											<td><strong>{equipe.nome}</strong></td>
											{Array.from({ length: NUM_RODADAS_DESEMPATE }, (_, i) => {
												const rodada = `rodada${i + 1}`;
												const isObrigatoria = i < NUM_RODADAS_OBRIGATORIAS;
												
												return (
													<td key={rodada}>
														<select
															value={pontosClassificatoria[equipe.id]?.[rodada] || 0}
															onChange={(e) => handlePontoChange(equipe.id, rodada, e.target.value)}
															style={{
																width: 80,
																padding: "6px 10px",
																borderRadius: 6,
																border: "1px solid var(--border)",
																background: "var(--card)",
																color: "var(--text)",
																fontSize: 14,
																opacity: isObrigatoria ? 1 : 0.7
															}}
														>
															<option value="0">❌ Errou (0)</option>
															<option value="1">✅ Acertou (1)</option>
														</select>
													</td>
												);
											})}
											<td>
												<strong style={{ color: "var(--primary)", fontSize: 16 }}>
													{calcularTotalClassificatoria(equipe.id)}
												</strong>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>

						<div style={{ marginTop: 20, padding: 12, background: "rgba(251, 191, 36, 0.1)", borderRadius: 8, border: "1px solid rgba(251, 191, 36, 0.3)" }}>
							<p style={{ margin: 0, fontSize: 13 }}>
								📝 <strong>Regras:</strong> 3 rodadas obrigatórias (marcadas com *). Cada acerto vale 1 ponto (máx 3 pontos).
							</p>
							<p style={{ margin: "8px 0 0 0", fontSize: 13 }}>
								⏱️ Tempo por soletração: 60 segundos
							</p>
							<p style={{ margin: "8px 0 0 0", fontSize: 13, color: "var(--muted)" }}>
								💡 Rodadas 4-6: Usadas apenas para desempate (opcional)
							</p>
						</div>

						{participantes.length >= NUM_CLASSIFICADOS_FINAL && (
							<div style={{ marginTop: 20, textAlign: "center" }}>
								<button
									onClick={handleAvancarParaFinal}
									className="btn btn--primary"
									style={{ padding: "12px 32px", fontSize: 16 }}
								>
									🏆 Avançar para Fase Final (Top 5)
								</button>
							</div>
						)}
					</div>
				</article>
			)}

			{/* FASE FINAL - ELIMINATÓRIA */}
			{adminMode && faseAtual === "final" && classificadosFinal.length > 0 && (
				<article className="card" style={{ marginTop: 24, maxWidth: "90vw", margin: "24px auto 0" }}>
					<div className="card__header">
						<h2 className="card__title">🏆 Fase Final - Eliminatória</h2>
					</div>
					<div className="card__body">
						<div style={{ marginBottom: 20, padding: 12, background: "rgba(59, 130, 246, 0.1)", borderRadius: 8 }}>
							<p style={{ margin: 0, fontSize: 14 }}>
								<strong>Instruções:</strong> Clique em "Eliminar" para registrar a eliminação de uma equipe.
								As equipes são classificadas em ordem inversa de eliminação.
							</p>
						</div>

						<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(300px, 100%), 1fr))", gap: 16 }}>
							{classificadosFinal.map(equipe => {
								const foiEliminada = ordemEliminacao.includes(equipe.id);
								const ordemEliminacaoIdx = ordemEliminacao.indexOf(equipe.id);

								return (
									<div
										key={equipe.id}
										style={{
											padding: "16px",
											background: foiEliminada ? "rgba(239, 68, 68, 0.1)" : "rgba(45, 212, 191, 0.1)",
											border: `2px solid ${foiEliminada ? "rgba(239, 68, 68, 0.4)" : "rgba(45, 212, 191, 0.4)"}`,
											borderRadius: 8
										}}
									>
										<div style={{ marginBottom: 12 }}>
											<strong style={{ fontSize: 16 }}>{equipe.nome}</strong>
											<div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
												Pontos Classificatória: {calcularTotalClassificatoria(equipe.id)}
											</div>
										</div>

										{foiEliminada ? (
											<div style={{ color: "var(--text)", fontSize: 14 }}>
												❌ Eliminada ({ordemEliminacaoIdx + 1}ª)
											</div>
										) : (
											<button
												onClick={() => handleEliminar(equipe.id)}
												className="btn"
												style={{
													width: "100%",
													padding: "8px 16px",
													background: "rgba(239, 68, 68, 0.2)",
													border: "1px solid rgba(239, 68, 68, 0.4)"
												}}
											>
												❌ Eliminar
											</button>
										)}
									</div>
								);
							})}
						</div>

						{ordemEliminacao.length > 0 && (
							<div style={{ marginTop: 20, textAlign: "center" }}>
								<button
									onClick={handleCancelarEliminacao}
									className="btn"
									style={{ padding: "10px 24px" }}
								>
									↩️ Cancelar Última Eliminação
								</button>
							</div>
						)}
					</div>
				</article>
			)}

			{/* CLASSIFICAÇÃO FINAL */}
			{participantes.length > 0 && (
				<article className="card" style={{ marginTop: 24, maxWidth: "90vw", margin: "24px auto 0" }}>
					<div className="card__header">
						<h2 className="card__title">🏆 Classificação {faseAtual === "final" ? "Final" : "Atual"}</h2>
					</div>
					<div className="card__body">
						<div style={{ overflowX: "auto" }}>
							<table className="table">
								<thead>
									<tr>
										<th style={{ width: 60 }}>Pos</th>
										<th style={{ minWidth: 150 }}>Equipe</th>
										<th style={{ minWidth: 50 }}>R1</th>
										<th style={{ minWidth: 50 }}>R2</th>
										<th style={{ minWidth: 50 }}>R3</th>
										<th style={{ minWidth: 50 }}>R4</th>
										<th style={{ minWidth: 50 }}>R5</th>
										<th style={{ minWidth: 50 }}>R6</th>
										<th style={{ minWidth: 80 }}>Total</th>
										{faseAtual === "final" && <th style={{ minWidth: 120 }}>Status</th>}
										<th style={{ minWidth: 100 }}>Pontos Finais</th>
									</tr>
								</thead>
								<tbody>
									{rankingFinal.map((item, idx) => {
										const posicao = item.posicao || (idx + 1);
										const pontosFinal = item.posicao ? getPontuacaoPorPosicao(item.posicao) : 0;
										const isTop3 = posicao <= 3;

										return (
											<tr key={item.id}>
												<td>
													<strong style={{ fontSize: 16 }}>
														{posicao === 1 && "🥇"}
														{posicao === 2 && "🥈"}
														{posicao === 3 && "🥉"}
														{posicao > 3 && item.posicao ? `${posicao}º` : "-"}
													</strong>
												</td>
												<td>
													<strong style={{ color: isTop3 ? "var(--primary)" : "inherit" }}>
														{item.nome}
													</strong>
												</td>
												{/* Rodadas individuais */}
												{Array.from({ length: NUM_RODADAS_DESEMPATE }, (_, i) => {
													const rodada = `rodada${i + 1}`;
													const pontoRodada = item.pontos?.[rodada] || pontosClassificatoria[item.id]?.[rodada] || 0;
													return (
														<td key={rodada} style={{ textAlign: "center" }}>
															{pontoRodada === 1 ? "✅" : "❌"}
														</td>
													);
												})}
												<td>
													<strong style={{ color: "var(--primary)", fontSize: 16 }}>
														{item.pontuacaoClassificatoria}
													</strong>
												</td>
												{faseAtual === "final" && (
													<td>
														<span style={{
															padding: "4px 8px",
															borderRadius: 4,
															fontSize: 12,
															background: item.classificacao === "Campeão" ? "rgba(45, 212, 191, 0.2)" :
																item.classificacao === "Em disputa" ? "rgba(251, 191, 36, 0.2)" :
																item.classificacao === "Eliminado" ? "rgba(239, 68, 68, 0.2)" :
																"rgba(100, 100, 100, 0.2)"
														}}>
															{item.classificacao}
														</span>
													</td>
												)}
												<td>
													<strong style={{ 
														fontSize: 18, 
														color: isTop3 && item.posicao ? "var(--accent)" : "var(--text)",
														fontWeight: "bold"
													}}>
														{item.posicao ? `${pontosFinal}pts` : "-"}
													</strong>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>

						{/* Critérios de Desempate */}
						<div style={{ marginTop: 16, padding: 12, background: "rgba(59, 130, 246, 0.1)", borderRadius: 8, border: "1px solid rgba(59, 130, 246, 0.3)" }}>
							<h4 style={{ margin: "0 0 8px 0", fontSize: 14, color: "var(--text)" }}>
								📋 Critérios de Desempate (Classificatória):
							</h4>
							<ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "var(--muted)" }}>
								<li>Primeira resposta correta</li>
								<li>Segunda resposta correta</li>
								<li>Sucessivamente até a sexta rodada</li>
								<li>Se persistir: eliminatória direta entre empatados</li>
							</ul>
							
							{faseAtual === "final" && (
								<>
									<h4 style={{ margin: "12px 0 8px 0", fontSize: 14, color: "var(--text)" }}>
										📋 Classificação Final:
									</h4>
									<ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "var(--muted)" }}>
										<li>1º lugar: Equipe não eliminada</li>
										<li>2º-5º lugar: Ordem inversa de eliminação</li>
										<li>Empates na mesma rodada: Usa pontuação da classificatória</li>
										<li>6º-14º lugar: Por pontuação da classificatória</li>
									</ul>
								</>
							)}
						</div>
					</div>
				</article>
			)}
		</div>
	);
}

export default SistemaSoletrando;
