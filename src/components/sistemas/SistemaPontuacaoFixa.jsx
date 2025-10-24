import React, { useState, useMemo, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../api/firebase';
import { getEquipes } from '../../api/equipes';
import { gerarRankingPontuacaoFixa } from '../../utils/rankingHelpers';
import { saveRankingModalidade, getRankingModalidade } from '../../api/ranking';

/**
 * Sistema de Pontuação Fixa (Culinária, Show de Talentos)
 * Atualizado para usar dropdowns com equipes do banco de dados
 */
function SistemaPontuacaoFixa({ adminMode, modalidade }) {
	// Estado para todas as equipes do sistema
	const [todasEquipes, setTodasEquipes] = useState([]);
	const [loading, setLoading] = useState(true);

	// Estado para armazenar os participantes (turmas) - agora objetos completos
	const [participantes, setParticipantes] = useState([]);
	const [equipesSelecionada, setEquipeSelecionada] = useState("");

	// Estado para armazenar as notas de cada turma por critério
	const [avaliacoes, setAvaliacoes] = useState({});
	const [rankingSalvo, setRankingSalvo] = useState(false);
	const [savingRanking, setSavingRanking] = useState(false);
	const [msgRanking, setMsgRanking] = useState(null);

	// Buscar critérios da modalidade
	const criterios = modalidade?.regrasPontuacao?.criterios || {};
	const criteriosArray = Object.entries(criterios);

	// ========================================
	// CARREGAR DADOS DO FIRESTORE
	// ========================================
	
	useEffect(() => {
		const carregarDados = async () => {
			if (!modalidade?.id) {
				setLoading(false);
				return;
			}

			try {
				// Carregar todas as equipes do sistema
				console.log('🔄 Carregando equipes...');
				const responseEquipes = await getEquipes();
				console.log('📦 Resposta getEquipes:', responseEquipes);
				
				if (responseEquipes.success) {
					console.log('✅ Equipes carregadas:', responseEquipes.data.length);
					setTodasEquipes(responseEquipes.data);
				} else {
					console.error("❌ Erro ao carregar equipes:", responseEquipes.error);
					setTodasEquipes([]);
				}

				// Carregar dados salvos no Firestore
				const docRef = doc(db, 'pontuacaoFixa', modalidade.id);
				const docSnap = await getDoc(docRef);

				if (docSnap.exists()) {
					const dadosFirestore = docSnap.data();
					if (dadosFirestore.participantes) {
						setParticipantes(dadosFirestore.participantes);
					}
					if (dadosFirestore.avaliacoes) {
						setAvaliacoes(dadosFirestore.avaliacoes);
					}
				}
			} catch (error) {
				console.error('❌ Erro ao carregar dados:', error);
				setTodasEquipes([]);
			} finally {
				setLoading(false);
			}
		};

		carregarDados();
	}, [modalidade?.id]);

	// Verificar se o ranking já existe
	useEffect(() => {
		const verificarRanking = async () => {
			if (!modalidade?.id) return;
			const result = await getRankingModalidade(modalidade.id);
			if (result.success && result.data && result.data.ranking) {
				console.log('📊 Ranking já existe para esta modalidade');
				setRankingSalvo(true);
			}
		};
		verificarRanking();
	}, [modalidade?.id]);

	// Gerar e salvar ranking quando todas as avaliações forem preenchidas
	useEffect(() => {
		const gerarESalvarRanking = async () => {
			// Não gerar se o ranking já foi salvo ou não há participantes
			if (rankingSalvo || participantes.length === 0 || criteriosArray.length === 0) return;

			// Verificar se todos os participantes têm todas as notas preenchidas
			const todosAvaliadosCompletamente = participantes.every(p => {
				const notasParticipante = avaliacoes[p.id] || {};
				return criteriosArray.every(([criterioNome]) => {
					const nota = notasParticipante[criterioNome];
					return nota !== undefined && nota !== null && nota !== '';
				});
			});

			if (!todosAvaliadosCompletamente) {
				console.log('⏳ Aguardando todas as avaliações serem concluídas...');
				return;
			}

			console.log('🔍 Gerando ranking do sistema de pontuação fixa...');

			try {
				const ranking = gerarRankingPontuacaoFixa(participantes, avaliacoes, todasEquipes);
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
	}, [participantes, avaliacoes, criteriosArray, todasEquipes, rankingSalvo, modalidade?.id]);

	// ========================================
	// SALVAR NO FIRESTORE
	// ========================================
	
	const salvarNoFirebase = async (dadosAtualizados) => {
		if (!modalidade?.id) return;

		try {
			const docRef = doc(db, 'pontuacaoFixa', modalidade.id);
			const docSnap = await getDoc(docRef);

			const timestamp = new Date().toISOString();
			
			if (docSnap.exists()) {
				await updateDoc(docRef, {
					...dadosAtualizados,
					updatedAt: timestamp
				});
			} else {
				await setDoc(docRef, {
					modalidadeId: modalidade.id,
					...dadosAtualizados,
					createdAt: timestamp,
					updatedAt: timestamp
				});
			}
			
			console.log('✅ Dados salvos no Firestore');
		} catch (error) {
			console.error('❌ Erro ao salvar no Firestore:', error);
			alert('Erro ao salvar dados. Tente novamente.');
		}
	};

	// Adicionar novo participante (via dropdown)
	const handleAdicionarParticipante = () => {
		if (!equipesSelecionada) {
			alert("Selecione uma equipe");
			return;
		}

		const equipe = todasEquipes.find(eq => eq.id === equipesSelecionada);
		if (!equipe) return;

		if (participantes.some(p => p.id === equipe.id)) {
			alert("Esta equipe já foi adicionada");
			return;
		}

		const novosParticipantes = [...participantes, equipe];
		setParticipantes(novosParticipantes);
		
		const novasAvaliacoes = {
			...avaliacoes,
			[equipe.id]: {}
		};
		setAvaliacoes(novasAvaliacoes);
		
		setEquipeSelecionada("");

		// Salvar no Firestore
		salvarNoFirebase({
			participantes: novosParticipantes,
			avaliacoes: novasAvaliacoes
		});
	};

	// Remover participante
	const handleRemoverParticipante = (equipeId) => {
		const equipe = participantes.find(p => p.id === equipeId);
		if (!equipe) return;

		if (window.confirm(`Remover "${equipe.nome}"? Todas as notas serão perdidas.`)) {
			const novosParticipantes = participantes.filter(p => p.id !== equipeId);
			setParticipantes(novosParticipantes);
			
			const novasAvaliacoes = { ...avaliacoes };
			delete novasAvaliacoes[equipeId];
			setAvaliacoes(novasAvaliacoes);

			// Salvar no Firestore
			salvarNoFirebase({
				participantes: novosParticipantes,
				avaliacoes: novasAvaliacoes
			});
		}
	};

	// Calcular pontuação total de cada equipe
	const calcularTotal = (equipeId) => {
		let total = 0;
		Object.keys(criterios).forEach(criterio => {
			const nota = avaliacoes[equipeId]?.[criterio] || 0;
			total += parseFloat(nota);
		});
		return total;
	};

	// Criar ranking ordenado
	const ranking = useMemo(() => {
		return participantes
			.map(equipe => ({
				id: equipe.id,
				nome: equipe.nome,
				pontuacao: calcularTotal(equipe.id),
				notas: avaliacoes[equipe.id] || {}
			}))
			.sort((a, b) => b.pontuacao - a.pontuacao);
	}, [participantes, avaliacoes]);

	// Handler para atualizar nota de um critério
	const handleNotaChange = (equipeId, criterio, valor) => {
		const maxPontos = criterios[criterio];
		const valorNum = parseFloat(valor);
		
		// Validar: não pode exceder o máximo do critério
		if (valorNum > maxPontos) {
			alert(`A nota máxima para "${criterio}" é ${maxPontos} pontos.`);
			return;
		}

		const novasAvaliacoes = {
			...avaliacoes,
			[equipeId]: {
				...avaliacoes[equipeId],
				[criterio]: valorNum || 0
			}
		};
		setAvaliacoes(novasAvaliacoes);

		// Salvar no Firestore
		salvarNoFirebase({
			participantes,
			avaliacoes: novasAvaliacoes
		});
	};

	// Pontuação final por posição
	const getPontuacaoPorPosicao = (posicao) => {
		const pontos = [160, 150, 140, 130, 120, 110, 100, 90, 80, 70, 60, 50, 40, 30, 20, 10];
		return pontos[posicao - 1] || 0;
	};

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

						{/* Lista de participantes */}
						{participantes.length > 0 ? (
							<div style={{ 
								display: "grid", 
								gridTemplateColumns: "repeat(auto-fill, minmax(min(250px, 100%), 1fr))", 
								gap: 12,
								maxWidth: "100%"
							}}>
								{participantes.map((equipe) => (
									<div
										key={equipe.id}
										style={{
											padding: "12px 16px",
											background: "rgba(45, 212, 191, 0.1)",
											border: "1px solid rgba(45, 212, 191, 0.3)",
											borderRadius: 8,
											display: "flex",
											alignItems: "center",
											justifyContent: "space-between"
										}}
									>
										<span style={{ fontWeight: 500, flex: 1 }}>{equipe.nome}</span>
										<button
											onClick={() => handleRemoverParticipante(equipe.id)}
											style={{
												padding: "4px 8px",
												background: "rgba(239, 68, 68, 0.2)",
												border: "1px solid rgba(239, 68, 68, 0.4)",
												borderRadius: 4,
												cursor: "pointer",
												fontSize: 12
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
								Nenhum participante adicionado ainda. Adicione as turmas/equipes acima.
							</p>
						)}

						<p style={{ marginTop: 16, fontSize: 13, color: "var(--muted)" }}>
							💡 <strong>Dica:</strong> Adicione todas as turmas participantes antes de começar a avaliar.
						</p>
					</div>
				</article>
			)}

			{/* Tabela de Avaliação por Critérios */}
			{adminMode && participantes.length > 0 && (
				<article className="card" style={{ marginTop: 24, maxWidth: "90vw", margin: "24px auto 0" }}>
					<div className="card__header">
						<h2 className="card__title">📝 Avaliação por Critérios</h2>
					</div>
					<div className="card__body">
						<div style={{ overflowX: "auto" }}>
							<table className="table">
								<thead>
									<tr>
										<th style={{ minWidth: 120 }}>Turma</th>
										{criteriosArray.map(([criterio, maxPontos]) => (
											<th key={criterio} style={{ minWidth: 150 }}>
												{criterio}
												<br />
												<span style={{ fontSize: 12, color: "var(--muted)", fontWeight: "normal" }}>
													(máx. {maxPontos}pts)
												</span>
											</th>
										))}
										<th style={{ minWidth: 100 }}>Total</th>
									</tr>
								</thead>
								<tbody>
									{participantes.map(equipe => (
										<tr key={equipe.id}>
											<td><strong>{equipe.nome}</strong></td>
											{criteriosArray.map(([criterio, maxPontos]) => (
												<td key={criterio}>
													<input
														type="number"
														min="0"
														max={maxPontos}
														step="0.5"
														value={avaliacoes[equipe.id]?.[criterio] || ""}
														onChange={(e) => handleNotaChange(equipe.id, criterio, e.target.value)}
														placeholder="0"
														style={{
															width: 80,
															padding: "6px 10px",
															borderRadius: 6,
															border: "1px solid var(--border)",
															background: "var(--card)",
															color: "var(--text)",
															fontSize: 14
														}}
													/>
												</td>
											))}
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

						{/* Informações Adicionais */}
						{modalidade?.regrasPontuacao?.tempoMaxMin && (
							<div style={{ marginTop: 16, padding: 12, background: "rgba(251, 191, 36, 0.1)", borderRadius: 8, border: "1px solid rgba(251, 191, 36, 0.3)" }}>
								<p style={{ margin: 0, fontSize: 14 }}>
									⏱️ <strong>Tempo máximo:</strong> {modalidade.regrasPontuacao.tempoMaxMin} minutos
								</p>
								{modalidade.regrasPontuacao.penalidadeTempo && (
									<p style={{ margin: "4px 0 0 0", fontSize: 13, color: "var(--muted)" }}>
										{modalidade.regrasPontuacao.penalidadeTempo}
									</p>
								)}
								{modalidade.regrasPontuacao.penalidadeAtraso && (
									<p style={{ margin: "4px 0 0 0", fontSize: 13, color: "var(--muted)" }}>
										{modalidade.regrasPontuacao.penalidadeAtraso}
									</p>
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
									<th style={{ minWidth: 120 }}>Turma</th>
									{criteriosArray.map(([criterio]) => (
										<th key={criterio} style={{ minWidth: 100 }}>
											{criterio.length > 20 ? criterio.substring(0, 20) + "..." : criterio}
										</th>
									))}
									<th style={{ minWidth: 100 }}>Total</th>
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
											{criteriosArray.map(([criterio]) => (
												<td key={criterio}>
													{(item.notas[criterio] || 0).toFixed(1)}
												</td>
											))}
											<td>
												<strong style={{ fontSize: 16, color: "var(--primary)" }}>
													{item.pontuacao.toFixed(1)}
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
										console.error('Erro ao salvar ranking geral (Fixa):', err);
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

export default SistemaPontuacaoFixa;
