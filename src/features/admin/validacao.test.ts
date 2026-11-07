import { describe, expect, it } from "vitest";
import { validarLinhas, type LinhaEditavel } from "./validacao";

const linha = (equipeId: string, pontos: string, chave = equipeId): LinhaEditavel => ({
  chave,
  equipeId,
  pontos,
});

describe("validarLinhas", () => {
  it("aceita uma pontuação completa", () => {
    expect(validarLinhas([linha("turma_31", "160"), linha("turma_21", "150")])).toEqual([]);
  });

  it("pede a equipe que faltou escolher", () => {
    expect(validarLinhas([linha("", "160", "a")])).toEqual(["Escolha a equipe da posição 1º."]);
  });

  it("recusa pontos vazios, negativos ou fracionados", () => {
    const problemas = validarLinhas([linha("a", ""), linha("b", "-10"), linha("c", "12.5")]);
    expect(problemas).toHaveLength(3);
  });

  it("recusa a mesma equipe duas vezes", () => {
    expect(validarLinhas([linha("turma_31", "160", "x"), linha("turma_31", "150", "y")])).toEqual([
      "Cada equipe pode aparecer uma vez só.",
    ]);
  });
});
