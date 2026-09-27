import { createClient, type Client } from "@libsql/client";
import { mkdirSync } from "node:fs";
import { defaults, catalog } from "@/domain/schema";
let client: Client | undefined;
let ready: Promise<void> | undefined;
export async function db() {
  if (!client) {
    const url =
      process.env.DATABASE_URL ||
      process.env.TURSO_DATABASE_URL ||
      "file:data/cotizador.db";
    if (process.env.VERCEL && url.startsWith("file:"))
      throw new Error(
        "Configura una base de datos persistente remota antes de desplegar.",
      );
    if (url === "file:data/cotizador.db")
      mkdirSync("data", { recursive: true });
    client = createClient({
      url,
      authToken:
        process.env.DATABASE_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN,
    });
  }
  ready ??= initialize(client).catch((e) => {
    ready = undefined;
    throw e;
  });
  await ready;
  return client;
}
async function initialize(c: Client) {
  await c.batch(
    [
      "CREATE TABLE IF NOT EXISTS config (key TEXT PRIMARY KEY, data TEXT NOT NULL)",
      "CREATE TABLE IF NOT EXISTS quotes (id TEXT PRIMARY KEY, data TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 1, state TEXT NOT NULL DEFAULT 'Borrador', created_at TEXT NOT NULL, updated_at TEXT NOT NULL)",
      "CREATE TABLE IF NOT EXISTS requests (id TEXT PRIMARY KEY, data TEXT NOT NULL, created_at TEXT NOT NULL, quote_id TEXT)",
      "CREATE TABLE IF NOT EXISTS issues (id INTEGER PRIMARY KEY AUTOINCREMENT, quote_id TEXT NOT NULL, revision INTEGER NOT NULL, data TEXT NOT NULL, issuer TEXT NOT NULL, created_at TEXT NOT NULL, pdf BLOB NOT NULL, hash TEXT NOT NULL, UNIQUE(quote_id,revision))",
      "CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, quote_id TEXT NOT NULL, action TEXT NOT NULL, created_at TEXT NOT NULL)",
      "CREATE TABLE IF NOT EXISTS limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires INTEGER NOT NULL)",
      {
        sql: "INSERT OR IGNORE INTO config VALUES (?,?)",
        args: ["settings", JSON.stringify(defaults)],
      },
      {
        sql: "INSERT OR IGNORE INTO config VALUES (?,?)",
        args: ["services", JSON.stringify(catalog)],
      },
    ],
    "write",
  );
}
export async function getConfig(key: string) {
  const c = await db();
  const r = await c.execute({
    sql: "SELECT data FROM config WHERE key=?",
    args: [key],
  });
  return JSON.parse(String(r.rows[0].data));
}
export async function setConfig(key: string, data: unknown) {
  const c = await db();
  await c.execute({
    sql: "UPDATE config SET data=? WHERE key=?",
    args: [JSON.stringify(data), key],
  });
}
export async function rateLimit(key: string, max: number, seconds: number) {
  const c = await db();
  const now = Date.now();
  const res = await c.execute({
    sql: "INSERT INTO limits(key,count,expires) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN expires<? THEN 1 ELSE count+1 END, expires=CASE WHEN expires<? THEN excluded.expires ELSE expires END RETURNING count",
    args: [key, now + seconds * 1000, now, now],
  });
  await c.execute({
    sql: "DELETE FROM limits WHERE expires<?",
    args: [now - 86400000],
  });
  return Number(res.rows[0].count) <= max;
}
