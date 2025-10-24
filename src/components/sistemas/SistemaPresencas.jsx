import React from 'react';

/**
 * Sistema de Presenças
 * COPIADO EXATAMENTE DO ORIGINAL ModalidadeDetalhe.jsx linha 3686-3843
 */
function SistemaPresencas({ adminMode, resultados = [], setResultados, equipesInscritas = [], modalidadeId }) {
	const calcularPercentual = (presencasManha, presencasTarde, totalAlunos) => {
		const totalPresencas = presencasManha + presencasTarde;
		const totalPossivel = totalAlunos * 2; // 2 chamadas por dia
		return totalPossivel > 0 ? ((totalPresencas / totalPossivel) * 100).toFixed(1) : 0;
	};

	// Carregar dados das equipes com resultados do Firestore
	const dadosEquipes = equipesInscritas.map(equipe => {
		const resultado = resultados.find(r => r.equipeId === equipe.id || r.equipeId === equipe.equipeId);
		
		const totalAlunos = equipe.totalAlunos || 30;
		const presencasManha = resultado?.presencasManha || 0;
		const presencasTarde = resultado?.presencasTarde || 0;
		const percentual = resultado?.percentual || parseFloat(calcularPercentual(presencasManha, presencasTarde, totalAlunos));
		
		return {
			id: equipe.id || equipe.equipeId,
			nome: equipe.nome || equipe.nomeEquipe,
			totalAlunos,
			presencasManha,
			presencasTarde,
			percentual,
			pontuacao: resultado?.pontos || 0,
			resultadoId: resultado?.id
		};
	});

	const handleAlterarPresencas = (equipeId, periodo, valor) => {
		if (!adminMode) return;
		
		const equipe = dadosEquipes.find(e => e.id === equipeId);
		if (!equipe) return;
		
		const novaManha = periodo === 'manha' ? Math.max(0, Math.min(valor, equipe.totalAlunos)) : equipe.presencasManha;
		const novaTarde = periodo === 'tarde' ? Math.max(0, Math.min(valor, equipe.totalAlunos)) : equipe.presencasTarde;
		const novoPercentual = parseFloat(calcularPercentual(novaManha, novaTarde, equipe.totalAlunos));
		
		const resultadoId = equipe.resultadoId || `resultado_${modalidadeId}_${equipeId}`;
		
		const novoResultado = {
			id: resultadoId,
			modalidadeId: modalidadeId,
			equipeId: equipeId,
			presencasManha: novaManha,
			presencasTarde: novaTarde,
			percentual: novoPercentual,
			totalAlunos: equipe.totalAlunos,
			pontos: 0, // Será calculado após ordenação
			tipo: 'percentual'
		};
		
		setResultados(prev => {
			const index = prev.findIndex(r => r.id === resultadoId || r.equipeId === equipeId);
			if (index >= 0) {
				const updated = [...prev];
				updated[index] = novoResultado;
				return updated;
			} else {
				return [...prev, novoResultado];
			}
		});
	};

	// Ordenar por percentual e atribuir pontuação em dobro
	const turmasOrdenadas = [...dadosEquipes].sort((a, b) => b.percentual - a.percentual);
	const pontuacaoBase = [160, 150, 140, 130, 120, 110, 100, 90, 80, 70, 60, 50, 40, 30, 20, 10];
	turmasOrdenadas.forEach((turma, index) => {
		turma.pontuacao = (pontuacaoBase[index] || 10) * 2; // Dobro da pontuação
	});

	return (
		<div style={{ margin: "24px auto", maxWidth: 1400 }}>
			<article className="card">
				<div className="card__header">
					<h2 className="card__title">📋 Controle de Presenças</h2>
				</div>
				<div className="card__body">
					<div style={{ marginBottom: 20, padding: 16, background: "rgba(45, 212, 191, 0.1)", borderRadius: 8, border: "1px solid rgba(45, 212, 191, 0.3)" }}>
						<h3 style={{ fontSize: 15, marginBottom: 8, color: "var(--primary)" }}>📋 Informações:</h3>
						<ul style={{ paddingLeft: 20, margin: 0, fontSize: 13, color: "var(--text)" }}>
							<li>Chamada 2x ao dia: <strong>8h10 (manhã)</strong> e <strong>13h10 (tarde)</strong></li>
							<li>Percentual de presença é <strong>ranqueado</strong></li>
							<li>Pontuação: <strong>DOBRO</strong> das pontuações das modalidades (1º = 320pts, 2º = 300pts, ...)</li>
							<li>Alunos em setores não comparecem à chamada geral</li>
						</ul>
					</div>

					<table className="home-table" style={{ fontSize: 13 }}>
						<thead>
							<tr>
								<th style={{ width: 50 }}>Pos.</th>
								<th>Turma</th>
								<th style={{ width: 80 }}>Total Alunos</th>
								<th style={{ width: 150 }}>Presenças Manhã</th>
								<th style={{ width: 150 }}>Presenças Tarde</th>
								<th style={{ width: 100 }}>Total Presenças</th>
								<th style={{ width: 100 }}>Percentual</th>
								<th style={{ width: 100 }}>Pontuação</th>
							</tr>
						</thead>
						<tbody>
							{turmasOrdenadas.map((turma, index) => (
								<tr key={turma.id}>
									<td style={{ fontWeight: 700 }}>{index + 1}º</td>
									<td>{turma.nome}</td>
									<td style={{ fontWeight: 600, textAlign: "center" }}>{turma.totalAlunos}</td>
									<td>
										{adminMode ? (
											<input 
												type="number"
												min="0"
												max={turma.totalAlunos}
												value={turma.presencasManha}
												onChange={(e) => handleAlterarPresencas(turma.id, 'manha', parseInt(e.target.value) || 0)}
												className="inputLogin"
												style={{ width: "100%", padding: "4px 8px" }}
											/>
										) : (
											<span style={{ textAlign: "center", display: "block" }}>{turma.presencasManha}</span>
										)}
									</td>
									<td>
										{adminMode ? (
											<input 
												type="number"
												min="0"
												max={turma.totalAlunos}
												value={turma.presencasTarde}
												onChange={(e) => handleAlterarPresencas(turma.id, 'tarde', parseInt(e.target.value) || 0)}
												className="inputLogin"
												style={{ width: "100%", padding: "4px 8px" }}
											/>
										) : (
											<span style={{ textAlign: "center", display: "block" }}>{turma.presencasTarde}</span>
										)}
									</td>
									<td style={{ fontWeight: 600, textAlign: "center" }}>
										{turma.presencasManha + turma.presencasTarde} / {turma.totalAlunos * 2}
									</td>
									<td style={{ fontWeight: 700, fontSize: 15, color: turma.percentual >= 90 ? "var(--primary)" : "var(--text)", textAlign: "center" }}>
										{turma.percentual}%
									</td>
									<td style={{ fontWeight: 700, fontSize: 16, color: "var(--accent)", textAlign: "center" }}>
										{turma.pontuacao}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</article>
		</div>
	);
}

export default SistemaPresencas;
