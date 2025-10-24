# 🗄️ Estrutura do Banco de Dados - Firestore

## 📊 Visão Geral das Coleções

```
firestore/
├── modalidades/           (44 documentos - uma por modalidade)
├── equipes/              (16 documentos - turmas participantes)
├── inscricoes/           (Relação equipes x modalidades)
├── chaves/               (Grupos/chaves de cada modalidade)
├── confrontos/           (Jogos/partidas/confrontos)
├── resultados/           (Resultados e pontuações)
├── ranking/              (Classificação geral e por categoria)
└── configuracoes/        (Configurações do sistema)
```

---

## 1️⃣ **COLEÇÃO: `modalidades`**

### Documento: `{modalidadeId}` (ex: "futsal_masc", "truco", "atletismo_100m_fem")

```javascript
{
  // Identificação
  id: "futsal_masc",                    // string - ID único
  nome: "Futsal",                       // string - Nome da modalidade
  categoria: "masculino",               // "masculino" | "feminino" | "misto"
  tipo: "coletiva",                     // "coletiva" | "individual"
  
  // Sistema de competição
  sistema: "chaves+eliminacao",         // string - Tipo do sistema
  
  // Configurações específicas
  regrasPontuacao: {                    // object - Regras da modalidade
    grupos: {
      vitoria: 3,
      empate: 1,
      derrota: 0
    },
    // ... outras regras específicas
  },
  
  criterioDesempate: [                  // array - Critérios em ordem
    "confronto direto",
    "menor média de pontos disciplinares",
    "menor média de gols sofridos",
    "maior média de gols feitos",
    "sorteio"
  ],
  
  descricao: "16 equipes em 4 chaves...", // string - Descrição detalhada
  
  // Controle
  status: "aguardando",                 // "aguardando" | "em_andamento" | "concluido"
  numeroChaves: 4,                      // number - Quantidade de chaves/grupos
  numeroEquipesPorChave: 4,             // number - Equipes por chave
  
  // Timestamps
  createdAt: Timestamp,                 // Timestamp - Data de criação
  updatedAt: Timestamp,                 // Timestamp - Última atualização
  
  // Metadados
  ordem: 1,                             // number - Ordem de exibição
  icone: "⚽",                          // string - Emoji/ícone
}
```

### Índices Recomendados:
- `categoria` (ASC)
- `status` (ASC)
- `ordem` (ASC)

---

## 2️⃣ **COLEÇÃO: `equipes`**

### Documento: `{equipeId}` (ex: "turma_101", "turma_201")

```javascript
{
  // Identificação
  id: "turma_301",                      // string - ID único
  nome: "Turma 301",                    // string - Nome da turma
  anoSerie: "3º Ano",                   // string - Série
  numeroTurma: 301,                     // number - Número da turma
  
  // Visual
  cor: "#ff6b6b",                       // string - Cor principal (hex)
  corSecundaria: "#ee5a52",             // string - Cor secundária
  
  // Responsáveis/Representantes
  representantes: [                     // array - Alunos responsáveis
    {
      nome: "João Silva",
      cpf: "123.456.789-00",
      contato: "(51) 99999-9999"
    },
    {
      nome: "Maria Santos",
      cpf: "987.654.321-00",
      contato: "(51) 98888-8888"
    }
  ],
  
  // Estatísticas (calculado)
  totalPontos: 0,                       // number - Pontuação geral acumulada
  totalModalidades: 0,                  // number - Modalidades participadas
  posicaoRanking: 0,                    // number - Posição no ranking geral
  
  // Provas administrativas
  inscricaoKit: {
    completa: false,                    // boolean
    dataEntrega: null,                  // Timestamp | null
    pontos: 0                           // 160 ou 0
  },
  
  disciplinaOrganizacao: {
    pontos: 160,                        // number - Inicia com 160
    ocorrencias: 0,                     // number - Quantidade de ocorrências
    avaliacoesSalaSuja: 0,              // number - Avaliações negativas
    historico: []                       // array de ocorrências
  },
  
  presencas: {
    totalAulas: 0,                      // number
    totalPresencas: 0,                  // number
    percentual: 0,                      // number (0-100)
    pontos: 0                           // number - Pontuação baseada no percentual
  },
  
  // Timestamps
  createdAt: Timestamp,
  updatedAt: Timestamp,
}
```

### Índices Recomendados:
- `numeroTurma` (ASC)
- `totalPontos` (DESC) - Para ranking
- `posicaoRanking` (ASC)

---

## 3️⃣ **COLEÇÃO: `inscricoes`**

### Documento: `{modalidadeId}` (ex: "futsal_masc")

```javascript
{
  modalidadeId: "futsal_masc",          // string - Referência à modalidade
  
  equipes: [                            // array - Equipes inscritas
    {
      equipeId: "turma_301",
      nomeEquipe: "Turma 301",
      dataInscricao: Timestamp,
      status: "confirmada"              // "confirmada" | "pendente" | "cancelada"
    },
    {
      equipeId: "turma_302",
      nomeEquipe: "Turma 302",
      dataInscricao: Timestamp,
      status: "confirmada"
    }
    // ... até 16 equipes
  ],
  
  totalEquipes: 16,                     // number - Total de inscritos
  limiteEquipes: 16,                    // number - Limite da modalidade
  inscricoesAbertas: true,              // boolean
  
  updatedAt: Timestamp,
}
```

---

## 4️⃣ **COLEÇÃO: `chaves`**

### Documento: `{modalidadeId}` (ex: "futsal_masc")

```javascript
{
  modalidadeId: "futsal_masc",
  
  chaves: [
    {
      chaveNumero: 1,                   // number - Número da chave (1, 2, 3, 4)
      nomeChave: "Chave A",             // string
      
      equipes: [                        // array - Equipes da chave
        {
          equipeId: "turma_301",
          nomeEquipe: "Turma 301",
          posicao: 1                    // number - Posição na chave (1-4)
        },
        {
          equipeId: "turma_302",
          nomeEquipe: "Turma 302",
          posicao: 2
        },
        {
          equipeId: "turma_303",
          nomeEquipe: "Turma 303",
          posicao: 3
        },
        {
          equipeId: "turma_304",
          nomeEquipe: "Turma 304",
          posicao: 4
        }
      ],
      
      jogos: [                          // array - Jogos da fase de chaves
        {
          jogoId: "futsal_masc_chave1_jogo1",
          equipeA: "turma_301",
          equipeB: "turma_302",
          rodada: 1,
          status: "pendente"            // "pendente" | "em_andamento" | "concluido"
        },
        // ... outros jogos
      ],
      
      // Classificação da chave (calculado após jogos)
      classificacao: [
        {
          equipeId: "turma_301",
          posicao: 1,
          pontos: 9,
          jogos: 3,
          vitorias: 3,
          empates: 0,
          derrotas: 0,
          golsPro: 12,
          golsContra: 3,
          saldoGols: 9,
          aproveitamento: 100
        }
        // ... outras equipes
      ]
    },
    // ... outras chaves (2, 3, 4)
  ],
  
  classificadosParaEliminatorias: [     // array - Equipes que avançaram
    {
      equipeId: "turma_301",
      chaveOrigem: 1,
      posicaoChave: 1
    },
    {
      equipeId: "turma_302",
      chaveOrigem: 1,
      posicaoChave: 2
    }
    // ... 8 equipes (1º e 2º de cada chave)
  ],
  
  updatedAt: Timestamp,
}
```

---

## 5️⃣ **COLEÇÃO: `confrontos`**

### Documento: `{confrontoId}` (ex: "futsal_masc_oitavas_1")

```javascript
{
  // Identificação
  confrontoId: "futsal_masc_oitavas_1",
  modalidadeId: "futsal_masc",
  
  // Fase do confronto
  fase: "oitavas",                      // "chaves" | "oitavas" | "quartas" | "semi" | "final" | "terceiro"
  faseOrdem: 1,                         // number - Ordem dentro da fase
  
  // Equipes
  equipeA: {
    equipeId: "turma_301",
    nomeEquipe: "Turma 301",
    origem: "1º Chave A"                // string - De onde veio
  },
  
  equipeB: {
    equipeId: "turma_308",
    nomeEquipe: "Turma 308",
    origem: "2º Chave D"
  },
  
  // Resultado
  resultado: {
    scoreA: 5,                          // number | null
    scoreB: 3,                          // number | null
    vencedor: "turma_301",              // string | null - equipeId do vencedor
    
    // Para melhor de 3 (Truco/Bisca)
    jogos: [
      { jogo: 1, scoreA: 24, scoreB: 18 },
      { jogo: 2, scoreA: 20, scoreB: 24 },
      { jogo: 3, scoreA: 24, scoreB: 15 }
    ],
    
    // Para sistemas de tempo/medida
    tempoA: "00:11.50",                 // string | null
    tempoB: "00:11.75",                 // string | null
    
    // Para atletismo com tentativas
    tentativasA: [5.80, 5.95, 6.10],    // array | null
    tentativasB: [5.70, 5.85, 5.90],    // array | null
    melhorMarcaA: 6.10,                 // number | null
    melhorMarcaB: 5.90,                 // number | null
  },
  
  // Status
  status: "concluido",                  // "pendente" | "em_andamento" | "concluido"
  
  // Próximo confronto (para eliminatórias)
  proximoConfrontoId: "futsal_masc_quartas_1", // string | null
  posicaoProximoConfronto: "equipeA",   // "equipeA" | "equipeB"
  
  // Observações
  observacoes: "",                      // string
  
  // Timestamps
  dataHora: Timestamp,                  // Quando ocorreu/ocorrerá
  createdAt: Timestamp,
  updatedAt: Timestamp,
}
```

### Índices Recomendados:
- `modalidadeId` (ASC) + `fase` (ASC)
- `modalidadeId` (ASC) + `status` (ASC)
- `dataHora` (ASC)

---

## 6️⃣ **COLEÇÃO: `resultados`**

### Documento: `{resultadoId}` (ex: "futsal_masc_turma_301")

```javascript
{
  // Identificação
  resultadoId: "futsal_masc_turma_301",
  modalidadeId: "futsal_masc",
  equipeId: "turma_301",
  
  // Colocação final
  colocacao: 1,                         // number (1º, 2º, 3º... 16º)
  
  // Pontuação para ranking geral
  pontosGerais: 160,                    // number (160, 150, 140... 10)
  
  // Estatísticas da modalidade
  estatisticas: {
    // Para modalidades com jogos
    jogos: 7,
    vitorias: 6,
    empates: 0,
    derrotas: 1,
    golsPro: 28,
    golsContra: 12,
    saldoGols: 16,
    
    // Para modalidades de tempo
    melhorTempo: "00:11.50",
    tempoMedio: "00:11.75",
    
    // Para modalidades de pontuação
    pontuacaoTotal: 95,
    pontuacaoMedia: 31.67,
    
    // Para modalidades com tentativas
    melhorMarca: 6.10,
    marcaMedia: 5.98,
  },
  
  // Histórico (resumo da participação)
  historico: [
    {
      fase: "chaves",
      resultado: "1º lugar - Chave A"
    },
    {
      fase: "quartas",
      resultado: "Vitória 5x2"
    },
    {
      fase: "semi",
      resultado: "Vitória 4x3"
    },
    {
      fase: "final",
      resultado: "Campeão - 3x1"
    }
  ],
  
  // Timestamps
  createdAt: Timestamp,
  updatedAt: Timestamp,
}
```

### Índices Recomendados:
- `modalidadeId` (ASC) + `colocacao` (ASC)
- `equipeId` (ASC)
- `pontosGerais` (DESC)

---

## 7️⃣ **COLEÇÃO: `ranking`**

### Documento: `geral`

```javascript
{
  tipo: "geral",                        // string
  
  classificacao: [
    {
      posicao: 1,
      equipeId: "turma_301",
      nomeEquipe: "Turma 301",
      totalPontos: 2480,                // number - Soma de todas modalidades
      
      // Detalhamento
      modalidadesParticipadas: 18,
      primeirosLugares: 5,
      segundosLugares: 3,
      terceirosLugares: 2,
      
      // Breakdown por categoria
      pontosMasculino: 850,
      pontosFeminino: 750,
      pontosMisto: 880,
      
      // Provas administrativas
      pontosInscricao: 160,
      pontosDisciplina: 140,
      pontosPresenca: 280,
    },
    // ... outras equipes
  ],
  
  totalEquipes: 16,
  
  // Última atualização
  ultimaAtualizacao: Timestamp,
  calculadoEm: Timestamp,
}
```

### Documento: `masculino`, `feminino`, `misto`

```javascript
{
  tipo: "masculino",                    // "masculino" | "feminino" | "misto"
  
  classificacao: [
    {
      posicao: 1,
      equipeId: "turma_301",
      nomeEquipe: "Turma 301",
      totalPontos: 850,
      modalidadesParticipadas: 8,
      primeirosLugares: 3,
      segundosLugares: 2,
      terceirosLugares: 1,
    }
    // ... outras equipes
  ],
  
  ultimaAtualizacao: Timestamp,
}
```

---

## 8️⃣ **COLEÇÃO: `configuracoes`**

### Documento: `geral`

```javascript
{
  // Sistema
  nomeEvento: "XXIX Semana da Juventude",
  anoEvento: 2025,
  instituicao: "IFRS - Campus Erechim",
  
  // Período
  dataInicio: Timestamp,
  dataFim: Timestamp,
  
  // Pontuação geral (1º ao 16º lugar)
  tabelaPontuacao: [160, 150, 140, 130, 120, 110, 100, 90, 80, 70, 60, 50, 40, 30, 20, 10],
  
  // Status
  eventoAtivo: true,                    // boolean
  inscricoesAbertas: true,              // boolean
  
  // Contatos
  contatos: {
    email: "semanadajuventude@erechim.ifrs.edu.br",
    telefone: "(54) 3321-8100",
    site: "https://ifrs.edu.br/erechim"
  },
  
  // Cores do tema
  tema: {
    corPrimaria: "#2dd4bf",
    corSecundaria: "#0891b2",
    corDestaque: "#ffd700"
  },
  
  updatedAt: Timestamp,
}
```

### Documento: `equipes_padrao`

```javascript
{
  // Lista de equipes padrão (turmas do IFRS)
  equipes: [
    { nome: "Turma 101", numero: 101, serie: "1º Ano", cor: "#ff6b6b" },
    { nome: "Turma 102", numero: 102, serie: "1º Ano", cor: "#4ecdc4" },
    { nome: "Turma 103", numero: 103, serie: "1º Ano", cor: "#45b7d1" },
    { nome: "Turma 201", numero: 201, serie: "2º Ano", cor: "#f9ca24" },
    { nome: "Turma 202", numero: 202, serie: "2º Ano", cor: "#f0932b" },
    { nome: "Turma 203", numero: 203, serie: "2º Ano", cor: "#eb4d4b" },
    { nome: "Turma 301", numero: 301, serie: "3º Ano", cor: "#6c5ce7" },
    { nome: "Turma 302", numero: 302, serie: "3º Ano", cor: "#a29bfe" },
    { nome: "Turma 303", numero: 303, serie: "3º Ano", cor: "#fd79a8" },
    { nome: "Turma 401", numero: 401, serie: "4º Ano", cor: "#00b894" },
    { nome: "Turma 402", numero: 402, serie: "4º Ano", cor: "#00cec9" },
    { nome: "Turma 403", numero: 403, serie: "4º Ano", cor: "#0984e3" },
    { nome: "Turma 501", numero: 501, serie: "5º Ano", cor: "#fdcb6e" },
    { nome: "Turma 502", numero: 502, serie: "5º Ano", cor: "#e17055" },
    { nome: "Turma 503", numero: 503, serie: "5º Ano", cor: "#d63031" },
    { nome: "Turma 601", numero: 601, serie: "6º Ano", cor: "#74b9ff" },
  ],
  
  updatedAt: Timestamp,
}
```

---

## 📐 **REGRAS DE SEGURANÇA FIRESTORE**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Função auxiliar: verificar se está autenticado
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Função auxiliar: verificar se é admin
    function isAdmin() {
      return isAuthenticated() && 
             request.auth.token.email != null;
    }
    
    // ========================================
    // LEITURA PÚBLICA (todos podem ler)
    // ========================================
    
    // Modalidades - leitura pública
    match /modalidades/{modalidadeId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    // Equipes - leitura pública
    match /equipes/{equipeId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    // Inscrições - leitura pública
    match /inscricoes/{inscricaoId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    // Chaves - leitura pública
    match /chaves/{chaveId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    // Confrontos - leitura pública
    match /confrontos/{confrontoId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    // Resultados - leitura pública
    match /resultados/{resultadoId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    // Ranking - leitura pública
    match /ranking/{rankingId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    // Configurações - leitura pública, escrita admin
    match /configuracoes/{configId} {
      allow read: if true;
      allow write: if isAdmin();
    }
  }
}
```

---

## 🔄 **RELACIONAMENTOS**

```
modalidades (1) ──┬── (N) inscricoes
                  ├── (1) chaves
                  ├── (N) confrontos
                  └── (N) resultados

equipes (1) ──┬── (N) inscricoes
              └── (N) resultados

inscricoes (N) ── (1) modalidades
               └── (N) equipes

chaves (1) ── (1) modalidades
           └── (N) equipes (referência)

confrontos (N) ── (1) modalidades
               └── (2) equipes (referência)

resultados (N) ── (1) modalidades
               └── (1) equipes

ranking (1) ── (N) equipes (referência)
```

---

## 🎯 **QUERIES COMUNS**

### 1. Buscar todas as modalidades por categoria
```javascript
const q = query(
  collection(db, "modalidades"),
  where("categoria", "==", "masculino"),
  orderBy("ordem", "asc")
);
```

### 2. Buscar equipes inscritas em uma modalidade
```javascript
const docRef = doc(db, "inscricoes", modalidadeId);
const docSnap = await getDoc(docRef);
const equipes = docSnap.data().equipes;
```

### 3. Buscar confrontos de uma fase específica
```javascript
const q = query(
  collection(db, "confrontos"),
  where("modalidadeId", "==", "futsal_masc"),
  where("fase", "==", "quartas"),
  orderBy("faseOrdem", "asc")
);
```

### 4. Buscar ranking geral
```javascript
const docRef = doc(db, "ranking", "geral");
const docSnap = await getDoc(docRef);
const ranking = docSnap.data().classificacao;
```

### 5. Buscar resultados de uma equipe
```javascript
const q = query(
  collection(db, "resultados"),
  where("equipeId", "==", "turma_301"),
  orderBy("pontosGerais", "desc")
);
```

---

**✅ Estrutura completa do Firestore definida!**

Próximos passos:
1. Implementar APIs (modalidades.js, equipes.js, resultados.js)
2. Criar script de migração dos dados
3. Integrar com os componentes
