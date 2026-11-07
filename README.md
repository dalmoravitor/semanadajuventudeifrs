# Semana da Juventude 2025

Site de resultados da XXIX Semana da Juventude do IFRS Campus Sertão: ranking geral das 16 turmas, pontos de cada uma das 38 modalidades e cronograma da edição de 3 a 7 de novembro de 2025.

**Site:** https://semanadajuventudeifrs.web.app

A primeira versão foi usada durante o evento. Esta é a reconstrução feita depois, como projeto de portfólio: frontend novo com a identidade visual do IFRS e o código organizado em camadas, lendo os mesmos dados do Firebase. A versão do evento continua na tag [`v2025-original`](../../tree/v2025-original).

## Antes e depois

| Métrica                             | Versão do evento      | Esta versão                                            |
| ----------------------------------- | --------------------- | ------------------------------------------------------ |
| JavaScript na primeira carga (gzip) | 267 KB                | 228 KB                                                 |
| Avisos de lint                      | 95                    | 0                                                      |
| Testes                              | 1, falhando           | 22 de unidade e componentes, 5 das regras do Firestore |
| Maior arquivo                       | 2.837 linhas          | 269 linhas                                             |
| Estilos inline (`style={{}}`)       | 1.456                 | 1 (largura da barra de pontos)                         |
| Arquivos que acessam o Firebase     | 20                    | 3, todos em `src/data/`                                |
| Quem pode gravar no banco           | Qualquer conta logada | Só a conta da organização, com testes                  |

## Stack

React 19, TypeScript estrito, Vite, React Router, Tailwind CSS v4, Firebase (Firestore, Authentication, Hosting), Zod, Vitest e Testing Library.

## Como rodar

Requer Node 20 ou mais novo.

```bash
npm install
cp .env.example .env   # preencha com a configuração web do Firebase
npm run dev
```

Para desenvolver sem tocar no banco real, use o Firebase Emulator (precisa de Java):

```bash
npm run emulador          # terminal 1: Firestore e Auth locais
npm run emulador:dados    # terminal 2: carrega os dados de 2025 e cria a conta de teste
npm run dev:emulador      # terminal 2: site apontando para o Emulator
```

## Scripts

| Comando                  | O que faz                                               |
| ------------------------ | ------------------------------------------------------- |
| `npm run check`          | Lint, tipos, testes e build, nessa ordem                |
| `npm test`               | Testes de unidade e componentes                         |
| `npm run test:regras`    | Testes das regras do Firestore no Emulator              |
| `npm run dados:exportar` | Atualiza `dados/edicao-2025.json` a partir do Firestore |
| `npm run deploy`         | Roda o `check` e publica o site no Firebase Hosting     |
| `npm run deploy:regras`  | Testa e publica `firestore.rules`                       |

## Estrutura

```
src/app/        rotas, layout e providers
src/features/   uma pasta por página (inicio, ranking, modalidades, modalidade, turma, cronograma, sobre, admin)
src/ui/         componentes visuais com os tokens IFRS
src/hooks/      useEdicao, useChaves, useUsuario, useAssinatura
src/domain/     ranking geral, equipes combinadas, desempate (TypeScript puro, sem React)
src/data/       Firebase, leitura em tempo real e validação dos documentos com Zod
src/content/    dados fixos da edição e cronograma
dados/          snapshot de 2025, usado como gabarito dos testes e carga do Emulator
tests/          testes das regras do Firestore
docs/decisoes/  registros curtos das decisões técnicas
```

Cada camada só conhece a de baixo: páginas usam hooks, hooks usam `src/data` e `src/domain`, e só `src/data` importa o SDK do Firebase.

## Decisões

- [001: Manter o Firebase e o banco de 2025](docs/decisoes/001-manter-firebase.md)
- [002: Camadas e validação dos dados](docs/decisoes/002-camadas.md)
- [003: Tamanho do bundle](docs/decisoes/003-bundle.md)

## Créditos

Desenvolvimento: Vitor Dal Mora. Organização do evento: Setor de Esporte e Lazer (SEL) do IFRS Campus Sertão.

Projeto acadêmico, sem vínculo oficial com a comunicação do IFRS. Cores e tipografia seguem o Manual de Aplicação da Marca dos Institutos Federais.
