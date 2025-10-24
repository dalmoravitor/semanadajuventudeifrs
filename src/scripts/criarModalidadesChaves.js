/**
 * Script para criar documentos das modalidades com sistema de chaves no Firestore
 * Execute este script uma vez para inicializar as modalidades
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

// Configuração do Firebase (mesma do seu projeto)
const firebaseConfig = {
  apiKey: "AIzaSyC_YOUR_API_KEY",
  authDomain: "semana-da-juventude-2025.firebaseapp.com",
  projectId: "semana-da-juventude-2025",
  storageBucket: "semana-da-juventude-2025.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Lista de modalidades para criar
const modalidades = [
  {
    id: 'handebol_masc',
    nome: 'Handebol',
    categoria: 'masculino',
    sistema: 'chaves+eliminacao',
    numChaves: 4
  },
  {
    id: 'handebol_fem',
    nome: 'Handebol',
    categoria: 'feminino',
    sistema: 'chaves+eliminacao',
    numChaves: 4
  },
  {
    id: 'voleibol_masc',
    nome: 'Voleibol',
    categoria: 'masculino',
    sistema: 'chaves+eliminacao',
    numChaves: 4
  },
  {
    id: 'voleibol_fem',
    nome: 'Voleibol',
    categoria: 'feminino',
    sistema: 'chaves+eliminacao',
    numChaves: 4
  },
  {
    id: 'volei_de_praia_misto',
    nome: 'Vôlei de Praia',
    categoria: 'misto',
    sistema: 'chaves+eliminacao',
    numChaves: 4
  },
  {
    id: 'basquetebol_masc',
    nome: 'Basquetebol',
    categoria: 'masculino',
    sistema: 'chaves+eliminacao',
    numChaves: 4
  },
  {
    id: 'basquetebol_fem',
    nome: 'Basquetebol',
    categoria: 'feminino',
    sistema: 'chaves+eliminacao',
    numChaves: 4
  },
  {
    id: 'futsal_masc',
    nome: 'Futsal',
    categoria: 'masculino',
    sistema: 'chaves+eliminacao',
    numChaves: 4
  },
  {
    id: 'futsal_fem',
    nome: 'Futsal',
    categoria: 'feminino',
    sistema: 'chaves+eliminacao',
    numChaves: 4
  }
];

// Função para gerar chaves vazias
function gerarChavesVazias(numChaves) {
  const chaves = [];
  const letras = ['A', 'B', 'C', 'D', 'E'];
  
  for (let i = 0; i < numChaves; i++) {
    chaves.push({
      nome: `Chave ${letras[i]}`,
      equipes: ['', '', ''],
      equipesIds: ['', '', '']
    });
  }
  
  return chaves;
}

// Função para criar documento de chaves para uma modalidade
async function criarDocumentoChaves(modalidadeId, numChaves = 4) {
  try {
    const docRef = doc(db, 'chaves', modalidadeId);
    
    // Verificar se já existe
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      console.log(`✅ Documento já existe para ${modalidadeId}`);
      return;
    }
    
    // Criar documento
    const dados = {
      chaves: gerarChavesVazias(numChaves),
      resultadosJogos: [],
      confrontosQuartas: [],
      confrontosSemis: [],
      confrontosFinal: null,
      resultadosEliminatorias: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await setDoc(docRef, dados);
    console.log(`✅ Documento criado para ${modalidadeId}`);
  } catch (error) {
    console.error(`❌ Erro ao criar documento para ${modalidadeId}:`, error);
  }
}

// Função principal
async function criarTodasModalidades() {
  console.log('🚀 Iniciando criação de documentos de modalidades...\n');
  
  for (const modalidade of modalidades) {
    console.log(`📝 Criando ${modalidade.nome} (${modalidade.categoria})...`);
    await criarDocumentoChaves(modalidade.id, modalidade.numChaves);
  }
  
  console.log('\n✅ Processo concluído!');
  process.exit(0);
}

// Executar
criarTodasModalidades();
