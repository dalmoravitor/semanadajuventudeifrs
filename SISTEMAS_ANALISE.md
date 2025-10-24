# Análise de Sistemas - XXIX Semana da Juventude

## Sistemas Identificados

### 1. **eliminacao-simples** (CS:GO, Truco, Bisca)
- 16 equipes
- Oitavas → Quartas → Semis → Final
- Truco e Bisca: Melhor de 3 partidas
- **Status**: ✅ Implementado (EliminacaoSimples)

### 2. **chaves+eliminacao** (Futsal, Handebol, Voleibol, Basquetebol, etc)
- 16 equipes em 4-5 chaves
- Todos contra todos nas chaves
- Classificam 1º e 2º (ou variações)
- Quartas → Semis → Final
- **Status**: ✅ Implementado (TabelaChaves + TabelaJogosChaves + TabelaEliminatorias)

### 3. **pontuacao-fixa** (Culinária, Show de Talentos)
- Avaliação por critérios com pontuação definida
- Juízes/comissão atribuem notas
- Classificação por soma total
- **Status**: ❌ Pendente

### 4. **pontuacao-acumulada** (Laço, Xadrez, Soletrando)
- Múltiplas rodadas/tentativas
- Soma de pontos determina classificação
- **Status**: ❌ Pendente

### 5. **tempo** (Atletismo 100m/800m/1500m/4x100, Gincana Recreativa)
- Classificação por menor tempo
- Baterias classificatórias + Final
- **Status**: ❌ Pendente

### 6. **melhor-de-3** (Salto Distância, Dardo)
- 3 tentativas
- Melhor marca conta
- **Status**: ❌ Pendente

### 7. **multi-etapas** (Sudoku)
- Subdivisões → Semifinal → Final
- Classificação por somatório de tempos
- **Status**: ❌ Pendente

### 8. **chaves-especiais** (FIFA, Mortal Kombat, Bocha)
- 4 chaves de 4 equipes (diferente das 5 chaves padrão)
- Classificam 1º e 2º
- **Status**: ❌ Pendente

### 9. **administrativas** (Inscrição, Disciplina, Presenças)
- Pontuações fixas ou percentuais
- Não requerem interface de jogos
- **Status**: ❌ Pendente

## Correções Necessárias no modalidadeConfig.js

### Número de Chaves por Categoria:
- **Masculino**: 4 chaves (não 5)
- **Feminino**: 4 chaves
- **Misto**: 4 chaves (cabo-de-guerra) ou 4 (fifa/mortal kombat)
- **Exceção**: Handebol Masculino tem 5 chaves no regulamento

### Sistemas Corretos por Modalidade:
1. **CS:GO**: eliminacao-simples (16 equipes, direto)
2. **FIFA/Mortal Kombat**: chaves+eliminacao (4 chaves de 4)
3. **Truco/Bisca**: eliminacao-simples-melhor-de-3
4. **Futsal/Handebol/Voleibol/Basquetebol**: chaves+eliminacao (4 chaves)
5. **Atletismo**: Depende da prova (tempo-baterias ou tempo-unico)
6. **Laço/Culinária/Show**: pontuacao-fixa

## Prioridades de Implementação:

1. ✅ eliminacao-simples (CS:GO) - FEITO
2. ✅ chaves+eliminacao padrão - FEITO
3. 🔄 Corrigir número de chaves (4 ao invés de 5)
4. ⏱️ pontuacao-fixa (Culinária, Show, Laço)
5. ⏱️ tempo-baterias (Atletismo 100m, 4x100)
6. ⏱️ tempo-unico (Atletismo 800m, 1500m, Gincana)
7. ⏱️ melhor-de-3-marcas (Dardo, Salto)
8. ⏱️ Adaptar FIFA (4 chaves ao invés de 5)
