import React, { createContext, useState, useEffect, useContext } from "react";
import { onAuthChange, login as loginAPI, logout as logoutAPI } from "../api/auth";

// Criar o contexto
const AuthContext = createContext();

/**
 * Provider do contexto de autenticação
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Observar mudanças no estado de autenticação
  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setUser(user);
      setLoading(false);
    });

    // Cleanup: cancelar observação quando o componente desmontar
    return unsubscribe;
  }, []);

  /**
   * Faz login
   * @param {string} email 
   * @param {string} password 
   * @returns {Promise<Object>}
   */
  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);
      
      const result = await loginAPI(email, password);
      
      if (result.success) {
        setUser(result.user);
        return { success: true };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMessage = "Erro inesperado ao fazer login.";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Faz logout
   * @returns {Promise<Object>}
   */
  const logout = async () => {
    try {
      setError(null);
      const result = await logoutAPI();
      
      if (result.success) {
        setUser(null);
        return { success: true };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMessage = "Erro ao fazer logout.";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Limpa erros
   */
  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    clearError,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook para usar o contexto de autenticação
 * @returns {Object} Contexto de autenticação
 */
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  
  return context;
}

export default AuthContext;
