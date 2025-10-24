# Estrutura de Dados - Modalidade com Sistema de Chaves + Eliminação

## 📦 Coleção: `chaves/{modalidadeId}`

Documento único por modalidade contendo **todas as chaves e resultados dos jogos**.

```javascript
{
  // Identificação
  modalidadeId: "fifa",
  
  // ===================================
  // CHAVES (FASE DE GRUPOS)
  // ===================================
  chaves: [
    {
      nome: "Chave A",
      chaveNumero: 0,
      equipes: [
        "Equipe 1",
        "Equipe 2", 
        "Equipe 3"
      ]
    },
    {
      nome: "Chave B",
      chaveNumero: 1,
      equipes: [
        "Equipe 4",
        "Equipe 5",
        "Equipe 6"
      ]
    },
    // ... até Chave E (5 chaves para FIFA)
  ],
  
  // ===================================
  // RESULTADOS DOS JOGOS DAS CHAVES
  // ===================================
  resultadosJogos: [
    {
      id: "chave0_jogo0",
      chaveIdx: 0,
      jogoIdx: 0,
      equipeA: "Equipe 1",
      equipeB: "Equipe 2",
      scoreA: 2,
      scoreB: 1,
      timestamp: "2025-10-19T12:30:00.000Z"
    },
    {
      id: "chave0_jogo1",
      chaveIdx: 0,
      jogoIdx: 1,
      equipeA: "Equipe 2",
      equipeB: "Equipe 3",
      scoreA: 0,
      scoreB: 3,
      timestamp: "2025-10-19T13:00:00.000Z"
    },
    // ... todos os jogos das chaves
  ],
  
  // ===================================
  // CLASSIFICAÇÃO DAS CHAVES
  // ===================================
  classificacao: [
    {
      chaveIdx: 0,
      chaveName: "Chave A",
      classificados: [
        {
          posicao: 1,
          equipe: "Equipe 1",
          pontos: 9,
          jogos: 3,
          vitorias: 3,
          empates: 0,
          derrotas: 0,
          golsFeitos: 8,
          golsSofridos: 2,
          saldoGols: 6
        },
        {
          posicao: 2,
          equipe: "Equipe 2",
          pontos: 6,
          // ... estatísticas
        }
      ]
    }
    // ... classificação de todas as chaves
  ],
  
  // ===================================
  // FASE ELIMINATÓRIA
  // ===================================
  eliminatorias: {
    // Quartas de Final
    quartas: [
      {
        id: "quarta-1",
        confrontoNumero: 1,
        equipeA: { nome: "1º Chave A", origem: "Chave A" },
        equipeB: { nome: "2º Chave D", origem: "Chave D" },
        resultado: {
          scoreA: 2,
          scoreB: 1,
          penaltis: null, // { scoreA: 4, scoreB: 3 } se houver
          vencedor: "1º Chave A"
        },
        timestamp: "2025-10-19T14:00:00.000Z"
      },
      // ... 8 jogos de quartas
    ],
    
    // Semifinais
    semis: [
      {
        id: "semi-1",
        confrontoNumero: 1,
        equipeA: { nome: "Vencedor Q1", origem: "Quarta 1" },
        equipeB: { nome: "Vencedor Q2", origem: "Quarta 2" },
        resultado: {
          scoreA: 1,
          scoreB: 1,
          penaltis: { scoreA: 5, scoreB: 4 },
          vencedor: "Vencedor Q1"
        }
      },
      // ... 4 jogos de semis
    ],
    
    // Final
    final: {
      id: "final",
      equipeA: { nome: "Vencedor S1", origem: "Semi 1" },
      equipeB: { nome: "Vencedor S2", origem: "Semi 2" },
      resultado: {
        scoreA: 3,
        scoreB: 2,
        penaltis: null,
        vencedor: "Vencedor S1",
        campeao: true
      },
      timestamp: "2025-10-19T16:00:00.000Z"
    },
    
    // Disputa de 3º Lugar (se aplicável)
    terceiro: {
      id: "terceiro",
      equipeA: { nome: "Perdedor S1", origem: "Semi 1" },
      equipeB: { nome: "Perdedor S2", origem: "Semi 2" },
      resultado: {
        scoreA: 2,
        scoreB: 0,
        penaltis: null,
        vencedor: "Perdedor S1"
      }
    }
  },
  
  // ===================================
  // METADATA
  // ===================================
  status: "concluido", // "inscricoes" | "chaves" | "quartas" | "semis" | "final" | "concluido"
  faseAtual: "final",
  createdAt: Timestamp,
  updatedAt: Timestamp,
  ultimaAtualizacao: "2025-10-19T16:30:00.000Z"
}
```

## 📦 Coleção: `resultados/{modalidadeId}_{equipeId}`

Documento por equipe contendo resultado final e estatísticas da modalidade.

```javascript
{
  id: "fifa_equipe1",
  modalidadeId: "fifa",
  equipeId: "equipe1",
  equipeNome: "Equipe 1",
  
  // Colocação final
  colocacao: 1, // 1º lugar
  pontosGerais: 160, // Pontos para o ranking geral
  
  // Fase de eliminação
  faseEliminacao: "Campeão",
  
  // Estatísticas da fase de grupos
  estatisticasGrupos: {
    chave: "Chave A",
    posicaoChave: 1,
    pontos: 9,
    jogos: 3,
    vitorias: 3,
    empates: 0,
    derrotas: 0,
    golsFeitos: 8,
    golsSofridos: 2,
    saldoGols: 6
  },
  
  // Histórico de jogos
  historico: [
    { fase: "Grupos", adversario: "Equipe 2", resultado: "2x1", venceu: true },
    { fase: "Quartas", adversario: "Equipe 5", resultado: "3x0", venceu: true },
    { fase: "Semis", adversario: "Equipe 7", resultado: "2x1", venceu: true },
    { fase: "Final", adversario: "Equipe 10", resultado: "3x2", venceu: true }
  ],
  
  // Metadata
  sistema: "chaves+eliminacao",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## 🎯 Fluxo de Salvamento

### 1️⃣ **Ao preencher chaves** → Salvar em `chaves/{modalidadeId}`
```javascript
await saveChaves("fifa", {
  chaves: [...],
  status: "chaves"
});
```

### 2️⃣ **Ao inserir resultado de jogo** → Atualizar `resultadosJogos[]`
```javascript
// Hook useResultadosChaves já faz isso
setResultadoJogo(chaveIdx, jogoIdx, equipeA, equipeB, scoreA, scoreB);
```

### 3️⃣ **Ao completar fase de grupos** → Calcular classificação
```javascript
await saveChaves("fifa", {
  chaves: [...],
  resultadosJogos: [...],
  classificacao: calcularClassificacao(),
  status: "quartas"
});
```

### 4️⃣ **Ao completar eliminatórias** → Salvar ranking final
```javascript
// Para cada equipe
await saveResultado({
  modalidadeId: "fifa",
  equipeId: "equipe1",
  colocacao: 1,
  pontosGerais: 160,
  faseEliminacao: "Campeão"
});
```

## ✅ Benefícios

- ✅ **Persistência completa**: Todos os dados ficam salvos
- ✅ **Reload seguro**: Ao recarregar a página, tudo volta
- ✅ **Histórico preservado**: Todos os jogos registrados
- ✅ **Ranking automático**: Colocações calculadas
- ✅ **Auditoria**: Timestamps de cada ação

## 🔧 Implementação

A estrutura já está parcialmente implementada através dos hooks:
- `useChaves` → Gerencia `chaves[]`
- `useResultadosChaves` → Gerencia `resultadosJogos[]`
- HOC `withModalidadeData` → Carrega e salva tudo no Firebase

**Problema atual**: Os hooks estão sincronizando, mas o HOC não estava detectando mudanças quando os dados não existiam antes (originalChavesData = null).

**Solução aplicada**: Ajustei o HOC para detectar quando chaves são criadas pela primeira vez.
