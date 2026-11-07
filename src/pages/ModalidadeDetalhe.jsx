import React, { useMemo, useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import "./Home.css";
import "./ModalidadeDetalhe.css";
import Header from "../components/Header";
import { updateModalidade } from "../api/modalidades";
import { getServerTimestamp } from "../api/helpers";
import { withModalidadeData } from "../hocs/withModalidadeData";
import { useChaves } from "../hooks/useChaves";
import { useResultadosChaves } from "../hooks/useResultadosChaves";
import { 
	gerarChavesVazias,
	chaveEstaCompleta,
	todasChavesCompletas as todasChavesCompletasService,
	extrairVencedor,
	extrairPerdedor
} from "../services/chavesService";
import { 
	calcularClassificacaoChave, 
	selecionarClassificados, 
	gerarConfrontosQuartas,
	gerarConfrontosSemis,
	gerarConfrontosFinais,
	processarVencedoresQuartas,
	processarVencedoresSemis,
	verificarChavesCompletas 
} from "../services/pontuacaoService";
import { gerarRanking, saveRankingModalidade, getRankingModalidade } from "../api/ranking";
import { getChaves as getChavesApi } from "../api/resultados";
import RankingModalidade from "../components/RankingModalidade";
import RankingModalidadeEditor from "../components/RankingModalidadeEditor";

// ========================================
// IMPORTS DOS SISTEMAS MODULARES
// ========================================
import SistemaInscricao from "../components/sistemas/SistemaInscricao";
import SistemaDisciplina from "../components/sistemas/SistemaDisciplina";
import BracketEliminatorias from "../components/BracketEliminatorias";
import SistemaPresencas from "../components/sistemas/SistemaPresencas";
import SistemaPontuacaoFixa from "../components/sistemas/SistemaPontuacaoFixa";
import SistemaTempo from "../components/sistemas/SistemaTempo";
import SistemaBateriaUnica from "../components/sistemas/SistemaBateriaUnica";
import SistemaBochaCampeira from "../components/sistemas/SistemaBochaCampeira";
import SistemaKahoot from "../components/sistemas/SistemaKahoot";
import SistemaMelhorDe3 from "../components/sistemas/SistemaMelhorDe3";
import SistemaPontuacaoAcumulada from "../components/sistemas/SistemaPontuacaoAcumulada";
import SistemaSoletrando from "../components/sistemas/SistemaSoletrando";
import SistemaChavesEliminatorias from "../components/sistemas/SistemaChavesEliminatorias";
import SistemaEliminacaoSimples from "../components/sistemas/SistemaEliminacaoSimples";
import SistemaEliminacaoMelhorDe3 from "../components/sistemas/SistemaEliminacaoMelhorDe3";
import SistemaSudoku from "../components/sistemas/SistemaSudoku";
import { calcularClassificacaoChave as calcularClassificacaoChaveAvancado } from "../services/chavesService";

// ========================================
// COMPONENTES AUXILIARES
// ========================================

// Tabela de Chaves - permite selecionar equipes do banco de dados
function TabelaChaves({ chaves, setChaves, adminMode, equipesDisponiveis = [], modalidadeId }) {
	const [salvando, setSalvando] = useState(false);
	const [mensagemSalvar, setMensagemSalvar] = useState(null);

	const handleEquipeChange = (chaveIdx, equipeIdx, equipeId) => {
		if (!adminMode) return;
		
		// Encontrar equipe selecionada
		const equipeSelecionada = equipesDisponiveis.find(e => e.id === equipeId);
		
		const newChaves = [...chaves];
		// Salvar o ID da equipe (não o nome)
		newChaves[chaveIdx].equipes[equipeIdx] = equipeSelecionada ? equipeSelecionada.nome : "";
		newChaves[chaveIdx].equipesIds = newChaves[chaveIdx].equipesIds || [];
		newChaves[chaveIdx].equipesIds[equipeIdx] = equipeId;
		
		setChaves(newChaves);
		// Limpar mensagem ao fazer mudanças
		if (mensagemSalvar) setMensagemSalvar(null);
	};

	const handleSalvarChaves = async () => {
		if (!adminMode || !modalidadeId) return;

		// Verificar se todas as chaves têm equipes preenchidas
		const chavesIncompletas = chaves.some(chave => 
			chave.equipes.some(equipe => !equipe || equipe.trim() === "")
		);

		if (chavesIncompletas) {
			setMensagemSalvar({ 
				tipo: "erro", 
				texto: "⚠️ Preencha todas as equipes antes de salvar!" 
			});
			return;
		}

		setSalvando(true);
		setMensagemSalvar(null);

		try {
			const { saveChaves } = require('../api/resultados');
			const result = await saveChaves(modalidadeId, { chaves });

			if (result.success) {
				setMensagemSalvar({ 
					tipo: "sucesso", 
					texto: "✅ Chaves salvas com sucesso!" 
				});
				
				// Limpar mensagem após 3 segundos
				setTimeout(() => setMensagemSalvar(null), 3000);
			} else {
				setMensagemSalvar({ 
					tipo: "erro", 
					texto: `❌ Erro ao salvar: ${result.error}` 
				});
			}
		} catch (error) {
			console.error("Erro ao salvar chaves:", error);
			setMensagemSalvar({ 
				tipo: "erro", 
				texto: "❌ Erro ao salvar chaves. Tente novamente." 
			});
		} finally {
			setSalvando(false);
		}
	};

	// Obter equipes já selecionadas para desabilitar nos outros dropdowns
	const getEquipesSelecionadas = () => {
		const selecionadas = new Set();
		chaves.forEach(chave => {
			if (chave.equipesIds) {
				chave.equipesIds.forEach(id => {
					if (id) selecionadas.add(id);
				});
			}
		});
		return selecionadas;
	};

	const equipesSelecionadas = getEquipesSelecionadas();

	return (
		<article className="card" style={{ marginTop: 24 }}>
			<div className="card__header">
				<h2 className="card__title">⚽ Chaves da Modalidade</h2>
				<p style={{ color: "var(--muted)", fontSize: 13, marginTop: 8 }}>
					{adminMode ? "Selecione as equipes para cada chave. Cada equipe só pode participar de uma chave." : ""}
				</p>
			</div>
			<div className="card__body">
				<table className="home-table">
					<thead>
						<tr>
							<th style={{ width: 100 }}>Posição</th>
							{chaves.map((chave) => (
								<th key={chave.nome}>{chave.nome}</th>
							))}
						</tr>
					</thead>
					<tbody>
						{chaves[0]?.equipes.map((_, equipeIdx) => (
							<tr key={equipeIdx}>
								<td style={{ fontWeight: 700 }}>Equipe {equipeIdx + 1}</td>
								{chaves.map((chave, chaveIdx) => {
									const equipeIdSelecionada = chave.equipesIds?.[equipeIdx] || "";
									
									return (
										<td key={chaveIdx}>
											{adminMode ? (
												<select
													className="inputLogin"
													value={equipeIdSelecionada}
													onChange={(e) => handleEquipeChange(chaveIdx, equipeIdx, e.target.value)}
													style={{ 
														width: "100%", 
														padding: "8px",
														background: "var(--card)",
														color: "var(--text)",
														border: "1px solid rgba(255,255,255,0.16)",
														borderRadius: "8px"
													}}
												>
													<option value="">Selecione...</option>
													{equipesDisponiveis.map(equipe => {
														const jaUsada = equipesSelecionadas.has(equipe.id) && equipe.id !== equipeIdSelecionada;
														return (
															<option 
																key={equipe.id} 
																value={equipe.id}
																disabled={jaUsada}
																style={{ color: jaUsada ? "#888" : "inherit" }}
															>
																{equipe.nome} {jaUsada ? "(já selecionada)" : ""}
															</option>
														);
													})}
												</select>
											) : (
												<span>{chave.equipes[equipeIdx] || <span style={{ color: "var(--muted)" }}>—</span>}</span>
											)}
										</td>
									);
								})}
							</tr>
						))}
					</tbody>
				</table>
				
				{adminMode && equipesDisponiveis.length === 0 && (
					<div style={{ 
						textAlign: "center", 
						padding: "20px", 
						color: "var(--muted)",
						background: "rgba(255,193,7,0.1)",
						borderRadius: "8px",
						marginTop: "16px"
					}}>
						⚠️ Nenhuma equipe cadastrada no sistema. Cadastre equipes primeiro.
					</div>
				)}

				{/* Botão Salvar Chaves e Mensagem de Feedback */}
				{adminMode && equipesDisponiveis.length > 0 && (
					<div style={{ marginTop: "20px", textAlign: "center" }}>
						<button 
							className="btn btn--primary" 
							onClick={handleSalvarChaves}
							disabled={salvando}
							style={{ 
								padding: "12px 32px",
								fontSize: "16px",
								fontWeight: 600,
								minWidth: "200px"
							}}
						>
							{salvando ? (
								<>
									<span className="spinner" style={{ marginRight: "8px" }}></span>
									Salvando...
								</>
							) : (
								"💾 Salvar Chaves"
							)}
						</button>

						{mensagemSalvar && (
							<div style={{ 
								marginTop: "12px",
								padding: "12px 20px",
								borderRadius: "8px",
								fontWeight: 500,
								background: mensagemSalvar.tipo === "sucesso" 
									? "rgba(34, 197, 94, 0.15)" 
									: "rgba(239, 68, 68, 0.15)",
								color: mensagemSalvar.tipo === "sucesso" 
									? "#22c55e" 
									: "#ef4444",
								border: `1px solid ${mensagemSalvar.tipo === "sucesso" ? "#22c55e" : "#ef4444"}20`
							}}>
								{mensagemSalvar.texto}
							</div>
						)}
					</div>
				)}
			</div>
		</article>
	);
}

// Tabela de jogos por chave - REFATORADA para usar hooks
function TabelaJogosChaves({ chaves, adminMode, getResultadoJogo, setResultadoJogo, modalidadeId, modalidadeNome }) {
	// Modal para editar resultado
	const [modalJogo, setModalJogo] = useState({ 
		open: false, 
		chaveIdx: null, 
		jogoIdx: null, 
		equipeA: "", 
		equipeB: "", 
		scoreA: "", 
		scoreB: "" 
	});
	const [salvandoResultado, setSalvandoResultado] = useState(false);
	const [mensagemSalvarResultado, setMensagemSalvarResultado] = useState(null);
	const [, forceUpdate] = useState({}); // Para forçar re-render

	const openModalJogo = (chaveIdx, jogoIdx, equipeA, equipeB) => {
		const resultado = getResultadoJogo(chaveIdx, jogoIdx);
		
			setModalJogo({
			open: true,
			chaveIdx,
			jogoIdx,
			equipeA,
			equipeB,
			scoreA: resultado?.scoreA ?? "",
				scoreB: resultado?.scoreB ?? "",
				meta: resultado?.meta || {},
				modalidadeNome: modalidadeNome || ''
		});
		setMensagemSalvarResultado(null);
	};

	const closeModalJogo = () => {
		setModalJogo((s) => ({ ...s, open: false }));
		setMensagemSalvarResultado(null);
	};

		const saveModalJogo = async (e) => {
		e.preventDefault();
			const { chaveIdx, jogoIdx, scoreA, scoreB, equipeA, equipeB, meta } = modalJogo;
		
		// Validação básica
		if (scoreA === "" || scoreB === "") {
			setMensagemSalvarResultado({ 
				tipo: "erro", 
				texto: "⚠️ Preencha ambos os placares!" 
			});
			return;
		}

		setSalvandoResultado(true);
		setMensagemSalvarResultado(null);

		try {
			// 1. Atualizar no estado local (hook)
			setResultadoJogo(chaveIdx, jogoIdx, equipeA, equipeB, scoreA, scoreB, meta || {});

			// 2. Salvar no Firebase
			const { saveResultadoJogoChave } = require('../api/resultados');
					const result = await saveResultadoJogoChave(modalidadeId, chaveIdx, jogoIdx, {
						equipeA,
						equipeB,
						scoreA,
						scoreB,
						meta: meta || {}
					});

			if (result.success) {
				setMensagemSalvarResultado({ 
					tipo: "sucesso", 
					texto: "✅ Resultado salvo com sucesso!" 
				});
				
				// Forçar re-render para atualizar classificação
				forceUpdate({});
				
				// Fechar modal após 1.5 segundos
				setTimeout(() => {
					closeModalJogo();
				}, 1500);
			} else {
				setMensagemSalvarResultado({ 
					tipo: "erro", 
					texto: `❌ Erro: ${result.error}` 
				});
			}
		} catch (error) {
			console.error("Erro ao salvar resultado:", error);
			setMensagemSalvarResultado({ 
				tipo: "erro", 
				texto: "❌ Erro ao salvar resultado. Tente novamente." 
			});
		} finally {
			setSalvandoResultado(false);
		}
	};

	// Só renderiza se todas as equipes da chave estiverem preenchidas
	return (
		<div style={{ margin: "24px auto 18px", maxWidth: 880 }}>
			{chaves.map((chave, chaveIdx) => {
				const eqs = chave.equipes;
				const filled = eqs.every(e => e && e.trim() !== "");
				if (!filled) return null;

				const jogos = [
					{ equipeA: eqs[0], equipeB: eqs[1] },
					{ equipeA: eqs[1], equipeB: eqs[2] },
					{ equipeA: eqs[2], equipeB: eqs[0] }
				];

				return (
					<article className="card jogos-chave-card" key={chave.nome} style={{ marginBottom: 18 }}>
						<div className="card__header"><h3 className="card__title">Jogos da {chave.nome}</h3></div>
						<div className="card__body">
							<table className="home-table" style={{ marginBottom: 0 }}>
								<thead>
									<tr>
										<th>Jogo</th>
										<th>Equipe A</th>
										<th>Equipe B</th>
										<th>Resultado</th>
									</tr>
								</thead>
								<tbody>
									{jogos.map((jogo, jogoIdx) => {
										const resultado = getResultadoJogo(chaveIdx, jogoIdx);
										
										return (
											<tr key={jogoIdx}>
												<td>{jogoIdx + 1}</td>
												<td>{jogo.equipeA}</td>
												<td>{jogo.equipeB}</td>
												<td>
													{resultado ? (
														<span style={{ fontWeight: 700 }}>
															{resultado.scoreA} x {resultado.scoreB}
															{adminMode && (
																<button 
																	className="btn btn--ghost" 
																	onClick={() => openModalJogo(chaveIdx, jogoIdx, jogo.equipeA, jogo.equipeB)}
																	style={{ marginLeft: 8, padding: "4px 8px", fontSize: 12 }}
																>
																	Editar
																</button>
															)}
														</span>
													) : adminMode ? (
														<button 
															className="btn btn--primary" 
															onClick={() => openModalJogo(chaveIdx, jogoIdx, jogo.equipeA, jogo.equipeB)}
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

														{/* Classificação da chave */}
							{(() => {
								// Buscar todos os resultados dessa chave usando helper do service
								const resultadosChave = {};
								jogos.forEach((_, jogoIdx) => {
									const resultado = getResultadoJogo(chaveIdx, jogoIdx);
									if (resultado) {
										resultadosChave[jogoIdx] = resultado;
									}
								});

								console.log(`📊 Chave ${chaveIdx} - Resultados encontrados:`, Object.keys(resultadosChave).length);
								console.log(`   Dados dos resultados:`, resultadosChave);

								// Calcula classificação se houver pelo menos 1 resultado
								if (Object.keys(resultadosChave).length > 0) {
																	const classificacao = calcularClassificacaoChaveAvancado(eqs, resultadosChave, { modalidade: modalidadeNome });
									console.log(`   Classificação calculada:`, classificacao);
																	const nome = (modalidadeNome || '').toLowerCase();
																	const isVoleiPraia = nome.includes('praia');
																	const isVolei = nome.includes('vôlei') || nome.includes('volei');
																	const isFutsal = nome.includes('futsal');
																	const isHand = nome.includes('handebol');
																	const isBasq = nome.includes('basquete');
																	const isFifa = nome.includes('fifa');
																										const isMK = nome.includes('mortal') || nome.includes('kombat');
																										const isCabo = nome.includes('cabo') && nome.includes('guerra');
									
									return (
										<div style={{ marginTop: 16 }}>
											<h4 style={{ margin: "0 0 8px", fontSize: 15, color: "var(--text)" }}>📊 Classificação</h4>
											<table className="home-table" style={{ marginBottom: 0 }}>
												<thead>
													<tr>
														<th>#</th>
														<th>Equipe</th>
														<th>Pts</th>
														<th>J</th>
														<th>V</th>
														<th>E</th>
														<th>D</th>
														<th>GP</th>
														<th>GC</th>
														<th>SG</th>
																						{(isVolei || isVoleiPraia) && <th>Sets PF</th>}
																						{(isVolei || isVoleiPraia) && <th>Sets PS</th>}
																						{(isVolei || isVoleiPraia) && <th>Avg</th>}
																						{(isVolei) && <th>Disc(M)</th>}
																						{(isFutsal || isHand || isBasq || isFifa) && <th>Disc(M)</th>}
																						{(isFutsal || isHand || isBasq || isFifa) && <th>GF/J</th>}
																						{(isFutsal || isHand || isBasq || isFifa) && <th>GA/J</th>}
													</tr>
												</thead>
												<tbody>
													{classificacao.map((equipe, idx) => (
														<tr key={equipe.nome}>
															<td style={{ fontWeight: 700 }}>{idx + 1}º</td>
															<td>{equipe.nome}</td>
															<td style={{ fontWeight: 700, color: "var(--primary)" }}>{equipe.pontos}</td>
															<td>{equipe.jogos}</td>
															<td>{equipe.vitorias}</td>
															<td>{equipe.empates}</td>
															<td>{equipe.derrotas}</td>
															<td>{equipe.golsPro}</td>
															<td>{equipe.golsContra}</td>
															<td style={{ fontWeight: 600, color: equipe.saldoGols >= 0 ? "#22c55e" : "#ef4444" }}>
																{equipe.saldoGols > 0 ? `+${equipe.saldoGols}` : equipe.saldoGols}
															</td>
																							{(isVolei || isVoleiPraia) && <td>{equipe.setsPontosFeitos}</td>}
																							{(isVolei || isVoleiPraia) && <td>{equipe.setsPontosSofridos}</td>}
																							{(isVolei || isVoleiPraia) && <td>{Number.isFinite(equipe.setsAverage) ? equipe.setsAverage.toFixed(2) : '∞'}</td>}
																							{(isVolei || isFutsal || isHand || isBasq || isFifa) && (
																								<td>{(equipe.disciplinaMedia || 0).toFixed(2)}</td>
																							)}
																							{(isFutsal || isHand || isBasq || isFifa) && <td>{(equipe.mediaGolsFeitos || 0).toFixed(2)}</td>}
																							{(isFutsal || isHand || isBasq || isFifa) && <td>{(equipe.mediaGolsSofridos || 0).toFixed(2)}</td>}
														</tr>
													))}
												</tbody>
											</table>
																						{(() => {
																							const legend = (() => {
																								if (isVoleiPraia) return 'Confronto direto > Mais vitórias > Melhor razão de pontos (PF/PS) > Sorteio';
																								if (isVolei) return 'Confronto direto > Menor média disciplinar > Menos pontos de sets sofridos > Mais pontos de sets feitos > Sorteio';
																								if (isFifa) return 'Confronto direto > Maior saldo > Maior média de gols marcados > Menor média de gols sofridos > Sorteio';
																								if (isFutsal || isHand || isBasq) return 'Confronto direto > Menor média disciplinar > Menor média de gols/pontos sofridos > Maior média de gols/pontos feitos > Sorteio';
																								if (isMK) return 'Confronto direto > Sorteio';
																								if (isCabo) return 'Sorteio (observação: desclassificação zera pontos)';
																								return 'Mais vitórias > Maior saldo > Maior média de gols pró';
																							})();
																							return (
																								<div style={{ marginTop: 6, color: 'var(--muted)', fontSize: 12 }}>
																									Desempates (após pontos): {legend}
																								</div>
																							);
																						})()}
										</div>
									);
								}
								return null;
							})()}
						</div>
					</article>
				);
			})}

			{/* Modal de edição de jogo da chave */}
			{modalJogo.open && (
				<div className="modal-overlay" onClick={closeModalJogo}>
					<div className="modal" onClick={(e) => e.stopPropagation()}>
						<h3>Editar Resultado</h3>
						<p style={{ color: "var(--muted)", fontSize: 14, margin: "8px 0" }}>
							{modalJogo.equipeA} vs {modalJogo.equipeB}
						</p>
						<form onSubmit={saveModalJogo} className="form">
							<div className="row">
								<label>Gols/Pontos — {modalJogo.equipeA}</label>
								<input type="number" min="0" value={modalJogo.scoreA} onChange={(e) => setModalJogo((s) => ({ ...s, scoreA: e.target.value }))} required />
							</div>
							<div className="row">
								<label>Gols/Pontos — {modalJogo.equipeB}</label>
								<input type="number" min="0" value={modalJogo.scoreB} onChange={(e) => setModalJogo((s) => ({ ...s, scoreB: e.target.value }))} required />
							</div>

							{(() => {
								const nome = (modalidadeNome || '').toLowerCase();
								const isVoleiPraia = nome.includes('praia');
								const isVolei = nome.includes('vôlei') || nome.includes('volei');
								const isCabo = nome.includes('cabo') && nome.includes('guerra');
								const isHand = nome.includes('handebol');
								const isBasq = nome.includes('basquete');
								const showExclusao2 = isHand || isBasq;

								return (
									<>
										{(isVolei || isVoleiPraia) && (
											<div style={{ marginTop: 8, marginBottom: 8, padding: 10, borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)' }}>
												<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
													<div style={{ minWidth: 0 }}>
														<label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Sets — {modalJogo.equipeA}</label>
														<input type="number" min="0" step="1" className="inputLogin" value={modalJogo.meta?.setsPontosA ?? 0} onChange={(e)=> setModalJogo((s)=> ({ ...s, meta: { ...s.meta, setsPontosA: Number(e.target.value)||0 } }))} style={{ width: '100%', minWidth: 0 }} />
													</div>
													<div style={{ minWidth: 0 }}>
														<label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Sets — {modalJogo.equipeB}</label>
														<input type="number" min="0" step="1" className="inputLogin" value={modalJogo.meta?.setsPontosB ?? 0} onChange={(e)=> setModalJogo((s)=> ({ ...s, meta: { ...s.meta, setsPontosB: Number(e.target.value)||0 } }))} style={{ width: '100%', minWidth: 0 }} />
													</div>
												</div>
												<div style={{ marginTop: 6, color: 'var(--muted)', fontSize: 12 }}>
													Dica: informe o somatório dos pontos feitos em todos os sets por equipe (PF e PS). Ex.: 25-20, 25-22 → PF 50, PS 42.
												</div>
											</div>
										)}

										{/* Disciplina (mais claro: 3 por linha, com ajuda) */}
										<div style={{ marginTop: 8, padding: 10, borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)' }}>
											{/* Equipe A */}
											<div style={{ marginBottom: 10 }}>
												<label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Disciplina — {modalJogo.equipeA}</label>
												<div style={{ display: 'grid', gridTemplateColumns: showExclusao2 ? 'repeat(3, minmax(120px, 1fr))' : 'repeat(2, minmax(140px, 1fr))', gap: 10 }}>
													<div>
														<input type="number" min="0" step="1" placeholder="Cartões amarelos" className="inputLogin" value={modalJogo.meta?.disciplinaA?.amarelo ?? 0} onChange={(e)=> setModalJogo((s)=> ({ ...s, meta: { ...s.meta, disciplinaA: { ...(s.meta?.disciplinaA||{}), amarelo: Number(e.target.value)||0 } } }))} style={{ width: '100%' }} />
														<div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Total de cartões amarelos da equipe A</div>
													</div>
													<div>
														<input type="number" min="0" step="1" placeholder="Cartões vermelhos" className="inputLogin" value={modalJogo.meta?.disciplinaA?.vermelho ?? 0} onChange={(e)=> setModalJogo((s)=> ({ ...s, meta: { ...s.meta, disciplinaA: { ...(s.meta?.disciplinaA||{}), vermelho: Number(e.target.value)||0 } } }))} style={{ width: '100%' }} />
														<div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Total de cartões vermelhos da equipe A</div>
													</div>
													{showExclusao2 && (
														<div>
															<input type="number" min="0" step="1" placeholder="Exclusões 2'" className="inputLogin" value={modalJogo.meta?.disciplinaA?.exclusao2 ?? 0} onChange={(e)=> setModalJogo((s)=> ({ ...s, meta: { ...s.meta, disciplinaA: { ...(s.meta?.disciplinaA||{}), exclusao2: Number(e.target.value)||0 } } }))} style={{ width: '100%' }} />
															<div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Qtd de exclusões de 2 minutos (Hand/Basq)</div>
														</div>
													)}
												</div>
											</div>

											{/* Equipe B */}
											<div>
												<label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Disciplina — {modalJogo.equipeB}</label>
												<div style={{ display: 'grid', gridTemplateColumns: showExclusao2 ? 'repeat(3, minmax(120px, 1fr))' : 'repeat(2, minmax(140px, 1fr))', gap: 10 }}>
													<div>
														<input type="number" min="0" step="1" placeholder="Cartões amarelos" className="inputLogin" value={modalJogo.meta?.disciplinaB?.amarelo ?? 0} onChange={(e)=> setModalJogo((s)=> ({ ...s, meta: { ...s.meta, disciplinaB: { ...(s.meta?.disciplinaB||{}), amarelo: Number(e.target.value)||0 } } }))} style={{ width: '100%' }} />
														<div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Total de cartões amarelos da equipe B</div>
													</div>
													<div>
														<input type="number" min="0" step="1" placeholder="Cartões vermelhos" className="inputLogin" value={modalJogo.meta?.disciplinaB?.vermelho ?? 0} onChange={(e)=> setModalJogo((s)=> ({ ...s, meta: { ...s.meta, disciplinaB: { ...(s.meta?.disciplinaB||{}), vermelho: Number(e.target.value)||0 } } }))} style={{ width: '100%' }} />
														<div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Total de cartões vermelhos da equipe B</div>
													</div>
													{showExclusao2 && (
														<div>
															<input type="number" min="0" step="1" placeholder="Exclusões 2'" className="inputLogin" value={modalJogo.meta?.disciplinaB?.exclusao2 ?? 0} onChange={(e)=> setModalJogo((s)=> ({ ...s, meta: { ...s.meta, disciplinaB: { ...(s.meta?.disciplinaB||{}), exclusao2: Number(e.target.value)||0 } } }))} style={{ width: '100%' }} />
															<div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Qtd de exclusões de 2 minutos (Hand/Basq)</div>
														</div>
													)}
												</div>
											</div>

											<div style={{ marginTop: 8, color: 'var(--muted)', fontSize: 12 }}>
												Amarelo = 1 ponto, Vermelho = 3 pontos, Exclusão 2' = 2 pontos. A média por jogo (menor é melhor) é usada como critério de desempate.
											</div>
										</div>

										{isCabo && (
											<div style={{ marginTop: 10, padding: 10, borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)' }}>
												<div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
													<label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
														<input type="checkbox" checked={!!modalJogo.meta?.soltouCordaA} onChange={(e)=> setModalJogo((s)=> ({ ...s, meta: { ...s.meta, soltouCordaA: e.target.checked } }))} />
														{modalJogo.equipeA}: soltou a corda
													</label>
													<label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
														<input type="checkbox" checked={!!modalJogo.meta?.soltouCordaB} onChange={(e)=> setModalJogo((s)=> ({ ...s, meta: { ...s.meta, soltouCordaB: e.target.checked } }))} />
														{modalJogo.equipeB}: soltou a corda
													</label>
												</div>
												<div style={{ marginTop: 6, color: 'var(--muted)', fontSize: 12 }}>
													Atenção: marcar esta opção desclassifica a equipe e zera os pontos desta chave.
												</div>
											</div>
										)}
									</>
								);
							})()}

							{/* Mensagem de feedback */}
							{mensagemSalvarResultado && (
								<div style={{ 
									marginTop: "12px",
									padding: "10px 16px",
									borderRadius: "6px",
									fontSize: "14px",
									fontWeight: 500,
									textAlign: "center",
									background: mensagemSalvarResultado.tipo === "sucesso" 
										? "rgba(34, 197, 94, 0.15)" 
										: "rgba(239, 68, 68, 0.15)",
									color: mensagemSalvarResultado.tipo === "sucesso" 
										? "#22c55e" 
										: "#ef4444",
									border: `1px solid ${mensagemSalvarResultado.tipo === "sucesso" ? "#22c55e" : "#ef4444"}20`
								}}>
									{mensagemSalvarResultado.texto}
								</div>
							)}

							<div className="actions">
								<button type="button" className="btn btn--ghost" onClick={closeModalJogo} disabled={salvandoResultado}>
									Cancelar
								</button>
								<button type="submit" className="btn btn--primary" disabled={salvandoResultado}>
									{salvandoResultado ? (
										<>
											<span className="spinner" style={{ marginRight: "8px" }}></span>
											Salvando...
										</>
									) : (
										"💾 Salvar Resultado"
									)}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}

// Componente de Eliminatórias (Quartas, Semis, Final)

function TabelaEliminatorias({ 
	chaves, 
	resultados, 
	adminMode, 
	modalidadeId, 
	modalidadeNome,
	categoria,
	onResultadosChange,
	confrontosQuartasInicial = [],
	confrontosSemisInicial = [],
	confrontosFinalInicial = null,
	resultadosEliminatoriasInicial = {}
}) {
	const [confrontosQuartas, setConfrontosQuartas] = useState([]);
	const [confrontosSemis, setConfrontosSemis] = useState([]);
	const [confrontosFinal, setConfrontosFinal] = useState({ final: null, terceiro: null });
	const [resultadosEliminatorias, setResultadosEliminatorias] = useState({});
	const [modalEliminatoria, setModalEliminatoria] = useState({
		open: false,
		confrontoId: null,
		equipeA: "",
		equipeB: "",
		scoreA: "",
		scoreB: "",
		fase: "",
		meta: {},
	});
	const [salvandoEliminatoria, setSalvandoEliminatoria] = useState(false);
	const [mensagemEliminatoria, setMensagemEliminatoria] = useState(null);
	const [confrontosCarregados, setConfrontosCarregados] = useState(false);

	// Masculino tem 5 chaves (15 equipes), feminino e misto têm 4 chaves (12 equipes)
	const tem5Chaves = categoria === "masculino";

	// Carregar confrontos e resultados salvos do HOC ao montar (apenas uma vez)
	useEffect(() => {
		if (confrontosCarregados) return;

		console.log('🔍 Verificando dados iniciais do HOC...');
		
		// Se o HOC já carregou os dados, usar eles
		if (confrontosQuartasInicial && confrontosQuartasInicial.length > 0) {
			console.log('📥 Usando confrontos quartas do HOC:', confrontosQuartasInicial.length);
			setConfrontosQuartas(confrontosQuartasInicial);
		}
		
		if (confrontosSemisInicial && confrontosSemisInicial.length > 0) {
			console.log('📥 Usando confrontos semis do HOC:', confrontosSemisInicial.length);
			setConfrontosSemis(confrontosSemisInicial);
		}
		
		if (confrontosFinalInicial) {
			console.log('📥 Usando confronto final do HOC');
			setConfrontosFinal(confrontosFinalInicial);
		}

		// Carregar resultados das eliminatórias do HOC
		if (resultadosEliminatoriasInicial && Object.keys(resultadosEliminatoriasInicial).length > 0) {
			console.log('📥 Usando resultados eliminatórias do HOC:', Object.keys(resultadosEliminatoriasInicial).length);
			setResultadosEliminatorias(resultadosEliminatoriasInicial);
		}

		setConfrontosCarregados(true);
	}, [confrontosCarregados, confrontosQuartasInicial, confrontosSemisInicial, confrontosFinalInicial, resultadosEliminatoriasInicial]);

	// Notifica o componente pai sobre mudanças nos resultados
	useEffect(() => {
		if (onResultadosChange) {
			onResultadosChange(resultadosEliminatorias);
		}
	}, [resultadosEliminatorias, onResultadosChange]);

	// Prepara os dados das chaves com suas classificações
	const chavesComClassificacao = useMemo(() => {
			return chaves.map((chave, chaveIdx) => {
			const eqs = chave.equipes;
			const filled = eqs.every(e => e && e.trim() !== "");
			if (!filled) return null;

			// Filtra resultados dessa chave
			const resultadosChave = {};
			for (let jogoIdx = 0; jogoIdx < 3; jogoIdx++) {
				const key = `${chaveIdx}-${jogoIdx}`;
				if (resultados[key]) {
					resultadosChave[jogoIdx] = resultados[key];
				}
			}

			const classificacao = calcularClassificacaoChaveAvancado(eqs, resultadosChave, { modalidade: modalidadeNome });

			return {
				nome: chave.nome,
				equipes: eqs,
				classificacao,
				resultados: resultadosChave
			};
		}).filter(Boolean);
		}, [chaves, resultados, modalidadeNome]);

	// Verifica se todas as chaves foram completadas
	const todasChavesCompletas = useMemo(() => {
		const completas = verificarChavesCompletas(chaves, resultados);
		console.log('🔍 Verificação de chaves completas:', { 
			completas, 
			numChaves: chaves.length,
			resultados,
			chaves 
		});
		return completas;
	}, [chaves, resultados]);

	// Gera os confrontos das quartas quando todas as chaves estiverem completas
	useEffect(() => {
		console.log('🎯 Effect quartas:', { 
			todasChavesCompletas, 
			confrontosQuartasLength: confrontosQuartas.length,
			chavesComClassificacaoLength: chavesComClassificacao.length,
			confrontosCarregados
		});
		
		if (todasChavesCompletas && confrontosQuartas.length === 0 && confrontosCarregados) {
			const { classificados, primeiros, segundos } = selecionarClassificados(chavesComClassificacao, tem5Chaves);
			console.log('✅ Classificados:', { 
				classificadosLength: classificados.length,
				primeirosLength: primeiros.length,
				segundosLength: segundos.length,
				tem5Chaves,
				classificados 
			});
			
			if (classificados.length === 8) {
				const novosConfrontos = gerarConfrontosQuartas(classificados);
				console.log('🏆 Quartas geradas:', novosConfrontos);
				setConfrontosQuartas(novosConfrontos);
				
				// Salvar confrontos no Firebase
				const salvarConfrontos = async () => {
					try {
						const { saveConfrontosEliminatorias } = require('../api/resultados');
						await saveConfrontosEliminatorias(modalidadeId, {
							confrontosQuartas: novosConfrontos,
							confrontosSemis: [],
							confrontosFinal: null
						});
						console.log('✅ Confrontos das quartas salvos no Firebase');
					} catch (error) {
						console.error('Erro ao salvar confrontos das quartas:', error);
					}
				};
				salvarConfrontos();
			} else {
				console.warn('⚠️ Número incorreto de classificados:', classificados.length, 'esperado: 8');
			}
		}
	}, [todasChavesCompletas, chavesComClassificacao, tem5Chaves, confrontosQuartas.length, confrontosCarregados, modalidadeId]);

	// Gera os confrontos das semis quando todas as quartas estiverem completas
	useEffect(() => {
		if (confrontosQuartas.length === 4) {
			const vencedores = processarVencedoresQuartas(confrontosQuartas, resultadosEliminatorias);
			const vencedoresValidos = vencedores.filter(v => v !== null);
			
			if (vencedoresValidos.length === 4 && confrontosSemis.length === 0) {
				const novosSemis = gerarConfrontosSemis(vencedores);
				setConfrontosSemis(novosSemis);
				
				// Salvar confrontos no Firebase
				const salvarConfrontos = async () => {
					try {
						const { saveConfrontosEliminatorias } = require('../api/resultados');
						await saveConfrontosEliminatorias(modalidadeId, {
							confrontosQuartas,
							confrontosSemis: novosSemis,
							confrontosFinal: null
						});
						console.log('✅ Confrontos das semis salvos no Firebase');
					} catch (error) {
						console.error('Erro ao salvar confrontos das semis:', error);
					}
				};
				salvarConfrontos();
			}
		}
	}, [confrontosQuartas, resultadosEliminatorias, confrontosSemis.length, modalidadeId]);

	// Gera os confrontos da final quando todas as semis estiverem completas
	useEffect(() => {
		if (confrontosSemis.length === 2) {
			const { vencedores, perdedores } = processarVencedoresSemis(confrontosSemis, resultadosEliminatorias);
			const vencedoresValidos = vencedores.filter(v => v !== null);
			const perdedoresValidos = perdedores.filter(p => p !== null);
			
			if (vencedoresValidos.length === 2 && perdedoresValidos.length === 2 && !confrontosFinal.final) {
				const novosFinais = gerarConfrontosFinais(vencedores, perdedores);
				setConfrontosFinal(novosFinais);
				
				// Salvar confrontos no Firebase
				const salvarConfrontos = async () => {
					try {
						const { saveConfrontosEliminatorias } = require('../api/resultados');
						await saveConfrontosEliminatorias(modalidadeId, {
							confrontosQuartas,
							confrontosSemis,
							confrontosFinal: novosFinais
						});
						console.log('✅ Confrontos da final salvos no Firebase');
					} catch (error) {
						console.error('Erro ao salvar confrontos da final:', error);
					}
				};
				salvarConfrontos();
			}
		}
	}, [confrontosSemis, resultadosEliminatorias, confrontosFinal.final, confrontosQuartas, modalidadeId]);

	// Funções para modal de eliminatórias

	const openModalEliminatoria = (confrontoId, equipeA, equipeB, fase) => {
		const resultado = resultadosEliminatorias[confrontoId];
		setModalEliminatoria({
			open: true,
			confrontoId,
			equipeA: equipeA.nome,
			equipeB: equipeB.nome,
			scoreA: resultado?.scoreA ?? "",
			scoreB: resultado?.scoreB ?? "",
			fase,
			meta: resultado?.meta || {},
		});
		setMensagemEliminatoria(null);
	};

	const closeModalEliminatoria = () => setModalEliminatoria((s) => ({ ...s, open: false }));


	const saveModalEliminatoria = async (e) => {
		e.preventDefault();
		const { confrontoId, scoreA, scoreB, fase, equipeA, equipeB, meta } = modalEliminatoria;

		// Atualizar estado local imediatamente
		setResultadosEliminatorias((prev) => ({
			...prev,
			[confrontoId]: { scoreA: Number(scoreA), scoreB: Number(scoreB), meta: meta || {} }
		}));

		// Persistir no Firebase usando a nova API
		try {
			setSalvandoEliminatoria(true);
			const { saveResultadoJogoEliminatoria } = require('../api/resultados');
			const res = await saveResultadoJogoEliminatoria(modalidadeId, confrontoId, fase, {
				equipeA,
				equipeB,
				scoreA: Number(scoreA),
				scoreB: Number(scoreB),
				meta: meta || {}
			});

			if (res.success) {
				setMensagemEliminatoria({ tipo: 'sucesso', texto: '✅ Resultado salvo com sucesso!' });
				// avisar pai
				if (onResultadosChange) onResultadosChange({ ...resultadosEliminatorias, [confrontoId]: { scoreA: Number(scoreA), scoreB: Number(scoreB), meta: meta || {} } });
				setTimeout(() => setMensagemEliminatoria(null), 2500);
			} else {
				setMensagemEliminatoria({ tipo: 'erro', texto: `❌ Erro ao salvar: ${res.error}` });
			}
		} catch (err) {
			console.error('Erro ao salvar eliminatória:', err);
			setMensagemEliminatoria({ tipo: 'erro', texto: '❌ Erro ao salvar resultado. Tente novamente.' });
		} finally {
			setSalvandoEliminatoria(false);
			closeModalEliminatoria();
		}
	};

	// Se todas as chaves não estão completas, não renderiza
	if (!todasChavesCompletas) {
		return null;
	}

	// Exibe os classificados
	const { primeiros, segundosMelhores } = selecionarClassificados(chavesComClassificacao, tem5Chaves);

	return (
		<div style={{ margin: "32px auto 18px", maxWidth: 880 }}>
			{/* Seção de Classificados */}
			<article className="card" style={{ marginBottom: 24 }}>
				<div className="card__header">
					<h3 className="card__title">🏆 Classificados para as Quartas de Final</h3>
				</div>
				<div className="card__body">
					<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
						{/* Primeiros Colocados */}
						<div>
							<h4 style={{ margin: "0 0 8px", fontSize: 14, color: "var(--primary)" }}>
								✨ Primeiros Colocados
							</h4>
							<table className="home-table" style={{ marginBottom: 0, fontSize: 13 }}>
								<thead>
									<tr>
										<th>Equipe</th>
										<th>Chave</th>
										<th>Pts</th>
									</tr>
								</thead>
								<tbody>
									{primeiros.map((equipe, idx) => (
										<tr key={idx}>
											<td style={{ fontWeight: 600 }}>{equipe.nome}</td>
											<td>{equipe.chave}</td>
											<td style={{ fontWeight: 700, color: "var(--primary)" }}>{equipe.pontos}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>

						{/* Melhores Segundos Colocados */}
						<div>
							<h4 style={{ margin: "0 0 8px", fontSize: 14, color: "var(--accent)" }}>
								⭐ Melhores Segundos Colocados
							</h4>
							<table className="home-table" style={{ marginBottom: 0, fontSize: 13 }}>
								<thead>
									<tr>
										<th>Equipe</th>
										<th>Chave</th>
										<th>Pts</th>
									</tr>
								</thead>
								<tbody>
									{segundosMelhores.map((equipe, idx) => (
										<tr key={idx}>
											<td style={{ fontWeight: 600 }}>{equipe.nome}</td>
											<td>{equipe.chave}</td>
											<td style={{ fontWeight: 700, color: "var(--accent)" }}>{equipe.pontos}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</article>

			{/* Bracket Visual das Eliminatórias */}
			{confrontosQuartas.length > 0 && (
				<article className="card">
					<div className="card__header">
						<h3 className="card__title">🏆 Chave Eliminatória</h3>
					</div>
					<div className="card__body">
						<BracketEliminatorias
							confrontosQuartas={confrontosQuartas}
							confrontosSemis={confrontosSemis}
							confrontosFinal={confrontosFinal.final}
							resultadosEliminatorias={resultadosEliminatorias}
							onEditarResultado={(confronto) => {
								openModalEliminatoria(
									confronto.id, 
									confronto.equipeA, 
									confronto.equipeB, 
									confronto.fase
								);
							}}
							adminMode={adminMode}
						/>
					</div>
				</article>
			)}

			{/* Confrontos das Quartas de Final */}
			{confrontosQuartas.length > 0 && (
				<article className="card">
					<div className="card__header">
						<h3 className="card__title">⚔️ Quartas de Final</h3>
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
								{confrontosQuartas.map((confronto) => {
									const resultado = resultadosEliminatorias[confronto.id];
									return (
										<tr key={confronto.id}>
											<td style={{ fontWeight: 600 }}>Jogo {confronto.jogo}</td>
											<td>
												{confronto.equipeA.nome}
												<span style={{ fontSize: 11, color: "var(--muted)", marginLeft: 6 }}>
													({confronto.equipeA.chave})
												</span>
											</td>
											<td>
												{confronto.equipeB.nome}
												<span style={{ fontSize: 11, color: "var(--muted)", marginLeft: 6 }}>
													({confronto.equipeB.chave})
												</span>
											</td>
											<td>
												{resultado ? (
													<span style={{ fontWeight: 700 }}>
														{resultado.scoreA} x {resultado.scoreB}
														{adminMode && (
															<button 
																className="btn btn--ghost" 
																onClick={() => openModalEliminatoria(confronto.id, confronto.equipeA, confronto.equipeB, 'Quartas de Final')}
																style={{ marginLeft: 8, padding: "4px 8px", fontSize: 12 }}
															>
																Editar
															</button>
														)}
													</span>
												) : adminMode ? (
													<button 
														className="btn btn--primary" 
														onClick={() => openModalEliminatoria(confronto.id, confronto.equipeA, confronto.equipeB, 'Quartas de Final')}
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
			)}

			{/* Semifinais */}
			{confrontosSemis.length > 0 && (
				<article className="card" style={{ marginTop: 24 }}>
					<div className="card__header">
						<h3 className="card__title">🔥 Semifinais</h3>
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
								{confrontosSemis.map((confronto) => {
									const resultado = resultadosEliminatorias[confronto.id];
									return (
										<tr key={confronto.id}>
											<td style={{ fontWeight: 600 }}>Semifinal {confronto.jogo}</td>
											<td>
												{confronto.equipeA.nome}
												<span style={{ fontSize: 11, color: "var(--muted)", marginLeft: 6 }}>
													({confronto.equipeA.chave})
												</span>
											</td>
											<td>
												{confronto.equipeB.nome}
												<span style={{ fontSize: 11, color: "var(--muted)", marginLeft: 6 }}>
													({confronto.equipeB.chave})
												</span>
											</td>
											<td>
												{resultado ? (
													<span style={{ fontWeight: 700 }}>
														{resultado.scoreA} x {resultado.scoreB}
														{adminMode && (
															<button 
																className="btn btn--ghost" 
																onClick={() => openModalEliminatoria(confronto.id, confronto.equipeA, confronto.equipeB, 'Semifinal')}
																style={{ marginLeft: 8, padding: "4px 8px", fontSize: 12 }}
															>
																Editar
															</button>
														)}
													</span>
												) : adminMode ? (
													<button 
														className="btn btn--primary" 
														onClick={() => openModalEliminatoria(confronto.id, confronto.equipeA, confronto.equipeB, 'Semifinal')}
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
			)}

			{/* Disputa de 3º Lugar */}
			{confrontosFinal.terceiro && (
				<article className="card" style={{ marginTop: 24 }}>
					<div className="card__header">
						<h3 className="card__title">🥉 Disputa de 3º Lugar</h3>
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
									const confronto = confrontosFinal.terceiro;
									const resultado = resultadosEliminatorias[confronto.id];
									return (
										<tr>
											<td>
												{confronto.equipeA.nome}
												<span style={{ fontSize: 11, color: "var(--muted)", marginLeft: 6 }}>
													({confronto.equipeA.chave})
												</span>
											</td>
											<td>
												{confronto.equipeB.nome}
												<span style={{ fontSize: 11, color: "var(--muted)", marginLeft: 6 }}>
													({confronto.equipeB.chave})
												</span>
											</td>
											<td>
												{resultado ? (
													<span style={{ fontWeight: 700 }}>
														{resultado.scoreA} x {resultado.scoreB}
														{adminMode && (
															<button 
																className="btn btn--ghost" 
																onClick={() => openModalEliminatoria(confronto.id, confronto.equipeA, confronto.equipeB, 'Disputa de 3º Lugar')}
																style={{ marginLeft: 8, padding: "4px 8px", fontSize: 12 }}
															>
																Editar
															</button>
														)}
													</span>
												) : adminMode ? (
													<button 
														className="btn btn--primary" 
														onClick={() => openModalEliminatoria(confronto.id, confronto.equipeA, confronto.equipeB, 'Disputa de 3º Lugar')}
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

			{/* Final */}
			{confrontosFinal.final && (
				<article className="card" style={{ marginTop: 24, border: "2px solid var(--primary)" }}>
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
									const confronto = confrontosFinal.final;
									const resultado = resultadosEliminatorias[confronto.id];
									return (
										<tr>
											<td style={{ fontSize: 15, fontWeight: 600 }}>
												{confronto.equipeA.nome}
												<span style={{ fontSize: 11, color: "var(--muted)", marginLeft: 6 }}>
													({confronto.equipeA.chave})
												</span>
											</td>
											<td style={{ fontSize: 15, fontWeight: 600 }}>
												{confronto.equipeB.nome}
												<span style={{ fontSize: 11, color: "var(--muted)", marginLeft: 6 }}>
													({confronto.equipeB.chave})
												</span>
											</td>
											<td>
												{resultado ? (
													<span style={{ fontWeight: 700, fontSize: 16, color: "var(--primary)" }}>
														{resultado.scoreA} x {resultado.scoreB}
														{adminMode && (
															<button 
																className="btn btn--ghost" 
																onClick={() => openModalEliminatoria(confronto.id, confronto.equipeA, confronto.equipeB, 'Final')}
																style={{ marginLeft: 8, padding: "4px 8px", fontSize: 12 }}
															>
																Editar
															</button>
														)}
													</span>
												) : adminMode ? (
													<button 
														className="btn btn--primary" 
														onClick={() => openModalEliminatoria(confronto.id, confronto.equipeA, confronto.equipeB, 'Final')}
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

			{/* Modal de edição de jogo da eliminatória */}
			{modalEliminatoria.open && (
				<div className="modal-overlay" onClick={closeModalEliminatoria}>
					<div className="modal" onClick={(e) => e.stopPropagation()}>
						<h3>Editar Resultado - {modalEliminatoria.fase}</h3>
						<p style={{ color: "var(--muted)", fontSize: 14, margin: "8px 0" }}>
							{modalEliminatoria.equipeA} vs {modalEliminatoria.equipeB}
						</p>
						<form onSubmit={saveModalEliminatoria} className="form">
							<div className="row">
								<label>Gols/Pontos — {modalEliminatoria.equipeA}</label>
								<input 
									type="number" 
									min="0" 
									value={modalEliminatoria.scoreA} 
									onChange={(e) => setModalEliminatoria((s) => ({ ...s, scoreA: e.target.value }))} 
									required 
								/>
							</div>
							<div className="row">
								<label>Gols/Pontos — {modalEliminatoria.equipeB}</label>
								<input 
									type="number" 
									min="0" 
									value={modalEliminatoria.scoreB} 
									onChange={(e) => setModalEliminatoria((s) => ({ ...s, scoreB: e.target.value }))} 
									required 
								/>
							</div>

							{(() => {
								const nome = (modalidadeNome || '').toLowerCase();
								const isVoleiPraia = nome.includes('praia');
								const isVolei = nome.includes('vôlei') || nome.includes('volei');
								const isCabo = nome.includes('cabo') && nome.includes('guerra');
								const isHand = nome.includes('handebol');
								const isBasq = nome.includes('basquete');
								const showExclusao2 = isHand || isBasq;

								return (
									<>
										{(isVolei || isVoleiPraia) && (
											<div style={{ marginTop: 8, marginBottom: 8, padding: 10, borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)' }}>
												<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
													<div style={{ minWidth: 0 }}>
														<label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Sets — {modalEliminatoria.equipeA}</label>
														<input type="number" min="0" step="1" className="inputLogin" value={modalEliminatoria.meta?.setsPontosA ?? 0} onChange={(e)=> setModalEliminatoria((s)=> ({ ...s, meta: { ...s.meta, setsPontosA: Number(e.target.value)||0 } }))} style={{ width: '100%', minWidth: 0 }} />
													</div>
													<div style={{ minWidth: 0 }}>
														<label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Sets — {modalEliminatoria.equipeB}</label>
														<input type="number" min="0" step="1" className="inputLogin" value={modalEliminatoria.meta?.setsPontosB ?? 0} onChange={(e)=> setModalEliminatoria((s)=> ({ ...s, meta: { ...s.meta, setsPontosB: Number(e.target.value)||0 } }))} style={{ width: '100%', minWidth: 0 }} />
													</div>
												</div>
												<div style={{ marginTop: 6, color: 'var(--muted)', fontSize: 12 }}>
													Dica: informe o somatório dos pontos feitos em todos os sets por equipe (PF e PS). Ex.: 25-20, 25-22 → PF 50, PS 42.
												</div>
											</div>
										)}

										{/* Disciplina (mais claro: 3 por linha, com ajuda) */}
										<div style={{ marginTop: 8, padding: 10, borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)' }}>
											{/* Equipe A */}
											<div style={{ marginBottom: 10 }}>
												<label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Disciplina — {modalEliminatoria.equipeA}</label>
												<div style={{ display: 'grid', gridTemplateColumns: showExclusao2 ? 'repeat(3, minmax(120px, 1fr))' : 'repeat(2, minmax(140px, 1fr))', gap: 10 }}>
													<div>
														<input type="number" min="0" step="1" placeholder="Cartões amarelos" className="inputLogin" value={modalEliminatoria.meta?.disciplinaA?.amarelo ?? 0} onChange={(e)=> setModalEliminatoria((s)=> ({ ...s, meta: { ...s.meta, disciplinaA: { ...(s.meta?.disciplinaA||{}), amarelo: Number(e.target.value)||0 } } }))} style={{ width: '100%' }} />
														<div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Total de cartões amarelos da equipe A</div>
													</div>
													<div>
														<input type="number" min="0" step="1" placeholder="Cartões vermelhos" className="inputLogin" value={modalEliminatoria.meta?.disciplinaA?.vermelho ?? 0} onChange={(e)=> setModalEliminatoria((s)=> ({ ...s, meta: { ...s.meta, disciplinaA: { ...(s.meta?.disciplinaA||{}), vermelho: Number(e.target.value)||0 } } }))} style={{ width: '100%' }} />
														<div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Total de cartões vermelhos da equipe A</div>
													</div>
													{showExclusao2 && (
														<div>
															<input type="number" min="0" step="1" placeholder="Exclusões 2'" className="inputLogin" value={modalEliminatoria.meta?.disciplinaA?.exclusao2 ?? 0} onChange={(e)=> setModalEliminatoria((s)=> ({ ...s, meta: { ...s.meta, disciplinaA: { ...(s.meta?.disciplinaA||{}), exclusao2: Number(e.target.value)||0 } } }))} style={{ width: '100%' }} />
															<div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Qtd de exclusões de 2 minutos (Hand/Basq)</div>
														</div>
													)}
												</div>
											</div>

											{/* Equipe B */}
											<div>
												<label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Disciplina — {modalEliminatoria.equipeB}</label>
												<div style={{ display: 'grid', gridTemplateColumns: showExclusao2 ? 'repeat(3, minmax(120px, 1fr))' : 'repeat(2, minmax(140px, 1fr))', gap: 10 }}>
													<div>
														<input type="number" min="0" step="1" placeholder="Cartões amarelos" className="inputLogin" value={modalEliminatoria.meta?.disciplinaB?.amarelo ?? 0} onChange={(e)=> setModalEliminatoria((s)=> ({ ...s, meta: { ...s.meta, disciplinaB: { ...(s.meta?.disciplinaB||{}), amarelo: Number(e.target.value)||0 } } }))} style={{ width: '100%' }} />
														<div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Total de cartões amarelos da equipe B</div>
													</div>
													<div>
														<input type="number" min="0" step="1" placeholder="Cartões vermelhos" className="inputLogin" value={modalEliminatoria.meta?.disciplinaB?.vermelho ?? 0} onChange={(e)=> setModalEliminatoria((s)=> ({ ...s, meta: { ...s.meta, disciplinaB: { ...(s.meta?.disciplinaB||{}), vermelho: Number(e.target.value)||0 } } }))} style={{ width: '100%' }} />
														<div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Total de cartões vermelhos da equipe B</div>
													</div>
													{showExclusao2 && (
														<div>
															<input type="number" min="0" step="1" placeholder="Exclusões 2'" className="inputLogin" value={modalEliminatoria.meta?.disciplinaB?.exclusao2 ?? 0} onChange={(e)=> setModalEliminatoria((s)=> ({ ...s, meta: { ...s.meta, disciplinaB: { ...(s.meta?.disciplinaB||{}), exclusao2: Number(e.target.value)||0 } } }))} style={{ width: '100%' }} />
															<div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Qtd de exclusões de 2 minutos (Hand/Basq)</div>
														</div>
													)}
												</div>
											</div>

											<div style={{ marginTop: 8, color: 'var(--muted)', fontSize: 12 }}>
												Amarelo = 1 ponto, Vermelho = 3 pontos, Exclusão 2' = 2 pontos. A média por jogo (menor é melhor) é usada como critério de desempate.
											</div>
										</div>

										{isCabo && (
											<div style={{ marginTop: 10, padding: 10, borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)' }}>
												<div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
													<label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
														<input type="checkbox" checked={!!modalEliminatoria.meta?.soltouCordaA} onChange={(e)=> setModalEliminatoria((s)=> ({ ...s, meta: { ...s.meta, soltouCordaA: e.target.checked } }))} />
														{modalEliminatoria.equipeA}: soltou a corda
													</label>
													<label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
														<input type="checkbox" checked={!!modalEliminatoria.meta?.soltouCordaB} onChange={(e)=> setModalEliminatoria((s)=> ({ ...s, meta: { ...s.meta, soltouCordaB: e.target.checked } }))} />
														{modalEliminatoria.equipeB}: soltou a corda
													</label>
												</div>
												<div style={{ marginTop: 6, color: 'var(--muted)', fontSize: 12 }}>
													Atenção: marcar esta opção desclassifica a equipe e zera os pontos desta chave.
												</div>
											</div>
										)}
									</>
								);
							})()}
							<div className="actions">
								<button type="button" className="btn btn--ghost" onClick={closeModalEliminatoria}>Cancelar</button>
								<button type="submit" className="btn btn--primary">Salvar</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}

// Componente Bracket Visual (espelho das eliminatórias)
function BracketVisual({ chaves, resultadosChaves, resultadosEliminatorias, modalidadeId, categoria }) {
	// Masculino tem 5 chaves (15 equipes), feminino e misto têm 4 chaves (12 equipes)
	const tem5Chaves = categoria === "masculino";
	
	// Calcula os dados das eliminatórias
	const dadosEliminatorias = useMemo(() => {
		// Verifica se todas as chaves estão completas
		const todasChavesCompletas = verificarChavesCompletas(chaves, resultadosChaves);
		if (!todasChavesCompletas) return null;

		// Prepara chaves com classificação
		const chavesComClassificacao = chaves.map((chave, chaveIdx) => {
			const eqs = chave.equipes;
			const filled = eqs.every(e => e && e.trim() !== "");
			if (!filled) return null;

			const resultadosChave = {};
			for (let jogoIdx = 0; jogoIdx < 3; jogoIdx++) {
				const key = `${chaveIdx}-${jogoIdx}`;
				if (resultadosChaves[key]) {
					resultadosChave[jogoIdx] = resultadosChaves[key];
				}
			}

			const classificacao = calcularClassificacaoChave(eqs, resultadosChave);
			return {
				nome: chave.nome,
				equipes: eqs,
				classificacao,
				resultados: resultadosChave
			};
		}).filter(Boolean);

		// Gera confrontos das quartas
		const { classificados } = selecionarClassificados(chavesComClassificacao, tem5Chaves);
		if (classificados.length !== 8) return null;

		const confrontosQuartas = gerarConfrontosQuartas(classificados);

		// Processa vencedores das quartas
		const vencedoresQuartas = processarVencedoresQuartas(confrontosQuartas, resultadosEliminatorias);
		const confrontosSemis = vencedoresQuartas.filter(v => v !== null).length === 4 
			? gerarConfrontosSemis(vencedoresQuartas) 
			: [];

		// Processa vencedores das semis
		let confrontoFinal = null;
		let confrontoTerceiro = null;
		if (confrontosSemis.length === 2) {
			const { vencedores, perdedores } = processarVencedoresSemis(confrontosSemis, resultadosEliminatorias);
			if (vencedores.filter(v => v !== null).length === 2) {
				const finais = gerarConfrontosFinais(vencedores, perdedores);
				confrontoFinal = finais.final;
				confrontoTerceiro = finais.terceiro;
			}
		}

		return {
			quartas: confrontosQuartas,
			semis: confrontosSemis,
			final: confrontoFinal,
			terceiro: confrontoTerceiro
		};
	}, [chaves, resultadosChaves, resultadosEliminatorias, tem5Chaves]);

	if (!dadosEliminatorias) return null;

	const { quartas, semis, final } = dadosEliminatorias;

	return (
		<div className="bracket">
			{/* Quartas de Final */}
			<div className="bracket__round">
				<div className="card__header"><h3 className="card__title">Quartas</h3></div>
				{quartas.map((confronto) => {
					const resultado = resultadosEliminatorias[confronto.id];
					const scoreA = resultado?.scoreA ?? null;
					const scoreB = resultado?.scoreB ?? null;
					const aWin = scoreA !== null && scoreB !== null && scoreA > scoreB;
					const bWin = scoreA !== null && scoreB !== null && scoreB > scoreA;

					return (
						<div className="bracket__match" key={confronto.id}>
							<div className={`team ${aWin ? 'team--win' : bWin ? 'team--lose' : ''}`}>
								<span className="team__name">{confronto.equipeA.nome}</span>
								<span className="team__score">{scoreA ?? '-'}</span>
							</div>
							<div className={`team ${bWin ? 'team--win' : aWin ? 'team--lose' : ''}`} style={{ marginTop: 6 }}>
								<span className="team__name">{confronto.equipeB.nome}</span>
								<span className="team__score">{scoreB ?? '-'}</span>
							</div>
						</div>
					);
				})}
			</div>

			{/* Semifinais */}
			{semis.length > 0 && (
				<div className="bracket__round">
					<div className="card__header"><h3 className="card__title">Semifinais</h3></div>
					{semis.map((confronto) => {
						const resultado = resultadosEliminatorias[confronto.id];
						const scoreA = resultado?.scoreA ?? null;
						const scoreB = resultado?.scoreB ?? null;
						const aWin = scoreA !== null && scoreB !== null && scoreA > scoreB;
						const bWin = scoreA !== null && scoreB !== null && scoreB > scoreA;

						return (
							<div className="bracket__match" key={confronto.id}>
								<div className={`team ${aWin ? 'team--win' : bWin ? 'team--lose' : ''}`}>
									<span className="team__name">{confronto.equipeA.nome}</span>
									<span className="team__score">{scoreA ?? '-'}</span>
								</div>
								<div className={`team ${bWin ? 'team--win' : aWin ? 'team--lose' : ''}`} style={{ marginTop: 6 }}>
									<span className="team__name">{confronto.equipeB.nome}</span>
									<span className="team__score">{scoreB ?? '-'}</span>
								</div>
							</div>
						);
					})}
				</div>
			)}

			{/* Final */}
			{final && (
				<div className="bracket__round">
					<div className="card__header"><h3 className="card__title">Final</h3></div>
					{(() => {
						const resultado = resultadosEliminatorias[final.id];
						const scoreA = resultado?.scoreA ?? null;
						const scoreB = resultado?.scoreB ?? null;
						const aWin = scoreA !== null && scoreB !== null && scoreA > scoreB;
						const bWin = scoreA !== null && scoreB !== null && scoreB > scoreA;

						return (
							<div className="bracket__match">
								<div className={`team ${aWin ? 'team--win' : bWin ? 'team--lose' : ''}`}>
									<span className="team__name">{final.equipeA.nome}</span>
									<span className="team__score">{scoreA ?? '-'}</span>
								</div>
								<div className={`team ${bWin ? 'team--win' : aWin ? 'team--lose' : ''}`} style={{ marginTop: 6 }}>
									<span className="team__name">{final.equipeB.nome}</span>
									<span className="team__score">{scoreB ?? '-'}</span>
								</div>
							</div>
						);
					})()}
				</div>
			)}
		</div>
	);
}

// Componente para Eliminação Simples (CS:GO, etc)
function EliminacaoSimples({ adminMode, numEquipes = 16 }) {
	const [equipes, setEquipes] = useState([]);
	const [equipesLocal, setEquipesLocal] = useState(
		Array(numEquipes).fill("").map((_, i) => ({ id: i, nome: "" }))
	);
	const [confrontosOitavas, setConfrontosOitavas] = useState([]);
	const [confrontosQuartas, setConfrontosQuartas] = useState([]);
	const [confrontosSemis, setConfrontosSemis] = useState([]);
	const [confrontoFinal, setConfrontoFinal] = useState(null);
	const [resultados, setResultados] = useState({});
	const [modalJogo, setModalJogo] = useState({
		open: false,
		confrontoId: null,
		equipeA: "",
		equipeB: "",
		scoreA: "",
		scoreB: "",
		fase: ""
	});

	// Função para embaralhar equipes
	const embaralharEquipes = (equipesParaEmbaralhar) => {
		const embaralhadas = [...equipesParaEmbaralhar].sort(() => Math.random() - 0.5);
		return embaralhadas;
	};

	// Gera confrontos das oitavas quando equipes são salvas
	const handleSalvarEquipes = () => {
		const equipesPreenchidas = equipesLocal.filter(eq => eq.nome.trim() !== "");
		
		if (equipesPreenchidas.length < numEquipes) {
			alert(`Preencha todas as ${numEquipes} equipes antes de salvar!`);
			return;
		}

		const equipesEmbaralhadas = embaralharEquipes(equipesPreenchidas);
		setEquipes(equipesEmbaralhadas);

		// Gera confrontos das oitavas (16 times = 8 jogos)
		const oitavas = [];
		for (let i = 0; i < equipesEmbaralhadas.length; i += 2) {
			oitavas.push({
				id: `oitava-${i / 2 + 1}`,
				equipeA: equipesEmbaralhadas[i],
				equipeB: equipesEmbaralhadas[i + 1],
				fase: 'Oitavas de Final',
				jogo: i / 2 + 1
			});
		}
		setConfrontosOitavas(oitavas);
		alert("Equipes salvas e confrontos das oitavas gerados!");
	};

	// Gera confrontos das quartas quando todas oitavas tiverem resultado
	useEffect(() => {
		if (confrontosOitavas.length === 8) {
			const vencedores = [];
			confrontosOitavas.forEach(confronto => {
				const resultado = resultados[confronto.id];
				if (!resultado) return;
				
				if (resultado.scoreA > resultado.scoreB) {
					vencedores.push(confronto.equipeA);
				} else if (resultado.scoreB > resultado.scoreA) {
					vencedores.push(confronto.equipeB);
				}
			});

			if (vencedores.length === 8 && confrontosQuartas.length === 0) {
				const quartas = [];
				for (let i = 0; i < vencedores.length; i += 2) {
					quartas.push({
						id: `quarta-${i / 2 + 1}`,
						equipeA: vencedores[i],
						equipeB: vencedores[i + 1],
						fase: 'Quartas de Final',
						jogo: i / 2 + 1
					});
				}
				setConfrontosQuartas(quartas);
			}
		}
	}, [confrontosOitavas, resultados, confrontosQuartas.length]);

	// Gera confrontos das semis quando todas quartas tiverem resultado
	useEffect(() => {
		if (confrontosQuartas.length === 4) {
			const vencedores = [];
			confrontosQuartas.forEach(confronto => {
				const resultado = resultados[confronto.id];
				if (!resultado) return;
				
				if (resultado.scoreA > resultado.scoreB) {
					vencedores.push(confronto.equipeA);
				} else if (resultado.scoreB > resultado.scoreA) {
					vencedores.push(confronto.equipeB);
				}
			});

			if (vencedores.length === 4 && confrontosSemis.length === 0) {
				const semis = [];
				for (let i = 0; i < vencedores.length; i += 2) {
					semis.push({
						id: `semi-${i / 2 + 1}`,
						equipeA: vencedores[i],
						equipeB: vencedores[i + 1],
						fase: 'Semifinal',
						jogo: i / 2 + 1
					});
				}
				setConfrontosSemis(semis);
			}
		}
	}, [confrontosQuartas, resultados, confrontosSemis.length]);

	// Gera confronto da final quando ambas semis tiverem resultado
	useEffect(() => {
		if (confrontosSemis.length === 2) {
			const vencedores = [];
			confrontosSemis.forEach(confronto => {
				const resultado = resultados[confronto.id];
				if (!resultado) return;
				
				if (resultado.scoreA > resultado.scoreB) {
					vencedores.push(confronto.equipeA);
				} else if (resultado.scoreB > resultado.scoreA) {
					vencedores.push(confronto.equipeB);
				}
			});

			if (vencedores.length === 2 && !confrontoFinal) {
				setConfrontoFinal({
					id: 'final',
					equipeA: vencedores[0],
					equipeB: vencedores[1],
					fase: 'Final',
					jogo: 1
				});
			}
		}
	}, [confrontosSemis, resultados, confrontoFinal]);

	const handleEquipeChange = (idx, value) => {
		setEquipesLocal(prev => prev.map((eq, i) => i === idx ? { ...eq, nome: value } : eq));
	};

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
		setResultados(prev => ({
			...prev,
			[confrontoId]: { scoreA: Number(scoreA), scoreB: Number(scoreB) }
		}));
		closeModalJogo();
	};

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
						<p style={{ color: "var(--muted)", marginBottom: 16 }}>
							Preencha os nomes das {numEquipes} equipes participantes. Elas serão embaralhadas aleatoriamente.
						</p>
						<div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, padding: "0 8px" }}>
							{equipesLocal.map((equipe, idx) => (
								<div key={idx} style={{ minWidth: 0 }}>
									<label style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4, display: "block" }}>
										Equipe {idx + 1}
									</label>
									<input
										type="text"
										className="inputLogin"
										placeholder={`Equipe ${idx + 1}`}
										value={equipe.nome}
										onChange={(e) => handleEquipeChange(idx, e.target.value)}
										style={{ width: "100%", boxSizing: "border-box" }}
										disabled={!adminMode}
									/>
								</div>
							))}
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

// ========================================
// COMPONENTE PRINCIPAL
// ========================================
function ModalidadeDetalhe({ 
	modalidade: modalidadeFromProps, 
	resultados: resultadosFromProps, 
	equipesInscritas: equipesInscritasFromProps, 
	setResultados: setResultadosFromProps,
	chavesData: chavesDataFromProps,
	setChavesData: setChavesDataFromProps,
	confrontosQuartasInicial,
	confrontosSemisInicial,
	confrontosFinalInicial,
	resultadosEliminatoriasInicial,
	isAdmin,
	hasUnsavedChanges: hasUnsavedChangesFromProps,
	onSaveChanges: onSaveChangesFromProps,
	isSaving: isSavingFromProps
}) {
	const { id } = useParams();

	// Usar modalidade das props (vindas do Firestore via HOC)
	const [data, setData] = useState(modalidadeFromProps);
	const [recado, setRecado] = useState(modalidadeFromProps?.recado || "");
	const [savingRecado, setSavingRecado] = useState(false);
	const [saveMsg, setSaveMsg] = useState(null);
	
	// Atualizar quando props mudarem
	useEffect(() => {
		if (modalidadeFromProps) {
			setData(modalidadeFromProps);
			setRecado(modalidadeFromProps.recado || "");
		}
	}, [modalidadeFromProps]);

	const handleSalvarRecado = async () => {
		if (!id) return;
		setSavingRecado(true);
		setSaveMsg(null);
		try {
			const res = await updateModalidade(id, { recado: recado || "", recadoUpdatedAt: getServerTimestamp() });
			if (res.success) {
				setSaveMsg({ tipo: 'ok', texto: '✅ Recado salvo!' });
				setTimeout(() => setSaveMsg(null), 2500);
			} else {
				setSaveMsg({ tipo: 'erro', texto: '❌ Erro ao salvar recado.' });
			}
		} catch (e) {
			console.error('Erro ao salvar recado:', e);
			setSaveMsg({ tipo: 'erro', texto: '❌ Erro ao salvar recado.' });
		} finally {
			setSavingRecado(false);
		}
	};

	const [form, setForm] = useState({ pos1: "", pos2: "", pos3: "" });
	
	// Estado para todas as equipes do sistema
	const [todasEquipes, setTodasEquipes] = useState([]);
	
	// Carregar todas as equipes ao montar o componente
	useEffect(() => {
		const carregarEquipes = async () => {
			try {
				const { getEquipes } = require('../api/equipes');
				const result = await getEquipes();
				if (result.success) {
					setTodasEquipes(result.data || []);
				}
			} catch (error) {
				console.error('Erro ao carregar equipes:', error);
			}
		};
		
		carregarEquipes();
	}, []);

		// ===== Ranking da Modalidade (exibe; admins podem gerar/editar) =====
		const [rankingModalidade, setRankingModalidade] = useState(null);
		const [rankingUpdatedAt, setRankingUpdatedAt] = useState(null);
		const [rankingSalvo, setRankingSalvo] = useState(false);

		useEffect(() => {
			const carregarRanking = async () => {
				if (!id) return;
				try {
					const res = await getRankingModalidade(id);
					if (res.success && res.data && Array.isArray(res.data.ranking)) {
						setRankingModalidade(res.data.ranking);
						setRankingUpdatedAt(res.data.updatedAt || res.data.createdAt || null);
						setRankingSalvo(true);
					} else {
						setRankingModalidade(null);
						setRankingUpdatedAt(null);
						setRankingSalvo(false);
					}
				} catch (err) {
					console.error("Erro ao carregar ranking da modalidade:", err);
				}
			};
			carregarRanking();
		}, [id]);

		const handleGerarRankingFinal = async () => {
			try {
				// Ler confrontos e resultados diretamente do documento de chaves
				const chavesRes = await getChavesApi(id);
				if (!chavesRes.success || !chavesRes.data) {
					alert("Não foi possível carregar os dados das eliminatórias");
					return;
				}
				const dados = chavesRes.data;

				const confrontosFinal = dados.confrontosFinal?.final || dados.confrontosFinal || null;
				const resultadosEliminatorias = dados.resultadosEliminatorias || {};
				const confrontosSemis = dados.confrontosSemis || [];
				const confrontosQuartas = dados.confrontosQuartas || [];

				if (!confrontosFinal) {
					alert("Final ainda não foi gerada.");
					return;
				}
				const resultadoFinal = resultadosEliminatorias[confrontosFinal.id];
				if (!resultadoFinal || resultadoFinal.scoreA === undefined || resultadoFinal.scoreB === undefined) {
					alert("A final ainda não tem resultado salvo.");
					return;
				}

				const getNomeEquipe = (equipe) => {
					if (!equipe) return null;
					return typeof equipe === 'string' ? equipe : (equipe.nome || null);
				};

				const campeao = resultadoFinal.scoreA > resultadoFinal.scoreB 
					? getNomeEquipe(confrontosFinal.equipeA)
					: getNomeEquipe(confrontosFinal.equipeB);
				const vice = resultadoFinal.scoreA > resultadoFinal.scoreB 
					? getNomeEquipe(confrontosFinal.equipeB)
					: getNomeEquipe(confrontosFinal.equipeA);

				// Perdedores das semis => 3º e 4º
				const perdedoresSemis = confrontosSemis.map(semi => {
					const r = resultadosEliminatorias[semi.id];
					if (!r) return null;
					return r.scoreA > r.scoreB ? getNomeEquipe(semi.equipeB) : getNomeEquipe(semi.equipeA);
				}).filter(Boolean);
				const terceiro = perdedoresSemis[0] || null;
				const quarto = perdedoresSemis[1] || null;

				// Eliminados nas quartas
				const eliminadosQuartas = confrontosQuartas.map(q => {
					const r = resultadosEliminatorias[q.id];
					if (!r) return null;
					return r.scoreA > r.scoreB ? getNomeEquipe(q.equipeB) : getNomeEquipe(q.equipeA);
				}).filter(Boolean);

				// Todas as equipes das chaves (para descobrir os não classificados)
				const todasEquipesChaves = Array.isArray(dados.chaves)
					? dados.chaves.flatMap(ch => (ch.equipes || []).filter(e => e && e.trim() !== ''))
					: [];
				const equipesClassificadas = confrontosQuartas.flatMap(q => [
					getNomeEquipe(q.equipeA),
					getNomeEquipe(q.equipeB),
				]).filter(Boolean);
				const eliminadosChaves = todasEquipesChaves.filter(nome => !equipesClassificadas.includes(nome));

				const classificacaoFinal = { campeao, vice, terceiro, quarto, eliminadosQuartas, eliminadosChaves };
				const rankingGerado = gerarRanking(classificacaoFinal, todasEquipes);

				setRankingModalidade(rankingGerado);

				const save = await saveRankingModalidade(id, rankingGerado);
				if (save.success) {
					setRankingSalvo(true);
					alert('✅ Ranking gerado e salvo com sucesso!');
				} else {
					alert('❌ Erro ao salvar ranking: ' + (save.error || 'Desconhecido'));
				}
			} catch (err) {
				console.error('Erro ao gerar ranking final:', err);
				alert('❌ Erro ao gerar ranking: ' + (err.message || String(err)));
			}
		};

	// USAR isAdmin das props ao invés de mock
	const adminMode = isAdmin || false;
	
	// USAR HOOK PERSONALIZADO para gerenciar chaves
	const { chaves, setChaves, chavesCompletas } = useChaves(
		chavesDataFromProps,
		setChavesDataFromProps,
		id,
		modalidadeFromProps?.categoria
	);

	// Equipes nas chaves (para editor manual de ranking)
	const equipesDasChaves = useMemo(() => {
		const map = new Map();
		const add = (nome, id = null) => {
			const clean = (nome || '').trim();
			if (!clean) return;
			if (!map.has(clean)) map.set(clean, { nome: clean, id });
		};

		// 1) Preferir as equipes das chaves
		(chaves || []).forEach((ch) => {
			(ch?.equipes || []).forEach((nome, idx) => {
				const id = ch?.equipesIds?.[idx] || null;
				add(nome, id);
			});
		});

		// 2) Caso não haja entradas ainda, tentar pelos confrontos das eliminatórias (props iniciais do HOC)
		if (map.size === 0) {
			(confrontosQuartasInicial || []).forEach((c) => {
				add(c?.equipeA?.nome, c?.equipeA?.id || null);
				add(c?.equipeB?.nome, c?.equipeB?.id || null);
			});
			(confrontosSemisInicial || []).forEach((c) => {
				add(c?.equipeA?.nome, c?.equipeA?.id || null);
				add(c?.equipeB?.nome, c?.equipeB?.id || null);
			});
			if (confrontosFinalInicial && confrontosFinalInicial.final) {
				const f = confrontosFinalInicial.final;
				add(f?.equipeA?.nome, f?.equipeA?.id || null);
				add(f?.equipeB?.nome, f?.equipeB?.id || null);
			}
			if (confrontosFinalInicial && confrontosFinalInicial.terceiro) {
				const t = confrontosFinalInicial.terceiro;
				add(t?.equipeA?.nome, t?.equipeA?.id || null);
				add(t?.equipeB?.nome, t?.equipeB?.id || null);
			}
		}

		// 3) Se ainda não houver nenhuma, completar com equipes inscritas da modalidade (quando disponível)
		if (map.size === 0 && Array.isArray(equipesInscritasFromProps)) {
			equipesInscritasFromProps.forEach((e) => {
				if (typeof e === 'string') add(e, null);
				else if (e && (e.nome || e.equipeNome)) add(e.nome || e.equipeNome, e.id || null);
			});
		}

		// 4) Último fallback: todas as equipes conhecidas do sistema (melhor do que 0)
		if (map.size === 0 && Array.isArray(todasEquipes) && todasEquipes.length > 0) {
			(todasEquipes || []).forEach((e) => add(e?.nome || e?.equipeNome, e?.id || null));
		}

		return Array.from(map.values());
	}, [chaves, confrontosQuartasInicial, confrontosSemisInicial, confrontosFinalInicial, equipesInscritasFromProps, todasEquipes]);
	
	// USAR HOOK PERSONALIZADO para gerenciar resultados de jogos das chaves
	const { getResultadoJogo, setResultadoJogo, todosResultadosChave } = useResultadosChaves(
		resultadosFromProps,
		setResultadosFromProps,
		id
	);
	
	// USAR setResultados das props (conectado ao HOC) ao invés de state local
	const resultados = resultadosFromProps || [];
	const setResultados = setResultadosFromProps || (() => {});
	
	// Estado dos resultados das eliminatórias (vem do TabelaEliminatorias)
	const [resultadosEliminatorias, setResultadosEliminatorias] = useState(() => {
		// Transformar resultados do Firestore em formato esperado
		if (resultadosFromProps && resultadosFromProps.length > 0) {
			const elimMap = {};
			resultadosFromProps.forEach(res => {
				if (res.tipo === "eliminatoria" && res.fase) {
					if (!elimMap[res.fase]) elimMap[res.fase] = [];
					elimMap[res.fase].push(res);
				}
			});
			return elimMap;
		}
		return {};
	});

	// Se a modalidade não existe, retorna null (HOC já trata isso)
	if (!modalidadeFromProps) {
		return null;
	}

	if (!data) {
		return (
			<section className="modalidade">
					<Header />
					<div style={{ textAlign: "center", marginTop: 100 }}>
						<h1>❌ Modalidade não encontrada</h1>
						<p style={{ color: "var(--muted)", marginTop: 16 }}>
							A modalidade "{id}" não existe no sistema.
						</p>
						<Link to="/modalidades" className="btn btn--primary" style={{ marginTop: 24 }}>
							← Voltar para Modalidades
						</Link>
					</div>
				</section>
			);
		}

	const handleChange = (e) => setForm((s) => ({ ...s, [e.target.name]: e.target.value }));
	const handleSalvar = (e) => {
		e.preventDefault();
		// Futuro: saveResultados(id, { posicoes: [...] })
		console.log("Salvar resultados:", form);
		alert("Resultados salvos (mock).");
	};

	// Função para salvar chaves e resultados explicitamente
	const handleSalvarChavesEResultados = async () => {
		if (!onSaveChangesFromProps) {
			alert("❌ Função de salvamento não disponível");
			return;
		}

		try {
			await onSaveChangesFromProps();
			alert("✅ Chaves e resultados salvos com sucesso no Firebase!");
		} catch (error) {
			console.error("Erro ao salvar:", error);
			alert("❌ Erro ao salvar dados. Tente novamente.");
		}
	};		return (
			<section className="modalidade">
				<Header />
				<h1 style={{ textAlign: "center", marginTop: 30 }} className="modalidade__title">{data.nome}</h1>
				<div className="modalidade__head">
					<div className="modalidade__meta" style={{ textAlign: "center", marginTop: 30 }}>
						<span style={{ textTransform: "capitalize" }}>Categoria: <strong>{data.categoria}</strong></span>{" · "}
						<span style={{ textTransform: "capitalize" }}>Tipo: <strong>{data.tipo}</strong></span>{" · "}
						<span>Sistema: <strong>{data.sistema}</strong></span>
					</div>
				</div>

				{/* Recado/observações da modalidade - abaixo do título */}
				<div style={{ maxWidth: 900, margin: "16px auto 0", padding: 16 }}>
					{adminMode ? (
						<article className="card" style={{ border: "1px solid var(--border)" }}>
							<div className="card__header"><h2 className="card__title">📝 Recado da Modalidade</h2></div>
							<div className="card__body" style={{ display: 'grid', gap: 12 }}>
								<textarea
									value={recado}
									onChange={(e) => setRecado(e.target.value)}
									rows={3}
									placeholder="Escreva observações e recados importantes para os participantes..."
									style={{ width: '100%', resize: 'vertical' }}
								/>
								<div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
									<button className="btn btn--primary" onClick={handleSalvarRecado} disabled={savingRecado}>
										{savingRecado ? 'Salvando...' : 'Salvar recado'}
									</button>
									{saveMsg && (
										<span style={{ color: saveMsg.tipo === 'ok' ? 'var(--primary)' : '#ef4444' }}>{saveMsg.texto}</span>
									)}
								</div>
							</div>
						</article>
					) : recado && recado.trim() !== '' ? (
						<div style={{
							padding: '12px 16px',
							borderRadius: 8,
							background: 'rgba(59,130,246,0.08)',
							border: '1px solid rgba(59,130,246,0.25)'
						}}>
							<strong>Recado:</strong> {recado}
						</div>
					) : null}
				</div>

		{/* Sistema de Competição - Renderiza baseado no tipo */}
		{data.sistema === "eliminacao-simples" ? (
			<SistemaEliminacaoSimples 
				adminMode={adminMode} 
				modalidade={data}
			/>
		) : data.sistema === "chaves+eliminacao" ? (
			<>
				{/* Tabela de chaves (acima das regras/resultados) */}
				<TabelaChaves 
					chaves={chaves} 
					setChaves={setChaves} 
					adminMode={adminMode}
					equipesDisponiveis={todasEquipes}
					modalidadeId={id}
				/>
				
				{/* Tabela de jogos por chave (abaixo das chaves) */}
								<TabelaJogosChaves 
					chaves={chaves} 
					adminMode={adminMode}
					getResultadoJogo={getResultadoJogo}
					setResultadoJogo={setResultadoJogo}
									modalidadeId={id}
									modalidadeNome={data?.nome || data?.id}
				/>

				{/* Botão de Salvar Chaves e Resultados - APENAS ADMIN */}
				{adminMode && (
					<article className="card" style={{ 
						marginTop: 24, 
						background: "linear-gradient(135deg, rgba(45, 212, 191, 0.05) 0%, rgba(251, 191, 36, 0.05) 100%)",
						border: "2px solid var(--primary)"
					}}>
						<div className="card__body" style={{ padding: "24px", textAlign: "center" }}>
							<div style={{ marginBottom: 16 }}>
								<h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--primary)", marginBottom: 8 }}>
									💾 Salvar Dados das Chaves
								</h3>
								<p style={{ color: "var(--muted)", fontSize: 14 }}>
									Clique no botão abaixo para salvar as equipes das chaves e os resultados dos jogos no Firebase.
									<br />
									Os dados serão preservados mesmo após recarregar a página.
								</p>
							</div>
							<button
								onClick={handleSalvarChavesEResultados}
								disabled={isSavingFromProps}
								className="btn btn--primary"
								style={{
									padding: "14px 32px",
									fontSize: 16,
									fontWeight: 600,
									display: "inline-flex",
									alignItems: "center",
									gap: "10px",
									minWidth: 200
								}}
							>
								{isSavingFromProps ? (
									<>
										<span className="spinner-small" style={{ 
											width: 16, 
											height: 16, 
											border: "2px solid rgba(255,255,255,0.3)",
											borderTopColor: "white",
											borderRadius: "50%",
											animation: "spin 0.8s linear infinite"
										}}></span>
										Salvando...
									</>
								) : (
									<>
										💾 Salvar Chaves e Resultados
									</>
								)}
							</button>
							{hasUnsavedChangesFromProps && (
								<p style={{ 
									marginTop: 12, 
									color: "#856404", 
									fontSize: 13,
									fontWeight: 600
								}}>
									⚠️ Você tem alterações não salvas
								</p>
							)}
						</div>
					</article>
				)}
				
				{/* Eliminatórias - renderiza quando todas as chaves estiverem completas */}
								<TabelaEliminatorias 
					chaves={chaves} 
					resultados={resultados}
					adminMode={adminMode}
					modalidadeId={data.id}
					categoria={data.categoria}
									modalidadeNome={data?.nome || data?.id}
					onResultadosChange={setResultadosEliminatorias}
					confrontosQuartasInicial={confrontosQuartasInicial}
					confrontosSemisInicial={confrontosSemisInicial}
					confrontosFinalInicial={confrontosFinalInicial}
					resultadosEliminatoriasInicial={resultadosEliminatoriasInicial}
				/>

				{/* Ação Admin: Gerar e salvar Ranking Final a partir das Eliminatórias */}
				{adminMode && (
					<article className="card" style={{ marginTop: 16 }}>
						<div className="card__body" style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', textAlign: 'center' }}>
							<h3 style={{ fontSize: 16, margin: 0 }}>🏁 Gerar Ranking Final desta modalidade</h3>
							<p style={{ color: 'var(--muted)', fontSize: 13, margin: 0 }}>
								Usa os resultados salvos das quartas, semis e final para montar a classificação e salvar no Firestore.
							</p>
							<button
								onClick={handleGerarRankingFinal}
								className="btn btn--primary"
								style={{ marginTop: 8, minWidth: 220 }}
							>
								💾 Gerar e Salvar Ranking
							</button>
						</div>
					</article>
				)}
			</>
		) : data.sistema === "pontuacao-fixa" ? (
				<SistemaInscricao 
					adminMode={adminMode} 
					resultados={resultados}
					setResultados={setResultados}
					equipesInscritas={equipesInscritasFromProps}
					modalidadeId={data.id}
				/>
			) : data.sistema === "pontuacao-decadente" ? (
				<SistemaDisciplina 
					adminMode={adminMode}
					resultados={resultados}
					setResultados={setResultados}
					equipesInscritas={equipesInscritasFromProps}
					modalidadeId={data.id}
				/>
			) : data.sistema === "percentual" ? (
				<SistemaPresencas 
					adminMode={adminMode}
					resultados={resultados}
					setResultados={setResultados}
					equipesInscritas={equipesInscritasFromProps}
					modalidadeId={data.id}
				/>
			) : data.sistema === "pontuacao" ? (
				<SistemaPontuacaoFixa adminMode={adminMode} modalidade={data} />
			) : data.sistema === "soletrando" ? (
				<SistemaSoletrando adminMode={adminMode} modalidade={data} />
			) : data.sistema === "pontuacao (plataforma)" ? (
				<SistemaKahoot adminMode={adminMode} modalidade={data} />
			) : data.sistema === "melhor-de-3 (medida)" ? (
				<SistemaMelhorDe3 adminMode={adminMode} modalidade={data} />
			) : data.sistema === "bateria-unica (tempo)" ? (
				<SistemaBateriaUnica adminMode={adminMode} modalidade={data} />
			) : data.sistema === "chaves (rodízio simples)+eliminacao" ? (
				<SistemaBochaCampeira adminMode={adminMode} modalidade={data} />
			) : data.sistema === "tempo" || data.sistema === "eliminatoria+final (tempo)" ? (
				<SistemaTempo adminMode={adminMode} modalidade={data} />
			) : data.sistema === "classificatoria+eliminatoria" || data.sistema === "pontuacao-acumulada" || data.sistema === "suíço (5 rodadas)" || data.id?.includes("tiro_laco") ? (
				<SistemaPontuacaoAcumulada adminMode={adminMode} modalidade={data} />
			) : data.sistema === "multi-etapas (tempo)" ? (
				<SistemaSudoku adminMode={adminMode} modalidade={data} />
			) : data.sistema === "chaves" ? (
				<SistemaChavesEliminatorias 
					adminMode={adminMode} 
					modalidade={data}
					chavesDataFromProps={chavesDataFromProps}
					setChavesDataFromProps={setChavesDataFromProps}
					resultadosFromProps={resultadosFromProps}
					setResultadosFromProps={setResultadosFromProps}
					confrontosQuartasInicial={confrontosQuartasInicial}
					confrontosSemisInicial={confrontosSemisInicial}
					confrontosFinalInicial={confrontosFinalInicial}
					resultadosEliminatoriasInicial={resultadosEliminatoriasInicial}
					isAdmin={isAdmin}
				/>
			) : data.sistema === "eliminacao-simples (melhor-de-3)" ? (
				<SistemaEliminacaoMelhorDe3 
					adminMode={adminMode} 
					modalidade={data}
				/>
			) : (
				<article className="card" style={{ marginTop: 24 }}>
					<div className="card__body" style={{ textAlign: "center", padding: "40px 20px" }}>
						<p style={{ color: "var(--muted)", fontSize: 15 }}>
							Sistema <strong>{data.sistema}</strong> em desenvolvimento.
						</p>
					</div>
				</article>
			)}


			{/* Ranking da Modalidade - Exibição pública e Edição Admin */}
			{!adminMode && (rankingModalidade && rankingModalidade.length > 0) && (
				<article className="card" style={{ marginTop: 24 }}>
					<div className="card__body">
						<RankingModalidade 
							ranking={rankingModalidade}
							modalidadeTitulo={data.titulo || data.nome || id}
							updatedAt={rankingUpdatedAt}
						/>
					</div>
				</article>
			)}

			{adminMode && (
				<article className="card" style={{ marginTop: 24 }}>
					<div className="card__body">
						<RankingModalidadeEditor
							modalidadeId={id}
							modalidadeTitulo={data.titulo || data.nome || id}
							equipesChaves={equipesDasChaves}
							initialRanking={rankingModalidade || []}
							onSaved={(novoRanking) => {
								setRankingModalidade(novoRanking);
								setRankingSalvo(true);
							}}
						/>
					</div>
				</article>
			)}

			{/* Regras e Informações */}
				<article className="card rules-card" style={{ marginTop: 32 }}>
					<div className="card__header"><h2 className="card__title">📘 Informações da Modalidade</h2></div>
					<div className="card__body">
						{/* Descrição */}
						{data.descricao && (
							<div style={{ marginBottom: 16 }}>
								<h3 className="card__title" style={{ fontSize: 16, marginBottom: 8 }}>Descrição</h3>
								<p style={{ color: "var(--muted)", lineHeight: 1.6 }}>{data.descricao}</p>
							</div>
						)}

						{/* Sistema de Competição */}
						<div style={{ marginBottom: 16 }}>
							<h3 className="card__title" style={{ fontSize: 16, marginBottom: 8 }}>Sistema de Competição</h3>
							<p style={{ color: "var(--text)" }}>
								<strong>{data.sistema}</strong>
							</p>
						</div>

						{/* Regras de Pontuação */}
						{data.regrasPontuacao && Object.keys(data.regrasPontuacao).length > 0 && (
							<div style={{ marginBottom: 16 }}>
								<h3 className="card__title" style={{ fontSize: 16, marginBottom: 8 }}>Regras de Pontuação</h3>
								<div style={{ background: "rgba(45, 212, 191, 0.1)", padding: 12, borderRadius: 8, border: "1px solid rgba(45, 212, 191, 0.3)" }}>
									<ul style={{ paddingLeft: 18, margin: 0 }}>
										{Object.entries(data.regrasPontuacao).map(([key, value]) => (
											<li key={key} style={{ marginBottom: 4, color: "var(--text)" }}>
												<strong>{key}:</strong> {typeof value === 'object' ? JSON.stringify(value) : value}
											</li>
										))}
									</ul>
								</div>
							</div>
						)}

						{/* Critérios de Desempate */}
						{data.criterioDesempate && data.criterioDesempate.length > 0 && (
							<div>
								<h3 className="card__title" style={{ fontSize: 16, marginBottom: 8 }}>Critérios de Desempate</h3>
								<ol style={{ paddingLeft: 18, margin: 0 }}>
									{data.criterioDesempate.map((criterio, i) => (
										<li key={i} style={{ marginBottom: 4, color: "var(--muted)" }}>{criterio}</li>
									))}
								</ol>
							</div>
						)}
					</div>
				</article>

				{/* Resultados atuais (campo maior, abaixo) */}
				<article className="card results-card">
					<div className="card__header"><h2 className="card__title">📊 Resultados</h2></div>
					<div className="card__body">
						{data.sistema === "tabela" ? (
							<div className="table-wrapper">
								<table className="home-table">
									<thead><tr><th>Posição</th><th>Equipe</th><th>Pontos</th></tr></thead>
									<tbody>
										{data.tabela.map((row, i) => (
											<tr key={row.equipeNome}>
												<td className="pos">{i + 1}º</td>
												<td>{row.equipeNome}</td>
												<td>{row.pontos}</td>
											</tr>
										))}
					</tbody>
				</table>
			</div>
		) : (
			<BracketVisual 
				chaves={chaves}
				resultadosChaves={resultados}
				resultadosEliminatorias={resultadosEliminatorias}
				modalidadeId={data.id}
				categoria={data.categoria}
			/>
		)}
	</div>
</article>				<div className="section-actions">
					<Link to="/modalidades" className="btn btn--ghost">← Voltar para Modalidades</Link>
				</div>
			</section>
		);
}

// Exportar componente envolvido com HOC para carregar dados do Firestore
// O botão "Salvar Alterações" aparece APENAS se usuário estiver autenticado (admin)
export default withModalidadeData(ModalidadeDetalhe);
