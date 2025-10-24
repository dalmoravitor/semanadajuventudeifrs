import React, { useState, useMemo, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../api/firebase';
import { getEquipes } from '../../api/equipes';

/**
 * Sistema de Bateria Única (Atletismo 800m, 1500m, etc)
 * Sistema simplificado: apenas registra a posição final de cada equipe
 */
function SistemaBateriaUnica({ adminMode, modalidade }) {
	// Estados
	const [participantes, setParticipantes] = useState([]);
	const [todasEquipes, setTodasEquipes] = useState([]);
	const [equipeSelecionada, setEquipeSelecionada] = useState("");
	const [loading, setLoading] = useState(true);
	
	// Posições: { equipeId: posicao }
	const [posicoes, setPosicoes] = useState({});

	// ========================================
	// CARREGAR DADOS DO FIRESTORE
	// ========================================
	
	useEffect(() => {
		const carregarDados = async () => {
			try {
				console.log('🔄 Carregando dados do Sistema Bateria Única...');
				
				// Carregar equipes
				const response = await getEquipes();
				if (response.success && response.data) {
					console.log('✅ Equipes carregadas:', response.data.length);
					setTodasEquipes(response.data);
				} else {
					console.log('⚠️ Nenhuma equipe encontrada');
					setTodasEquipes([]);
				}

				// Carregar dados salvos do Firestore
				if (modalidade?.id) {
					const docRef = doc(db, 'sistemaBateriaUnica', modalidade.id);
					const docSnap = await getDoc(docRef);

					if (docSnap.exists()) {
						const dados = docSnap.data();
						console.log('✅ Dados carregados do Firestore:', dados);
						
						if (dados.participantes) {
							setParticipantes(dados.participantes);
						}
						if (dados.posicoes) {
							setPosicoes(dados.posicoes);
						}
					} else {
						console.log('ℹ️ Nenhum dado salvo encontrado');
					}
				}
			} catch (error) {
				console.error('❌ Erro ao carregar dados:', error);
			} finally {
				setLoading(false);
			}
		};

		carregarDados();
	}, [modalidade?.id]);

	// ========================================
	// SALVAR NO FIRESTORE
	// ========================================
	
	const salvarNoFirebase = async (dados) => {
		if (!modalidade?.id) {
			console.error('❌ ID da modalidade não encontrado');
			return;
		}

		try {
			const docRef = doc(db, 'sistemaBateriaUnica', modalidade.id);
			const dadosParaSalvar = {
				...dados,
				modalidadeId: modalidade.id,
				ultimaAtualizacao: new Date().toISOString()
			};

			const docSnap = await getDoc(docRef);
			
			if (docSnap.exists()) {
				await updateDoc(docRef, dadosParaSalvar);
				console.log('✅ Dados atualizados no Firestore');
			} else {
				await setDoc(docRef, dadosParaSalvar);
				console.log('✅ Documento criado no Firestore');
			}
		} catch (error) {
			console.error('❌ Erro ao salvar no Firestore:', error);
			alert('Erro ao salvar dados. Verifique o console.');
		}
	};

	// ========================================
	// GERENCIAR PARTICIPANTES
	// ========================================
	
	const handleAdicionarParticipante = () => {
		if (!equipeSelecionada) {
			alert("Selecione uma equipe");
			return;
		}

		const equipeSelecionadaObj = todasEquipes.find(eq => eq.id === equipeSelecionada);
		if (!equipeSelecionadaObj) {
			alert("Equipe não encontrada");
			return;
		}

		if (participantes.some(p => p.id === equipeSelecionada)) {
			alert("Esta equipe já foi adicionada");
			return;
		}

		const novosParticipantes = [...participantes, { id: equipeSelecionadaObj.id, nome: equipeSelecionadaObj.nome }];
		setParticipantes(novosParticipantes);
		
		// Inicializar posição vazia
		const novasPosicoes = {
			...posicoes,
			[equipeSelecionadaObj.id]: ""
		};
		setPosicoes(novasPosicoes);
		
		setEquipeSelecionada("");

		// Salvar no Firestore
		salvarNoFirebase({
			participantes: novosParticipantes,
			posicoes: novasPosicoes
		});
	};

	const handleRemoverParticipante = (equipeId) => {
		const equipe = participantes.find(p => p.id === equipeId);
		if (!equipe) return;

		if (window.confirm(`Remover "${equipe.nome}"?`)) {
			const novosParticipantes = participantes.filter(p => p.id !== equipeId);
			setParticipantes(novosParticipantes);
			
			const novasPosicoes = { ...posicoes };
			delete novasPosicoes[equipeId];
			setPosicoes(novasPosicoes);

			// Salvar no Firestore
			salvarNoFirebase({
				participantes: novosParticipantes,
				posicoes: novasPosicoes
			});
		}
	};

	// ========================================
	// REGISTRAR POSIÇÕES
	// ========================================
	
	const handlePosicaoChange = (equipeId, posicao) => {
		const novasPosicoes = {
			...posicoes,
			[equipeId]: posicao
		};
		setPosicoes(novasPosicoes);

		// Salvar no Firestore
		salvarNoFirebase({
			participantes,
			posicoes: novasPosicoes
		});
	};

	// ========================================
	// RANKING
	// ========================================
	
	const ranking = useMemo(() => {
		return participantes
			.map(equipe => ({
				id: equipe.id,
				nome: equipe.nome,
				posicao: parseInt(posicoes[equipe.id]) || null
			}))
			.filter(item => item.posicao !== null)
			.sort((a, b) => a.posicao - b.posicao);
	}, [participantes, posicoes]);

	// Pontuação por posição
	const getPontuacaoPorPosicao = (posicao) => {
		const pontos = [160, 150, 140, 130, 120, 110, 100, 90, 80, 70, 60, 50, 40, 30, 20, 10];
		return pontos[posicao - 1] || 0;
	};

	// Equipes disponíveis para seleção
	const equipesDisponiveis = Array.isArray(todasEquipes) 
		? todasEquipes.filter(eq => !participantes.some(p => p.id === eq.id))
		: [];

	if (loading) {
		return (
			<div style={{ textAlign: "center", padding: "40px 20px" }}>
				<p style={{ fontSize: 16, color: "var(--muted)" }}>⏳ Carregando dados...</p>
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
						<p style={{ fontSize: 13, color: "var(--muted)", margin: "8px 0 0 0" }}>
							✅ <strong>Bateria Única:</strong> Todos competem juntos, classificação direta por posição
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
								disabled={!equipeSelecionada}
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

			{/* Registro de Posições */}
			{adminMode && participantes.length > 0 && (
				<article className="card" style={{ marginTop: 24, maxWidth: "90vw", margin: "24px auto 0" }}>
					<div className="card__header">
						<h2 className="card__title">🏁 Registrar Posições</h2>
					</div>
					<div className="card__body">
						<div style={{ overflowX: "auto" }}>
							<table className="table">
								<thead>
									<tr>
										<th style={{ minWidth: 200 }}>Equipe</th>
										<th style={{ minWidth: 150 }}>Posição</th>
									</tr>
								</thead>
								<tbody>
									{participantes.map(equipe => (
										<tr key={equipe.id}>
											<td><strong>{equipe.nome}</strong></td>
											<td>
												<select
													value={posicoes[equipe.id] || ""}
													onChange={(e) => handlePosicaoChange(equipe.id, e.target.value)}
													style={{
														width: 120,
														padding: "8px 12px",
														borderRadius: 6,
														border: "1px solid var(--border)",
														background: "var(--card)",
														color: "var(--text)",
														fontSize: 14
													}}
												>
													<option value="">Selecione...</option>
													{Array.from({ length: 20 }, (_, i) => i + 1).map(pos => (
														<option key={pos} value={pos}>
															{pos}º lugar
														</option>
													))}
												</select>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>

						<div style={{ marginTop: 16, padding: 12, background: "rgba(251, 191, 36, 0.1)", borderRadius: 8, border: "1px solid rgba(251, 191, 36, 0.3)" }}>
							<p style={{ margin: 0, fontSize: 13 }}>
								📊 <strong>Dica:</strong> Registre a posição final de cada equipe após a corrida. O sistema automaticamente calcula a pontuação.
							</p>
						</div>
					</div>
				</article>
			)}

			{/* Ranking Final */}
			{ranking.length > 0 && (
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
										<th style={{ minWidth: 200 }}>Equipe</th>
										<th style={{ minWidth: 100 }}>Pontos</th>
									</tr>
								</thead>
								<tbody>
									{ranking.map((item) => {
										const pontosFinal = getPontuacaoPorPosicao(item.posicao);
										const isTop3 = item.posicao <= 3;

										return (
											<tr key={item.id}>
												<td>
													<strong style={{ fontSize: 16 }}>
														{item.posicao === 1 && "🥇"}
														{item.posicao === 2 && "🥈"}
														{item.posicao === 3 && "🥉"}
														{item.posicao > 3 && item.posicao + "º"}
													</strong>
												</td>
												<td>
													<strong style={{ color: isTop3 ? "var(--primary)" : "inherit" }}>
														{item.nome}
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

export default SistemaBateriaUnica;
