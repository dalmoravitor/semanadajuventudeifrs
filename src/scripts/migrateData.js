/**
 * SCRIPT DE MIGRAÇÃO DE DADOS
 * Popula o Firestore com dados iniciais do sistema
 * 
 * Como executar:
 * 1. Certifique-se que o Firebase está configurado
 * 2. Faça login como admin no sistema
 * 3. Acesse: http://localhost:3000/admin/migrate
 * 
 * OU execute via Node.js:
 * node src/scripts/migrateData.js
 */

import { modalidadesConfig } from "../utils/modalidadesConfig.js";
import { importarModalidades } from "../api/modalidades.js";
import { importarEquipes } from "../api/equipes.js";
import { setDocument, COLECOES } from "../api/helpers.js";
import { EQUIPES_COMPETIDORAS, TURMAS_BASE, getEquipesCompetidoras, getTurmasBase } from "../utils/equipesMapping.js";

// ============================================
// DADOS DAS EQUIPES (TURMAS)
// Nova estrutura simplificada - 21 equipes que competem
// ============================================

// Todas as 21 equipes que competem (incluindo as combinadas)
const equipasPadrao = getEquipesCompetidoras();

// 16 turmas que aparecem no ranking
const turmasRanking = getTurmasBase();

// ============================================
// CONFIGURAÇÕES GERAIS
// ============================================

const configuracaoGeral = {
  nomeEvento: "XXIX Semana da Juventude",
  anoEvento: 2025,
  instituicao: "IFRS - Campus Erechim",
  dataInicio: new Date("2025-10-27"),
  dataFim: new Date("2025-10-31"),
  tabelaPontuacao: [160, 150, 140, 130, 120, 110, 100, 90, 80, 70, 60, 50, 40, 30, 20, 10],
  eventoAtivo: true,
  inscricoesAbertas: true,
  totalEquipesCompetindo: 21, // 16 simples + 5 combinadas
  totalTurmasRanking: 16, // Turmas que aparecem no ranking
  equipasCombinadas: [
    { id: "turma_1213", turmas: ["turma_12", "turma_13"] },
    { id: "turma_1214", turmas: ["turma_12", "turma_14"] },
    { id: "turma_2324", turmas: ["turma_23", "turma_24"] },
    { id: "turma_3233", turmas: ["turma_32", "turma_33"] },
    { id: "turma_ti1112", turmas: ["turma_ti11", "turma_ti12"] }
  ],
  contatos: {
    email: "semanadajuventude@erechim.ifrs.edu.br",
    telefone: "(54) 3321-8100",
    site: "https://ifrs.edu.br/erechim"
  },
  tema: {
    corPrimaria: "#2dd4bf",
    corSecundaria: "#0891b2",
    corDestaque: "#ffd700"
  }
};

// ============================================
// FUNÇÕES DE MIGRAÇÃO
// ============================================

/**
 * Migra modalidades para o Firestore
 */
export const migrarModalidades = async () => {
  console.log("🔄 Migrando modalidades...");
  
  try {
    console.log(`📊 Total de modalidades carregadas: ${modalidadesConfig.length}`);
    
    // Adicionar campos extras às modalidades
    const modalidadesComExtras = modalidadesConfig.map((modalidade, index) => ({
      ...modalidade,
      status: "aguardando",
      ordem: index + 1,
      icone: getIconeModalidade(modalidade.nome),
      numeroChaves: getNumeroChaves(modalidade),
      numeroEquipesPorChave: getEquipesPorChave(modalidade),
    }));
    
    console.log(`📦 Modalidades preparadas: ${modalidadesComExtras.length}`);
    console.log(`📝 Exemplo: ${modalidadesComExtras[0]?.nome || "N/A"}`);
    
    const result = await importarModalidades(modalidadesComExtras);
    
    console.log(`📋 Resultado:`, result);
    
    if (result.success) {
      console.log(`✅ ${modalidadesComExtras.length} modalidades migradas com sucesso!`);
      return { success: true, count: modalidadesComExtras.length };
    } else {
      console.error("❌ Erro ao migrar modalidades:", result.error);
      return { success: false, error: result.error, count: 0 };
    }
  } catch (error) {
    console.error("❌ Erro ao migrar modalidades:", error);
    console.error("Stack:", error.stack);
    return { success: false, error: error.message, count: 0 };
  }
};

/**
 * Migra equipes para o Firestore
 */
export const migrarEquipes = async () => {
  console.log("🔄 Migrando equipes...");
  
  try {
    console.log(`📊 Total de equipes: ${equipasPadrao.length}`);
    console.log(`📝 Exemplo: ${equipasPadrao[0]?.nome || "N/A"}`);
    
    const result = await importarEquipes(equipasPadrao);
    
    console.log(`📋 Resultado:`, result);
    
    if (result.success) {
      console.log(`✅ ${equipasPadrao.length} equipes migradas com sucesso!`);
      return { success: true, count: equipasPadrao.length };
    } else {
      console.error("❌ Erro ao migrar equipes:", result.error);
      return { success: false, error: result.error, count: 0 };
    }
  } catch (error) {
    console.error("❌ Erro ao migrar equipes:", error);
    console.error("Stack:", error.stack);
    return { success: false, error: error.message, count: 0 };
  }
};

/**
 * Migra configurações gerais
 */
export const migrarConfiguracoes = async () => {
  console.log("🔄 Migrando configurações...");
  
  try {
    // Configuração geral
    await setDocument(COLECOES.CONFIGURACOES, "geral", configuracaoGeral);
    
    // Todas as equipes que competem (21 equipes)
    await setDocument(COLECOES.CONFIGURACOES, "equipes_competindo", {
      totalEquipes: equipasPadrao.length,
      equipes: equipasPadrao,
      equipasSimples: equipasPadrao.filter(e => e.distribuicaoPontos.length === 1),
      equipasCombinadas: equipasPadrao.filter(e => e.distribuicaoPontos.length > 1),
    });
    
    // Turmas do ranking (16 turmas)
    await setDocument(COLECOES.CONFIGURACOES, "turmas_ranking", {
      totalTurmas: turmasRanking.length,
      turmas: turmasRanking,
    });
    
    console.log("✅ Configurações migradas com sucesso!");
    return { success: true };
  } catch (error) {
    console.error("❌ Erro ao migrar configurações:", error);
    console.error("Stack:", error.stack);
    return { success: false, error: error.message };
  }
};

/**
 * Inicializa ranking vazio
 */
export const inicializarRanking = async () => {
  console.log("🔄 Inicializando rankings...");
  
  try {
    const rankingVazio = {
      tipo: "geral",
      classificacao: [],
      totalTurmas: 16, // 16 turmas no ranking
      ultimaAtualizacao: new Date(),
      calculadoEm: new Date(),
    };
    
    // Ranking geral (único agora, pois não diferenciamos mais por categoria)
    await setDocument(COLECOES.RANKING, "geral", rankingVazio);
    
    console.log("✅ Rankings inicializados com sucesso!");
    return { success: true };
  } catch (error) {
    console.error("❌ Erro ao inicializar rankings:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Executa migração completa
 */
export const migrarTodosDados = async () => {
  console.log("\n");
  console.log("=" .repeat(60));
  console.log("🚀 INICIANDO MIGRAÇÃO COMPLETA DE DADOS");
  console.log("=" .repeat(60));
  console.log("\n");
  
  const resultados = {
    modalidades: { success: false, count: 0 },
    equipes: { success: false, count: 0 },
    configuracoes: { success: false },
    ranking: { success: false },
  };
  
  // 1. Modalidades
  console.log("\n📋 ETAPA 1/4: Modalidades");
  console.log("-" .repeat(60));
  resultados.modalidades = await migrarModalidades();
  
  // 2. Equipes
  console.log("\n👥 ETAPA 2/4: Equipes");
  console.log("-" .repeat(60));
  resultados.equipes = await migrarEquipes();
  
  // 3. Configurações
  console.log("\n⚙️ ETAPA 3/4: Configurações");
  console.log("-" .repeat(60));
  resultados.configuracoes = await migrarConfiguracoes();
  
  // 4. Rankings
  console.log("\n🏆 ETAPA 4/4: Rankings");
  console.log("-" .repeat(60));
  resultados.ranking = await inicializarRanking();
  
  // Resumo
  console.log("\n");
  console.log("=" .repeat(60));
  console.log("📊 RESUMO DA MIGRAÇÃO");
  console.log("=" .repeat(60));
  console.log(`Modalidades: ${resultados.modalidades.success ? "✅" : "❌"} (${resultados.modalidades.count || 0})`);
  console.log(`Equipes:     ${resultados.equipes.success ? "✅" : "❌"} (${resultados.equipes.count || 0})`);
  console.log(`Configurações: ${resultados.configuracoes.success ? "✅" : "❌"}`);
  console.log(`Rankings:    ${resultados.ranking.success ? "✅" : "❌"}`);
  console.log("=" .repeat(60));
  
  const todasSucesso = Object.values(resultados).every(r => r.success);
  
  if (todasSucesso) {
    console.log("\n✨ MIGRAÇÃO CONCLUÍDA COM SUCESSO! ✨\n");
  } else {
    console.log("\n⚠️ MIGRAÇÃO CONCLUÍDA COM ERROS ⚠️\n");
  }
  
  return {
    success: todasSucesso,
    resultados,
  };
};

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

/**
 * Retorna ícone baseado no nome da modalidade
 */
function getIconeModalidade(nome) {
  const icones = {
    "Futsal": "⚽",
    "Handebol": "🤾",
    "Voleibol": "🏐",
    "Basquetebol": "🏀",
    "Vôlei de Praia": "🏖️",
    "Cabo-de-guerra": "🪢",
    "Atletismo": "🏃",
    "Salto em Distância": "🦘",
    "Lançamento de Dardo": "🎯",
    "Arremesso de Dardo": "🎯",
    "Revezamento": "🏃‍♂️",
    "CS – GO": "🎮",
    "FIFA": "⚽",
    "Mortal Kombat": "🥋",
    "Truco": "🃏",
    "Bisca": "🃏",
    "Xadrez": "♟️",
    "Tiro de Laço": "🤠",
    "Bocha Campeira": "⚪",
    "Culinária": "👨‍🍳",
    "Gincana": "🎉",
    "Show de Talentos": "🎤",
    "Soletrando": "📖",
    "Sudoku": "🔢",
    "Inscrição": "📋",
    "Disciplina": "📚",
    "Presenças": "✅",
  };
  
  for (const [key, value] of Object.entries(icones)) {
    if (nome.includes(key)) {
      return value;
    }
  }
  
  return "🏅";
}

/**
 * Retorna número de chaves baseado na modalidade e categoria
 */
function getNumeroChaves(modalidade) {
  // Se não tem sistema de chaves, retorna 0
  if (!modalidade.sistema?.includes("chaves")) {
    return 0;
  }
  
  // Masculino e Misto: 5 chaves de 3 equipes
  if (modalidade.categoria === "masculino" || modalidade.categoria === "misto") {
    return 5;
  }
  
  // Feminino: 4 chaves de 3 equipes
  if (modalidade.categoria === "feminino") {
    return 4;
  }
  
  return 0;
}

/**
 * Retorna número de equipes por chave (sempre 3)
 */
function getEquipesPorChave(modalidade) {
  // Se não tem sistema de chaves, retorna 0
  if (!modalidade.sistema?.includes("chaves")) {
    return 0;
  }
  
  // Todas as modalidades com chaves têm 3 equipes por chave
  return 3;
}

/**
 * Verifica status da migração
 */
export const verificarMigracao = async () => {
  try {
    const { getModalidades } = await import("../api/modalidades");
    const { getEquipes } = await import("../api/equipes");
    const { getDocumentById } = await import("../api/helpers");
    
    const modalidades = await getModalidades();
    const equipes = await getEquipes();
    const config = await getDocumentById(COLECOES.CONFIGURACOES, "geral");
    const ranking = await getDocumentById(COLECOES.RANKING, "geral");
    
    return {
      modalidades: {
        migrado: modalidades.success && modalidades.data.length > 0,
        count: modalidades.data?.length || 0,
      },
      equipes: {
        migrado: equipes.success && equipes.data.length > 0,
        count: equipes.data?.length || 0,
      },
      configuracoes: {
        migrado: !!config,
      },
      ranking: {
        migrado: !!ranking,
      },
    };
  } catch (error) {
    console.error("Erro ao verificar migração:", error);
    return null;
  }
};

// ============================================
// EXPORTS
// ============================================

// Exportar listas de equipes para uso em outros módulos
export { equipasPadrao, turmasRanking };

export default {
  migrarModalidades,
  migrarEquipes,
  migrarConfiguracoes,
  inicializarRanking,
  migrarTodosDados,
  verificarMigracao,
};
