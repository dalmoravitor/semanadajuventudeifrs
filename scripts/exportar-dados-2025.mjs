#!/usr/bin/env node
/**
 * Exporta os dados públicos da edição 2025 do Firestore para dados/edicao-2025.json.
 *
 * O arquivo gerado serve de gabarito para os testes do domínio e de carga inicial
 * para o Firebase Emulator (scripts/carregar-emulador.mjs). Só lê o que as regras
 * já deixam público; nada é gravado no banco.
 *
 * Uso: npm run dados:exportar
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PROJETO = process.env.VITE_FIREBASE_PROJECT_ID ?? "semanadajuventudeifrs";
const COLECOES = ["modalidades", "ranking", "configuracoes", "chaves"];
const DESTINO = resolve(dirname(fileURLToPath(import.meta.url)), "../dados/edicao-2025.json");
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJETO}/databases/(default)/documents`;

/** Converte um valor no formato REST do Firestore para JSON comum. */
function converterValor(valor) {
  if ("stringValue" in valor) return valor.stringValue;
  if ("integerValue" in valor) return Number(valor.integerValue);
  if ("doubleValue" in valor) return valor.doubleValue;
  if ("booleanValue" in valor) return valor.booleanValue;
  if ("timestampValue" in valor) return valor.timestampValue;
  if ("nullValue" in valor) return null;
  if ("arrayValue" in valor) return (valor.arrayValue.values ?? []).map(converterValor);
  if ("mapValue" in valor) return converterCampos(valor.mapValue.fields ?? {});
  throw new Error(`Tipo de valor não suportado: ${Object.keys(valor).join(", ")}`);
}

function converterCampos(campos) {
  return Object.fromEntries(Object.entries(campos).map(([k, v]) => [k, converterValor(v)]));
}

async function lerColecao(nome) {
  const documentos = {};
  let pagina = "";
  do {
    const url = `${BASE}/${nome}?pageSize=300${pagina ? `&pageToken=${pagina}` : ""}`;
    const resposta = await fetch(url);
    if (!resposta.ok) throw new Error(`Falha ao ler ${nome}: HTTP ${resposta.status}`);
    const corpo = await resposta.json();
    for (const doc of corpo.documents ?? []) {
      documentos[doc.name.split("/").at(-1)] = converterCampos(doc.fields ?? {});
    }
    pagina = corpo.nextPageToken ?? "";
  } while (pagina);
  return documentos;
}

const dados = { exportadoEm: new Date().toISOString(), projeto: PROJETO };
for (const colecao of COLECOES) {
  dados[colecao] = await lerColecao(colecao);
  process.stdout.write(`${colecao}: ${Object.keys(dados[colecao]).length} documentos\n`);
}

await mkdir(dirname(DESTINO), { recursive: true });
await writeFile(DESTINO, `${JSON.stringify(dados, null, 2)}\n`);
process.stdout.write(`Gravado em ${DESTINO}\n`);
