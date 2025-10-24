/**
 * API - MODALIDADES
 * Funções para gerenciar modalidades no Firestore
 */

import { 
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy
} from "firebase/firestore";
import { db } from "./firebase";
import { 
  COLECOES, 
  STATUS, 
  getServerTimestamp,
  getDocumentById,
  getAllDocuments,
  setDocument,
  updateDocument,
  queryDocuments
} from "./helpers";

// ============================================
// FUNÇÕES DE LEITURA
// ============================================

/**
 * Busca todas as modalidades
 * @returns {Promise<Array>}
 */
export const getModalidades = async () => {
  try {
    const modalidades = await queryDocuments(
      COLECOES.MODALIDADES,
      [],
      [["ordem", "asc"]]
    );
    
    return {
      success: true,
      data: modalidades,
    };
  } catch (error) {
    console.error("Erro ao buscar modalidades:", error);
    return {
      success: false,
      error: "Erro ao buscar modalidades.",
    };
  }
};

/**
 * Busca modalidades por categoria
 * @param {string} categoria - "masculino", "feminino" ou "misto"
 * @returns {Promise<Object>}
 */
export const getModalidadesPorCategoria = async (categoria) => {
  try {
    const modalidades = await queryDocuments(
      COLECOES.MODALIDADES,
      [["categoria", "==", categoria]],
      [["ordem", "asc"]]
    );
    
    return {
      success: true,
      data: modalidades,
    };
  } catch (error) {
    console.error(`Erro ao buscar modalidades da categoria ${categoria}:`, error);
    return {
      success: false,
      error: `Erro ao buscar modalidades da categoria ${categoria}.`,
    };
  }
};

/**
 * Busca modalidades por status
 * @param {string} status - "aguardando", "em_andamento" ou "concluido"
 * @returns {Promise<Object>}
 */
export const getModalidadesPorStatus = async (status) => {
  try {
    const modalidades = await queryDocuments(
      COLECOES.MODALIDADES,
      [["status", "==", status]],
      [["ordem", "asc"]]
    );
    
    return {
      success: true,
      data: modalidades,
    };
  } catch (error) {
    console.error(`Erro ao buscar modalidades com status ${status}:`, error);
    return {
      success: false,
      error: `Erro ao buscar modalidades com status ${status}.`,
    };
  }
};

/**
 * Busca uma modalidade por ID
 * @param {string} modalidadeId - ID da modalidade
 * @returns {Promise<Object>}
 */
export const getModalidadeById = async (modalidadeId) => {
  try {
    const modalidade = await getDocumentById(COLECOES.MODALIDADES, modalidadeId);
    
    if (!modalidade) {
      return {
        success: false,
        error: "Modalidade não encontrada.",
      };
    }
    
    return {
      success: true,
      data: modalidade,
    };
  } catch (error) {
    console.error(`Erro ao buscar modalidade ${modalidadeId}:`, error);
    return {
      success: false,
      error: "Erro ao buscar modalidade.",
    };
  }
};

/**
 * Busca estatísticas gerais das modalidades
 * @returns {Promise<Object>}
 */
export const getEstatisticasModalidades = async () => {
  try {
    const modalidades = await getAllDocuments(COLECOES.MODALIDADES);
    
    const estatisticas = {
      total: modalidades.length,
      porCategoria: {
        masculino: modalidades.filter(m => m.categoria === "masculino").length,
        feminino: modalidades.filter(m => m.categoria === "feminino").length,
        misto: modalidades.filter(m => m.categoria === "misto").length,
      },
      porStatus: {
        aguardando: modalidades.filter(m => m.status === STATUS.AGUARDANDO).length,
        em_andamento: modalidades.filter(m => m.status === STATUS.EM_ANDAMENTO).length,
        concluido: modalidades.filter(m => m.status === STATUS.CONCLUIDO).length,
      },
      porTipo: {
        coletiva: modalidades.filter(m => m.tipo === "coletiva").length,
        individual: modalidades.filter(m => m.tipo === "individual").length,
      },
    };
    
    return {
      success: true,
      data: estatisticas,
    };
  } catch (error) {
    console.error("Erro ao buscar estatísticas de modalidades:", error);
    return {
      success: false,
      error: "Erro ao buscar estatísticas.",
    };
  }
};

// ============================================
// FUNÇÕES DE ESCRITA
// ============================================

/**
 * Cria uma nova modalidade
 * @param {Object} modalidade - Dados da modalidade
 * @returns {Promise<Object>}
 */
export const criarModalidade = async (modalidade) => {
  try {
    const modalidadeId = modalidade.id;
    
    // Verificar se já existe
    const existe = await getDocumentById(COLECOES.MODALIDADES, modalidadeId);
    if (existe) {
      return {
        success: false,
        error: "Modalidade já existe.",
      };
    }
    
    const novaModalidade = {
      ...modalidade,
      status: modalidade.status || STATUS.AGUARDANDO,
      createdAt: getServerTimestamp(),
      updatedAt: getServerTimestamp(),
    };
    
    await setDocument(COLECOES.MODALIDADES, modalidadeId, novaModalidade);
    
    return {
      success: true,
      data: novaModalidade,
    };
  } catch (error) {
    console.error("Erro ao criar modalidade:", error);
    return {
      success: false,
      error: "Erro ao criar modalidade.",
    };
  }
};

/**
 * Atualiza uma modalidade existente
 * @param {string} modalidadeId - ID da modalidade
 * @param {Object} updates - Campos a atualizar
 * @returns {Promise<Object>}
 */
export const updateModalidade = async (modalidadeId, updates) => {
  try {
    // Verificar se existe
    const existe = await getDocumentById(COLECOES.MODALIDADES, modalidadeId);
    if (!existe) {
      return {
        success: false,
        error: "Modalidade não encontrada.",
      };
    }
    
    await updateDocument(COLECOES.MODALIDADES, modalidadeId, updates);
    
    return {
      success: true,
    };
  } catch (error) {
    console.error(`Erro ao atualizar modalidade ${modalidadeId}:`, error);
    return {
      success: false,
      error: "Erro ao atualizar modalidade.",
    };
  }
};

/**
 * Atualiza o status de uma modalidade
 * @param {string} modalidadeId - ID da modalidade
 * @param {string} novoStatus - Novo status
 * @returns {Promise<Object>}
 */
export const updateStatusModalidade = async (modalidadeId, novoStatus) => {
  try {
    const validStatuses = [STATUS.AGUARDANDO, STATUS.EM_ANDAMENTO, STATUS.CONCLUIDO];
    
    if (!validStatuses.includes(novoStatus)) {
      return {
        success: false,
        error: "Status inválido.",
      };
    }
    
    await updateDocument(COLECOES.MODALIDADES, modalidadeId, {
      status: novoStatus,
    });
    
    return {
      success: true,
    };
  } catch (error) {
    console.error(`Erro ao atualizar status da modalidade ${modalidadeId}:`, error);
    return {
      success: false,
      error: "Erro ao atualizar status.",
    };
  }
};

/**
 * Importa modalidades em lote (usado na migração inicial)
 * @param {Array} modalidades - Array de modalidades
 * @returns {Promise<Object>}
 */
export const importarModalidades = async (modalidades) => {
  try {
    console.log(`🔧 Importando ${modalidades.length} modalidades...`);
    
    if (!modalidades || modalidades.length === 0) {
      return {
        success: false,
        error: "Nenhuma modalidade para importar.",
      };
    }
    
    const promises = modalidades.map(async (modalidade, index) => {
      try {
        const modalidadeComTimestamps = {
          ...modalidade,
          status: modalidade.status || STATUS.AGUARDANDO,
          createdAt: getServerTimestamp(),
          updatedAt: getServerTimestamp(),
        };
        
        console.log(`  ✓ Importando [${index + 1}/${modalidades.length}]: ${modalidade.nome}`);
        
        return setDocument(
          COLECOES.MODALIDADES,
          modalidade.id,
          modalidadeComTimestamps
        );
      } catch (err) {
        console.error(`  ✗ Erro ao importar ${modalidade.nome}:`, err);
        throw err;
      }
    });
    
    await Promise.all(promises);
    
    console.log(`✅ ${modalidades.length} modalidades importadas!`);
    
    return {
      success: true,
      message: `${modalidades.length} modalidades importadas com sucesso.`,
      count: modalidades.length,
    };
  } catch (error) {
    console.error("❌ Erro ao importar modalidades:", error);
    console.error("Stack:", error.stack);
    return {
      success: false,
      error: error.message || "Erro ao importar modalidades.",
    };
  }
};

// ============================================
// FUNÇÕES DE INSCRIÇÃO
// ============================================

/**
 * Busca equipes inscritas em uma modalidade
 * @param {string} modalidadeId - ID da modalidade
 * @returns {Promise<Object>}
 */
export const getEquipesInscritas = async (modalidadeId) => {
  try {
    const inscricao = await getDocumentById(COLECOES.INSCRICOES, modalidadeId);
    
    if (!inscricao) {
      return {
        success: true,
        data: {
          modalidadeId,
          equipes: [],
          totalEquipes: 0,
          limiteEquipes: 16,
          inscricoesAbertas: true,
        },
      };
    }
    
    return {
      success: true,
      data: inscricao,
    };
  } catch (error) {
    console.error(`Erro ao buscar equipes inscritas na modalidade ${modalidadeId}:`, error);
    return {
      success: false,
      error: "Erro ao buscar equipes inscritas.",
    };
  }
};

/**
 * Inscreve uma equipe em uma modalidade
 * @param {string} modalidadeId - ID da modalidade
 * @param {Object} equipe - Dados da equipe
 * @returns {Promise<Object>}
 */
export const inscreverEquipe = async (modalidadeId, equipe) => {
  try {
    // Buscar inscrições existentes
    let inscricao = await getDocumentById(COLECOES.INSCRICOES, modalidadeId);
    
    if (!inscricao) {
      // Criar nova inscrição
      inscricao = {
        modalidadeId,
        equipes: [],
        totalEquipes: 0,
        limiteEquipes: 16,
        inscricoesAbertas: true,
      };
    }
    
    // Verificar se já está inscrita
    const jaInscrita = inscricao.equipes.some(e => e.equipeId === equipe.equipeId);
    if (jaInscrita) {
      return {
        success: false,
        error: "Equipe já está inscrita nesta modalidade.",
      };
    }
    
    // Verificar limite
    if (inscricao.totalEquipes >= inscricao.limiteEquipes) {
      return {
        success: false,
        error: "Limite de equipes atingido.",
      };
    }
    
    // Adicionar equipe
    inscricao.equipes.push({
      equipeId: equipe.equipeId,
      nomeEquipe: equipe.nomeEquipe,
      dataInscricao: getServerTimestamp(),
      status: "confirmada",
    });
    
    inscricao.totalEquipes = inscricao.equipes.length;
    
    await setDocument(COLECOES.INSCRICOES, modalidadeId, inscricao, true);
    
    return {
      success: true,
      message: "Equipe inscrita com sucesso.",
    };
  } catch (error) {
    console.error(`Erro ao inscrever equipe na modalidade ${modalidadeId}:`, error);
    return {
      success: false,
      error: "Erro ao inscrever equipe.",
    };
  }
};

/**
 * Remove uma equipe de uma modalidade
 * @param {string} modalidadeId - ID da modalidade
 * @param {string} equipeId - ID da equipe
 * @returns {Promise<Object>}
 */
export const removerInscricao = async (modalidadeId, equipeId) => {
  try {
    const inscricao = await getDocumentById(COLECOES.INSCRICOES, modalidadeId);
    
    if (!inscricao) {
      return {
        success: false,
        error: "Inscrição não encontrada.",
      };
    }
    
    // Remover equipe
    inscricao.equipes = inscricao.equipes.filter(e => e.equipeId !== equipeId);
    inscricao.totalEquipes = inscricao.equipes.length;
    
    await setDocument(COLECOES.INSCRICOES, modalidadeId, inscricao, true);
    
    return {
      success: true,
      message: "Inscrição removida com sucesso.",
    };
  } catch (error) {
    console.error(`Erro ao remover inscrição da modalidade ${modalidadeId}:`, error);
    return {
      success: false,
      error: "Erro ao remover inscrição.",
    };
  }
};

export default {
  // Leitura
  getModalidades,
  getModalidadesPorCategoria,
  getModalidadesPorStatus,
  getModalidadeById,
  getEstatisticasModalidades,
  
  // Escrita
  criarModalidade,
  updateModalidade,
  updateStatusModalidade,
  importarModalidades,
  
  // Inscrições
  getEquipesInscritas,
  inscreverEquipe,
  removerInscricao,
};
