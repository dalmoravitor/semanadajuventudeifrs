import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { auth } from "./firebase";

/**
 * Faz login com email e senha
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<Object>} Usuário autenticado
 */
export const login = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return {
      success: true,
      user: userCredential.user,
    };
  } catch (error) {
    console.error("Erro ao fazer login:", error);
    
    // Mensagens de erro amigáveis
    let message = "Erro ao fazer login. Tente novamente.";
    
    switch (error.code) {
      case "auth/invalid-email":
        message = "Email inválido.";
        break;
      case "auth/user-disabled":
        message = "Usuário desabilitado.";
        break;
      case "auth/user-not-found":
        message = "Usuário não encontrado.";
        break;
      case "auth/wrong-password":
        message = "Senha incorreta.";
        break;
      case "auth/invalid-credential":
        message = "Email ou senha incorretos.";
        break;
      default:
        message = error.message;
    }
    
    return {
      success: false,
      error: message,
    };
  }
};

/**
 * Faz logout do usuário atual
 * @returns {Promise<Object>}
 */
export const logout = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error("Erro ao fazer logout:", error);
    return {
      success: false,
      error: "Erro ao fazer logout.",
    };
  }
};

/**
 * Observa mudanças no estado de autenticação
 * @param {Function} callback - Função chamada quando o estado muda
 * @returns {Function} - Função para cancelar a observação
 */
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

/**
 * Retorna o usuário atual
 * @returns {Object|null}
 */
export const getCurrentUser = () => {
  return auth.currentUser;
};
