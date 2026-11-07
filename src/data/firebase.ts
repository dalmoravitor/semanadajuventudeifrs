/**
 * Inicialização do Firebase. Só a pasta src/data importa este arquivo.
 * A autenticação fica em autenticacao.ts para só entrar no bundle da área admin.
 */
import { initializeApp } from "firebase/app";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";

const env = import.meta.env;

export const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
});

export const db = getFirestore(app);

export const usandoEmulador = env.VITE_USAR_EMULADOR === "true";

if (usandoEmulador) {
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
}
