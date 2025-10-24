# 🗺️ Estrutura Visual Completa do Firestore

Este documento consolida a estrutura ATUAL do banco (com base no código em `src/api` e hooks), com visão em árvore, exemplos de documentos e relacionamentos.

## 📂 Mapa em Árvore

```
firestore/
├── modalidades/
│   └── {modalidadeId}
├── equipes/
│   └── {equipeId}
├── inscricoes/
│   └── {modalidadeId}
├── chaves/
│   └── {modalidadeId}
├── confrontos/
│   └── {confrontoId}
├── resultados/
│   └── {resultadoId}
├── ranking/
│   ├── {modalidadeId}         # ranking de uma modalidade específica
│   ├── geral                  # ranking geral agregado por turma base
│   ├── masculino              # (opcional) por categoria
│   ├── feminino               # (opcional)
│   └── misto                  # (opcional)
└── configuracoes/
    ├── geral
    └── equipes_padrao
```

---

## 1) modalidades/{modalidadeId}

Ex.: `futsal_masc`, `volei_fem`, `fifa`, `atletismo_100m_masc`

```jsonc
{
  "id": "futsal_masc",
  "nome": "Futsal",
  "categoria": "masculino",           // "masculino" | "feminino" | "misto"
  "tipo": "coletiva",                // "coletiva" | "individual"
  "sistema": "chaves+eliminacao",    // ou "chaves", "eliminacao", "tempo", etc.
  "regrasPontuacao": {
    "grupos": { "vitoria": 3, "empate": 1, "derrota": 0 }
  },
  "criterioDesempate": [
    "confronto direto",
    "menor média de pontos disciplinares",
    "menor média de gols sofridos",
    "maior média de gols feitos",
    "sorteio"
  ],
  "descricao": "16 equipes em 4 chaves...",
  "status": "aguardando",             // "aguardando" | "em_andamento" | "concluido"
  "numeroChaves": 4,
  "numeroEquipesPorChave": 4,
  "ordem": 1,
  "icone": "⚽",
  "createdAt": Timestamp,
  "updatedAt": Timestamp
}
```

Índices úteis: `categoria ASC`, `status ASC`, `ordem ASC`.

---

## 2) equipes/{equipeId}

Ex.: `turma_301`

```jsonc
{
  "id": "turma_301",
  "nome": "Turma 301",
  "anoSerie": "3º Ano",
  "numeroTurma": 301,
  "categoria": "misto",              // quando aplicável
  "cor": "#6c5ce7",
  "corSecundaria": "#a29bfe",
  "representantes": [
    { "nome": "João Silva", "cpf": "...", "contato": "..." }
  ],
  "totalPontos": 0,
  "totalModalidades": 0,
  "posicaoRanking": 0,
  "inscricaoKit": { "completa": false, "dataEntrega": null, "pontos": 0 },
  "disciplinaOrganizacao": { "pontos": 160, "ocorrencias": 0, "avaliacoesSalaSuja": 0, "historico": [] },
  "presencas": { "totalAulas": 0, "totalPresencas": 0, "percentual": 0, "pontos": 0 },
  "createdAt": Timestamp,
  "updatedAt": Timestamp
}
```

Índices úteis: `numeroTurma ASC`, `totalPontos DESC`, `posicaoRanking ASC`.

---

## 3) inscricoes/{modalidadeId}

```jsonc
{
  "modalidadeId": "futsal_masc",
  "equipes": [
    { "equipeId": "turma_301", "nomeEquipe": "Turma 301", "dataInscricao": Timestamp, "status": "confirmada" }
  ],
  "totalEquipes": 16,
  "limiteEquipes": 16,
  "inscricoesAbertas": true,
  "updatedAt": Timestamp
}
```

---

## 4) chaves/{modalidadeId}

Documento ÚNICO por modalidade contendo grupos, resultados e eliminatórias. Estrutura alinhada ao HOC `withModalidadeData` e à API `src/api/resultados.js`.

```jsonc
{
  "modalidadeId": "fifa",

  // CHAVES (fase de grupos)
  "chaves": [
    {
      "nome": "Chave A",
      "chaveNumero": 0,
      "equipes": ["Equipe 1", "Equipe 2", "Equipe 3"]
      // (opcional) "classificacao": [ { equipeId, posicao, pontos, ... } ]
    }
  ],

  // Resultados dos jogos das chaves (array de registros)
  "resultadosJogos": [
    { "id": "chave0_jogo0", "chaveIdx": 0, "jogoIdx": 0, "equipeA": "Equipe 1", "equipeB": "Equipe 2", "scoreA": 2, "scoreB": 1, "timestamp": "2025-10-19T12:30:00.000Z" }
  ],

  // Classificação consolidada por chave (opcional)
  "classificacao": [
    { "chaveIdx": 0, "chaveName": "Chave A", "classificados": [ { "posicao": 1, "equipe": "Equipe 1", "pontos": 9 }, { "posicao": 2, "equipe": "Equipe 2", "pontos": 6 } ] }
  ],

  // FASE ELIMINATÓRIA – confrontos salvos no mesmo doc
  "confrontosQuartas": [
    { "id": "quarta-1", "confrontoNumero": 1, "equipeA": { "nome": "1º Chave A" }, "equipeB": { "nome": "2º Chave D" } }
  ],
  "confrontosSemis": [ { "id": "semi-1", "confrontoNumero": 1, "equipeA": { "nome": "Vencedor Q1" }, "equipeB": { "nome": "Vencedor Q2" } } ],
  "confrontosFinal": { "id": "final", "equipeA": { "nome": "Vencedor S1" }, "equipeB": { "nome": "Vencedor S2" } },

  // Resultados das eliminatórias (objeto indexado por confrontoId)
  "resultadosEliminatorias": {
    "quarta-1": { "equipeA": "Equipe 1", "equipeB": "Equipe 8", "scoreA": 2, "scoreB": 1, "fase": "Quartas de Final", "updatedAt": "2025-10-19T14:00:00.000Z" }
  },

  "status": "final",                 // "inscricoes" | "chaves" | "quartas" | "semis" | "final" | "concluido"
  "faseAtual": "final",
  "createdAt": Timestamp,
  "updatedAt": Timestamp,
  "ultimaAtualizacao": "2025-10-19T16:30:00.000Z"
}
```

Observação: também existe a collection `confrontos/` (ver item 5) para modalidades que optarem por salvar confrontos fora do doc de `chaves`.

---

## 5) confrontos/{confrontoId}

Utilizada quando os confrontos são tratados como documentos independentes.

```jsonc
{
  "confrontoId": "futsal_masc_quartas_1",
  "modalidadeId": "futsal_masc",
  "fase": "quartas",              // "chaves" | "oitavas" | "quartas" | "semi" | "final" | "terceiro"
  "faseOrdem": 1,
  "equipeA": { "equipeId": "turma_301", "nomeEquipe": "Turma 301", "origem": "1º Chave A" },
  "equipeB": { "equipeId": "turma_308", "nomeEquipe": "Turma 308", "origem": "2º Chave D" },
  "resultado": { "scoreA": 5, "scoreB": 3, "vencedor": "turma_301" },
  "status": "concluido",
  "proximoConfrontoId": "futsal_masc_semi_1",
  "posicaoProximoConfronto": "equipeA",
  "observacoes": "",
  "dataHora": Timestamp,
  "createdAt": Timestamp,
  "updatedAt": Timestamp
}
```

Índices úteis: `(modalidadeId ASC, fase ASC)`, `(modalidadeId ASC, status ASC)`, `dataHora ASC`.

---

## 6) resultados/{resultadoId}

Resultado final por equipe em uma modalidade. Id sugerido: `{modalidadeId}_{equipeId}`.

```jsonc
{
  "id": "fifa_turma_301",
  "modalidadeId": "fifa",
  "equipeId": "turma_301",
  "colocacao": 1,
  "pontosGerais": 160,              // tabela 160..10
  "estatisticas": {
    "jogos": 7, "vitorias": 6, "empates": 0, "derrotas": 1,
    "golsPro": 28, "golsContra": 12, "saldoGols": 16,
    "melhorTempo": "00:11.50", "pontuacaoTotal": 95
  },
  "historico": [ { "fase": "final", "resultado": "Campeão - 3x1" } ],
  "createdAt": Timestamp,
  "updatedAt": Timestamp
}
```

Índices úteis: `(modalidadeId ASC, colocacao ASC)`, `equipeId ASC`, `pontosGerais DESC`.

---

## 7) ranking/

Existem DOIS formatos em uso:

### 7.1) ranking/{modalidadeId} – Ranking por modalidade (usado pela UI)

Gerado por `src/api/ranking.js::saveRankingModalidade`.

```jsonc
{
  "modalidadeId": "futsal_masc",
  "ranking": [
    { "posicao": 1, "equipe": "Turma 301", "equipeId": "turma_301", "pontos": 160 },
    { "posicao": 2, "equipe": "Turma 302", "equipeId": "turma_302", "pontos": 150 }
  ],
  "createdAt": Timestamp,
  "updatedAt": Timestamp
}
```

### 7.2) ranking/geral (e opcional: masculino, feminino, misto) – Ranking agregado por turma base

Gerado por `src/api/resultados.js::recalcularRankingGeral` (formato com `classificacao`).

```jsonc
{
  "tipo": "geral",
  "classificacao": [
    { "posicao": 1, "equipeId": "turma_301", "nomeEquipe": "Turma 301", "totalPontos": 2480,
      "modalidadesParticipadas": 18, "primeirosLugares": 5, "segundosLugares": 3, "terceirosLugares": 2,
      "pontosInscricao": 160, "pontosDisciplina": 140, "pontosPresenca": 280 }
  ],
  "totalEquipes": 16,
  "ultimaAtualizacao": Timestamp,
  "calculadoEm": Timestamp
}
```

Observação: o serviço `src/services/rankingGeralService.js` agrega os documentos `ranking/{modalidadeId}` para compor o ranking geral por turmas base (com distribuição de pontos para equipes combinadas).

---

## 8) configuracoes/{configId}

Principais documentos:

- `geral`
```jsonc
{
  "nomeEvento": "XXIX Semana da Juventude",
  "anoEvento": 2025,
  "tabelaPontuacao": [160,150,140,130,120,110,100,90,80,70,60,50,40,30,20,10],
  "eventoAtivo": true,
  "inscricoesAbertas": true,
  "tema": { "corPrimaria": "#2dd4bf", "corSecundaria": "#0891b2", "corDestaque": "#ffd700" },
  "contatos": { "email": "semanadajuventude@erechim.ifrs.edu.br" },
  "updatedAt": Timestamp
}
```

- `equipes_padrao`
```jsonc
{
  "equipes": [ { "nome": "Turma 101", "numero": 101, "serie": "1º Ano", "cor": "#ff6b6b" } ],
  "updatedAt": Timestamp
}
```

---

## 🔐 Regras de Segurança (resumo)

- Leitura pública de todas as coleções
- Escrita restrita a usuários autenticados (ou admins, conforme variante)

Vide `FIRESTORE_SECURITY_RULES.txt` para o conteúdo completo e alternativas mais restritivas.

---

## 🔗 Relacionamentos

```
modalidades (1) ──┬── (N) inscricoes
                  ├── (1) chaves
                  ├── (N) confrontos
                  └── (N) resultados

equipes (1) ──┬── (N) inscricoes
              └── (N) resultados

chaves (1) ── (1) modalidades
           └── (N) equipes (nomes/refs)

confrontos (N) ── (1) modalidades
               └── (2) equipes (refs)

resultados (N) ── (1) modalidades
               └── (1) equipes

ranking (por modalidade) ── (N) equipes
ranking (geral) ── (N) equipes (agregado por turma base)
```

---

## 🧭 Consultas comuns (exemplos)

- Modalidades por categoria: `where('categoria','==','masculino').orderBy('ordem')`
- Confrontos por fase: `where('modalidadeId','==',id).where('fase','==','quartas').orderBy('faseOrdem')`
- Ranking por modalidade: ler `ranking/{modalidadeId}` e iterar sobre `ranking[]`
- Ranking geral: ler `ranking/geral` e iterar sobre `classificacao[]`

---

## ✅ Observações finais

- O doc `chaves/{modalidadeId}` concentra hoje: chaves, resultados das chaves, confrontos e resultados das eliminatórias.
- A collection `confrontos/` é compatível e pode ser usada em paralelo ou em substituição para modalidades específicas.
- A collection `ranking/` contém tanto rankings por modalidade (campo `ranking`) quanto o ranking geral (campo `classificacao`).
- Os formatos acima refletem o estado atual do código fonte nesta workspace (21/10/2025).
