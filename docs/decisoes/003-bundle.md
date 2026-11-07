# 003: Tamanho do bundle

**Decisão:** três cortes, medidos com os source maps do build.

| Mudança                                                               | Primeira carga (gzip) |
| --------------------------------------------------------------------- | --------------------- |
| Primeiro build da versão nova                                         | 311 KB                |
| Firebase Authentication só na área admin (rota carregada sob demanda) | 245 KB                |
| `zod/mini` no lugar do Zod completo                                   | 228 KB                |
| Versão do evento, para comparação                                     | 267 KB                |

**re2js.** O SDK do Firestore 13 importa a biblioteca `re2js` só para avaliar expressões de pipeline com LIKE e regex no cliente. O site não usa pipelines, então `vite.config.ts` troca o pacote por `src/data/re2js-vazio.ts`. Se um dia o site usar pipelines com regex, basta remover o alias.

**Piso.** O que sobra é, em ordem, o SDK do Firestore com tempo real, o React DOM e o React Router. Abaixo disso, só trocando o tempo real por dados estáticos.
