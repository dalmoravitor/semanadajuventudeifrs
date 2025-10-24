import React from 'react';

/**
 * Sistema de Inscrição (Kit Solidário)
 * COPIADO EXATAMENTE DO ORIGINAL ModalidadeDetalhe.jsx linha 3216-3352
 */
function SistemaInscricao({ adminMode, resultados = [], setResultados, equipesInscritas = [], modalidadeId }) {
	// Buscar dados reais das equipes inscritas e resultados do Firestore

	// Buscar dados reais das equipes inscritas e resultados do Firestore
	const dadosEquipes = equipesInscritas.map(equipe => {
		// Procurar resultado existente para esta equipe
		const resultado = resultados.find(r => r.equipeId === equipe.id || r.equipeId === equipe.equipeId);
		
		return {
			id: equipe.id || equipe.equipeId,
			nome: equipe.nome || equipe.nomeEquipe,
			kitEntregue: resultado?.kitCompleto || resultado?.concluido || false,
			dataEntrega: resultado?.dataRegistro ? new Date(resultado.dataRegistro?.seconds * 1000).toLocaleDateString('pt-BR') : "",
			pontuacao: resultado?.pontos || (resultado?.kitCompleto ? 160 : 0),
			resultadoId: resultado?.id
		};
	});

	const handleToggleKit = (equipeId) => {
		if (!adminMode) return;
		
		const equipe = dadosEquipes.find(e => e.id === equipeId);
		if (!equipe) return;
		
		const novoStatus = !equipe.kitEntregue;
		const novaPontuacao = novoStatus ? 160 : 0;
		
		// Criar/atualizar resultado no state
		const resultadoId = equipe.resultadoId || `resultado_${modalidadeId}_${equipeId}`;
		
		const novoResultado = {
			id: resultadoId,
			modalidadeId: modalidadeId,
			equipeId: equipeId,
			kitCompleto: novoStatus,
			pontos: novaPontuacao,
			dataRegistro: novoStatus ? new Date() : null,
			tipo: 'pontuacao-fixa'
		};
		
		// Atualizar array de resultados
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

	const equipesOrdenadas = [...dadosEquipes].sort((a, b) => b.pontuacao - a.pontuacao);

	return (
		<div style={{ margin: "24px auto", maxWidth: 1000 }}>
			<article className="card">
				<div className="card__header">
					<h2 className="card__title">📦 Controle de Entrega dos Kits Solidários</h2>
				</div>
				<div className="card__body">
					<div style={{ marginBottom: 20, padding: 16, background: "rgba(45, 212, 191, 0.1)", borderRadius: 8, border: "1px solid rgba(45, 212, 191, 0.3)" }}>
						<h3 style={{ fontSize: 15, marginBottom: 8, color: "var(--primary)" }}>📋 Itens do Kit Completo:</h3>
						<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8, fontSize: 13, color: "var(--text)" }}>
							<div>• Arroz 5kg: 1</div>
							<div>• Feijão 1kg: 1</div>
							<div>• Macarrão 500g: 2</div>
							<div>• Óleo 900ml-1L: 1</div>
							<div>• Açúcar 1kg: 1</div>
							<div>• Sardinha/Atum lata: 2</div>
							<div>• Farinha milho 1kg: 1</div>
							<div>• Leite em pó 1kg: 1</div>
							<div>• Sabonete: 4</div>
							<div>• Pasta de dentes: 1</div>
							<div>• Escova de dentes: 1</div>
							<div>• Papel higiênico: 1</div>
							<div>• Desodorante: 1</div>
							<div>• Shampoo pequeno: 1</div>
						</div>
						<p style={{ marginTop: 12, fontSize: 13, color: "var(--muted)" }}>
							<strong>Prazo:</strong> até 31/10 às 12h | <strong>Local:</strong> DAE | <strong>Kit completo:</strong> 160 pontos | <strong>Incompleto:</strong> 0 pontos
						</p>
					</div>

					<table className="home-table">
						<thead>
							<tr>
								<th style={{ width: 50 }}>Pos.</th>
								<th>Equipe</th>
								<th style={{ width: 150 }}>Status</th>
								<th style={{ width: 120 }}>Data Entrega</th>
								<th style={{ width: 100 }}>Pontuação</th>
								{adminMode && <th style={{ width: 120 }}>Ações</th>}
							</tr>
						</thead>
						<tbody>
							{equipesOrdenadas.length > 0 ? equipesOrdenadas.map((equipe, index) => (
								<tr key={equipe.id}>
									<td style={{ fontWeight: 700 }}>{index + 1}º</td>
									<td>{equipe.nome}</td>
									<td>
										{equipe.kitEntregue ? (
											<span style={{ color: "var(--primary)", fontWeight: 600 }}>✅ Completo</span>
										) : (
											<span style={{ color: "var(--muted)" }}>⏳ Pendente</span>
										)}
									</td>
									<td style={{ color: "var(--muted)", fontSize: 13 }}>{equipe.dataEntrega || "-"}</td>
									<td style={{ fontWeight: 700, color: equipe.pontuacao > 0 ? "var(--primary)" : "var(--muted)" }}>
										{equipe.pontuacao}
									</td>
									{adminMode && (
										<td>
											<button 
												className={equipe.kitEntregue ? "btn btn--ghost" : "btn btn--primary"}
												onClick={() => handleToggleKit(equipe.id)}
												style={{ padding: "4px 12px", fontSize: 12 }}
											>
												{equipe.kitEntregue ? "Desfazer" : "Marcar Entregue"}
											</button>
										</td>
									)}
								</tr>
							)) : (
								<tr>
									<td colSpan={adminMode ? 6 : 5} style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>
										Nenhuma equipe inscrita nesta modalidade
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</article>
		</div>
	);
}

export default SistemaInscricao;
