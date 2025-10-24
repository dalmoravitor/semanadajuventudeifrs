import { useState, useEffect, useCallback } from 'react';
import { gerarChavesVazias } from '../services/chavesService';

/**
 * Hook personalizado para gerenciar estado de chaves
 * Sincroniza automaticamente com o HOC para salvamento no Firestore
 * 
 * @param {Object} chavesDataFromProps - Dados de chaves vindos do Firestore (via HOC)
 * @param {Function} setChavesDataFromProps - Função para atualizar chaves no HOC
 * @param {string} modalidadeId - ID da modalidade
 * @param {string} categoria - Categoria da modalidade
 * @returns {Object} { chaves, setChaves, resetChaves, chavesCompletas }
 */
export function useChaves(chavesDataFromProps, setChavesDataFromProps, modalidadeId, categoria) {
  // Estado local de chaves
  const [chaves, setChaves] = useState(() => {
    // Prioridade 1: Dados do Firestore
    if (chavesDataFromProps && chavesDataFromProps.chaves && chavesDataFromProps.chaves.length > 0) {
      return chavesDataFromProps.chaves;
    }
    
    // Prioridade 2: Gerar chaves vazias
    return gerarChavesVazias(categoria, modalidadeId);
  });

  // Atualizar chaves quando os dados do Firestore mudarem (após carregamento do HOC)
  useEffect(() => {
    if (chavesDataFromProps && chavesDataFromProps.chaves && chavesDataFromProps.chaves.length > 0) {
      console.log('📥 useChaves: Carregando chaves do Firestore:', chavesDataFromProps.chaves);
      setChaves(chavesDataFromProps.chaves);
    }
  }, [chavesDataFromProps]);

  // Sincronizar chaves locais com HOC sempre que mudarem
  useEffect(() => {
    if (setChavesDataFromProps) {
      setChavesDataFromProps(prev => ({
        ...prev,
        chaves: chaves,
        modalidadeId: modalidadeId
      }));
    }
  }, [chaves, setChavesDataFromProps, modalidadeId]);

  // Função para resetar chaves para o estado inicial
  const resetChaves = useCallback(() => {
    setChaves(gerarChavesVazias(categoria, modalidadeId));
  }, [categoria, modalidadeId]);

  // Verificar se todas as chaves estão completas
  const chavesCompletas = chaves.every(chave => 
    chave.equipes.every(equipe => equipe && equipe.trim() !== "")
  );

  return {
    chaves,
    setChaves,
    resetChaves,
    chavesCompletas
  };
}
