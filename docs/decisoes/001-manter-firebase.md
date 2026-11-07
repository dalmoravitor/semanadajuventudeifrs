# 001: Manter o Firebase e o banco de 2025

**Decisão:** o site continua lendo o mesmo Firestore usado no evento, sem migrar dados nem mudar coleções.

**Contexto.** O objetivo desta versão é o frontend e a organização do código. O banco tem a edição 2025 completa (38 modalidades, 21 equipes, rankings finais) e o volume é pequeno. Trocar por um backend próprio exigiria refazer login, tempo real e hospedagem, sem ganho para o visitante.

**Consequências.**

- Os documentos têm formatos inconsistentes (números salvos como texto, campos renomeados). Isso é tratado num lugar só, em `src/data/mapeadores.ts` (ver 002).
- A falha de segurança da versão de 2025 (qualquer conta logada gravava) foi resolvida nas regras, não no código: `firestore.rules` só permite gravação pela conta da organização, e `tests/regras.test.ts` prova isso no Emulator.
- O plano gratuito (Spark) basta: o tráfego de um portfólio fica muito abaixo da cota diária de leituras.
