import type { Categoria, Turma } from "./tipos";

const SISTEMAS: Record<string, string> = {
  "chaves+eliminacao": "Fase de grupos e mata-mata",
  chaves: "Fase de grupos",
  "chaves (rodízio simples)+eliminacao": "Rodízio em grupos e mata-mata",
  "suíço (5 rodadas)": "Sistema suíço em 5 rodadas",
  "eliminacao-simples": "Mata-mata",
  "eliminacao-simples (melhor-de-3)": "Mata-mata em melhor de 3",
  "melhor-de-3 (medida)": "Melhor de 3 tentativas",
  "eliminatoria+final (tempo)": "Baterias e final, por tempo",
  "bateria-unica (tempo)": "Bateria única, por tempo",
  tempo: "Por tempo",
  "multi-etapas (tempo)": "Etapas, por tempo",
  pontuacao: "Avaliação por jurados",
  "pontuacao (plataforma)": "Pontuação no Kahoot",
  "pontuacao-acumulada": "Pontos somados em rodadas",
  "pontuacao-fixa": "Pontuação fixa por entrega",
  "pontuacao-decadente": "Pontos descontados por ocorrência",
  percentual: "Proporcional à frequência",
  soletrando: "Rodadas eliminatórias",
};

/** Traduz o sistema de disputa salvo no banco para a linguagem do público. */
export function sistemaEmTexto(sistema: string): string {
  return SISTEMAS[sistema] ?? sistema;
}

const CATEGORIAS: Record<Categoria, string> = {
  masculino: "Masculino",
  feminino: "Feminino",
  misto: "Misto",
};

export function categoriaEmTexto(categoria: Categoria): string {
  return CATEGORIAS[categoria];
}

const numeroPtBr = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

export function formatarPontos(pontos: number): string {
  return numeroPtBr.format(pontos);
}

export function pontosPorExtenso(pontos: number): string {
  return `${formatarPontos(pontos)} ${pontos === 1 ? "ponto" : "pontos"}`;
}

export function ordinal(n: number): string {
  return `${n}º`;
}

export function anoEmTexto(turma: Turma): string {
  if (turma.ano === null) return turma.informatica ? "Informática" : "";
  return turma.informatica ? `${turma.ano}º ano, Informática` : `${turma.ano}º ano`;
}
