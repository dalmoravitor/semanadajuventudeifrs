import { getDocumentById, setDocument, getServerTimestamp } from './helpers';

const COLECOES = {
  RANKING: 'ranking'
};

/**
 * Salva o ranking final de uma modalidade
 * @param {string} modalidadeId - ID da modalidade
 * @param {Array} ranking - Array de objetos { posicao, equipe, equipeId, pontos }
 * @returns {Promise<Object>} { success, data?, error? }
 */
export const saveRankingModalidade = async (modalidadeId, ranking) => {
  try {
    console.log(`💾 Salvando ranking da modalidade ${modalidadeId}`);
    console.log(`   Rankings:`, ranking);

    const rankingDoc = {
      modalidadeId,
      ranking: ranking.map((item, index) => ({
        posicao: index + 1,
        equipe: item.equipe || item.equipeNome, // Nome da equipe
        equipeId: item.equipeId || item.id, // ID da equipe (IMPORTANTE para o ranking geral)
        pontos: item.pontos
      })),
      updatedAt: getServerTimestamp(),
      createdAt: getServerTimestamp()
    };

    await setDocument(COLECOES.RANKING, modalidadeId, rankingDoc, true);
    console.log(`   ✅ Ranking salvo com sucesso!`);

    return {
      success: true,
      data: rankingDoc
    };
  } catch (error) {
    console.error(`❌ Erro ao salvar ranking:`, error);
    return {
      success: false,
      error: error.message || 'Erro ao salvar ranking.'
    };
  }
};

/**
 * Busca o ranking de uma modalidade
 * @param {string} modalidadeId - ID da modalidade
 * @returns {Promise<Object>} { success, data?, error? }
 */
export const getRankingModalidade = async (modalidadeId) => {
  try {
    const rankingDoc = await getDocumentById(COLECOES.RANKING, modalidadeId);
    
    if (!rankingDoc) {
      return {
        success: true,
        data: null
      };
    }

    return {
      success: true,
      data: rankingDoc
    };
  } catch (error) {
    console.error(`❌ Erro ao buscar ranking:`, error);
    return {
      success: false,
      error: error.message || 'Erro ao buscar ranking.'
    };
  }
};

/**
 * Gera ranking baseado na classificação final da modalidade
 * 1º lugar = 160 pontos, reduz de 10 em 10 até o último
 * @param {Object} classificacaoFinal - { campeao, vice, terceiro, quarto, eliminadosQuartas[], eliminadosChaves[] }
 * @param {Array} todasEquipes - Array de todas as equipes para obter o equipeId (opcional)
 * @returns {Array} Ranking ordenado com { posicao, equipe, equipeId, pontos }
 */
export const gerarRanking = (classificacaoFinal, todasEquipes = []) => {
  const { campeao, vice, terceiro, quarto, eliminadosQuartas = [], eliminadosChaves = [] } = classificacaoFinal;
  
  // Helper para obter equipeId a partir do nome
  const getEquipeId = (nomeEquipe) => {
    if (!nomeEquipe) return null;
    
    // Se já for um objeto com id, retornar o id
    if (typeof nomeEquipe === 'object' && nomeEquipe.id) {
      return nomeEquipe.id;
    }
    
    // Se for string, buscar na lista de todas as equipes
    if (typeof nomeEquipe === 'string') {
      const equipe = todasEquipes.find(eq => eq.nome === nomeEquipe);
      return equipe?.id || null;
    }
    
    return null;
  };

  // Helper para obter nome da equipe
  const getNomeEquipe = (equipe) => {
    if (!equipe) return '';
    return typeof equipe === 'string' ? equipe : equipe.nome || '';
  };
  
  const ranking = [];
  let pontos = 160;

  // 1º - Campeão
  if (campeao) {
    ranking.push({ 
      posicao: 1, 
      equipe: getNomeEquipe(campeao),
      equipeId: getEquipeId(campeao),
      pontos 
    });
    pontos -= 10;
  }

  // 2º - Vice
  if (vice) {
    ranking.push({ 
      posicao: 2, 
      equipe: getNomeEquipe(vice),
      equipeId: getEquipeId(vice),
      pontos 
    });
    pontos -= 10;
  }

  // 3º - Terceiro lugar
  if (terceiro) {
    ranking.push({ 
      posicao: 3, 
      equipe: getNomeEquipe(terceiro),
      equipeId: getEquipeId(terceiro),
      pontos 
    });
    pontos -= 10;
  }

  // 4º - Quarto lugar
  if (quarto) {
    ranking.push({ 
      posicao: 4, 
      equipe: getNomeEquipe(quarto),
      equipeId: getEquipeId(quarto),
      pontos 
    });
    pontos -= 10;
  }

  // 5º ao 8º - Eliminados nas quartas (perdedores das quartas)
  eliminadosQuartas.forEach((equipe, index) => {
    ranking.push({ 
      posicao: 5 + index, 
      equipe: getNomeEquipe(equipe),
      equipeId: getEquipeId(equipe),
      pontos 
    });
    pontos -= 10;
  });

  // 9º ao 12º - Eliminados nas chaves (não classificados)
  eliminadosChaves.forEach((equipe, index) => {
    ranking.push({ 
      posicao: 9 + index, 
      equipe: getNomeEquipe(equipe),
      equipeId: getEquipeId(equipe),
      pontos 
    });
    pontos -= 10;
  });

  return ranking;
};
