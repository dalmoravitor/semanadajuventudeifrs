/** Carrega o snapshot de 2025 (dados/edicao-2025.json) já convertido para o domínio. */
import dados from "../../dados/edicao-2025.json";
import {
  mapearChaves,
  mapearEquipes,
  mapearModalidade,
  mapearRanking,
  mapearTurmas,
} from "@/data/mapeadores";
import type { LinhaRanking } from "@/domain/tipos";

export function carregarEdicao2025() {
  const modalidades = Object.entries(dados.modalidades).map(([id, doc]) =>
    mapearModalidade(id, doc),
  );
  const idsModalidades = new Set(modalidades.map((m) => m.id));
  const rankings = new Map<string, LinhaRanking[]>(
    Object.entries(dados.ranking)
      .filter(([id]) => idsModalidades.has(id))
      .map(([id, doc]) => [id, mapearRanking(id, doc)]),
  );
  return {
    modalidades,
    rankings,
    turmas: mapearTurmas(dados.configuracoes.turmas_ranking),
    equipes: mapearEquipes(dados.configuracoes.equipes_competindo),
    chaves: Object.fromEntries(
      Object.entries(dados.chaves).map(([id, doc]) => [id, mapearChaves(id, doc)]),
    ),
  };
}
