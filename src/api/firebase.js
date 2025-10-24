import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCwt_sT4hz2Y2FwDz-o0fsyil2eZc_ZErc",
  authDomain: "semanadajuventudeifrs.firebaseapp.com",
  projectId: "semanadajuventudeifrs",
  storageBucket: "semanadajuventudeifrs.firebasestorage.app",
  messagingSenderId: "465977101815",
  appId: "1:465977101815:web:129f3250624460090db2f2"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar serviços
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;