import type {
  Contribuicao,
  Equipe,
  LinhaPontuacao,
  LinhaRanking,
  Modalidade,
  PosicaoGeral,
  RankingsPorModalidade,
  Turma,
} from "./tipos";

/**
 * Soma os pontos de todas as modalidades por turma, como no regulamento de 2025:
 * cada equipe repassa seus pontos às turmas que a compõem (equipes combinadas
 * repassam 100% para cada turma). Empates são decididos pelo número da turma.
 */
export function calcularRankingGeral(
  turmas: readonly Turma[],
  equipes: readonly Equipe[],
  rankings: RankingsPorModalidade,
): PosicaoGeral[] {
  const equipesPorId = new Map(equipes.map((equipe) => [equipe.id, equipe]));
  const acumulado = new Map(
    turmas.map((turma) => [turma.id, { turma, pontos: 0, contribuicoes: [] as Contribuicao[] }]),
  );

  for (const [modalidadeId, linhas] of rankings) {
    for (const linha of linhas) {
      const equipe = equipesPorId.get(linha.equipeId);
      if (!equipe) continue;
      for (const { turmaId, percentual } of equipe.distribuicao) {
        const destino = acumulado.get(turmaId);
        if (!destino) continue;
        const pontos = linha.pontos * percentual;
        destino.pontos += pontos;
        destino.contribuicoes.push({ modalidadeId, equipeId: equipe.id, pontos });
      }
    }
  }

  return [...acumulado.values()]
    .sort((a, b) => b.pontos - a.pontos || a.turma.numero - b.turma.numero)
    .map((posicao, indice) => ({ ...posicao, colocacao: indice + 1 }));
}

/**
 * Ordena a pontuação de uma modalidade pelos pontos.
 *
 * Em 2025, equipes combinadas às vezes foram lançadas com 0 ponto e uma linha
 * extra para cada turma no fim da lista. Essas linhas zeradas saem da lista e
 * vão para `combinadasSemPontos`, para a tela explicar o que aconteceu.
 */
export function pontuacaoDaModalidade(
  linhas: readonly LinhaRanking[],
  equipes: readonly Equipe[],
): { linhas: LinhaPontuacao[]; combinadasSemPontos: string[] } {
  const equipesPorId = new Map(equipes.map((equipe) => [equipe.id, equipe]));
  const combinadasSemPontos: string[] = [];
  const visiveis: Omit<LinhaPontuacao, "colocacao">[] = [];

  const ordenadas = [...linhas].sort(
    (a, b) => b.pontos - a.pontos || a.posicaoInformada - b.posicaoInformada,
  );

  for (const linha of ordenadas) {
    const equipe = equipesPorId.get(linha.equipeId);
    const turmaIds = equipe?.distribuicao.map((d) => d.turmaId) ?? [linha.equipeId];
    const combinada = turmaIds.length > 1;
    const nome = equipe?.nome ?? linha.equipeNome;
    if (combinada && linha.pontos === 0) {
      combinadasSemPontos.push(nome);
      continue;
    }
    visiveis.push({
      equipeId: linha.equipeId,
      equipeNome: nome,
      codigo: equipe?.codigo ?? codigoDaTurma(nome),
      pontos: linha.pontos,
      combinada,
      turmaIds,
    });
  }

  return { linhas: comColocacao(visiveis), combinadasSemPontos };
}

/** Colocação com empates ("1, 2, 2, 4"): quem tem os mesmos pontos divide a posição. */
function comColocacao<T extends { pontos: number }>(
  itens: readonly T[],
): (T & { colocacao: number })[] {
  let anterior: number | undefined;
  let colocacao = 0;
  return itens.map((item, indice) => {
    if (item.pontos !== anterior) {
      colocacao = indice + 1;
      anterior = item.pontos;
    }
    return { ...item, colocacao };
  });
}

/** Uma modalidade em que todas as equipes têm a mesma pontuação não tem vencedor. */
export function temVencedor(linhas: readonly LinhaPontuacao[]): boolean {
  return new Set(linhas.map((l) => l.pontos)).size > 1;
}

export interface ResultadoDaTurmaNaModalidade {
  modalidade: Modalidade;
  pontos: number;
  colocacao: number | null;
  equipeNome: string;
  combinada: boolean;
}

export interface ResumoDaTurma {
  posicao: PosicaoGeral;
  resultados: ResultadoDaTurmaNaModalidade[];
  primeirosLugares: number;
  podios: number;
}

/** Junta, para uma turma, o desempenho em cada modalidade. */
export function resumoDaTurma(
  turmaId: string,
  rankingGeral: readonly PosicaoGeral[],
  modalidades: readonly Modalidade[],
  rankings: RankingsPorModalidade,
  equipes: readonly Equipe[],
): ResumoDaTurma | null {
  const posicao = rankingGeral.find((p) => p.turma.id === turmaId);
  if (!posicao) return null;

  const resultados: ResultadoDaTurmaNaModalidade[] = [];
  let primeirosLugares = 0;
  let podios = 0;

  for (const modalidade of modalidades) {
    const { linhas } = pontuacaoDaModalidade(rankings.get(modalidade.id) ?? [], equipes);
    const daTurma = linhas.filter((l) => l.turmaIds.includes(turmaId));
    if (daTurma.length === 0) continue;
    const melhor = daTurma.reduce((a, b) => (b.pontos > a.pontos ? b : a));
    const pontos = posicao.contribuicoes
      .filter((c) => c.modalidadeId === modalidade.id)
      .reduce((soma, c) => soma + c.pontos, 0);
    const disputada = temVencedor(linhas);
    if (disputada && melhor.colocacao === 1) primeirosLugares += 1;
    if (disputada && melhor.colocacao <= 3) podios += 1;
    resultados.push({
      modalidade,
      pontos,
      colocacao: disputada ? melhor.colocacao : null,
      equipeNome: melhor.equipeNome,
      combinada: melhor.combinada,
    });
  }

  resultados.sort(
    (a, b) => b.pontos - a.pontos || a.modalidade.nome.localeCompare(b.modalidade.nome),
  );
  return { posicao, resultados, primeirosLugares, podios };
}

/** "Turma TI22" → "TI22"; "Turma 12/13" → "12/13". */
export function codigoDaTurma(nome: string): string {
  return nome.replace(/^turma\s+/i, "").trim();
}
