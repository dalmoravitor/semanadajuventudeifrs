# PATCH - Atualizar Componentes Chaves

## Localização: src/pages/ModalidadeDetalhe.jsx linha ~6424

### SUBSTITUIR:
```jsx
<TabelaJogosChaves 
	chaves={chaves} 
	adminMode={adminMode}
	resultados={resultados}
	setResultados={setResultados}
	modalidadeId={id}
/>
```

### POR:
```jsx
<TabelaJogosChaves 
	chaves={chaves} 
	adminMode={adminMode}
	getResultadoJogo={getResultadoJogo}
	setResultadoJogo={setResultadoJogo}
/>
```

---

## Localização: src/pages/ModalidadeDetalhe.jsx linha ~6432

### SUBSTITUIR:
```jsx
<TabelaEliminatorias 
	chaves={chaves} 
	resultados={resultados}
	adminMode={adminMode}
	modalidadeId={data.id}
	onResultadosChange={setResultadosEliminatorias}
/>
```

### POR:
```jsx
<TabelaEliminatorias 
	chaves={chaves} 
	getResultadoJogo={getResultadoJogo}
	setResultadoJogo={setResultadoJogo}
	adminMode={adminMode}
	modalidadeId={data.id}
/>
```

---

## Localização: src/pages/ModalidadeDetalhe.jsx linha ~226

### SUBSTITUIR assinatura:
```jsx
function TabelaEliminatorias({ chaves, resultados, adminMode, modalidadeId, onResultadosChange }) {
```

### POR:
```jsx
function TabelaEliminatorias({ chaves, getResultadoJogo, setResultadoJogo, adminMode, modalidadeId }) {
```

---

## REMOVER variáveis não utilizadas (linha ~6376):

### REMOVER:
```jsx
// Estado dos resultados das eliminatórias (vem do TabelaEliminatorias)
const [resultadosEliminatorias, setResultadosEliminatorias] = useState(() => {
	// ... todo esse bloco
});
```

---

## Como Aplicar:

1. Abra `src/pages/ModalidadeDetalhe.jsx`
2. Pressione Ctrl+F para buscar
3. Busque por `<TabelaJogosChaves` 
4. Substitua as props conforme indicado acima
5. Repita para `<TabelaEliminatorias`
6. Salve o arquivo
7. Recarregue a página do Handebol

---

## Resultado Esperado:

Após aplicar o patch:
- ✅ TabelaJogosChaves usa hooks
- ✅ TabelaEliminatorias usa hooks  
- ✅ Dados persistem no Firestore
- ✅ Botão "Salvar Alterações" aparece
- ✅ Quartas de final são geradas automaticamente

---

## Testar:

1. Abra Handebol Masculino
2. Preencha as 5 chaves com nomes de equipes
3. Insira resultados dos jogos (3 por chave)
4. Clique em "Salvar Alterações" no final da página
5. Recarregue (F5)
6. Verifique se os dados permanecem ✅
7. Verifique se as quartas de final foram geradas ✅
