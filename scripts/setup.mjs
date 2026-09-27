import { existsSync, writeFileSync, mkdirSync } from "node:fs";
import { randomBytes } from "node:crypto";
mkdirSync("data", { recursive: true });
if (existsSync(".env.local")) {
  console.log(
    "Configuración existente conservada. Tu clave está en .env.local (ADMIN_PASSWORD).",
  );
} else {
  const password = randomBytes(18).toString("base64url");
  writeFileSync(
    ".env.local",
    `ADMIN_PASSWORD=${password}\nSESSION_SECRET=${randomBytes(48).toString("hex")}\nAPP_URL=http://127.0.0.1:3004\nDATABASE_URL=file:data/cotizador.db\n`,
    { mode: 0o600 },
  );
  console.log(
    "Configuración privada creada. Abre .env.local para consultar ADMIN_PASSWORD. Inicia con npm run dev.",
  );
}
