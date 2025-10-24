/**
 * SERVIÇO DE RANKING GERAL
 * Calcula o ranking geral somando pontos de todas as modalidades
 * Considera distribuição proporcional de pontos (equipes combinadas)
 */

import { getDistribuicaoPontos, getTurmasBase, EQUIPES_COMPETIDORAS, TURMAS_BASE } from '../utils/equipesMapping.js';

/**
 * Calcula o ranking geral considerando distribuição proporcional de pontos
 * @param {Array} todosRankings - Array com rankings de todas as modalidades
 * @returns {Array} Ranking geral ordenado por pontuação total
 */
export function calcularRankingGeral(todosRankings) {
  // Objeto para acumular pontos por turma base
  const pontosPorTurmaBase = {};

  // Inicializa todas as turmas base com 0 pontos
  const turmasBase = getTurmasBase();
  turmasBase.forEach(turma => {
    pontosPorTurmaBase[turma.id] = {
      turma: turma.nome,
      turmaId: turma.id,
      numero: turma.numero,
      serie: turma.serie,
      cor: turma.cor,
      totalPontos: 0,
      modalidades: [], // Array para rastrear pontos por modalidade
      equipesContribuintes: new Set() // Set para rastrear quais equipes contribuíram
    };
  });

  // Processa cada ranking de modalidade
  todosRankings.forEach(ranking => {
    if (!ranking || !ranking.ranking || !Array.isArray(ranking.ranking)) return;

    const modalidadeNome = ranking.modalidadeNome || 'Desconhecida';
    const modalidadeId = ranking.modalidadeId;

    ranking.ranking.forEach((posicao, index) => {
      const equipeId = posicao.equipeId || posicao.id;
      const pontos = posicao.pontos || 0;

      if (!equipeId) return;

      // Descobre a distribuição de pontos para essa equipe
      const distribuicao = getDistribuicaoPontos(equipeId);

      if (!distribuicao || distribuicao.length === 0) {
        console.warn(`Distribuição de pontos não encontrada para equipe: ${equipeId}`);
        return;
      }

      // Distribui os pontos proporcionalmente entre as turmas
      distribuicao.forEach(({ turmaId, percentual }) => {
        if (!pontosPorTurmaBase[turmaId]) {
          console.warn(`Turma base não encontrada: ${turmaId}`);
          return;
        }

        const pontosDistribuidos = pontos * percentual;

        // Adiciona os pontos à turma base
        pontosPorTurmaBase[turmaId].totalPontos += pontosDistribuidos;
        
        // Registra a contribuição desta modalidade
        pontosPorTurmaBase[turmaId].modalidades.push({
          modalidadeId,
          modalidadeNome,
          equipeId,
          equipeNome: posicao.equipe || posicao.nome || equipeId,
          pontosTotais: pontos,
          pontosDistribuidos: pontosDistribuidos,
          percentual: percentual,
          colocacao: index + 1
        });

        // Registra qual equipe contribuiu
        pontosPorTurmaBase[turmaId].equipesContribuintes.add(equipeId);
      });
    });
  });

  // Converte o objeto em array e ordena por pontuação
  const rankingGeral = Object.values(pontosPorTurmaBase)
    .map(turma => ({
      ...turma,
      equipesContribuintes: Array.from(turma.equipesContribuintes), // Converte Set para Array
      numeroEquipesContribuintes: turma.equipesContribuintes.size
    }))
    .sort((a, b) => {
      // Ordena por pontos (maior primeiro)
      if (b.totalPontos !== a.totalPontos) {
        return b.totalPontos - a.totalPontos;
      }
      // Desempate por número da turma (menor primeiro)
      return a.numero - b.numero;
    })
    .map((turma, index) => ({
      ...turma,
      colocacao: index + 1
    }));

  return rankingGeral;
}

/**
 * Calcula o ranking geral a partir dos dados do Firestore
 * @param {Array} modalidades - Array com todas as modalidades
 * @returns {Promise<Array>} Ranking geral calculado
 */
export async function calcularRankingGeralFromFirestore(modalidades) {
  const { getRankingModalidade } = await import('../api/ranking.js');

  const todosRankings = [];

  // Busca o ranking de cada modalidade
  for (const modalidade of modalidades) {
    try {
      const result = await getRankingModalidade(modalidade.id);
      if (result.success && result.data && result.data.ranking) {
        todosRankings.push({
          modalidadeId: modalidade.id,
          modalidadeNome: modalidade.nome,
          categoria: modalidade.categoria,
          ranking: result.data.ranking
        });
      }
    } catch (error) {
      console.error(`Erro ao buscar ranking da modalidade ${modalidade.id}:`, error);
    }
  }

  return calcularRankingGeral(todosRankings);
}

/**
 * Exporta o ranking detalhado por equipe (para visualização administrativa)
 * Mostra cada equipe secundária e para onde seus pontos vão
 * @param {Array} rankingGeral - Ranking geral calculado
 * @returns {Array} Ranking detalhado por equipe
 */
export function getRankingDetalhado(rankingGeral) {
  const detalhado = [];

  rankingGeral.forEach(turmaBase => {
    // Adiciona a turma base
    detalhado.push({
      tipo: 'turmaBase',
      turmaId: turmaBase.turmaId,
      turma: turmaBase.turma,
      numero: turmaBase.numero,
      serie: turmaBase.serie,
      cor: turmaBase.cor,
      totalPontos: turmaBase.totalPontos,
      colocacao: turmaBase.colocacao,
      equipesContribuintes: turmaBase.equipesContribuintes
    });

    // Adiciona detalhes de cada equipe que contribui
    turmaBase.equipesContribuintes.forEach(equipeId => {
      const equipe = EQUIPES_COMPETIDORAS[equipeId];
      const modalidadesEquipe = turmaBase.modalidades.filter(m => m.equipeId === equipeId);
      const pontosEquipe = modalidadesEquipe.reduce((sum, m) => sum + m.pontosDistribuidos, 0);

      detalhado.push({
        tipo: 'equipeContribuinte',
        equipeId: equipe?.id || equipeId,
        equipeNome: equipe?.nome || equipeId,
        turmaBaseId: turmaBase.turmaId,
        turmaBase: turmaBase.turma,
        pontos: pontosEquipe,
        modalidades: modalidadesEquipe
      });
    });
  });

  return detalhado;
}

/**
 * Verifica se uma mudança no mapeamento (ex: 23/24 ou 32/33) afeta o ranking
 * @param {string} equipeSecundariaId - ID da equipe secundária a ser remapeada
 * @param {string} novaTurmaBaseId - ID da nova turma base
 * @param {Array} rankingGeral - Ranking geral atual
 * @returns {Object} Simulação do novo ranking
 */
export function simularMudancaMapeamento(equipeSecundariaId, novaTurmaBaseId, rankingGeral) {
  // Encontra a turma base atual
  const equipeSec = EQUIPES_COMPETIDORAS[equipeSecundariaId];
  if (!equipeSec) {
    return { erro: 'Equipe secundária não encontrada' };
  }

  const distribuicaoAtual = equipeSec.distribuicaoPontos;

  // Calcula pontos totais da equipe secundária
  let pontosEquipe = 0;
  const turmasAfetadas = [];

  distribuicaoAtual.forEach(({ turmaId }) => {
    const turma = rankingGeral.find(t => t.turmaId === turmaId);
    if (turma) {
      const pontosNestaTurma = turma.modalidades
        .filter(m => m.equipeId === equipeSecundariaId)
        .reduce((sum, m) => sum + m.pontosDistribuidos, 0);
      pontosEquipe += pontosNestaTurma;
      turmasAfetadas.push({ turmaId, pontos: pontosNestaTurma });
    }
  });

  // Simula o novo ranking (removendo pontos das turmas atuais e adicionando à nova)
  const novoRanking = rankingGeral.map(turma => {
    const afetada = turmasAfetadas.find(t => t.turmaId === turma.turmaId);
    
    if (afetada) {
      // Remove pontos da turma base atual
      return {
        ...turma,
        totalPontos: turma.totalPontos - afetada.pontos
      };
    } else if (turma.turmaId === novaTurmaBaseId) {
      // Adiciona pontos à nova turma base
      return {
        ...turma,
        totalPontos: turma.totalPontos + pontosEquipe
      };
    }
    return turma;
  }).sort((a, b) => b.totalPontos - a.totalPontos);

  return {
    equipeSecundaria: equipeSec.nome,
    pontosMovidos: pontosEquipe,
    turmasAtuais: turmasAfetadas.map(t => t.turmaId),
    novaTurmaBase: novaTurmaBaseId,
    rankingSimulado: novoRanking
  };
}

export default {
  calcularRankingGeral,
  calcularRankingGeralFromFirestore,
  getRankingDetalhado,
  simularMudancaMapeamento
};
