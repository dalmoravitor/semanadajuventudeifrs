# 002: Camadas e validação dos dados

**Decisão:** o código fica em camadas com dependência num sentido só: páginas → hooks → dados e domínio → Firebase.

**Contexto.** Na versão de 2025, 20 arquivos falavam direto com o Firestore e as regras de pontuação estavam espalhadas por componentes de até 2.837 linhas. Corrigir uma regra exigia mexer em várias telas.

**Como ficou.**

- `src/domain/` tem o cálculo do ranking em funções puras. O teste de referência roda os dados reais de 2025 e precisa chegar às mesmas 16 posições exibidas no evento.
- `src/data/` é o único lugar que importa o SDK. Cada documento passa por um esquema Zod antes de virar tipo do domínio; um documento inválido é ignorado e reportado, sem derrubar a página.
- Um único `EdicaoProvider` assina os dados em tempo real para o app inteiro, e as páginas leem com `useEdicao()`.

**Consequência.** As telas não sabem que o banco guarda `"pontos": "160"` como texto, e trocar a fonte de dados mexeria só em `src/data/`.
