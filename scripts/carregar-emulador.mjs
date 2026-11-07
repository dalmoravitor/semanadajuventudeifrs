#!/usr/bin/env node
/**
 * Carrega os dados de 2025 (dados/edicao-2025.json) no Firebase Emulator e cria
 * uma conta de teste da organização, para demonstrar a edição ao vivo sem tocar
 * no banco real.
 *
 * Uso, em dois terminais:
 *   npm run emulador          # sobe Firestore e Auth locais
 *   npm run emulador:dados    # carrega os dados e cria a conta
 *   npm run dev:emulador      # site apontando para o Emulator
 *
 * Conta de teste (só existe no Emulator): o primeiro e-mail listado em
 * firestore.rules, com a senha abaixo.
 */
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PROJETO = "semanadajuventudeifrs";
const FIRESTORE = `http://127.0.0.1:8080/v1/projects/${PROJETO}/databases/(default)/documents`;
const AUTH = "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1";
const SENHA_DE_TESTE = "semana-2025-emulador";

/** Converte JSON comum para o formato de valores da API REST do Firestore. */
function paraValor(valor) {
  if (valor === null) return { nullValue: null };
  if (typeof valor === "boolean") return { booleanValue: valor };
  if (typeof valor === "number") {
    return Number.isInteger(valor) ? { integerValue: String(valor) } : { doubleValue: valor };
  }
  if (typeof valor === "string") return { stringValue: valor };
  if (Array.isArray(valor)) return { arrayValue: { values: valor.map(paraValor) } };
  return { mapValue: { fields: paraCampos(valor) } };
}

function paraCampos(objeto) {
  return Object.fromEntries(Object.entries(objeto).map(([k, v]) => [k, paraValor(v)]));
}

async function gravar(colecao, id, dados) {
  const resposta = await fetch(`${FIRESTORE}/${colecao}/${id}`, {
    method: "PATCH",
    // "owner" é o token do Emulator que ignora as regras, só para a carga inicial.
    headers: { Authorization: "Bearer owner", "Content-Type": "application/json" },
    body: JSON.stringify({ fields: paraCampos(dados) }),
  });
  if (!resposta.ok) throw new Error(`${colecao}/${id}: HTTP ${resposta.status}`);
}

const dados = JSON.parse(await readFile(resolve(raiz, "dados/edicao-2025.json"), "utf8"));
let total = 0;
for (const colecao of ["modalidades", "ranking", "configuracoes", "chaves"]) {
  for (const [id, documento] of Object.entries(dados[colecao])) {
    await gravar(colecao, id, documento);
    total += 1;
  }
}
process.stdout.write(`${total} documentos carregados no Emulator.\n`);

const regras = await readFile(resolve(raiz, "firestore.rules"), "utf8");
const email = /token\.email in \['([^']+)'/.exec(regras)?.[1];
if (email) {
  const resposta = await fetch(`${AUTH}/accounts:signUp?key=emulador`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: SENHA_DE_TESTE, returnSecureToken: false }),
  });
  const ok = resposta.ok || (await resposta.text()).includes("EMAIL_EXISTS");
  process.stdout.write(
    ok
      ? `Conta de teste: ${email} / ${SENHA_DE_TESTE}\n`
      : "Não foi possível criar a conta de teste no Auth Emulator.\n",
  );
}
