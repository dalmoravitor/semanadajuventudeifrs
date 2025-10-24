/**
 * API - EQUIPES
 * Funções para gerenciar equipes (turmas) no Firestore
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy
} from "firebase/firestore";
import { db } from "./firebase";
import {
  COLECOES,
  getServerTimestamp,
  getDocumentById,
  getAllDocuments,
  setDocument,
  updateDocument,
  deleteDocument,
  queryDocuments
} from "./helpers";

// ============================================
// FUNÇÕES DE LEITURA
// ============================================

/**
 * Busca todas as equipes
 * @returns {Promise<Object>}
 */
export const getEquipes = async () => {
  try {
    const equipes = await queryDocuments(
      COLECOES.EQUIPES,
      [],
      [["numeroTurma", "asc"]]
    );
    
    return {
      success: true,
      data: equipes,
    };
  } catch (error) {
    console.error("Erro ao buscar equipes:", error);
    return {
      success: false,
      error: "Erro ao buscar equipes.",
    };
  }
};

/**
 * Busca uma equipe por ID
 * @param {string} equipeId - ID da equipe
 * @returns {Promise<Object>}
 */
export const getEquipeById = async (equipeId) => {
  try {
    const equipe = await getDocumentById(COLECOES.EQUIPES, equipeId);
    
    if (!equipe) {
      return {
        success: false,
        error: "Equipe não encontrada.",
      };
    }
    
    return {
      success: true,
      data: equipe,
    };
  } catch (error) {
    console.error(`Erro ao buscar equipe ${equipeId}:`, error);
    return {
      success: false,
      error: "Erro ao buscar equipe.",
    };
  }
};

/**
 * Busca equipes por série
 * @param {string} anoSerie - Série (ex: "1º Ano", "2º Ano")
 * @returns {Promise<Object>}
 */
export const getEquipesPorSerie = async (anoSerie) => {
  try {
    const equipes = await queryDocuments(
      COLECOES.EQUIPES,
      [["anoSerie", "==", anoSerie]],
      [["numeroTurma", "asc"]]
    );
    
    return {
      success: true,
      data: equipes,
    };
  } catch (error) {
    console.error(`Erro ao buscar equipes da série ${anoSerie}:`, error);
    return {
      success: false,
      error: `Erro ao buscar equipes da série ${anoSerie}.`,
    };
  }
};

/**
 * Busca ranking de equipes (ordenado por pontos)
 * @param {number} limite - Limite de resultados
 * @returns {Promise<Object>}
 */
export const getRankingEquipes = async (limite = null) => {
  try {
    const equipes = await queryDocuments(
      COLECOES.EQUIPES,
      [],
      [["totalPontos", "desc"], ["numeroTurma", "asc"]],
      limite
    );
    
    return {
      success: true,
      data: equipes,
    };
  } catch (error) {
    console.error("Erro ao buscar ranking de equipes:", error);
    return {
      success: false,
      error: "Erro ao buscar ranking.",
    };
  }
};

/**
 * Busca estatísticas gerais das equipes
 * @returns {Promise<Object>}
 */
export const getEstatisticasEquipes = async () => {
  try {
    const equipes = await getAllDocuments(COLECOES.EQUIPES);
    
    const estatisticas = {
      total: equipes.length,
      porSerie: {},
      totalPontosGeral: 0,
      mediaPontos: 0,
      maiorPontuacao: 0,
      menorPontuacao: Infinity,
    };
    
    equipes.forEach(equipe => {
      // Contar por série
      if (!estatisticas.porSerie[equipe.anoSerie]) {
        estatisticas.porSerie[equipe.anoSerie] = 0;
      }
      estatisticas.porSerie[equipe.anoSerie]++;
      
      // Calcular pontuação
      estatisticas.totalPontosGeral += equipe.totalPontos || 0;
      
      if (equipe.totalPontos > estatisticas.maiorPontuacao) {
        estatisticas.maiorPontuacao = equipe.totalPontos;
      }
      
      if (equipe.totalPontos < estatisticas.menorPontuacao) {
        estatisticas.menorPontuacao = equipe.totalPontos;
      }
    });
    
    if (equipes.length > 0) {
      estatisticas.mediaPontos = Math.round(estatisticas.totalPontosGeral / equipes.length);
    }
    
    if (estatisticas.menorPontuacao === Infinity) {
      estatisticas.menorPontuacao = 0;
    }
    
    return {
      success: true,
      data: estatisticas,
    };
  } catch (error) {
    console.error("Erro ao buscar estatísticas de equipes:", error);
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
 * Cria uma nova equipe
 * @param {Object} equipe - Dados da equipe
 * @returns {Promise<Object>}
 */
export const addEquipe = async (equipe) => {
  try {
    const equipeId = equipe.id || `turma_${equipe.numeroTurma}`;
    
    // Verificar se já existe
    const existe = await getDocumentById(COLECOES.EQUIPES, equipeId);
    if (existe) {
      return {
        success: false,
        error: "Equipe já existe.",
      };
    }
    
    const novaEquipe = {
      id: equipeId,
      nome: equipe.nome,
      anoSerie: equipe.anoSerie,
      numeroTurma: equipe.numeroTurma,
      cor: equipe.cor || "#2dd4bf",
      corSecundaria: equipe.corSecundaria || "#0891b2",
      representantes: equipe.representantes || [],
      
      // Inicializar estatísticas
      totalPontos: 0,
      totalModalidades: 0,
      posicaoRanking: 0,
      
      // Provas administrativas
      inscricaoKit: {
        completa: false,
        dataEntrega: null,
        pontos: 0,
      },
      
      disciplinaOrganizacao: {
        pontos: 160,
        ocorrencias: 0,
        avaliacoesSalaSuja: 0,
        historico: [],
      },
      
      presencas: {
        totalAulas: 0,
        totalPresencas: 0,
        percentual: 0,
        pontos: 0,
      },
      
      createdAt: getServerTimestamp(),
      updatedAt: getServerTimestamp(),
    };
    
    await setDocument(COLECOES.EQUIPES, equipeId, novaEquipe);
    
    return {
      success: true,
      data: novaEquipe,
    };
  } catch (error) {
    console.error("Erro ao criar equipe:", error);
    return {
      success: false,
      error: "Erro ao criar equipe.",
    };
  }
};

/**
 * Atualiza uma equipe existente
 * @param {string} equipeId - ID da equipe
 * @param {Object} updates - Campos a atualizar
 * @returns {Promise<Object>}
 */
export const updateEquipe = async (equipeId, updates) => {
  try {
    // Verificar se existe
    const existe = await getDocumentById(COLECOES.EQUIPES, equipeId);
    if (!existe) {
      return {
        success: false,
        error: "Equipe não encontrada.",
      };
    }
    
    await updateDocument(COLECOES.EQUIPES, equipeId, updates);
    
    return {
      success: true,
    };
  } catch (error) {
    console.error(`Erro ao atualizar equipe ${equipeId}:`, error);
    return {
      success: false,
      error: "Erro ao atualizar equipe.",
    };
  }
};

/**
 * Deleta uma equipe
 * @param {string} equipeId - ID da equipe
 * @returns {Promise<Object>}
 */
export const deleteEquipe = async (equipeId) => {
  try {
    // Verificar se existe
    const existe = await getDocumentById(COLECOES.EQUIPES, equipeId);
    if (!existe) {
      return {
        success: false,
        error: "Equipe não encontrada.",
      };
    }
    
    await deleteDocument(COLECOES.EQUIPES, equipeId);
    
    return {
      success: true,
      message: "Equipe removida com sucesso.",
    };
  } catch (error) {
    console.error(`Erro ao deletar equipe ${equipeId}:`, error);
    return {
      success: false,
      error: "Erro ao deletar equipe.",
    };
  }
};

/**
 * Importa equipes em lote
 * @param {Array} equipes - Array de equipes
 * @returns {Promise<Object>}
 */
export const importarEquipes = async (equipes) => {
  try {
    console.log(`🔧 Importando ${equipes.length} equipes...`);
    
    if (!equipes || equipes.length === 0) {
      return {
        success: false,
        error: "Nenhuma equipe para importar.",
      };
    }
    
    const promises = equipes.map(async (equipe, index) => {
      try {
        // Usar ID fornecido ou gerar baseado no numero
        const equipeId = equipe.id || `turma_${equipe.numero}`;
        
        const novaEquipe = {
          id: equipeId,
          nome: equipe.nome,
          anoSerie: equipe.serie,
          numeroTurma: equipe.numero,
          categoria: equipe.categoria || "misto", // Adicionar categoria
          cor: equipe.cor,
          corSecundaria: equipe.cor,
          representantes: [],
          totalPontos: 0,
          totalModalidades: 0,
          posicaoRanking: 0,
          inscricaoKit: {
            completa: false,
            dataEntrega: null,
            pontos: 0,
          },
          disciplinaOrganizacao: {
            pontos: 160,
            ocorrencias: 0,
            avaliacoesSalaSuja: 0,
            historico: [],
          },
          presencas: {
            totalAulas: 0,
            totalPresencas: 0,
            percentual: 0,
            pontos: 0,
          },
          createdAt: getServerTimestamp(),
          updatedAt: getServerTimestamp(),
        };
        
        console.log(`  ✓ Importando [${index + 1}/${equipes.length}]: ${equipe.nome} (${equipe.categoria || "misto"})`);
        
        return setDocument(COLECOES.EQUIPES, equipeId, novaEquipe);
      } catch (err) {
        console.error(`  ✗ Erro ao importar ${equipe.nome}:`, err);
        throw err;
      }
    });
    
    await Promise.all(promises);
    
    console.log(`✅ ${equipes.length} equipes importadas!`);
    
    return {
      success: true,
      message: `${equipes.length} equipes importadas com sucesso.`,
      count: equipes.length,
    };
  } catch (error) {
    console.error("❌ Erro ao importar equipes:", error);
    console.error("Stack:", error.stack);
    return {
      success: false,
      error: error.message || "Erro ao importar equipes.",
    };
  }
};

// ============================================
// FUNÇÕES DE PROVAS ADMINISTRATIVAS
// ============================================

/**
 * Atualiza prova de inscrição (Kit Solidário)
 * @param {string} equipeId - ID da equipe
 * @param {boolean} completa - Kit completo?
 * @param {Date} dataEntrega - Data de entrega
 * @returns {Promise<Object>}
 */
export const updateInscricaoKit = async (equipeId, completa, dataEntrega = null) => {
  try {
    const pontos = completa ? 160 : 0;
    
    await updateDocument(COLECOES.EQUIPES, equipeId, {
      inscricaoKit: {
        completa,
        dataEntrega: dataEntrega ? getServerTimestamp() : null,
        pontos,
      },
    });
    
    // Recalcular total de pontos
    await recalcularPontosEquipe(equipeId);
    
    return {
      success: true,
    };
  } catch (error) {
    console.error(`Erro ao atualizar inscrição kit da equipe ${equipeId}:`, error);
    return {
      success: false,
      error: "Erro ao atualizar inscrição kit.",
    };
  }
};

/**
 * Registra ocorrência de disciplina
 * @param {string} equipeId - ID da equipe
 * @param {Object} ocorrencia - Dados da ocorrência
 * @returns {Promise<Object>}
 */
export const registrarOcorrencia = async (equipeId, ocorrencia) => {
  try {
    const equipe = await getDocumentById(COLECOES.EQUIPES, equipeId);
    
    if (!equipe) {
      return {
        success: false,
        error: "Equipe não encontrada.",
      };
    }
    
    const disciplina = equipe.disciplinaOrganizacao;
    
    // Adicionar ocorrência ao histórico
    disciplina.historico.push({
      tipo: ocorrencia.tipo,
      descricao: ocorrencia.descricao,
      data: getServerTimestamp(),
      pontosPerdidos: ocorrencia.pontos || 10,
    });
    
    // Atualizar contadores
    if (ocorrencia.tipo === "ocorrencia") {
      disciplina.ocorrencias++;
      disciplina.pontos = Math.max(0, disciplina.pontos - 10);
    } else if (ocorrencia.tipo === "sala_suja") {
      disciplina.avaliacoesSalaSuja++;
      disciplina.pontos = Math.max(0, disciplina.pontos - 10);
    }
    
    await updateDocument(COLECOES.EQUIPES, equipeId, {
      disciplinaOrganizacao: disciplina,
    });
    
    // Recalcular total de pontos
    await recalcularPontosEquipe(equipeId);
    
    return {
      success: true,
    };
  } catch (error) {
    console.error(`Erro ao registrar ocorrência da equipe ${equipeId}:`, error);
    return {
      success: false,
      error: "Erro ao registrar ocorrência.",
    };
  }
};

/**
 * Atualiza presenças da equipe
 * @param {string} equipeId - ID da equipe
 * @param {number} totalPresencas - Total de presenças
 * @param {number} totalAulas - Total de aulas
 * @returns {Promise<Object>}
 */
export const updatePresencas = async (equipeId, totalPresencas, totalAulas) => {
  try {
    const percentual = totalAulas > 0 ? Math.round((totalPresencas / totalAulas) * 100) : 0;
    
    // Pontuação baseada no percentual (será calculada após ranking)
    const presencas = {
      totalAulas,
      totalPresencas,
      percentual,
      pontos: 0, // Será calculado no ranking geral
    };
    
    await updateDocument(COLECOES.EQUIPES, equipeId, {
      presencas,
    });
    
    return {
      success: true,
    };
  } catch (error) {
    console.error(`Erro ao atualizar presenças da equipe ${equipeId}:`, error);
    return {
      success: false,
      error: "Erro ao atualizar presenças.",
    };
  }
};

// ============================================
// FUNÇÕES DE CÁLCULO
// ============================================

/**
 * Recalcula total de pontos de uma equipe
 * @param {string} equipeId - ID da equipe
 * @returns {Promise<Object>}
 */
export const recalcularPontosEquipe = async (equipeId) => {
  try {
    const equipe = await getDocumentById(COLECOES.EQUIPES, equipeId);
    
    if (!equipe) {
      return {
        success: false,
        error: "Equipe não encontrada.",
      };
    }
    
    // Somar pontos das provas administrativas
    let totalPontos = 0;
    totalPontos += equipe.inscricaoKit?.pontos || 0;
    totalPontos += equipe.disciplinaOrganizacao?.pontos || 0;
    totalPontos += equipe.presencas?.pontos || 0;
    
    // Buscar resultados de modalidades
    const resultados = await queryDocuments(
      COLECOES.RESULTADOS,
      [["equipeId", "==", equipeId]]
    );
    
    resultados.forEach(resultado => {
      totalPontos += resultado.pontosGerais || 0;
    });
    
    await updateDocument(COLECOES.EQUIPES, equipeId, {
      totalPontos,
      totalModalidades: resultados.length,
    });
    
    return {
      success: true,
      totalPontos,
    };
  } catch (error) {
    console.error(`Erro ao recalcular pontos da equipe ${equipeId}:`, error);
    return {
      success: false,
      error: "Erro ao recalcular pontos.",
    };
  }
};

export default {
  // Leitura
  getEquipes,
  getEquipeById,
  getEquipesPorSerie,
  getRankingEquipes,
  getEstatisticasEquipes,
  
  // Escrita
  addEquipe,
  updateEquipe,
  deleteEquipe,
  importarEquipes,
  
  // Provas Administrativas
  updateInscricaoKit,
  registrarOcorrencia,
  updatePresencas,
  
  // Cálculo
  recalcularPontosEquipe,
};
