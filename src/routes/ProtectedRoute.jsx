import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Loader from "../components/Loader";

/**
 * Componente de rota protegida
 * Redireciona para /login se o usuário não estiver autenticado
 */
export default function ProtectedRoute({ redirectTo = "/login" }) {
	const { user, loading } = useAuth();

	// Mostrar loader enquanto verifica autenticação
	if (loading) {
		return (
			<div 
				style={{
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					minHeight: "100vh",
					gap: "16px"
				}}
			>
				<Loader />
				<p style={{ color: "var(--text)", fontSize: "0.875rem" }}>
					Verificando autenticação...
				</p>
			</div>
		);
	}

	// Se não estiver autenticado, redirecionar para login
	if (!user) {
		return <Navigate to={redirectTo} replace />;
	}

	// Se autenticado, renderizar as rotas filhas
	return <Outlet />;
}

