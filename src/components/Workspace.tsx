"use client";
import { useEffect, useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpRight,
  Plus,
  Search,
  LayoutDashboard,
  Inbox,
  Layers,
  Settings2,
  LogOut,
  Copy,
  ChevronRight,
  Clock3,
  FileText,
  Check,
  ExternalLink,
} from "lucide-react";
import {
  defaults,
  newQuote,
  type Settings,
  type Service,
  type QuoteRecord,
  type Intake,
} from "@/domain/schema";
import { money, totals } from "@/domain/calculations";
import { api, Field, NumberField, Pill } from "./ui";
import QuoteEditor from "./QuoteEditor";
type RequestRecord = {
  id: string;
  data: Intake;
  createdAt: string;
  quoteId: string | null;
};
type Data = {
  settings: Settings;
  services: Service[];
  quotes: QuoteRecord[];
  requests: RequestRecord[];
};
const nav = [
  ["quotes", "Cotizaciones", LayoutDashboard],
  ["requests", "Solicitudes", Inbox],
  ["services", "Servicios", Layers],
  ["settings", "Configuración", Settings2],
] as const;
export default function Workspace() {
  const [data, setData] = useState<Data | null>(null);
  const [view, setView] = useState("quotes");
  const [editing, setEditing] = useState<QuoteRecord | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Todas");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const reload = async () => {
    const result = await api("bootstrap");
    setData(result as Data);
    return result as Data;
  };
  useEffect(() => {
    reload().catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    if (message) {
      const t = setTimeout(() => setMessage(""), 4500);
      return () => clearTimeout(t);
    }
  }, [message]);
  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function create(source?: QuoteRecord) {
    await run(async () => {
      const q = source
        ? { ...source.data, title: `${source.data.title} · copia` }
        : newQuote(data!.settings);
      const { id } = await api("quotes", "POST", q);
      const fresh = await reload();
      setEditing(fresh.quotes.find((x) => x.id === id)!);
    });
  }
  if (!data)
    return (
      <main className="loading">
        <span className="brand-mark">✳</span>
        <p>{error || "Preparando tu estudio…"}</p>
        {error && (
          <button className="btn" onClick={() => location.reload()}>
            Reintentar
          </button>
        )}
      </main>
    );
  const pending = data.requests.filter((r) => !r.quoteId).length;
  const displayed = data.quotes.filter(
    (q) =>
      (filter === "Todas" || q.state === filter) &&
      `${q.data.client} ${q.data.title} ${q.folio || ""}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <div className="workspace">
      <aside className="sidebar">
        <a className="brand" href="/">
          <span className="brand-mark">✳</span>cotiza
          <span className="brand-dot">.</span>
        </a>
        <div className="workspace-label">TU ESPACIO DE TRABAJO</div>
        <nav aria-label="Navegación principal">
          {nav.map(([key, label, Icon]) => (
            <button
              key={key}
              aria-label={label}
              className={`nav-item ${view === key ? "active" : ""}`}
              onClick={() => {
                if (editing) {
                  setMessage(
                    "Vuelve a la lista desde el editor para terminar de guardar.",
                  );
                  return;
                }
                setView(key);
              }}
            >
              <Icon size={19} />
              <span>{label}</span>
              {key === "requests" && pending > 0 && (
                <b className="count">{pending}</b>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <span className="tiny-star">✳</span>
            <strong>
              Menos tareas.
              <br />
              Más posibilidades.
            </strong>
            <p>Cotiza el valor de lo que haces.</p>
          </div>
          <a
            href="/solicitar"
            target="_blank"
            rel="noreferrer"
            className="nav-item"
          >
            <ExternalLink size={17} />
            <span>Formulario del cliente</span>
          </a>
          <button
            className="nav-item"
            onClick={() =>
              run(async () => {
                await api("logout", "POST", {});
                location.assign("/login");
              })
            }
          >
            <LogOut size={17} />
            <span>Cerrar sesión</span>
          </button>
          <div className="profile">
            <span className="avatar">
              {data.settings.name
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")}
            </span>
            <div>
              <strong>{data.settings.name}</strong>
              <small>Estudio independiente</small>
            </div>
          </div>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <span className="breadcrumb">
            Tu estudio <ChevronRight size={14} />{" "}
            {nav.find((n) => n[0] === view)?.[1]}
            {editing && " / Nueva propuesta"}
          </span>
          <span className="private-chip">
            <span />
            Espacio privado
          </span>
        </header>
        {error && (
          <div className="alert error" role="alert">
            {error}
            <button aria-label="Cerrar aviso" onClick={() => setError("")}>
              ×
            </button>
          </div>
        )}
        {message && (
          <div className="toast" role="status">
            <Check size={16} />
            {message}
          </div>
        )}
        {editing ? (
          <QuoteEditor
            key={editing.id}
            record={editing}
            settings={data.settings}
            services={data.services}
            onClose={async () => {
              await reload();
              setEditing(null);
            }}
            onError={setError}
            onNotice={setMessage}
          />
        ) : view === "quotes" ? (
          <>
            <div className="page-heading">
              <div>
                <span className="eyebrow">
                  CLARIDAD DESDE LA PRIMERA PROPUESTA
                </span>
                <h1>
                  Tu próximo proyecto
                  <br />
                  empieza aquí<span className="lime-dot">.</span>
                </h1>
                <p>Transforma tu experiencia en propuestas que se entienden.</p>
              </div>
              <button
                className="btn primary"
                disabled={busy}
                onClick={() => create()}
              >
                <Plus size={19} />
                Nueva cotización
              </button>
            </div>
            <div className="stats">
              <article className="stat-card">
                <span className="stat-icon">
                  <FileText size={19} />
                </span>
                <span>Propuestas creadas</span>
                <strong>
                  {data.quotes.length.toString().padStart(2, "0")}
                </strong>
                <small>Tu historial de oportunidades</small>
              </article>
              <article className="stat-card">
                <span className="stat-icon">
                  <Clock3 size={19} />
                </span>
                <span>Por terminar</span>
                <strong>
                  {data.quotes
                    .filter((q) => q.state === "Borrador")
                    .length.toString()
                    .padStart(2, "0")}
                </strong>
                <small>Borradores listos para retomar</small>
              </article>
              <article className="stat-card accent">
                <span className="stat-icon">
                  <ArrowUpRight size={19} />
                </span>
                <span>Inversión propuesta</span>
                <strong>
                  {money(
                    data.quotes
                      .filter(
                        (q) =>
                          q.state !== "Borrador" && q.state !== "Rechazada",
                      )
                      .reduce((n, q) => n + totals(q.data).once, 0),
                  )}
                </strong>
                <small>Pago único cotizado · no son ingresos</small>
              </article>
            </div>
            <section className="panel list-panel">
              <div className="section-toolbar">
                <div>
                  <h2>
                    Todas tus cotizaciones{" "}
                    <span className="subcount">{data.quotes.length}</span>
                  </h2>
                  <p>Una propuesta clara. Un siguiente paso concreto.</p>
                </div>
                <div className="filters">
                  <label className="search">
                    <Search size={17} />
                    <input
                      aria-label="Buscar cotizaciones"
                      placeholder="Buscar cliente o proyecto"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </label>
                  <select
                    aria-label="Filtrar por estado"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    {[
                      "Todas",
                      "Borrador",
                      "Emitida",
                      "Compartida",
                      "Aceptada",
                      "Rechazada",
                    ].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
              {displayed.length ? (
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>PROYECTO / CLIENTE</th>
                        <th>INVERSIÓN ÚNICA</th>
                        <th>ESTADO</th>
                        <th>ACTUALIZADA</th>
                        <th>
                          <span className="sr-only">Acciones</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayed.map((q) => (
                        <tr key={q.id}>
                          <td>
                            <button
                              className="table-title"
                              onClick={() => setEditing(q)}
                            >
                              {q.data.title || "Nueva propuesta"}
                              <small>
                                {q.data.client || "Cliente por definir"}
                                {q.folio ? ` · ${q.folio}` : ""}
                              </small>
                            </button>
                          </td>
                          <td className="amount">
                            {money(totals(q.data).once)}
                          </td>
                          <td>
                            <Pill
                              tone={
                                q.state === "Aceptada"
                                  ? "green"
                                  : q.state === "Borrador"
                                    ? "neutral"
                                    : "blue"
                              }
                            >
                              {q.state}
                            </Pill>
                          </td>
                          <td className="date-cell">
                            {new Date(q.updatedAt).toLocaleDateString("es-EC", {
                              day: "2-digit",
                              month: "short",
                            })}
                          </td>
                          <td>
                            <div className="table-actions">
                              {q.issueId && (
                                <a
                                  className="icon-btn"
                                  aria-label={`Descargar ${q.folio}`}
                                  href={`/api/issues/${q.issueId}/pdf`}
                                >
                                  <ArrowDownToLine size={17} />
                                </a>
                              )}
                              <button
                                className="icon-btn"
                                aria-label={`Duplicar ${q.data.title || "propuesta"}`}
                                disabled={busy}
                                onClick={() => create(q)}
                              >
                                <Copy size={17} />
                              </button>
                              <button
                                className="icon-btn"
                                aria-label={`Abrir ${q.data.title || "propuesta"}`}
                                onClick={() => setEditing(q)}
                              >
                                <ArrowUpRight size={19} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty">
                  <div className="empty-art">
                    <FileText size={35} />
                    <span>+</span>
                  </div>
                  <h3>
                    {search || filter !== "Todas"
                      ? "No hay coincidencias"
                      : "Tu primera propuesta, a unos pasos"}
                  </h3>
                  <p>
                    {search || filter !== "Todas"
                      ? "Prueba con otro cliente o estado."
                      : "Elige una solución, calcula tu esfuerzo y presenta el valor de tu trabajo."}
                  </p>
                  {!search && filter === "Todas" && (
                    <button
                      className="btn dark"
                      onClick={() => create()}
                      disabled={busy}
                    >
                      Crear mi primera cotización
                      <ArrowUpRight size={17} />
                    </button>
                  )}
                </div>
              )}
            </section>
            <div className="bottom-note">
              <span>✳</span>
              <p>
                <strong>Tu tarifa, tus reglas.</strong> Base actual:{" "}
                {money(data.settings.rateCents)}/hora. Cada propuesta conserva
                su propia tarifa.
              </p>
              <button className="text-link" onClick={() => setView("settings")}>
                Configurar <ArrowUpRight size={14} />
              </button>
            </div>
          </>
        ) : view === "requests" ? (
          <>
            <div className="page-heading">
              <div>
                <span className="eyebrow">ESCUCHA ANTES DE COTIZAR</span>
                <h1>
                  De necesidad a oportunidad<span className="lime-dot">.</span>
                </h1>
                <p>
                  Revisa el contexto del cliente y convierte su solicitud en una
                  propuesta.
                </p>
              </div>
              <button
                className="btn primary"
                onClick={() =>
                  run(async () => {
                    await navigator.clipboard.writeText(
                      `${location.origin}/solicitar`,
                    );
                    setMessage(
                      "Enlace del formulario copiado. Solo será público cuando publiques la aplicación.",
                    );
                  })
                }
              >
                <Copy size={17} />
                Copiar formulario
              </button>
            </div>
            <div className="alert">
              El formulario recoge solicitudes. El precio definitivo se prepara
              después de revisar el alcance. Un enlace local solo funciona en
              este equipo.
            </div>
            {!data.requests.length ? (
              <section className="panel empty">
                <Inbox size={35} />
                <h3>Tu bandeja está lista</h3>
                <p>Comparte el formulario cuando publiques la aplicación.</p>
                <a
                  className="btn"
                  href="/solicitar"
                  target="_blank"
                  rel="noreferrer"
                >
                  Probar formulario
                  <ExternalLink size={16} />
                </a>
              </section>
            ) : (
              <div className="request-grid">
                {data.requests.map((r) => (
                  <article className="panel request-card" key={r.id}>
                    <div className="split">
                      <span className="eyebrow">
                        SOL-{r.id.slice(0, 8).toUpperCase()}
                      </span>
                      <Pill tone={r.quoteId ? "green" : "blue"}>
                        {r.quoteId ? "En cotización" : "Por revisar"}
                      </Pill>
                    </div>
                    <h2>{r.data.company}</h2>
                    <p className="muted">
                      {r.data.name} · {r.data.email}
                    </p>
                    <h4>Lo que necesita</h4>
                    <p className="preserve">{r.data.need}</p>
                    <dl>
                      <dt>Herramientas</dt>
                      <dd>{r.data.tools || "Sin indicar"}</dd>
                      <dt>Presupuesto</dt>
                      <dd>{r.data.budget || "Necesita orientación"}</dd>
                      <dt>Plazo</dt>
                      <dd>{r.data.deadline || "Flexible"}</dd>
                      <dt>Volumen mensual</dt>
                      <dd>{r.data.volume ?? "No indicado"}</dd>
                    </dl>
                    {r.data.details && (
                      <p className="muted preserve">{r.data.details}</p>
                    )}
                    <button
                      className="btn dark"
                      disabled={busy}
                      onClick={() =>
                        run(async () => {
                          const result = await api(
                            `requests/${r.id}/convert`,
                            "POST",
                            {},
                          );
                          const fresh = await reload();
                          setView("quotes");
                          setEditing(
                            fresh.quotes.find((q) => q.id === result.id)!,
                          );
                        })
                      }
                    >
                      {r.quoteId ? "Abrir cotización" : "Preparar propuesta"}
                      <ArrowUpRight size={16} />
                    </button>
                  </article>
                ))}
              </div>
            )}
          </>
        ) : view === "services" ? (
          <Catalog
            services={data.services}
            rate={data.settings.rateCents}
            onSave={async (services) => {
              await api("services", "PUT", services);
              await reload();
              setMessage(
                "Catálogo guardado. Las cotizaciones existentes conservan sus datos.",
              );
            }}
          />
        ) : (
          <Preferences
            value={data.settings}
            onSave={async (settings) => {
              await api("settings", "PUT", settings);
              await reload();
              setMessage("Configuración guardada.");
            }}
          />
        )}
        <footer className="app-footer">
          <span>Cotiza · Tu estudio de propuestas</span>
          <span>Diseñado para trabajar con claridad.</span>
        </footer>
      </main>
    </div>
  );
}
function Catalog({
  services,
  rate,
  onSave,
}: {
  services: Service[];
  rate: number;
  onSave: (v: Service[]) => Promise<void>;
}) {
  const [items, setItems] = useState(services);
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const change = (id: string, key: keyof Service, value: unknown) =>
    setItems((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [key]: value } : s)),
    );
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">TU EXPERIENCIA, EN MÓDULOS</span>
          <h1>
            Soluciones que suman<span className="lime-dot">.</span>
          </h1>
          <p>
            Plantillas editables para empezar cada propuesta con una buena base.
          </p>
        </div>
        <button
          className="btn primary"
          onClick={() => {
            const id = crypto.randomUUID();
            setItems([
              ...items,
              {
                id,
                name: "Nuevo servicio",
                category: "Automatización",
                scope: "",
                exclusions: "",
                minutes: 60,
                mode: "hours",
                fixedCents: 0,
                active: true,
              },
            ]);
            setEditing(id);
          }}
        >
          <Plus size={18} />
          Añadir servicio
        </button>
      </div>
      <div className="alert">
        Las horas iniciales son ejemplos orientativos. Ajusta el alcance y el
        esfuerzo antes de cotizar un proyecto real.
      </div>
      {error && (
        <div className="alert error" role="alert">
          {error}
        </div>
      )}
      <div className="service-grid">
        {items.map((s) => (
          <article
            key={s.id}
            className={`panel service-card ${!s.active ? "inactive" : ""}`}
          >
            <div className="split">
              <span className="icon-tile">
                <Layers size={20} />
              </span>
              <Pill>{s.category}</Pill>
            </div>
            {editing === s.id ? (
              <div className="form-stack">
                <Field label="Nombre del servicio">
                  <input
                    value={s.name}
                    onChange={(e) => change(s.id, "name", e.target.value)}
                    maxLength={180}
                  />
                </Field>
                <Field label="Categoría">
                  <select
                    value={s.category}
                    onChange={(e) => change(s.id, "category", e.target.value)}
                  >
                    {[
                      "Diagnóstico",
                      "Automatización",
                      "Apps Script",
                      "RPA",
                      "Agente de IA",
                      "Capacitación",
                      "Soporte",
                    ].map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Alcance y entregables">
                  <textarea
                    value={s.scope}
                    onChange={(e) => change(s.id, "scope", e.target.value)}
                    maxLength={4000}
                  />
                </Field>
                <Field label="Exclusiones">
                  <textarea
                    value={s.exclusions}
                    onChange={(e) => change(s.id, "exclusions", e.target.value)}
                    maxLength={4000}
                  />
                </Field>
                <Field label="Modalidad">
                  <select
                    value={s.mode}
                    onChange={(e) => change(s.id, "mode", e.target.value)}
                  >
                    <option value="hours">Por horas</option>
                    <option value="fixed">Importe fijo</option>
                  </select>
                </Field>
                <NumberField
                  label="Horas estimadas"
                  value={s.minutes / 60}
                  step={0.25}
                  onChange={(v) =>
                    change(s.id, "minutes", Math.round((v ?? 0) * 60))
                  }
                />
                {s.mode === "fixed" && (
                  <NumberField
                    label="Precio fijo (USD)"
                    value={s.fixedCents / 100}
                    step={0.01}
                    onChange={(v) =>
                      change(s.id, "fixedCents", Math.round((v ?? 0) * 100))
                    }
                  />
                )}
                <label className="check">
                  <input
                    type="checkbox"
                    checked={s.active}
                    onChange={(e) => change(s.id, "active", e.target.checked)}
                  />
                  Disponible para nuevas cotizaciones
                </label>
                <button className="btn" onClick={() => setEditing(null)}>
                  Listo
                </button>
              </div>
            ) : (
              <>
                <h2>{s.name}</h2>
                <p>{s.scope || "Define el alcance de este servicio."}</p>
                <div className="service-price">
                  {s.mode === "hours"
                    ? `${s.minutes / 60} h`
                    : `${money(s.fixedCents)}`}
                  <small>
                    {s.mode === "hours"
                      ? `${money(Math.round((s.minutes * rate) / 60))} · estimación inicial`
                      : "Importe fijo por unidad"}
                  </small>
                </div>
                <button className="text-link" onClick={() => setEditing(s.id)}>
                  Editar plantilla <ArrowUpRight size={16} />
                </button>
              </>
            )}
          </article>
        ))}
      </div>
      <div className="sticky-actions">
        <span>Los cambios aplican a propuestas nuevas.</span>
        <button
          className="btn dark"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setError("");
            try {
              await onSave(items);
              setEditing(null);
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "Guardando…" : "Guardar catálogo"}
          <Check size={17} />
        </button>
      </div>
    </>
  );
}
function Preferences({
  value,
  onSave,
}: {
  value: Settings;
  onSave: (s: Settings) => Promise<void>;
}) {
  const [s, set] = useState(value);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const update = (key: keyof Settings, v: unknown) =>
    set((prev) => ({ ...prev, [key]: v }));
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">HECHO A TU NOMBRE</span>
          <h1>
            Tu marca. Tus condiciones<span className="lime-dot">.</span>
          </h1>
          <p>
            Estos datos aparecerán en las proformas que emitas a partir de
            ahora.
          </p>
        </div>
      </div>
      <form
        className="settings-layout"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            await onSave(s);
          } catch (err) {
            setError((err as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <section className="panel form-panel">
          <h2>Identidad y contacto</h2>
          <div className="form-grid">
            {(
              [
                ["name", "Nombre o marca"],
                ["tagline", "Descripción breve"],
                ["email", "Correo de contacto"],
                ["phone", "Teléfono"],
                ["taxId", "Identificación fiscal (opcional)"],
                ["address", "Dirección (opcional)"],
              ] as const
            ).map(([key, label]) => (
              <Field key={key} label={label}>
                <input
                  type={key === "email" ? "email" : "text"}
                  required={key === "name"}
                  value={s[key]}
                  onChange={(e) => update(key, e.target.value)}
                  maxLength={180}
                />
              </Field>
            ))}
          </div>
          <Field label="Logo (PNG o JPG, hasta 140 KB)">
            <input
              type="file"
              accept="image/png,image/jpeg"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 140000) {
                  setError("El logo debe pesar menos de 140 KB.");
                  return;
                }
                const reader = new FileReader();
                reader.onload = () => update("logo", reader.result as string);
                reader.readAsDataURL(file);
              }}
            />
          </Field>
          {s.logo && (
            <div className="logo-preview">
              <img src={s.logo} alt="Logo de la marca" />
              <button
                type="button"
                className="text-link"
                onClick={() => update("logo", "")}
              >
                Quitar logo
              </button>
            </div>
          )}
          <hr />
          <h2>Reglas iniciales</h2>
          <div className="form-grid">
            <NumberField
              label="Tarifa por hora (USD)"
              value={s.rateCents / 100}
              step={0.01}
              min={0.01}
              onChange={(v) => update("rateCents", Math.round((v ?? 0) * 100))}
            />
            <NumberField
              label="Vigencia de la proforma"
              value={s.validDays}
              suffix="días"
              min={1}
              max={365}
              onChange={(v) => update("validDays", v ?? 10)}
            />
          </div>
          <Field
            label="Condiciones de pago por defecto"
            hint="Texto inicial editable en cada cotización. Revísalo antes de emitir."
          >
            <textarea
              rows={4}
              value={s.payment}
              onChange={(e) => update("payment", e.target.value)}
              maxLength={4000}
            />
          </Field>
          {error && (
            <p className="alert error" role="alert">
              {error}
            </p>
          )}
          <button className="btn primary" disabled={busy}>
            {busy ? "Guardando…" : "Guardar configuración"}
            <Check size={18} />
          </button>
        </section>
        <aside className="panel settings-help">
          <span className="icon-tile">
            <Settings2 size={22} />
          </span>
          <h3>Una base, muchas propuestas</h3>
          <p>
            Tu tarifa se copia al añadir un servicio. Cambiarla aquí no modifica
            cotizaciones anteriores.
          </p>
          <p>
            Los impuestos se confirman en cada propuesta. La referencia visual
            no determina tu tratamiento fiscal.
          </p>
          <p>
            Solo se emite una proforma cuando hay un nombre y al menos un medio
            de contacto.
          </p>
          <div className="mini-brand">
            {s.name || defaults.name}
            <small>{s.tagline}</small>
          </div>
        </aside>
      </form>
    </>
  );
}
