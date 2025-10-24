# 🔧 Firestore – Índices Necessários

Algumas consultas do projeto exigem índices compostos no Firestore. Enquanto os índices não existem, o código agora aplica um fallback (ordenando no cliente), mas o ideal é criar os índices abaixo para melhor performance e evitar warnings no console.

## ✅ Índices a criar

1) resultados: por modalidade e ordenado por colocacao
- Collection: `resultados`
- Campos:
  - `modalidadeId` Ascending
  - `colocacao` Ascending

2) resultados: por equipe e ordenado por pontosGerais
- Collection: `resultados`
- Campos:
  - `equipeId` Ascending
  - `pontosGerais` Descending

3) confrontos: por modalidade, fase e ordenado por faseOrdem
- Collection: `confrontos`
- Campos:
  - `modalidadeId` Ascending
  - `fase` Ascending
  - `faseOrdem` Ascending

4) confrontos: por modalidade e ordenado por faseOrdem (casos sem filtro de fase)
- Collection: `confrontos`
- Campos:
  - `modalidadeId` Ascending
  - `faseOrdem` Ascending

5) equipes: ranking ordenado por totalPontos e numeroTurma
- Collection: `equipes`
- Campos:
  - `totalPontos` Descending
  - `numeroTurma` Ascending

## 🛠️ Como criar

- Pelo Console (rápido):
  1. Abra o link que aparece no erro do console ("The query requires an index...")
  2. Clique em "Criar Índice"
  3. Aguarde a construção (1–3 minutos)

- Manualmente no Console:
  1. Firebase Console → Firestore Database → Indexes (Índices)
  2. Adicione cada índice conforme acima

- Via CLI (recomendado para versionar):
  1. Crie um arquivo `firestore.indexes.json` na raiz do projeto (exemplo abaixo)
  2. Faça deploy com o Firebase CLI (`firebase deploy --only firestore:indexes`)

## 📄 Exemplo de `firestore.indexes.json`

```json
{
  "indexes": [
    {
      "collectionGroup": "resultados",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "modalidadeId", "order": "ASCENDING" },
        { "fieldPath": "colocacao", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "resultados",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "equipeId", "order": "ASCENDING" },
        { "fieldPath": "pontosGerais", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "confrontos",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "modalidadeId", "order": "ASCENDING" },
        { "fieldPath": "fase", "order": "ASCENDING" },
        { "fieldPath": "faseOrdem", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "confrontos",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "modalidadeId", "order": "ASCENDING" },
        { "fieldPath": "faseOrdem", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "equipes",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "totalPontos", "order": "DESCENDING" },
        { "fieldPath": "numeroTurma", "order": "ASCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

## ℹ️ Observação
- O fallback de ordenação no cliente já foi implementado para:
  - `getResultadosPorModalidade`: filtra por `modalidadeId` e ordena por `colocacao` em memória.
  - `getResultadosPorEquipe`: filtra por `equipeId` e ordena por `pontosGerais` em memória.
- Mesmo com o fallback, recomendo fortemente criar os índices para manter desempenho e evitar estouro de leitura em cenários maiores.
