# 📋 EQUIPES ATUALIZADAS - Semana da Juventude 2025

## 🔄 Mudanças Implementadas

### ✅ Sistema de Equipes por Categoria

O sistema foi atualizado para refletir a estrutura real das equipes separadas por categoria.

---

## 👥 EQUIPES MASCULINAS E MISTAS

**Total:** 15 equipes  
**Chaves:** 5 chaves de 3 equipes cada  
**ID no banco:** `masc_[numero]`

| # | Nome | Série | Cor |
|---|------|-------|-----|
| 1 | Turma 11 | 1º Ano | #ff6b6b |
| 2 | Turma 12/13 | 1º Ano | #4ecdc4 |
| 3 | Turma 14 | 1º Ano | #45b7d1 |
| 4 | Turma 21 | 2º Ano | #f9ca24 |
| 5 | Turma 22 | 2º Ano | #f0932b |
| 6 | Turma 23 | 2º Ano | #eb4d4b |
| 7 | Turma 24 | 2º Ano | #e74c3c |
| 8 | Turma 31 | 3º Ano | #6c5ce7 |
| 9 | Turma 32 | 3º Ano | #a29bfe |
| 10 | Turma 33 | 3º Ano | #fd79a8 |
| 11 | Turma 34 | 3º Ano | #e84393 |
| 12 | Turma TI11 | TI - 1º Ano | #00b894 |
| 13 | Turma TI12 | TI - 1º Ano | #00cec9 |
| 14 | Turma TI21/TI3 | TI - 2º/3º Ano | #0984e3 |
| 15 | Turma TI22 | TI - 2º Ano | #74b9ff |

---

## 👩 EQUIPES FEMININAS

**Total:** 12 equipes  
**Chaves:** 4 chaves de 3 equipes cada  
**ID no banco:** `fem_[numero]`

| # | Nome | Série | Cor |
|---|------|-------|-----|
| 1 | Turma 11 | 1º Ano | #ff6b6b |
| 2 | Turma 12/14 | 1º Ano | #4ecdc4 |
| 3 | Turma 13 | 1º Ano | #45b7d1 |
| 4 | Turma 21 | 2º Ano | #f9ca24 |
| 5 | Turma 22 | 2º Ano | #f0932b |
| 6 | Turma 23/24 | 2º Ano | #eb4d4b |
| 7 | Turma 31 | 3º Ano | #6c5ce7 |
| 8 | Turma 32/33 | 3º Ano | #a29bfe |
| 9 | Turma 34 | 3º Ano | #fd79a8 |
| 10 | Turma TI11/TI12 | TI - 1º Ano | #00b894 |
| 11 | Turma TI21 | TI - 2º Ano | #00cec9 |
| 12 | Turma TI22/TI3 | TI - 2º/3º Ano | #0984e3 |

---

## 🔧 Estrutura no Firestore

### Collection: `equipes`

Cada equipe terá um documento com:

```javascript
{
  id: "masc_11" ou "fem_11",
  nome: "Turma 11",
  numeroTurma: 11,
  anoSerie: "1º Ano",
  categoria: "masculino" ou "feminino",
  cor: "#ff6b6b",
  corSecundaria: "#ff6b6b",
  representantes: [],
  totalPontos: 0,
  totalModalidades: 0,
  posicaoRanking: 0,
  inscricaoKit: {
    completa: false,
    dataEntrega: null,
    pontos: 0
  },
  disciplinaOrganizacao: {
    pontos: 160,
    ocorrencias: 0,
    avaliacoesSalaSuja: 0,
    historico: []
  },
  presencas: {
    totalAulas: 0,
    totalPresencas: 0,
    percentual: 0,
    pontos: 0
  },
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Collection: `configuracoes`

**Documento: `geral`**
```javascript
{
  equipesPorCategoria: {
    masculino: 15,
    feminino: 12,
    misto: 15
  },
  chavesPorCategoria: {
    masculino: 5,
    feminino: 4,
    misto: 5
  }
}
```

**Documento: `equipes_masculino_misto`**
```javascript
{
  categoria: "masculino_misto",
  totalEquipes: 15,
  numeroChaves: 5,
  equipesPorChave: 3,
  equipes: [Array com 15 equipes]
}
```

**Documento: `equipes_feminino`**
```javascript
{
  categoria: "feminino",
  totalEquipes: 12,
  numeroChaves: 4,
  equipesPorChave: 3,
  equipes: [Array com 12 equipes]
}
```

**Documento: `equipes_todas`**
```javascript
{
  totalEquipes: 27,
  equipes: [Array com todas as 27 equipes]
}
```

---

## 📊 Sistema de Chaves por Categoria

### Modalidades Masculinas e Mistas:
- **5 chaves** de **3 equipes** cada = **15 equipes**
- Exemplo: Futsal Masculino, Handebol Masculino, etc.

### Modalidades Femininas:
- **4 chaves** de **3 equipes** cada = **12 equipes**
- Exemplo: Futsal Feminino, Handebol Feminino, etc.

---

## 🎯 Como Usar no Código

### Importar listas de equipes:

```javascript
import { equipasMasculinoMisto, equipasFeminino, equipasPadrao } from "./scripts/migrateData";

// Usar em um componente
const EquipesSelector = ({ categoria }) => {
  const equipes = categoria === "feminino" ? equipasFeminino : equipasMasculinoMisto;
  
  return (
    <select>
      {equipes.map(eq => (
        <option key={eq.id} value={eq.id}>{eq.nome}</option>
      ))}
    </select>
  );
};
```

### Buscar equipes do Firestore por categoria:

```javascript
import { getEquipes } from "./api/equipes";

// Buscar todas
const { data: todasEquipes } = await getEquipes();

// Filtrar por categoria
const equipasMasculinas = todasEquipes.filter(e => e.categoria === "masculino");
const equipasFemininas = todasEquipes.filter(e => e.categoria === "feminino");
```

### Buscar configuração de equipes:

```javascript
import { getDocumentById, COLECOES } from "./api/helpers";

// Buscar config de masculino/misto
const configMasc = await getDocumentById(COLECOES.CONFIGURACOES, "equipes_masculino_misto");
console.log(configMasc.numeroChaves); // 5
console.log(configMasc.equipesPorChave); // 3

// Buscar config de feminino
const configFem = await getDocumentById(COLECOES.CONFIGURACOES, "equipes_feminino");
console.log(configFem.numeroChaves); // 4
console.log(configFem.equipesPorChave); // 3
```

---

## ✅ Checklist de Validação

Após executar a migração, verificar:

- [ ] **27 documentos** na collection `equipes`
  - [ ] 15 com `categoria: "masculino"`
  - [ ] 12 com `categoria: "feminino"`
- [ ] **4 documentos** na collection `configuracoes`
  - [ ] `geral` (com `equipesPorCategoria` e `chavesPorCategoria`)
  - [ ] `equipes_masculino_misto` (15 equipes)
  - [ ] `equipes_feminino` (12 equipes)
  - [ ] `equipes_todas` (27 equipes)
- [ ] IDs únicos: `masc_11`, `masc_1213`, `fem_11`, `fem_1214`, etc.
- [ ] Todas as equipes têm campo `categoria`

---

## 🚀 Executar Migração

1. **Configure as Security Rules** (veja `COMO_RESOLVER_PERMISSOES.md`)
2. Acesse: http://localhost:3000/admin/migrate
3. Clique em **"Iniciar Migração"**
4. Aguarde a confirmação de sucesso
5. Verifique no Firebase Console:
   - Firestore Database → `equipes` (27 documentos)
   - Firestore Database → `configuracoes` (4 documentos)

---

## 📝 Notas Importantes

### Equipes Combinadas:
Algumas turmas se juntaram para formar equipes (ex: "Turma 12/13", "Turma TI21/TI3"). Isso está refletido:
- No **nome** da equipe (aparece como "Turma 12/13")
- No **numero** (ex: `1213` para identificar)
- No **ID** (ex: `masc_1213`)

### Rankings Separados:
O sistema pode gerar rankings separados por categoria se necessário:
- Ranking geral (todas as equipes)
- Ranking masculino (15 equipes masculinas)
- Ranking feminino (12 equipes femininas)

### Modalidades Mistas:
Modalidades mistas usam as **mesmas equipes** do masculino (15 equipes, 5 chaves de 3).

---

**Data:** 19/10/2025  
**Status:** Pronto para migração  
**Total de equipes:** 27 (15 masculino + 12 feminino)
