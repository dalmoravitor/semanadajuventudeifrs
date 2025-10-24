/**
 * MAPEAMENTO DE EQUIPES E TURMAS
 * 
 * NOVA ESTRUTURA SIMPLIFICADA:
 * - 16 turmas principais no ranking (11, 12, 13, 14, 21, 22, 23, 24, 31, 32, 33, 34, TI11, TI12, TI21, TI22)
 * - Equipes combinadas distribuem 100% dos pontos para CADA turma
 * - Não diferencia mais masculino/feminino nas equipes
 * 
 * LÓGICA:
 * - Equipes simples (ex: "Turma 11"): 100% dos pontos para uma turma
 * - Equipes combinadas (ex: "Turma 12/13"): 100% dos pontos para CADA uma das turmas
 *   → Se "Turma 12/13" fica em 1º (160pts), Turma 12 recebe 160pts E Turma 13 recebe 160pts
 *   → No ranking aparecem "Turma 12" e "Turma 13" separadamente, não "Turma 12/13"
 */

/**
 * Mapeamento de equipes que competem
 */

export const EQUIPES_COMPETIDORAS = {
  // ========================================
  // 1º ANO - ENSINO MÉDIO
  // ========================================
  
  "turma_11": {
    id: "turma_11",
    nome: "Turma 11",
    numero: 11,
    serie: "1º Ano",
    cor: "#ff6b6b",
    distribuicaoPontos: [{ turmaId: "turma_11", percentual: 1.0 }]
  },

  "turma_12": {
    id: "turma_12",
    nome: "Turma 12",
    numero: 12,
    serie: "1º Ano",
    cor: "#4ecdc4",
    distribuicaoPontos: [{ turmaId: "turma_12", percentual: 1.0 }]
  },

  "turma_1213": {
    id: "turma_1213",
    nome: "Turma 12/13",
    numero: 1213,
    serie: "1º Ano",
    cor: "#4ecdc4",
    distribuicaoPontos: [
      { turmaId: "turma_12", percentual: 1.0 },
      { turmaId: "turma_13", percentual: 1.0 }
    ]
  },

  "turma_1214": {
    id: "turma_1214",
    nome: "Turma 12/14",
    numero: 1214,
    serie: "1º Ano",
    cor: "#4ecdc4",
    distribuicaoPontos: [
      { turmaId: "turma_12", percentual: 1.0 },
      { turmaId: "turma_14", percentual: 1.0 }
    ]
  },

  "turma_13": {
    id: "turma_13",
    nome: "Turma 13",
    numero: 13,
    serie: "1º Ano",
    cor: "#45b7d1",
    distribuicaoPontos: [{ turmaId: "turma_13", percentual: 1.0 }]
  },

  "turma_14": {
    id: "turma_14",
    nome: "Turma 14",
    numero: 14,
    serie: "1º Ano",
    cor: "#45b7d1",
    distribuicaoPontos: [{ turmaId: "turma_14", percentual: 1.0 }]
  },

  // ========================================
  // 2º ANO - ENSINO MÉDIO
  // ========================================
  
  "turma_21": {
    id: "turma_21",
    nome: "Turma 21",
    numero: 21,
    serie: "2º Ano",
    cor: "#f9ca24",
    distribuicaoPontos: [{ turmaId: "turma_21", percentual: 1.0 }]
  },

  "turma_22": {
    id: "turma_22",
    nome: "Turma 22",
    numero: 22,
    serie: "2º Ano",
    cor: "#f0932b",
    distribuicaoPontos: [{ turmaId: "turma_22", percentual: 1.0 }]
  },

  "turma_23": {
    id: "turma_23",
    nome: "Turma 23",
    numero: 23,
    serie: "2º Ano",
    cor: "#eb4d4b",
    distribuicaoPontos: [{ turmaId: "turma_23", percentual: 1.0 }]
  },

  "turma_2324": {
    id: "turma_2324",
    nome: "Turma 23/24",
    numero: 2324,
    serie: "2º Ano",
    cor: "#eb4d4b",
    distribuicaoPontos: [
      { turmaId: "turma_23", percentual: 1.0 },
      { turmaId: "turma_24", percentual: 1.0 }
    ]
  },

  "turma_24": {
    id: "turma_24",
    nome: "Turma 24",
    numero: 24,
    serie: "2º Ano",
    cor: "#e74c3c",
    distribuicaoPontos: [{ turmaId: "turma_24", percentual: 1.0 }]
  },

  // ========================================
  // 3º ANO - ENSINO MÉDIO
  // ========================================
  
  "turma_31": {
    id: "turma_31",
    nome: "Turma 31",
    numero: 31,
    serie: "3º Ano",
    cor: "#6c5ce7",
    distribuicaoPontos: [{ turmaId: "turma_31", percentual: 1.0 }]
  },

  "turma_32": {
    id: "turma_32",
    nome: "Turma 32",
    numero: 32,
    serie: "3º Ano",
    cor: "#a29bfe",
    distribuicaoPontos: [{ turmaId: "turma_32", percentual: 1.0 }]
  },

  "turma_3233": {
    id: "turma_3233",
    nome: "Turma 32/33",
    numero: 3233,
    serie: "3º Ano",
    cor: "#a29bfe",
    distribuicaoPontos: [
      { turmaId: "turma_32", percentual: 1.0 },
      { turmaId: "turma_33", percentual: 1.0 }
    ]
  },

  "turma_33": {
    id: "turma_33",
    nome: "Turma 33",
    numero: 33,
    serie: "3º Ano",
    cor: "#fd79a8",
    distribuicaoPontos: [{ turmaId: "turma_33", percentual: 1.0 }]
  },

  "turma_34": {
    id: "turma_34",
    nome: "Turma 34",
    numero: 34,
    serie: "3º Ano",
    cor: "#e84393",
    distribuicaoPontos: [{ turmaId: "turma_34", percentual: 1.0 }]
  },

  // ========================================
  // TÉCNICO INTEGRADO
  // ========================================
  
  "turma_ti11": {
    id: "turma_ti11",
    nome: "Turma TI11",
    numero: 1011,
    serie: "TI - 1º Ano",
    cor: "#00b894",
    distribuicaoPontos: [{ turmaId: "turma_ti11", percentual: 1.0 }]
  },

  "turma_ti1112": {
    id: "turma_ti1112",
    nome: "Turma TI11/12",
    numero: 101112,
    serie: "TI - 1º Ano",
    cor: "#00b894",
    distribuicaoPontos: [
      { turmaId: "turma_ti11", percentual: 1.0 },
      { turmaId: "turma_ti12", percentual: 1.0 }
    ]
  },

  "turma_ti12": {
    id: "turma_ti12",
    nome: "Turma TI12",
    numero: 1012,
    serie: "TI - 1º Ano",
    cor: "#00cec9",
    distribuicaoPontos: [{ turmaId: "turma_ti12", percentual: 1.0 }]
  },

  "turma_ti21": {
    id: "turma_ti21",
    nome: "Turma TI21",
    numero: 1021,
    serie: "TI - 2º Ano",
    cor: "#0984e3",
    distribuicaoPontos: [{ turmaId: "turma_ti21", percentual: 1.0 }]
  },

  "turma_ti22": {
    id: "turma_ti22",
    nome: "Turma TI22",
    numero: 1022,
    serie: "TI - 2º Ano",
    cor: "#74b9ff",
    distribuicaoPontos: [{ turmaId: "turma_ti22", percentual: 1.0 }]
  },
};

/**
 * Turmas base para o ranking geral
 * Estas são as 16 turmas que aparecem no ranking final
 */
export const TURMAS_BASE = {
  // 1º Ano
  "turma_11": { id: "turma_11", nome: "Turma 11", numero: 11, serie: "1º Ano", cor: "#ff6b6b" },
  "turma_12": { id: "turma_12", nome: "Turma 12", numero: 12, serie: "1º Ano", cor: "#4ecdc4" },
  "turma_13": { id: "turma_13", nome: "Turma 13", numero: 13, serie: "1º Ano", cor: "#45b7d1" },
  "turma_14": { id: "turma_14", nome: "Turma 14", numero: 14, serie: "1º Ano", cor: "#45b7d1" },
  
  // 2º Ano
  "turma_21": { id: "turma_21", nome: "Turma 21", numero: 21, serie: "2º Ano", cor: "#f9ca24" },
  "turma_22": { id: "turma_22", nome: "Turma 22", numero: 22, serie: "2º Ano", cor: "#f0932b" },
  "turma_23": { id: "turma_23", nome: "Turma 23", numero: 23, serie: "2º Ano", cor: "#eb4d4b" },
  "turma_24": { id: "turma_24", nome: "Turma 24", numero: 24, serie: "2º Ano", cor: "#e74c3c" },
  
  // 3º Ano
  "turma_31": { id: "turma_31", nome: "Turma 31", numero: 31, serie: "3º Ano", cor: "#6c5ce7" },
  "turma_32": { id: "turma_32", nome: "Turma 32", numero: 32, serie: "3º Ano", cor: "#a29bfe" },
  "turma_33": { id: "turma_33", nome: "Turma 33", numero: 33, serie: "3º Ano", cor: "#fd79a8" },
  "turma_34": { id: "turma_34", nome: "Turma 34", numero: 34, serie: "3º Ano", cor: "#e84393" },
  
  // Técnico Integrado
  "turma_ti11": { id: "turma_ti11", nome: "Turma TI11", numero: 1011, serie: "TI - 1º Ano", cor: "#00b894" },
  "turma_ti12": { id: "turma_ti12", nome: "Turma TI12", numero: 1012, serie: "TI - 1º Ano", cor: "#00cec9" },
  "turma_ti21": { id: "turma_ti21", nome: "Turma TI21", numero: 1021, serie: "TI - 2º Ano", cor: "#0984e3" },
  "turma_ti22": { id: "turma_ti22", nome: "Turma TI22", numero: 1022, serie: "TI - 2º Ano", cor: "#74b9ff" },
};

/**
 * Retorna a distribuição de pontos de uma equipe
 * @param {string} equipeId - ID da equipe
 * @returns {Array} Array de objetos {turmaId, percentual}
 */
export function getDistribuicaoPontos(equipeId) {
  const equipe = EQUIPES_COMPETIDORAS[equipeId];
  return equipe ? equipe.distribuicaoPontos : [];
}

/**
 * Retorna todas as equipes que competem
 * @returns {Array} Array de objetos das equipes competidoras
 */
export function getEquipesCompetidoras() {
  return Object.values(EQUIPES_COMPETIDORAS);
}

/**
 * Retorna todas as turmas base (para o ranking)
 * @returns {Array} Array de objetos das turmas base
 */
export function getTurmasBase() {
  return Object.values(TURMAS_BASE);
}

/**
 * Retorna as equipes que devem aparecer para uma modalidade específica
 * @param {string} categoria - 'masculino', 'feminino' ou 'misto' (mantido para compatibilidade)
 * @returns {Array} Array de objetos das equipes
 */
export function getEquipesPorCategoria(categoria) {
  // Retorna todas as equipes, pois não diferenciamos mais por gênero
  return Object.values(EQUIPES_COMPETIDORAS);
}

/**
 * Verifica se uma equipe é combinada (ex: "32/33", "TI11/TI12")
 * @param {string} equipeId - ID da equipe
 * @returns {boolean}
 */
export function isEquipeCombinada(equipeId) {
  const equipe = EQUIPES_COMPETIDORAS[equipeId];
  return equipe && equipe.distribuicaoPontos.length > 1;
}

/**
 * Retorna informações sobre a distribuição de pontos de uma equipe
 * @param {string} equipeId - ID da equipe
 * @returns {Object} Objeto com informações detalhadas
 */
export function getInfoDistribuicao(equipeId) {
  const equipe = EQUIPES_COMPETIDORAS[equipeId];
  if (!equipe) return null;

  return {
    equipeId: equipe.id,
    equipeNome: equipe.nome,
    isCombinada: equipe.distribuicaoPontos.length > 1,
    turmasDestino: equipe.distribuicaoPontos.map(d => TURMAS_BASE[d.turmaId]?.nome || d.turmaId),
    distribuicao: equipe.distribuicaoPontos.map(d => ({
      turmaId: d.turmaId,
      turmaNome: TURMAS_BASE[d.turmaId]?.nome || d.turmaId,
      percentual: d.percentual,
      percentualFormatado: `${(d.percentual * 100).toFixed(0)}%`
    }))
  };
}

/**
 * Compatibilidade com código anterior
 * @deprecated Use getEquipesPorCategoria()
 */
export function getTurmaBase(equipeId) {
  const equipe = EQUIPES_COMPETIDORAS[equipeId];
  if (!equipe || !equipe.distribuicaoPontos || equipe.distribuicaoPontos.length === 0) {
    return equipeId;
  }
  // Retorna a primeira turma da distribuição (para compatibilidade)
  return equipe.distribuicaoPontos[0].turmaId;
}

/**
 * Compatibilidade com código anterior
 * @deprecated Use getEquipesCompetidoras()
 */
export function getEquipesSecundarias() {
  return getEquipesCompetidoras();
}

/**
 * Compatibilidade com código anterior
 * @deprecated Use getEquipesFilhas() não é mais aplicável
 */
export function getEquipesFilhas(turmaBaseId) {
  return getEquipesCompetidoras()
    .filter(e => e.distribuicaoPontos.some(d => d.turmaId === turmaBaseId))
    .map(e => e.id);
}

/**
 * Exporta lista simplificada para compatibilidade com código anterior
 * @deprecated Use getEquipesPorCategoria()
 */
export function getEquipasLegacy() {
  const masculino = getEquipesPorCategoria('masculino');
  const feminino = getEquipesPorCategoria('feminino');
  
  return {
    equipasMasculinoMisto: masculino,
    equipasFeminino: feminino,
    equipasPadrao: [...masculino, ...feminino]
  };
}

// Mantém compatibilidade com código antigo
export const MAPEAMENTO_EQUIPES = EQUIPES_COMPETIDORAS;
