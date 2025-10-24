/**
 * FUNÇÕES AUXILIARES PARA GERAÇÃO DE RANKING
 * 
 * Funções reutilizáveis para gerar rankings de diferentes tipos de modalidades
 */

/**
 * Gera ranking de eliminação simples (oitavas → quartas → semis → final)
 * @param {Object} confrontoFinal - Confronto da final
 * @param {Array} confrontosSemis - Confrontos das semifinais
 * @param {Array} confrontosQuartas - Confrontos das quartas
 * @param {Array} confrontosOitavas - Confrontos das oitavas
 * @param {Object} resultados - Objeto com todos os resultados
 * @param {Array} todasEquipes - Array de todas as equipes
 * @returns {Array} Ranking ordenado com { posicao, equipe, equipeId, pontos }
 */
export function gerarRankingEliminacaoSimples(confrontoFinal, confrontosSemis, confrontosQuartas, confrontosOitavas, resultados, todasEquipes = []) {
  const ranking = [];
  let pontos = 160;

  // Helper para obter equipeId
  const getEquipeId = (equipe) => {
    if (!equipe) return null;
    if (typeof equipe === 'object' && equipe.id) return equipe.id;
    if (typeof equipe === 'string') {
      const found = todasEquipes.find(eq => eq.nome === equipe);
      return found?.id || null;
    }
    return null;
  };

  // Helper para obter nome
  const getNome = (equipe) => {
    if (!equipe) return '';
    return typeof equipe === 'string' ? equipe : equipe.nome || '';
  };

  // 1º e 2º lugar (final)
  if (confrontoFinal && resultados[confrontoFinal.id]) {
    const res = resultados[confrontoFinal.id];
    const campeao = res.scoreA > res.scoreB ? confrontoFinal.equipeA : confrontoFinal.equipeB;
    const vice = res.scoreA > res.scoreB ? confrontoFinal.equipeB : confrontoFinal.equipeA;

    ranking.push({
      posicao: 1,
      equipe: getNome(campeao),
      equipeId: getEquipeId(campeao),
      pontos: pontos,
      fase: 'Campeão'
    });
    pontos -= 10;

    ranking.push({
      posicao: 2,
      equipe: getNome(vice),
      equipeId: getEquipeId(vice),
      pontos: pontos,
      fase: 'Vice-campeão'
    });
    pontos -= 10;
  }

  // 3º e 4º lugar (perdedores das semis)
  if (confrontosSemis && confrontosSemis.length === 2) {
    confrontosSemis.forEach(semi => {
      if (resultados[semi.id]) {
        const res = resultados[semi.id];
        const perdedor = res.scoreA > res.scoreB ? semi.equipeB : semi.equipeA;
        ranking.push({
          posicao: ranking.length + 1,
          equipe: getNome(perdedor),
          equipeId: getEquipeId(perdedor),
          pontos: pontos,
          fase: 'Semifinais'
        });
        pontos -= 10;
      }
    });
  }

  // 5º ao 8º lugar (perdedores das quartas)
  if (confrontosQuartas && confrontosQuartas.length === 4) {
    confrontosQuartas.forEach(quarta => {
      if (resultados[quarta.id]) {
        const res = resultados[quarta.id];
        const perdedor = res.scoreA > res.scoreB ? quarta.equipeB : quarta.equipeA;
        ranking.push({
          posicao: ranking.length + 1,
          equipe: getNome(perdedor),
          equipeId: getEquipeId(perdedor),
          pontos: pontos,
          fase: 'Quartas de Final'
        });
        pontos -= 10;
      }
    });
  }

  // 9º ao 16º lugar (perdedores das oitavas)
  if (confrontosOitavas && confrontosOitavas.length === 8) {
    confrontosOitavas.forEach(oitava => {
      if (resultados[oitava.id]) {
        const res = resultados[oitava.id];
        const perdedor = res.scoreA > res.scoreB ? oitava.equipeB : oitava.equipeA;
        ranking.push({
          posicao: ranking.length + 1,
          equipe: getNome(perdedor),
          equipeId: getEquipeId(perdedor),
          pontos: pontos,
          fase: 'Oitavas de Final'
        });
        pontos -= 10;
      }
    });
  }

  return ranking;
}

/**
 * Gera ranking de sistema de tempo (Atletismo, Gincana)
 * @param {Array} participantes - Array de participantes
 * @param {Object} tempos - Objeto com tempos { equipeId: tempo }
 * @param {Array} todasEquipes - Array de todas as equipes
 * @returns {Array} Ranking ordenado
 */
export function gerarRankingTempo(participantes, tempos, todasEquipes = []) {
  const ranking = [];
  let pontos = 160;

  // Ordenar participantes por tempo (menor = melhor)
  const participantesOrdenados = [...participantes]
    .filter(p => tempos[p.id] !== undefined && tempos[p.id] !== null && tempos[p.id] !== '')
    .sort((a, b) => {
      const tempoA = parseFloat(tempos[a.id]);
      const tempoB = parseFloat(tempos[b.id]);
      return tempoA - tempoB;
    });

  participantesOrdenados.forEach((participante, index) => {
    ranking.push({
      posicao: index + 1,
      equipe: participante.nome,
      equipeId: participante.id,
      pontos: pontos,
      tempo: tempos[participante.id]
    });
    pontos -= 10;
  });

  return ranking;
}

/**
 * Gera ranking de sistema de pontuação fixa (Culinária, Show de Talentos)
 * @param {Array} participantes - Array de participantes
 * @param {Object} avaliacoes - Objeto com avaliações { equipeId: { criterio: nota } }
 * @param {Array} todasEquipes - Array de todas as equipes
 * @returns {Array} Ranking ordenado
 */
export function gerarRankingPontuacaoFixa(participantes, avaliacoes, todasEquipes = []) {
  const ranking = [];
  let pontos = 160;

  // Calcular total de pontos de cada participante
  const participantesComTotal = participantes.map(p => {
    const notasParticipante = avaliacoes[p.id] || {};
    const total = Object.values(notasParticipante).reduce((sum, nota) => sum + (parseFloat(nota) || 0), 0);
    return {
      ...p,
      totalPontos: total
    };
  });

  // Ordenar por total de pontos (maior = melhor)
  const participantesOrdenados = participantesComTotal
    .filter(p => p.totalPontos > 0)
    .sort((a, b) => b.totalPontos - a.totalPontos);

  participantesOrdenados.forEach((participante, index) => {
    ranking.push({
      posicao: index + 1,
      equipe: participante.nome,
      equipeId: participante.id,
      pontos: pontos,
      pontuacaoTotal: participante.totalPontos
    });
    pontos -= 10;
  });

  return ranking;
}

/**
 * Gera ranking genérico baseado em um array de resultados
 * @param {Array} resultados - Array de { equipe, equipeId, pontuacao } já ordenados
 * @returns {Array} Ranking com pontos da tabela oficial
 */
export function gerarRankingGenerico(resultados) {
  const ranking = [];
  let pontos = 160;

  resultados.forEach((resultado, index) => {
    ranking.push({
      posicao: index + 1,
      equipe: resultado.equipe || resultado.nome,
      equipeId: resultado.equipeId || resultado.id,
      pontos: pontos,
      ...resultado // Preserva outros dados (pontuacao, tempo, etc)
    });
    pontos -= 10;
  });

  return ranking;
}

export default {
  gerarRankingEliminacaoSimples,
  gerarRankingTempo,
  gerarRankingPontuacaoFixa,
  gerarRankingGenerico
};
