import { FirebaseError } from "firebase/app";
import {
  connectAuthEmulator,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { app, usandoEmulador } from "./firebase";

const auth = getAuth(app);
if (usandoEmulador) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
}

export interface Usuario {
  uid: string;
  email: string | null;
}

function paraUsuario(user: User | null): Usuario | null {
  return user ? { uid: user.uid, email: user.email } : null;
}

export function observarUsuario(aoMudar: (usuario: Usuario | null) => void): () => void {
  return onAuthStateChanged(auth, (user) => aoMudar(paraUsuario(user)));
}

const MENSAGENS: Record<string, string> = {
  "auth/invalid-email": "Esse e-mail não é válido.",
  "auth/invalid-credential": "E-mail ou senha incorretos.",
  "auth/user-disabled": "Essa conta foi desativada.",
  "auth/too-many-requests": "Muitas tentativas. Espere alguns minutos e tente de novo.",
  "auth/network-request-failed": "Sem conexão com a internet.",
};

export async function entrar(email: string, senha: string): Promise<void> {
  try {
    await signInWithEmailAndPassword(auth, email.trim(), senha);
  } catch (erro) {
    if (erro instanceof FirebaseError) {
      throw new Error(MENSAGENS[erro.code] ?? "Não foi possível entrar. Tente de novo.", {
        cause: erro,
      });
    }
    throw erro;
  }
}

export async function sair(): Promise<void> {
  await signOut(auth);
}
