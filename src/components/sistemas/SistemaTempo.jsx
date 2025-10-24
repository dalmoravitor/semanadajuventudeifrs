import React, { useState, useMemo, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../api/firebase';
import { getEquipes } from '../../api/equipes';
import { gerarRankingTempo } from '../../utils/rankingHelpers';
import { saveRankingModalidade, getRankingModalidade } from '../../api/ranking';

/**
 * Sistema de Tempo (Atletismo, Gincana Recreativa)
 * Atualizado com dropdown de equipes e persistência no Firestore
 */
function SistemaTempo({ adminMode, modalidade }) {
	// Estado para participantes (agora objetos com id e nome)
	const [participantes, setParticipantes] = useState([]);
	const [todasEquipes, setTodasEquipes] = useState([]);
	const [equipeSelecionada, setEquipeSelecionada] = useState("");
	const [loading, setLoading] = useState(true);

	// Estado para tempos (bateria única ou eliminatórias)
	const [tempos, setTempos] = useState({});
	
	// Estado para penalização do ovo (Gincana Recreativa)
	const [derrubouOvo, setDerrubouOvo] = useState({});
	
	// Estado para baterias (quando tem eliminatórias)
	const [baterias, setBaterias] = useState([]);
	const [finalistas, setFinalistas] = useState([]);
	const [rankingSalvo, setRankingSalvo] = useState(false);
	const [savingRanking, setSavingRanking] = useState(false);
	const [msgRanking, setMsgRanking] = useState(null);

	// Detectar tipo de sistema e se é Gincana Recreativa
	const temEliminatorias = modalidade?.sistema?.includes("eliminatoria+final");
	const numBaterias = modalidade?.regrasPontuacao?.baterias || 0;
	const isGincanaRecreativa = modalidade?.id === "gincana_recreativa";
	const PENALIZACAO_OVO = 30; // 30 segundos

	// ========================================
	// CARREGAR DADOS DO FIRESTORE
	// ========================================
	
	useEffect(() => {
		const carregarDados = async () => {
			try {
				console.log('🔄 Carregando dados do Sistema Tempo...');
				
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
					const docRef = doc(db, 'sistemasTempo', modalidade.id);
					const docSnap = await getDoc(docRef);

					if (docSnap.exists()) {
						const dados = docSnap.data();
						console.log('✅ Dados carregados do Firestore:', dados);
						
						if (dados.participantes) {
							setParticipantes(dados.participantes);
						}
						if (dados.tempos) {
							setTempos(dados.tempos);
						}
						if (dados.derrubouOvo) {
							setDerrubouOvo(dados.derrubouOvo);
						}
						if (dados.baterias) {
							setBaterias(dados.baterias);
						}
						if (dados.finalistas) {
							setFinalistas(dados.finalistas);
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

	// Inicializar baterias quando modalidade mudar
	useEffect(() => {
		if (temEliminatorias && numBaterias > 0 && baterias.length === 0) {
			const bateriasIniciais = Array.from({ length: numBaterias }, (_, i) => ({
				id: i + 1,
				nome: `Bateria ${i + 1}`,
				participantes: []
			}));
			setBaterias(bateriasIniciais);
		}
	}, [modalidade?.id, temEliminatorias, numBaterias, baterias.length]);

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

	// Gerar e salvar ranking quando todos os tempos forem preenchidos
	useEffect(() => {
		const gerarESalvarRanking = async () => {
			// Não gerar se o ranking já foi salvo
			if (rankingSalvo || participantes.length === 0) return;

			// Verificar se todos os participantes têm tempo registrado
			const todosTemTempo = participantes.every(p => 
				tempos[p.id] !== undefined && 
				tempos[p.id] !== null && 
				tempos[p.id] !== ''
			);

			if (!todosTemTempo) {
				console.log('⏳ Aguardando todos os tempos serem registrados...');
				return;
			}

			console.log('🔍 Gerando ranking do sistema de tempo...');

			try {
				const ranking = gerarRankingTempo(participantes, tempos, todasEquipes);
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
	}, [participantes, tempos, todasEquipes, rankingSalvo, modalidade?.id]);

	// ========================================
	// SALVAR NO FIRESTORE
	// ========================================
	
	const salvarNoFirebase = async (dados) => {
		if (!modalidade?.id) {
			console.error('❌ ID da modalidade não encontrado');
			return;
		}

		try {
			const docRef = doc(db, 'sistemasTempo', modalidade.id);
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

	// Adicionar participante
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
		
		const novosTempos = {
			...tempos,
			[equipeSelecionadaObj.id]: { eliminatoria: "", final: "" }
		};
		setTempos(novosTempos);
		
		const novoDerrubouOvo = {
			...derrubouOvo,
			[equipeSelecionadaObj.id]: false
		};
		setDerrubouOvo(novoDerrubouOvo);
		
		setEquipeSelecionada("");

		// Salvar no Firestore
		salvarNoFirebase({
			participantes: novosParticipantes,
			tempos: novosTempos,
			derrubouOvo: novoDerrubouOvo,
			baterias,
			finalistas
		});
	};

	// Remover participante
	const handleRemoverParticipante = (equipeId) => {
		const equipe = participantes.find(p => p.id === equipeId);
		if (!equipe) return;

		if (window.confirm(`Remover "${equipe.nome}"?`)) {
			const novosParticipantes = participantes.filter(p => p.id !== equipeId);
			setParticipantes(novosParticipantes);
			
			const novosTempos = { ...tempos };
			delete novosTempos[equipeId];
			setTempos(novosTempos);
			
			const novoDerrubouOvo = { ...derrubouOvo };
			delete novoDerrubouOvo[equipeId];
			setDerrubouOvo(novoDerrubouOvo);
			
			// Remover das baterias
			const novasBaterias = baterias.map(b => ({
				...b,
				participantes: b.participantes.filter(p => p !== equipeId)
			}));
			setBaterias(novasBaterias);
			
			const novosFinalistas = finalistas.filter(f => f !== equipeId);
			setFinalistas(novosFinalistas);

			// Salvar no Firestore
			salvarNoFirebase({
				participantes: novosParticipantes,
				tempos: novosTempos,
				derrubouOvo: novoDerrubouOvo,
				baterias: novasBaterias,
				finalistas: novosFinalistas
			});
		}
	};

	// Adicionar participante a uma bateria
	const handleAdicionarABateria = (bateriaId, equipeId) => {
		if (!equipeId) return;
		
		// Verificar se já está em outra bateria
		const jaEmBateria = baterias.some(b => b.participantes.includes(equipeId));
		if (jaEmBateria) {
			alert("Esta equipe já está em uma bateria");
			return;
		}

		const novasBaterias = baterias.map(b => {
			if (b.id === bateriaId) {
				return { ...b, participantes: [...b.participantes, equipeId] };
			}
			return b;
		});
		setBaterias(novasBaterias);

		// Salvar no Firestore
		salvarNoFirebase({
			participantes,
			tempos,
			derrubouOvo,
			baterias: novasBaterias,
			finalistas
		});
	};

	// Remover participante de bateria
	const handleRemoverDaBateria = (bateriaId, equipeId) => {
		const novasBaterias = baterias.map(b => {
			if (b.id === bateriaId) {
				return { ...b, participantes: b.participantes.filter(p => p !== equipeId) };
			}
			return b;
		});
		setBaterias(novasBaterias);

		// Salvar no Firestore
		salvarNoFirebase({
			participantes,
			tempos,
			derrubouOvo,
			baterias: novasBaterias,
			finalistas
		});
	};

	// Atualizar tempo
	const handleTempoChange = (equipeId, fase, valor) => {
		const novosTempos = {
			...tempos,
			[equipeId]: {
				...tempos[equipeId],
				[fase]: valor
			}
		};
		setTempos(novosTempos);

		// Salvar no Firestore
		salvarNoFirebase({
			participantes,
			tempos: novosTempos,
			derrubouOvo,
			baterias,
			finalistas
		});
	};

	// Alternar estado do ovo (Gincana Recreativa)
	const handleToggleOvo = (equipeId) => {
		const novoDerrubouOvo = {
			...derrubouOvo,
			[equipeId]: !derrubouOvo[equipeId]
		};
		setDerrubouOvo(novoDerrubouOvo);

		// Salvar no Firestore
		salvarNoFirebase({
			participantes,
			tempos,
			derrubouOvo: novoDerrubouOvo,
			baterias,
			finalistas
		});
	};

	// Converter tempo string para segundos (para ordenação)
	const tempoParaSegundos = (tempo) => {
		if (!tempo) return Infinity;
		const partes = tempo.split(':');
		if (partes.length === 2) {
			// Formato MM:SS.mmm
			const [min, seg] = partes;
			return parseFloat(min) * 60 + parseFloat(seg);
		} else if (partes.length === 1) {
			// Formato SS.mmm
			return parseFloat(tempo);
		}
		return Infinity;
	};

	// Calcular tempo total com penalização do ovo (se aplicável)
	const calcularTempoTotal = (equipeId, fase) => {
		const tempoBase = tempoParaSegundos(tempos[equipeId]?.[fase]);
		if (tempoBase === Infinity) return Infinity;
		
		// Adicionar penalização de 30 segundos se derrubou o ovo
		if (isGincanaRecreativa && derrubouOvo[equipeId]) {
			return tempoBase + PENALIZACAO_OVO;
		}
		
		return tempoBase;
	};

	// Gerar finalistas automaticamente (1º de cada bateria)
	const handleGerarFinalistas = () => {
		const vencedores = [];
		baterias.forEach(bateria => {
			if (bateria.participantes.length === 0) return;
			
			// Encontrar o mais rápido da bateria
			const participantesComTempo = bateria.participantes
				.map(equipeId => ({ 
					id: equipeId, 
					tempo: calcularTempoTotal(equipeId, "eliminatoria")
				}))
				.filter(p => p.tempo !== Infinity)
				.sort((a, b) => a.tempo - b.tempo);
			
			if (participantesComTempo.length > 0) {
				vencedores.push(participantesComTempo[0].id);
			}
		});

		setFinalistas(vencedores);

		// Salvar no Firestore
		salvarNoFirebase({
			participantes,
			tempos,
			derrubouOvo,
			baterias,
			finalistas: vencedores
		});

		alert(`${vencedores.length} finalistas gerados automaticamente!\n\n✅ Regra: 1º de cada bateria classifica para a final`);
	};

	// Criar ranking final
	const ranking = useMemo(() => {
		if (temEliminatorias) {
			// Ranking da final
			const finalistasComTempo = finalistas
				.map(equipeId => {
					const equipe = participantes.find(p => p.id === equipeId);
					const fase = tempos[equipeId]?.final ? "final" : "eliminatoria";
					return {
						id: equipeId,
						nome: equipe?.nome || equipeId,
						tempo: calcularTempoTotal(equipeId, fase),
						tempoStr: tempos[equipeId]?.final || tempos[equipeId]?.eliminatoria || "—",
						derrubouOvo: derrubouOvo[equipeId] || false
					};
				})
				.sort((a, b) => a.tempo - b.tempo);

			// Não finalistas ordenados por tempo das eliminatórias
			const naoFinalistas = participantes
				.filter(p => !finalistas.includes(p.id))
				.map(p => ({
					id: p.id,
					nome: p.nome,
					tempo: calcularTempoTotal(p.id, "eliminatoria"),
					tempoStr: tempos[p.id]?.eliminatoria || "—",
					derrubouOvo: derrubouOvo[p.id] || false
				}))
				.sort((a, b) => a.tempo - b.tempo);

			return [...finalistasComTempo, ...naoFinalistas];
		} else {
			// Bateria única
			return participantes
				.map(p => ({
					id: p.id,
					nome: p.nome,
					tempo: calcularTempoTotal(p.id, "eliminatoria"),
					tempoStr: tempos[p.id]?.eliminatoria || "—",
					derrubouOvo: derrubouOvo[p.id] || false
				}))
				.sort((a, b) => a.tempo - b.tempo);
		}
	}, [participantes, tempos, derrubouOvo, finalistas, temEliminatorias, isGincanaRecreativa]);

	// Pontuação por posição
	const getPontuacaoPorPosicao = (posicao) => {
		const pontos = [160, 150, 140, 130, 120, 110, 100, 90, 80, 70, 60, 50, 40, 30, 20, 10];
		return pontos[posicao - 1] || 0;
	};

	// Equipes disponíveis para seleção (que ainda não foram adicionadas)
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

			{/* Organização de Baterias (para eliminatórias) */}
			{adminMode && temEliminatorias && participantes.length > 0 && (
				<article className="card" style={{ marginTop: 24, maxWidth: "90vw", margin: "24px auto 0" }}>
					<div className="card__header">
						<h2 className="card__title">🏃 Organizar Baterias Eliminatórias</h2>
						<p style={{ fontSize: 13, color: "var(--muted)", margin: "8px 0 0 0" }}>
							✅ <strong>Regra:</strong> O 1º colocado de cada bateria classifica para a final
						</p>
					</div>
					<div className="card__body">
						<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(250px, 100%), 1fr))", gap: 16, overflowX: "auto" }}>
							{baterias.map(bateria => (
								<div
									key={bateria.id}
									style={{
										padding: 16,
										background: "rgba(59, 130, 246, 0.1)",
										border: "1px solid rgba(59, 130, 246, 0.3)",
										borderRadius: 8
									}}
								>
									<h3 style={{ margin: "0 0 12px 0", fontSize: 16 }}>{bateria.nome}</h3>
									
									{/* Participantes da bateria */}
									{bateria.participantes.length > 0 ? (
										<div style={{ marginBottom: 12 }}>
											{bateria.participantes.map(equipeId => {
												const equipe = participantes.find(p => p.id === equipeId);
												return (
													<div
														key={equipeId}
														style={{
															padding: "6px 10px",
															background: "rgba(255, 255, 255, 0.1)",
															borderRadius: 6,
															marginBottom: 6,
															display: "flex",
															justifyContent: "space-between",
															alignItems: "center",
															fontSize: 13
														}}
													>
														<span>{equipe?.nome || equipeId}</span>
														<button
															onClick={() => handleRemoverDaBateria(bateria.id, equipeId)}
															style={{
																padding: "2px 6px",
																background: "rgba(239, 68, 68, 0.3)",
																border: "none",
																borderRadius: 4,
																cursor: "pointer",
																fontSize: 11
															}}
														>
															✖
														</button>
													</div>
												);
											})}
										</div>
									) : (
										<p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>
											Nenhum participante
										</p>
									)}

									{/* Adicionar participante */}
									<select
										onChange={(e) => {
											handleAdicionarABateria(bateria.id, e.target.value);
											e.target.value = "";
										}}
										style={{
											width: "100%",
											padding: "6px 10px",
											borderRadius: 6,
											border: "1px solid var(--border)",
											background: "var(--card)",
											color: "var(--text)",
											fontSize: 13
										}}
									>
										<option value="">+ Adicionar...</option>
										{participantes
											.filter(p => !baterias.some(b => b.participantes.includes(p.id)))
											.map(p => (
												<option key={p.id} value={p.id}>{p.nome}</option>
											))
										}
									</select>
								</div>
							))}
						</div>

						<p style={{ marginTop: 16, fontSize: 13, color: "var(--muted)" }}>
							💡 <strong>Dica:</strong> Distribua os participantes nas baterias antes de registrar os tempos.
						</p>
					</div>
				</article>
			)}

			{/* Registro de Tempos */}
			{adminMode && participantes.length > 0 && (
				<article className="card" style={{ marginTop: 24, maxWidth: "90vw", margin: "24px auto 0" }}>
					<div className="card__header">
						<h2 className="card__title">⏱️ Registrar Tempos</h2>
					</div>
					<div className="card__body">
						<div style={{ overflowX: "auto" }}>
							<table className="table">
								<thead>
									<tr>
										<th style={{ minWidth: 150 }}>Participante</th>
										{temEliminatorias && <th style={{ minWidth: 100 }}>Bateria</th>}
										<th style={{ minWidth: 120 }}>
											{temEliminatorias ? "Tempo Eliminatória" : "Tempo"}
										</th>
										{temEliminatorias && <th style={{ minWidth: 120 }}>Tempo Final</th>}
										{isGincanaRecreativa && (
											<th style={{ minWidth: 120, textAlign: "center" }}>Derrubou o Ovo?</th>
										)}
									</tr>
								</thead>
								<tbody>
									{participantes.map(equipe => {
										const bateria = baterias.find(b => b.participantes.includes(equipe.id));
										const naFinal = finalistas.includes(equipe.id);

										return (
											<tr key={equipe.id}>
												<td><strong>{equipe.nome}</strong></td>
												{temEliminatorias && (
													<td>
														<span style={{ 
															fontSize: 12, 
															padding: "4px 8px", 
															background: bateria ? "rgba(59, 130, 246, 0.2)" : "rgba(156, 163, 175, 0.2)",
															borderRadius: 4
														}}>
															{bateria?.nome || "—"}
														</span>
													</td>
												)}
												<td>
													<input
														type="text"
														placeholder={modalidade?.sistema === "tempo" ? "MM:SS ou SS.mmm" : "SS.mmm"}
														value={tempos[equipe.id]?.eliminatoria || ""}
														onChange={(e) => handleTempoChange(equipe.id, "eliminatoria", e.target.value)}
														style={{
															width: 100,
															padding: "6px 10px",
															borderRadius: 6,
															border: "1px solid var(--border)",
															background: "var(--card)",
															color: "var(--text)",
															fontSize: 14
														}}
													/>
												</td>
												{temEliminatorias && (
													<td>
														{naFinal ? (
															<input
																type="text"
																placeholder="SS.mmm"
																value={tempos[equipe.id]?.final || ""}
																onChange={(e) => handleTempoChange(equipe.id, "final", e.target.value)}
																style={{
																	width: 100,
																	padding: "6px 10px",
																	borderRadius: 6,
																	border: "1px solid var(--border)",
																	background: "var(--card)",
																	color: "var(--text)",
																	fontSize: 14
																}}
															/>
														) : (
															<span style={{ color: "var(--muted)", fontSize: 13 }}>—</span>
														)}
													</td>
												)}
												{isGincanaRecreativa && (
													<td style={{ textAlign: "center" }}>
														<button
															onClick={() => handleToggleOvo(equipe.id)}
															className="btn"
															style={{
																padding: "6px 12px",
																fontSize: 13,
																background: derrubouOvo[equipe.id] 
																	? "rgba(239, 68, 68, 0.2)" 
																	: "rgba(34, 197, 94, 0.2)",
																border: derrubouOvo[equipe.id]
																	? "1px solid rgba(239, 68, 68, 0.4)"
																	: "1px solid rgba(34, 197, 94, 0.4)",
																color: derrubouOvo[equipe.id]
																	? "#ef4444"
																	: "#22c55e"
															}}
														>
															{derrubouOvo[equipe.id] ? "❌ Sim (+30s)" : "✅ Não"}
														</button>
													</td>
												)}
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
												const payload = ranking
													.filter((item) => item.tempo !== Infinity)
													.map((item, idx) => ({
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
												console.error('Erro ao salvar ranking geral (Tempo):', err);
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

						{temEliminatorias && (
							<button
								onClick={handleGerarFinalistas}
								className="btn btn--primary"
								style={{ marginTop: 16 }}
							>
								🏁 Gerar Finalistas Automaticamente
							</button>
						)}

						<div style={{ marginTop: 16, padding: 12, background: "rgba(251, 191, 36, 0.1)", borderRadius: 8, border: "1px solid rgba(251, 191, 36, 0.3)" }}>
							<p style={{ margin: 0, fontSize: 13 }}>
								⏱️ <strong>Formato de tempo:</strong> Use SS.mmm (ex: 12.45) ou MM:SS.mmm (ex: 1:30.25)
							</p>
							{modalidade?.regrasPontuacao?.penalidadeElementoQuebrado && (
								<p style={{ margin: "8px 0 0 0", fontSize: 13, color: "var(--muted)" }}>
									⚠️ {modalidade.regrasPontuacao.penalidadeElementoQuebrado}
								</p>
							)}
						</div>
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
										<th style={{ minWidth: 100 }}>Tempo</th>
										{isGincanaRecreativa && <th style={{ minWidth: 100, textAlign: "center" }}>Ovo</th>}
										{isGincanaRecreativa && <th style={{ minWidth: 120 }}>Tempo Total</th>}
										<th style={{ minWidth: 100 }}>Pontos</th>
									</tr>
								</thead>
								<tbody>
									{ranking.map((item, idx) => {
										const posicao = idx + 1;
										const pontosFinal = getPontuacaoPorPosicao(posicao);
										const isTop3 = posicao <= 3;
										const temTempo = item.tempo !== Infinity;
										const penalizacao = isGincanaRecreativa && item.derrubouOvo ? PENALIZACAO_OVO : 0;
										const tempoTotalSegundos = item.tempo;
										const tempoTotalStr = tempoTotalSegundos !== Infinity 
											? (tempoTotalSegundos >= 60 
												? `${Math.floor(tempoTotalSegundos / 60)}:${(tempoTotalSegundos % 60).toFixed(2).padStart(5, '0')}`
												: tempoTotalSegundos.toFixed(2))
											: "—";

										return (
											<tr key={item.id}>
												<td>
													<strong style={{ fontSize: 16 }}>
														{temTempo && posicao === 1 && "🥇"}
														{temTempo && posicao === 2 && "🥈"}
														{temTempo && posicao === 3 && "🥉"}
														{(temTempo && posicao > 3) && posicao + "º"}
														{!temTempo && "—"}
													</strong>
												</td>
												<td>
													<strong style={{ color: isTop3 && temTempo ? "var(--primary)" : "inherit" }}>
														{item.nome}
													</strong>
												</td>
												<td>
													<span style={{ 
														fontFamily: "monospace", 
														fontSize: 15,
														color: temTempo ? "var(--text)" : "var(--muted)"
													}}>
														{item.tempoStr}
													</span>
												</td>
												{isGincanaRecreativa && (
													<td style={{ textAlign: "center" }}>
														<span style={{ 
															fontSize: 20,
															color: item.derrubouOvo ? "#ef4444" : "#22c55e"
														}}>
															{item.derrubouOvo ? "❌" : "✅"}
														</span>
													</td>
												)}
												{isGincanaRecreativa && (
													<td>
														<span style={{ 
															fontFamily: "monospace", 
															fontSize: 15,
															fontWeight: 600,
															color: item.derrubouOvo ? "#ef4444" : "var(--text)"
														}}>
															{tempoTotalStr}
															{item.derrubouOvo && (
																<span style={{ fontSize: 11, marginLeft: 6, color: "var(--muted)" }}>
																	(+30s)
																</span>
															)}
														</span>
													</td>
												)}
												<td>
													<strong style={{ 
														fontSize: 18, 
														color: isTop3 && temTempo ? "var(--accent)" : "var(--text)",
														fontWeight: "bold"
													}}>
														{temTempo ? `${pontosFinal}pts` : "—"}
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

export default SistemaTempo;
