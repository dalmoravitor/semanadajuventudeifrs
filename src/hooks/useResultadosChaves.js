import { useState, useEffect, useCallback } from 'react';

/**
 * Hook para gerenciar resultados de jogos de chaves
 * Mantém sincronização com resultados do Firestore via HOC
 * 
 * @param {Array} resultadosFromProps - Resultados vindos do Firestore
 * @param {Function} setResultadosFromProps - Função para atualizar resultados no HOC
 * @param {string} modalidadeId - ID da modalidade
 * @returns {Object} { getResultadoJogo, setResultadoJogo, todosResultadosChave }
 */
export function useResultadosChaves(resultadosFromProps, setResultadosFromProps, modalidadeId) {
  
  /**
   * Busca resultado de um jogo específico
   * @param {number} chaveIdx - Índice da chave
   * @param {number} jogoIdx - Índice do jogo
   * @returns {Object|null} { scoreA, scoreB } ou null
   */
  const getResultadoJogo = useCallback((chaveIdx, jogoIdx) => {
    const key = `${chaveIdx}-${jogoIdx}`;
    const resultado = resultadosFromProps?.[key] || null;
    
    console.log(`🔍 Buscando resultado ${key}:`, resultado ? `${resultado.scoreA} x ${resultado.scoreB}` : 'não encontrado');
    
    // Retorna o objeto completo (inclui meta se existir)
    return resultado ? resultado : null;
  }, [resultadosFromProps]);

  /**
   * Salva resultado de um jogo
   * @param {number} chaveIdx - Índice da chave
   * @param {number} jogoIdx - Índice do jogo
   * @param {string} equipeA - Nome da equipe A
   * @param {string} equipeB - Nome da equipe B
   * @param {number} scoreA - Placar da equipe A
   * @param {number} scoreB - Placar da equipe B
   */
  const setResultadoJogo = useCallback((chaveIdx, jogoIdx, equipeA, equipeB, scoreA, scoreB, meta = {}) => {
    const key = `${chaveIdx}-${jogoIdx}`;
    
    const novoResultado = {
      equipeA,
      equipeB,
      scoreA: Number(scoreA),
      scoreB: Number(scoreB),
      meta,
    };

    console.log('🎯 Salvando resultado do jogo:', key, novoResultado);

    setResultadosFromProps(prev => {
      const prevObj = typeof prev === 'object' && !Array.isArray(prev) ? prev : {};
      
      const updated = {
        ...prevObj,
        [key]: novoResultado
      };
      
      console.log('  ✅ Resultado salvo no estado local');
      console.log('  📊 Total de resultados:', Object.keys(updated).length);
      return updated;
    });
  }, [modalidadeId, setResultadosFromProps]);

  /**
   * Retorna todos os resultados de uma chave específica
   * @param {number} chaveIdx - Índice da chave
   * @returns {Object} { 0: { scoreA, scoreB }, 1: {...}, 2: {...} }
   */
  const todosResultadosChave = useCallback((chaveIdx) => {
    const resultadosChave = {};
    
    for (let jogoIdx = 0; jogoIdx < 3; jogoIdx++) {
      const resultado = getResultadoJogo(chaveIdx, jogoIdx);
      if (resultado) {
        resultadosChave[jogoIdx] = resultado;
      }
    }
    
    return resultadosChave;
  }, [getResultadoJogo]);

  return {
    getResultadoJogo,
    setResultadoJogo,
    todosResultadosChave
  };
}
