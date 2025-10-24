/**
 * Serviço de cálculo de pontuação para chaves e eliminatórias
 * Sistema de pontos: Vitória = 3pts, Empate = 1pt, Derrota = 0pt
 */

/**
 * Calcula a classificação de uma chave baseado nos resultados dos jogos
 * @param {Array} equipes - Array com nomes das equipes ["Turma 11", "Turma 12", "Turma 13"]
 * @param {Object} resultados - Objeto com resultados {jogoIdx: {scoreA, scoreB}}
 * @returns {Array} Array de objetos com estatísticas de cada equipe, ordenado por classificação
 */
export function calcularClassificacaoChave(equipes, resultados) {
  // Inicializa estatísticas para cada equipe
  const stats = {};
  equipes.forEach((equipe) => {
    if (equipe && equipe.trim() !== "") {
      stats[equipe] = {
        nome: equipe,
        pontos: 0,
        jogos: 0,
        vitorias: 0,
        empates: 0,
        derrotas: 0,
        golsPro: 0,
        golsContra: 0,
        saldoGols: 0,
      };
    }
  });

  // Define os confrontos da chave (sempre 3 jogos)
  // Jogo 0: equipe[0] vs equipe[1]
  // Jogo 1: equipe[1] vs equipe[2]
  // Jogo 2: equipe[2] vs equipe[0]
  const confrontos = [
    { jogoIdx: 0, equipeA: equipes[0], equipeB: equipes[1] },
    { jogoIdx: 1, equipeA: equipes[1], equipeB: equipes[2] },
    { jogoIdx: 2, equipeA: equipes[2], equipeB: equipes[0] },
  ];

  // Processa cada jogo que tem resultado
  confrontos.forEach(({ jogoIdx, equipeA, equipeB }) => {
    const resultado = resultados[jogoIdx];
    if (!resultado || !equipeA || !equipeB) return;

    const { scoreA, scoreB } = resultado;

    // Atualiza estatísticas da equipe A
    if (stats[equipeA]) {
      stats[equipeA].jogos += 1;
      stats[equipeA].golsPro += scoreA;
      stats[equipeA].golsContra += scoreB;

      if (scoreA > scoreB) {
        stats[equipeA].vitorias += 1;
        stats[equipeA].pontos += 3;
      } else if (scoreA === scoreB) {
        stats[equipeA].empates += 1;
        stats[equipeA].pontos += 1;
      } else {
        stats[equipeA].derrotas += 1;
      }
    }

    // Atualiza estatísticas da equipe B
    if (stats[equipeB]) {
      stats[equipeB].jogos += 1;
      stats[equipeB].golsPro += scoreB;
      stats[equipeB].golsContra += scoreA;

      if (scoreB > scoreA) {
        stats[equipeB].vitorias += 1;
        stats[equipeB].pontos += 3;
      } else if (scoreB === scoreA) {
        stats[equipeB].empates += 1;
        stats[equipeB].pontos += 1;
      } else {
        stats[equipeB].derrotas += 1;
      }
    }
  });

  // Calcula saldo de gols
  Object.values(stats).forEach((equipe) => {
    equipe.saldoGols = equipe.golsPro - equipe.golsContra;
  });

  // Ordena por: 1º pontos, 2º saldo de gols, 3º gols pró
  const classificacao = Object.values(stats).sort((a, b) => {
    if (b.pontos !== a.pontos) return b.pontos - a.pontos;
    if (b.saldoGols !== a.saldoGols) return b.saldoGols - a.saldoGols;
    return b.golsPro - a.golsPro;
  });

  return classificacao;
}

/**
 * Calcula a classificação geral somando todas as chaves
 * @param {Array} todasChaves - Array de chaves com suas classificações
 * @returns {Array} Ranking geral ordenado
 */
export function calcularRankingGeral(todasChaves) {
  const rankingGeral = {};

  todasChaves.forEach((chave) => {
    chave.classificacao.forEach((equipe) => {
      if (!rankingGeral[equipe.nome]) {
        rankingGeral[equipe.nome] = {
          nome: equipe.nome,
          pontos: 0,
          vitorias: 0,
          empates: 0,
          derrotas: 0,
          golsPro: 0,
          golsContra: 0,
          saldoGols: 0,
        };
      }

      rankingGeral[equipe.nome].pontos += equipe.pontos;
      rankingGeral[equipe.nome].vitorias += equipe.vitorias;
      rankingGeral[equipe.nome].empates += equipe.empates;
      rankingGeral[equipe.nome].derrotas += equipe.derrotas;
      rankingGeral[equipe.nome].golsPro += equipe.golsPro;
      rankingGeral[equipe.nome].golsContra += equipe.golsContra;
      rankingGeral[equipe.nome].saldoGols += equipe.saldoGols;
    });
  });

  // Ordena ranking geral
  return Object.values(rankingGeral).sort((a, b) => {
    if (b.pontos !== a.pontos) return b.pontos - a.pontos;
    if (b.saldoGols !== a.saldoGols) return b.saldoGols - a.saldoGols;
    return b.golsPro - a.golsPro;
  });
}

/**
 * Formata pontuação para exibição
 * @param {number} pontos - Pontos da equipe
 * @returns {string} Pontos formatados
 */
export function formatarPontos(pontos) {
  return pontos === 1 ? `${pontos} ponto` : `${pontos} pontos`;
}

/**
 * Salva resultados no Firebase (implementação futura)
 * @param {string} modalidadeId - ID da modalidade
 * @param {string} chaveNome - Nome da chave (ex: "Chave A")
 * @param {Object} resultados - Resultados dos jogos
 */
export async function salvarResultadosChave(modalidadeId, chaveNome, resultados) {
  // TODO: Implementar integração com Firebase
  console.log("Salvando resultados no Firebase:", { modalidadeId, chaveNome, resultados });
  return Promise.resolve();
}

/**
 * Carrega resultados do Firebase (implementação futura)
 * @param {string} modalidadeId - ID da modalidade
 * @param {string} chaveNome - Nome da chave
 * @returns {Object} Resultados dos jogos
 */
export async function carregarResultadosChave(modalidadeId, chaveNome) {
  // TODO: Implementar integração com Firebase
  console.log("Carregando resultados do Firebase:", { modalidadeId, chaveNome });
  return Promise.resolve({});
}

/**
 * Seleciona os times classificados para as quartas de final
 * @param {Array} chaves - Array com todas as chaves e suas classificações
 * @param {boolean} tem5Chaves - Se é handebol masculino (5 chaves) ou outras modalidades (4 chaves)
 * @returns {Object} { primeiros, segundos, classificados, segundosMelhores }
 */
export function selecionarClassificados(chaves, tem5Chaves) {
  const primeiros = [];
  const segundos = [];
  
  // Extrai os primeiros e segundos colocados de cada chave
  chaves.forEach((chave, idx) => {
    if (chave.classificacao && chave.classificacao.length > 0) {
      primeiros.push({
        ...chave.classificacao[0],
        chave: chave.nome,
        chaveIdx: idx,
        posicao: 1
      });
    }
    
    if (chave.classificacao && chave.classificacao.length > 1) {
      segundos.push({
        ...chave.classificacao[1],
        chave: chave.nome,
        chaveIdx: idx,
        posicao: 2
      });
    }
  });
  
  // Ordena os segundos colocados pelos critérios de desempate
  segundos.sort((a, b) => {
    if (b.pontos !== a.pontos) return b.pontos - a.pontos;
    if (b.saldoGols !== a.saldoGols) return b.saldoGols - a.saldoGols;
    return b.golsPro - a.golsPro;
  });
  
  let classificados = [];
  let segundosMelhores = [];
  
  if (tem5Chaves) {
    // Handebol Masculino: 5 chaves → 5 primeiros + 3 melhores segundos = 8 times
    segundosMelhores = segundos.slice(0, 3);
    classificados = [...primeiros, ...segundosMelhores];
  } else {
    // Outras modalidades: 4 chaves → 4 primeiros + 4 segundos = 8 times
    segundosMelhores = segundos.slice(0, 4);
    classificados = [...primeiros, ...segundosMelhores];
  }
  
  return {
    primeiros,
    segundos,
    classificados,
    segundosMelhores
  };
}

/**
 * Gera os confrontos aleatórios das quartas de final
 * @param {Array} classificados - Array com os 8 times classificados
 * @returns {Array} Array com 4 confrontos (quartas de final)
 */
export function gerarConfrontosQuartas(classificados) {
  if (classificados.length !== 8) {
    return [];
  }
  
  // Embaralha os times de forma aleatória
  const timesEmbaralhados = [...classificados].sort(() => Math.random() - 0.5);
  
  // Cria 4 confrontos (quartas de final)
  const confrontos = [];
  for (let i = 0; i < timesEmbaralhados.length; i += 2) {
    confrontos.push({
      id: `quarta-${i / 2 + 1}`,
      equipeA: timesEmbaralhados[i],
      equipeB: timesEmbaralhados[i + 1],
      fase: 'Quartas de Final',
      jogo: i / 2 + 1
    });
  }
  
  return confrontos;
}

/**
 * Verifica se todas as chaves foram completamente jogadas
 * @param {Array} chaves - Array com todas as chaves
 * @param {Object} resultados - Objeto com todos os resultados
 * @returns {boolean} True se todas as chaves estão completas
 */
export function verificarChavesCompletas(chaves, resultados) {
  return chaves.every((chave, chaveIdx) => {
    // Cada chave tem 3 jogos (todos contra todos com 3 times)
    const jogosNecessarios = 3;
    let jogosComResultado = 0;
    
    for (let jogoIdx = 0; jogoIdx < jogosNecessarios; jogoIdx++) {
      // Suportar ambos os formatos: "0-0" (antigo) e "chave0_jogo0" (novo)
      const keyAntigo = `${chaveIdx}-${jogoIdx}`;
      const keyNovo = `chave${chaveIdx}_jogo${jogoIdx}`;
      
      // Verificar se resultados é um objeto ou array
      if (Array.isArray(resultados)) {
        // Formato novo: array de objetos com id
        if (resultados.find(r => r.id === keyNovo)) {
          jogosComResultado++;
        }
      } else if (resultados[keyAntigo] || resultados[keyNovo]) {
        // Formato antigo: objeto com chaves
        jogosComResultado++;
      }
    }
    
    return jogosComResultado === jogosNecessarios;
  });
}

/**
 * Processa os resultados das quartas e retorna os vencedores
 * @param {Array} confrontosQuartas - Array com os 4 confrontos das quartas
 * @param {Object} resultados - Resultados das quartas {confrontoId: {scoreA, scoreB}}
 * @returns {Array} Array com os 4 vencedores das quartas (ou null se não houver resultado)
 */
export function processarVencedoresQuartas(confrontosQuartas, resultados) {
  const vencedores = [];
  
  confrontosQuartas.forEach((confronto) => {
    const resultado = resultados[confronto.id];
    
    if (!resultado) {
      vencedores.push(null);
      return;
    }
    
    const { scoreA, scoreB } = resultado;
    
    // Determina o vencedor (em caso de empate, pode adicionar lógica de desempate)
    if (scoreA > scoreB) {
      vencedores.push({
        ...confronto.equipeA,
        golsQuartas: scoreA,
        adversarioQuartas: confronto.equipeB.nome,
        placarQuartas: `${scoreA} x ${scoreB}`
      });
    } else if (scoreB > scoreA) {
      vencedores.push({
        ...confronto.equipeB,
        golsQuartas: scoreB,
        adversarioQuartas: confronto.equipeA.nome,
        placarQuartas: `${scoreB} x ${scoreA}`
      });
    } else {
      // Em caso de empate, retorna null (precisa de critério de desempate)
      vencedores.push(null);
    }
  });
  
  return vencedores;
}

/**
 * Gera os confrontos das semifinais a partir dos vencedores das quartas
 * @param {Array} vencedoresQuartas - Array com os 4 vencedores das quartas
 * @returns {Array} Array com 2 confrontos (semifinais) ou vazio se não houver 4 vencedores
 */
export function gerarConfrontosSemis(vencedoresQuartas) {
  // Verifica se todos os 4 vencedores estão definidos
  const vencedoresValidos = vencedoresQuartas.filter(v => v !== null);
  
  if (vencedoresValidos.length !== 4) {
    return [];
  }
  
  // Cria 2 confrontos (semifinais)
  // Semi 1: Vencedor da Quarta 1 vs Vencedor da Quarta 4
  // Semi 2: Vencedor da Quarta 2 vs Vencedor da Quarta 3
  const confrontos = [
    {
      id: 'semi-1',
      equipeA: vencedoresQuartas[0],
      equipeB: vencedoresQuartas[3],
      fase: 'Semifinal',
      jogo: 1
    },
    {
      id: 'semi-2',
      equipeA: vencedoresQuartas[1],
      equipeB: vencedoresQuartas[2],
      fase: 'Semifinal',
      jogo: 2
    }
  ];
  
  return confrontos;
}

/**
 * Processa os resultados das semifinais e retorna os vencedores e perdedores
 * @param {Array} confrontosSemis - Array com os 2 confrontos das semifinais
 * @param {Object} resultados - Resultados das semifinais {confrontoId: {scoreA, scoreB}}
 * @returns {Object} { vencedores: [2 times], perdedores: [2 times] }
 */
export function processarVencedoresSemis(confrontosSemis, resultados) {
  const vencedores = [];
  const perdedores = [];
  
  confrontosSemis.forEach((confronto) => {
    const resultado = resultados[confronto.id];
    
    if (!resultado) {
      vencedores.push(null);
      perdedores.push(null);
      return;
    }
    
    const { scoreA, scoreB } = resultado;
    
    if (scoreA > scoreB) {
      vencedores.push({
        ...confronto.equipeA,
        golsSemi: scoreA,
        adversarioSemi: confronto.equipeB.nome,
        placarSemi: `${scoreA} x ${scoreB}`
      });
      perdedores.push({
        ...confronto.equipeB,
        golsSemi: scoreB,
        adversarioSemi: confronto.equipeA.nome,
        placarSemi: `${scoreB} x ${scoreA}`
      });
    } else if (scoreB > scoreA) {
      vencedores.push({
        ...confronto.equipeB,
        golsSemi: scoreB,
        adversarioSemi: confronto.equipeA.nome,
        placarSemi: `${scoreB} x ${scoreA}`
      });
      perdedores.push({
        ...confronto.equipeA,
        golsSemi: scoreA,
        adversarioSemi: confronto.equipeB.nome,
        placarSemi: `${scoreA} x ${scoreB}`
      });
    } else {
      // Empate - retorna null
      vencedores.push(null);
      perdedores.push(null);
    }
  });
  
  return { vencedores, perdedores };
}

/**
 * Gera os confrontos da final e disputa de 3º lugar
 * @param {Array} vencedoresSemis - Array com os 2 vencedores das semifinais
 * @param {Array} perdedoresSemis - Array com os 2 perdedores das semifinais
 * @returns {Object} { final: confronto, terceiro: confronto }
 */
export function gerarConfrontosFinais(vencedoresSemis, perdedoresSemis) {
  const vencedoresValidos = vencedoresSemis.filter(v => v !== null);
  const perdedoresValidos = perdedoresSemis.filter(p => p !== null);
  
  let final = null;
  let terceiro = null;
  
  // Gera confronto da final
  if (vencedoresValidos.length === 2) {
    final = {
      id: 'final',
      equipeA: vencedoresSemis[0],
      equipeB: vencedoresSemis[1],
      fase: 'Final',
      jogo: 1
    };
  }
  
  // Gera confronto da disputa de 3º lugar
  if (perdedoresValidos.length === 2) {
    terceiro = {
      id: 'terceiro-lugar',
      equipeA: perdedoresSemis[0],
      equipeB: perdedoresSemis[1],
      fase: 'Disputa de 3º Lugar',
      jogo: 1
    };
  }
  
  return { final, terceiro };
}
