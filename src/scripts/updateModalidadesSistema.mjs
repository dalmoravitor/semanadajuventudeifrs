/**
 * Script para atualizar o campo 'sistema' nas modalidades
 * Execute: node src/scripts/updateModalidadesSistema.mjs
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

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
const db = getFirestore(app);

// Lista de modalidades com informações completas
const modalidades = [
  { 
    id: 'handebol_masc', 
    nome: 'Handebol Masculino',
    titulo: 'Handebol Masculino',
    categoria: 'masculino',
    sistema: 'chaves',
    descricao: 'Competição de Handebol Masculino no sistema de chaves e eliminatórias.'
  },
  { 
    id: 'handebol_fem', 
    nome: 'Handebol Feminino',
    titulo: 'Handebol Feminino',
    categoria: 'feminino',
    sistema: 'chaves',
    descricao: 'Competição de Handebol Feminino no sistema de chaves e eliminatórias.'
  },
  { 
    id: 'voleibol_masc', 
    nome: 'Voleibol Masculino',
    titulo: 'Voleibol Masculino',
    categoria: 'masculino',
    sistema: 'chaves',
    descricao: 'Competição de Voleibol Masculino no sistema de chaves e eliminatórias.'
  },
  { 
    id: 'voleibol_fem', 
    nome: 'Voleibol Feminino',
    titulo: 'Voleibol Feminino',
    categoria: 'feminino',
    sistema: 'chaves',
    descricao: 'Competição de Voleibol Feminino no sistema de chaves e eliminatórias.'
  },
  { 
    id: 'volei_de_praia_misto', 
    nome: 'Vôlei de Praia',
    titulo: 'Vôlei de Praia Misto',
    categoria: 'misto',
    sistema: 'chaves',
    descricao: 'Competição de Vôlei de Praia Misto no sistema de chaves e eliminatórias.'
  },
  { 
    id: 'basquetebol_masc', 
    nome: 'Basquetebol Masculino',
    titulo: 'Basquetebol Masculino',
    categoria: 'masculino',
    sistema: 'chaves',
    descricao: 'Competição de Basquetebol Masculino no sistema de chaves e eliminatórias.'
  },
  { 
    id: 'basquetebol_fem', 
    nome: 'Basquetebol Feminino',
    titulo: 'Basquetebol Feminino',
    categoria: 'feminino',
    sistema: 'chaves',
    descricao: 'Competição de Basquetebol Feminino no sistema de chaves e eliminatórias.'
  },
  { 
    id: 'futsal_masc', 
    nome: 'Futsal Masculino',
    titulo: 'Futsal Masculino',
    categoria: 'masculino',
    sistema: 'chaves',
    descricao: 'Competição de Futsal Masculino no sistema de chaves e eliminatórias.'
  },
  { 
    id: 'futsal_fem', 
    nome: 'Futsal Feminino',
    titulo: 'Futsal Feminino',
    categoria: 'feminino',
    sistema: 'chaves',
    descricao: 'Competição de Futsal Feminino no sistema de chaves e eliminatórias.'
  }
];

// Função para criar/atualizar modalidade
async function atualizarModalidade(modalidade) {
  try {
    const docRef = doc(db, 'modalidades', modalidade.id);
    
    // Verificar se já existe
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      // Atualizar apenas o campo sistema
      await updateDoc(docRef, {
        sistema: 'chaves',
        updatedAt: new Date().toISOString()
      });
      console.log(`✅ ${modalidade.nome} - Campo 'sistema' atualizado para 'chaves'`);
      return { success: true, updated: true };
    } else {
      // Criar novo documento completo
      const dados = {
        id: modalidade.id,
        nome: modalidade.nome,
        titulo: modalidade.titulo,
        categoria: modalidade.categoria,
        sistema: 'chaves',
        descricao: modalidade.descricao,
        ativo: true,
        regrasPontuacao: {
          vitoria: 3,
          empate: 1,
          derrota: 0
        },
        criterioDesempate: [
          "Confronto direto",
          "Saldo de gols",
          "Gols marcados",
          "Sorteio"
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await setDoc(docRef, dados);
      console.log(`✅ ${modalidade.nome} - Documento criado com sistema 'chaves'`);
      return { success: true, updated: false };
    }
    
  } catch (error) {
    console.error(`❌ ${modalidade.nome} - Erro: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Executar atualizações
async function main() {
  console.log('🚀 Iniciando atualização das modalidades...\n');
  
  let criados = 0;
  let atualizados = 0;
  let erros = 0;
  
  for (const modalidade of modalidades) {
    const result = await atualizarModalidade(modalidade);
    
    if (result.success) {
      if (result.updated) {
        atualizados++;
      } else {
        criados++;
      }
    } else {
      erros++;
    }
  }
  
  console.log('\n📊 Resumo:');
  console.log(`   ✅ Criados: ${criados}`);
  console.log(`   🔄 Atualizados: ${atualizados}`);
  console.log(`   ❌ Erros: ${erros}`);
  console.log(`   📋 Total: ${modalidades.length}`);
  
  process.exit(0);
}

main();
