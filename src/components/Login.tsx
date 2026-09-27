"use client";
import { useState } from "react";
import { ArrowUpRight, LockKeyhole, Sparkles } from "lucide-react";
export default function Login({ configured }: { configured: boolean }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <main className="auth-page">
      <section className="auth-story">
        <a className="brand" href="/">
          <span className="brand-mark">✳</span> cotiza
          <span className="brand-dot">.</span>
        </a>
        <div>
          <span className="eyebrow">TU TIEMPO TIENE VALOR</span>
          <h1>
            De una buena idea
            <br />a una propuesta
            <br />
            <em>lista para avanzar.</em>
          </h1>
          <p>
            Tu estudio de propuestas. Calcula, presenta el valor de tu trabajo y
            da el siguiente paso.
          </p>
        </div>
        <span className="story-foot">
          <Sparkles size={17} /> Hecho para tu forma de trabajar
        </span>
      </section>
      <section className="auth-form">
        <span className="icon-tile">
          <LockKeyhole size={23} />
        </span>
        <h2>Bienvenida a tu estudio</h2>
        <p>Accede a tus cotizaciones y solicitudes.</p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            try {
              const password = new FormData(e.currentTarget).get("password");
              const res = await fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data.error);
              location.assign("/");
            } catch (err) {
              setError((err as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            Clave de acceso
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              required
              placeholder="Tu clave privada"
            />
          </label>
          {error && (
            <p className="alert error" role="alert">
              {error}
            </p>
          )}
          {!configured && (
            <p className="alert">
              Primero configura el acceso con <code>npm run setup</code>.
            </p>
          )}
          <button className="btn primary wide" disabled={busy || !configured}>
            {busy ? "Entrando…" : "Entrar al panel"}
            <ArrowUpRight size={18} />
          </button>
        </form>
        <p className="fine">
          Acceso exclusivo de administración. Usa tu clave privada para entrar a
          tu espacio de trabajo.
        </p>
        <a className="text-link" href="/solicitar">
          ¿Buscas una solución para tu empresa? Solicítala aquí →
        </a>
      </section>
    </main>
  );
}
