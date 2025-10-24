import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getEquipes, addEquipe, updateEquipe, deleteEquipe } from "../../api/equipes";
import Loader from "../../components/Loader";
import Alert from "../../components/Alert";

export default function AdminEquipes() {
	const navigate = useNavigate();
	const [equipes, setEquipes] = useState([]);
	const [filteredEquipes, setFilteredEquipes] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [success, setSuccess] = useState(null);
	
	// Filtros
	const [filtroCategoria, setFiltroCategoria] = useState("todas");
	const [busca, setBusca] = useState("");
	
	// Modal de criação/edição
	const [showModal, setShowModal] = useState(false);
	const [editingEquipe, setEditingEquipe] = useState(null);
	const [formData, setFormData] = useState({
		id: "",
		nome: "",
		anoSerie: "",
		categoria: "masculino",
		cor: "#2dd4bf",
		totalPontos: 0,
		totalModalidades: 0,
		kitInscricao: false,
		presencas: {
			totalPresencas: 0,
			totalAulas: 0,
			percentual: 0,
			pontos: 0
		},
		ocorrencias: 0
	});

	useEffect(() => {
		fetchEquipes();
	}, []);

	const fetchEquipes = async () => {
		setLoading(true);
		setError(null);
		try {
			const result = await getEquipes();
			if (result.success) {
				setEquipes(result.data);
				setFilteredEquipes(result.data);
			} else {
				setError(result.error || "Erro ao carregar equipes");
			}
		} catch (err) {
			console.error("Erro ao buscar equipes:", err);
			setError("Erro ao conectar com o servidor");
		} finally {
			setLoading(false);
		}
	};

	// Aplicar filtros
	useEffect(() => {
		let filtered = [...equipes];

		// Filtro por categoria
		if (filtroCategoria !== "todas") {
			filtered = filtered.filter(e => e.categoria === filtroCategoria);
		}

		// Busca por texto
		if (busca.trim()) {
			const buscaLower = busca.toLowerCase();
			filtered = filtered.filter(e => 
				e.nome.toLowerCase().includes(buscaLower) ||
				e.id.toLowerCase().includes(buscaLower) ||
				e.anoSerie.toLowerCase().includes(buscaLower)
			);
		}

		setFilteredEquipes(filtered);
	}, [equipes, filtroCategoria, busca]);

	const handleOpenModal = (equipe = null) => {
		if (equipe) {
			// Editando - garantir que presencas seja um objeto
			setEditingEquipe(equipe);
			setFormData({
				...equipe,
				presencas: typeof equipe.presencas === 'object' 
					? equipe.presencas 
					: {
						totalPresencas: equipe.presencas || 0,
						totalAulas: 0,
						percentual: 0,
						pontos: 0
					}
			});
		} else {
			// Criando nova
			setEditingEquipe(null);
			setFormData({
				id: "",
				nome: "",
				anoSerie: "",
				categoria: "masculino",
				cor: "#2dd4bf",
				totalPontos: 0,
				totalModalidades: 0,
				kitInscricao: false,
				presencas: {
					totalPresencas: 0,
					totalAulas: 0,
					percentual: 0,
					pontos: 0
				},
				ocorrencias: 0
			});
		}
		setShowModal(true);
	};

	const handleCloseModal = () => {
		setShowModal(false);
		setEditingEquipe(null);
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		
		// Validações
		if (!formData.nome.trim() || !formData.id.trim() || !formData.anoSerie.trim()) {
			alert("Preencha todos os campos obrigatórios");
			return;
		}

		// Verificar se ID já existe (apenas na criação)
		if (!editingEquipe && equipes.some(eq => eq.id === formData.id)) {
			alert("Já existe uma equipe com este ID");
			return;
		}

		try {
			const result = editingEquipe 
				? await updateEquipe(formData.id, formData)
				: await addEquipe(formData);

			if (result.success) {
				setSuccess(editingEquipe ? "Equipe atualizada!" : "Equipe criada!");
				setTimeout(() => setSuccess(null), 3000);
				handleCloseModal();
				fetchEquipes();
			} else {
				alert("Erro: " + result.error);
			}
		} catch (err) {
			console.error("Erro ao salvar equipe:", err);
			alert("Erro ao salvar equipe");
		}
	};

	const handleDelete = async (equipeId) => {
		if (!window.confirm("Tem certeza que deseja excluir esta equipe?")) return;

		try {
			const result = await deleteEquipe(equipeId);
			if (result.success) {
				setSuccess("Equipe excluída!");
				setTimeout(() => setSuccess(null), 3000);
				fetchEquipes();
			} else {
				alert("Erro ao excluir: " + result.error);
			}
		} catch (err) {
			alert("Erro ao excluir equipe");
		}
	};

	if (loading) {
		return (
			<div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
				<Loader />
			</div>
		);
	}

	return (
		<div style={{ padding: "40px 20px", maxWidth: "1400px", margin: "0 auto" }}>
			{success && (
				<div style={{
					position: "fixed", top: "20px", right: "20px", zIndex: 1000,
					backgroundColor: "#d1fae5", border: "1px solid #6ee7b7",
					borderRadius: "8px", padding: "16px 24px",
					boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
					color: "#065f46", fontWeight: "500"
				}}>
					✅ {success}
				</div>
			)}

			<div style={{ marginBottom: "40px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
				<div>
					<button onClick={() => navigate("/admin")} style={{
						background: "none", border: "none", color: "var(--primary)",
						fontSize: "0.875rem", cursor: "pointer", marginBottom: "12px"
					}}>
						← Voltar ao Dashboard
					</button>
					<h1 style={{ fontSize: "2rem", marginBottom: "8px" }}>👥 Gerenciar Equipes</h1>
					<p style={{ color: "var(--muted)", fontSize: "0.875rem" }}>
						Total: {filteredEquipes.length} equipe(s)
					</p>
				</div>
				<button onClick={() => handleOpenModal()} className="btn btn--primary" style={{ padding: "12px 24px" }}>
					➕ Nova Equipe
				</button>
			</div>

			{/* Filtros - será continuado no próximo replace */}
			<div style={{ 
				backgroundColor: "var(--card-bg)",
				padding: "24px",
				borderRadius: "12px",
				marginBottom: "32px",
				border: "1px solid var(--border)"
			}}>
				<div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: "16px" }}>
					<div>
						<label style={{ display: "block", marginBottom: "8px", fontSize: "0.875rem", fontWeight: "500" }}>
							Categoria
						</label>
						<select 
							value={filtroCategoria}
							onChange={(e) => setFiltroCategoria(e.target.value)}
							style={{
								width: "100%", padding: "10px", borderRadius: "8px",
								border: "1px solid var(--border)",
								backgroundColor: "var(--bg)", fontSize: "0.875rem"
							}}
						>
							<option value="todas">Todas</option>
							<option value="masculino">Masculino</option>
							<option value="feminino">Feminino</option>
							<option value="misto">Misto</option>
						</select>
					</div>
					<div>
						<label style={{ display: "block", marginBottom: "8px", fontSize: "0.875rem", fontWeight: "500" }}>
							🔍 Buscar
						</label>
						<input 
							type="text" placeholder="Digite o nome, ID ou ano/série..."
							value={busca} onChange={(e) => setBusca(e.target.value)}
							style={{
								width: "100%", padding: "10px 16px", borderRadius: "8px",
								border: "1px solid var(--border)",
								backgroundColor: "var(--bg)", fontSize: "0.875rem"
							}}
						/>
					</div>
				</div>
			</div>

			{/* Lista - será continuado */}
			{filteredEquipes.length === 0 ? (
				<div style={{ textAlign: "center", padding: "60px 20px" }}>
					<div style={{ fontSize: "3rem", marginBottom: "16px" }}>🔍</div>
					<h3 style={{ fontSize: "1.25rem", marginBottom: "8px" }}>Nenhuma equipe encontrada</h3>
					<button onClick={() => handleOpenModal()} className="btn btn--primary" style={{ marginTop: "16px" }}>
						➕ Criar Primeira Equipe
					</button>
				</div>
			) : (
				<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
					{filteredEquipes.map(equipe => (
						<EquipeCard key={equipe.id} equipe={equipe} onEdit={handleOpenModal} onDelete={handleDelete} />
					))}
				</div>
			)}

			{/* Modal - será continuado */}
			{showModal && (
				<EquipeModal 
					equipe={editingEquipe}
					formData={formData}
					setFormData={setFormData}
					onSubmit={handleSubmit}
					onClose={handleCloseModal}
				/>
			)}
		</div>
	);
}

// Componente auxiliar: Card de Equipe
function EquipeCard({ equipe, onEdit, onDelete }) {
	return (
		<div className="card" style={{ padding: "20px", border: "1px solid var(--border)" }}>
			<div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px", paddingBottom: "16px", borderBottom: "1px solid var(--border)" }}>
				<div style={{ width: "16px", height: "16px", borderRadius: "50%", backgroundColor: equipe.cor }} />
				<div style={{ flex: 1, minWidth: 0 }}>
					<h3 style={{ fontSize: "1.1rem", fontWeight: "600", marginBottom: "4px" }}>{equipe.nome}</h3>
					<div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>{equipe.anoSerie} • {equipe.categoria}</div>
				</div>
			</div>
			<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
				<div style={{ textAlign: "center", padding: "12px", backgroundColor: "var(--bg)", borderRadius: "8px" }}>
					<div style={{ fontSize: "1.5rem", fontWeight: "700", color: "var(--primary)" }}>{equipe.totalPontos}</div>
					<div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>Pontos</div>
				</div>
				<div style={{ textAlign: "center", padding: "12px", backgroundColor: "var(--bg)", borderRadius: "8px" }}>
					<div style={{ fontSize: "1.5rem", fontWeight: "700", color: "#3b82f6" }}>{equipe.totalModalidades}</div>
					<div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>Modalidades</div>
				</div>
			</div>
			<div style={{ fontSize: "0.75rem", color: "var(--muted)", marginBottom: "16px", display: "flex", gap: "12px" }}>
				<span>{equipe.kitInscricao ? "✅" : "❌"} Kit</span>
				<span>📅 {typeof equipe.presencas === 'object' ? equipe.presencas?.totalPresencas || 0 : equipe.presencas || 0}</span>
				<span>⚠️ {equipe.ocorrencias || 0}</span>
			</div>
			<div style={{ display: "flex", gap: "8px" }}>
				<button onClick={() => onEdit(equipe)} className="btn" style={{ 
					flex: 1, fontSize: "0.875rem", padding: "8px",
					backgroundColor: "rgba(45, 212, 191, 0.1)",
					border: "1px solid rgba(45, 212, 191, 0.3)", color: "var(--primary)"
				}}>✏️ Editar</button>
				<button onClick={() => onDelete(equipe.id)} className="btn" style={{ 
					fontSize: "0.875rem", padding: "8px 12px",
					backgroundColor: "rgba(239, 68, 68, 0.1)",
					border: "1px solid rgba(239, 68, 68, 0.3)", color: "#ef4444"
				}}>🗑️</button>
			</div>
		</div>
	);
}

// Componente auxiliar: Modal de Equipe
function EquipeModal({ equipe, formData, setFormData, onSubmit, onClose }) {
	const inputStyle = {
		width: "100%",
		padding: "12px 16px",
		borderRadius: "8px",
		border: "1px solid rgba(255, 255, 255, 0.1)",
		backgroundColor: "rgba(255, 255, 255, 0.05)",
		color: "#fff",
		fontSize: "0.95rem",
		transition: "all 0.2s ease",
		outline: "none"
	};

	const inputFocusStyle = {
		...inputStyle,
		borderColor: "var(--primary)",
		backgroundColor: "rgba(45, 212, 191, 0.1)"
	};

	return (
		<div 
			onClick={onClose}
			style={{
				position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
				backgroundColor: "rgba(0, 0, 0, 0.75)",
				backdropFilter: "blur(4px)",
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				zIndex: 1000,
				padding: "20px",
				animation: "fadeIn 0.2s ease"
			}}
		>
			<div 
				onClick={(e) => e.stopPropagation()}
				style={{
					backgroundColor: "#1a1a2e",
					borderRadius: "16px",
					padding: "0",
					maxWidth: "700px",
					width: "100%",
					maxHeight: "90vh",
					overflowY: "auto",
					boxShadow: "0 24px 80px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)",
					animation: "slideUp 0.3s ease"
				}}
			>
				{/* Header */}
				<div style={{
					padding: "24px 32px",
					borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					backgroundColor: "rgba(45, 212, 191, 0.05)"
				}}>
					<h2 style={{ fontSize: "1.5rem", margin: 0, fontWeight: "600" }}>
						{equipe ? "✏️ Editar Equipe" : "➕ Nova Equipe"}
					</h2>
					<button
						type="button"
						onClick={onClose}
						style={{
							background: "none",
							border: "none",
							fontSize: "1.5rem",
							cursor: "pointer",
							color: "var(--muted)",
							padding: "0",
							width: "32px",
							height: "32px",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							borderRadius: "8px",
							transition: "all 0.2s"
						}}
						onMouseEnter={(e) => {
							e.target.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
							e.target.style.color = "#fff";
						}}
						onMouseLeave={(e) => {
							e.target.style.backgroundColor = "transparent";
							e.target.style.color = "var(--muted)";
						}}
					>
						×
					</button>
				</div>

				{/* Body */}
				<form onSubmit={onSubmit} style={{ padding: "32px" }}>
					{/* ID */}
					<FormField label="ID da Equipe" disabled={!!equipe} required>
						<input 
							type="text" 
							value={formData.id} 
							onChange={(e) => setFormData({...formData, id: e.target.value})}
							disabled={!!equipe} 
							placeholder="Ex: masc_1, fem_5" 
							required
							style={{
								...inputStyle,
								backgroundColor: equipe ? "rgba(255, 255, 255, 0.02)" : "rgba(255, 255, 255, 0.05)",
								cursor: equipe ? "not-allowed" : "text",
								opacity: equipe ? 0.5 : 1
							}}
						/>
					</FormField>

					{/* Nome */}
					<FormField label="Nome da Equipe" required>
						<input 
							type="text" 
							value={formData.nome} 
							onChange={(e) => setFormData({...formData, nome: e.target.value})}
							placeholder="Ex: 1º Ano A" 
							required 
							style={inputStyle}
							onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
							onBlur={(e) => Object.assign(e.target.style, inputStyle)}
						/>
					</FormField>

					{/* Ano/Série */}
					<FormField label="Ano ou Série" required>
						<input 
							type="text" 
							value={formData.anoSerie} 
							onChange={(e) => setFormData({...formData, anoSerie: e.target.value})}
							placeholder="Ex: 1º Ano, 2º Ano, Informática I" 
							required 
							style={inputStyle}
							onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
							onBlur={(e) => Object.assign(e.target.style, inputStyle)}
						/>
					</FormField>

					{/* Grid: Categoria + Cor */}
					<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
						<FormField label="Categoria" required>
							<select 
								value={formData.categoria} 
								onChange={(e) => setFormData({...formData, categoria: e.target.value})}
								required 
								style={inputStyle}
							>
								<option value="masculino">🔵 Masculino</option>
								<option value="feminino">🟣 Feminino</option>
								<option value="misto">🟢 Misto</option>
							</select>
						</FormField>

						<FormField label="Cor da Equipe">
							<div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
								<input 
									type="color" 
									value={formData.cor} 
									onChange={(e) => setFormData({...formData, cor: e.target.value})}
									style={{ 
										width: "60px", 
										height: "44px", 
										borderRadius: "8px", 
										border: "1px solid rgba(255, 255, 255, 0.1)", 
										cursor: "pointer",
										backgroundColor: "transparent"
									}}
								/>
								<div style={{
									flex: 1,
									padding: "12px 16px",
									borderRadius: "8px",
									border: "1px solid rgba(255, 255, 255, 0.1)",
									backgroundColor: "rgba(255, 255, 255, 0.05)",
									fontSize: "0.875rem",
									color: "var(--muted)",
									fontFamily: "monospace"
								}}>
									{formData.cor}
								</div>
							</div>
						</FormField>
					</div>

					{/* Checkbox: Kit */}
					<div style={{ 
						marginBottom: "24px",
						padding: "16px",
						backgroundColor: "rgba(45, 212, 191, 0.05)",
						borderRadius: "8px",
						border: "1px solid rgba(45, 212, 191, 0.2)"
					}}>
						<label style={{ 
							display: "flex", 
							alignItems: "center", 
							gap: "12px", 
							cursor: "pointer",
							fontSize: "0.95rem"
						}}>
							<input 
								type="checkbox" 
								checked={formData.kitInscricao}
								onChange={(e) => setFormData({...formData, kitInscricao: e.target.checked})}
								style={{ 
									width: "20px", 
									height: "20px",
									cursor: "pointer",
									accentColor: "var(--primary)"
								}}
							/>
							<span style={{ fontWeight: "500" }}>📦 Kit de inscrição entregue</span>
						</label>
					</div>

					{/* Grid: Presenças + Ocorrências */}
					<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px" }}>
						<FormField label="Total de Presenças">
							<input 
								type="number" 
								value={typeof formData.presencas === 'object' ? formData.presencas.totalPresencas : formData.presencas || 0} 
								min="0"
								onChange={(e) => setFormData({
									...formData, 
									presencas: {
										...(typeof formData.presencas === 'object' ? formData.presencas : {}),
										totalPresencas: parseInt(e.target.value) || 0
									}
								})}
								style={inputStyle}
								onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
								onBlur={(e) => Object.assign(e.target.style, inputStyle)}
							/>
						</FormField>

						<FormField label="Ocorrências Registradas">
							<input 
								type="number" 
								value={formData.ocorrencias} 
								min="0"
								onChange={(e) => setFormData({...formData, ocorrencias: parseInt(e.target.value) || 0})}
								style={inputStyle}
								onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
								onBlur={(e) => Object.assign(e.target.style, inputStyle)}
							/>
						</FormField>
					</div>

					{/* Footer Buttons */}
					<div style={{ 
						display: "flex", 
						gap: "12px", 
						justifyContent: "flex-end",
						paddingTop: "24px",
						borderTop: "1px solid rgba(255, 255, 255, 0.1)"
					}}>
						<button 
							type="button" 
							onClick={onClose} 
							style={{
								padding: "12px 24px",
								borderRadius: "8px",
								border: "1px solid rgba(255, 255, 255, 0.2)",
								backgroundColor: "transparent",
								color: "#fff",
								fontSize: "0.95rem",
								cursor: "pointer",
								fontWeight: "500",
								transition: "all 0.2s"
							}}
							onMouseEnter={(e) => {
								e.target.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
								e.target.style.borderColor = "rgba(255, 255, 255, 0.3)";
							}}
							onMouseLeave={(e) => {
								e.target.style.backgroundColor = "transparent";
								e.target.style.borderColor = "rgba(255, 255, 255, 0.2)";
							}}
						>
							Cancelar
						</button>
						<button 
							type="submit" 
							style={{
								padding: "12px 24px",
								borderRadius: "8px",
								border: "none",
								backgroundColor: "var(--primary)",
								color: "#0f172a",
								fontSize: "0.95rem",
								cursor: "pointer",
								fontWeight: "600",
								transition: "all 0.2s",
								boxShadow: "0 4px 12px rgba(45, 212, 191, 0.3)"
							}}
							onMouseEnter={(e) => {
								e.target.style.transform = "translateY(-1px)";
								e.target.style.boxShadow = "0 6px 16px rgba(45, 212, 191, 0.4)";
							}}
							onMouseLeave={(e) => {
								e.target.style.transform = "translateY(0)";
								e.target.style.boxShadow = "0 4px 12px rgba(45, 212, 191, 0.3)";
							}}
						>
							{equipe ? "💾 Salvar Alterações" : "➕ Criar Equipe"}
						</button>
					</div>
				</form>
			</div>

			<style>{`
				@keyframes fadeIn {
					from { opacity: 0; }
					to { opacity: 1; }
				}
				@keyframes slideUp {
					from { 
						opacity: 0;
						transform: translateY(20px);
					}
					to { 
						opacity: 1;
						transform: translateY(0);
					}
				}
			`}</style>
		</div>
	);
}

function FormField({ label, children, disabled, required }) {
	return (
		<div style={{ marginBottom: "20px" }}>
			<label style={{ 
				display: "block", 
				marginBottom: "10px", 
				fontSize: "0.875rem", 
				fontWeight: "500",
				color: disabled ? "var(--muted)" : "#fff"
			}}>
				{label} 
				{required && <span style={{ color: "#ef4444", marginLeft: "4px" }}>*</span>}
				{disabled && <span style={{ 
					color: "var(--muted)", 
					fontSize: "0.75rem",
					marginLeft: "8px",
					fontWeight: "400"
				}}>(não editável)</span>}
			</label>
			{children}
		</div>
	);
}

