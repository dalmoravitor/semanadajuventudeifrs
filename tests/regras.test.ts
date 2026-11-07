/**
 * Testes das regras do Firestore (firestore.rules), rodando no Emulator.
 * Uso: npm run test:regras
 */
import { readFileSync } from "node:fs";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";

const regras = readFileSync("firestore.rules", "utf8");
// O e-mail da organização é lido do próprio arquivo de regras.
const emailOrganizacao = /token\.email in \['([^']+)'/.exec(regras)?.[1] ?? "";

let ambiente: RulesTestEnvironment;

beforeAll(async () => {
  ambiente = await initializeTestEnvironment({
    projectId: "demo-semana",
    firestore: { rules: regras, host: "127.0.0.1", port: 8080 },
  });
});

beforeEach(async () => {
  await ambiente.clearFirestore();
  await ambiente.withSecurityRulesDisabled(async (contexto) => {
    await setDoc(doc(contexto.firestore(), "ranking/futsal_masc"), { ranking: [] });
  });
});

afterAll(async () => {
  await ambiente.cleanup();
});

const pontuacao = {
  ranking: [{ posicao: 1, equipe: "Turma 23", equipeId: "turma_23", pontos: 160 }],
};

describe("firestore.rules", () => {
  it("deixa qualquer visitante ler os resultados", async () => {
    const visitante = ambiente.unauthenticatedContext().firestore();
    await assertSucceeds(getDoc(doc(visitante, "ranking/futsal_masc")));
    await assertSucceeds(getDoc(doc(visitante, "modalidades/futsal_masc")));
  });

  it("não deixa visitante gravar", async () => {
    const visitante = ambiente.unauthenticatedContext().firestore();
    await assertFails(setDoc(doc(visitante, "ranking/futsal_masc"), pontuacao));
  });

  it("não deixa qualquer conta logada gravar (o problema da versão 2025)", async () => {
    const intruso = ambiente.authenticatedContext("intruso", { email: "alguem@exemplo.com" });
    await assertFails(setDoc(doc(intruso.firestore(), "ranking/futsal_masc"), pontuacao));
    await assertFails(setDoc(doc(intruso.firestore(), "modalidades/nova"), { nome: "X" }));
  });

  it("deixa a conta da organização gravar a pontuação", async () => {
    const organizacao = ambiente.authenticatedContext("organizacao", { email: emailOrganizacao });
    await assertSucceeds(setDoc(doc(organizacao.firestore(), "ranking/futsal_masc"), pontuacao));
  });

  it("recusa pontuação que não é lista", async () => {
    const organizacao = ambiente.authenticatedContext("organizacao", { email: emailOrganizacao });
    await assertFails(
      setDoc(doc(organizacao.firestore(), "ranking/futsal_masc"), { ranking: "160" }),
    );
  });
});
