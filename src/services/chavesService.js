/**
 * Service para gerenciar lógica de chaves e eliminatórias
 */

/**
 * Gera chaves vazias baseado na modalidade
 * @param {string} categoria - Categoria da modalidade (masculino, feminino, misto)
 * @param {string} modalidadeId - ID da modalidade
 * @returns {Array} Array de chaves com estrutura padrão
 */
export function gerarChavesVazias(categoria, modalidadeId) {
  // Masculino: 5 chaves (15 equipes)
  // Feminino: 4 chaves (12 equipes)
  // Misto: 4 chaves (padrão)
  const numChaves = categoria === "masculino" ? 5 : 4;
  const letras = ["A", "B", "C", "D", "E"];
  
  return Array.from({ length: numChaves }, (_, i) => ({
    nome: `Chave ${letras[i]}`,
    equipes: ["", "", ""] // 3 equipes por chave
  }));
}

/**
 * Verifica se todas as equipes de uma chave estão preenchidas
 * @param {Object} chave - Objeto de chave
 * @returns {boolean}
 */
export function chaveEstaCompleta(chave) {
  return chave.equipes.every(equipe => equipe && equipe.trim() !== "");
}

/**
 * Verifica se todas as chaves estão completas
 * @param {Array} chaves - Array de chaves
 * @returns {boolean}
 */
export function todasChavesCompletas(chaves) {
  if (!Array.isArray(chaves) || chaves.length === 0) return false;
  return chaves.every(chave => chaveEstaCompleta(chave));
}

/**
 * Calcula classificação de uma chave baseado nos resultados
 * @param {Array} equipes - Array com nomes das equipes
 * @param {Object} resultados - Objeto com resultados dos jogos { jogoIdx: { scoreA, scoreB } }
 * @returns {Array} Array de equipes ordenadas por classificação
 */
export function calcularClassificacaoChave(equipes, resultados, options = {}) {
  const modalidade = (options.modalidade || '').toLowerCase();
  const isVoleiPraia = modalidade.includes('praia');
  const isVolei = modalidade.includes('vôlei') || modalidade.includes('volei');
  const isFutsal = modalidade.includes('futsal');
  const isHandebol = modalidade.includes('handebol');
  const isCaboGuerra = modalidade.includes('cabo') && modalidade.includes('guerra');
  const isMortalKombat = modalidade.includes('mortal') || modalidade.includes('kombat');
  const isFifa = modalidade.includes('fifa');
  const isBasquete = modalidade.includes('basquete');
  // Criar estrutura inicial para cada equipe
  const classificacao = equipes.map(nome => ({
    nome,
    pontos: 0,
    jogos: 0,
    vitorias: 0,
    empates: 0,
    derrotas: 0,
    golsPro: 0,
    golsContra: 0,
    saldoGols: 0,
    // métricas adicionais
    disciplinaTotal: 0,
    disciplinaMedia: 0,
    setsPontosFeitos: 0,
    setsPontosSofridos: 0,
    setsAverage: 0,
    mediaGolsFeitos: 0,
    mediaGolsSofridos: 0,
    desclassificada: false,
  }));

  // Mapear índices das equipes
  const jogosMap = [
    { idx1: 0, idx2: 1 }, // Jogo 0: Equipe 0 vs Equipe 1
    { idx1: 1, idx2: 2 }, // Jogo 1: Equipe 1 vs Equipe 2
    { idx1: 2, idx2: 0 }  // Jogo 2: Equipe 2 vs Equipe 0
  ];

  // Processar cada jogo
  Object.keys(resultados).forEach(jogoIdx => {
    const resultado = resultados[jogoIdx];
    const jogo = jogosMap[parseInt(jogoIdx)];
    
    if (!jogo || !resultado) return;

    const { idx1, idx2 } = jogo;
    const { scoreA, scoreB, meta = {} } = resultado;

    // Atualizar estatísticas da equipe A
    classificacao[idx1].jogos++;
    classificacao[idx1].golsPro += scoreA;
    classificacao[idx1].golsContra += scoreB;

    // Atualizar estatísticas da equipe B
    classificacao[idx2].jogos++;
    classificacao[idx2].golsPro += scoreB;
    classificacao[idx2].golsContra += scoreA;

    // Determinar resultado
    if (scoreA > scoreB) {
      // Vitória da equipe A
      classificacao[idx1].vitorias++;
      classificacao[idx1].pontos += 3;
      classificacao[idx2].derrotas++;
    } else if (scoreB > scoreA) {
      // Vitória da equipe B
      classificacao[idx2].vitorias++;
      classificacao[idx2].pontos += 3;
      classificacao[idx1].derrotas++;
    } else {
      // Empate
      classificacao[idx1].empates++;
      classificacao[idx1].pontos += 1;
      classificacao[idx2].empates++;
      classificacao[idx2].pontos += 1;
    }

    // Disciplina por jogo (amarelo=1, vermelho=3, exclusao2=2 quando aplicável)
    const dA = meta.disciplinaA || {};
    const dB = meta.disciplinaB || {};
    const exclusaoPeso = (isHandebol || isBasquete) ? 2 : 0; // somente onde existir exclusão 2min
    const pontosDiscA = (Number(dA.amarelo)||0) * 1 + (Number(dA.vermelho)||0) * 3 + (Number(dA.exclusao2)||0) * exclusaoPeso;
    const pontosDiscB = (Number(dB.amarelo)||0) * 1 + (Number(dB.vermelho)||0) * 3 + (Number(dB.exclusao2)||0) * exclusaoPeso;
    classificacao[idx1].disciplinaTotal += pontosDiscA;
    classificacao[idx2].disciplinaTotal += pontosDiscB;

    // Volei/volei de praia: pontos de sets informados no meta
    const setsA = Number(meta.setsPontosA) || 0;
    const setsB = Number(meta.setsPontosB) || 0;
    classificacao[idx1].setsPontosFeitos += setsA;
    classificacao[idx1].setsPontosSofridos += setsB;
    classificacao[idx2].setsPontosFeitos += setsB;
    classificacao[idx2].setsPontosSofridos += setsA;

    // Cabo de Guerra: desclassificação se soltou corda
    if (isCaboGuerra) {
      if (meta.soltouCordaA) classificacao[idx1].desclassificada = true;
      if (meta.soltouCordaB) classificacao[idx2].desclassificada = true;
    }
  });

  // Calcular saldo de gols
  classificacao.forEach(equipe => {
    equipe.saldoGols = equipe.golsPro - equipe.golsContra;
    equipe.mediaGolsFeitos = equipe.jogos > 0 ? equipe.golsPro / equipe.jogos : 0;
    equipe.mediaGolsSofridos = equipe.jogos > 0 ? equipe.golsContra / equipe.jogos : 0;
    equipe.disciplinaMedia = equipe.jogos > 0 ? equipe.disciplinaTotal / equipe.jogos : 0;
    equipe.setsAverage = (equipe.setsPontosSofridos > 0) 
      ? (equipe.setsPontosFeitos / equipe.setsPontosSofridos)
      : (equipe.setsPontosFeitos > 0 ? Infinity : 0);
  });

  // Se Cabo de Guerra e desclassificada, zera pontos
  if (isCaboGuerra) {
    classificacao.forEach(eq => {
      if (eq.desclassificada) {
        eq.pontos = 0;
      }
    });
  }

  // Helper: confronto direto (entre duas equipes)
  const headToHead = (a, b) => {
    // Mapear quem é quem nos jogos
    const partidas = [
      { idx1: 0, idx2: 1 },
      { idx1: 1, idx2: 2 },
      { idx1: 2, idx2: 0 }
    ];
    for (let j = 0; j < partidas.length; j++) {
      const r = resultados[j];
      if (!r) continue;
      const nomes = [equipes[partidas[j].idx1], equipes[partidas[j].idx2]];
      if ((r.equipeA === a.nome && r.equipeB === b.nome) || (r.equipeA === b.nome && r.equipeB === a.nome)) {
        if (r.scoreA > r.scoreB) return r.equipeA === a.nome ? -1 : 1;
        if (r.scoreB > r.scoreA) return r.equipeB === a.nome ? -1 : 1;
        return 0;
      }
    }
    return 0;
  };

  // Escolher ordem de desempate por modalidade
  let criterios = [];
  if (isVoleiPraia) {
    criterios = ['head2head', 'vitorias-desc', 'pontos-average-desc', 'sorteio'];
  } else if (isVolei) {
    criterios = ['head2head', 'disc-media-asc', 'sets-sofridos-total-asc', 'sets-feitos-total-desc', 'sorteio'];
  } else if (isFutsal) {
    criterios = ['head2head', 'disc-media-asc', 'gols-sofridos-media-asc', 'gols-feitos-media-desc', 'sorteio'];
  } else if (isHandebol) {
    criterios = ['head2head', 'disc-media-asc', 'gols-sofridos-media-asc', 'gols-feitos-media-desc', 'sorteio'];
  } else if (isFifa) {
    criterios = ['head2head', 'saldo-desc', 'gols-feitos-media-desc', 'gols-sofridos-media-asc', 'sorteio'];
  } else if (isBasquete) {
    criterios = ['head2head', 'disc-media-asc', 'gols-sofridos-media-asc', 'gols-feitos-media-desc', 'sorteio'];
  } else if (isMortalKombat) {
    criterios = ['head2head', 'sorteio'];
  } else if (isCaboGuerra) {
    criterios = ['sorteio'];
  } else {
    // padrão antigo
    criterios = ['vitorias-desc', 'saldo-desc', 'gols-feitos-media-desc'];
  }

  // Ordenação composta: pontos desc, desclassificados por último, depois critérios
  classificacao.sort((a, b) => {
    if (b.pontos !== a.pontos) return b.pontos - a.pontos;
    if (a.desclassificada !== b.desclassificada) return a.desclassificada ? 1 : -1;

    for (const c of criterios) {
      if (c === 'head2head') {
        const hh = headToHead(a, b);
        if (hh !== 0) return hh;
      } else if (c === 'disc-media-asc') {
        if (a.disciplinaMedia !== b.disciplinaMedia) return a.disciplinaMedia - b.disciplinaMedia;
      } else if (c === 'gols-sofridos-media-asc') {
        if (a.mediaGolsSofridos !== b.mediaGolsSofridos) return a.mediaGolsSofridos - b.mediaGolsSofridos;
      } else if (c === 'gols-feitos-media-desc') {
        if (a.mediaGolsFeitos !== b.mediaGolsFeitos) return b.mediaGolsFeitos - a.mediaGolsFeitos;
      } else if (c === 'saldo-desc') {
        if (a.saldoGols !== b.saldoGols) return b.saldoGols - a.saldoGols;
      } else if (c === 'sets-sofridos-total-asc') {
        if (a.setsPontosSofridos !== b.setsPontosSofridos) return a.setsPontosSofridos - b.setsPontosSofridos;
      } else if (c === 'sets-feitos-total-desc') {
        if (a.setsPontosFeitos !== b.setsPontosFeitos) return b.setsPontosFeitos - a.setsPontosFeitos;
      } else if (c === 'vitorias-desc') {
        if (a.vitorias !== b.vitorias) return b.vitorias - a.vitorias;
      } else if (c === 'pontos-average-desc') {
        if (a.setsAverage !== b.setsAverage) return b.setsAverage - a.setsAverage;
      } else if (c === 'sorteio') {
        // deterministic fallback: nome asc
        if (a.nome !== b.nome) return a.nome.localeCompare(b.nome);
      }
    }
    // Fallback final
    return 0;
  });

  return classificacao;
}

/**
 * Gera confrontos das quartas de final baseado nas classificações
 * @param {Array} chaves - Array de chaves com suas classificações
 * @param {number} numChaves - Número de chaves (4 ou 5)
 * @returns {Array} Array de confrontos das quartas
 */
export function gerarConfrontosQuartas(chaves, numChaves) {
  if (numChaves === 4) {
    // Sistema com 4 chaves: 1º A vs 2º B, 1º B vs 2º A, 1º C vs 2º D, 1º D vs 2º C
    return [
      { equipe1: chaves[0]?.primeiroColocado, equipe2: chaves[1]?.segundoColocado, label: "1º A × 2º B" },
      { equipe1: chaves[1]?.primeiroColocado, equipe2: chaves[0]?.segundoColocado, label: "1º B × 2º A" },
      { equipe1: chaves[2]?.primeiroColocado, equipe2: chaves[3]?.segundoColocado, label: "1º C × 2º D" },
      { equipe1: chaves[3]?.primeiroColocado, equipe2: chaves[2]?.segundoColocado, label: "1º D × 2º C" }
    ];
  } else if (numChaves === 5) {
    // Sistema com 5 chaves: pega os 3 primeiros + os 5 melhores segundos
    // Simplificado: usa os primeiros de cada chave (total de 5) + 3 melhores segundos
    const primeiros = chaves.map(c => c.primeiroColocado).filter(Boolean);
    const segundos = chaves
      .map(c => c.segundoColocado)
      .filter(Boolean)
      .slice(0, 3); // Pega os 3 melhores segundos
    
    const classificados = [...primeiros, ...segundos];
    
    // Gera confrontos (simplificado)
    if (classificados.length >= 8) {
      return [
        { equipe1: classificados[0], equipe2: classificados[7], label: "1º × 8º" },
        { equipe1: classificados[1], equipe2: classificados[6], label: "2º × 7º" },
        { equipe1: classificados[2], equipe2: classificados[5], label: "3º × 6º" },
        { equipe1: classificados[3], equipe2: classificados[4], label: "4º × 5º" }
      ];
    }
  }
  
  return [];
}

/**
 * Gera confrontos das semifinais baseado nos vencedores das quartas
 * @param {Array} vencedoresQuartas - Array com vencedores das quartas [Q1, Q2, Q3, Q4]
 * @returns {Array} Array de confrontos das semifinais
 */
export function gerarConfrontosSemifinais(vencedoresQuartas) {
  if (!vencedoresQuartas || vencedoresQuartas.length < 4) return [];
  
  return [
    { 
      equipe1: vencedoresQuartas[0], 
      equipe2: vencedoresQuartas[1], 
      label: "Semifinal 1",
      origem: "Vencedor Q1 × Vencedor Q2"
    },
    { 
      equipe1: vencedoresQuartas[2], 
      equipe2: vencedoresQuartas[3], 
      label: "Semifinal 2",
      origem: "Vencedor Q3 × Vencedor Q4"
    }
  ];
}

/**
 * Gera confrontos da final baseado nos vencedores das semifinais
 * @param {Array} vencedoresSemifinais - Array com vencedores das semis [S1, S2]
 * @returns {Object} Objeto com final e disputa de 3º lugar
 */
export function gerarConfrontosFinais(vencedoresSemifinais, perdedoresSemifinais) {
  if (!vencedoresSemifinais || vencedoresSemifinais.length < 2) {
    return { final: null, terceiro: null };
  }
  
  return {
    final: {
      equipe1: vencedoresSemifinais[0],
      equipe2: vencedoresSemifinais[1],
      label: "FINAL",
      origem: "Vencedor S1 × Vencedor S2"
    },
    terceiro: perdedoresSemifinais && perdedoresSemifinais.length >= 2 ? {
      equipe1: perdedoresSemifinais[0],
      equipe2: perdedoresSemifinais[1],
      label: "3º Lugar",
      origem: "Perdedor S1 × Perdedor S2"
    } : null
  };
}

/**
 * Extrai vencedor de um jogo baseado no resultado
 * @param {Object} resultado - { scoreA, scoreB }
 * @param {string} equipeA - Nome da equipe A
 * @param {string} equipeB - Nome da equipe B
 * @returns {string|null} Nome da equipe vencedora ou null se empate/sem resultado
 */
export function extrairVencedor(resultado, equipeA, equipeB) {
  if (!resultado || resultado.scoreA === undefined || resultado.scoreB === undefined) {
    return null;
  }
  
  if (resultado.scoreA > resultado.scoreB) return equipeA;
  if (resultado.scoreB > resultado.scoreA) return equipeB;
  
  return null; // Empate
}

/**
 * Extrai perdedor de um jogo baseado no resultado
 * @param {Object} resultado - { scoreA, scoreB }
 * @param {string} equipeA - Nome da equipe A
 * @param {string} equipeB - Nome da equipe B
 * @returns {string|null} Nome da equipe perdedora ou null se empate/sem resultado
 */
export function extrairPerdedor(resultado, equipeA, equipeB) {
  if (!resultado || resultado.scoreA === undefined || resultado.scoreB === undefined) {
    return null;
  }
  
  if (resultado.scoreA < resultado.scoreB) return equipeA;
  if (resultado.scoreB < resultado.scoreA) return equipeB;
  
  return null; // Empate
}
