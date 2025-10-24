# 🏗️ Nova Estrutura de Chaves e Eliminatórias

## 📁 Arquitetura Implementada

### 1. **Service Layer** (`src/services/chavesService.js`)

Contém TODA a lógica de negócio relacionada a chaves e eliminatórias:

- ✅ `gerarChavesVazias()` - Gera estrutura inicial de chaves
- ✅ `chaveEstaCompleta()` - Verifica se uma chave está preenchida
- ✅ `todasChavesCompletas()` - Verifica se todas as chaves estão completas
- ✅ `calcularClassificacaoChave()` - Calcula pontos, vitórias, saldo de gols
- ✅ `gerarConfrontosQuartas()` - Gera confrontos das quartas de final
- ✅ `gerarConfrontosSemifinais()` - Gera confrontos das semifinais
- ✅ `gerarConfrontosFinais()` - Gera final e disputa de 3º lugar
- ✅ `extrairVencedor()` - Retorna vencedor de um jogo
- ✅ `extrairPerdedor()` - Retorna perdedor de um jogo

### 2. **Custom Hooks** (`src/hooks/`)

#### `useChaves.js`
Gerencia estado de chaves com sincronização automática ao Firestore:

```javascript
const { chaves, setChaves, resetChaves, chavesCompletas } = useChaves(
  chavesDataFromProps,      // Dados do Firestore
  setChavesDataFromProps,   // Função para atualizar no HOC
  modalidadeId,             // ID da modalidade
  categoria                 // Categoria (masculino, feminino, misto)
);
```

**Funcionalidades:**
- ✅ Carrega chaves do Firestore (se existirem)
- ✅ Gera chaves vazias automaticamente (se não existirem)
- ✅ Sincroniza mudanças com HOC automaticamente
- ✅ Detecta se chaves estão completas

#### `useResultadosChaves.js`
Gerencia resultados de jogos com sincronização automática:

```javascript
const { getResultadoJogo, setResultadoJogo, todosResultadosChave } = useResultadosChaves(
  resultadosFromProps,      // Resultados do Firestore
  setResultadosFromProps,   // Função para atualizar no HOC
  modalidadeId              // ID da modalidade
);
```

**Funcionalidades:**
- ✅ `getResultadoJogo(chaveIdx, jogoIdx)` - Busca resultado específico
- ✅ `setResultadoJogo(chaveIdx, jogoIdx, equipeA, equipeB, scoreA, scoreB)` - Salva resultado
- ✅ `todosResultadosChave(chaveIdx)` - Retorna todos os resultados de uma chave

### 3. **Componentes** (`src/pages/ModalidadeDetalhe.jsx`)

Agora os componentes são MUITO mais simples, apenas renderizam UI:

- `TabelaChaves` - Renderiza campos para preencher nomes das equipes
- `TabelaJogosChaves` - Renderiza jogos e permite inserir resultados
- `TabelaEliminatorias` - Renderiza quartas, semis e final

## 🔄 Fluxo de Dados

### Salvamento Automático

```
Admin preenche chaves → setChaves() → useChaves detecta mudança
                                    ↓
                        setChavesDataFromProps({ chaves, modalidadeId })
                                    ↓
                        HOC detecta mudança (useEffect)
                                    ↓
                        setHasUnsavedChanges(true)
                                    ↓
                    Botão "Salvar Alterações" aparece
                                    ↓
                    Admin clica no botão
                                    ↓
                    saveChaves(modalidadeId, chavesData)
                                    ↓
                    Firestore atualizado ✅
```

### Mesmo fluxo para Resultados de Jogos

```
Admin insere resultado → setResultadoJogo() → useResultadosChaves
                                            ↓
                            setResultadosFromProps([...array, novo])
                                            ↓
                                    HOC detecta mudança
                                            ↓
                            Botão "Salvar Alterações" aparece
                                            ↓
                                    Admin clica
                                            ↓
                        saveResultado() para cada resultado
                                            ↓
                            Firestore atualizado ✅
```

## ✅ Vantagens da Nova Estrutura

### 1. **Separação de Responsabilidades**
- ❌ ANTES: Tudo misturado em ModalidadeDetalhe.jsx (6600 linhas!)
- ✅ AGORA: 
  - Lógica → `chavesService.js`
  - Estado → `useChaves.js` + `useResultadosChaves.js`
  - UI → Componentes React

### 2. **Reutilização de Código**
- ❌ ANTES: Funções duplicadas em vários lugares
- ✅ AGORA: Funções centralizadas, usadas por qualquer componente

### 3. **Testabilidade**
- ❌ ANTES: Impossível testar lógica sem renderizar componente
- ✅ AGORA: Funções puras podem ser testadas isoladamente

### 4. **Manutenibilidade**
- ❌ ANTES: Mudar lógica de classificação = procurar em 6600 linhas
- ✅ AGORA: Tudo em `calcularClassificacaoChave()` em chavesService.js

### 5. **Performance**
- ❌ ANTES: Recalculava tudo a cada render
- ✅ AGORA: Hooks otimizados com useCallback, evitam re-renders

## 🎯 Como Usar

### No ModalidadeDetalhe:

```javascript
import { useChaves } from "../hooks/useChaves";
import { useResultadosChaves } from "../hooks/useResultadosChaves";

function ModalidadeDetalhe({ chavesDataFromProps, setChavesDataFromProps, ... }) {
  // 1. Usar hook de chaves
  const { chaves, setChaves, chavesCompletas } = useChaves(
    chavesDataFromProps, 
    setChavesDataFromProps, 
    id, 
    categoria
  );
  
  // 2. Usar hook de resultados
  const { getResultadoJogo, setResultadoJogo } = useResultadosChaves(
    resultadosFromProps,
    setResultadosFromProps,
    id
  );
  
  // 3. Passar para componentes
  return (
    <TabelaChaves chaves={chaves} setChaves={setChaves} adminMode={isAdmin} />
    <TabelaJogosChaves 
      chaves={chaves} 
      getResultado={getResultadoJogo}
      setResultado={setResultadoJogo}
      adminMode={isAdmin}
    />
  );
}
```

## 📊 Estrutura de Dados

### Chaves no Firestore:

```javascript
{
  modalidadeId: "handebol_masc",
  chaves: [
    {
      nome: "Chave A",
      equipes: ["Turma 11", "Turma 12", "Turma 13"]
    },
    {
      nome: "Chave B",
      equipes: ["Turma 21", "Turma 22", "Turma 23"]
    },
    // ... mais chaves
  ],
  updatedAt: "2025-01-10T..."
}
```

### Resultados no Firestore:

```javascript
[
  {
    id: "chave0_jogo0",
    modalidadeId: "handebol_masc",
    chaveIdx: 0,
    jogoIdx: 0,
    equipeA: "Turma 11",
    equipeB: "Turma 12",
    scoreA: 3,
    scoreB: 1,
    timestamp: "2025-01-10T..."
  },
  {
    id: "chave0_jogo1",
    modalidadeId: "handebol_masc",
    chaveIdx: 0,
    jogoIdx: 1,
    equipeA: "Turma 12",
    equipeB: "Turma 13",
    scoreA: 2,
    scoreB: 2,
    timestamp: "2025-01-10T..."
  },
  // ... mais resultados
]
```

## 🚀 Próximos Passos

1. ✅ Service criado (`chavesService.js`)
2. ✅ Hooks criados (`useChaves.js`, `useResultadosChaves.js`)
3. ⏳ Atualizar TabelaJogosChaves para usar hooks
4. ⏳ Atualizar TabelaEliminatorias para usar service
5. ⏳ Testar fluxo completo
6. ⏳ Remover código legacy

## 🐛 Problemas Resolvidos

- ✅ Dados perdidos ao recarregar
- ✅ Botão "Salvar" ausente
- ✅ Sincronização com Firestore
- ⏳ Quartas de final não sendo geradas (próxima correção)
