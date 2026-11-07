/** Tipos do domínio da Semana da Juventude, independentes do Firebase. */

export type Categoria = "masculino" | "feminino" | "misto";
export type AnoEscolar = 1 | 2 | 3;

/** Uma das 16 turmas que aparecem no ranking geral. */
export interface Turma {
  id: string;
  nome: string;
  /** Código curto usado em telas e URLs: "31", "TI22". */
  codigo: string;
  /** Número de ordenação do regulamento; desempata o ranking geral. */
  numero: number;
  ano: AnoEscolar | null;
  informatica: boolean;
}

/** Equipe que compete. Uma equipe combinada (ex.: Turma 12/13) soma pontos para mais de uma turma. */
export interface Equipe {
  id: string;
  nome: string;
  codigo: string;
  distribuicao: ReadonlyArray<{ turmaId: string; percentual: number }>;
}

export interface Modalidade {
  id: string;
  nome: string;
  categoria: Categoria;
  tipo: string;
  /** Sistema de disputa como está no banco, ex.: "chaves+eliminacao". */
  sistema: string;
  descricao: string;
  ordem: number;
  criteriosDesempate: readonly string[];
}

/** Uma linha do ranking final de uma modalidade, como lançada pela organização. */
export interface LinhaRanking {
  equipeId: string;
  equipeNome: string;
  pontos: number;
  posicaoInformada: number;
}

export type RankingsPorModalidade = ReadonlyMap<string, readonly LinhaRanking[]>;

export interface Contribuicao {
  modalidadeId: string;
  equipeId: string;
  pontos: number;
}

export interface PosicaoGeral {
  turma: Turma;
  pontos: number;
  colocacao: number;
  contribuicoes: readonly Contribuicao[];
}

export interface LinhaPontuacao {
  equipeId: string;
  equipeNome: string;
  codigo: string;
  pontos: number;
  /** Colocação pelos pontos; empates dividem a mesma colocação. */
  colocacao: number;
  combinada: boolean;
  turmaIds: readonly string[];
}

export interface ChaveDeGrupo {
  nome: string;
  equipes: readonly string[];
}
