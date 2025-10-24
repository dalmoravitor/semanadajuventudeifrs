/**
 * ========================================
 * SERVIÇO DE RANKING - ELIMINAÇÃO SIMPLES
 * ========================================
 * 
 * Calcula e persiste ranking/colocações para sistemas de eliminação simples
 */

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../api/firebase';
import { saveResultado } from '../api/resultados';

/**
 * Calcula colocação final baseada nos resultados
 * @param {Object} dados - Dados da eliminação (confrontos + resultados)
 * @returns {Array} Ranking ordenado por colocação
 */
export function calcularColocacaoEliminacao(dados) {
  const { equipes, confrontos, resultados } = dados;
  
  if (!confrontos?.final || !resultados[confrontos.final.id]) {
    return []; // Competição não finalizada
  }

  const ranking = [];
  const perdedoresPorFase = {
    oitavas: [],
    quartas: [],
    semis: [],
    final: []
  };

  // 1º e 2º lugares (final)
  const resultadoFinal = resultados[confrontos.final.id];
  const vencedorFinal = resultadoFinal.scoreA > resultadoFinal.scoreB 
    ? confrontos.final.equipeA 
    : confrontos.final.equipeB;
  const perdedorFinal = resultadoFinal.scoreA > resultadoFinal.scoreB 
    ? confrontos.final.equipeB 
    : confrontos.final.equipeA;

  ranking.push({ equipe: vencedorFinal, colocacao: 1, fase: 'Campeão' });
  ranking.push({ equipe: perdedorFinal, colocacao: 2, fase: 'Vice-campeão' });

  // 3º e 4º lugares (semis)
  if (confrontos.semis) {
    confrontos.semis.forEach(confronto => {
      const resultado = resultados[confronto.id];
      if (resultado) {
        const perdedor = resultado.scoreA > resultado.scoreB 
          ? confronto.equipeB 
          : confronto.equipeA;
        
        // Verifica se não é o perdedor da final
        if (perdedor.id !== perdedorFinal.id) {
          perdedoresPorFase.semis.push(perdedor);
        }
      }
    });
  }

  // 5º ao 8º lugares (quartas)
  if (confrontos.quartas) {
    confrontos.quartas.forEach(confronto => {
      const resultado = resultados[confronto.id];
      if (resultado) {
        const perdedor = resultado.scoreA > resultado.scoreB 
          ? confronto.equipeB 
          : confronto.equipeA;
        
        // Verifica se não avançou para semis
        const avancouSemis = confrontos.semis.some(s => 
          s.equipeA.id === perdedor.id || s.equipeB.id === perdedor.id
        );
        
        if (!avancouSemis) {
          perdedoresPorFase.quartas.push(perdedor);
        }
      }
    });
  }

  // 9º ao 16º lugares (oitavas)
  if (confrontos.oitavas) {
    confrontos.oitavas.forEach(confronto => {
      const resultado = resultados[confronto.id];
      if (resultado) {
        const perdedor = resultado.scoreA > resultado.scoreB 
          ? confronto.equipeB 
          : confronto.equipeA;
        
        // Verifica se não avançou para quartas
        const avancouQuartas = confrontos.quartas.some(q => 
          q.equipeA.id === perdedor.id || q.equipeB.id === perdedor.id
        );
        
        if (!avancouQuartas) {
          perdedoresPorFase.oitavas.push(perdedor);
        }
      }
    });
  }

  // Adicionar perdedores ao ranking
  let colocacaoAtual = 3;
  
  // 3º e 4º (perdedores das semis)
  perdedoresPorFase.semis.forEach(equipe => {
    ranking.push({ equipe, colocacao: colocacaoAtual++, fase: 'Semifinalista' });
  });

  // 5º ao 8º (perdedores das quartas)
  perdedoresPorFase.quartas.forEach(equipe => {
    ranking.push({ equipe, colocacao: colocacaoAtual++, fase: 'Quartas de Final' });
  });

  // 9º ao 16º (perdedores das oitavas)
  perdedoresPorFase.oitavas.forEach(equipe => {
    ranking.push({ equipe, colocacao: colocacaoAtual++, fase: 'Oitavas de Final' });
  });

  return ranking;
}

/**
 * Calcula pontuação baseada na colocação (tabela oficial)
 * @param {number} colocacao - Colocação da equipe (1-16)
 * @returns {number} Pontos
 */
export function calcularPontosPorColocacao(colocacao) {
  const tabelaPontos = {
    1: 160,  // 1º lugar
    2: 150,  // 2º lugar
    3: 140,  // 3º lugar
    4: 130,  // 4º lugar
    5: 120,  // 5º lugar
    6: 110,  // 6º lugar
    7: 100,  // 7º lugar
    8: 90,   // 8º lugar
    9: 80,   // 9º lugar
    10: 70,  // 10º lugar
    11: 60,  // 11º lugar
    12: 50,  // 12º lugar
    13: 40,  // 13º lugar
    14: 30,  // 14º lugar
    15: 20,  // 15º lugar
    16: 10   // 16º lugar
  };

  return tabelaPontos[colocacao] || 0;
}

/**
 * Salva ranking no Firebase e atualiza coleção de resultados
 * @param {string} modalidadeId - ID da modalidade
 * @param {Array} ranking - Array de ranking calculado
 * @returns {Promise<boolean>} Sucesso da operação
 */
export async function salvarRankingEliminacao(modalidadeId, ranking) {
  try {
    const timestamp = new Date().toISOString();

    // 1. Salvar ranking consolidado no documento da modalidade
    const rankingRef = doc(db, 'eliminacao-simples', modalidadeId);
    const docSnap = await getDoc(rankingRef);
    
    if (docSnap.exists()) {
      const dadosExistentes = docSnap.data();
      
      await setDoc(rankingRef, {
        ...dadosExistentes,
        ranking: ranking.map(item => ({
          equipeId: item.equipe.id,
          equipeNome: item.equipe.nome,
          colocacao: item.colocacao,
          fase: item.fase,
          pontos: calcularPontosPorColocacao(item.colocacao)
        })),
        rankingCalculadoEm: timestamp,
        status: 'concluido'
      });
    }

    // 2. Salvar resultados individuais na coleção "resultados"
    for (const item of ranking) {
      const pontos = calcularPontosPorColocacao(item.colocacao);
      
      await saveResultado({
        id: `${modalidadeId}_${item.equipe.id}`,
        modalidadeId,
        equipeId: item.equipe.id,
        equipeNome: item.equipe.nome,
        colocacao: item.colocacao,
        pontosGerais: pontos,
        fase: item.fase,
        sistema: 'eliminacao-simples',
        estatisticas: {
          faseEliminacao: item.fase
        },
        createdAt: timestamp,
        updatedAt: timestamp
      });
    }

    console.log(`✅ Ranking salvo: ${ranking.length} equipes classificadas`);
    return true;

  } catch (error) {
    console.error('Erro ao salvar ranking:', error);
    return false;
  }
}

/**
 * Verifica se competição está finalizada e calcula ranking automaticamente
 * @param {string} modalidadeId - ID da modalidade
 * @returns {Promise<Object|null>} Ranking calculado ou null
 */
export async function verificarECalcularRanking(modalidadeId) {
  try {
    const docRef = doc(db, 'eliminacao-simples', modalidadeId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const dados = docSnap.data();

    // Verifica se final tem resultado
    if (!dados.confrontos?.final || !dados.resultados?.[dados.confrontos.final.id]) {
      console.log('⏳ Competição ainda não finalizada');
      return null;
    }

    // Calcula ranking
    const ranking = calcularColocacaoEliminacao(dados);

    if (ranking.length === 0) {
      console.log('⚠️ Não foi possível calcular ranking');
      return null;
    }

    // Salva ranking
    await salvarRankingEliminacao(modalidadeId, ranking);

    console.log('✅ Ranking calculado e salvo automaticamente');
    return ranking;

  } catch (error) {
    console.error('Erro ao verificar e calcular ranking:', error);
    return null;
  }
}

export default {
  calcularColocacaoEliminacao,
  calcularPontosPorColocacao,
  salvarRankingEliminacao,
  verificarECalcularRanking
};
