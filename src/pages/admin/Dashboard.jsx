import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { getModalidades } from "../../api/modalidades";
import { getEquipes } from "../../api/equipes";
import Loader from "../../components/Loader";

export default function Dashboard() {
	const { user, logout } = useAuth();
	const navigate = useNavigate();
	const [stats, setStats] = useState({
		totalModalidades: 0,
		modalidadesAtivas: 0,
		modalidadesConcluidas: 0,
		totalEquipes: 0,
		equipesMasculino: 0,
		equipesFeminino: 0,
		loading: true
	});

	useEffect(() => {
		const fetchStats = async () => {
			try {
				// Buscar modalidades
				const modalidadesResult = await getModalidades();
				const modalidades = modalidadesResult.success ? modalidadesResult.data : [];
				
				// Buscar equipes
				const equipesResult = await getEquipes();
				const equipes = equipesResult.success ? equipesResult.data : [];
				
				// Calcular estatísticas
				setStats({
					totalModalidades: modalidades.length,
					modalidadesAtivas: modalidades.filter(m => m.status === "ativa").length,
					modalidadesConcluidas: modalidades.filter(m => m.status === "concluida").length,
					totalEquipes: equipes.length,
					equipesMasculino: equipes.filter(e => e.categoria === "masculino" || e.categoria === "misto").length,
					equipesFeminino: equipes.filter(e => e.categoria === "feminino").length,
					loading: false
				});
			} catch (error) {
				console.error("Erro ao carregar estatísticas:", error);
				setStats(prev => ({ ...prev, loading: false }));
			}
		};

		fetchStats();
	}, []);

	const handleLogout = async () => {
		const result = await logout();
		if (result.success) {
			navigate("/login");
		}
	};

	if (stats.loading) {
		return (
			<div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
				<Loader />
			</div>
		);
	}

	return (
		<div style={{ padding: "40px 20px", maxWidth: "1200px", margin: "0 auto" }}>
			<div style={{ 
				display: "flex", 
				justifyContent: "space-between", 
				alignItems: "center",
				marginBottom: "40px",
				flexWrap: "wrap",
				gap: "16px"
			}}>
				<div>
					<h1 style={{ 
						fontSize: "2rem", 
						marginBottom: "8px",
						background: "linear-gradient(135deg, var(--primary), #2dd4bf)",
						WebkitBackgroundClip: "text",
						WebkitTextFillColor: "transparent"
					}}>
						Admin • Dashboard
					</h1>
					<p style={{ color: "var(--muted)", fontSize: "0.875rem" }}>
						Bem-vindo, <strong>{user?.email}</strong>
					</p>
				</div>
				
				<button
					onClick={handleLogout}
					style={{
						padding: "10px 20px",
						backgroundColor: "rgba(239, 68, 68, 0.1)",
						border: "1px solid rgba(239, 68, 68, 0.3)",
						borderRadius: "8px",
						color: "#ef4444",
						fontWeight: "600",
						cursor: "pointer",
						fontSize: "0.875rem",
						transition: "all 0.2s"
					}}
					onMouseOver={(e) => {
						e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.2)";
					}}
					onMouseOut={(e) => {
						e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.1)";
					}}
				>
					🚪 Sair
				</button>
			</div>

			{/* Estatísticas em Cards */}
			<div style={{ 
				display: "grid", 
				gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
				gap: "20px",
				marginBottom: "40px"
			}}>
				{/* Total de Modalidades */}
				<div className="card" style={{
					padding: "24px",
					textAlign: "center",
					background: "linear-gradient(135deg, rgba(45, 212, 191, 0.1), rgba(45, 212, 191, 0.05))",
					border: "1px solid rgba(45, 212, 191, 0.2)"
				}}>
					<div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>📋</div>
					<div style={{ fontSize: "2rem", fontWeight: "700", color: "var(--primary)", marginBottom: "4px" }}>
						{stats.totalModalidades}
					</div>
					<div style={{ fontSize: "0.875rem", color: "var(--muted)" }}>
						Total de Modalidades
					</div>
					<div style={{ marginTop: "12px", fontSize: "0.75rem", color: "var(--muted)" }}>
						✅ {stats.modalidadesConcluidas} concluídas • 🔄 {stats.modalidadesAtivas} ativas
					</div>
				</div>

				{/* Total de Equipes */}
				<div className="card" style={{
					padding: "24px",
					textAlign: "center",
					background: "linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05))",
					border: "1px solid rgba(59, 130, 246, 0.2)"
				}}>
					<div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>👥</div>
					<div style={{ fontSize: "2rem", fontWeight: "700", color: "#3b82f6", marginBottom: "4px" }}>
						{stats.totalEquipes}
					</div>
					<div style={{ fontSize: "0.875rem", color: "var(--muted)" }}>
						Total de Equipes
					</div>
					<div style={{ marginTop: "12px", fontSize: "0.75rem", color: "var(--muted)" }}>
						👔 {stats.equipesMasculino} masc/misto • 👗 {stats.equipesFeminino} feminino
					</div>
				</div>

				{/* Taxa de Participação */}
				<div className="card" style={{
					padding: "24px",
					textAlign: "center",
					background: "linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(251, 191, 36, 0.05))",
					border: "1px solid rgba(251, 191, 36, 0.2)"
				}}>
					<div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>📊</div>
					<div style={{ fontSize: "2rem", fontWeight: "700", color: "#fbbf24", marginBottom: "4px" }}>
						{stats.totalModalidades > 0 ? Math.round((stats.modalidadesConcluidas / stats.totalModalidades) * 100) : 0}%
					</div>
					<div style={{ fontSize: "0.875rem", color: "var(--muted)" }}>
						Progresso Geral
					</div>
					<div style={{ marginTop: "12px", fontSize: "0.75rem", color: "var(--muted)" }}>
						{stats.modalidadesConcluidas}/{stats.totalModalidades} concluídas
					</div>
				</div>
			</div>

			{/* Links Rápidos */}
			<h2 style={{ fontSize: "1.25rem", marginBottom: "20px", fontWeight: "600" }}>
				⚡ Acesso Rápido
			</h2>

			<div style={{ 
				display: "grid", 
				gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
				gap: "20px"
			}}>
				{/* Card de Migração */}
				<div className="card" style={{
					padding: "24px",
					background: "linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(251, 191, 36, 0.05))",
					border: "1px solid rgba(251, 191, 36, 0.2)"
				}}>
					<h3 style={{ fontSize: "1rem", marginBottom: "12px", color: "#fbbf24" }}>
						🗄️ Migração
					</h3>
					<p style={{ fontSize: "0.875rem", color: "var(--muted)", marginBottom: "16px" }}>
						Popula o banco com dados iniciais
					</p>
					<button 
						onClick={() => navigate("/admin/migrate")}
						className="btn"
						style={{ 
							width: "100%", 
							fontSize: "0.875rem",
							backgroundColor: "rgba(251, 191, 36, 0.1)",
							border: "1px solid rgba(251, 191, 36, 0.3)",
							color: "#fbbf24"
						}}
					>
						Acessar
					</button>
				</div>
				
				{/* Card de Modalidades */}
				<div className="card" style={{
					padding: "24px",
					background: "linear-gradient(135deg, rgba(45, 212, 191, 0.1), rgba(45, 212, 191, 0.05))",
					border: "1px solid rgba(45, 212, 191, 0.2)"
				}}>
					<h3 style={{ fontSize: "1rem", marginBottom: "12px", color: "var(--primary)" }}>
						📋 Modalidades
					</h3>
					<p style={{ fontSize: "0.875rem", color: "var(--muted)", marginBottom: "16px" }}>
						Gerenciar modalidades e seus resultados
					</p>
					<button 
						onClick={() => navigate("/admin/modalidades")}
						className="btn btn--primary"
						style={{ width: "100%", fontSize: "0.875rem" }}
					>
						Acessar
					</button>
				</div>

				{/* Card de Equipes */}
				<div className="card" style={{
					padding: "24px",
					background: "linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05))",
					border: "1px solid rgba(59, 130, 246, 0.2)"
				}}>
					<h3 style={{ fontSize: "1rem", marginBottom: "12px", color: "#3b82f6" }}>
						👥 Equipes
					</h3>
					<p style={{ fontSize: "0.875rem", color: "var(--muted)", marginBottom: "16px" }}>
						Cadastrar e gerenciar equipes
					</p>
					<button 
						onClick={() => navigate("/admin/equipes")}
						className="btn"
						style={{ 
							width: "100%", 
							fontSize: "0.875rem",
							backgroundColor: "rgba(59, 130, 246, 0.1)",
							border: "1px solid rgba(59, 130, 246, 0.3)",
							color: "#3b82f6"
						}}
					>
						Acessar
					</button>
				</div>

				{/* Card de Configurações */}
				<div className="card" style={{
					padding: "24px",
					background: "linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(168, 85, 247, 0.05))",
					border: "1px solid rgba(168, 85, 247, 0.2)"
				}}>
					<h3 style={{ fontSize: "1rem", marginBottom: "12px", color: "#a855f7" }}>
						⚙️ Configurações
					</h3>
					<p style={{ fontSize: "0.875rem", color: "var(--muted)", marginBottom: "16px" }}>
						Ajustes do sistema
					</p>
					<button 
						onClick={() => navigate("/admin/config")}
						className="btn"
						style={{ 
							width: "100%", 
							fontSize: "0.875rem",
							backgroundColor: "rgba(168, 85, 247, 0.1)",
							border: "1px solid rgba(168, 85, 247, 0.3)",
							color: "#a855f7"
						}}
					>
						Acessar
					</button>
				</div>
			</div>
		</div>
	);
}

