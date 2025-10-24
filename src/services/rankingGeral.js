// Serviço de Ranking Geral (por Equipes)
// Soma os pontos de todas as modalidades por equipe, sem distribuição por turmas

import { getModalidades } from '../api/modalidades';
import { getRankingModalidade } from '../api/ranking';

/**
 * Agrega rankings de todas as modalidades por equipe (bruto)
 * @param {Array} modalidades - [{ id, nome }]
 * @returns {Promise<Array>} Array ordenado: [{ posicao, equipeId, equipe, totalPontos, modalidades: [{modalidadeId, modalidadeNome, pontos, colocacao}] }]
 */
export async function aggregateRankingsByEquipe(modalidades = []) {
  const pontosPorEquipe = new Map();

  // Itera modalidades e soma pontos por equipe
  for (const mod of modalidades) {
    try {
      const res = await getRankingModalidade(mod.id);
      if (!res.success || !res.data || !Array.isArray(res.data.ranking)) continue;

      const ranking = res.data.ranking;
      ranking.forEach((item, idx) => {
        const equipeId = item.equipeId || item.id || item.equipe;
        const equipeNome = item.equipe || item.nome || String(equipeId);
        const pontos = Number(item.pontos) || 0;
        if (!equipeId) return;

        if (!pontosPorEquipe.has(equipeId)) {
          pontosPorEquipe.set(equipeId, {
            equipeId,
            equipe: equipeNome,
            totalPontos: 0,
            modalidades: [],
          });
        }

        const entry = pontosPorEquipe.get(equipeId);
        entry.totalPontos += pontos;
        entry.modalidades.push({
          modalidadeId: mod.id,
          modalidadeNome: mod.nome,
          pontos,
          colocacao: idx + 1,
        });
      });
    } catch (err) {
      console.error('Erro ao agregar ranking da modalidade', mod?.id, err);
    }
  }

  // Converte para array, ordena e adiciona posicao
  const lista = Array.from(pontosPorEquipe.values())
    .sort((a, b) => b.totalPontos - a.totalPontos)
    .map((e, i) => ({ ...e, posicao: i + 1 }));

  return lista;
}

/**
 * Busca modalidades e calcula o ranking geral por equipes (bruto)
 * @returns {Promise<Array>} ver aggregateRankingsByEquipe
 */
export async function fetchRankingGeralEquipes() {
  const resultModalidades = await getModalidades();
  if (!resultModalidades.success) throw new Error(resultModalidades.error || 'Erro ao carregar modalidades');
  return aggregateRankingsByEquipe(resultModalidades.data || []);
}

export default {
  aggregateRankingsByEquipe,
  fetchRankingGeralEquipes,
};
