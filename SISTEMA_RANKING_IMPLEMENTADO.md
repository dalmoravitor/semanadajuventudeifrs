# ✅ SISTEMA DE RANKING IMPLEMENTADO

## 📊 Visão Geral

O sistema de ranking foi implementado para calcular automaticamente a pontuação de cada modalidade e somar no ranking geral. 

### Como Funciona:

1. **Cada modalidade gera seu ranking** quando concluída
2. **Ranking é salvo no Firestore** na collection `ranking` com o ID da modalidade
3. **Ranking inclui**: `posicao`, `equipe` (nome), `equipeId` (ID), `pontos`
4. **Pontuação**: 1º=160pts, 2º=150pts, 3º=140pts... até 16º=10pts (reduz 10 em 10)
5. **Ranking geral** soma os pontos de TODAS as modalidades e distribui para as turmas base

---

## ✅ Sistemas Implementados

### 1. **SistemaChavesEliminatorias** ✅
- **Modalidades**: Futsal, Vôlei, Handebol, Basquetebol, etc.
- **Quando gera**: Após a final ser concluída
- **Como**: useEffect detecta quando `confrontosFinal` tem resultado
- **Função**: `gerarRanking(classificacaoFinal, todasEquipes)`

### 2. **SistemaEliminacaoSimples** ✅
- **Modalidades**: CS:GO, Truco, Bisca
- **Quando gera**: Após a final ser concluída
- **Como**: useEffect detecta quando `confrontoFinal` tem resultado
- **Função**: `gerarRankingEliminacaoSimples()`

### 3. **SistemaTempo** ✅
- **Modalidades**: Atletismo 100m, 800m, 1500m, 4x100, Gincana Recreativa
- **Quando gera**: Quando TODOS os participantes têm tempo registrado
- **Como**: useEffect verifica se `todos os participantes.every(p => tempos[p.id] existe)`
- **Função**: `gerarRankingTempo(participantes, tempos, todasEquipes)`

### 4. **SistemaPontuacaoFixa** ✅
- **Modalidades**: Culinária, Show de Talentos
- **Quando gera**: Quando TODOS os participantes têm TODAS as notas preenchidas
- **Como**: useEffect verifica se `todos os critérios foram avaliados para todos`
- **Função**: `gerarRankingPontuacaoFixa(participantes, avaliacoes, todasEquipes)`

---

## 🔨 Sistemas Pendentes (Precisam Implementação)

### 5. **SistemaEliminacaoMelhorDe3**
- **Modalidades**: Truco, Bisca (caso usem melhor de 3)
- **Implementar**: Similar ao SistemaEliminacaoSimples
- **Função**: Usar `gerarRankingEliminacaoSimples()`

### 6. **SistemaBateriaUnica**
- **Modalidades**: Atletismo com bateria única
- **Implementar**: Similar ao SistemaTempo
- **Função**: Usar `gerarRankingTempo()`

### 7. **SistemaPontuacaoAcumulada**
- **Modalidades**: Laço, Xadrez, Soletrando
- **Implementar**: Quando todas as rodadas forem concluídas
- **Função**: Criar `gerarRankingPontuacaoAcumulada()` em `rankingHelpers.js`

### 8. **SistemaBochaCampeira**
- **Modalidades**: Bocha Campeira
- **Implementar**: Após todas as partidas
- **Função**: Usar `gerarRankingGenerico()`

### 9. **SistemaKahoot**
- **Modalidades**: Kahoot
- **Implementar**: Após o quiz ser concluído
- **Função**: Usar `gerarRankingGenerico()`

### 10. **SistemaSoletrando**
- **Modalidades**: Soletrando
- **Implementar**: Após todas as rodadas
- **Função**: Usar `gerarRankingGenerico()`

### 11. **SistemaMelhorDe3**
- **Modalidades**: Salto em Distância, Lançamento de Dardo
- **Implementar**: Quando todos tiverem 3 tentativas
- **Função**: Criar `gerarRankingMelhorDe3()` em `rankingHelpers.js`

### 12. **SistemaSudoku**
- **Modalidades**: Sudoku
- **Implementar**: Após subdivisões, semifinal e final
- **Função**: Usar `gerarRankingTempo()` (por tempo total)

---

## 🛠️ Como Implementar nos Outros Sistemas

### Passo 1: Importar funções
```javascript
import { gerarRankingTempo } from '../../utils/rankingHelpers';
import { saveRankingModalidade, getRankingModalidade } from '../../api/ranking';
```

### Passo 2: Adicionar estado
```javascript
const [rankingSalvo, setRankingSalvo] = useState(false);
```

### Passo 3: Verificar se ranking já existe
```javascript
useEffect(() => {
  const verificarRanking = async () => {
    if (!modalidade?.id) return;
    const result = await getRankingModalidade(modalidade.id);
    if (result.success && result.data && result.data.ranking) {
      console.log('📊 Ranking já existe para esta modalidade');
      setRankingSalvo(true);
    }
  };
  verificarRanking();
}, [modalidade?.id]);
```

### Passo 4: Gerar ranking quando condições forem atendidas
```javascript
useEffect(() => {
  const gerarESalvarRanking = async () => {
    // Verificar se ranking já foi salvo
    if (rankingSalvo) return;

    // VERIFICAR SUA CONDIÇÃO ESPECÍFICA AQUI
    // Exemplos:
    // - Final concluída: if (!confrontoFinal || !resultados[confrontoFinal.id]) return;
    // - Todos tempos: if (!participantes.every(p => tempos[p.id])) return;
    // - Todas notas: if (!participantes.every(p => todasNotasPreenchidas(p))) return;

    console.log('🔍 Gerando ranking...');

    try {
      // CHAMAR FUNÇÃO APROPRIADA
      const ranking = gerarRankingXXX(...); // Sua função aqui

      console.log('📊 Ranking gerado:', ranking);

      if (ranking.length > 0) {
        const result = await saveRankingModalidade(modalidade.id, ranking);
        if (result.success) {
          console.log('✅ Ranking salvo com sucesso no Firestore!');
          setRankingSalvo(true);
        } else {
          console.error('❌ Erro ao salvar ranking:', result.error);
        }
      }
    } catch (error) {
      console.error('❌ Erro ao gerar ranking:', error);
    }
  };

  gerarESalvarRanking();
}, [/* suas dependências */]);
```

---

## 📁 Arquivos Criados/Modificados

### Criados:
- ✅ `src/utils/rankingHelpers.js` - Funções auxiliares de geração de ranking

### Modificados:
- ✅ `src/api/ranking.js` - Adicionado suporte a `equipeId`
- ✅ `src/components/sistemas/SistemaChavesEliminatorias.jsx` - Geração automática
- ✅ `src/components/sistemas/SistemaEliminacaoSimples.jsx` - Geração automática
- ✅ `src/components/sistemas/SistemaTempo.jsx` - Geração automática
- ✅ `src/components/sistemas/SistemaPontuacaoFixa.jsx` - Geração automática

---

## 🔍 Estrutura do Ranking Salvo no Firestore

### Collection: `ranking`
### Document ID: `{modalidadeId}` (ex: "futsal_masc")

```javascript
{
  modalidadeId: "futsal_masc",
  ranking: [
    {
      posicao: 1,
      equipe: "Turma 11",        // Nome da equipe
      equipeId: "turma_11",      // ID da equipe (IMPORTANTE!)
      pontos: 160
    },
    {
      posicao: 2,
      equipe: "Turma 12/13",
      equipeId: "turma_1213",
      pontos: 150
    },
    // ... até 16 equipes
  ],
  updatedAt: Timestamp,
  createdAt: Timestamp
}
```

### ⚠️ IMPORTANTE: `equipeId` é essencial!

O `equipeId` é usado pelo `rankingGeralService.js` para:
1. Buscar a distribuição de pontos da equipe
2. Distribuir os pontos para as turmas base corretas
3. Somar os pontos no ranking geral

**Exemplo:**
- Se "Turma 12/13" fica em 1º (160pts)
- `getDistribuicaoPontos("turma_1213")` retorna:
  - `{ turmaId: "turma_12", percentual: 1.0 }` → Turma 12 recebe 160pts
  - `{ turmaId: "turma_13", percentual: 1.0 }` → Turma 13 recebe 160pts

---

## 📊 Fluxo Completo do Ranking

```
┌─────────────────────────────────────┐
│  Modalidade Concluída               │
│  (final, todos tempos, todas notas) │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  useEffect detecta condição         │
│  Chama gerarRanking()               │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Ranking gerado com equipeId        │
│  [{ posicao, equipe, equipeId, pts }]│
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  saveRankingModalidade()            │
│  Salva em Firestore: ranking/{id}  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Página /ranking carrega            │
│  calcularRankingGeralFromFirestore()│
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Para cada modalidade:              │
│  getRankingModalidade(id)           │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Para cada equipe no ranking:       │
│  getDistribuicaoPontos(equipeId)    │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Distribui pontos para turmas base  │
│  turma_12: +160pts, turma_13: +160pts│
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Soma todos os pontos por turma     │
│  Ordena por totalPontos DESC        │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Exibe Ranking Geral                │
│  Turma 11: 320pts (2 modalidades)   │
│  Turma 12: 160pts (1 modalidade)    │
└─────────────────────────────────────┘
```

---

## ✅ Checklist de Implementação

### Para Cada Sistema Pendente:

- [ ] Importar `gerarRankingXXX` e `saveRankingModalidade`
- [ ] Adicionar estado `rankingSalvo`
- [ ] useEffect para verificar ranking existente
- [ ] useEffect para gerar ranking quando condição for atendida
- [ ] Testar com dados reais
- [ ] Verificar se `equipeId` está sendo salvo corretamente
- [ ] Verificar se ranking aparece em `/ranking`

---

## 🧪 Como Testar

### 1. Testar Geração de Ranking de uma Modalidade:

```javascript
// No console do navegador
console.log('Testando geração de ranking...');

// Verificar ranking salvo
const { getRankingModalidade } = require('./src/api/ranking');
const result = await getRankingModalidade('futsal_masc');
console.log(result);

// Deve retornar:
// {
//   success: true,
//   data: {
//     modalidadeId: 'futsal_masc',
//     ranking: [
//       { posicao: 1, equipe: '...', equipeId: '...', pontos: 160 },
//       ...
//     ]
//   }
// }
```

### 2. Testar Ranking Geral:

1. Acesse `/ranking`
2. Verifique se as turmas aparecem
3. Verifique se os pontos estão somando corretamente
4. Clique em "Ver Detalhes" para ver breakdown por modalidade
5. Verificar se equipes combinadas distribuem pontos corretamente

### 3. Testar Distribuição de Pontos (Equipes Combinadas):

```javascript
// Exemplo: Turma 12/13 fica em 1º lugar no Futsal (160pts)
// Turma 12 deve receber 160pts
// Turma 13 deve receber 160pts
// Total no ranking: Turma 12 = 160, Turma 13 = 160

// No console
const { calcularRankingGeralFromFirestore } = require('./src/services/rankingGeralService');
const { getModalidades } = require('./src/api/modalidades');

const modalidades = await getModalidades();
const ranking = await calcularRankingGeralFromFirestore(modalidades.data);
console.log(ranking);
```

---

## 📝 Notas Importantes

1. **Ranking só é gerado UMA VEZ**: O sistema verifica se `rankingSalvo` é true antes de gerar
2. **Para regerar**: Delete o documento em `ranking/{modalidadeId}` no Firestore
3. **Botão manual**: O `SistemaChavesEliminatorias` tem botão "Gerar Ranking Manualmente"
4. **Logs detalhados**: Todos os sistemas têm console.log para debug
5. **Validação**: Sistema verifica se todas as condições foram atendidas antes de gerar

---

## 🎯 Próximos Passos

1. ✅ **Implementar ranking nos sistemas pendentes** (5-11)
2. ✅ **Testar com dados reais**
3. ✅ **Validar distribuição de pontos**
4. ✅ **Verificar ranking geral**
5. ✅ **Documentar edge cases**

---

**Data:** 20/10/2025  
**Status:** 4/16 sistemas implementados (25%)  
**Próximo:** Implementar sistemas 5-11

