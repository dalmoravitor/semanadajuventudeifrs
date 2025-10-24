import React, { useState, useMemo, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../api/firebase';
import { getEquipes } from '../../api/equipes';
import { saveRankingModalidade } from '../../api/ranking';

/**
 * Sistema de Pontuação Acumulada (Soletrando, Xadrez, Tiro de Laço)
 * COPIADO EXATAMENTE DO ORIGINAL ModalidadeDetalhe.jsx linha 4790-5154
 */
function SistemaPontuacaoAcumulada({ adminMode, modalidade }) {
	// Estado para participantes (agora objetos com id e nome)
	const [participantes, setParticipantes] = useState([]);
	const [todasEquipes, setTodasEquipes] = useState([]);
	const [equipesSelecionada, setEquipeSelecionada] = useState("");
	const [loading, setLoading] = useState(true);

	// Estado para pontuações por rodada
	const [pontuacoes, setPontuacoes] = useState({});
	
	// Detectar configuração da modalidade
	const numRodadas = modalidade?.regrasPontuacao?.classificatoria?.rodadas || 
	                   modalidade?.regrasPontuacao?.rodadas || 5;
	const pontosPorAcerto = modalidade?.regrasPontuacao?.classificatoria?.acerto || 1;
	
	// Para Tiro de Laço: pontuação específica por armada
	const isTiroLaco = modalidade?.id?.includes("tiro_laco");
	const pontuacaoLaco = { 1: 10, 2: 9, 3: 8, 4: 7, 5: 1 };

	// Carregar equipes e dados do Firestore ao montar
	useEffect(() => {
		const carregarDados = async () => {
			try {
				// Carregar todas as equipes
				console.log('🔄 Carregando equipes...');
				const response = await getEquipes();
				console.log('📦 Resposta getEquipes:', response);
				
				if (response.success && response.data) {
					console.log('✅ Equipes carregadas:', response.data.length);
					setTodasEquipes(response.data);
				} else {
					console.error("❌ Erro ao carregar equipes:", response.error);
					setTodasEquipes([]);
				}

				// Carregar dados salvos do Firestore
				if (modalidade?.id) {
					const docRef = doc(db, 'pontuacaoAcumulada', modalidade.id);
					const docSnap = await getDoc(docRef);
					
					if (docSnap.exists()) {
						const dados = docSnap.data();
						setParticipantes(dados.participantes || []);
						setPontuacoes(dados.pontuacoes || {});
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

	// Salvar dados no Firestore
	const salvarNoFirebase = async (dados) => {
		if (!modalidade?.id) return;

		try {
			const docRef = doc(db, 'pontuacaoAcumulada', modalidade.id);
			const docSnap = await getDoc(docRef);

			const dadosParaSalvar = {
				participantes: dados.participantes,
				pontuacoes: dados.pontuacoes,
				modalidadeId: modalidade.id,
				modalidadeNome: modalidade.nome,
				ultimaAtualizacao: new Date().toISOString()
			};

			if (docSnap.exists()) {
				await updateDoc(docRef, dadosParaSalvar);
			} else {
				await setDoc(docRef, dadosParaSalvar);
			}
		} catch (error) {
			console.error("Erro ao salvar no Firestore:", error);
			alert("Erro ao salvar dados. Tente novamente.");
		}
	};

	// Adicionar participante via dropdown
	const handleAdicionarParticipante = () => {
		if (!equipesSelecionada) {
			alert("Selecione uma equipe");
			return;
		}

		const equipeSelecionada = todasEquipes.find(eq => eq.id === equipesSelecionada);
		if (!equipeSelecionada) return;

		// Verificar se já foi adicionada
		if (participantes.some(p => p.id === equipeSelecionada.id)) {
			alert("Esta equipe já foi adicionada");
			return;
		}
		
		// Criar estrutura de pontuação inicial
		const novosPontos = {};
		for (let i = 1; i <= numRodadas; i++) {
			novosPontos[`rodada${i}`] = "";
		}
		
		const novosParticipantes = [...participantes, equipeSelecionada];
		const novasPontuacoes = {
			...pontuacoes,
			[equipeSelecionada.id]: novosPontos
		};

		setParticipantes(novosParticipantes);
		setPontuacoes(novasPontuacoes);
		setEquipeSelecionada("");

		// Salvar no Firestore
		salvarNoFirebase({
			participantes: novosParticipantes,
			pontuacoes: novasPontuacoes
		});
	};

	// Remover participante
	const handleRemoverParticipante = (equipeId) => {
		const equipe = participantes.find(p => p.id === equipeId);
		if (window.confirm(`Remover "${equipe?.nome}"?`)) {
			const novosParticipantes = participantes.filter(p => p.id !== equipeId);
			const novasPontuacoes = { ...pontuacoes };
			delete novasPontuacoes[equipeId];

			setParticipantes(novosParticipantes);
			setPontuacoes(novasPontuacoes);

			// Salvar no Firestore
			salvarNoFirebase({
				participantes: novosParticipantes,
				pontuacoes: novasPontuacoes
			});
		}
	};

	// Atualizar pontuação de uma rodada
	const handlePontuacaoChange = (equipeId, rodada, valor) => {
		const valorNum = parseFloat(valor) || 0;
		
		const novasPontuacoes = {
			...pontuacoes,
			[equipeId]: {
				...pontuacoes[equipeId],
				[rodada]: valorNum
			}
		};

		setPontuacoes(novasPontuacoes);

		// Salvar no Firestore (auto-save)
		salvarNoFirebase({
			participantes,
			pontuacoes: novasPontuacoes
		});
	};

	// Calcular total de pontos
	const calcularTotal = (equipeId) => {
		let total = 0;
		const pontos = pontuacoes[equipeId] || {};
		Object.values(pontos).forEach(p => {
			total += parseFloat(p) || 0;
		});
		return total;
	};

	// Criar ranking ordenado
	const ranking = useMemo(() => {
		return participantes
			.map(equipe => ({
				id: equipe.id,
				nome: equipe.nome,
				pontuacaoTotal: calcularTotal(equipe.id),
				rodadas: pontuacoes[equipe.id] || {}
			}))
			.sort((a, b) => b.pontuacaoTotal - a.pontuacaoTotal);
	}, [participantes, pontuacoes]);

	// Pontuação final por posição
	const getPontuacaoPorPosicao = (posicao) => {
		const pontos = [160, 150, 140, 130, 120, 110, 100, 90, 80, 70, 60, 50, 40, 30, 20, 10];
		return pontos[posicao - 1] || 0;
	};

	// Estado de salvamento de ranking geral
	const [savingRanking, setSavingRanking] = useState(false);
	const [msgRanking, setMsgRanking] = useState(null);

	// Equipes disponíveis (não adicionadas ainda)
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
			{/* Gerenciamento de Participantes */}
			{adminMode && (
				<article className="card" style={{ maxWidth: "90vw", margin: "0 auto" }}>
					<div className="card__header">
						<h2 className="card__title">👥 Gerenciar Participantes</h2>
					</div>
					<div className="card__body">
						{/* Adicionar novo participante via dropdown */}
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

			{/* Tabela de Pontuação por Rodada */}
			{adminMode && participantes.length > 0 && (
				<article className="card" style={{ marginTop: 24, maxWidth: "90vw", margin: "24px auto 0" }}>
					<div className="card__header">
						<h2 className="card__title">
							📊 Registro de Pontuação {isTiroLaco ? "(Armadas)" : "(Rodadas)"}
						</h2>
					</div>
					<div className="card__body">
						<div style={{ overflowX: "auto" }}>
							<table className="table">
								<thead>
									<tr>
										<th style={{ minWidth: 150 }}>Participante</th>
										{Array.from({ length: numRodadas }, (_, i) => (
											<th key={i} style={{ minWidth: 100 }}>
												{isTiroLaco ? `Armada ${i + 1}` : `Rodada ${i + 1}`}
												{isTiroLaco && (
													<div style={{ fontSize: 11, color: "var(--muted)", fontWeight: "normal" }}>
														(máx. {pontuacaoLaco[i + 1]}pts)
													</div>
												)}
											</th>
										))}
										<th style={{ minWidth: 100 }}>Total</th>
									</tr>
								</thead>
								<tbody>
									{participantes.map(equipe => (
										<tr key={equipe.id}>
											<td><strong>{equipe.nome}</strong></td>
											{Array.from({ length: numRodadas }, (_, i) => {
												const rodada = `rodada${i + 1}`;
												const maxPontos = isTiroLaco ? pontuacaoLaco[i + 1] : undefined;
												
												return (
													<td key={i}>
														<input
															type="number"
															min="0"
															max={maxPontos}
															step={isTiroLaco ? 1 : 0.5}
															value={pontuacoes[equipe.id]?.[rodada] || ""}
															onChange={(e) => {
																const valor = e.target.value;
																if (maxPontos && parseFloat(valor) > maxPontos) {
																	alert(`Pontuação máxima para esta ${isTiroLaco ? 'armada' : 'rodada'} é ${maxPontos}`);
																	return;
																}
																handlePontuacaoChange(equipe.id, rodada, valor);
															}}
															placeholder="0"
															style={{
																width: 70,
																padding: "6px 10px",
																borderRadius: 6,
																border: "1px solid var(--border)",
																background: "var(--card)",
																color: "var(--text)",
																fontSize: 14
															}}
														/>
													</td>
												);
											})}
											<td>
												<strong style={{ color: "var(--primary)", fontSize: 16 }}>
													{calcularTotal(equipe.id).toFixed(1)}
												</strong>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>

						{/* Informações adicionais */}
						<div style={{ marginTop: 16, padding: 12, background: "rgba(251, 191, 36, 0.1)", borderRadius: 8, border: "1px solid rgba(251, 191, 36, 0.3)" }}>
							{isTiroLaco ? (
								<>
									<p style={{ margin: 0, fontSize: 13 }}>
										🎯 <strong>Pontuação por armada:</strong> 1ª=10pts, 2ª=9pts, 3ª=8pts, 4ª=7pts, 5ª=1pt
									</p>
									<p style={{ margin: "8px 0 0 0", fontSize: 13, color: "var(--muted)" }}>
										⏱️ Tempo por armada: {modalidade?.regrasPontuacao?.tempoPorArmadaSeg || 60} segundos
									</p>
								</>
							) : (
								<p style={{ margin: 0, fontSize: 13 }}>
									📝 <strong>Pontuação:</strong> {pontosPorAcerto} ponto(s) por acerto
								</p>
							)}
						</div>

							{/* Ação Admin: Salvar no Ranking Geral */}
							{adminMode && ranking.length > 0 && (
								<div style={{ padding: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
									<button
										className="btn btn--primary"
										disabled={savingRanking}
										onClick={async () => {
											setSavingRanking(true);
											setMsgRanking(null);
											try {
												const payload = ranking.map((item, idx) => ({
													equipe: item.nome,
													equipeId: item.id,
													pontos: getPontuacaoPorPosicao(idx + 1)
												}));

												const res = await saveRankingModalidade(modalidade.id, payload);
												if (res.success) {
													setMsgRanking({ tipo: 'sucesso', texto: '✅ Ranking salvo no Ranking Geral!' });
												} else {
													setMsgRanking({ tipo: 'erro', texto: `❌ Falha ao salvar: ${res.error || 'Desconhecido'}` });
												}
											} catch (err) {
												console.error('Erro ao salvar ranking geral (Acumulada):', err);
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
					</div>
				</article>
			)}

			{/* Ranking Final */}
			{participantes.length > 0 && (
				<article className="card" style={{ marginTop: 24, maxWidth: "90vw", margin: "24px auto 0" }}>
					<div className="card__header">
						<h2 className="card__title">🏆 Classificação Final</h2>
					</div>
					<div className="card__body">
						<div style={{ overflowX: "auto" }}>
							<table className="table">
								<thead>
									<tr>
										<th style={{ width: 60 }}>Pos</th>
										<th style={{ minWidth: 150 }}>Participante</th>
										{Array.from({ length: numRodadas }, (_, i) => (
											<th key={i} style={{ minWidth: 80 }}>
												{isTiroLaco ? `A${i + 1}` : `R${i + 1}`}
											</th>
										))}
										<th style={{ minWidth: 100 }}>Total Pts</th>
										<th style={{ minWidth: 100 }}>Pontos Finais</th>
									</tr>
								</thead>
								<tbody>
									{ranking.map((item, idx) => {
										const posicao = idx + 1;
										const pontosFinal = getPontuacaoPorPosicao(posicao);
										const isTop3 = posicao <= 3;

										return (
											<tr key={item.id}>
												<td>
													<strong style={{ fontSize: 16 }}>
														{posicao === 1 && "🥇"}
														{posicao === 2 && "🥈"}
														{posicao === 3 && "🥉"}
														{posicao > 3 && posicao + "º"}
													</strong>
												</td>
												<td>
													<strong style={{ color: isTop3 ? "var(--primary)" : "inherit" }}>
														{item.nome}
													</strong>
												</td>
												{Array.from({ length: numRodadas }, (_, i) => {
													const rodada = `rodada${i + 1}`;
													return (
														<td key={i}>
															{(item.rodadas[rodada] || 0)}
														</td>
													);
												})}
												<td>
													<strong style={{ fontSize: 16, color: "var(--primary)" }}>
														{item.pontuacaoTotal.toFixed(1)}
													</strong>
												</td>
												<td>
													<strong style={{ 
														fontSize: 18, 
														color: isTop3 ? "var(--accent)" : "var(--text)",
														fontWeight: "bold"
													}}>
														{pontosFinal}pts
													</strong>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>

						{/* Critérios de Desempate */}
						{modalidade?.criterioDesempate && (
							<div style={{ marginTop: 16, padding: 12, background: "rgba(59, 130, 246, 0.1)", borderRadius: 8, border: "1px solid rgba(59, 130, 246, 0.3)" }}>
								<h4 style={{ margin: "0 0 8px 0", fontSize: 14, color: "var(--text)" }}>
									📋 Critérios de Desempate:
								</h4>
								<ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "var(--muted)" }}>
									{modalidade.criterioDesempate.map((criterio, idx) => (
										<li key={idx} style={{ marginBottom: 4 }}>{criterio}</li>
									))}
								</ul>
							</div>
						)}
					</div>
				</article>
			)}
		</div>
	);
}

export default SistemaPontuacaoAcumulada;
