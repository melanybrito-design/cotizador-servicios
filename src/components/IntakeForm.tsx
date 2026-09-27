"use client";
import { useState } from "react";
import { ArrowRight, ArrowLeft, Check, ArrowUpRight } from "lucide-react";
import { Field, NumberField, api } from "./ui";
export default function IntakeForm({ name }: { name: string }) {
  const [step, setStep] = useState(0),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [reference, setReference] = useState("");
  const [data, setData] = useState({
    key: crypto.randomUUID(),
    name: "",
    company: "",
    email: "",
    phone: "",
    need: "",
    outcome: "",
    tools: "",
    volume: null as number | null,
    minutes: null as number | null,
    people: null as number | null,
    budget: "Necesito orientación",
    deadline: "",
    category: "No lo sé todavía",
    details: "",
    consent: false,
    website: "",
  });
  const update = (key: keyof typeof data, value: unknown) =>
    setData((old) => ({ ...old, [key]: value }));
  return (
    <main className="intake-page">
      <header className="intake-header">
        <a className="brand" href="/solicitar">
          <span className="brand-mark">✳</span>cotiza
          <span className="brand-dot">.</span>
        </a>
        <span>Soluciones digitales · {name}</span>
        <a className="text-link" href="/login">
          Acceso privado
          <ArrowUpRight size={15} />
        </a>
      </header>
      <div className="intake-layout">
        <section className="intake-story">
          <span className="eyebrow">MENOS REPETICIÓN. MÁS POSIBILIDADES.</span>
          <h1>
            ¿Y si tu equipo
            <br />
            recuperara
            <br />
            <em>su tiempo?</em>
          </h1>
          <p>
            Cuéntame qué proceso quieres mejorar. Prepararé una propuesta
            adaptada a tu empresa y a lo que realmente necesitas.
          </p>
          <div className="intake-benefits">
            <span>
              <Check size={17} />
              Sin compromiso ni pago inicial
            </span>
            <span>
              <Check size={17} />
              No necesitas saber de tecnología
            </span>
            <span>
              <Check size={17} />
              Alcance y precios después de la revisión
            </span>
          </div>
          <div className="intake-stamp">
            Menos trabajo manual.
            <br />
            <strong>Más espacio para crecer. ↗</strong>
          </div>
        </section>
        <section className="panel intake-form">
          {reference ? (
            <div className="intake-success">
              <span className="success-circle">
                <Check size={35} />
              </span>
              <span className="eyebrow">EL PRIMER PASO ESTÁ DADO</span>
              <h2>Solicitud recibida</h2>
              <p>
                Tu referencia es <strong>{reference}</strong>.
              </p>
              <p>
                {name} revisará tu necesidad y utilizará el contacto indicado
                para continuar. Todavía no se ha emitido una proforma ni
                acordado un precio.
              </p>
              <div className="review-card">
                <h3>{data.company}</h3>
                <p className="preserve">{data.need}</p>
                <small>Contacto: {data.email}</small>
              </div>
              <p className="fine">
                Conserva esta referencia. No es necesario enviar de nuevo la
                solicitud.
              </p>
            </div>
          ) : (
            <>
              <div className="intake-progress">
                <span>PASO {step + 1} DE 3</span>
                <span>
                  {
                    [
                      "Tu necesidad",
                      "Contexto y presupuesto",
                      "Cómo te contacto",
                    ][step]
                  }
                </span>
              </div>
              <div className="progress-track">
                <span style={{ width: `${((step + 1) / 3) * 100}%` }} />
              </div>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setError("");
                  if (step < 2) {
                    setStep(step + 1);
                    return;
                  }
                  setBusy(true);
                  try {
                    const result = await api("requests", "POST", data);
                    setReference(result.reference);
                  } catch (err) {
                    setError((err as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <fieldset className="plain-fieldset" disabled={busy}>
                  {step === 0 ? (
                    <>
                      <h2>Empecemos por tu día a día</h2>
                      <p className="muted">
                        Piensa en esa tarea que tu equipo repite una y otra vez.
                      </p>
                      <Field label="¿Qué proceso quieres mejorar? *">
                        <textarea
                          required
                          minLength={15}
                          maxLength={4000}
                          rows={4}
                          value={data.need}
                          onChange={(e) => update("need", e.target.value)}
                          placeholder="Ej. Cada semana copiamos las ventas de varias hojas para preparar un reporte."
                        />
                      </Field>
                      <Field label="¿Qué te gustaría conseguir?">
                        <textarea
                          maxLength={4000}
                          value={data.outcome}
                          onChange={(e) => update("outcome", e.target.value)}
                          placeholder="Ej. Tener el reporte listo automáticamente cada lunes."
                        />
                      </Field>
                      <Field label="Herramientas que utilizas">
                        <input
                          value={data.tools}
                          maxLength={180}
                          onChange={(e) => update("tools", e.target.value)}
                          placeholder="Google Sheets, Excel, WhatsApp, CRM…"
                        />
                      </Field>
                      <Field label="¿Tienes una solución en mente?">
                        <select
                          value={data.category}
                          onChange={(e) => update("category", e.target.value)}
                        >
                          {[
                            "No lo sé todavía",
                            "Automatización entre herramientas",
                            "Apps Script / Google Workspace",
                            "RPA / tareas en pantalla",
                            "Agente de IA / atención",
                            "Diagnóstico del proceso",
                          ].map((x) => (
                            <option key={x}>{x}</option>
                          ))}
                        </select>
                      </Field>
                      {data.category === "Agente de IA / atención" && (
                        <p className="alert">
                          En el comentario final, indica los canales de atención
                          y cuándo debería intervenir una persona.
                        </p>
                      )}
                      {data.category ===
                        "Automatización entre herramientas" && (
                        <p className="alert">
                          En el comentario final, indica qué herramientas
                          quieres conectar y si tienes acceso autorizado.
                        </p>
                      )}
                    </>
                  ) : step === 1 ? (
                    <>
                      <h2>Un poco de contexto</h2>
                      <p className="muted">
                        Si no conoces una cifra, puedes dejarla vacía.
                      </p>
                      <div className="form-grid">
                        <NumberField
                          label="Veces que se realiza al mes"
                          value={data.volume}
                          hint="Total del equipo, no por persona."
                          onChange={(v) => update("volume", v)}
                        />
                        <NumberField
                          label="Minutos por cada vez"
                          value={data.minutes}
                          step={0.1}
                          onChange={(v) => update("minutes", v)}
                        />
                        <NumberField
                          label="Personas involucradas"
                          value={data.people}
                          min={1}
                          onChange={(v) => update("people", v)}
                        />
                      </div>
                      <Field label="Presupuesto aproximado (USD)">
                        <select
                          value={data.budget}
                          onChange={(e) => update("budget", e.target.value)}
                        >
                          {[
                            "Necesito orientación",
                            "Menos de $300",
                            "$300–$600",
                            "$600–$1.500",
                            "Más de $1.500",
                            "Prefiero conversarlo",
                          ].map((x) => (
                            <option key={x}>{x}</option>
                          ))}
                        </select>
                      </Field>
                      <Field label="¿Para cuándo te gustaría tenerlo?">
                        <input
                          value={data.deadline}
                          maxLength={180}
                          onChange={(e) => update("deadline", e.target.value)}
                          placeholder="Ej. El próximo mes, con fecha flexible"
                        />
                      </Field>
                      <p className="fine">
                        Tu presupuesto ayuda a priorizar el alcance. No
                        determina automáticamente el precio del mismo trabajo.
                      </p>
                    </>
                  ) : (
                    <>
                      <h2>Sigamos la conversación</h2>
                      <div className="form-grid">
                        <Field label="Tu nombre *">
                          <input
                            required
                            minLength={2}
                            maxLength={180}
                            autoComplete="name"
                            value={data.name}
                            onChange={(e) => update("name", e.target.value)}
                          />
                        </Field>
                        <Field label="Empresa *">
                          <input
                            required
                            minLength={2}
                            maxLength={180}
                            autoComplete="organization"
                            value={data.company}
                            onChange={(e) => update("company", e.target.value)}
                          />
                        </Field>
                        <Field label="Correo *">
                          <input
                            required
                            type="email"
                            autoComplete="email"
                            value={data.email}
                            maxLength={180}
                            onChange={(e) => update("email", e.target.value)}
                          />
                        </Field>
                        <Field label="Teléfono (opcional)">
                          <input
                            type="tel"
                            autoComplete="tel"
                            value={data.phone}
                            maxLength={180}
                            onChange={(e) => update("phone", e.target.value)}
                          />
                        </Field>
                      </div>
                      <Field label="Algo más que deba saber">
                        <textarea
                          rows={3}
                          value={data.details}
                          maxLength={4000}
                          onChange={(e) => update("details", e.target.value)}
                          placeholder="Integraciones, formatos de documentos, revisiones necesarias…"
                        />
                      </Field>
                      <label className="honeypot" aria-hidden="true">
                        Sitio web
                        <input
                          tabIndex={-1}
                          autoComplete="off"
                          value={data.website}
                          onChange={(e) => update("website", e.target.value)}
                        />
                      </label>
                      <p className="fine">
                        No incluyas contraseñas, claves API ni información
                        sensible de tus clientes.
                      </p>
                      <label className="check">
                        <input
                          required
                          type="checkbox"
                          checked={data.consent}
                          onChange={(e) => update("consent", e.target.checked)}
                        />
                        Autorizo a {name} a usar estos datos para revisar mi
                        solicitud y contactarme sobre esta propuesta.
                      </label>
                    </>
                  )}
                  {error && (
                    <p className="alert error" role="alert">
                      {error}
                    </p>
                  )}
                  <div className="step-actions">
                    {step > 0 ? (
                      <button
                        type="button"
                        className="btn"
                        onClick={() => setStep(step - 1)}
                      >
                        <ArrowLeft size={16} />
                        Atrás
                      </button>
                    ) : (
                      <span className="fine">* Campos obligatorios</span>
                    )}
                    <button className="btn primary" disabled={busy}>
                      {busy
                        ? "Enviando…"
                        : step === 2
                          ? "Enviar solicitud"
                          : "Continuar"}
                      <ArrowRight size={17} />
                    </button>
                  </div>
                </fieldset>
              </form>
            </>
          )}
        </section>
      </div>
      <footer className="intake-footer">
        Tu información se utiliza para preparar esta propuesta. No se publica ni
        se comparte con otros clientes.
      </footer>
    </main>
  );
}
