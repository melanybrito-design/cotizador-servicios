import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomUUID, createHash } from "node:crypto";
import { z } from "zod";
import { db, getConfig, setConfig, rateLimit } from "@/server/db";
import {
  authenticated,
  configured,
  equals,
  sessionToken,
  COOKIE,
  clientKey,
} from "@/server/auth";
import {
  quoteSchema,
  settingsSchema,
  serviceSchema,
  requestSchema,
  newQuote,
  type Quote,
  type Settings,
} from "@/domain/schema";
import { issuanceErrors } from "@/domain/calculations";
import { generatePdf } from "@/server/pdf";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const json = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
function fail(message: string, status = 400): never {
  throw Object.assign(new Error(message), { status });
}
async function body(req: Request) {
  const reader = req.body?.getReader();
  if (!reader) fail("Solicitud vacía.");
  let size = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const part = await reader.read();
    if (part.done) break;
    size += part.value.length;
    if (size > 400000) {
      await reader.cancel();
      fail("El contenido es demasiado grande.", 413);
    }
    chunks.push(part.value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    fail("Formato de datos inválido.");
  }
}
function folio(id: number, date: string) {
  return `COT-${date.slice(0, 4)}-${String(id).padStart(4, "0")}`;
}
async function handler(
  req: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  try {
    const path = (await context.params).path;
    const route = path.join("/");
    const method = req.method;
    if (method !== "GET") {
      const origin = req.headers.get("origin");
      const allowed = [new URL(req.url).origin, process.env.APP_URL].filter(
        Boolean,
      );
      if (!origin || !allowed.includes(origin))
        fail("Origen no permitido.", 403);
      if (!req.headers.get("content-type")?.startsWith("application/json"))
        fail("Usa contenido JSON.", 415);
    }
    if (route === "login" && method === "POST") {
      if (!configured())
        fail("Ejecuta npm run setup para configurar el acceso privado.", 503);
      if (!(await rateLimit(`login:${clientKey(req)}`, 10, 900)))
        fail("Demasiados intentos. Espera 15 minutos.", 429);
      const input = z
        .object({ password: z.string().max(200) })
        .parse(await body(req));
      if (!equals(input.password, process.env.ADMIN_PASSWORD!))
        fail("La clave no es correcta.", 401);
      (await cookies()).set(COOKIE, sessionToken(), {
        httpOnly: true,
        secure:
          Boolean(process.env.VERCEL) || new URL(req.url).protocol === "https:",
        sameSite: "strict",
        path: "/",
        maxAge: 43200,
      });
      return json({ ok: true });
    }
    if (route === "logout" && method === "POST") {
      (await cookies()).delete(COOKIE);
      return json({ ok: true });
    }
    if (route === "requests" && method === "POST") {
      if (!(await rateLimit(`intake:${clientKey(req)}`, 15, 3600)))
        fail(
          "Has enviado varias solicitudes. Intenta de nuevo más tarde.",
          429,
        );
      const input = requestSchema.parse(await body(req));
      if (input.website) fail("No se pudo enviar la solicitud.");
      const { website: _, ...data } = input;
      const c = await db();
      await c.execute({
        sql: "INSERT OR IGNORE INTO requests(id,data,created_at) VALUES (?,?,?)",
        args: [input.key, JSON.stringify(data), new Date().toISOString()],
      });
      return json({ reference: `SOL-${input.key.slice(0, 8).toUpperCase()}` });
    }
    if (!(await authenticated())) fail("Inicia sesión para continuar.", 401);
    const c = await db();
    if (route === "bootstrap" && method === "GET") {
      const rows = await c.execute(
        "SELECT q.*, i.id AS issue_id, i.created_at AS issue_date FROM quotes q LEFT JOIN issues i ON i.quote_id=q.id AND i.revision=q.revision ORDER BY q.updated_at DESC",
      );
      const requests = await c.execute(
        "SELECT * FROM requests ORDER BY created_at DESC",
      );
      return json({
        settings: await getConfig("settings"),
        services: await getConfig("services"),
        quotes: rows.rows.map((r) => ({
          id: r.id,
          data: JSON.parse(String(r.data)),
          revision: r.revision,
          state: r.state,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
          issueId: r.issue_id || undefined,
          folio: r.issue_id
            ? folio(Number(r.issue_id), String(r.issue_date))
            : undefined,
        })),
        requests: requests.rows.map((r) => ({
          id: r.id,
          data: JSON.parse(String(r.data)),
          createdAt: r.created_at,
          quoteId: r.quote_id,
        })),
      });
    }
    if (route === "settings" && method === "PUT") {
      const data = settingsSchema.parse(await body(req));
      await setConfig("settings", data);
      return json({ ok: true });
    }
    if (route === "services" && method === "PUT") {
      const data = z
        .array(serviceSchema)
        .max(100)
        .parse(await body(req));
      await setConfig("services", data);
      return json({ ok: true });
    }
    if (route === "quotes" && method === "POST") {
      const data = quoteSchema.parse(await body(req));
      const id = randomUUID(),
        now = new Date().toISOString();
      await c.execute({
        sql: "INSERT INTO quotes(id,data,created_at,updated_at) VALUES (?,?,?,?)",
        args: [id, JSON.stringify(data), now, now],
      });
      return json({ id, revision: 1 });
    }
    if (path[0] === "requests" && path[2] === "convert" && method === "POST") {
      const tx = await c.transaction("write");
      try {
        const row = (
          await tx.execute({
            sql: "SELECT * FROM requests WHERE id=?",
            args: [path[1]],
          })
        ).rows[0];
        if (!row) fail("Solicitud no encontrada.", 404);
        if (row.quote_id) {
          await tx.commit();
          return json({ id: row.quote_id });
        }
        const input = requestSchema.parse(JSON.parse(String(row.data)));
        const settings = (await getConfig("settings")) as Settings;
        const data = {
          ...newQuote(settings),
          client: input.company,
          contact: input.name,
          email: input.email,
          problem: input.need,
          outcome: input.outcome,
          title: `Solución para ${input.company}`,
          requestId: path[1],
          internalNotes: `Presupuesto indicado: ${input.budget || "Sin definir"}\nHerramientas: ${input.tools}\nPlazo deseado: ${input.deadline}\nContexto: ${input.details}`,
          impact: {
            ...newQuote(settings).impact,
            volume: input.volume,
            before: input.minutes,
          },
        };
        const id = randomUUID(),
          now = new Date().toISOString();
        await tx.execute({
          sql: "INSERT INTO quotes(id,data,created_at,updated_at) VALUES (?,?,?,?)",
          args: [id, JSON.stringify(data), now, now],
        });
        await tx.execute({
          sql: "UPDATE requests SET quote_id=? WHERE id=?",
          args: [id, path[1]],
        });
        await tx.commit();
        return json({ id });
      } finally {
        tx.close();
      }
    }
    if (path[0] === "quotes" && path.length >= 2) {
      const id = path[1];
      const row = (
        await c.execute({ sql: "SELECT * FROM quotes WHERE id=?", args: [id] })
      ).rows[0];
      if (!row) fail("Cotización no encontrada.", 404);
      if (path[2] === "discard" && method === "POST") {
        const tx = await c.transaction("write");
        try {
          const issues = await tx.execute({
            sql: "SELECT id FROM issues WHERE quote_id=? LIMIT 1",
            args: [id],
          });
          if (issues.rows.length)
            fail(
              "Una propuesta emitida conserva su historial. Puedes marcarla como rechazada, pero no eliminarla.",
            );
          await tx.execute({
            sql: "UPDATE requests SET quote_id=NULL WHERE quote_id=?",
            args: [id],
          });
          await tx.execute({
            sql: "DELETE FROM quotes WHERE id=?",
            args: [id],
          });
          await tx.commit();
          return json({ ok: true });
        } finally {
          tx.close();
        }
      }
      if (path[2] === "history" && method === "GET") {
        const rows = await c.execute({
          sql: "SELECT id,revision,created_at FROM issues WHERE quote_id=? ORDER BY id DESC",
          args: [id],
        });
        return json(
          rows.rows.map((r) => ({
            id: r.id,
            revision: r.revision,
            date: r.created_at,
            folio: folio(Number(r.id), String(r.created_at)),
          })),
        );
      }
      if (path.length === 2 && method === "PUT") {
        const input = z
          .object({ revision: z.number().int(), data: quoteSchema })
          .parse(await body(req));
        const result = await c.execute({
          sql: "UPDATE quotes SET data=?, revision=revision+1, state='Borrador', updated_at=? WHERE id=? AND revision=? RETURNING revision",
          args: [
            JSON.stringify(input.data),
            new Date().toISOString(),
            id,
            input.revision,
          ],
        });
        if (!result.rows.length)
          fail("Hay una versión más reciente. Recarga antes de guardar.", 409);
        return json({ revision: result.rows[0].revision });
      }
      if (path[2] === "preview" && method === "GET") {
        const buffer = await generatePdf(
          JSON.parse(String(row.data)),
          await getConfig("settings"),
          "BORRADOR",
          new Date().toISOString(),
          true,
        );
        return new Response(new Uint8Array(buffer), {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": 'inline; filename="vista-previa.pdf"',
            "Cache-Control": "no-store",
          },
        });
      }
      if (path[2] === "issue" && method === "POST") {
        const { revision } = z
          .object({ revision: z.number().int() })
          .parse(await body(req));
        if (revision !== Number(row.revision))
          fail("Guarda o recarga los últimos cambios antes de emitir.", 409);
        const existing = (
          await c.execute({
            sql: "SELECT id,created_at FROM issues WHERE quote_id=? AND revision=?",
            args: [id, revision],
          })
        ).rows[0];
        if (existing)
          return json({
            id: existing.id,
            folio: folio(Number(existing.id), String(existing.created_at)),
          });
        const data = quoteSchema.parse(JSON.parse(String(row.data))),
          issuer = settingsSchema.parse(await getConfig("settings"));
        const errors = issuanceErrors(data, issuer);
        if (errors.length) fail(errors.join(" "));
        const now = new Date().toISOString();
        // Allocate and store the immutable snapshot atomically. A failed render rolls back the issue.
        const tx = await c.transaction("write");
        try {
          const current = (
            await tx.execute({
              sql: "SELECT revision FROM quotes WHERE id=?",
              args: [id],
            })
          ).rows[0];
          if (Number(current.revision) !== revision)
            fail("La cotización cambió. Recarga antes de emitir.", 409);
          const existingTx = (
            await tx.execute({
              sql: "SELECT id,created_at FROM issues WHERE quote_id=? AND revision=?",
              args: [id, revision],
            })
          ).rows[0];
          if (existingTx) {
            await tx.commit();
            return json({
              id: existingTx.id,
              folio: folio(
                Number(existingTx.id),
                String(existingTx.created_at),
              ),
            });
          }
          const ins = await tx.execute({
            sql: "INSERT INTO issues(quote_id,revision,data,issuer,created_at,pdf,hash) VALUES (?,?,?,?,?,?,?)",
            args: [
              id,
              revision,
              JSON.stringify(data),
              JSON.stringify(issuer),
              now,
              new Uint8Array(),
              "pending",
            ],
          });
          const issueId = Number(ins.lastInsertRowid),
            code = folio(issueId, now);
          const pdf = await generatePdf(data, issuer, code, now, false);
          await tx.execute({
            sql: "UPDATE issues SET pdf=?,hash=? WHERE id=?",
            args: [
              pdf,
              createHash("sha256").update(pdf).digest("hex"),
              issueId,
            ],
          });
          await tx.execute({
            sql: "UPDATE quotes SET state='Emitida',updated_at=? WHERE id=?",
            args: [now, id],
          });
          await tx.execute({
            sql: "INSERT INTO events(quote_id,action,created_at) VALUES (?,?,?)",
            args: [id, `Emitida ${code}`, now],
          });
          await tx.commit();
          return json({ id: issueId, folio: code });
        } finally {
          tx.close();
        }
      }
      if (path[2] === "state" && method === "POST") {
        const { state } = z
          .object({
            state: z.enum(["Emitida", "Compartida", "Aceptada", "Rechazada"]),
          })
          .parse(await body(req));
        const exists = (
          await c.execute({
            sql: "SELECT id FROM issues WHERE quote_id=? AND revision=?",
            args: [id, Number(row.revision)],
          })
        ).rows.length;
        if (!exists) fail("Emite la proforma antes de cambiar su estado.");
        await c.batch(
          [
            {
              sql: "UPDATE quotes SET state=?,updated_at=? WHERE id=?",
              args: [state, new Date().toISOString(), id],
            },
            {
              sql: "INSERT INTO events(quote_id,action,created_at) VALUES (?,?,?)",
              args: [id, `Estado manual: ${state}`, new Date().toISOString()],
            },
          ],
          "write",
        );
        return json({ ok: true });
      }
    }
    if (path[0] === "issues" && path[2] === "pdf" && method === "GET") {
      const row = (
        await c.execute({
          sql: "SELECT pdf,created_at,id FROM issues WHERE id=?",
          args: [path[1]],
        })
      ).rows[0];
      if (!row) fail("Documento no encontrado.", 404);
      return new Response(new Uint8Array(row.pdf as ArrayBuffer), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${folio(Number(row.id), String(row.created_at))}.pdf"`,
          "Cache-Control": "private, no-store",
        },
      });
    }
    fail("Ruta no encontrada.", 404);
  } catch (error) {
    if (error instanceof z.ZodError)
      return json(
        {
          error: error.issues
            .map((i) => `${i.path.join(".")}: ${i.message}`)
            .join(" "),
        },
        400,
      );
    const e = error as Error & { status?: number };
    if (!e.status) console.error("API error:", e.message);
    return json(
      {
        error: e.status
          ? e.message
          : "No se pudo completar la operación. Tus datos guardados se conservan.",
      },
      e.status || 500,
    );
  }
}
export { handler as GET, handler as POST, handler as PUT };
