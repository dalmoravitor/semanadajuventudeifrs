/**
 * Substitui o pacote `re2js` no bundle (ver vite.config.ts e docs/decisoes/003-bundle.md).
 *
 * O SDK do Firestore 13 importa o re2js (cerca de 250 KB de código) só para avaliar
 * expressões de pipeline com LIKE e regex no cliente. Este site nunca usa pipelines;
 * se algum dia usar, a chamada cai aqui e o SDK devolve erro na própria expressão.
 */
export const RE2JS = {
  compile(): never {
    throw new Error("Expressões regulares de pipeline não estão disponíveis neste site.");
  },
};
