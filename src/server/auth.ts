import { createHmac, timingSafeEqual, createHash } from "node:crypto";
import { cookies } from "next/headers";
export const COOKIE = "cotizador_session";
export function configured() {
  return (
    (process.env.SESSION_SECRET?.length ?? 0) >= 32 &&
    (process.env.ADMIN_PASSWORD?.length ?? 0) >= 16
  );
}
function signature(value: string) {
  if (!configured())
    throw new Error("Configura las credenciales del servidor.");
  return createHmac("sha256", process.env.SESSION_SECRET!)
    .update(value)
    .digest("hex");
}
export function equals(a: string, b: string) {
  return timingSafeEqual(
    createHash("sha256").update(a).digest(),
    createHash("sha256").update(b).digest(),
  );
}
export function sessionToken() {
  const payload = `admin:${Date.now() + 12 * 3600_000}`;
  return `${payload}.${signature(payload)}`;
}
export async function authenticated() {
  if (!configured()) return false;
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig || !equals(sig, signature(payload))) return false;
  const [name, expires] = payload.split(":");
  return name === "admin" && Number(expires) > Date.now();
}
export function clientKey(req: Request) {
  const ip = process.env.VERCEL
    ? req.headers.get("x-vercel-forwarded-for")?.split(",")[0] || "unknown"
    : "local";
  return createHash("sha256")
    .update(`${process.env.SESSION_SECRET}:${ip}`)
    .digest("hex");
}
