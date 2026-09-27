import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdirSync, writeFileSync, rmSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import assert from "node:assert/strict";
const dir = mkdtempSync(`${tmpdir()}/cotiza-qa-`),
  port = 3054,
  origin = `http://127.0.0.1:${port}`,
  password = randomBytes(24).toString("hex");
const child = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "start",
    "--hostname",
    "127.0.0.1",
    "-p",
    String(port),
  ],
  {
    env: {
      ...process.env,
      ADMIN_PASSWORD: password,
      SESSION_SECRET: randomBytes(48).toString("hex"),
      DATABASE_URL: `file:${dir}/test.db`,
      APP_URL: origin,
    },
    stdio: ["ignore", "pipe", "pipe"],
  },
);
let logs = "";
child.stdout.on("data", (c) => (logs += c));
child.stderr.on("data", (c) => (logs += c));
let cookie = "";
let checks = 0;
async function call(path, method = "GET", data, auth = true, extra = {}) {
  return fetch(`${origin}/api/${path}`, {
    method,
    headers: {
      ...(method !== "GET"
        ? { "Content-Type": "application/json", Origin: origin }
        : {}),
      ...(auth && cookie ? { Cookie: cookie } : {}),
      ...extra,
    },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
}
async function ok(path, method = "GET", data) {
  const res = await call(path, method, data);
  const body = await res.json();
  assert.equal(res.status, 200, JSON.stringify(body));
  return body;
}
function check(name) {
  checks++;
  console.log(`✓ ${name}`);
}
try {
  for (let i = 0; i < 90; i++) {
    try {
      if ((await fetch(`${origin}/login`)).ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  assert.equal((await call("bootstrap", "GET", undefined, false)).status, 401);
  check("Panel API rejects unauthenticated access");
  assert.equal(
    (
      await call("login", "POST", { password }, false, {
        Origin: "https://attacker.invalid",
      })
    ).status,
    403,
  );
  check("Cross-origin mutation rejected");
  const login = await call("login", "POST", { password }, false);
  assert.equal(login.status, 200);
  cookie = login.headers.get("set-cookie").split(";")[0];
  assert.match(login.headers.get("set-cookie"), /HttpOnly/i);
  check("Private login sets HttpOnly session");
  let data = await ok("bootstrap");
  await ok("settings", "PUT", { ...data.settings, email: "demo@example.com" });
  const intake = {
    key: crypto.randomUUID(),
    name: "Cliente de prueba",
    company: "Empresa de ejemplo",
    email: "cliente@example.com",
    phone: "",
    need: "Automatizar la consolidación mensual de reportes.",
    outcome: "Liberar tiempo operativo.",
    tools: "Google Sheets",
    volume: 200,
    minutes: 15,
    people: 2,
    budget: "$300–$600",
    deadline: "2 semanas",
    category: "Apps Script",
    details: "Datos ficticios para validación.",
    consent: true,
  };
  const receipt = await call("requests", "POST", intake, false);
  assert.equal(receipt.status, 200);
  await call("requests", "POST", intake, false);
  data = await ok("bootstrap");
  assert.equal(data.requests.length, 1);
  check("Public form stores request once with retry idempotency");
  const converted = await ok(`requests/${intake.key}/convert`, "POST", {});
  assert.equal(
    (await ok(`requests/${intake.key}/convert`, "POST", {})).id,
    converted.id,
  );
  check("Request conversion is idempotent");
  data = await ok("bootstrap");
  let record = data.quotes.find((x) => x.id === converted.id);
  let q = record.data;
  const line = {
    id: crypto.randomUUID(),
    name: "Automatización de reportes",
    scope:
      "Consolidación de datos, validación, generación de reportes y capacitación del equipo.",
    exclusions: "Licencias no incluidas.",
    mode: "hours",
    minutes: 1200,
    rateCents: 1500,
    fixedCents: 0,
    quantity: 1,
    frequency: "once",
    payer: "issuer",
    discountPercent: 0,
    taxable: true,
  };
  q = {
    ...q,
    lines: [line],
    taxConfirmed: true,
    timeline: "Dos semanas desde la recepción de accesos y datos de prueba.",
    internalNotes: "INTERNAL-SECRET-MARKER",
    impact: {
      ...q.impact,
      enabled: true,
      after: 3,
      clientRate: 8,
      extraMonthlyCents: 4000,
      costsConfirmed: true,
    },
  };
  let saved = await ok(`quotes/${record.id}`, "PUT", {
    data: q,
    revision: record.revision,
  });
  assert.equal(
    (
      await call(`quotes/${record.id}`, "PUT", {
        data: q,
        revision: record.revision,
      })
    ).status,
    409,
  );
  check("Stale revisions cannot overwrite newer data");
  const issued = await ok(`quotes/${record.id}/issue`, "POST", {
    revision: saved.revision,
  });
  const again = await ok(`quotes/${record.id}/issue`, "POST", {
    revision: saved.revision,
  });
  assert.equal(issued.id, again.id);
  check("Repeated issuance does not duplicate folios");
  const pdfResponse = await call(`issues/${issued.id}/pdf`);
  assert.equal(pdfResponse.headers.get("content-type"), "application/pdf");
  const pdf = Buffer.from(await pdfResponse.arrayBuffer());
  assert.ok(pdf.length > 3000);
  assert.equal(pdf.subarray(0, 4).toString(), "%PDF");
  mkdirSync("output/pdf", { recursive: true });
  writeFileSync("output/pdf/proforma-ejemplo.pdf", pdf);
  check("PDF generated and downloaded");
  assert.equal(
    (await call(`issues/${issued.id}/pdf`, "GET", undefined, false)).status,
    401,
  );
  check("PDF remains private");
  q = { ...q, title: "Propuesta revisada", lines: [{ ...line, minutes: 600 }] };
  saved = await ok(`quotes/${record.id}`, "PUT", {
    data: q,
    revision: saved.revision,
  });
  const old = Buffer.from(
    await (await call(`issues/${issued.id}/pdf`)).arrayBuffer(),
  );
  assert.deepEqual(old, pdf);
  check("Editing preserves the bytes of issued PDF");
  const newIssue = await ok(`quotes/${record.id}/issue`, "POST", {
    revision: saved.revision,
  });
  assert.notEqual(newIssue.id, issued.id);
  check("New revision receives another immutable folio");
  assert.equal(
    (await call(`quotes/${record.id}/discard`, "POST", {})).status,
    400,
  );
  check("Issued history cannot be deleted");
  const repeatScope =
    "Integración, pruebas, documentación y validación de entregables. ".repeat(
      32,
    ) + " FIN-ALCANCE";
  q = {
    ...q,
    title: "Prueba de documento extenso",
    lines: Array.from({ length: 8 }, (_, i) => ({
      ...line,
      id: crypto.randomUUID(),
      name: `Módulo ${i + 1}`,
      scope: repeatScope,
    })),
    notes: "CIERRE-DOCUMENTO: Todas las condiciones han sido incluidas.",
  };
  saved = await ok(`quotes/${record.id}`, "PUT", {
    data: q,
    revision: saved.revision,
  });
  const longPdf = await call(`quotes/${record.id}/preview`);
  assert.equal(longPdf.status, 200);
  writeFileSync(
    "output/pdf/proforma-extensa.pdf",
    Buffer.from(await longPdf.arrayBuffer()),
  );
  check("Long document preview generated without dropping content");
  await ok("logout", "POST", {});
  assert.equal((await call("bootstrap", "GET", undefined, false)).status, 401);
  check("Private data inaccessible without session");
  console.log(
    `\n${checks} integration checks passed. PDFs in output/pdf/. Test database removed.`,
  );
} catch (e) {
  console.error(logs);
  throw e;
} finally {
  child.kill("SIGTERM");
  await new Promise((r) => child.once("exit", r));
  rmSync(dir, { recursive: true, force: true });
}
