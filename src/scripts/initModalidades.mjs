/**
 * Script para inicializar modalidades no Firestore
 * Execute: node src/scripts/initModalidades.mjs
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

// Configuração do Firebase (mesma do projeto)
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
const db = getFirestore(app);

// Lista de modalidades
const modalidades = [
  { id: 'handebol_masc', nome: 'Handebol', categoria: 'masculino', numChaves: 4 },
  { id: 'handebol_fem', nome: 'Handebol', categoria: 'feminino', numChaves: 4 },
  { id: 'voleibol_masc', nome: 'Voleibol', categoria: 'masculino', numChaves: 4 },
  { id: 'voleibol_fem', nome: 'Voleibol', categoria: 'feminino', numChaves: 4 },
  { id: 'volei_de_praia_misto', nome: 'Vôlei de Praia', categoria: 'misto', numChaves: 4 },
  { id: 'basquetebol_masc', nome: 'Basquetebol', categoria: 'masculino', numChaves: 4 },
  { id: 'basquetebol_fem', nome: 'Basquetebol', categoria: 'feminino', numChaves: 4 },
  { id: 'futsal_masc', nome: 'Futsal', categoria: 'masculino', numChaves: 4 },
  { id: 'futsal_fem', nome: 'Futsal', categoria: 'feminino', numChaves: 4 }
];

// Gerar chaves vazias
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

// Criar documento
async function criarDocumento(modalidadeId, nome, categoria, numChaves) {
  try {
    const docRef = doc(db, 'chaves', modalidadeId);
    
    // Verificar se já existe
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      console.log(`✅ ${nome} (${categoria}) - Documento já existe`);
      return { success: true, exists: true };
    }
    
    // Criar novo documento
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
    console.log(`✅ ${nome} (${categoria}) - Documento criado com sucesso!`);
    return { success: true, exists: false };
    
  } catch (error) {
    console.error(`❌ ${nome} (${categoria}) - Erro: ${error.message}`);
    return { success: false, error };
  }
}

// Executar
async function main() {
  console.log('\n🚀 Iniciando criação de documentos de modalidades...\n');
  
  let criados = 0;
  let existentes = 0;
  let erros = 0;
  
  for (const mod of modalidades) {
    const resultado = await criarDocumento(mod.id, mod.nome, mod.categoria, mod.numChaves);
    
    if (resultado.success) {
      if (resultado.exists) {
        existentes++;
      } else {
        criados++;
      }
    } else {
      erros++;
    }
    
    // Pequeno delay
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  console.log('\n📊 Resumo:');
  console.log(`   ✅ Criados: ${criados}`);
  console.log(`   ℹ️  Já existiam: ${existentes}`);
  console.log(`   ❌ Erros: ${erros}`);
  console.log('\n✅ Processo concluído!\n');
  
  process.exit(0);
}

main().catch(console.error);
