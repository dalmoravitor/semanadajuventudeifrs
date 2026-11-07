import { createContext } from "react";
import type { Usuario } from "@/data/autenticacao";
import type { Equipe, LinhaRanking, Modalidade, PosicaoGeral, Turma } from "@/domain/tipos";

export interface Edicao {
  modalidades: readonly Modalidade[];
  turmas: readonly Turma[];
  equipes: readonly Equipe[];
  rankings: ReadonlyMap<string, readonly LinhaRanking[]>;
  rankingGeral: readonly PosicaoGeral[];
  modalidadePorId: ReadonlyMap<string, Modalidade>;
  turmaPorId: ReadonlyMap<string, Turma>;
}

export type EstadoEdicao =
  | { status: "carregando" }
  | { status: "erro"; erro: Error; tentarDeNovo: () => void }
  | { status: "pronto"; edicao: Edicao };

export const ContextoEdicao = createContext<EstadoEdicao | null>(null);

export interface EstadoUsuario {
  carregando: boolean;
  usuario: Usuario | null;
}

export const ContextoUsuario = createContext<EstadoUsuario | null>(null);
