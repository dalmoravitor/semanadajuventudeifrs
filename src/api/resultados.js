/**
 * API - RESULTADOS
 * Funções para gerenciar resultados e pontuações no Firestore
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
  TABELA_PONTUACAO,
  getServerTimestamp,
  getDocumentById,
  setDocument,
  updateDocument,
  queryDocuments,
  calcularPontosGerais,
  generateId
} from "./helpers";

// ============================================
// FUNÇÕES DE LEITURA
// ============================================

/**
 * Busca todos os resultados
 * @returns {Promise<Object>}
 */
export const getResultados = async () => {
  try {
    const resultados = await queryDocuments(
      COLECOES.RESULTADOS,
      [],
      [["pontosGerais", "desc"]]
    );
    
    return {
      success: true,
      data: resultados,
    };
  } catch (error) {
    console.error("Erro ao buscar resultados:", error);
    return {
      success: false,
      error: "Erro ao buscar resultados.",
    };
  }
};

/**
 * Busca resultados de uma modalidade
 * @param {string} modalidadeId - ID da modalidade
 * @returns {Promise<Object>}
 */
export const getResultadosPorModalidade = async (modalidadeId) => {
  try {
    // Tentativa 1: query com filtro + ordenação (requer índice composto)
    const resultados = await queryDocuments(
      COLECOES.RESULTADOS,
      [["modalidadeId", "==", modalidadeId]],
      [["colocacao", "asc"]]
    );
    
    return {
      success: true,
      data: resultados,
    };
  } catch (error) {
    // Fallback: caso o Firestore exija índice composto, faz a ordenação no cliente
    const needsIndex = (error?.code === 'failed-precondition') ||
      (typeof error?.message === 'string' && error.message.toLowerCase().includes('index'));
    
    if (needsIndex) {
      console.warn(`⚠️ Índice composto ausente para resultados/{modalidadeId+colocacao}. Aplicando fallback com ordenação no cliente...`);
      try {
        // Buscar apenas com filtro (sem orderBy) e ordenar em memória
        const semOrdenacao = await queryDocuments(
          COLECOES.RESULTADOS,
          [["modalidadeId", "==", modalidadeId]]
        );
        const ordenados = [...semOrdenacao].sort((a, b) => (a.colocacao ?? 999) - (b.colocacao ?? 999));
        return {
          success: true,
          data: ordenados,
          fallback: true,
        };
      } catch (innerErr) {
        console.error(`❌ Fallback também falhou ao buscar resultados da modalidade ${modalidadeId}:`, innerErr);
        return {
          success: false,
          error: "Erro ao buscar resultados (índice necessário).",
          needsIndex: true,
        };
      }
    }
    
    console.error(`Erro ao buscar resultados da modalidade ${modalidadeId}:`, error);
    return {
      success: false,
      error: "Erro ao buscar resultados.",
    };
  }
};

/**
 * Busca resultados de uma equipe
 * @param {string} equipeId - ID da equipe
 * @returns {Promise<Object>}
 */
export const getResultadosPorEquipe = async (equipeId) => {
  try {
    // Tentativa 1: query com filtro + ordenação (pode exigir índice composto)
    const resultados = await queryDocuments(
      COLECOES.RESULTADOS,
      [["equipeId", "==", equipeId]],
      [["pontosGerais", "desc"]]
    );
    
    return {
      success: true,
      data: resultados,
    };
  } catch (error) {
    // Fallback: caso o Firestore exija índice composto, faz a ordenação no cliente
    const needsIndex = (error?.code === 'failed-precondition') ||
      (typeof error?.message === 'string' && error.message.toLowerCase().includes('index'));
    
    if (needsIndex) {
      console.warn(`⚠️ Índice composto ausente para resultados/{equipeId+pontosGerais}. Aplicando fallback com ordenação no cliente...`);
      try {
        // Buscar apenas com filtro (sem orderBy) e ordenar em memória
        const semOrdenacao = await queryDocuments(
          COLECOES.RESULTADOS,
          [["equipeId", "==", equipeId]]
        );
        const ordenados = [...semOrdenacao].sort((a, b) => (b.pontosGerais ?? 0) - (a.pontosGerais ?? 0));
        return {
          success: true,
          data: ordenados,
          fallback: true,
        };
      } catch (innerErr) {
        console.error(`❌ Fallback também falhou ao buscar resultados da equipe ${equipeId}:`, innerErr);
        return {
          success: false,
          error: "Erro ao buscar resultados (índice necessário).",
          needsIndex: true,
        };
      }
    }
    
    console.error(`Erro ao buscar resultados da equipe ${equipeId}:`, error);
    return {
      success: false,
      error: "Erro ao buscar resultados.",
    };
  }
};

// ============================================
// FUNÇÕES DE ESCRITA
// ============================================

/**
 * Salva resultado de uma modalidade para uma equipe
 * @param {Object} resultadoData - Objeto completo do resultado ou modalidadeId (string)
 * @param {string} equipeId - ID da equipe (se primeiro argumento for string)
 * @param {number} colocacao - Colocação (se primeiro argumento for string)
 * @param {Object} estatisticas - Estatísticas (se primeiro argumento for string)
 * @param {Array} historico - Histórico (se primeiro argumento for string)
 * @returns {Promise<Object>}
 */
export const saveResultado = async (resultadoData, equipeId, colocacao, estatisticas = {}, historico = []) => {
  try {
    // Suporta dois formatos: saveResultado(objeto) ou saveResultado(modalidadeId, equipeId, colocacao, ...)
    let resultado;
    
    if (typeof resultadoData === 'object' && resultadoData !== null) {
      // Formato: saveResultado({ id, modalidadeId, equipeId, ... })
      const { id, ...dados } = resultadoData;
      const resultadoId = id || `${resultadoData.modalidadeId}_${resultadoData.equipeId}`;
      
      resultado = {
        id: resultadoId,
        ...dados,
        updatedAt: getServerTimestamp(),
      };
      
      // Se não tem createdAt, adiciona
      if (!resultado.createdAt) {
        resultado.createdAt = getServerTimestamp();
      }
      
      await setDocument(COLECOES.RESULTADOS, resultadoId, resultado);
      
      // Recalcular pontos da equipe se tiver
      if (resultado.equipeId) {
        const { recalcularPontosEquipe } = require("./equipes");
        await recalcularPontosEquipe(resultado.equipeId);
      }
      
    } else {
      // Formato antigo: saveResultado(modalidadeId, equipeId, colocacao, ...)
      const modalidadeId = resultadoData;
      const resultadoId = `${modalidadeId}_${equipeId}`;
      const pontosGerais = calcularPontosGerais(colocacao);
      
      resultado = {
        id: resultadoId,
        modalidadeId,
        equipeId,
        colocacao,
        pontosGerais,
        estatisticas,
        historico,
        createdAt: getServerTimestamp(),
        updatedAt: getServerTimestamp(),
      };
      
      await setDocument(COLECOES.RESULTADOS, resultadoId, resultado);
      
      // Recalcular pontos da equipe
      const { recalcularPontosEquipe } = require("./equipes");
      await recalcularPontosEquipe(equipeId);
    }
    
    return {
      success: true,
      data: resultado,
    };
  } catch (error) {
    console.error("Erro ao salvar resultado:", error);
    return {
      success: false,
      error: "Erro ao salvar resultado.",
    };
  }
};

/**
 * Atualiza resultado existente
 * @param {string} resultadoId - ID do resultado
 * @param {Object} updates - Campos a atualizar
 * @returns {Promise<Object>}
 */
export const updateResultado = async (resultadoId, updates) => {
  try {
    const resultado = await getDocumentById(COLECOES.RESULTADOS, resultadoId);
    
    if (!resultado) {
      return {
        success: false,
        error: "Resultado não encontrado.",
      };
    }
    
    // Se mudou a colocação, recalcular pontos
    if (updates.colocacao && updates.colocacao !== resultado.colocacao) {
      updates.pontosGerais = calcularPontosGerais(updates.colocacao);
    }
    
    await updateDocument(COLECOES.RESULTADOS, resultadoId, updates);
    
    // Recalcular pontos da equipe
    if (updates.colocacao || updates.pontosGerais) {
      const { recalcularPontosEquipe } = require("./equipes");
      await recalcularPontosEquipe(resultado.equipeId);
    }
    
    return {
      success: true,
    };
  } catch (error) {
    console.error(`Erro ao atualizar resultado ${resultadoId}:`, error);
    return {
      success: false,
      error: "Erro ao atualizar resultado.",
    };
  }
};

// ============================================
// CONFRONTOS
// ============================================

/**
 * Busca confrontos de uma modalidade
 * @param {string} modalidadeId - ID da modalidade
 * @param {string} fase - Fase específica (opcional)
 * @returns {Promise<Object>}
 */
export const getConfrontos = async (modalidadeId, fase = null) => {
  try {
    const filters = [["modalidadeId", "==", modalidadeId]];
    
    if (fase) {
      filters.push(["fase", "==", fase]);
    }
    
    const confrontos = await queryDocuments(
      COLECOES.CONFRONTOS,
      filters,
      [["faseOrdem", "asc"]]
    );
    
    return {
      success: true,
      data: confrontos,
    };
  } catch (error) {
    console.error(`Erro ao buscar confrontos da modalidade ${modalidadeId}:`, error);
    return {
      success: false,
      error: "Erro ao buscar confrontos.",
    };
  }
};

/**
 * Salva resultado de um confronto
 * @param {string} confrontoId - ID do confronto
 * @param {Object} resultado - Dados do resultado
 * @returns {Promise<Object>}
 */
export const saveResultadoConfronto = async (confrontoId, resultado) => {
  try {
    const confronto = await getDocumentById(COLECOES.CONFRONTOS, confrontoId);
    
    if (!confronto) {
      return {
        success: false,
        error: "Confronto não encontrado.",
      };
    }
    
    await updateDocument(COLECOES.CONFRONTOS, confrontoId, {
      resultado,
      status: "concluido",
    });
    
    // Se houver próximo confronto, atualizar com o vencedor
    if (confronto.proximoConfrontoId && resultado.vencedor) {
      const proximoConfronto = await getDocumentById(COLECOES.CONFRONTOS, confronto.proximoConfrontoId);
      
      if (proximoConfronto) {
        const campoEquipe = confronto.posicaoProximoConfronto;
        
        await updateDocument(COLECOES.CONFRONTOS, confronto.proximoConfrontoId, {
          [campoEquipe]: {
            equipeId: resultado.vencedor,
            nomeEquipe: resultado.vencedor === confronto.equipeA.equipeId 
              ? confronto.equipeA.nomeEquipe 
              : confronto.equipeB.nomeEquipe,
            origem: `Vencedor ${confronto.fase}`,
          },
        });
      }
    }
    
    return {
      success: true,
    };
  } catch (error) {
    console.error(`Erro ao salvar resultado do confronto ${confrontoId}:`, error);
    return {
      success: false,
      error: "Erro ao salvar resultado do confronto.",
    };
  }
};

/**
 * Cria confronto
 * @param {Object} confronto - Dados do confronto
 * @returns {Promise<Object>}
 */
export const criarConfronto = async (confronto) => {
  try {
    const confrontoId = confronto.confrontoId || generateId("confronto");
    
    const novoConfronto = {
      confrontoId,
      ...confronto,
      status: confronto.status || "pendente",
      resultado: confronto.resultado || {
        scoreA: null,
        scoreB: null,
        vencedor: null,
      },
      createdAt: getServerTimestamp(),
      updatedAt: getServerTimestamp(),
    };
    
    await setDocument(COLECOES.CONFRONTOS, confrontoId, novoConfronto);
    
    return {
      success: true,
      data: novoConfronto,
    };
  } catch (error) {
    console.error("Erro ao criar confronto:", error);
    return {
      success: false,
      error: "Erro ao criar confronto.",
    };
  }
};

// ============================================
// CHAVES/GRUPOS
// ============================================

/**
 * Busca chaves de uma modalidade
 * @param {string} modalidadeId - ID da modalidade
 * @returns {Promise<Object>}
 */
export const getChaves = async (modalidadeId) => {
  try {
    const chaves = await getDocumentById(COLECOES.CHAVES, modalidadeId);
    
    if (!chaves) {
      return {
        success: true,
        data: {
          modalidadeId,
          chaves: [],
          classificadosParaEliminatorias: [],
        },
      };
    }
    
    return {
      success: true,
      data: chaves,
    };
  } catch (error) {
    console.error(`Erro ao buscar chaves da modalidade ${modalidadeId}:`, error);
    return {
      success: false,
      error: "Erro ao buscar chaves.",
    };
  }
};

/**
 * Salva/atualiza chaves de uma modalidade
 * @param {string} modalidadeId - ID da modalidade
 * @param {Object} chavesData - Dados das chaves
 * @returns {Promise<Object>}
 */
export const saveChaves = async (modalidadeId, chavesData) => {
  try {
    const chaves = {
      modalidadeId,
      ...chavesData,
      updatedAt: getServerTimestamp(),
    };
    
    await setDocument(COLECOES.CHAVES, modalidadeId, chaves, true);
    
    return {
      success: true,
      data: chaves,
    };
  } catch (error) {
    console.error(`Erro ao salvar chaves da modalidade ${modalidadeId}:`, error);
    return {
      success: false,
      error: "Erro ao salvar chaves.",
    };
  }
};

/**
 * Salva resultado de um jogo individual dentro de uma chave
 * @param {string} modalidadeId - ID da modalidade
 * @param {number} chaveIdx - Índice da chave
 * @param {number} jogoIdx - Índice do jogo
 * @param {Object} resultado - Objeto com equipeA, equipeB, scoreA, scoreB
 * @returns {Promise<Object>}
 */
export const saveResultadoJogoChave = async (modalidadeId, chaveIdx, jogoIdx, resultado) => {
  try {
    console.log(`💾 Salvando resultado do jogo ${jogoIdx} da chave ${chaveIdx} na modalidade ${modalidadeId}`);
    console.log(`   Dados recebidos:`, resultado);
    
    const chavesDoc = await getDocumentById(COLECOES.CHAVES, modalidadeId);
    console.log(`   Documento de chaves:`, chavesDoc ? "encontrado" : "não encontrado");
    
    if (!chavesDoc) {
      console.error(`   ❌ Chaves não encontradas para modalidade ${modalidadeId}`);
      return {
        success: false,
        error: "Chaves não encontradas.",
      };
    }

    // Garantir que o array de resultadosJogos existe
    if (!chavesDoc.resultadosJogos) {
      chavesDoc.resultadosJogos = [];
      console.log(`   ✓ Array resultadosJogos criado`);
    }

    // Criar ID único para o jogo
    const jogoId = `chave${chaveIdx}_jogo${jogoIdx}`;
    console.log(`   ID do jogo: ${jogoId}`);

    // Verificar se o resultado já existe
    const resultadoExistenteIdx = chavesDoc.resultadosJogos.findIndex(
      r => r.id === jogoId
    );

    const novoResultado = {
      id: jogoId,
      chaveIdx,
      jogoIdx,
      equipeA: resultado.equipeA,
      equipeB: resultado.equipeB,
      scoreA: parseInt(resultado.scoreA),
      scoreB: parseInt(resultado.scoreB),
      meta: resultado.meta || {},
      updatedAt: new Date().toISOString(), // Usar ISO string ao invés de serverTimestamp
    };

    if (resultadoExistenteIdx !== -1) {
      // Atualizar resultado existente
      chavesDoc.resultadosJogos[resultadoExistenteIdx] = novoResultado;
      console.log(`   ✓ Resultado atualizado: ${resultado.equipeA} ${resultado.scoreA} x ${resultado.scoreB} ${resultado.equipeB}`);
    } else {
      // Adicionar novo resultado
      chavesDoc.resultadosJogos.push(novoResultado);
      console.log(`   ✓ Novo resultado adicionado: ${resultado.equipeA} ${resultado.scoreA} x ${resultado.scoreB} ${resultado.equipeB}`);
    }

    // Atualizar timestamp geral do documento (fora do array)
    chavesDoc.updatedAt = getServerTimestamp();

    // Salvar no Firebase
    console.log(`   Salvando no Firebase...`);
    await setDocument(COLECOES.CHAVES, modalidadeId, chavesDoc, true);
    console.log(`   ✅ Salvo com sucesso no Firebase!`);

    return {
      success: true,
      data: novoResultado,
    };
  } catch (error) {
    console.error(`❌ ERRO DETALHADO ao salvar resultado do jogo:`, error);
    console.error(`   Mensagem:`, error.message);
    console.error(`   Stack:`, error.stack);
    return {
      success: false,
      error: error.message || "Erro ao salvar resultado do jogo.",
    };
  }
};

/**
 * Salva resultado de um jogo de fase eliminatória (quartas/semis/final) dentro do documento de chaves
 * @param {string} modalidadeId - ID da modalidade
 * @param {string} confrontoId - ID do confronto (ex: 'quarta-1', 'semi-2', 'final')
 * @param {string} fase - Nome da fase ('Quartas de Final', 'Semifinal', 'Final')
 * @param {Object} resultado - { equipeA, equipeB, scoreA, scoreB }
 * @returns {Promise<Object>}
 */
export const saveResultadoJogoEliminatoria = async (modalidadeId, confrontoId, fase, resultado) => {
  try {
    console.log(`💾 Salvando resultado eliminatória ${confrontoId} (${fase}) na modalidade ${modalidadeId}`);

    const chavesDoc = await getDocumentById(COLECOES.CHAVES, modalidadeId);
    if (!chavesDoc) {
      console.error(`   ❌ Chaves não encontradas para modalidade ${modalidadeId}`);
      return { success: false, error: 'Chaves não encontradas.' };
    }

    // Usar objeto em vez de array
    if (!chavesDoc.resultadosEliminatorias || Array.isArray(chavesDoc.resultadosEliminatorias)) {
      chavesDoc.resultadosEliminatorias = {};
    }

    const novo = {
      equipeA: resultado.equipeA,
      equipeB: resultado.equipeB,
      scoreA: parseInt(resultado.scoreA),
      scoreB: parseInt(resultado.scoreB),
      meta: resultado.meta || {},
      fase,
      updatedAt: new Date().toISOString(),
    };

    chavesDoc.resultadosEliminatorias[confrontoId] = novo;
    console.log(`   ✓ Resultado eliminatória salvo: ${resultado.equipeA} ${resultado.scoreA} x ${resultado.scoreB} ${resultado.equipeB}`);

    // Atualizar timestamp geral do documento
    chavesDoc.updatedAt = getServerTimestamp();

    await setDocument(COLECOES.CHAVES, modalidadeId, chavesDoc, true);

    return { success: true, data: novo };
  } catch (error) {
    console.error('❌ ERRO ao salvar resultado eliminatória:', error);
    return { success: false, error: error.message || 'Erro ao salvar resultado eliminatória.' };
  }
};

/**
 * Salva os confrontos das fases eliminatórias (quartas, semis, final)
 * @param {string} modalidadeId - ID da modalidade
 * @param {Object} confrontos - { confrontosQuartas, confrontosSemis, confrontosFinal }
 * @returns {Promise<Object>}
 */
export const saveConfrontosEliminatorias = async (modalidadeId, confrontos) => {
  try {
    console.log(`💾 Salvando confrontos eliminatórias na modalidade ${modalidadeId}`);

    const chavesDoc = await getDocumentById(COLECOES.CHAVES, modalidadeId);
    if (!chavesDoc) {
      console.error(`   ❌ Chaves não encontradas para modalidade ${modalidadeId}`);
      return { success: false, error: 'Chaves não encontradas.' };
    }

    // Salvar os confrontos no documento
    chavesDoc.confrontosQuartas = confrontos.confrontosQuartas || [];
    chavesDoc.confrontosSemis = confrontos.confrontosSemis || [];
    chavesDoc.confrontosFinal = confrontos.confrontosFinal || null;
    chavesDoc.updatedAt = getServerTimestamp();

    await setDocument(COLECOES.CHAVES, modalidadeId, chavesDoc, true);

    console.log(`   ✅ Confrontos salvos com sucesso!`);
    return { success: true, data: confrontos };
  } catch (error) {
    console.error('❌ ERRO ao salvar confrontos eliminatórias:', error);
    return { success: false, error: error.message || 'Erro ao salvar confrontos eliminatórias.' };
  }
};

/**
 * Atualiza classificação de uma chave
 * @param {string} modalidadeId - ID da modalidade
 * @param {number} chaveNumero - Número da chave
 * @param {Array} classificacao - Array de classificação
 * @returns {Promise<Object>}
 */
export const updateClassificacaoChave = async (modalidadeId, chaveNumero, classificacao) => {
  try {
    const chavesDoc = await getDocumentById(COLECOES.CHAVES, modalidadeId);
    
    if (!chavesDoc) {
      return {
        success: false,
        error: "Chaves não encontradas.",
      };
    }
    
    const chaveIndex = chavesDoc.chaves.findIndex(c => c.chaveNumero === chaveNumero);
    
    if (chaveIndex === -1) {
      return {
        success: false,
        error: "Chave não encontrada.",
      };
    }
    
    chavesDoc.chaves[chaveIndex].classificacao = classificacao;
    
    await setDocument(COLECOES.CHAVES, modalidadeId, chavesDoc, true);
    
    return {
      success: true,
    };
  } catch (error) {
    console.error(`Erro ao atualizar classificação da chave ${chaveNumero}:`, error);
    return {
      success: false,
      error: "Erro ao atualizar classificação.",
    };
  }
};

// ============================================
// RANKING
// ============================================

/**
 * Busca ranking geral ou por categoria
 * @param {string} tipo - "geral", "masculino", "feminino" ou "misto"
 * @returns {Promise<Object>}
 */
export const getRanking = async (tipo = "geral") => {
  try {
    const ranking = await getDocumentById(COLECOES.RANKING, tipo);
    
    if (!ranking) {
      return {
        success: true,
        data: {
          tipo,
          classificacao: [],
          ultimaAtualizacao: null,
        },
      };
    }
    
    return {
      success: true,
      data: ranking,
    };
  } catch (error) {
    console.error(`Erro ao buscar ranking ${tipo}:`, error);
    return {
      success: false,
      error: "Erro ao buscar ranking.",
    };
  }
};

/**
 * Recalcula e atualiza ranking geral
 * @returns {Promise<Object>}
 */
export const recalcularRankingGeral = async () => {
  try {
    // Buscar todas as equipes
    const { getEquipes } = require("./equipes");
    const equipesResult = await getEquipes();
    
    if (!equipesResult.success) {
      return equipesResult;
    }
    
    const equipes = equipesResult.data;
    
    // Ordenar por pontos
    equipes.sort((a, b) => {
      if (b.totalPontos !== a.totalPontos) {
        return b.totalPontos - a.totalPontos;
      }
      return a.numeroTurma - b.numeroTurma;
    });
    
    // Montar classificação
    const classificacao = equipes.map((equipe, index) => ({
      posicao: index + 1,
      equipeId: equipe.id,
      nomeEquipe: equipe.nome,
      totalPontos: equipe.totalPontos,
      modalidadesParticipadas: equipe.totalModalidades,
      primeirosLugares: 0, // TODO: calcular
      segundosLugares: 0,
      terceirosLugares: 0,
      pontosInscricao: equipe.inscricaoKit?.pontos || 0,
      pontosDisciplina: equipe.disciplinaOrganizacao?.pontos || 0,
      pontosPresenca: equipe.presencas?.pontos || 0,
    }));
    
    // Salvar ranking
    const ranking = {
      tipo: "geral",
      classificacao,
      totalEquipes: equipes.length,
      ultimaAtualizacao: getServerTimestamp(),
      calculadoEm: getServerTimestamp(),
    };
    
    await setDocument(COLECOES.RANKING, "geral", ranking);
    
    // Atualizar posição no documento da equipe
    for (const item of classificacao) {
      const { updateEquipe } = require("./equipes");
      await updateEquipe(item.equipeId, {
        posicaoRanking: item.posicao,
      });
    }
    
    return {
      success: true,
      data: ranking,
    };
  } catch (error) {
    console.error("Erro ao recalcular ranking geral:", error);
    return {
      success: false,
      error: "Erro ao recalcular ranking.",
    };
  }
};

export default {
  // Resultados
  getResultados,
  getResultadosPorModalidade,
  getResultadosPorEquipe,
  saveResultado,
  updateResultado,
  
  // Confrontos
  getConfrontos,
  saveResultadoConfronto,
  criarConfronto,
  
  // Chaves
  getChaves,
  saveChaves,
  saveResultadoJogoChave,
  updateClassificacaoChave,
  
  // Eliminatórias
  saveResultadoJogoEliminatoria,
  saveConfrontosEliminatorias,
  
  // Ranking
  getRanking,
  recalcularRankingGeral,
};
