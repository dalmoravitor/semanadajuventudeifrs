import { describe, expect, it } from "vitest";
import { carregarEdicao2025 } from "@/test/edicao2025";
import {
  calcularRankingGeral,
  codigoDaTurma,
  pontuacaoDaModalidade,
  resumoDaTurma,
  temVencedor,
} from "./ranking";
import type { Equipe, LinhaRanking, Turma } from "./tipos";

const edicao = carregarEdicao2025();

describe("ranking geral de 2025 (teste de referência)", () => {
  it("reproduz as 16 posições exibidas no site durante o evento", () => {
    const ranking = calcularRankingGeral(edicao.turmas, edicao.equipes, edicao.rankings);

    // Valores lidos em semanadajuventudeifrs.web.app/ranking (versão v2025-original).
    expect(ranking.map((p) => [p.turma.codigo, p.pontos])).toEqual([
      ["31", 5090],
      ["21", 4610],
      ["TI22", 4530],
      ["23", 4060],
      ["32", 4040],
      ["22", 3970],
      ["34", 3650],
      ["24", 3410],
      ["TI12", 3350],
      ["TI21", 3140],
      ["14", 3110],
      ["33", 3050],
      ["11", 2660],
      ["TI11", 2430],
      ["12", 2310],
      ["13", 2100],
    ]);
    expect(ranking.map((p) => p.colocacao)).toEqual(Array.from({ length: 16 }, (_, i) => i + 1));
  });

  it("usa as 38 modalidades e as 21 equipes cadastradas", () => {
    expect(edicao.modalidades).toHaveLength(38);
    expect(edicao.rankings.size).toBe(38);
    expect(edicao.equipes).toHaveLength(21);
    expect(edicao.turmas).toHaveLength(16);
  });
});

const turma = (id: string, numero: number): Turma => ({
  id,
  nome: `Turma ${numero}`,
  codigo: String(numero),
  numero,
  ano: 1,
  informatica: false,
});
const equipe = (id: string, turmaIds: string[]): Equipe => ({
  id,
  nome: id,
  codigo: id,
  distribuicao: turmaIds.map((turmaId) => ({ turmaId, percentual: 1 })),
});
const linha = (equipeId: string, pontos: number, posicaoInformada: number): LinhaRanking => ({
  equipeId,
  equipeNome: equipeId,
  pontos,
  posicaoInformada,
});

describe("calcularRankingGeral", () => {
  const turmas = [turma("t11", 11), turma("t12", 12), turma("t13", 13)];
  const equipes = [
    equipe("t11", ["t11"]),
    equipe("t12", ["t12"]),
    equipe("t13", ["t13"]),
    equipe("t1213", ["t12", "t13"]),
  ];

  it("repassa os pontos de uma equipe combinada para cada turma", () => {
    const ranking = calcularRankingGeral(
      turmas,
      equipes,
      new Map([["futsal", [linha("t1213", 160, 1), linha("t11", 150, 2)]]]),
    );
    expect(ranking.map((p) => [p.turma.id, p.pontos])).toEqual([
      ["t12", 160],
      ["t13", 160],
      ["t11", 150],
    ]);
  });

  it("desempata pelo número da turma", () => {
    const ranking = calcularRankingGeral(
      turmas,
      equipes,
      new Map([["xadrez", [linha("t13", 100, 1), linha("t11", 100, 2)]]]),
    );
    expect(ranking.map((p) => p.turma.id)).toEqual(["t11", "t13", "t12"]);
  });

  it("ignora equipes que não estão cadastradas", () => {
    const ranking = calcularRankingGeral(
      turmas,
      equipes,
      new Map([["xadrez", [linha("fantasma", 160, 1)]]]),
    );
    expect(ranking.every((p) => p.pontos === 0)).toBe(true);
  });
});

describe("pontuacaoDaModalidade", () => {
  it("explica o futsal masculino de 2025: combinada zerada e turmas lançadas no fim", () => {
    const { linhas, combinadasSemPontos } = pontuacaoDaModalidade(
      edicao.rankings.get("futsal_masc") ?? [],
      edicao.equipes,
    );
    expect(combinadasSemPontos).toEqual(["Turma 12/13"]);
    expect(linhas[0]).toMatchObject({ codigo: "23", pontos: 160, colocacao: 1 });
    // Turma 12 aparecia em 16º com 90 pontos; ordenada pelos pontos, divide o 8º lugar.
    expect(linhas.find((l) => l.codigo === "12")).toMatchObject({ pontos: 90, colocacao: 8 });
  });

  it("divide a colocação em empates", () => {
    const { linhas } = pontuacaoDaModalidade(
      [linha("a", 160, 1), linha("b", 150, 2), linha("c", 150, 3), linha("d", 130, 4)],
      [],
    );
    expect(linhas.map((l) => l.colocacao)).toEqual([1, 2, 2, 4]);
  });

  it("não aponta vencedor quando todos empatam (Kit Solidário)", () => {
    const { linhas } = pontuacaoDaModalidade(
      edicao.rankings.get("inscricao_kit") ?? [],
      edicao.equipes,
    );
    expect(temVencedor(linhas)).toBe(false);
  });
});

describe("resumoDaTurma", () => {
  it("soma por modalidade o mesmo total do ranking geral", () => {
    const ranking = calcularRankingGeral(edicao.turmas, edicao.equipes, edicao.rankings);
    const resumo = resumoDaTurma(
      "turma_31",
      ranking,
      edicao.modalidades,
      edicao.rankings,
      edicao.equipes,
    );
    expect(resumo).not.toBeNull();
    const soma = resumo?.resultados.reduce((total, r) => total + r.pontos, 0);
    expect(soma).toBe(5090);
    expect(resumo?.posicao.colocacao).toBe(1);
    expect(resumo?.primeirosLugares).toBeGreaterThan(0);
  });
});

describe("codigoDaTurma", () => {
  it.each([
    ["Turma 31", "31"],
    ["Turma TI22", "TI22"],
    ["Turma 12/13", "12/13"],
  ])("%s → %s", (nome, codigo) => {
    expect(codigoDaTurma(nome)).toBe(codigo);
  });
});
