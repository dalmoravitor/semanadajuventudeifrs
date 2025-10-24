# 🚀 GUIA RÁPIDO: PREPARAÇÃO PARA TESTES

## ⚠️ IMPORTANTE: Faça ANTES de testar

Você **NÃO PODE** testar o sistema sem dados no Firestore. Siga os passos abaixo na ordem:

---

## PASSO 1: Aplicar Security Rules 🔒

### Por que é importante?
- Protege seu banco de dados contra acessos não autorizados
- Define quem pode ler/escrever em cada coleção
- Essencial para segurança em produção

### Como fazer:

1. **Acessar Firebase Console**
   - Ir para: https://console.firebase.google.com
   - Selecionar seu projeto: "semanadajuventude" (ou nome que você deu)

2. **Navegar até Firestore Rules**
   - No menu lateral, clicar em **"Firestore Database"**
   - Clicar na aba **"Rules"** (Regras)

3. **Copiar as Regras**
   - Abrir o arquivo: `FIRESTORE_SECURITY_RULES.txt`
   - Copiar **TODO** o conteúdo

4. **Colar e Publicar**
   - Colar no editor de regras do Firebase
   - Clicar em **"Publish"** (Publicar)
   - ✅ Aguardar confirmação

### Regras aplicadas:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Função auxiliar: verifica se usuário está autenticado
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // MODALIDADES: Leitura pública, escrita apenas autenticados
    match /modalidades/{modalidadeId} {
      allow read: if true;
      allow write: if isAuthenticated();
    }
    
    // EQUIPES: Leitura pública, escrita apenas autenticados
    match /equipes/{equipeId} {
      allow read: if true;
      allow write: if isAuthenticated();
    }
    
    // RESULTADOS: Leitura pública, escrita apenas autenticados
    match /resultados/{resultadoId} {
      allow read: if true;
      allow write: if isAuthenticated();
    }
    
    // ... (resto das regras)
  }
}
```

---

## PASSO 2: Executar Migração de Dados 📊

### Por que é importante?
- Sem dados, não há nada para testar
- Popula o Firestore com 44 modalidades + 27 equipes + configs
- Cria estrutura inicial do banco de dados

### Como fazer:

1. **Abrir Terminal no VS Code**
   - Atalho: `Ctrl + '` (ou `Ctrl + J`)
   - Ou: Menu Terminal → New Terminal

2. **Executar o comando de migração**
   ```powershell
   npm run migrate
   ```

3. **Aguardar processamento**
   - O script vai criar 79 documentos no total
   - Você verá mensagens de progresso no console
   - Exemplo:
     ```
     🔄 Iniciando migração...
     ✅ Modalidades criadas: 44/44
     ✅ Equipes criadas: 27/27
     ✅ Configs criadas: 4/4
     ✅ Rankings criados: 4/4
     🎉 Migração concluída com sucesso!
     ```

4. **Verificar no Firebase Console**
   - Voltar para Firebase Console
   - Ir em **Firestore Database** → **Data**
   - Você deve ver as coleções:
     - ✅ `modalidades` (44 documentos)
     - ✅ `equipes` (27 documentos)
     - ✅ `configuracoes` (4 documentos)
     - ✅ `rankings` (4 documentos)

### ⚠️ Possíveis Erros

**Erro: "Cannot find module"**
- Solução: Verificar import no arquivo `migrateData.js`
- Já corrigimos isso alterando para: `import { modalidadesConfig } from "../utils/modalidadesConfig.js";`

**Erro: "Permission denied"**
- Solução: Aplicar Security Rules primeiro (Passo 1)

**Erro: "Firebase not initialized"**
- Solução: Verificar arquivo `src/api/firebase.js`
- Confirmar que credenciais estão corretas

---

## PASSO 3: Iniciar Servidor de Desenvolvimento 🌐

### Como fazer:

1. **No terminal, executar:**
   ```powershell
   npm start
   ```

2. **Aguardar compilação**
   - O navegador deve abrir automaticamente
   - URL: http://localhost:3000

3. **Verificar que não há erros**
   - Console do navegador (F12) não deve ter erros críticos
   - Página inicial deve carregar normalmente

---

## PASSO 4: Começar os Testes ✅

Agora sim! Com:
- ✅ Security Rules aplicadas
- ✅ Dados migrados
- ✅ Servidor rodando

Você pode seguir o checklist completo em: **`ETAPA_10_TESTES_COMPLETOS.md`**

### Sugestão de Ordem de Testes:

1. **🔐 Autenticação** (15 min)
   - Login/Logout
   - Proteção de rotas
   - Redirecionamentos

2. **👥 CRUD de Equipes** (30 min)
   - Criar, editar, excluir equipes
   - Filtros e busca
   - Validações

3. **📋 Gerenciamento de Modalidades** (20 min)
   - Visualização
   - Filtros
   - Alteração de status

4. **📊 Registro de Resultados** (45 min)
   - Edição como admin
   - Salvamento
   - Validação de diferentes sistemas

5. **🏆 Ranking** (20 min)
   - Visualização pública
   - Cálculo automático
   - Filtros por categoria

6. **📊 Dashboard** (15 min)
   - Estatísticas
   - Links rápidos

7. **💾 Persistência** (15 min)
   - Dados após logout
   - Sincronização

**Total estimado**: ~2h30min de testes completos

---

## 📋 Checklist Rápido

Antes de começar:

- [ ] Security Rules aplicadas no Firebase Console
- [ ] Migração executada com sucesso (`npm run migrate`)
- [ ] Servidor rodando (`npm start`)
- [ ] Navegador aberto em http://localhost:3000
- [ ] Console do navegador (F12) sem erros críticos
- [ ] Documento `ETAPA_10_TESTES_COMPLETOS.md` aberto para guiar

---

## 🆘 Se algo der errado

### Servidor não inicia
```powershell
# Limpar cache e reinstalar dependências
rm -r node_modules
rm package-lock.json
npm install
npm start
```

### Migração falha
- Verificar conexão com internet
- Confirmar que Firebase está configurado
- Verificar logs de erro no terminal
- Aplicar Security Rules se ainda não aplicou

### Dados não aparecem
- Recarregar página (F5)
- Limpar cache do navegador (Ctrl+Shift+Del)
- Verificar no Firebase Console se dados existem
- Checar console do navegador (F12) por erros de API

---

## 🎯 Resultado Esperado

Após seguir todos os passos:

✅ Firebase com Security Rules ativas
✅ 79 documentos no Firestore
✅ Aplicação rodando em localhost:3000
✅ Login funcionando
✅ Dados carregando nas páginas
✅ Pronto para testes completos!

---

**Boa sorte com os testes! 🚀**

Se encontrar qualquer problema, anote no documento de testes e me avise.
