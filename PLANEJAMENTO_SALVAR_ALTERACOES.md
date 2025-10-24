# 💾 Funcionalidade: Salvar Alterações em ModalidadeDetalhe

## 📌 Contexto

Você sugeriu adicionar um botão "Salvar Alterações" na página `ModalidadeDetalhe.jsx` para garantir que os dados modificados sejam enviados corretamente ao Firestore.

**Decisão**: Por enquanto, esta funcionalidade **NÃO foi implementada** na versão pública. Será implementada na **área administrativa** (Etapa 9).

---

## 🎯 Motivo

### Versão Pública (Atual)
A página `ModalidadeDetalhe.jsx` atual é apenas para **visualização**:
- ✅ Usuários podem ver modalidades
- ✅ Usuários podem ver chaves e confrontos
- ✅ Usuários podem ver resultados
- ❌ Usuários **NÃO podem editar**

### Versão Admin (Etapa 9 - Pendente)
A área administrativa terá:
- ✅ Botão "Salvar Alterações"
- ✅ Detecção de mudanças não salvas
- ✅ Alertas ao sair sem salvar
- ✅ Feedback visual (loading, sucesso, erro)
- ✅ Permissões restritas (apenas admins autenticados)

---

## 🔨 Implementação Planejada

### 1. HOC com Salvamento (Preparado mas não ativo)

Arquivo: `src/hocs/withModalidadeData.jsx`

**Código comentado** (para referência futura):

```javascript
// VERSÃO ADMIN - A SER IMPLEMENTADA

import { saveResultado } from "../api/resultados";

export function withModalidadeDataAdmin(WrappedComponent) {
  return function ModalidadeDetalheWithSave(props) {
    // Estados para controle de salvamento
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [saveError, setSaveError] = useState(null);
    const [originalResultados, setOriginalResultados] = useState([]);

    // Detectar mudanças
    useEffect(() => {
      const hasChanges = JSON.stringify(resultados) !== JSON.stringify(originalResultados);
      setHasUnsavedChanges(hasChanges);
    }, [resultados, originalResultados]);

    // Função para salvar
    const handleSaveChanges = async () => {
      setIsSaving(true);
      
      try {
        // Salvar resultados modificados
        const savePromises = resultados.map(async (resultado) => {
          const original = originalResultados.find(r => r.id === resultado.id);
          if (!original || JSON.stringify(original) !== JSON.stringify(resultado)) {
            return await saveResultado(resultado);
          }
          return { success: true };
        });

        const results = await Promise.all(savePromises);
        
        if (results.every(r => r.success)) {
          setSaveSuccess(true);
          setHasUnsavedChanges(false);
          setOriginalResultados(JSON.parse(JSON.stringify(resultados)));
          setTimeout(() => setSaveSuccess(false), 3000);
        }
      } catch (err) {
        setSaveError("Erro ao salvar alterações");
      } finally {
        setIsSaving(false);
      }
    };

    // Bloquear navegação com alterações não salvas
    useBlocker(
      ({ currentLocation, nextLocation }) =>
        hasUnsavedChanges &&
        currentLocation.pathname !== nextLocation.pathname &&
        !window.confirm("Você tem alterações não salvas. Deseja realmente sair?")
    );

    // Alertar ao fechar aba
    useEffect(() => {
      const handleBeforeUnload = (e) => {
        if (hasUnsavedChanges) {
          e.preventDefault();
          e.returnValue = "Alterações não salvas";
          return e.returnValue;
        }
      };
      window.addEventListener("beforeunload", handleBeforeUnload);
      return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [hasUnsavedChanges]);

    return (
      <>
        {/* Barra de alterações não salvas */}
        {hasUnsavedChanges && (
          <div className="unsaved-changes-bar">
            <span>⚠️ Você tem alterações não salvas</span>
            <button onClick={handleSaveChanges} disabled={isSaving}>
              {isSaving ? "Salvando..." : "💾 Salvar Alterações"}
            </button>
          </div>
        )}

        {/* Toast de sucesso */}
        {saveSuccess && (
          <div className="toast toast--success">
            ✅ Alterações salvas com sucesso!
          </div>
        )}

        {/* Toast de erro */}
        {saveError && (
          <div className="toast toast--error">
            ❌ {saveError}
            <button onClick={() => setSaveError(null)}>×</button>
          </div>
        )}

        <WrappedComponent
          {...props}
          modalidade={modalidade}
          resultados={resultados}
          setResultados={setResultados}
          hasUnsavedChanges={hasUnsavedChanges}
          onSaveChanges={handleSaveChanges}
          isSaving={isSaving}
        />
      </>
    );
  };
}
```

---

## 🎨 UI Planejada

### Barra de Alterações Não Salvas
```
┌────────────────────────────────────────────────────────────┐
│ ⚠️ Você tem alterações não salvas    [💾 Salvar Alterações] │
└────────────────────────────────────────────────────────────┘
```
- **Posição**: Fixed, top: 70px (abaixo do header)
- **Cor**: Amarelo (#fff3cd) com borda dourada (#ffc107)
- **Comportamento**: Aparece automaticamente quando há mudanças

### Toast de Sucesso
```
┌──────────────────────────────────┐
│ ✅ Alterações salvas com sucesso! │
└──────────────────────────────────┘
```
- **Posição**: Fixed, top-right
- **Cor**: Verde (#d4edda)
- **Duração**: 3 segundos, depois desaparece

### Toast de Erro
```
┌──────────────────────────────────────────┐
│ ❌ Erro ao salvar alterações         [×] │
└──────────────────────────────────────────┘
```
- **Posição**: Fixed, top-right
- **Cor**: Vermelho (#f8d7da)
- **Duração**: Manual (usuário fecha)

---

## 🔒 Fluxo de Segurança

### 1. Detecção de Mudanças
```javascript
// Compara estado atual com estado original
const hasChanges = JSON.stringify(resultados) !== JSON.stringify(originalResultados);
```

### 2. Bloqueio de Navegação
```javascript
// Bloqueia navegação interna (React Router)
useBlocker(() => hasUnsavedChanges && !confirm("Sair sem salvar?"));

// Bloqueia fechar aba (browser)
window.addEventListener("beforeunload", (e) => {
  if (hasUnsavedChanges) {
    e.preventDefault();
    e.returnValue = "";
  }
});
```

### 3. Salvamento Seletivo
```javascript
// Salva apenas resultados modificados
resultados.forEach(resultado => {
  const original = originalResultados.find(r => r.id === resultado.id);
  if (JSON.stringify(original) !== JSON.stringify(resultado)) {
    saveResultado(resultado); // Salva apenas este
  }
});
```

---

## 📦 Integrações Necessárias

### API de Resultados
Função: `saveResultado(resultado)`

```javascript
// src/api/resultados.js
export async function saveResultado(resultado) {
  try {
    const docRef = doc(db, COLECOES.RESULTADOS, resultado.id);
    await setDoc(docRef, {
      ...resultado,
      ultimaAtualizacao: serverTimestamp()
    }, { merge: true });
    
    // Recalcular pontuações das equipes envolvidas
    await recalcularPontuacaoEquipe(resultado.equipe1);
    await recalcularPontuacaoEquipe(resultado.equipe2);
    
    // Atualizar ranking geral
    await recalcularRankingGeral();
    
    return { success: true };
  } catch (error) {
    console.error("Erro ao salvar resultado:", error);
    return { success: false, error: error.message };
  }
}
```

### Recálculo Automático
Após salvar resultados, sistema deve:
1. ✅ Recalcular pontuação das equipes envolvidas
2. ✅ Atualizar classificação da chave/grupo
3. ✅ Atualizar ranking geral
4. ✅ Atualizar ranking por categoria

---

## 🚀 Quando Implementar

### Etapa 9: Área Administrativa
Componente: `src/pages/admin/AdminModalidadeDetalhe.jsx`

**Checklist:**
- [ ] Criar HOC `withModalidadeDataAdmin` com salvamento
- [ ] Implementar UI de alterações não salvas
- [ ] Adicionar botão "Salvar Alterações"
- [ ] Implementar toasts de feedback
- [ ] Adicionar spinner de loading
- [ ] Testar bloqueio de navegação
- [ ] Testar salvamento seletivo
- [ ] Validar recálculos automáticos
- [ ] Adicionar permissões (só admin pode salvar)
- [ ] Testar com dados reais do Firestore

---

## ⚙️ Configurações

### CSS Necessário
```css
/* Barra de alterações não salvas */
.unsaved-changes-bar {
  position: fixed;
  top: 70px;
  left: 0;
  right: 0;
  background-color: #fff3cd;
  border-bottom: 2px solid #ffc107;
  padding: 12px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 999;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

/* Toast de notificações */
.toast {
  position: fixed;
  top: 70px;
  right: 20px;
  padding: 12px 20px;
  border-radius: 4px;
  z-index: 1000;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 500;
}

.toast--success {
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
  color: #155724;
}

.toast--error {
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  color: #721c24;
}

/* Spinner pequeno */
.spinner-small {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255,255,255,0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

---

## 📝 Notas Importantes

1. **Versão Pública**: Apenas visualização, sem edição
2. **Versão Admin**: Full CRUD com salvamento
3. **Performance**: Salva apenas dados modificados
4. **UX**: Feedback visual em todas as ações
5. **Segurança**: Recálculos automáticos de pontuação
6. **Confiabilidade**: Bloqueios de navegação para evitar perda de dados

---

## ✅ Status Atual

- [x] Sugestão recebida do usuário
- [x] Análise de viabilidade feita
- [x] Decisão: Implementar na área admin
- [x] Código preparado (comentado para referência)
- [ ] Aguardando Etapa 9 para implementação
- [ ] Testes com Firestore real
- [ ] Deploy em produção

---

**Próximo Passo**: Quando começarmos a Etapa 9 (AdminModalidadeDetalhe), implementaremos toda esta funcionalidade! 🚀
