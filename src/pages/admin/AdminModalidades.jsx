import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getModalidades, updateModalidade } from "../../api/modalidades";
import Loader from "../../components/Loader";
import Alert from "../../components/Alert";

export default function AdminModalidades() {
	const navigate = useNavigate();
	const [modalidades, setModalidades] = useState([]);
	const [filteredModalidades, setFilteredModalidades] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	
	// Filtros
	const [filtroCategoria, setFiltroCategoria] = useState("todas");
	const [filtroStatus, setFiltroStatus] = useState("todos");
	const [filtroTipo, setFiltroTipo] = useState("todos");
	const [busca, setBusca] = useState("");

	useEffect(() => {
		fetchModalidades();
	}, []);

	const fetchModalidades = async () => {
		setLoading(true);
		setError(null);
		try {
			const result = await getModalidades();
			if (result.success) {
				setModalidades(result.data);
				setFilteredModalidades(result.data);
			} else {
				setError(result.error || "Erro ao carregar modalidades");
			}
		} catch (err) {
			console.error("Erro ao buscar modalidades:", err);
			setError("Erro ao conectar com o servidor");
		} finally {
			setLoading(false);
		}
	};

	// Aplicar filtros
	useEffect(() => {
		let filtered = [...modalidades];

		// Filtro por categoria
		if (filtroCategoria !== "todas") {
			filtered = filtered.filter(m => m.categoria === filtroCategoria);
		}

		// Filtro por status
		if (filtroStatus !== "todos") {
			filtered = filtered.filter(m => m.status === filtroStatus);
		}

		// Filtro por tipo
		if (filtroTipo !== "todos") {
			filtered = filtered.filter(m => m.tipo === filtroTipo);
		}

		// Busca por texto
		if (busca.trim()) {
			const buscaLower = busca.toLowerCase();
			filtered = filtered.filter(m => 
				m.nome.toLowerCase().includes(buscaLower) ||
				m.id.toLowerCase().includes(buscaLower)
			);
		}

		setFilteredModalidades(filtered);
	}, [modalidades, filtroCategoria, filtroStatus, filtroTipo, busca]);

	const handleStatusChange = async (modalidadeId, novoStatus) => {
		try {
			const modalidade = modalidades.find(m => m.id === modalidadeId);
			if (!modalidade) return;

			const result = await updateModalidade(modalidadeId, { status: novoStatus });
			if (result.success) {
				// Atualizar localmente
				setModalidades(prev => 
					prev.map(m => m.id === modalidadeId ? { ...m, status: novoStatus } : m)
				);
			} else {
				alert("Erro ao atualizar status: " + result.error);
			}
		} catch (err) {
			console.error("Erro ao atualizar status:", err);
			alert("Erro ao atualizar status");
		}
	};

	const getStatusBadge = (status) => {
		const styles = {
			planejada: { bg: "#fef3c7", color: "#92400e", text: "📅 Planejada" },
			ativa: { bg: "#dbeafe", color: "#1e40af", text: "🔄 Ativa" },
			concluida: { bg: "#d1fae5", color: "#065f46", text: "✅ Concluída" }
		};
		const s = styles[status] || styles.planejada;
		return (
			<span style={{
				backgroundColor: s.bg,
				color: s.color,
				padding: "4px 12px",
				borderRadius: "12px",
				fontSize: "0.75rem",
				fontWeight: "600"
			}}>
				{s.text}
			</span>
		);
	};

	if (loading) {
		return (
			<div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
				<Loader />
			</div>
		);
	}

	if (error) {
		return (
			<div style={{ padding: "40px 20px", maxWidth: "1200px", margin: "0 auto" }}>
				<Alert type="error" message={error} />
				<button onClick={fetchModalidades} className="btn btn--primary" style={{ marginTop: "20px" }}>
					Tentar Novamente
				</button>
			</div>
		);
	}

	return (
		<div style={{ padding: "40px 20px", maxWidth: "1400px", margin: "0 auto" }}>
			{/* Header */}
			<div style={{ marginBottom: "40px" }}>
				<button 
					onClick={() => navigate("/admin")}
					style={{
						background: "none",
						border: "none",
						color: "var(--primary)",
						fontSize: "0.875rem",
						cursor: "pointer",
						marginBottom: "12px",
						display: "flex",
						alignItems: "center",
						gap: "4px"
					}}
				>
					← Voltar ao Dashboard
				</button>
				<h1 style={{ fontSize: "2rem", marginBottom: "8px" }}>
					📋 Gerenciar Modalidades
				</h1>
				<p style={{ color: "var(--muted)", fontSize: "0.875rem" }}>
					Total: {filteredModalidades.length} modalidade(s)
				</p>
			</div>

			{/* Filtros */}
			<div style={{ 
				backgroundColor: "var(--card-bg)",
				padding: "24px",
				borderRadius: "12px",
				marginBottom: "32px",
				border: "1px solid var(--border)"
			}}>
				<div style={{ 
					display: "grid", 
					gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
					gap: "16px",
					marginBottom: "16px"
				}}>
					{/* Filtro Categoria */}
					<div>
						<label style={{ display: "block", marginBottom: "8px", fontSize: "0.875rem", fontWeight: "500" }}>
							Categoria
						</label>
						<select 
							value={filtroCategoria}
							onChange={(e) => setFiltroCategoria(e.target.value)}
							style={{
								width: "100%",
								padding: "10px",
								borderRadius: "8px",
								border: "1px solid var(--border)",
								backgroundColor: "var(--bg)",
								fontSize: "0.875rem"
							}}
						>
							<option value="todas">Todas</option>
							<option value="masculino">Masculino</option>
							<option value="feminino">Feminino</option>
							<option value="misto">Misto</option>
						</select>
					</div>

					{/* Filtro Status */}
					<div>
						<label style={{ display: "block", marginBottom: "8px", fontSize: "0.875rem", fontWeight: "500" }}>
							Status
						</label>
						<select 
							value={filtroStatus}
							onChange={(e) => setFiltroStatus(e.target.value)}
							style={{
								width: "100%",
								padding: "10px",
								borderRadius: "8px",
								border: "1px solid var(--border)",
								backgroundColor: "var(--bg)",
								fontSize: "0.875rem"
							}}
						>
							<option value="todos">Todos</option>
							<option value="planejada">Planejada</option>
							<option value="ativa">Ativa</option>
							<option value="concluida">Concluída</option>
						</select>
					</div>

					{/* Filtro Tipo */}
					<div>
						<label style={{ display: "block", marginBottom: "8px", fontSize: "0.875rem", fontWeight: "500" }}>
							Tipo
						</label>
						<select 
							value={filtroTipo}
							onChange={(e) => setFiltroTipo(e.target.value)}
							style={{
								width: "100%",
								padding: "10px",
								borderRadius: "8px",
								border: "1px solid var(--border)",
								backgroundColor: "var(--bg)",
								fontSize: "0.875rem"
							}}
						>
							<option value="todos">Todos</option>
							<option value="coletivo">Coletivo</option>
							<option value="individual">Individual</option>
							<option value="dupla">Dupla</option>
						</select>
					</div>
				</div>

				{/* Busca */}
				<div>
					<label style={{ display: "block", marginBottom: "8px", fontSize: "0.875rem", fontWeight: "500" }}>
						🔍 Buscar
					</label>
					<input 
						type="text"
						placeholder="Digite o nome ou ID da modalidade..."
						value={busca}
						onChange={(e) => setBusca(e.target.value)}
						style={{
							width: "100%",
							padding: "10px 16px",
							borderRadius: "8px",
							border: "1px solid var(--border)",
							backgroundColor: "var(--bg)",
							fontSize: "0.875rem"
						}}
					/>
				</div>
			</div>

			{/* Lista de Modalidades */}
			{filteredModalidades.length === 0 ? (
				<div style={{ textAlign: "center", padding: "60px 20px" }}>
					<div style={{ fontSize: "3rem", marginBottom: "16px" }}>🔍</div>
					<h3 style={{ fontSize: "1.25rem", marginBottom: "8px" }}>Nenhuma modalidade encontrada</h3>
					<p style={{ color: "var(--muted)", fontSize: "0.875rem" }}>
						Tente ajustar os filtros ou fazer uma nova busca
					</p>
				</div>
			) : (
				<div style={{ 
					display: "grid", 
					gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
					gap: "20px"
				}}>
					{filteredModalidades.map(modalidade => (
						<div 
							key={modalidade.id}
							className="card"
							style={{
								padding: "20px",
								cursor: "pointer",
								transition: "all 0.2s",
								border: "1px solid var(--border)"
							}}
							onMouseOver={(e) => {
								e.currentTarget.style.transform = "translateY(-4px)";
								e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.1)";
							}}
							onMouseOut={(e) => {
								e.currentTarget.style.transform = "translateY(0)";
								e.currentTarget.style.boxShadow = "none";
							}}
						>
							{/* Header do Card */}
							<div style={{ marginBottom: "16px" }}>
								<div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
									<h3 style={{ fontSize: "1.1rem", fontWeight: "600", flex: 1 }}>
										{modalidade.nome}
									</h3>
									{getStatusBadge(modalidade.status)}
								</div>
								<div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
									ID: {modalidade.id}
								</div>
							</div>

							{/* Informações */}
							<div style={{ 
								display: "flex", 
								gap: "12px", 
								marginBottom: "16px",
								fontSize: "0.875rem",
								color: "var(--muted)"
							}}>
								<span>📁 {modalidade.tipo}</span>
								<span>•</span>
								<span>👥 {modalidade.categoria}</span>
							</div>

							{/* Ações */}
							<div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
								<button
									onClick={(e) => {
										e.stopPropagation();
										navigate(`/modalidade/${modalidade.id}`);
									}}
									className="btn btn--primary"
									style={{ flex: 1, fontSize: "0.875rem", padding: "8px" }}
								>
									📊 Ver Detalhes
								</button>
							</div>

							{/* Alterar Status */}
							<div>
								<label style={{ display: "block", marginBottom: "6px", fontSize: "0.75rem", fontWeight: "500" }}>
									Alterar Status:
								</label>
								<select 
									value={modalidade.status}
									onChange={(e) => {
										e.stopPropagation();
										handleStatusChange(modalidade.id, e.target.value);
									}}
									style={{
										width: "100%",
										padding: "6px 10px",
										borderRadius: "6px",
										border: "1px solid var(--border)",
										backgroundColor: "var(--bg)",
										fontSize: "0.875rem",
										cursor: "pointer"
									}}
									onClick={(e) => e.stopPropagation()}
								>
									<option value="planejada">📅 Planejada</option>
									<option value="ativa">🔄 Ativa</option>
									<option value="concluida">✅ Concluída</option>
								</select>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}

