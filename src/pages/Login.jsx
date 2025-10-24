import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./login.css";
import Header from "../components/Header";
import Loader from "../components/Loader";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [localError, setLocalError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const { login, error: authError } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError(null);
        
        // Validações básicas
        if (!email || !password) {
            setLocalError("Por favor, preencha todos os campos.");
            return;
        }

        if (!email.includes("@")) {
            setLocalError("Por favor, insira um email válido.");
            return;
        }

        setIsSubmitting(true);

        try {
            const result = await login(email, password);
            
            if (result.success) {
                // Redirecionar para o dashboard admin
                navigate("/admin");
            } else {
                setLocalError(result.error || "Erro ao fazer login.");
            }
        } catch (err) {
            console.error("Erro ao fazer login:", err);
            setLocalError("Erro inesperado. Tente novamente.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const displayError = localError || authError;

    return (
        <div className="login">
            <Header />

            <section className="login-hero" aria-labelledby="login-title">
                <h1 id="login-title" className="login-title">
                    Entre com sua conta de administrador
                </h1>
            </section>

            <div className="login-card card" role="region" aria-label="Formulário de login">
                {displayError && (
                    <div 
                        style={{
                            padding: "12px 16px",
                            marginBottom: "20px",
                            backgroundColor: "rgba(239, 68, 68, 0.1)",
                            border: "1px solid rgba(239, 68, 68, 0.3)",
                            borderRadius: "8px",
                            color: "#ef4444",
                            fontSize: "0.875rem",
                            textAlign: "center"
                        }}
                        role="alert"
                    >
                        {displayError}
                    </div>
                )}

                <form className="login-form" onSubmit={handleSubmit}>
                    <label className="sr-only" htmlFor="email">Email</label>
                    <input 
                        id="email" 
                        className="inputLogin" 
                        type="email" 
                        name="email" 
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isSubmitting}
                        required 
                        autoComplete="email"
                    />

                    <label className="sr-only" htmlFor="password">Senha</label>
                    <input 
                        id="password" 
                        className="inputLogin" 
                        type="password" 
                        name="password" 
                        placeholder="Senha"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isSubmitting}
                        required 
                        autoComplete="current-password"
                    />

                    <button 
                        className="btn btnform btn--primary" 
                        type="submit"
                        disabled={isSubmitting}
                        style={{
                            opacity: isSubmitting ? 0.6 : 1,
                            cursor: isSubmitting ? "not-allowed" : "pointer"
                        }}
                    >
                        {isSubmitting ? (
                            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                                <Loader /> Entrando...
                            </span>
                        ) : (
                            "Entrar"
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}

