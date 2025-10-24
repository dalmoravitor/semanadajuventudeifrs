import React, { useState, useMemo, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../api/firebase';
import { getEquipes } from '../../api/equipes';

/**
 * Sistema de Bocha Campeira
 * 
 * REGRAS:
 * - 16 equipes divididas em 4 chaves
 * - Rodízio simples dentro de cada chave (todos jogam contra todos)
 * - Cada partida: primeiro a fazer 6 pontos vence
 * - Classificam 1º e 2º de cada chave (8 equipes para quartas)
 * - Desempate: confronto direto, saldo, pontos feitos, pontos sofridos, sorteio
 */
function SistemaBochaCampeira({ adminMode, modalidade }) {
	// Estados
	const [todasEquipes, setTodasEquipes] = useState([]);
	const [loading, setLoading] = useState(true);
	
	// Fase atual: "chaves", "quartas", "semis", "final"
	const [faseAtual, setFaseAtual] = useState("chaves");
	
	// Chaves (4 chaves com 4 equipes cada)
	const [chaves, setChaves] = useState([
		{ id: 1, nome: "Chave A", equipes: [] },
		{ id: 2, nome: "Chave B", equipes: [] },
		{ id: 3, nome: "Chave C", equipes: [] },
		{ id: 4, nome: "Chave D", equipes: [] }
	]);
	
	// Resultados das chaves: { "A_eq1_vs_eq2": {placar1: 6, placar2: 3}, ... }
	const [resultadosChaves, setResultadosChaves] = useState({});
	
	// Classificados para quartas (8 equipes: 1º e 2º de cada chave)
	const [classificadosQuartas, setClassificadosQuartas] = useState([]);
	
	// Confrontos e resultados das eliminatórias
	const [confrontosQuartas, setConfrontosQuartas] = useState([]);
	const [confrontosSemis, setConfrontosSemis] = useState([]);
	const [confrontoFinal, setConfrontoFinal] = useState(null);
	const [confrontoTerceiro, setConfrontoTerceiro] = useState(null);

	const NUM_EQUIPES_POR_CHAVE = 4;
	const PONTOS_PARA_VENCER = 6;

	// ========================================
	// CARREGAR DADOS
	// ========================================
	
	useEffect(() => {
		const carregarDados = async () => {
			try {
				console.log('🔄 Carregando dados da Bocha Campeira...');
				
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
					const docRef = doc(db, 'sistemaBochaCampeira', modalidade.id);
					const docSnap = await getDoc(docRef);

					if (docSnap.exists()) {
						const dados = docSnap.data();
						console.log('✅ Dados carregados:', dados);
						
						if (dados.chaves) setChaves(dados.chaves);
						if (dados.resultadosChaves) setResultadosChaves(dados.resultadosChaves);
						if (dados.faseAtual) setFaseAtual(dados.faseAtual);
						if (dados.classificadosQuartas) setClassificadosQuartas(dados.classificadosQuartas);
						if (dados.confrontosQuartas) setConfrontosQuartas(dados.confrontosQuartas);
						if (dados.confrontosSemis) setConfrontosSemis(dados.confrontosSemis);
						if (dados.confrontoFinal) setConfrontoFinal(dados.confrontoFinal);
						if (dados.confrontoTerceiro) setConfrontoTerceiro(dados.confrontoTerceiro);
					}
				}
			} catch (error) {
				console.error('❌ Erro ao carregar:', error);
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
		if (!modalidade?.id) return;

		try {
			const docRef = doc(db, 'sistemaBochaCampeira', modalidade.id);
			const dadosParaSalvar = {
				...dados,
				modalidadeId: modalidade.id,
				ultimaAtualizacao: new Date().toISOString()
			};

			const docSnap = await getDoc(docRef);
			
			if (docSnap.exists()) {
				await updateDoc(docRef, dadosParaSalvar);
			} else {
				await setDoc(docRef, dadosParaSalvar);
			}
			console.log('✅ Dados salvos no Firestore');
		} catch (error) {
			console.error('❌ Erro ao salvar:', error);
		}
	};

	// ========================================
	// GERENCIAR CHAVES
	// ========================================
	
	const handleAdicionarEquipeNaChave = (chaveId, equipeId) => {
		if (!equipeId) return;

		const chave = chaves.find(c => c.id === chaveId);
		if (chave.equipes.length >= NUM_EQUIPES_POR_CHAVE) {
			alert(`Chave ${chave.nome} já está completa (${NUM_EQUIPES_POR_CHAVE} equipes)`);
			return;
		}

		// Verificar se equipe já está em alguma chave
		const jaAdicionada = chaves.some(c => c.equipes.some(eq => eq.id === equipeId));
		if (jaAdicionada) {
			alert("Esta equipe já está em uma chave");
			return;
		}

		const equipe = todasEquipes.find(eq => eq.id === equipeId);
		if (!equipe) return;

		const novasChaves = chaves.map(c => {
			if (c.id === chaveId) {
				return { ...c, equipes: [...c.equipes, { id: equipe.id, nome: equipe.nome }] };
			}
			return c;
		});

		setChaves(novasChaves);
		salvarNoFirebase({ 
			chaves: novasChaves, 
			resultadosChaves, 
			faseAtual,
			classificadosQuartas,
			confrontosQuartas,
			confrontosSemis,
			confrontoFinal,
			confrontoTerceiro
		});
	};

	const handleRemoverEquipeDaChave = (chaveId, equipeId) => {
		const novasChaves = chaves.map(c => {
			if (c.id === chaveId) {
				return { ...c, equipes: c.equipes.filter(eq => eq.id !== equipeId) };
			}
			return c;
		});

		setChaves(novasChaves);
		salvarNoFirebase({ 
			chaves: novasChaves, 
			resultadosChaves, 
			faseAtual,
			classificadosQuartas,
			confrontosQuartas,
			confrontosSemis,
			confrontoFinal,
			confrontoTerceiro
		});
	};

	// ========================================
	// RESULTADOS DAS CHAVES
	// ========================================
	
	const handleResultadoChange = (chaveLetra, equipe1Id, equipe2Id, campo, valor) => {
		const chaveKey = `${chaveLetra}_${equipe1Id}_vs_${equipe2Id}`;
		const novoResultado = {
			...resultadosChaves[chaveKey],
			[campo]: valor === "" ? "" : parseInt(valor) || 0
		};

		const novosResultados = {
			...resultadosChaves,
			[chaveKey]: novoResultado
		};

		setResultadosChaves(novosResultados);
		salvarNoFirebase({ 
			chaves, 
			resultadosChaves: novosResultados, 
			faseAtual,
			classificadosQuartas,
			confrontosQuartas,
			confrontosSemis,
			confrontoFinal,
			confrontoTerceiro
		});
	};

	// ========================================
	// CLASSIFICAÇÃO DAS CHAVES
	// ========================================
	
	const calcularClassificacaoChave = (chave) => {
		const stats = {};
		
		// Inicializar stats
		chave.equipes.forEach(eq => {
			stats[eq.id] = {
				equipe: eq,
				jogos: 0,
				vitorias: 0,
				derrotas: 0,
				pontosPro: 0,
				pontosContra: 0,
				saldo: 0
			};
		});

		// Calcular resultados
		const chaveLetra = chave.nome.split(" ")[1]; // "A", "B", "C", "D"
		
		for (let i = 0; i < chave.equipes.length; i++) {
			for (let j = i + 1; j < chave.equipes.length; j++) {
				const eq1 = chave.equipes[i];
				const eq2 = chave.equipes[j];
				const chaveKey = `${chaveLetra}_${eq1.id}_vs_${eq2.id}`;
				const resultado = resultadosChaves[chaveKey];

				if (resultado && resultado.placar1 !== "" && resultado.placar2 !== "") {
					stats[eq1.id].jogos++;
					stats[eq2.id].jogos++;
					
					stats[eq1.id].pontosPro += resultado.placar1;
					stats[eq1.id].pontosContra += resultado.placar2;
					stats[eq2.id].pontosPro += resultado.placar2;
					stats[eq2.id].pontosContra += resultado.placar1;

					if (resultado.placar1 > resultado.placar2) {
						stats[eq1.id].vitorias++;
						stats[eq2.id].derrotas++;
					} else {
						stats[eq2.id].vitorias++;
						stats[eq1.id].derrotas++;
					}
				}
			}
		}

		// Calcular saldo
		Object.values(stats).forEach(s => {
			s.saldo = s.pontosPro - s.pontosContra;
		});

		// Ordenar: vitórias, saldo, pontos feitos, pontos sofridos
		return Object.values(stats).sort((a, b) => {
			if (b.vitorias !== a.vitorias) return b.vitorias - a.vitorias;
			if (b.saldo !== a.saldo) return b.saldo - a.saldo;
			if (b.pontosPro !== a.pontosPro) return b.pontosPro - a.pontosPro;
			return a.pontosContra - b.pontosContra;
		});
	};

	// ========================================
	// GERAR QUARTAS
	// ========================================
	
	const handleGerarQuartas = () => {
		// Verificar se todas as chaves estão completas
		for (const chave of chaves) {
			// Verificar se a chave tem 4 equipes
			if (chave.equipes.length < NUM_EQUIPES_POR_CHAVE) {
				alert(`Chave ${chave.nome}: precisa ter ${NUM_EQUIPES_POR_CHAVE} equipes!`);
				return;
			}

			// Contar jogos preenchidos diretamente dos resultados
			const chaveLetra = chave.nome.split(" ")[1]; // "A", "B", "C", "D"
			let jogosPreenchidos = 0;
			
			for (let i = 0; i < chave.equipes.length; i++) {
				for (let j = i + 1; j < chave.equipes.length; j++) {
					const eq1 = chave.equipes[i];
					const eq2 = chave.equipes[j];
					const chaveKey = `${chaveLetra}_${eq1.id}_vs_${eq2.id}`;
					const resultado = resultadosChaves[chaveKey];

					if (resultado && resultado.placar1 !== "" && resultado.placar2 !== "" && 
					    resultado.placar1 !== undefined && resultado.placar2 !== undefined) {
						jogosPreenchidos++;
					}
				}
			}

			const jogosNecessarios = (NUM_EQUIPES_POR_CHAVE * (NUM_EQUIPES_POR_CHAVE - 1)) / 2; // 6 jogos
			
			if (jogosPreenchidos < jogosNecessarios) {
				alert(`Chave ${chave.nome}: ainda faltam jogos! (${jogosPreenchidos}/${jogosNecessarios} completos)`);
				return;
			}
		}

		// Pegar 1º e 2º de cada chave
		const classificados = [];
		chaves.forEach(chave => {
			const classificacao = calcularClassificacaoChave(chave);
			if (classificacao.length >= 2) {
				classificados.push(classificacao[0].equipe); // 1º
				classificados.push(classificacao[1].equipe); // 2º
			}
		});

		if (classificados.length !== 8) {
			alert("Erro: deveria ter 8 classificados (1º e 2º de cada chave)");
			return;
		}

		// Gerar confrontos das quartas (1º vs 2º de outras chaves)
		// A1 vs B2, B1 vs A2, C1 vs D2, D1 vs C2
		const classifChaveA = calcularClassificacaoChave(chaves[0]);
		const classifChaveB = calcularClassificacaoChave(chaves[1]);
		const classifChaveC = calcularClassificacaoChave(chaves[2]);
		const classifChaveD = calcularClassificacaoChave(chaves[3]);

		const novosConfrontos = [
			{ id: 1, equipe1: classifChaveA[0]?.equipe, equipe2: classifChaveB[1]?.equipe, placar1: "", placar2: "" },
			{ id: 2, equipe1: classifChaveB[0]?.equipe, equipe2: classifChaveA[1]?.equipe, placar1: "", placar2: "" },
			{ id: 3, equipe1: classifChaveC[0]?.equipe, equipe2: classifChaveD[1]?.equipe, placar1: "", placar2: "" },
			{ id: 4, equipe1: classifChaveD[0]?.equipe, equipe2: classifChaveC[1]?.equipe, placar1: "", placar2: "" }
		];

		setClassificadosQuartas(classificados);
		setConfrontosQuartas(novosConfrontos);
		setFaseAtual("quartas");

		salvarNoFirebase({
			chaves,
			resultadosChaves,
			faseAtual: "quartas",
			classificadosQuartas: classificados,
			confrontosQuartas: novosConfrontos,
			confrontosSemis,
			confrontoFinal,
			confrontoTerceiro
		});

		alert("✅ Quartas de final geradas! 8 equipes classificadas.");
	};

	// ========================================
	// GERAR SEMIFINAIS
	// ========================================
	
	const handleGerarSemis = () => {
		const vencedores = confrontosQuartas
			.filter(c => c.placar1 !== "" && c.placar2 !== "")
			.map(c => {
				if (c.placar1 > c.placar2) return c.equipe1;
				else return c.equipe2;
			});

		if (vencedores.length !== 4) {
			alert("Complete todos os jogos das quartas antes de gerar as semifinais");
			return;
		}

		const novosSemis = [
			{ id: 1, equipe1: vencedores[0], equipe2: vencedores[1], placar1: "", placar2: "" },
			{ id: 2, equipe1: vencedores[2], equipe2: vencedores[3], placar1: "", placar2: "" }
		];

		setConfrontosSemis(novosSemis);
		setFaseAtual("semis");

		salvarNoFirebase({
			chaves,
			resultadosChaves,
			faseAtual: "semis",
			classificadosQuartas,
			confrontosQuartas,
			confrontosSemis: novosSemis,
			confrontoFinal,
			confrontoTerceiro
		});

		alert("✅ Semifinais geradas!");
	};

	// ========================================
	// GERAR FINAL
	// ========================================
	
	const handleGerarFinal = () => {
		const completos = confrontosSemis.filter(c => c.placar1 !== "" && c.placar2 !== "");
		if (completos.length !== 2) {
			alert("Complete as duas semifinais antes de gerar a final");
			return;
		}

		const vencedores = completos.map(c => 
			c.placar1 > c.placar2 ? c.equipe1 : c.equipe2
		);
		const perdedores = completos.map(c => 
			c.placar1 > c.placar2 ? c.equipe2 : c.equipe1
		);

		const novaFinal = {
			id: 1,
			equipe1: vencedores[0],
			equipe2: vencedores[1],
			placar1: "",
			placar2: ""
		};

		const novoTerceiro = {
			id: 1,
			equipe1: perdedores[0],
			equipe2: perdedores[1],
			placar1: "",
			placar2: ""
		};

		setConfrontoFinal(novaFinal);
		setConfrontoTerceiro(novoTerceiro);
		setFaseAtual("final");

		salvarNoFirebase({
			chaves,
			resultadosChaves,
			faseAtual: "final",
			classificadosQuartas,
			confrontosQuartas,
			confrontosSemis,
			confrontoFinal: novaFinal,
			confrontoTerceiro: novoTerceiro
		});

		alert("✅ Final e disputa de 3º lugar geradas!");
	};

	// ========================================
	// ATUALIZAR RESULTADOS ELIMINATÓRIAS
	// ========================================
	
	const handleResultadoEliminatoriaChange = (fase, confrontoId, campo, valor) => {
		const valorNum = valor === "" ? "" : parseInt(valor) || 0;

		if (fase === "quartas") {
			const novosConfrontos = confrontosQuartas.map(c =>
				c.id === confrontoId ? { ...c, [campo]: valorNum } : c
			);
			setConfrontosQuartas(novosConfrontos);
			salvarNoFirebase({
				chaves,
				resultadosChaves,
				faseAtual,
				classificadosQuartas,
				confrontosQuartas: novosConfrontos,
				confrontosSemis,
				confrontoFinal,
				confrontoTerceiro
			});
		} else if (fase === "semis") {
			const novosConfrontos = confrontosSemis.map(c =>
				c.id === confrontoId ? { ...c, [campo]: valorNum } : c
			);
			setConfrontosSemis(novosConfrontos);
			salvarNoFirebase({
				chaves,
				resultadosChaves,
				faseAtual,
				classificadosQuartas,
				confrontosQuartas,
				confrontosSemis: novosConfrontos,
				confrontoFinal,
				confrontoTerceiro
			});
		} else if (fase === "final") {
			setConfrontoFinal({ ...confrontoFinal, [campo]: valorNum });
			salvarNoFirebase({
				chaves,
				resultadosChaves,
				faseAtual,
				classificadosQuartas,
				confrontosQuartas,
				confrontosSemis,
				confrontoFinal: { ...confrontoFinal, [campo]: valorNum },
				confrontoTerceiro
			});
		} else if (fase === "terceiro") {
			setConfrontoTerceiro({ ...confrontoTerceiro, [campo]: valorNum });
			salvarNoFirebase({
				chaves,
				resultadosChaves,
				faseAtual,
				classificadosQuartas,
				confrontosQuartas,
				confrontosSemis,
				confrontoFinal,
				confrontoTerceiro: { ...confrontoTerceiro, [campo]: valorNum }
			});
		}
	};

	// ========================================
	// RANKING FINAL
	// ========================================
	
	const rankingFinal = useMemo(() => {
		const ranking = [];

		if (confrontoFinal && confrontoFinal.placar1 !== "" && confrontoFinal.placar2 !== "") {
			// 1º e 2º lugar
			const campeao = confrontoFinal.placar1 > confrontoFinal.placar2 ? confrontoFinal.equipe1 : confrontoFinal.equipe2;
			const vice = confrontoFinal.placar1 > confrontoFinal.placar2 ? confrontoFinal.equipe2 : confrontoFinal.equipe1;
			
			ranking.push({ posicao: 1, equipe: campeao, pontos: 160 });
			ranking.push({ posicao: 2, equipe: vice, pontos: 150 });

			// 3º e 4º lugar
			if (confrontoTerceiro && confrontoTerceiro.placar1 !== "" && confrontoTerceiro.placar2 !== "") {
				const terceiro = confrontoTerceiro.placar1 > confrontoTerceiro.placar2 ? confrontoTerceiro.equipe1 : confrontoTerceiro.equipe2;
				const quarto = confrontoTerceiro.placar1 > confrontoTerceiro.placar2 ? confrontoTerceiro.equipe2 : confrontoTerceiro.equipe1;
				
				ranking.push({ posicao: 3, equipe: terceiro, pontos: 140 });
				ranking.push({ posicao: 4, equipe: quarto, pontos: 130 });
			}
		}

		// 5º ao 8º (eliminados nas quartas) - ordenar por desempenho nas chaves
		if (confrontosQuartas.length > 0) {
			const eliminadosQuartas = confrontosQuartas
				.filter(c => c.placar1 !== "" && c.placar2 !== "")
				.map(c => c.placar1 < c.placar2 ? c.equipe1 : c.equipe2);

			eliminadosQuartas.forEach((eq, idx) => {
				ranking.push({ posicao: 5 + idx, equipe: eq, pontos: 120 - (idx * 10) });
			});
		}

		// 9º ao 16º (não classificados das chaves)
		chaves.forEach(chave => {
			const classificacao = calcularClassificacaoChave(chave);
			const naoClassificados = classificacao.slice(2); // 3º e 4º de cada chave
			
			naoClassificados.forEach(stat => {
				if (!ranking.some(r => r.equipe?.id === stat.equipe.id)) {
					ranking.push({ 
						posicao: ranking.length + 1, 
						equipe: stat.equipe, 
						pontos: Math.max(80 - (ranking.length - 8) * 10, 10)
					});
				}
			});
		});

		return ranking;
	}, [confrontoFinal, confrontoTerceiro, confrontosQuartas, chaves, resultadosChaves]);

	// Equipes disponíveis
	const equipesDisponiveis = Array.isArray(todasEquipes) 
		? todasEquipes.filter(eq => !chaves.some(c => c.equipes.some(e => e.id === eq.id)))
		: [];

	if (loading) {
		return (
			<div style={{ textAlign: "center", padding: "40px 20px" }}>
				<p style={{ fontSize: 16, color: "var(--muted)" }}>⏳ Carregando...</p>
			</div>
		);
	}

	return (
		<div style={{ marginTop: 24, maxWidth: "100%", overflowX: "hidden" }}>
			{/* FASE: CHAVES */}
			{adminMode && faseAtual === "chaves" && (
				<>
					{/* Montar Chaves */}
					<article className="card" style={{ maxWidth: "90vw", margin: "0 auto" }}>
						<div className="card__header">
							<h2 className="card__title">🎯 Fase de Chaves - Rodízio Simples</h2>
							<p style={{ fontSize: 13, color: "var(--muted)", margin: "8px 0 0 0" }}>
								16 equipes em 4 chaves. Classificam 1º e 2º de cada chave (8 para quartas).
							</p>
						</div>
						<div className="card__body">
							<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
								{chaves.map(chave => (
									<div
										key={chave.id}
										style={{
											padding: 16,
											background: "rgba(59, 130, 246, 0.1)",
											border: "2px solid rgba(59, 130, 246, 0.3)",
											borderRadius: 12
										}}
									>
										<h3 style={{ margin: "0 0 12px 0", fontSize: 16, fontWeight: 700 }}>
											{chave.nome} ({chave.equipes.length}/{NUM_EQUIPES_POR_CHAVE})
										</h3>

										{/* Equipes da chave */}
										<div style={{ marginBottom: 12 }}>
											{chave.equipes.map((eq, idx) => (
												<div
													key={eq.id}
													style={{
														padding: "8px 12px",
														background: "rgba(255, 255, 255, 0.1)",
														borderRadius: 6,
														marginBottom: 6,
														display: "flex",
														justifyContent: "space-between",
														alignItems: "center"
													}}
												>
													<span style={{ fontSize: 14, fontWeight: 500 }}>
														{idx + 1}. {eq.nome}
													</span>
													<button
														onClick={() => handleRemoverEquipeDaChave(chave.id, eq.id)}
														style={{
															padding: "2px 8px",
															background: "rgba(239, 68, 68, 0.3)",
															border: "none",
															borderRadius: 4,
															cursor: "pointer",
															fontSize: 12
														}}
													>
														✖
													</button>
												</div>
											))}
										</div>

										{/* Adicionar equipe */}
										{chave.equipes.length < NUM_EQUIPES_POR_CHAVE && (
											<select
												onChange={(e) => {
													handleAdicionarEquipeNaChave(chave.id, e.target.value);
													e.target.value = "";
												}}
												style={{
													width: "100%",
													padding: "8px 12px",
													borderRadius: 6,
													border: "1px solid var(--border)",
													background: "var(--card)",
													color: "var(--text)",
													fontSize: 14
												}}
											>
												<option value="">+ Adicionar equipe...</option>
												{equipesDisponiveis.map(eq => (
													<option key={eq.id} value={eq.id}>{eq.nome}</option>
												))}
											</select>
										)}
									</div>
								))}
							</div>
						</div>
					</article>

					{/* Resultados dos Jogos das Chaves */}
					{chaves.some(c => c.equipes.length > 0) && (
						<article className="card" style={{ marginTop: 24, maxWidth: "90vw", margin: "24px auto 0" }}>
							<div className="card__header">
								<h2 className="card__title">⚪ Resultados das Partidas</h2>
								<p style={{ fontSize: 13, color: "var(--muted)", margin: "8px 0 0 0" }}>
									Primeiro a fazer {PONTOS_PARA_VENCER} pontos vence a partida.
								</p>
							</div>
							<div className="card__body">
								{chaves.map(chave => {
									if (chave.equipes.length < 2) return null;

									const chaveLetra = chave.nome.split(" ")[1];
									const confrontos = [];

									for (let i = 0; i < chave.equipes.length; i++) {
										for (let j = i + 1; j < chave.equipes.length; j++) {
											confrontos.push({
												eq1: chave.equipes[i],
												eq2: chave.equipes[j]
											});
										}
									}

									return (
										<div key={chave.id} style={{ marginBottom: 32 }}>
											<h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: "var(--primary)" }}>
												{chave.nome}
											</h3>
											<div style={{ overflowX: "auto" }}>
												<table className="table">
													<thead>
														<tr>
															<th style={{ minWidth: 150 }}>Equipe 1</th>
															<th style={{ width: 80 }}>Placar</th>
															<th style={{ width: 50 }}>vs</th>
															<th style={{ width: 80 }}>Placar</th>
															<th style={{ minWidth: 150 }}>Equipe 2</th>
														</tr>
													</thead>
													<tbody>
														{confrontos.map((confronto, idx) => {
															const chaveKey = `${chaveLetra}_${confronto.eq1.id}_vs_${confronto.eq2.id}`;
															const resultado = resultadosChaves[chaveKey] || { placar1: "", placar2: "" };

															return (
																<tr key={idx}>
																	<td><strong>{confronto.eq1.nome}</strong></td>
																	<td>
																		<input
																			type="number"
																			min="0"
																			max="10"
																			value={resultado.placar1}
																			onChange={(e) => handleResultadoChange(chaveLetra, confronto.eq1.id, confronto.eq2.id, "placar1", e.target.value)}
																			style={{
																				width: 60,
																				padding: "6px 10px",
																				borderRadius: 6,
																				border: "1px solid var(--border)",
																				background: "var(--card)",
																				color: "var(--text)",
																				fontSize: 14,
																				textAlign: "center"
																			}}
																		/>
																	</td>
																	<td style={{ textAlign: "center", color: "var(--muted)" }}>vs</td>
																	<td>
																		<input
																			type="number"
																			min="0"
																			max="10"
																			value={resultado.placar2}
																			onChange={(e) => handleResultadoChange(chaveLetra, confronto.eq1.id, confronto.eq2.id, "placar2", e.target.value)}
																			style={{
																				width: 60,
																				padding: "6px 10px",
																				borderRadius: 6,
																				border: "1px solid var(--border)",
																				background: "var(--card)",
																				color: "var(--text)",
																				fontSize: 14,
																				textAlign: "center"
																			}}
																		/>
																	</td>
																	<td><strong>{confronto.eq2.nome}</strong></td>
																</tr>
															);
														})}
													</tbody>
												</table>
											</div>
										</div>
									);
								})}
							</div>
						</article>
					)}

					{/* Classificação das Chaves */}
					{chaves.some(c => c.equipes.length > 0) && (
						<article className="card" style={{ marginTop: 24, maxWidth: "90vw", margin: "24px auto 0" }}>
							<div className="card__header">
								<h2 className="card__title">📊 Classificação das Chaves</h2>
							</div>
							<div className="card__body">
								{chaves.map(chave => {
									if (chave.equipes.length === 0) return null;

									const classificacao = calcularClassificacaoChave(chave);

									return (
										<div key={chave.id} style={{ marginBottom: 32 }}>
											<h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
												{chave.nome}
											</h3>
											<div style={{ overflowX: "auto" }}>
												<table className="table">
													<thead>
														<tr>
															<th style={{ width: 60 }}>Pos</th>
															<th style={{ minWidth: 150 }}>Equipe</th>
															<th style={{ width: 60 }}>J</th>
															<th style={{ width: 60 }}>V</th>
															<th style={{ width: 60 }}>D</th>
															<th style={{ width: 80 }}>P. Feitos</th>
															<th style={{ width: 80 }}>P. Sofridos</th>
															<th style={{ width: 80 }}>Saldo</th>
														</tr>
													</thead>
													<tbody>
														{classificacao.map((stat, idx) => {
															const classificado = idx < 2;
															return (
																<tr key={stat.equipe.id} style={{ 
																	background: classificado ? "rgba(45, 212, 191, 0.1)" : "transparent"
																}}>
																	<td>
																		<strong>{idx + 1}º</strong>
																		{classificado && " ✅"}
																	</td>
																	<td>
																		<strong style={{ color: classificado ? "var(--primary)" : "inherit" }}>
																			{stat.equipe.nome}
																		</strong>
																	</td>
																	<td>{stat.jogos}</td>
																	<td>{stat.vitorias}</td>
																	<td>{stat.derrotas}</td>
																	<td>{stat.pontosPro}</td>
																	<td>{stat.pontosContra}</td>
																	<td>
																		<strong style={{ color: stat.saldo >= 0 ? "var(--success)" : "var(--error)" }}>
																			{stat.saldo >= 0 ? "+" : ""}{stat.saldo}
																		</strong>
																	</td>
																</tr>
															);
														})}
													</tbody>
												</table>
											</div>
										</div>
									);
								})}

								<button
									onClick={handleGerarQuartas}
									className="btn btn--primary"
									style={{ marginTop: 16 }}
								>
									🏁 Gerar Quartas de Final
								</button>
							</div>
						</article>
					)}
				</>
			)}

			{/* FASE: QUARTAS */}
			{adminMode && (faseAtual === "quartas" || faseAtual === "semis" || faseAtual === "final") && confrontosQuartas.length > 0 && (
				<article className="card" style={{ marginTop: 24, maxWidth: "90vw", margin: "24px auto 0" }}>
					<div className="card__header">
						<h2 className="card__title">🏆 Quartas de Final</h2>
					</div>
					<div className="card__body">
						<div style={{ overflowX: "auto" }}>
							<table className="table">
								<thead>
									<tr>
										<th style={{ minWidth: 150 }}>Equipe 1</th>
										<th style={{ width: 80 }}>Placar</th>
										<th style={{ width: 50 }}>vs</th>
										<th style={{ width: 80 }}>Placar</th>
										<th style={{ minWidth: 150 }}>Equipe 2</th>
									</tr>
								</thead>
								<tbody>
									{confrontosQuartas.map(confronto => (
										<tr key={confronto.id}>
											<td><strong>{confronto.equipe1?.nome}</strong></td>
											<td>
												<input
													type="number"
													min="0"
													value={confronto.placar1}
													onChange={(e) => handleResultadoEliminatoriaChange("quartas", confronto.id, "placar1", e.target.value)}
													disabled={faseAtual !== "quartas"}
													style={{
														width: 60,
														padding: "6px 10px",
														borderRadius: 6,
														border: "1px solid var(--border)",
														background: "var(--card)",
														color: "var(--text)",
														fontSize: 14,
														textAlign: "center"
													}}
												/>
											</td>
											<td style={{ textAlign: "center", color: "var(--muted)" }}>vs</td>
											<td>
												<input
													type="number"
													min="0"
													value={confronto.placar2}
													onChange={(e) => handleResultadoEliminatoriaChange("quartas", confronto.id, "placar2", e.target.value)}
													disabled={faseAtual !== "quartas"}
													style={{
														width: 60,
														padding: "6px 10px",
														borderRadius: 6,
														border: "1px solid var(--border)",
														background: "var(--card)",
														color: "var(--text)",
														fontSize: 14,
														textAlign: "center"
													}}
												/>
											</td>
											<td><strong>{confronto.equipe2?.nome}</strong></td>
										</tr>
									))}
								</tbody>
							</table>
						</div>

						{faseAtual === "quartas" && (
							<button
								onClick={handleGerarSemis}
								className="btn btn--primary"
								style={{ marginTop: 16 }}
							>
								➡️ Gerar Semifinais
							</button>
						)}
					</div>
				</article>
			)}

			{/* FASE: SEMIFINAIS */}
			{adminMode && (faseAtual === "semis" || faseAtual === "final") && confrontosSemis.length > 0 && (
				<article className="card" style={{ marginTop: 24, maxWidth: "90vw", margin: "24px auto 0" }}>
					<div className="card__header">
						<h2 className="card__title">🥇 Semifinais</h2>
					</div>
					<div className="card__body">
						<div style={{ overflowX: "auto" }}>
							<table className="table">
								<thead>
									<tr>
										<th style={{ minWidth: 150 }}>Equipe 1</th>
										<th style={{ width: 80 }}>Placar</th>
										<th style={{ width: 50 }}>vs</th>
										<th style={{ width: 80 }}>Placar</th>
										<th style={{ minWidth: 150 }}>Equipe 2</th>
									</tr>
								</thead>
								<tbody>
									{confrontosSemis.map(confronto => (
										<tr key={confronto.id}>
											<td><strong>{confronto.equipe1?.nome}</strong></td>
											<td>
												<input
													type="number"
													min="0"
													value={confronto.placar1}
													onChange={(e) => handleResultadoEliminatoriaChange("semis", confronto.id, "placar1", e.target.value)}
													disabled={faseAtual !== "semis"}
													style={{
														width: 60,
														padding: "6px 10px",
														borderRadius: 6,
														border: "1px solid var(--border)",
														background: "var(--card)",
														color: "var(--text)",
														fontSize: 14,
														textAlign: "center"
													}}
												/>
											</td>
											<td style={{ textAlign: "center", color: "var(--muted)" }}>vs</td>
											<td>
												<input
													type="number"
													min="0"
													value={confronto.placar2}
													onChange={(e) => handleResultadoEliminatoriaChange("semis", confronto.id, "placar2", e.target.value)}
													disabled={faseAtual !== "semis"}
													style={{
														width: 60,
														padding: "6px 10px",
														borderRadius: 6,
														border: "1px solid var(--border)",
														background: "var(--card)",
														color: "var(--text)",
														fontSize: 14,
														textAlign: "center"
													}}
												/>
											</td>
											<td><strong>{confronto.equipe2?.nome}</strong></td>
										</tr>
									))}
								</tbody>
							</table>
						</div>

						{faseAtual === "semis" && (
							<button
								onClick={handleGerarFinal}
								className="btn btn--primary"
								style={{ marginTop: 16 }}
							>
								🏆 Gerar Final e Disputa de 3º
							</button>
						)}
					</div>
				</article>
			)}

			{/* FASE: FINAL */}
			{adminMode && faseAtual === "final" && confrontoFinal && (
				<>
					<article className="card" style={{ marginTop: 24, maxWidth: "90vw", margin: "24px auto 0" }}>
						<div className="card__header">
							<h2 className="card__title">🏆 FINAL</h2>
						</div>
						<div className="card__body">
							<div style={{ overflowX: "auto" }}>
								<table className="table">
									<thead>
										<tr>
											<th style={{ minWidth: 150 }}>Equipe 1</th>
											<th style={{ width: 80 }}>Placar</th>
											<th style={{ width: 50 }}>vs</th>
											<th style={{ width: 80 }}>Placar</th>
											<th style={{ minWidth: 150 }}>Equipe 2</th>
										</tr>
									</thead>
									<tbody>
										<tr>
											<td><strong>{confrontoFinal.equipe1?.nome}</strong></td>
											<td>
												<input
													type="number"
													min="0"
													value={confrontoFinal.placar1}
													onChange={(e) => handleResultadoEliminatoriaChange("final", 1, "placar1", e.target.value)}
													style={{
														width: 60,
														padding: "6px 10px",
														borderRadius: 6,
														border: "1px solid var(--border)",
														background: "var(--card)",
														color: "var(--text)",
														fontSize: 14,
														textAlign: "center"
													}}
												/>
											</td>
											<td style={{ textAlign: "center", color: "var(--muted)" }}>vs</td>
											<td>
												<input
													type="number"
													min="0"
													value={confrontoFinal.placar2}
													onChange={(e) => handleResultadoEliminatoriaChange("final", 1, "placar2", e.target.value)}
													style={{
														width: 60,
														padding: "6px 10px",
														borderRadius: 6,
														border: "1px solid var(--border)",
														background: "var(--card)",
														color: "var(--text)",
														fontSize: 14,
														textAlign: "center"
													}}
												/>
											</td>
											<td><strong>{confrontoFinal.equipe2?.nome}</strong></td>
										</tr>
									</tbody>
								</table>
							</div>
						</div>
					</article>

					{confrontoTerceiro && (
						<article className="card" style={{ marginTop: 24, maxWidth: "90vw", margin: "24px auto 0" }}>
							<div className="card__header">
								<h2 className="card__title">🥉 Disputa de 3º Lugar</h2>
							</div>
							<div className="card__body">
								<div style={{ overflowX: "auto" }}>
									<table className="table">
										<thead>
											<tr>
												<th style={{ minWidth: 150 }}>Equipe 1</th>
												<th style={{ width: 80 }}>Placar</th>
												<th style={{ width: 50 }}>vs</th>
												<th style={{ width: 80 }}>Placar</th>
												<th style={{ minWidth: 150 }}>Equipe 2</th>
											</tr>
										</thead>
										<tbody>
											<tr>
												<td><strong>{confrontoTerceiro.equipe1?.nome}</strong></td>
												<td>
													<input
														type="number"
														min="0"
														value={confrontoTerceiro.placar1}
														onChange={(e) => handleResultadoEliminatoriaChange("terceiro", 1, "placar1", e.target.value)}
														style={{
															width: 60,
															padding: "6px 10px",
															borderRadius: 6,
															border: "1px solid var(--border)",
															background: "var(--card)",
															color: "var(--text)",
															fontSize: 14,
															textAlign: "center"
														}}
													/>
												</td>
												<td style={{ textAlign: "center", color: "var(--muted)" }}>vs</td>
												<td>
													<input
														type="number"
														min="0"
														value={confrontoTerceiro.placar2}
														onChange={(e) => handleResultadoEliminatoriaChange("terceiro", 1, "placar2", e.target.value)}
														style={{
															width: 60,
															padding: "6px 10px",
															borderRadius: 6,
															border: "1px solid var(--border)",
															background: "var(--card)",
															color: "var(--text)",
															fontSize: 14,
															textAlign: "center"
														}}
													/>
												</td>
												<td><strong>{confrontoTerceiro.equipe2?.nome}</strong></td>
											</tr>
										</tbody>
									</table>
								</div>
							</div>
						</article>
					)}
				</>
			)}

			{/* RANKING FINAL */}
			{rankingFinal.length > 0 && (
				<article className="card" style={{ marginTop: 24, maxWidth: "90vw", margin: "24px auto 0" }}>
					<div className="card__header">
						<h2 className="card__title">🏆 Classificação Geral</h2>
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
									{rankingFinal.map((item) => {
										const isTop3 = item.posicao <= 3;
										return (
											<tr key={item.equipe?.id || item.posicao}>
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
														{item.equipe?.nome || "—"}
													</strong>
												</td>
												<td>
													<strong style={{ 
														fontSize: 18, 
														color: isTop3 ? "var(--accent)" : "var(--text)",
														fontWeight: "bold"
													}}>
														{item.pontos}pts
													</strong>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					</div>
				</article>
			)}
		</div>
	);
}

export default SistemaBochaCampeira;
