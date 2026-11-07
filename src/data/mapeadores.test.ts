import { describe, expect, it } from "vitest";
import { DocumentoInvalido, mapearModalidade, mapearRanking, mapearTurmas } from "./mapeadores";

describe("mapeadores", () => {
  it("converte números salvos como texto", () => {
    const linhas = mapearRanking("futsal_masc", {
      ranking: [{ posicao: "1", equipe: "Turma 23", equipeId: "turma_23", pontos: "160" }],
    });
    expect(linhas).toEqual([
      { equipeId: "turma_23", equipeNome: "Turma 23", pontos: 160, posicaoInformada: 1 },
    ]);
  });

  it("recusa pontos que não são número", () => {
    expect(() =>
      mapearRanking("x", { ranking: [{ equipeId: "turma_23", pontos: "muitos" }] }),
    ).toThrow(DocumentoInvalido);
  });

  it("usa 'misto' quando a categoria é desconhecida", () => {
    expect(mapearModalidade("x", { nome: "Truco", categoria: "outra" }).categoria).toBe("misto");
  });

  it("lê ano e curso da série da turma", () => {
    const [turma] = mapearTurmas({
      turmas: [{ id: "turma_ti22", nome: "Turma TI22", numero: 1022, serie: "TI - 2º Ano" }],
    });
    expect(turma).toMatchObject({ codigo: "TI22", ano: 2, informatica: true });
  });
});
