export interface LinhaEditavel {
  chave: string;
  equipeId: string;
  /** Texto do campo, para permitir apagar e redigitar sem virar 0 no meio. */
  pontos: string;
}

/** Devolve as mensagens que impedem salvar; lista vazia quando está tudo certo. */
export function validarLinhas(linhas: readonly LinhaEditavel[]): string[] {
  const problemas: string[] = [];

  linhas.forEach((linha, indice) => {
    const posicao = `${indice + 1}º`;
    if (!linha.equipeId) problemas.push(`Escolha a equipe da posição ${posicao}.`);
    const pontos = Number(linha.pontos);
    if (linha.pontos.trim() === "" || !Number.isInteger(pontos) || pontos < 0) {
      problemas.push(
        `Os pontos da posição ${posicao} precisam ser um número inteiro de 0 para cima.`,
      );
    }
  });

  const vistas = new Set<string>();
  for (const { equipeId } of linhas) {
    if (!equipeId) continue;
    if (vistas.has(equipeId)) {
      problemas.push("Cada equipe pode aparecer uma vez só.");
      break;
    }
    vistas.add(equipeId);
  }

  return problemas;
}
