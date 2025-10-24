# 🔐 GUIA: Configurar Permissões do Firestore

## ❌ Problema Identificado

```
❌ Erro configurações: Missing or insufficient permissions.
❌ Erro rankings: Missing or insufficient permissions.
```

**Causa:** As Security Rules do Firestore estão bloqueando operações de escrita.

---

## ✅ SOLUÇÃO RÁPIDA (5 minutos)

### Passo 1: Acessar Firebase Console

1. Abra o navegador
2. Acesse: **https://console.firebase.google.com/**
3. Faça login com sua conta Google (se necessário)
4. Selecione o projeto: **semanadajuventudeifrs**

### Passo 2: Navegar para Firestore Rules

1. No menu lateral esquerdo, clique em **"Firestore Database"**
2. Na página do Firestore, clique na aba **"Rules"** (Regras)
3. Você verá um editor de código com as regras atuais

### Passo 3: Opção A - Regras de Desenvolvimento (TESTE)

**Use esta para testar rapidamente se o problema é de permissão:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

⚠️ **ATENÇÃO:** Esta regra permite acesso total sem autenticação. Use APENAS para teste!

**Passos:**
1. Copie o código acima
2. Cole no editor (substitua tudo)
3. Clique em **"Publicar"** (Publish)
4. Aguarde a mensagem de confirmação
5. Aguarde **1 minuto** para propagar
6. Execute a migração novamente

### Passo 4: Opção B - Regras de Produção (RECOMENDADO)

**Após confirmar que funciona, substitua pelas regras seguras:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Modalidades
    match /modalidades/{modalidadeId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Equipes
    match /equipes/{equipeId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Inscrições
    match /inscricoes/{inscricaoId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Chaves
    match /chaves/{chaveId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Confrontos
    match /confrontos/{confrontoId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Resultados
    match /resultados/{resultadoId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Ranking
    match /ranking/{rankingId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Configurações
    match /configuracoes/{configId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

**Esta regra:**
- ✅ Permite leitura pública (qualquer um vê ranking, modalidades, etc.)
- ✅ Permite escrita APENAS para usuários autenticados (admin logado)
- ✅ Segura para produção

---

## 🔄 Fluxo Completo

```
1. Aplicar Regras de Teste
   ↓
2. Executar Migração
   ↓
3. Verificar se funcionou (✅ sem erros de permissão)
   ↓
4. Aplicar Regras de Produção
   ↓
5. Testar novamente
   ↓
6. ✨ Sucesso!
```

---

## 🎯 Como Executar a Migração Novamente

Após atualizar as regras:

1. **Aguarde 1-2 minutos** para as regras propagarem
2. No sistema, vá para: **http://localhost:3000/admin/migrate**
3. Certifique-se que você está **logado como admin**
4. Abra o **Console do navegador** (F12)
5. Clique em **"Iniciar Migração"**
6. Confirme o diálogo
7. Aguarde os logs

---

## 📊 Resultado Esperado

Após corrigir as permissões, você deve ver:

```
✅ 44 modalidades importadas!
✅ 16 equipes importadas!
✅ Configurações migradas com sucesso!
✅ Rankings inicializados com sucesso!

============================================================
📊 RESUMO DA MIGRAÇÃO
============================================================
Modalidades: ✅ (44)
Equipes:     ✅ (16)
Configurações: ✅
Rankings:    ✅
============================================================

✨ MIGRAÇÃO CONCLUÍDA COM SUCESSO! ✨
```

---

## ❓ Verificação de Autenticação

Se mesmo com as regras corretas ainda der erro, verifique se você está autenticado:

### No Console do Navegador (F12):

```javascript
import { auth } from "./api/firebase";
console.log("Usuário:", auth.currentUser);
console.log("Email:", auth.currentUser?.email);
```

**Resultado esperado:**
```javascript
Usuário: User {email: "admin@semanadajuventude.com", ...}
Email: "admin@semanadajuventude.com"
```

**Se retornar `null`:**
1. Faça logout: http://localhost:3000/admin → Clicar em "Sair"
2. Faça login novamente: http://localhost:3000/login
3. Use as credenciais fixas que você cadastrou no Firebase Authentication

---

## 🆘 Troubleshooting

### Erro: "Still getting permission denied"

**Possíveis causas:**
1. ❌ Regras não propagaram (aguarde 2-3 minutos)
2. ❌ Não está autenticado (fazer login novamente)
3. ❌ Cache do navegador (Ctrl+Shift+R para hard refresh)
4. ❌ Token expirado (fazer logout e login novamente)

**Solução:**
1. Fazer logout completo
2. Limpar cache (Ctrl+Shift+Delete)
3. Fazer login novamente
4. Verificar no console se `auth.currentUser` não é null
5. Tentar migração novamente

### Erro: "Network error" ou "Failed to fetch"

**Causa:** Problema de conexão com Firebase

**Solução:**
1. Verificar internet
2. Verificar se o projeto Firebase está ativo
3. Verificar credenciais em `src/api/firebase.js`

---

## 📝 Checklist

- [ ] Acessei Firebase Console
- [ ] Naveguei para Firestore Database → Rules
- [ ] Apliquei as regras de teste (ou produção)
- [ ] Cliquei em "Publicar"
- [ ] Aguardei 1-2 minutos
- [ ] Verifiquei que estou logado (auth.currentUser)
- [ ] Executei a migração novamente
- [ ] ✅ Sem erros de permissão!

---

## 📞 Próximos Passos Após Sucesso

1. ✅ Verificar dados no Firebase Console (Firestore Database → Data)
2. ✅ Confirmar 44 documentos em `modalidades`
3. ✅ Confirmar 16 documentos em `equipes`
4. ✅ Confirmar 2 documentos em `configuracoes`
5. ✅ Confirmar 4 documentos em `ranking`
6. ✅ Testar consulta no frontend (página de modalidades)

---

**Status:** Aguardando aplicação das Security Rules
**Data:** 19/10/2025
