import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { calcularRankingGeral } from "@/domain/ranking";
import { carregarEdicao2025 } from "@/test/edicao2025";
import { QuadroTurmas } from "./QuadroTurmas";

const { turmas, equipes, rankings } = carregarEdicao2025();
const ranking = calcularRankingGeral(turmas, equipes, rankings);

describe("QuadroTurmas", () => {
  it("mostra as 16 turmas na ordem do ranking, com link para cada uma", () => {
    render(
      <MemoryRouter>
        <QuadroTurmas ranking={ranking} />
      </MemoryRouter>,
    );
    const lista = screen.getByRole("list", { name: "Ranking geral em quadro" });
    const links = within(lista).getAllByRole("link");
    expect(links).toHaveLength(16);
    expect(links[0]).toHaveAccessibleName("1º lugar: Turma 31, 5.090 pontos");
    expect(links[0]).toHaveAttribute("href", "/turmas/31");
    expect(links[2]).toHaveAttribute("href", "/turmas/ti22");
  });

  it("desenha só a campeã como círculo", () => {
    render(
      <MemoryRouter>
        <QuadroTurmas ranking={ranking} />
      </MemoryRouter>,
    );
    const links = screen.getAllByRole("link");
    expect(links.filter((l) => l.className.includes("rounded-full"))).toHaveLength(1);
    expect(links[0]?.className).toContain("rounded-full");
  });
});
