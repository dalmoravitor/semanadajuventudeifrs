import { useState, type ReactNode } from "react";
import {
  observarEquipes,
  observarModalidades,
  observarRankings,
  observarTurmas,
} from "@/data/colecoes";
import { calcularRankingGeral } from "@/domain/ranking";
import type { Equipe, LinhaRanking, Modalidade, Turma } from "@/domain/tipos";
import { useAssinatura, type EstadoAssinatura } from "@/hooks/useAssinatura";
import { ContextoEdicao, type EstadoEdicao } from "./contextos";

/** Junta as quatro assinaturas num único estado e calcula o ranking geral. */
function combinar(
  modalidades: EstadoAssinatura<Modalidade[]>,
  rankings: EstadoAssinatura<Map<string, LinhaRanking[]>>,
  turmas: EstadoAssinatura<Turma[]>,
  equipes: EstadoAssinatura<Equipe[]>,
  tentarDeNovo: () => void,
): EstadoEdicao {
  for (const parte of [modalidades, rankings, turmas, equipes]) {
    if (parte.status === "erro") return { status: "erro", erro: parte.erro, tentarDeNovo };
  }
  if (
    modalidades.status !== "pronto" ||
    rankings.status !== "pronto" ||
    turmas.status !== "pronto" ||
    equipes.status !== "pronto"
  ) {
    return { status: "carregando" };
  }
  const idsModalidades = new Set(modalidades.dados.map((m) => m.id));
  const rankingsValidos = new Map([...rankings.dados].filter(([id]) => idsModalidades.has(id)));
  return {
    status: "pronto",
    edicao: {
      modalidades: modalidades.dados,
      turmas: turmas.dados,
      equipes: equipes.dados,
      rankings: rankingsValidos,
      rankingGeral: calcularRankingGeral(turmas.dados, equipes.dados, rankingsValidos),
      modalidadePorId: new Map(modalidades.dados.map((m) => [m.id, m])),
      turmaPorId: new Map(turmas.dados.map((t) => [t.id, t])),
    },
  };
}

/**
 * Assina, uma vez para o app inteiro, os dados da edição. O provider só
 * renderiza de novo quando chega um snapshot, então o cálculo roda só nessa hora.
 */
export function EdicaoProvider({ children }: { children: ReactNode }) {
  const [tentativa, setTentativa] = useState(0);
  const estado = combinar(
    useAssinatura(observarModalidades, tentativa),
    useAssinatura(observarRankings, tentativa),
    useAssinatura(observarTurmas, tentativa),
    useAssinatura(observarEquipes, tentativa),
    () => setTentativa((n) => n + 1),
  );
  return <ContextoEdicao value={estado}>{children}</ContextoEdicao>;
}
