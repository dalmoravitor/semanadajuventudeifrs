import React, { useState, useEffect } from "react";
import { useSudoku } from "../../hooks/useSudoku";

/**
 * ========================================
 * COMPONENTE SISTEMA SUDOKU
 * ========================================
 * 
 * Implementa as 3 fases da competição conforme regulamento:
 * - Primeira Fase: 3 subdivisões, 2 rodadas cada, somatório classifica 6 equipes
 * - Semifinal: 6 equipes, 3 sudokus cada, classifica 3 equipes
 * - Final: 3 equipes, eliminatória, define 1º/2º/3º
 */

function SistemaSudoku({ adminMode, modalidade }) {
	const {
		loading,
		todasEquipes,
		faseAtual,
		dados,
		salvarEquipesPrimeiraFase,
		salvarResultadoPrimeiraFase,
		avancarParaSemifinal,
		salvarResultadoSemifinal,
		avancarParaFinal,
		salvarRodadaFinal,
		finalizarCompetição
	} = useSudoku(modalidade?.id);

	const [modalResultado, setModalResultado] = useState({
		open: false,
		fase: null, // 'primeira' | 'semifinal'
		subdivisao: null,
		rodada: null,
		equipe: null
	});

	// States para modal
	const [tempoState, setTempoState] = useState('');
	const [errosState, setErrosState] = useState('');
	const [sudoku1, setSudoku1] = useState({ tempo: '', erros: '' });
	const [sudoku2, setSudoku2] = useState({ tempo: '', erros: '' });
	const [sudoku3, setSudoku3] = useState({ tempo: '', erros: '' });

	// States para seleção de equipes com dropdowns
	const [equipesSubdiv0, setEquipesSubdiv0] = useState([]);
	const [equipesSubdiv1, setEquipesSubdiv1] = useState([]);
	const [equipesSubdiv2, setEquipesSubdiv2] = useState([]);

	// States para a final
	const [rodadaAtual, setRodadaAtual] = useState({});
	const [modoFinalizacao, setModoFinalizacao] = useState(false);
	const [posicoes, setPosicoes] = useState({ primeiro: '', segundo: '', terceiro: '' });

	// Limpar estados da final quando mudar de fase
	useEffect(() => {
		if (faseAtual !== 'final' && faseAtual !== 'concluido') {
			setRodadaAtual({});
			setModoFinalizacao(false);
			setPosicoes({ primeiro: '', segundo: '', terceiro: '' });
		}
	}, [faseAtual]);

	if (loading) {
		return (
			<div style={{ textAlign: "center", padding: "40px 20px" }}>
				<p style={{ color: "var(--muted)" }}>Carregando dados...</p>
			</div>
		);
	}

	// ========================================
	// RENDER PRIMEIRA FASE
	// ========================================
	
	const renderPrimeiraFase = () => (
		<div>
			<article className="card" style={{ marginBottom: 24, background: "linear-gradient(135deg, rgba(45, 212, 191, 0.1) 0%, rgba(251, 191, 36, 0.1) 100%)" }}>
				<div className="card__body">
					<h3 style={{ margin: "0 0 8px 0", fontSize: 18, color: "var(--primary)" }}>
						📊 Primeira Fase - Classificatória (2 Rodadas)
					</h3>
					<p style={{ margin: 0, fontSize: 14, color: "var(--muted)" }}>
						3 subdivisões (5, 5 e 6 equipes). Cada equipe resolve 2 sudokus (1 por rodada) em até 10 minutos cada.
						<br />
						<strong>Penalidades:</strong> até 3 erros = 15min fixos | mais de 3 erros ou não concluiu = 16min fixos
						<br />
						<strong>Classificam:</strong> 2 melhores de cada subdivisão pelo <strong>SOMATÓRIO das 2 rodadas</strong> (6 equipes total)
					</p>
				</div>
			</article>

			{dados.primeiraFase.subdivisoes.map((subdivisao, idx) => (
				<article key={idx} className="card" style={{ marginBottom: 24 }}>
					<div className="card__header">
						<h3 className="card__title">{subdivisao.nome}</h3>
					</div>
					<div className="card__body">
						{/* Seleção de equipes */}
						{adminMode && subdivisao.equipes.length === 0 && (
							<div style={{ marginBottom: 16 }}>
								<label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>
									Selecione as {[5, 5, 6][idx]} equipes:
								</label>
								{Array.from({ length: [5, 5, 6][idx] }).map((_, posicao) => {
									const equipesState = [equipesSubdiv0, equipesSubdiv1, equipesSubdiv2][idx];
									const setEquipesState = [setEquipesSubdiv0, setEquipesSubdiv1, setEquipesSubdiv2][idx];
									
									const equipesDisponiveis = todasEquipes.filter(eq => 
										!equipesState.some((selected, i) => i !== posicao && selected === eq.id)
									);

									return (
										<div key={posicao} style={{ marginBottom: 8 }}>
											<select
												className="inputLogin"
												style={{ width: "100%" }}
												value={equipesState[posicao] || ''}
												onChange={(e) => {
													const novasEquipes = [...equipesState];
													novasEquipes[posicao] = e.target.value;
													setEquipesState(novasEquipes);
												}}
											>
												<option value="">-- Selecione a equipe {posicao + 1} --</option>
												{equipesDisponiveis.map(eq => (
													<option key={eq.id} value={eq.id}>{eq.nome}</option>
												))}
											</select>
										</div>
									);
								})}
								<button
									className="btn btn--primary"
									style={{ marginTop: 12, width: "100%" }}
									onClick={() => {
										const equipesState = [equipesSubdiv0, equipesSubdiv1, equipesSubdiv2][idx];
										const tamanhoEsperado = [5, 5, 6][idx];
										const equipesValidas = equipesState.filter(e => e);
										
										if (equipesValidas.length === tamanhoEsperado) {
											salvarEquipesPrimeiraFase(idx, equipesValidas);
										} else {
											alert(`Selecione todas as ${tamanhoEsperado} equipes!`);
										}
									}}
								>
									Confirmar Equipes
								</button>
							</div>
						)}

						{/* Tabela de resultados */}
						{subdivisao.equipes.length > 0 && (
							<table className="home-table" style={{ marginBottom: 0 }}>
								<thead>
									<tr>
										<th>Equipe</th>
										<th style={{ width: 100 }}>Rodada 1</th>
										<th style={{ width: 100 }}>Rodada 2</th>
										<th style={{ width: 120 }}>Somatório</th>
										<th style={{ width: 140 }}>Ações</th>
									</tr>
								</thead>
								<tbody>
									{subdivisao.equipes
										.map(equipe => ({
											equipe,
											rodada1: subdivisao.rodada1[equipe.id],
											rodada2: subdivisao.rodada2[equipe.id],
											somatorio: subdivisao.somatorios[equipe.id]
										}))
										.sort((a, b) => {
											const somA = a.somatorio ?? Infinity;
											const somB = b.somatorio ?? Infinity;
											return somA - somB;
										})
										.map(({ equipe, rodada1, rodada2, somatorio }, position) => (
											<tr key={equipe.id} style={{ 
												background: position < 2 ? "rgba(45, 212, 191, 0.1)" : "transparent" 
											}}>
												<td style={{ fontWeight: position < 2 ? 700 : 400 }}>
													{position < 2 && "✓ "}{equipe.nome}
												</td>
												<td>
													{rodada1 ? formatarTempo(rodada1.tempoPenalizado) : "—"}
													{adminMode && (
														<button
															className="btn btn--ghost"
															onClick={() => setModalResultado({
																open: true,
																fase: 'primeira',
																subdivisao: idx,
																rodada: 1,
																equipe
															})}
															style={{ padding: "2px 8px", fontSize: 11, marginLeft: 4 }}
														>
															{rodada1 ? "✏️" : "➕"}
														</button>
													)}
												</td>
												<td>
													{rodada2 ? formatarTempo(rodada2.tempoPenalizado) : "—"}
													{adminMode && (
														<button
															className="btn btn--ghost"
															onClick={() => setModalResultado({
																open: true,
																fase: 'primeira',
																subdivisao: idx,
																rodada: 2,
																equipe
															})}
															style={{ padding: "2px 8px", fontSize: 11, marginLeft: 4 }}
														>
															{rodada2 ? "✏️" : "➕"}
														</button>
													)}
												</td>
												<td style={{ fontWeight: 700, color: position < 2 ? "var(--primary)" : "var(--text)" }}>
													{somatorio !== undefined ? formatarTempo(somatorio) : "—"}
												</td>
												<td>
													{/* Ações já estão nos botões acima */}
												</td>
											</tr>
										))}
								</tbody>
							</table>
						)}
					</div>
				</article>
			))}

			{/* Classificados da Primeira Fase */}
			{dados.primeiraFase.classificados.length > 0 && (
				<article className="card" style={{ marginBottom: 24, border: "2px solid var(--primary)" }}>
					<div className="card__header" style={{ background: "var(--primary)" }}>
						<h3 className="card__title" style={{ color: "white" }}>✅ Classificados para Semifinal</h3>
					</div>
					<div className="card__body">
						<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
							{dados.primeiraFase.classificados.map((equipe, idx) => (
								<div key={equipe.id} style={{ 
									padding: 12, 
									background: "rgba(45, 212, 191, 0.1)", 
									borderRadius: 8,
									border: "1px solid var(--primary)"
								}}>
									<strong>{idx + 1}º</strong> {equipe.nome}
								</div>
							))}
						</div>
					</div>
				</article>
			)}

			{/* Botão para avançar para Semifinal */}
			{adminMode && dados.primeiraFase.classificados.length === 6 && (
				<article className="card" style={{ marginBottom: 24 }}>
					<div className="card__body" style={{ textAlign: "center" }}>
						<button
							className="btn btn--primary"
							onClick={avancarParaSemifinal}
							style={{ padding: "12px 32px", fontSize: 16 }}
						>
							Avançar para Semifinal
						</button>
					</div>
				</article>
			)}
		</div>
	);

	// ========================================
	// RENDER SEMIFINAL
	// ========================================
	
	const renderSemifinal = () => (
		<div>
			<article className="card" style={{ marginBottom: 24, border: "2px solid var(--primary)" }}>
				<div className="card__header" style={{ background: "linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)" }}>
					<h3 className="card__title" style={{ fontSize: 18 }}>🏆 SEMIFINAL - 6 Equipes</h3>
				</div>
				<div className="card__body">
					<p style={{ color: "var(--muted)", marginBottom: 16 }}>
						6 equipes classificadas resolvem 3 sudokus (até 15min cada).
						<br />
						<strong>Penalidades:</strong> até 3 erros = 22min fixos | mais de 3 erros ou NC = 25min fixos
						<br />
						<strong>Classificam:</strong> 3 menores somatórios
						<br />
						<em>OBS: Os tempos da primeira fase NÃO contam (apenas como critério de desempate)</em>
					</p>

					<table className="home-table" style={{ marginBottom: 0 }}>
						<thead>
							<tr>
								<th>Equipe</th>
								<th style={{ width: 120 }}>Sudoku 1</th>
								<th style={{ width: 120 }}>Sudoku 2</th>
								<th style={{ width: 120 }}>Sudoku 3</th>
								<th style={{ width: 140 }}>Somatório</th>
								<th style={{ width: 120 }}>Ações</th>
							</tr>
						</thead>
						<tbody>
							{dados.semifinal.equipes
								.map(equipe => ({
									equipe,
									resultado: dados.semifinal.resultados[equipe.id]
								}))
								.sort((a, b) => {
									const somatorioA = a.resultado?.somatorio ?? Infinity;
									const somatorioB = b.resultado?.somatorio ?? Infinity;
									return somatorioA - somatorioB;
								})
								.map(({ equipe, resultado }, position) => (
									<tr key={equipe.id} style={{ 
										background: position < 3 ? "rgba(45, 212, 191, 0.1)" : "transparent" 
									}}>
										<td style={{ fontWeight: position < 3 ? 700 : 400 }}>
											{position < 3 && "✓ "}{equipe.nome}
										</td>
										<td>{resultado ? formatarTempo(resultado.sudoku1.tempoPenalizado) : "—"}</td>
										<td>{resultado ? formatarTempo(resultado.sudoku2.tempoPenalizado) : "—"}</td>
										<td>{resultado ? formatarTempo(resultado.sudoku3.tempoPenalizado) : "—"}</td>
										<td style={{ fontWeight: 700, color: position < 3 ? "var(--primary)" : "var(--text)" }}>
											{resultado ? formatarTempo(resultado.somatorio) : "—"}
										</td>
										<td>
											{adminMode && (
												<button
													className="btn btn--ghost"
													onClick={() => setModalResultado({
														open: true,
														fase: 'semifinal',
														subdivisao: null,
														rodada: null,
														equipe
													})}
													style={{ padding: "4px 12px", fontSize: 12 }}
												>
													{resultado ? "Editar" : "Inserir"}
												</button>
											)}
										</td>
									</tr>
								))}
						</tbody>
					</table>
				</div>
			</article>

			{/* Finalistas */}
			{dados.semifinal.classificados.length > 0 && (
				<article className="card" style={{ marginBottom: 24, border: "2px solid var(--primary)" }}>
					<div className="card__header" style={{ background: "linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)" }}>
						<h3 className="card__title" style={{ color: "white" }}>🏆 Finalistas</h3>
					</div>
					<div className="card__body">
						<div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
							{dados.semifinal.classificados.map((equipe, idx) => (
								<div key={equipe.id} style={{ 
									padding: 16, 
									background: idx === 0 ? "rgba(251, 191, 36, 0.2)" :
												idx === 1 ? "rgba(156, 163, 175, 0.2)" :
												"rgba(205, 127, 50, 0.2)",
									borderRadius: 8,
									border: "2px solid var(--primary)",
									textAlign: "center",
									fontSize: 15,
									fontWeight: 700
								}}>
									{idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"} {equipe.nome}
								</div>
							))}
						</div>
					</div>
				</article>
			)}

			{/* Botão para avançar para Final */}
			{adminMode && dados.semifinal.classificados.length === 3 && (
				<article className="card" style={{ marginBottom: 24 }}>
					<div className="card__body" style={{ textAlign: "center" }}>
						<button
							className="btn btn--primary"
							onClick={avancarParaFinal}
							style={{ padding: "12px 32px", fontSize: 16 }}
						>
							Avançar para Final
						</button>
					</div>
				</article>
			)}
		</div>
	);

	// ========================================
	// RENDER FINAL
	// ========================================
	
	const renderFinal = () => {
		// Debug: verificar estado
		console.log('=== RENDER FINAL ===');
		console.log('Equipes da final:', dados.final.equipes);
		console.log('Rodada atual (estado):', rodadaAtual);
		
		// Equipes ainda ativas (não eliminadas nas rodadas anteriores)
		const equipesAtivas = dados.final.equipes.filter(equipe => {
			return !dados.final.rodadas.some(rodada => 
				rodada.eliminados.some(elim => elim.id === equipe.id)
			);
		});

		// Total de equipes eliminadas
		const totalEliminados = dados.final.rodadas.reduce((acc, rodada) => 
			acc + rodada.eliminados.length, 0
		);

		const handleSalvarRodada = () => {
			// Verificar se todos os resultados foram preenchidos
			const resultadosCompletos = equipesAtivas.every(eq => rodadaAtual[eq.id]);
			
			if (!resultadosCompletos) {
				alert('Preencha o resultado de todas as equipes!');
				return;
			}

			salvarRodadaFinal(rodadaAtual);
			setRodadaAtual({});
		};

		const handleFinalizarCompetição = () => {
			if (!posicoes.primeiro || !posicoes.segundo || !posicoes.terceiro) {
				alert('Selecione todas as posições!');
				return;
			}

			const equipe1 = dados.final.equipes.find(eq => eq.id === posicoes.primeiro);
			const equipe2 = dados.final.equipes.find(eq => eq.id === posicoes.segundo);
			const equipe3 = dados.final.equipes.find(eq => eq.id === posicoes.terceiro);

			finalizarCompetição([equipe1, equipe2, equipe3]);
			setModoFinalizacao(false);
		};

		return (
			<div>
				<article className="card" style={{ marginBottom: 24, border: "3px solid var(--accent)" }}>
					<div className="card__header" style={{ background: "linear-gradient(135deg, var(--accent) 0%, var(--primary) 100%)" }}>
						<h3 className="card__title" style={{ fontSize: 20 }}>👑 GRANDE FINAL</h3>
					</div>
					<div className="card__body">
						<p style={{ color: "var(--muted)", marginBottom: 16 }}>
							3 finalistas disputam 2 sudokus simultâneos.
							<br />
							<strong>Regra:</strong> Qualquer erro = desclassificação imediata
							<br />
							<strong>Rodadas sucessivas até ordenar 1º, 2º e 3º lugares</strong>
						</p>

						{/* Finalistas */}
						<div style={{ marginBottom: 24 }}>
							<h4 style={{ marginBottom: 12 }}>🏆 Finalistas:</h4>
							<div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
								{dados.final.equipes.map((equipe, idx) => {
									const foiEliminado = dados.final.rodadas.some(rodada => 
										rodada.eliminados.some(elim => elim.id === equipe.id)
									);
									
									return (
										<div key={equipe.id} style={{ 
											padding: 12, 
											background: foiEliminado ? "rgba(239, 68, 68, 0.1)" : "rgba(45, 212, 191, 0.1)",
											borderRadius: 8,
											border: `2px solid ${foiEliminado ? '#ef4444' : 'var(--primary)'}`,
											textAlign: 'center',
											fontWeight: 700,
											opacity: foiEliminado ? 0.5 : 1
										}}>
											{foiEliminado && "❌ "}{equipe.nome}
										</div>
									);
								})}
							</div>
						</div>

						{/* Histórico de Rodadas */}
						{dados.final.rodadas.length > 0 && (
							<div style={{ marginBottom: 24 }}>
								<h4 style={{ marginBottom: 12 }}>📋 Histórico de Rodadas:</h4>
								{dados.final.rodadas.map((rodada, idx) => (
									<div key={idx} style={{ 
										padding: 12, 
										background: "rgba(100, 100, 100, 0.05)",
										borderRadius: 6,
										marginBottom: 8,
										border: "1px solid #e5e7eb"
									}}>
										<strong>Rodada {idx + 1}</strong>
										{rodada.eliminados.length > 0 ? (
											<span style={{ marginLeft: 8, color: "#ef4444" }}>
												❌ Eliminados: {rodada.eliminados.map(eq => eq.nome).join(', ')}
											</span>
										) : (
											<span style={{ marginLeft: 8, color: "var(--primary)" }}>
												✅ Nenhum eliminado
											</span>
										)}
									</div>
								))}
							</div>
						)}

						{/* Classificação Final (se já definida) */}
						{dados.final.classificacaoFinal.length > 0 ? (
							<div style={{ marginTop: 24 }}>
								<h4 style={{ marginBottom: 12 }}>🏅 Classificação Final:</h4>
								<table className="home-table" style={{ marginBottom: 0 }}>
									<thead>
										<tr>
											<th style={{ width: 80 }}>Posição</th>
											<th>Equipe</th>
											<th style={{ width: 100 }}>Pontos</th>
										</tr>
									</thead>
									<tbody>
										{dados.final.classificacaoFinal.map((equipe, idx) => (
											<tr key={equipe.id} style={{ 
												background: idx === 0 ? "rgba(251, 191, 36, 0.2)" :
															idx === 1 ? "rgba(156, 163, 175, 0.2)" :
															idx === 2 ? "rgba(205, 127, 50, 0.2)" : "transparent"
											}}>
												<td style={{ fontWeight: 700, fontSize: 16 }}>
													{idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"} {idx + 1}º
												</td>
												<td style={{ fontWeight: 700, fontSize: 15 }}>
													{equipe.nome}
												</td>
												<td style={{ fontWeight: 700 }}>
													{[160, 150, 140][idx]} pts
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						) : adminMode && (
							<>
								{/* Nova Rodada */}
								{!modoFinalizacao && equipesAtivas.length > 0 && (
									<div style={{ marginTop: 24, padding: 16, background: "rgba(251, 191, 36, 0.05)", borderRadius: 8 }}>
										<h4 style={{ marginTop: 0, marginBottom: 16 }}>
											➕ Registrar Rodada {dados.final.rodadas.length + 1}
										</h4>
										
										<table className="home-table" style={{ marginBottom: 16 }}>
											<thead>
												<tr>
													<th>Equipe</th>
													<th style={{ width: 200 }}>Resultado</th>
												</tr>
											</thead>
											<tbody>
												{equipesAtivas.map(equipe => {
													console.log('Equipe na final:', equipe.id, equipe.nome); // Debug
													return (
														<tr key={equipe.id}>
															<td style={{ fontWeight: 600 }}>
																{equipe.nome}
																<span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 8 }}>
																	(ID: {equipe.id})
																</span>
															</td>
															<td>
																<div style={{ display: 'flex', gap: 8 }}>
																	<button
																		className={rodadaAtual[equipe.id] === 'acertou' ? 'btn btn--primary' : 'btn btn--ghost'}
																		onClick={() => {
																			console.log('Marcando acertou para:', equipe.id, equipe.nome);
																			const novaRodada = { ...rodadaAtual, [equipe.id]: 'acertou' };
																			console.log('Nova rodada:', novaRodada);
																			setRodadaAtual(novaRodada);
																		}}
																		style={{ flex: 1, padding: '6px 12px' }}
																	>
																		✅ Acertou
																	</button>
																	<button
																		className={rodadaAtual[equipe.id] === 'errou' ? 'btn btn--ghost' : 'btn btn--ghost'}
																		onClick={() => {
																			console.log('Marcando errou para:', equipe.id, equipe.nome);
																			const novaRodada = { ...rodadaAtual, [equipe.id]: 'errou' };
																			console.log('Nova rodada:', novaRodada);
																			setRodadaAtual(novaRodada);
																		}}
																		style={{ 
																			flex: 1, 
																			padding: '6px 12px',
																			background: rodadaAtual[equipe.id] === 'errou' ? '#ef4444' : 'transparent',
																			color: rodadaAtual[equipe.id] === 'errou' ? 'white' : 'inherit',
																			borderColor: rodadaAtual[equipe.id] === 'errou' ? '#ef4444' : '#e5e7eb'
																		}}
																	>
																		❌ Errou
																	</button>
																</div>
															</td>
														</tr>
													);
												})}
											</tbody>
										</table>

										<div style={{ display: 'flex', gap: 12 }}>
											<button
												className="btn btn--primary"
												onClick={handleSalvarRodada}
												style={{ flex: 1 }}
											>
												Salvar Rodada
											</button>
											{equipesAtivas.length <= 3 && totalEliminados > 0 && (
												<button
													className="btn btn--accent"
													onClick={() => setModoFinalizacao(true)}
													style={{ flex: 1 }}
												>
													Finalizar Competição
												</button>
											)}
										</div>
									</div>
								)}

								{/* Modo Finalização */}
								{modoFinalizacao && (
									<div style={{ marginTop: 24, padding: 16, background: "rgba(45, 212, 191, 0.1)", borderRadius: 8, border: "2px solid var(--primary)" }}>
										<h4 style={{ marginTop: 0, marginBottom: 16 }}>🏆 Definir Classificação Final</h4>
										
										<div style={{ display: 'grid', gap: 12, marginBottom: 16 }}>
											<div>
												<label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>
													🥇 1º Lugar:
												</label>
												<select 
													className="inputLogin"
													value={posicoes.primeiro}
													onChange={(e) => setPosicoes({ ...posicoes, primeiro: e.target.value })}
													style={{ width: '100%' }}
												>
													<option value="">-- Selecione --</option>
													{dados.final.equipes
														.filter(eq => eq.id !== posicoes.segundo && eq.id !== posicoes.terceiro)
														.map(eq => (
															<option key={eq.id} value={eq.id}>{eq.nome}</option>
														))
													}
												</select>
											</div>

											<div>
												<label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>
													🥈 2º Lugar:
												</label>
												<select 
													className="inputLogin"
													value={posicoes.segundo}
													onChange={(e) => setPosicoes({ ...posicoes, segundo: e.target.value })}
													style={{ width: '100%' }}
												>
													<option value="">-- Selecione --</option>
													{dados.final.equipes
														.filter(eq => eq.id !== posicoes.primeiro && eq.id !== posicoes.terceiro)
														.map(eq => (
															<option key={eq.id} value={eq.id}>{eq.nome}</option>
														))
													}
												</select>
											</div>

											<div>
												<label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>
													🥉 3º Lugar:
												</label>
												<select 
													className="inputLogin"
													value={posicoes.terceiro}
													onChange={(e) => setPosicoes({ ...posicoes, terceiro: e.target.value })}
													style={{ width: '100%' }}
												>
													<option value="">-- Selecione --</option>
													{dados.final.equipes
														.filter(eq => eq.id !== posicoes.primeiro && eq.id !== posicoes.segundo)
														.map(eq => (
															<option key={eq.id} value={eq.id}>{eq.nome}</option>
														))
													}
												</select>
											</div>
										</div>

										<div style={{ display: 'flex', gap: 12 }}>
											<button
												className="btn btn--ghost"
												onClick={() => {
													setModoFinalizacao(false);
													setPosicoes({ primeiro: '', segundo: '', terceiro: '' });
												}}
												style={{ flex: 1 }}
											>
												Cancelar
											</button>
											<button
												className="btn btn--primary"
												onClick={handleFinalizarCompetição}
												style={{ flex: 1 }}
											>
												Confirmar Classificação
											</button>
										</div>
									</div>
								)}

								{/* Mensagem se todos foram eliminados */}
								{equipesAtivas.length === 0 && dados.final.classificacaoFinal.length === 0 && (
									<div style={{ marginTop: 16, padding: 16, background: "rgba(239, 68, 68, 0.1)", borderRadius: 8, textAlign: 'center' }}>
										<p style={{ margin: 0, color: "#ef4444", fontWeight: 600 }}>
											⚠️ Todas as equipes foram eliminadas. Defina a classificação final manualmente.
										</p>
										<button
											className="btn btn--primary"
											onClick={() => setModoFinalizacao(true)}
											style={{ marginTop: 12 }}
										>
											Definir Classificação
										</button>
									</div>
								)}
							</>
						)}
					</div>
				</article>
			</div>
		);
	};

	// ========================================
	// MODAL DE RESULTADO
	// ========================================
	
	const renderModal = () => {
		if (!modalResultado.open) return null;

		const { fase, subdivisao, rodada, equipe } = modalResultado;

		const handleSubmit = (e) => {
			e.preventDefault();

			if (fase === 'primeira') {
				salvarResultadoPrimeiraFase(subdivisao, equipe.id, rodada, tempoState, errosState);
			} else if (fase === 'semifinal') {
				salvarResultadoSemifinal(equipe.id, sudoku1, sudoku2, sudoku3);
			}

			// Limpar states e fechar modal
			setTempoState('');
			setErrosState('');
			setSudoku1({ tempo: '', erros: '' });
			setSudoku2({ tempo: '', erros: '' });
			setSudoku3({ tempo: '', erros: '' });
			setModalResultado({ open: false, fase: null, subdivisao: null, rodada: null, equipe: null });
		};

		return (
			<div className="modal-overlay" onClick={() => setModalResultado(m => ({ ...m, open: false }))} style={{ 
				display: 'flex', 
				alignItems: 'center', 
				justifyContent: 'center',
				padding: '20px'
			}}>
				<div className="modal" onClick={(e) => e.stopPropagation()} style={{ 
					maxHeight: '90vh', 
					overflowY: 'auto',
					width: '100%',
					maxWidth: '500px',
					margin: 'auto'
				}}>
					<h3 style={{ marginTop: 0 }}>
						Resultado - {equipe.nome}
					</h3>
					<p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 16 }}>
						{fase === 'primeira' ? `Primeira Fase - Rodada ${rodada}` : 'Semifinal (3 Sudokus)'}
					</p>
					<form onSubmit={handleSubmit} className="form">
						{fase === 'primeira' ? (
							<>
								<div className="row">
									<label>Tempo (segundos)</label>
									<input
										type="number"
										min="0"
										max="600"
										value={tempoState}
										onChange={(e) => setTempoState(e.target.value)}
										required
									/>
								</div>
								<div className="row">
									<label>Erros</label>
									<input
										type="number"
										min="0"
										max="10"
										value={errosState}
										onChange={(e) => setErrosState(e.target.value)}
										required
									/>
								</div>
							</>
						) : (
							<>
								<h4 style={{ marginTop: 0, marginBottom: 12 }}>Sudoku 1</h4>
								<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
									<div className="row" style={{ margin: 0 }}>
										<label style={{ fontSize: 13 }}>Tempo (seg)</label>
										<input
											type="number"
											value={sudoku1.tempo}
											onChange={(e) => setSudoku1({ ...sudoku1, tempo: e.target.value })}
											required
										/>
									</div>
									<div className="row" style={{ margin: 0 }}>
										<label style={{ fontSize: 13 }}>Erros</label>
										<input
											type="number"
											value={sudoku1.erros}
											onChange={(e) => setSudoku1({ ...sudoku1, erros: e.target.value })}
											required
										/>
									</div>
								</div>

								<h4 style={{ marginBottom: 12 }}>Sudoku 2</h4>
								<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
									<div className="row" style={{ margin: 0 }}>
										<label style={{ fontSize: 13 }}>Tempo (seg)</label>
										<input
											type="number"
											value={sudoku2.tempo}
											onChange={(e) => setSudoku2({ ...sudoku2, tempo: e.target.value })}
											required
										/>
									</div>
									<div className="row" style={{ margin: 0 }}>
										<label style={{ fontSize: 13 }}>Erros</label>
										<input
											type="number"
											value={sudoku2.erros}
											onChange={(e) => setSudoku2({ ...sudoku2, erros: e.target.value })}
											required
										/>
									</div>
								</div>

								<h4 style={{ marginBottom: 12 }}>Sudoku 3</h4>
								<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
									<div className="row" style={{ margin: 0 }}>
										<label style={{ fontSize: 13 }}>Tempo (seg)</label>
										<input
											type="number"
											value={sudoku3.tempo}
											onChange={(e) => setSudoku3({ ...sudoku3, tempo: e.target.value })}
											required
										/>
									</div>
									<div className="row" style={{ margin: 0 }}>
										<label style={{ fontSize: 13 }}>Erros</label>
										<input
											type="number"
											value={sudoku3.erros}
											onChange={(e) => setSudoku3({ ...sudoku3, erros: e.target.value })}
											required
										/>
									</div>
								</div>
							</>
						)}

						<div className="actions" style={{ 
							position: 'sticky', 
							bottom: 0, 
							background: 'white', 
							padding: '16px 0 0 0',
							marginTop: 16,
							borderTop: '1px solid #e5e7eb'
						}}>
							<button type="button" className="btn btn--ghost" onClick={() => setModalResultado(m => ({ ...m, open: false }))}>
								Cancelar
							</button>
							<button type="submit" className="btn btn--primary">
								Salvar
							</button>
						</div>
					</form>
				</div>
			</div>
		);
	};

	// ========================================
	// RENDER PRINCIPAL
	// ========================================
	
	return (
		<div style={{ margin: "24px auto", maxWidth: 1200 }}>
			{/* Header da competição */}
			<article className="card" style={{ marginBottom: 24 }}>
				<div className="card__body">
					<h2 style={{ margin: "0 0 8px 0" }}>🧩 Sudoku - Competição Multi-Etapas</h2>
					<div style={{ display: "flex", gap: 12, marginTop: 12 }}>
						{['primeira', 'semifinal', 'final'].map(fase => (
							<div
								key={fase}
								style={{
									flex: 1,
									padding: "8px 12px",
									borderRadius: 6,
									background: faseAtual === fase ? "var(--primary)" : "rgba(100, 100, 100, 0.2)",
									color: faseAtual === fase ? "white" : "var(--muted)",
									textAlign: "center",
									fontWeight: faseAtual === fase ? 700 : 400,
									fontSize: 13
								}}
							>
								{fase === 'primeira' ? "Primeira Fase" : fase === 'semifinal' ? "Semifinal" : "Final"}
							</div>
						))}
					</div>
				</div>
			</article>

			{/* Renderizar fase atual */}
			{faseAtual === 'primeira' && renderPrimeiraFase()}
			{faseAtual === 'semifinal' && renderSemifinal()}
			{faseAtual === 'final' && renderFinal()}
			{faseAtual === 'concluido' && renderFinal()} {/* Mostra resultado final */}

			{/* Modal de resultado */}
			{renderModal()}
		</div>
	);
}

// Helper para formatar tempo (segundos → MM:SS)
function formatarTempo(segundos) {
	if (!segundos && segundos !== 0) return "—";
	const minutos = Math.floor(segundos / 60);
	const segs = segundos % 60;
	return `${minutos}:${segs.toString().padStart(2, '0')}`;
}

export default SistemaSudoku;
