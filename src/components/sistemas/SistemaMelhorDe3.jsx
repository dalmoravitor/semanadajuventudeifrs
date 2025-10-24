import React, { useState, useEffect, useMemo } from "react";
import { db } from "../../api/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getEquipes } from "../../api/equipes";

/**
 * Sistema Melhor de 3 (Salto em Distância, Lançamento de Dardo)
 * 
 * Cada atleta tem 3 tentativas e conta a melhor marca.
 * Em caso de empate, podem ser registradas tentativas extras.
 * 
 * Formato de medida: metros (ex: 5.45, 12.30)
 */

const SistemaMelhorDe3 = ({ adminMode, modalidade }) => {
	const [participantes, setParticipantes] = useState([]);
	const [todasEquipes, setTodasEquipes] = useState([]);
	const [equipeSelecionada, setEquipeSelecionada] = useState("");
	const [loading, setLoading] = useState(true);

	// Marcas: { equipeId: { tent1: "5.45", tent2: "5.60", tent3: "5.50", extras: ["5.55"] } }
	const [marcas, setMarcas] = useState({});

	const NUM_TENTATIVAS = 3;
	const isDardo = modalidade?.id?.includes("dardo");
	const isSalto = modalidade?.id?.includes("salto");

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
			const docRef = doc(db, "sistemaMelhorDe3", modalidade.id);
			const docSnap = await getDoc(docRef);

			if (docSnap.exists()) {
				const dados = docSnap.data();
				setParticipantes(dados.participantes || []);
				setMarcas(dados.marcas || {});
			}
		} catch (error) {
			console.error("Erro ao carregar dados do Firestore:", error);
		} finally {
			setLoading(false);
		}
	};

	const salvarNoFirebase = async (dados) => {
		try {
			const docRef = doc(db, "sistemaMelhorDe3", modalidade.id);
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

		if (participantes.find((p) => p.id === equipeSelecionada)) {
			alert("Esta equipe já está participando!");
			return;
		}

		const equipe = todasEquipes.find((e) => e.id === equipeSelecionada);
		if (!equipe) return;

		const novosParticipantes = [...participantes, { id: equipe.id, nome: equipe.nome }];
		setParticipantes(novosParticipantes);
		setEquipeSelecionada("");

		const novasMarcas = {
			...marcas,
			[equipe.id]: { tent1: "", tent2: "", tent3: "", extras: [] }
		};
		setMarcas(novasMarcas);

		salvarNoFirebase({
			participantes: novosParticipantes,
			marcas: novasMarcas,
		});
	};

	const handleRemoverParticipante = (equipeId) => {
		if (!window.confirm("Remover esta equipe?")) return;

		const novosParticipantes = participantes.filter((p) => p.id !== equipeId);
		const novasMarcas = { ...marcas };
		delete novasMarcas[equipeId];

		setParticipantes(novosParticipantes);
		setMarcas(novasMarcas);

		salvarNoFirebase({
			participantes: novosParticipantes,
			marcas: novasMarcas,
		});
	};

	// ========================================
	// REGISTRAR MARCAS
	// ========================================

	const handleMarcaChange = (equipeId, tentativa, valor) => {
		const novasMarcas = {
			...marcas,
			[equipeId]: {
				...marcas[equipeId],
				[tentativa]: valor,
			},
		};
		setMarcas(novasMarcas);

		salvarNoFirebase({
			participantes,
			marcas: novasMarcas,
		});
	};

	const handleAdicionarTentativaExtra = (equipeId) => {
		const extras = marcas[equipeId]?.extras || [];
		const novasMarcas = {
			...marcas,
			[equipeId]: {
				...marcas[equipeId],
				extras: [...extras, ""]
			},
		};
		setMarcas(novasMarcas);

		salvarNoFirebase({
			participantes,
			marcas: novasMarcas,
		});
	};

	const handleTentativaExtraChange = (equipeId, index, valor) => {
		const extras = [...(marcas[equipeId]?.extras || [])];
		extras[index] = valor;

		const novasMarcas = {
			...marcas,
			[equipeId]: {
				...marcas[equipeId],
				extras
			},
		};
		setMarcas(novasMarcas);

		salvarNoFirebase({
			participantes,
			marcas: novasMarcas,
		});
	};

	const handleRemoverTentativaExtra = (equipeId, index) => {
		const extras = [...(marcas[equipeId]?.extras || [])];
		extras.splice(index, 1);

		const novasMarcas = {
			...marcas,
			[equipeId]: {
				...marcas[equipeId],
				extras
			},
		};
		setMarcas(novasMarcas);

		salvarNoFirebase({
			participantes,
			marcas: novasMarcas,
		});
	};

	// ========================================
	// CALCULAR MELHOR MARCA
	// ========================================

	const getMelhorMarca = (equipeId) => {
		const marca = marcas[equipeId];
		if (!marca) return 0;

		const todasTentativas = [
			marca.tent1,
			marca.tent2,
			marca.tent3,
			...(marca.extras || [])
		].filter(m => m && m !== "").map(m => parseFloat(m));

		if (todasTentativas.length === 0) return 0;
		return Math.max(...todasTentativas);
	};

	// ========================================
	// RANKING
	// ========================================

	const ranking = useMemo(() => {
		return participantes
			.map((equipe) => ({
				id: equipe.id,
				nome: equipe.nome,
				melhorMarca: getMelhorMarca(equipe.id),
				marcas: marcas[equipe.id] || { tent1: "", tent2: "", tent3: "", extras: [] }
			}))
			.filter(item => item.melhorMarca > 0)
			.sort((a, b) => b.melhorMarca - a.melhorMarca); // Maior marca = melhor
	}, [participantes, marcas]);

	// Pontuação por posição
	const getPontuacaoPorPosicao = (posicao) => {
		const pontos = [160, 150, 140, 130, 120, 110, 100, 90, 80, 70, 60, 50, 40, 30, 20, 10];
		return pontos[posicao - 1] || 0;
	};

	// Equipes disponíveis
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
						<h2 className="card__title">
							{isSalto && "🏃 Salto em Distância"}
							{isDardo && "🎯 Lançamento de Dardo"}
						</h2>
						<p style={{ fontSize: 13, color: "var(--muted)", margin: "8px 0 0 0" }}>
							<strong>ℹ️ Regras:</strong> 3 tentativas • Conta a melhor marca • 
							{isDardo && " Arremesso acima da linha dos ombros •"} 
							{" "}Desempate com tentativa extra
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

			{/* REGISTRAR MARCAS (ADMIN) */}
			{adminMode && participantes.length > 0 && (
				<article className="card" style={{ maxWidth: "90vw", margin: "0 auto 16px" }}>
					<div className="card__header">
						<h2 className="card__title">📏 Registrar Marcas</h2>
					</div>
					<div className="card__body" style={{ padding: 0, overflowX: "auto" }}>
						<table className="home-table">
							<thead>
								<tr>
									<th style={{ textAlign: "left" }}>Equipe</th>
									<th style={{ textAlign: "center", minWidth: 100 }}>Tent. 1 (m)</th>
									<th style={{ textAlign: "center", minWidth: 100 }}>Tent. 2 (m)</th>
									<th style={{ textAlign: "center", minWidth: 100 }}>Tent. 3 (m)</th>
									<th style={{ textAlign: "center", minWidth: 120 }}>Melhor Marca</th>
									<th style={{ textAlign: "center", minWidth: 140 }}>Desempate</th>
								</tr>
							</thead>
							<tbody>
								{participantes.map((equipe) => {
									const marca = marcas[equipe.id] || { tent1: "", tent2: "", tent3: "", extras: [] };
									const melhor = getMelhorMarca(equipe.id);

									return (
										<React.Fragment key={equipe.id}>
											<tr>
												<td style={{ fontWeight: 600 }}>{equipe.nome}</td>
												{["tent1", "tent2", "tent3"].map((tent) => (
													<td key={tent} style={{ textAlign: "center", padding: "8px 12px" }}>
														<input
															type="text"
															placeholder="0.00"
															value={marca[tent] || ""}
															onChange={(e) =>
																handleMarcaChange(equipe.id, tent, e.target.value)
															}
															style={{
																width: "100%",
																maxWidth: 80,
																padding: "6px 10px",
																borderRadius: 6,
																border: "1px solid var(--border)",
																background: "var(--card)",
																color: "var(--text)",
																fontSize: 14,
																textAlign: "center",
																fontFamily: "monospace"
															}}
														/>
													</td>
												))}
												<td style={{ textAlign: "center", fontSize: 16, fontWeight: 700 }}>
													{melhor > 0 ? (
														<span style={{ color: "var(--primary)" }}>
															{melhor.toFixed(2)}m
														</span>
													) : (
														<span style={{ color: "var(--muted)" }}>—</span>
													)}
												</td>
												<td style={{ textAlign: "center", padding: "8px 12px" }}>
													<button
														onClick={() => handleAdicionarTentativaExtra(equipe.id)}
														className="btn btn--ghost"
														style={{ 
															padding: "6px 12px", 
															fontSize: 12,
															whiteSpace: "nowrap"
														}}
													>
														➕ Tent. Extra
													</button>
												</td>
											</tr>
											{/* Tentativas extras */}
											{marca.extras && marca.extras.length > 0 && (
												<tr>
													<td colSpan="6" style={{ padding: "0 12px 12px", background: "rgba(59, 130, 246, 0.05)" }}>
														<div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>
															🔄 Tentativas de Desempate:
														</div>
														<div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
															{marca.extras.map((extra, idx) => (
																<div key={idx} style={{ display: "flex", gap: 4, alignItems: "center" }}>
																	<input
																		type="text"
																		placeholder="0.00"
																		value={extra}
																		onChange={(e) =>
																			handleTentativaExtraChange(equipe.id, idx, e.target.value)
																		}
																		style={{
																			width: 80,
																			padding: "4px 8px",
																			borderRadius: 6,
																			border: "1px solid var(--border)",
																			background: "var(--card)",
																			color: "var(--text)",
																			fontSize: 13,
																			textAlign: "center",
																			fontFamily: "monospace"
																		}}
																	/>
																	<button
																		onClick={() => handleRemoverTentativaExtra(equipe.id, idx)}
																		style={{
																			padding: "2px 6px",
																			background: "transparent",
																			border: "none",
																			color: "#ef4444",
																			cursor: "pointer",
																			fontSize: 14
																		}}
																	>
																		×
																	</button>
																</div>
															))}
														</div>
													</td>
												</tr>
											)}
										</React.Fragment>
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
						<h2 className="card__title">🏆 Classificação Final</h2>
						<p style={{ fontSize: 12, color: "var(--muted)", margin: "6px 0 0 0" }}>
							💡 Ordenado pela melhor marca (maior distância/alcance)
						</p>
					</div>
					<div className="card__body" style={{ padding: 0, overflowX: "auto" }}>
						<table className="home-table">
							<thead>
								<tr style={{ background: "rgba(34,197,94,0.12)" }}>
									<th style={{ textAlign: "center", width: 80 }}>Posição</th>
									<th style={{ textAlign: "left" }}>Equipe</th>
									<th style={{ textAlign: "center", minWidth: 100 }}>Tent. 1</th>
									<th style={{ textAlign: "center", minWidth: 100 }}>Tent. 2</th>
									<th style={{ textAlign: "center", minWidth: 100 }}>Tent. 3</th>
									<th style={{ textAlign: "center", minWidth: 120 }}>Melhor Marca</th>
									<th style={{ textAlign: "center", minWidth: 100 }}>Pontos</th>
								</tr>
							</thead>
							<tbody>
								{ranking.map((item, index) => {
									let medalha = "";
									if (index === 0) medalha = "🥇";
									else if (index === 1) medalha = "🥈";
									else if (index === 2) medalha = "🥉";

									const pontos = getPontuacaoPorPosicao(index + 1);

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
											<td style={{ textAlign: "center", fontFamily: "monospace", fontSize: 14 }}>
												{item.marcas.tent1 || "—"}
											</td>
											<td style={{ textAlign: "center", fontFamily: "monospace", fontSize: 14 }}>
												{item.marcas.tent2 || "—"}
											</td>
											<td style={{ textAlign: "center", fontFamily: "monospace", fontSize: 14 }}>
												{item.marcas.tent3 || "—"}
											</td>
											<td style={{ textAlign: "center", fontSize: 17, fontWeight: 700, color: "var(--primary)" }}>
												{item.melhorMarca.toFixed(2)}m
												{item.marcas.extras && item.marcas.extras.length > 0 && (
													<span style={{ fontSize: 11, marginLeft: 6, color: "var(--muted)" }}>
														(+{item.marcas.extras.length} extra)
													</span>
												)}
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
													{pontos}
												</span>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
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

export default SistemaMelhorDe3;
