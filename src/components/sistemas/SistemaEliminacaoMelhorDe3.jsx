import React, { useState } from "react";
import { useEliminacaoMelhorDe3 } from "../../hooks/useEliminacaoMelhorDe3";
import { calcularColocacaoEliminacao, calcularPontosPorColocacao } from "../../services/rankingEliminacaoService";

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
		resultados: Object.fromEntries(
			Object.entries(resultados).map(([id, res]) => [
				id,
				{
					scoreA: res.placarSerie?.A || 0,
					scoreB: res.placarSerie?.B || 0,
					vencedor: res.vencedorMelhorDe3
				}
			])
		)
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
 * SISTEMA DE ELIMINAÇÃO MELHOR DE 3
 * ========================================
 * 
 * Sistema usado para modalidades de cartas: Truco e Bisca
 * 
 * Diferença do sistema simples:
 * - Cada confronto é MELHOR DE 3 partidas
 * - Vence quem ganhar 2 partidas primeiro
 * - Possibilidade de 2-0 ou 2-1
 * 
 * Props:
 * - adminMode (boolean): Habilita edição de resultados
 * - modalidade (Object): Objeto da modalidade com id, nome, tipo
 */

function SistemaEliminacaoMelhorDe3({ adminMode, modalidade }) {
	const numEquipes = 16;
	const tipo = modalidade?.id?.includes('truco') ? 'truco' : 'bisca';
	
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
		savePartida
	} = useEliminacaoMelhorDe3(modalidade?.id, tipo, numEquipes);
	
	const [modalPartida, setModalPartida] = useState({
		open: false,
		confrontoId: null,
		equipeA: "",
		equipeB: "",
		numeroPartida: 1,
		scoreA: "",
		scoreB: "",
		fase: ""
	});

	const openModalPartida = (confrontoId, equipeA, equipeB, numeroPartida, fase) => {
		const resultado = resultados[confrontoId];
		const partida = resultado?.partidas?.[numeroPartida - 1];
		
		setModalPartida({
			open: true,
			confrontoId,
			equipeA: equipeA.nome,
			equipeB: equipeB.nome,
			numeroPartida,
			scoreA: partida?.scoreA ?? "",
			scoreB: partida?.scoreB ?? "",
			fase
		});
	};

	const closeModalPartida = () => setModalPartida(s => ({ ...s, open: false }));

	const saveModalPartida = (e) => {
		e.preventDefault();
		const { confrontoId, numeroPartida, scoreA, scoreB } = modalPartida;
		
		// Salvar usando o hook (que persiste no Firebase)
		savePartida(confrontoId, numeroPartida, scoreA, scoreB);
		
		closeModalPartida();
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

	// Renderizar um confronto melhor de 3
	const renderConfrontoMelhorDe3 = (confronto) => {
		const resultado = resultados[confronto.id];
		const placarSerie = resultado?.placarSerie || { A: 0, B: 0 };
		const vencedor = resultado?.vencedorMelhorDe3;
		const partidas = resultado?.partidas || [];

		return (
			<div key={confronto.id} style={{ marginBottom: 24, border: "1px solid rgba(45, 212, 191, 0.2)", borderRadius: 8, padding: 16, background: "var(--card)" }}>
				{/* Header do confronto */}
				<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
					<h4 style={{ margin: 0, fontSize: 15, color: "var(--primary)" }}>
						{confronto.fase} {confronto.jogo}
					</h4>
					<div style={{ fontSize: 18, fontWeight: 700, color: vencedor ? "var(--accent)" : "var(--muted)" }}>
						{placarSerie.A} - {placarSerie.B}
						{vencedor && <span style={{ marginLeft: 8, fontSize: 14 }}>✓</span>}
					</div>
				</div>

				{/* Equipes */}
				<div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 12, marginBottom: 16, alignItems: "center" }}>
					<div style={{ 
						textAlign: "right", 
						fontWeight: vencedor === 'A' ? 700 : 500,
						color: vencedor === 'A' ? "var(--accent)" : "var(--text)",
						fontSize: 14
					}}>
						{confronto.equipeA.nome} {vencedor === 'A' && "👑"}
					</div>
					<div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>VS</div>
					<div style={{ 
						textAlign: "left",
						fontWeight: vencedor === 'B' ? 700 : 500,
						color: vencedor === 'B' ? "var(--accent)" : "var(--text)",
						fontSize: 14
					}}>
						{vencedor === 'B' && "👑"} {confronto.equipeB.nome}
					</div>
				</div>

				{/* Partidas (Melhor de 3) */}
				<div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
					{[1, 2, 3].map(numPartida => {
						const partida = partidas[numPartida - 1];
						const desabilitada = vencedor && !partida; // Se já tem vencedor e partida não foi jogada
						
						return (
							<div 
								key={numPartida} 
								style={{ 
									flex: "1 1 150px",
									border: "1px solid rgba(45, 212, 191, 0.3)",
									borderRadius: 6,
									padding: "8px 12px",
									background: partida ? "rgba(45, 212, 191, 0.05)" : desabilitada ? "rgba(100, 100, 100, 0.1)" : "transparent",
									opacity: desabilitada ? 0.4 : 1
								}}
							>
								<div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4, fontWeight: 600 }}>
									Partida {numPartida}
								</div>
								{partida ? (
									<div>
										<div style={{ fontSize: 15, fontWeight: 700, color: "var(--primary)", marginBottom: 4 }}>
											{partida.scoreA} x {partida.scoreB}
										</div>
										{adminMode && !desabilitada && (
											<button 
												className="btn btn--ghost" 
												onClick={() => openModalPartida(confronto.id, confronto.equipeA, confronto.equipeB, numPartida, confronto.fase)}
												style={{ padding: "2px 8px", fontSize: 11, width: "100%" }}
											>
												Editar
											</button>
										)}
									</div>
								) : adminMode && !desabilitada ? (
									<button 
										className="btn btn--primary" 
										onClick={() => openModalPartida(confronto.id, confronto.equipeA, confronto.equipeB, numPartida, confronto.fase)}
										style={{ padding: "4px 10px", fontSize: 12, width: "100%" }}
									>
										Inserir
									</button>
								) : (
									<div style={{ fontSize: 12, color: "var(--muted)" }}>
										{desabilitada ? "—" : "Aguardando"}
									</div>
								)}
							</div>
						);
					})}
				</div>
			</div>
		);
	};

	const renderConfrontos = (confrontos, titulo) => {
		if (confrontos.length === 0) return null;

		return (
			<article className="card" style={{ marginBottom: 24 }}>
				<div className="card__header">
					<h3 className="card__title">{titulo}</h3>
				</div>
				<div className="card__body">
					{confrontos.map(confronto => renderConfrontoMelhorDe3(confronto))}
				</div>
			</article>
		);
	};

	return (
		<div style={{ margin: "24px auto", maxWidth: 1200 }}>
			{/* Info do sistema */}
			{equipes.length === 0 && (
				<article className="card" style={{ marginBottom: 24, background: "linear-gradient(135deg, rgba(45, 212, 191, 0.1) 0%, rgba(251, 191, 36, 0.1) 100%)" }}>
					<div className="card__body">
						<h3 style={{ margin: "0 0 8px 0", fontSize: 16, color: "var(--primary)" }}>
							🃏 Sistema Melhor de 3 - {tipo === 'truco' ? 'Truco' : 'Bisca'}
						</h3>
						<p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
							Cada confronto é disputado em até 3 partidas. Vence quem ganhar 2 partidas primeiro (2-0 ou 2-1).
							{tipo === 'truco' && ' Partidas disputadas até 24 tentos.'}
							{tipo === 'bisca' && ' Contagem de pontos por cartas capturadas.'}
						</p>
					</div>
				</article>
			)}

			{/* Tabela de inscrição das equipes */}
			{equipes.length === 0 && (
				<article className="card" style={{ marginBottom: 24 }}>
					<div className="card__header">
						<h2 className="card__title">📝 Inscrição de Equipes</h2>
					</div>
					<div className="card__body">
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
					</div>
				</article>
			)}

			{/* Confrontos */}
			{renderConfrontos(confrontosOitavas, "⚔️ Oitavas de Final")}
			{renderConfrontos(confrontosQuartas, "🔥 Quartas de Final")}
			{renderConfrontos(confrontosSemis, "💪 Semifinais")}
			
			{/* Final */}
			{confrontoFinal && (
				<article className="card" style={{ marginBottom: 24, border: "2px solid var(--primary)" }}>
					<div className="card__header" style={{ background: "linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)" }}>
						<h3 className="card__title" style={{ fontSize: 18 }}>👑 GRANDE FINAL</h3>
					</div>
					<div className="card__body">
						{renderConfrontoMelhorDe3(confrontoFinal)}
					</div>
				</article>
			)}

			{/* Ranking Final (se competição concluída) */}
			{status === "concluido" && confrontoFinal && resultados[confrontoFinal.id]?.vencedorMelhorDe3 && (
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

			{/* Modal de edição de partida */}
			{modalPartida.open && (
				<div className="modal-overlay" onClick={closeModalPartida}>
					<div className="modal" onClick={(e) => e.stopPropagation()}>
						<h3>
							{tipo === 'truco' ? '🃏 Truco' : '🂡 Bisca'} - {modalPartida.fase} - Partida {modalPartida.numeroPartida}
						</h3>
						<p style={{ color: "var(--muted)", fontSize: 14, margin: "8px 0" }}>
							{modalPartida.equipeA} vs {modalPartida.equipeB}
						</p>
						<form onSubmit={saveModalPartida} className="form">
							<div className="row">
								<label>
									{tipo === 'truco' ? 'Tentos' : 'Pontos'} — {modalPartida.equipeA}
								</label>
								<input 
									type="number" 
									min="0" 
									max={tipo === 'truco' ? 24 : 120}
									value={modalPartida.scoreA} 
									onChange={(e) => setModalPartida(s => ({ ...s, scoreA: e.target.value }))} 
									required 
								/>
							</div>
							<div className="row">
								<label>
									{tipo === 'truco' ? 'Tentos' : 'Pontos'} — {modalPartida.equipeB}
								</label>
								<input 
									type="number" 
									min="0" 
									max={tipo === 'truco' ? 24 : 120}
									value={modalPartida.scoreB} 
									onChange={(e) => setModalPartida(s => ({ ...s, scoreB: e.target.value }))} 
									required 
								/>
							</div>
							<div style={{ fontSize: 12, color: "var(--muted)", marginTop: 8, padding: 8, background: "rgba(45, 212, 191, 0.1)", borderRadius: 4 }}>
								{tipo === 'truco' && '💡 Truco: partida vai até 24 tentos'}
								{tipo === 'bisca' && '💡 Bisca: soma dos valores das cartas capturadas'}
							</div>
							<div className="actions">
								<button type="button" className="btn btn--ghost" onClick={closeModalPartida}>Cancelar</button>
								<button type="submit" className="btn btn--primary">Salvar</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}

export default SistemaEliminacaoMelhorDe3;
