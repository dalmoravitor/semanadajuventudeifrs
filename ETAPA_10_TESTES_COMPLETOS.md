# 🧪 ETAPA 10: TESTES COMPLETOS

## Pré-requisitos

Antes de começar os testes, você **DEVE**:

1. ✅ **Aplicar Security Rules no Firebase Console**
   - Acessar: https://console.firebase.google.com
   - Ir em Firestore Database → Rules
   - Copiar conteúdo de `FIRESTORE_SECURITY_RULES.txt`
   - Publicar as regras

2. ✅ **Executar Migração de Dados**
   ```powershell
   npm run migrate
   ```
   - Isso vai popular o Firestore com:
     - 44 modalidades
     - 27 equipes (15 masc/misto + 12 fem)
     - 4 configurações
     - 4 rankings iniciais

3. ✅ **Iniciar o servidor de desenvolvimento**
   ```powershell
   npm start
   ```
   - Aplicação deve abrir em: http://localhost:3000

---

## 📋 CHECKLIST DE TESTES

### 🔐 1. Autenticação e Login Admin

#### Teste 1.1: Login com Credenciais Válidas
- [ ] Acessar http://localhost:3000/login
- [ ] Inserir email: (seu email cadastrado)
- [ ] Inserir senha: (sua senha)
- [ ] Clicar em "Entrar"
- [ ] **Esperado**: Redirecionamento para `/admin` (Dashboard)
- [ ] **Validar**: Mensagem de boas-vindas com email

#### Teste 1.2: Login com Credenciais Inválidas
- [ ] Tentar fazer login com email/senha errados
- [ ] **Esperado**: Mensagem de erro
- [ ] **Validar**: Permanece na página de login

#### Teste 1.3: Acesso Protegido (Sem Login)
- [ ] Abrir navegador anônimo
- [ ] Tentar acessar http://localhost:3000/admin
- [ ] **Esperado**: Redirecionamento para `/login`

#### Teste 1.4: Logout
- [ ] Estando logado, ir ao Dashboard
- [ ] Clicar no botão "🚪 Sair"
- [ ] **Esperado**: Redirecionamento para `/login`
- [ ] **Validar**: Não consegue mais acessar `/admin`

---

### 👥 2. Cadastro e Gerenciamento de Equipes

#### Teste 2.1: Criar Nova Equipe
- [ ] Logar como admin
- [ ] Ir para `/admin/equipes`
- [ ] Clicar em "➕ Nova Equipe"
- [ ] Preencher formulário:
  - **ID**: `test_1`
  - **Nome**: `Equipe Teste`
  - **Ano/Série**: `1º Ano`
  - **Categoria**: `masculino`
  - **Cor**: `#ff0000` (vermelho)
  - **Kit**: ✅ Marcado
  - **Presenças**: `5`
  - **Ocorrências**: `0`
- [ ] Clicar em "➕ Criar"
- [ ] **Esperado**: Toast "✅ Equipe criada!"
- [ ] **Validar**: Equipe aparece na lista

#### Teste 2.2: Validação de ID Único
- [ ] Tentar criar outra equipe com ID `test_1`
- [ ] **Esperado**: Alert "Já existe uma equipe com este ID"
- [ ] **Validar**: Equipe não é criada

#### Teste 2.3: Editar Equipe Existente
- [ ] Clicar em "✏️ Editar" na equipe `test_1`
- [ ] Alterar nome para `Equipe Teste Editada`
- [ ] Alterar presenças para `10`
- [ ] Clicar em "💾 Salvar"
- [ ] **Esperado**: Toast "✅ Equipe atualizada!"
- [ ] **Validar**: Dados atualizados aparecem no card

#### Teste 2.4: Excluir Equipe
- [ ] Clicar em "🗑️" na equipe `test_1`
- [ ] Confirmar exclusão
- [ ] **Esperado**: Toast "✅ Equipe excluída!"
- [ ] **Validar**: Equipe não aparece mais na lista

#### Teste 2.5: Filtros de Equipes
- [ ] Testar filtro por categoria:
  - [ ] Selecionar "Masculino" → Ver apenas equipes masculinas
  - [ ] Selecionar "Feminino" → Ver apenas equipes femininas
  - [ ] Selecionar "Todas" → Ver todas
- [ ] Testar busca textual:
  - [ ] Digitar "1º Ano" → Ver equipes do 1º ano
  - [ ] Digitar ID de equipe → Encontrar equipe específica

---

### 📋 3. Gerenciamento de Modalidades

#### Teste 3.1: Visualizar Modalidades
- [ ] Ir para `/admin/modalidades`
- [ ] **Validar**: 44 modalidades carregadas
- [ ] **Validar**: Cards mostram nome, categoria, tipo, status

#### Teste 3.2: Filtros de Modalidades
- [ ] **Filtro por Categoria**:
  - [ ] Masculino → Ver apenas modalidades masculinas
  - [ ] Feminino → Ver apenas modalidades femininas
  - [ ] Misto → Ver apenas modalidades mistas
- [ ] **Filtro por Status**:
  - [ ] Planejada → Ver modalidades planejadas
  - [ ] Ativa → Ver modalidades ativas
  - [ ] Concluída → Ver modalidades concluídas
- [ ] **Filtro por Tipo**:
  - [ ] Coletivo → Ver esportes coletivos
  - [ ] Individual → Ver esportes individuais
  - [ ] Dupla → Ver modalidades de dupla
- [ ] **Busca textual**:
  - [ ] Digitar "futsal" → Encontrar futsal
  - [ ] Digitar ID → Encontrar modalidade específica

#### Teste 3.3: Alterar Status de Modalidade
- [ ] Selecionar uma modalidade com status "planejada"
- [ ] Mudar dropdown para "ativa"
- [ ] **Esperado**: Status atualizado sem reload
- [ ] **Validar**: Badge muda de cor
- [ ] Recarregar página → Status persiste

#### Teste 3.4: Acessar Detalhes da Modalidade
- [ ] Clicar em "📊 Ver Detalhes" de uma modalidade
- [ ] **Esperado**: Navegação para `/modalidade/:id`
- [ ] **Validar**: Página carrega com dados da modalidade

---

### 📊 4. Registro de Resultados (Sistema de Pontuação)

#### Teste 4.1: Visualização Pública (Visitante)
- [ ] Abrir navegador anônimo
- [ ] Acessar `/modalidade/futsal_masc` (ou outra modalidade)
- [ ] **Validar**:
  - [ ] Dados carregam normalmente
  - [ ] Chaves/confrontos aparecem
  - [ ] Campos são **read-only**
  - [ ] ❌ Botão "Salvar" **NÃO aparece**

#### Teste 4.2: Edição como Admin
- [ ] Fazer login como admin
- [ ] Acessar `/modalidade/futsal_masc`
- [ ] **Validar**:
  - [ ] Campos são **editáveis**
  - [ ] ❌ Botão "Salvar" **ainda não aparece** (sem alterações)
- [ ] Fazer uma alteração (ex: mudar placar de 0-0 para 2-1)
- [ ] **Validar**:
  - [ ] ✅ Barra amarela aparece no **final da página**
  - [ ] ✅ Botão "💾 Salvar Alterações" aparece
  - [ ] Mensagem: "⚠️ Você tem alterações não salvas"

#### Teste 4.3: Salvamento de Resultados
- [ ] Com alterações feitas, clicar em "💾 Salvar Alterações"
- [ ] **Esperado**:
  - [ ] Botão mostra "Salvando..." com spinner
  - [ ] Toast verde aparece: "✅ Alterações salvas com sucesso!"
  - [ ] Barra amarela desaparece
  - [ ] Toast desaparece após 3 segundos
- [ ] Recarregar página
- [ ] **Validar**: Dados salvos persistem

#### Teste 4.4: Proteção contra Perda de Dados
- [ ] Fazer alterações em uma modalidade
- [ ] Tentar fechar a aba do navegador
- [ ] **Esperado**: Alert do navegador perguntando se deseja sair
- [ ] Cancelar e salvar alterações
- [ ] **Validar**: Dados não foram perdidos

#### Teste 4.5: Sistemas de Pontuação Diferentes

**Sistema: Eliminatória Simples** (Futsal, Vôlei, etc.)
- [ ] Registrar vitória de Equipe A sobre Equipe B
- [ ] **Validar**: 
  - [ ] Vencedor avança para próxima fase
  - [ ] Perdedor é eliminado
  - [ ] Classificação atualizada

**Sistema: Pontos Corridos** (Kit de Inscrição, Presença)
- [ ] Registrar presença de equipe (ex: 95%)
- [ ] **Validar**:
  - [ ] Percentual calculado corretamente
  - [ ] Pontuação atribuída segundo tabela

**Sistema: Melhor Tempo** (Corrida, Natação)
- [ ] Registrar tempo de cada equipe
- [ ] **Validar**:
  - [ ] Menor tempo = 1º lugar
  - [ ] Pontuação decrescente

**Sistema: Eliminatória com Grupos + Mata-Mata** (Futebol Society)
- [ ] Registrar resultados da fase de grupos
- [ ] **Validar**: Classificação para mata-mata
- [ ] Registrar resultados do mata-mata
- [ ] **Validar**: Campeão definido

---

### 🏆 5. Cálculo Automático de Ranking

#### Teste 5.1: Ranking Geral (Público)
- [ ] Acessar `/ranking` (sem login)
- [ ] **Validar**:
  - [ ] Tabela carrega com todas as equipes
  - [ ] Colunas: Nome, Ano/Série, Total de Pontos, Modalidades
  - [ ] Ordenação por pontos (maior → menor)
  - [ ] Dados atualizados refletem resultados salvos

#### Teste 5.2: Ranking por Categoria
- [ ] Testar filtros:
  - [ ] **Geral**: Todas as equipes juntas
  - [ ] **Masculino**: Apenas equipes masculinas/misto
  - [ ] **Feminino**: Apenas equipes femininas
- [ ] **Validar**: Ordenação correta em cada categoria

#### Teste 5.3: Recálculo Automático
- [ ] Anotar pontuação de uma equipe no ranking
- [ ] Fazer login como admin
- [ ] Registrar resultado em nova modalidade para essa equipe
- [ ] Salvar resultado
- [ ] Voltar para `/ranking`
- [ ] **Validar**: Pontos atualizados automaticamente

#### Teste 5.4: Ranking na Home (Público)
- [ ] Acessar `/` (página inicial)
- [ ] **Validar**:
  - [ ] Top 5 ou Top 10 equipes aparecem
  - [ ] Dados sincronizados com `/ranking`

---

### 📊 6. Dashboard Administrativo

#### Teste 6.1: Estatísticas Gerais
- [ ] Logar como admin
- [ ] Acessar `/admin` (Dashboard)
- [ ] **Validar Cards de Estatísticas**:
  - [ ] **Total de Modalidades**: Número correto (44)
  - [ ] **Breakdown**: X concluídas, Y ativas, Z planejadas
  - [ ] **Total de Equipes**: Número correto (27)
  - [ ] **Breakdown**: X masculino/misto, Y feminino
  - [ ] **Progresso Geral**: Percentual correto

#### Teste 6.2: Links Rápidos
- [ ] Clicar em cada card de acesso rápido:
  - [ ] "📋 Modalidades" → `/admin/modalidades`
  - [ ] "👥 Equipes" → `/admin/equipes`
  - [ ] "🗄️ Migração" → (se implementado)
  - [ ] "⚙️ Configurações" → (se implementado)

---

### 💾 7. Persistência de Dados

#### Teste 7.1: Persistência após Logout
- [ ] Fazer alterações como admin (criar equipe, salvar resultado)
- [ ] Fazer logout
- [ ] Fazer login novamente
- [ ] **Validar**: Todas as alterações persistem

#### Teste 7.2: Persistência entre Sessões
- [ ] Registrar dados importantes
- [ ] Fechar o navegador completamente
- [ ] Reabrir navegador
- [ ] Acessar a aplicação
- [ ] **Validar**: Todos os dados persistem

#### Teste 7.3: Sincronização em Tempo Real (Opcional)
- [ ] Abrir aplicação em 2 abas/navegadores diferentes
- [ ] Na aba 1 (admin): Fazer alteração e salvar
- [ ] Na aba 2 (público): Recarregar página
- [ ] **Validar**: Dados sincronizados

---

### 🔍 8. Validações e Edge Cases

#### Teste 8.1: Campos Obrigatórios
- [ ] Tentar criar equipe sem preencher campos obrigatórios
- [ ] **Esperado**: Validação impede criação

#### Teste 8.2: Dados Inválidos
- [ ] Tentar inserir número negativo em presenças
- [ ] Tentar inserir caracteres especiais em ID
- [ ] **Esperado**: Validação ou sanitização

#### Teste 8.3: Estados de Loading
- [ ] Verificar spinner aparece durante carregamento
- [ ] Validar que não há "flash de conteúdo vazio"

#### Teste 8.4: Estados de Erro
- [ ] Simular erro desconectando internet
- [ ] **Esperado**: Mensagem de erro amigável
- [ ] Reconectar e clicar "Tentar Novamente"
- [ ] **Validar**: Dados carregam normalmente

#### Teste 8.5: Estados Vazios
- [ ] Aplicar filtro que não retorna resultados
- [ ] **Esperado**: Mensagem "Nenhuma X encontrada"
- [ ] Sugestão de limpar filtros

---

### 📱 9. Responsividade (Opcional)

#### Teste 9.1: Mobile (Smartphone)
- [ ] Abrir DevTools (F12)
- [ ] Alternar para modo responsivo (Ctrl+Shift+M)
- [ ] Testar em iPhone/Samsung
- [ ] **Validar**:
  - [ ] Layout se adapta
  - [ ] Botões clicáveis
  - [ ] Formulários usáveis

#### Teste 9.2: Tablet
- [ ] Testar em resolução de tablet (768px)
- [ ] **Validar**: Grid de cards se ajusta

#### Teste 9.3: Desktop Widescreen
- [ ] Testar em tela grande (1920px+)
- [ ] **Validar**: Conteúdo não fica "esticado"

---

## 🐛 REGISTRO DE BUGS

Use esta seção para anotar bugs encontrados:

### Bug #1
- **Página**: 
- **Ação**: 
- **Esperado**: 
- **Obtido**: 
- **Severidade**: (Crítico/Alto/Médio/Baixo)
- **Status**: (Aberto/Em Análise/Corrigido)

### Bug #2
- **Página**: 
- **Ação**: 
- **Esperado**: 
- **Obtido**: 
- **Severidade**: 
- **Status**: 

---

## ✅ CHECKLIST FINAL

Antes de considerar os testes concluídos:

- [ ] Todos os testes de autenticação passaram
- [ ] CRUD de equipes funciona 100%
- [ ] Todos os sistemas de pontuação testados
- [ ] Ranking calcula corretamente
- [ ] Persistência validada
- [ ] Nenhum erro crítico encontrado
- [ ] Performance aceitável
- [ ] Experiência de usuário fluida

---

## 📊 RELATÓRIO DE TESTES

### Estatísticas
- **Total de Testes**: X
- **Passaram**: Y
- **Falharam**: Z
- **Taxa de Sucesso**: (Y/X) × 100%

### Conclusão
- [ ] Sistema pronto para produção
- [ ] Correções necessárias antes do deploy
- [ ] Melhorias sugeridas

---

## 🚀 PRÓXIMOS PASSOS

Após validação completa:

1. **Deploy em Produção**
   - Configurar Firebase Hosting
   - Deploy: `npm run build && firebase deploy`

2. **Monitoramento**
   - Configurar Firebase Analytics
   - Monitorar erros com Sentry (opcional)

3. **Documentação para Usuários**
   - Manual do administrador
   - Guia de uso público

4. **Treinamento**
   - Treinar administradores
   - Explicar fluxos principais

---

**Data dos Testes**: ___/___/2025
**Testador(es)**: _________________
**Versão do Sistema**: v1.0.0
**Ambiente**: Desenvolvimento / Produção
