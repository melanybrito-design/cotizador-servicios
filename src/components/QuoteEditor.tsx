"use client";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  FileDown,
  Eye,
  Check,
  Clock3,
  ArrowUpRight,
  History,
  ChevronDown,
} from "lucide-react";
import {
  fromService,
  type Quote,
  type QuoteRecord,
  type Service,
  type Settings,
  type Line,
} from "@/domain/schema";
import {
  totals,
  money,
  decimal,
  impact,
  priceLine,
  issuanceErrors,
} from "@/domain/calculations";
import { api, Field, NumberField, Pill } from "./ui";
type Props = {
  record: QuoteRecord;
  settings: Settings;
  services: Service[];
  onClose: () => Promise<void>;
  onError: (s: string) => void;
  onNotice: (s: string) => void;
};
export default function QuoteEditor({
  record,
  settings,
  services,
  onClose,
  onError,
  onNotice,
}: Props) {
  const [q, setQ] = useState<Quote>(record.data),
    [step, setStep] = useState(0),
    [saving, setSaving] = useState("Guardado"),
    [busy, setBusy] = useState(false),
    [issue, setIssue] = useState(record.issueId),
    [state, setState] = useState(record.state),
    [history, setHistory] = useState<
      { id: number; folio: string; revision: number; date: string }[]
    >([]),
    [showHistory, setShowHistory] = useState(false);
  const current = useRef(q),
    revision = useRef(record.revision),
    last = useRef(JSON.stringify(record.data)),
    queue = useRef<Promise<void>>(Promise.resolve());
  current.current = q;
  const changed = JSON.stringify(q) !== last.current;
  const update = (key: keyof Quote, value: unknown) =>
    setQ((old) => ({ ...old, [key]: value }));
  const updateImpact = (key: keyof Quote["impact"], value: unknown) =>
    setQ((old) => ({ ...old, impact: { ...old.impact, [key]: value } }));
  const lineChange = (id: string, key: keyof Line, value: unknown) =>
    setQ((old) => ({
      ...old,
      lines: old.lines.map((l) => (l.id === id ? { ...l, [key]: value } : l)),
    }));
  function save() {
    const snapshot = JSON.stringify(current.current);
    queue.current = queue.current
      .catch(() => {})
      .then(async () => {
        if (last.current === snapshot) return;
        setSaving("Guardando…");
        try {
          const result = await api(`quotes/${record.id}`, "PUT", {
            data: JSON.parse(snapshot),
            revision: revision.current,
          });
          revision.current = result.revision;
          last.current = snapshot;
          setIssue(undefined);
          setState("Borrador");
          setSaving("Guardado");
        } catch (e) {
          setSaving("No se pudo guardar");
          throw e;
        }
      });
    return queue.current;
  }
  useEffect(() => {
    if (!changed) return;
    setSaving("Cambios pendientes");
    const timer = setTimeout(
      () => save().catch((e) => onError(e.message)),
      1000,
    );
    return () => clearTimeout(timer);
  }, [q]); // Save snapshots serially; older responses cannot overwrite newer edits.
  useEffect(() => {
    const listener = (e: BeforeUnloadEvent) => {
      if (JSON.stringify(current.current) !== last.current) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", listener);
    return () => window.removeEventListener("beforeunload", listener);
  }, []);
  const t = totals(q),
    a = impact(q),
    errors = issuanceErrors(q, settings);
  async function action(fn: () => Promise<void>) {
    setBusy(true);
    onError("");
    try {
      await save();
      await fn();
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function preview() {
    await action(async () => {
      const res = await fetch(`/api/quotes/${record.id}/preview`);
      if (!res.ok) throw new Error((await res.json()).error);
      const url = URL.createObjectURL(await res.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = "borrador-propuesta.pdf";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      onNotice("Vista previa descargada. Está marcada como borrador.");
    });
  }
  return (
    <>
      <div className="editor-heading">
        <button
          className="text-link"
          disabled={busy}
          onClick={() => action(onClose)}
        >
          <ArrowLeft size={16} />
          Volver a cotizaciones
        </button>
        <span
          className={`save-status ${saving.includes("pudo") ? "save-error" : ""}`}
          role="status"
        >
          {saving === "Guardado" ? <Check size={14} /> : <Clock3 size={14} />}{" "}
          {saving}
        </span>
      </div>
      {!issue && (
        <button
          className="text-link discard-draft"
          disabled={busy}
          onClick={() => {
            if (
              window.confirm(
                "¿Eliminar este borrador? Esta acción no se puede deshacer. Las proformas emitidas se conservan.",
              )
            )
              action(async () => {
                await api(`quotes/${record.id}/discard`, "POST", {});
                await onClose();
                onNotice("Borrador eliminado.");
              });
          }}
        >
          <Trash2 size={13} />
          Eliminar borrador
        </button>
      )}
      <div className="page-heading compact">
        <div>
          <span className="eyebrow">PROPUESTA A TU MEDIDA</span>
          <h1>
            {q.title || "Dale forma a tu próxima solución"}
            <span className="lime-dot">.</span>
          </h1>
        </div>
        <Pill tone={issue ? "green" : "neutral"}>{state}</Pill>
      </div>
      <div className="stepper" aria-label="Pasos de la cotización">
        {[
          "Cliente y necesidad",
          "Solución y esfuerzo",
          "Ahorro y valor",
          "Revisar y emitir",
        ].map((name, i) => (
          <button
            key={name}
            aria-current={step === i ? "step" : undefined}
            className={step === i ? "selected" : step > i ? "complete" : ""}
            onClick={() => setStep(i)}
          >
            <span>
              {step > i ? <Check size={15} /> : String(i + 1).padStart(2, "0")}
            </span>
            {name}
          </button>
        ))}
      </div>
      <div className="editor-grid">
        <section className="panel form-panel editor-form">
          <fieldset disabled={busy} className="plain-fieldset">
            {step === 0 ? (
              <>
                <span className="eyebrow">01 / EL PUNTO DE PARTIDA</span>
                <h2>Primero, entiende la necesidad</h2>
                <p className="muted">
                  Una buena propuesta empieza con un problema bien definido.
                </p>
                <div className="form-grid">
                  <Field label="Nombre del proyecto *">
                    <input
                      value={q.title}
                      placeholder="Ej. Reportes automáticos de ventas"
                      maxLength={180}
                      onChange={(e) => update("title", e.target.value)}
                    />
                  </Field>
                  <Field label="Empresa / cliente *">
                    <input
                      value={q.client}
                      placeholder="Nombre de la empresa"
                      maxLength={180}
                      onChange={(e) => update("client", e.target.value)}
                    />
                  </Field>
                  <Field label="Persona de contacto *">
                    <input
                      value={q.contact}
                      maxLength={180}
                      onChange={(e) => update("contact", e.target.value)}
                    />
                  </Field>
                  <Field label="Correo del cliente">
                    <input
                      type="email"
                      value={q.email}
                      maxLength={180}
                      onChange={(e) => update("email", e.target.value)}
                    />
                  </Field>
                </div>
                <Field label="¿Qué problema vamos a resolver? *">
                  <textarea
                    value={q.problem}
                    rows={4}
                    placeholder="Describe la tarea actual, la dificultad y a quién afecta."
                    maxLength={4000}
                    onChange={(e) => update("problem", e.target.value)}
                  />
                </Field>
                <Field label="¿Qué recibirá o podrá hacer el cliente? *">
                  <textarea
                    value={q.outcome}
                    rows={3}
                    placeholder="Un resultado concreto y fácil de entender."
                    maxLength={4000}
                    onChange={(e) => update("outcome", e.target.value)}
                  />
                </Field>
                <details>
                  <summary>
                    Datos adicionales del cliente <ChevronDown size={16} />
                  </summary>
                  <div className="form-grid">
                    <Field label="Identificación fiscal">
                      <input
                        value={q.taxId}
                        maxLength={180}
                        onChange={(e) => update("taxId", e.target.value)}
                      />
                    </Field>
                    <Field label="Dirección">
                      <input
                        value={q.address}
                        maxLength={180}
                        onChange={(e) => update("address", e.target.value)}
                      />
                    </Field>
                  </div>
                </details>
              </>
            ) : step === 1 ? (
              <>
                <span className="eyebrow">02 / TU EXPERIENCIA EN ACCIÓN</span>
                <h2>Construye la solución</h2>
                <p className="muted">
                  Añade módulos y ajusta las horas al alcance real. Incluye
                  diagnóstico, pruebas y entrega.
                </p>
                <div className="module-picker">
                  {services
                    .filter((s) => s.active)
                    .map((s) => (
                      <button
                        key={s.id}
                        className="module-chip"
                        onClick={() =>
                          update("lines", [
                            ...q.lines,
                            fromService(s, settings.rateCents),
                          ])
                        }
                        disabled={q.lines.length >= 30}
                      >
                        <Plus size={15} />
                        {s.name}
                      </button>
                    ))}
                </div>
                {!q.lines.length && (
                  <div className="inline-empty">
                    Selecciona un servicio para empezar. Las horas sugeridas son
                    editables.
                  </div>
                )}
                {q.lines.map((l, i) => (
                  <article key={l.id} className="line-editor">
                    <div className="split">
                      <span className="eyebrow">
                        CONCEPTO {String(i + 1).padStart(2, "0")}
                      </span>
                      <button
                        className="icon-btn danger"
                        aria-label={`Quitar ${l.name}`}
                        onClick={() =>
                          update(
                            "lines",
                            q.lines.filter((x) => x.id !== l.id),
                          )
                        }
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <Field label="Nombre del concepto">
                      <input
                        value={l.name}
                        maxLength={180}
                        onChange={(e) =>
                          lineChange(l.id, "name", e.target.value)
                        }
                      />
                    </Field>
                    <Field label="Alcance y entregables *">
                      <textarea
                        value={l.scope}
                        maxLength={4000}
                        onChange={(e) =>
                          lineChange(l.id, "scope", e.target.value)
                        }
                      />
                    </Field>
                    <div className="form-grid three">
                      <Field label="Cálculo">
                        <select
                          value={l.mode}
                          onChange={(e) =>
                            lineChange(l.id, "mode", e.target.value)
                          }
                        >
                          <option value="hours">Por horas</option>
                          <option value="fixed">Importe fijo</option>
                        </select>
                      </Field>
                      {l.mode === "hours" ? (
                        <>
                          <NumberField
                            label="Horas por unidad"
                            value={l.minutes / 60}
                            step={0.25}
                            onChange={(v) =>
                              lineChange(
                                l.id,
                                "minutes",
                                Math.round((v ?? 0) * 60),
                              )
                            }
                          />
                          <NumberField
                            label="Tarifa / hora (USD)"
                            value={l.rateCents / 100}
                            step={0.01}
                            onChange={(v) =>
                              lineChange(
                                l.id,
                                "rateCents",
                                Math.round((v ?? 0) * 100),
                              )
                            }
                          />
                        </>
                      ) : (
                        <>
                          <NumberField
                            label="Precio por unidad (USD)"
                            value={l.fixedCents / 100}
                            step={0.01}
                            onChange={(v) =>
                              lineChange(
                                l.id,
                                "fixedCents",
                                Math.round((v ?? 0) * 100),
                              )
                            }
                          />
                          <NumberField
                            label="Horas internas estimadas"
                            value={l.minutes / 60}
                            step={0.25}
                            hint="No se suman al precio fijo."
                            onChange={(v) =>
                              lineChange(
                                l.id,
                                "minutes",
                                Math.round((v ?? 0) * 60),
                              )
                            }
                          />
                        </>
                      )}
                    </div>
                    <details>
                      <summary>
                        Periodicidad, descuentos y exclusiones{" "}
                        <ChevronDown size={16} />
                      </summary>
                      <div className="form-grid">
                        <Field label="Periodicidad">
                          <select
                            value={l.frequency}
                            onChange={(e) =>
                              lineChange(l.id, "frequency", e.target.value)
                            }
                          >
                            <option value="once">Pago único</option>
                            <option value="monthly">Mensual opcional</option>
                          </select>
                        </Field>
                        <Field label="¿A quién paga el cliente?">
                          <select
                            value={l.payer}
                            onChange={(e) =>
                              lineChange(l.id, "payer", e.target.value)
                            }
                          >
                            <option value="issuer">A mí</option>
                            <option value="third">
                              Directamente al proveedor
                            </option>
                          </select>
                        </Field>
                        <NumberField
                          label="Cantidad"
                          min={1}
                          max={1000}
                          value={l.quantity}
                          onChange={(v) => lineChange(l.id, "quantity", v ?? 1)}
                        />
                        <NumberField
                          label="Descuento (%)"
                          value={l.discountPercent}
                          max={100}
                          step={0.1}
                          onChange={(v) =>
                            lineChange(l.id, "discountPercent", v ?? 0)
                          }
                        />
                      </div>
                      <Field label="Exclusiones">
                        <textarea
                          value={l.exclusions}
                          maxLength={4000}
                          onChange={(e) =>
                            lineChange(l.id, "exclusions", e.target.value)
                          }
                        />
                      </Field>
                      <label className="check">
                        <input
                          type="checkbox"
                          checked={l.taxable}
                          onChange={(e) =>
                            lineChange(l.id, "taxable", e.target.checked)
                          }
                        />
                        Aplicar el impuesto de la propuesta a esta línea
                      </label>
                    </details>
                    <div className="line-total">
                      <span>
                        {l.payer === "third"
                          ? "Pago directo a tercero"
                          : "Inversión del servicio"}
                        {l.frequency === "monthly" ? " · mensual" : ""}
                      </span>
                      <strong>{money(priceLine(l, q.taxPercent).total)}</strong>
                    </div>
                  </article>
                ))}
                <button
                  className="btn"
                  disabled={q.lines.length >= 30}
                  onClick={() =>
                    update("lines", [
                      ...q.lines,
                      {
                        ...fromService(
                          {
                            id: "custom",
                            name: "Concepto adicional",
                            category: "Automatización",
                            scope: "",
                            exclusions: "",
                            minutes: 60,
                            mode: "fixed",
                            fixedCents: 0,
                            active: true,
                          },
                          settings.rateCents,
                        ),
                      },
                    ])
                  }
                >
                  <Plus size={16} />
                  Añadir concepto personalizado
                </button>
                {q.lines.some((l) => l.discountPercent > 0) && (
                  <Field label="Motivo del descuento *">
                    <input
                      maxLength={180}
                      value={q.discountReason}
                      onChange={(e) => update("discountReason", e.target.value)}
                    />
                  </Field>
                )}
              </>
            ) : step === 2 ? (
              <>
                <span className="eyebrow">03 / MÁS ALLÁ DEL PRECIO</span>
                <h2>¿Cuánto tiempo recupera el cliente?</h2>
                <p className="muted">
                  Demuestra el valor de la solución con supuestos claros.
                </p>
                <label className="toggle-card">
                  <div>
                    <strong>Incluir análisis de ahorro</strong>
                    <small>Opcional. También aparecerá en el PDF.</small>
                  </div>
                  <input
                    type="checkbox"
                    checked={q.impact.enabled}
                    onChange={(e) => updateImpact("enabled", e.target.checked)}
                  />
                </label>
                {q.impact.enabled ? (
                  <>
                    <div className="form-grid">
                      <NumberField
                        label="Casos / tareas al mes"
                        value={q.impact.volume}
                        hint="Volumen total del equipo, sin multiplicarlo por personas."
                        onChange={(v) => updateImpact("volume", v)}
                      />
                      <NumberField
                        label="Cobertura de la solución (%)"
                        value={q.impact.coverage}
                        max={100}
                        onChange={(v) => updateImpact("coverage", v ?? 0)}
                      />
                      <NumberField
                        label="Tiempo actual por caso"
                        value={q.impact.before}
                        suffix="min"
                        step={0.1}
                        onChange={(v) => updateImpact("before", v)}
                      />
                      <NumberField
                        label="Tiempo futuro por caso"
                        value={q.impact.after}
                        suffix="min"
                        step={0.1}
                        onChange={(v) => updateImpact("after", v)}
                      />
                      <NumberField
                        label="Supervisión adicional / mes"
                        value={q.impact.supervision}
                        suffix="h"
                        step={0.25}
                        onChange={(v) => updateImpact("supervision", v ?? 0)}
                      />
                      <NumberField
                        label="Costo por hora del equipo (USD)"
                        value={q.impact.clientRate}
                        step={0.01}
                        hint="Es el costo del cliente, no tu tarifa de USD 15."
                        onChange={(v) => updateImpact("clientRate", v)}
                      />
                    </div>
                    <details open>
                      <summary>
                        Costos y horizonte <ChevronDown size={16} />
                      </summary>
                      <div className="form-grid">
                        <NumberField
                          label="Puesta en marcha interna (USD)"
                          value={q.impact.internalInitialCents / 100}
                          step={0.01}
                          hint="Costo del cliente adicional a esta propuesta."
                          onChange={(v) =>
                            updateImpact(
                              "internalInitialCents",
                              Math.round((v ?? 0) * 100),
                            )
                          }
                        />
                        <NumberField
                          label="Otros costos mensuales (USD)"
                          value={q.impact.extraMonthlyCents / 100}
                          step={0.01}
                          hint="No repitas soporte o licencias ya añadidos como conceptos."
                          onChange={(v) =>
                            updateImpact(
                              "extraMonthlyCents",
                              Math.round((v ?? 0) * 100),
                            )
                          }
                        />
                        <NumberField
                          label="Horizonte de evaluación"
                          value={q.impact.months}
                          min={1}
                          max={60}
                          suffix="meses"
                          onChange={(v) => updateImpact("months", v ?? 12)}
                        />
                      </div>
                      <label className="check">
                        <input
                          type="checkbox"
                          checked={q.impact.costsConfirmed}
                          onChange={(e) =>
                            updateImpact("costsConfirmed", e.target.checked)
                          }
                        />
                        He incluido los costos conocidos de operación, APIs y
                        puesta en marcha.
                      </label>
                    </details>
                    {a ? (
                      <div className="impact-result">
                        <div>
                          <span>Horas netas recuperadas / mes</span>
                          <strong>
                            {decimal(a.hours)} <small>h</small>
                          </strong>
                        </div>
                        <p>
                          {a.hours < 0
                            ? "La solución requiere más tiempo bajo estos supuestos. Revisa el proceso antes de proponerla."
                            : "Tiempo que el equipo puede dedicar a otras tareas."}
                        </p>
                        <div className="impact-pair">
                          <div>
                            <small>Capacidad valorada / mes</small>
                            <b>
                              {a.value === null ? "Pendiente" : money(a.value)}
                            </b>
                          </div>
                          <div>
                            <small>
                              ROI de capacidad · {q.impact.months} meses
                            </small>
                            <b>
                              {a.roi === null
                                ? "Pendiente"
                                : `${decimal(a.roi)} %`}
                            </b>
                          </div>
                        </div>
                        <small>
                          El valor del tiempo no equivale a ahorro en efectivo.{" "}
                          {!a.complete
                            ? "Completa el costo del equipo y confirma costos e impuestos para calcular el ROI."
                            : a.payback === null
                              ? "No hay recuperación bajo estos supuestos."
                              : `Recuperación estimada: ${decimal(a.payback, 2)} meses de operación, sin rampa de adopción.`}
                        </small>
                      </div>
                    ) : (
                      <div className="alert">
                        Completa volumen y tiempos para ver las horas
                        recuperadas. Un campo vacío significa dato desconocido.
                      </div>
                    )}
                  </>
                ) : (
                  <div className="inline-empty">
                    <Clock3 size={28} />
                    <p>
                      Puedes cotizar sin estimar el retorno. Actívalo cuando
                      tengas datos del proceso.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                <span className="eyebrow">
                  04 / LISTA PARA EL SIGUIENTE PASO
                </span>
                <h2>Una propuesta clara de principio a fin</h2>
                <p className="muted">
                  Confirma tus condiciones y descarga una vista previa antes de
                  emitir.
                </p>
                <div className="form-grid">
                  <NumberField
                    label="Impuesto aplicable (%)"
                    value={q.taxPercent}
                    max={100}
                    step={0.01}
                    onChange={(v) => {
                      update("taxPercent", v ?? 0);
                      update("taxConfirmed", false);
                    }}
                  />
                  <NumberField
                    label="Vigencia"
                    value={q.validDays}
                    suffix="días"
                    min={1}
                    max={365}
                    onChange={(v) => update("validDays", v ?? 10)}
                  />
                </div>
                <label className="check">
                  <input
                    type="checkbox"
                    checked={q.taxConfirmed}
                    onChange={(e) => update("taxConfirmed", e.target.checked)}
                  />
                  Confirmo que el impuesto seleccionado aplica a esta propuesta,
                  incluido si es 0 %.
                </label>
                <Field
                  label="Cronograma y dependencias *"
                  hint="Las horas de trabajo no son días de calendario."
                >
                  <textarea
                    value={q.timeline}
                    rows={4}
                    placeholder="Ej. 2 semanas desde la entrega de accesos: diagnóstico, desarrollo, pruebas y capacitación."
                    maxLength={4000}
                    onChange={(e) => update("timeline", e.target.value)}
                  />
                </Field>
                <Field label="Condiciones de pago *">
                  <textarea
                    value={q.payment}
                    rows={4}
                    maxLength={4000}
                    onChange={(e) => update("payment", e.target.value)}
                  />
                </Field>
                <Field label="Notas para el cliente">
                  <textarea
                    value={q.notes}
                    maxLength={4000}
                    placeholder="Garantía, revisiones, soporte o indicaciones específicas."
                    onChange={(e) => update("notes", e.target.value)}
                  />
                </Field>
                <details>
                  <summary>
                    Presentación y notas internas <ChevronDown size={16} />
                  </summary>
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={q.showHours}
                      onChange={(e) => update("showHours", e.target.checked)}
                    />
                    Mostrar horas y tarifa en la proforma
                  </label>
                  <Field label="Notas privadas (no aparecen en el PDF)">
                    <textarea
                      value={q.internalNotes}
                      maxLength={4000}
                      onChange={(e) => update("internalNotes", e.target.value)}
                    />
                  </Field>
                </details>
                <div className="review-card">
                  <h3>Antes de emitir</h3>
                  {errors.length ? (
                    <ul>
                      {errors.map((e) => (
                        <li key={e}>{e}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="success-text">
                      <Check size={18} />
                      Los datos necesarios están completos.
                    </p>
                  )}
                  <p className="fine">
                    Emisor: {settings.name} ·{" "}
                    {settings.email ||
                      settings.phone ||
                      "Configura tu contacto"}
                    . Cada emisión conserva una copia inmutable del documento.
                  </p>
                </div>
                <div className="button-row">
                  <button className="btn" onClick={preview}>
                    <Eye size={16} />
                    Vista previa PDF
                  </button>
                  <button
                    className="btn primary"
                    disabled={errors.length > 0}
                    onClick={() =>
                      action(async () => {
                        const result = await api(
                          `quotes/${record.id}/issue`,
                          "POST",
                          { revision: revision.current },
                        );
                        setIssue(result.id);
                        setState("Emitida");
                        onNotice(
                          `${result.folio} emitida. Ya puedes descargar y compartir el PDF.`,
                        );
                      })
                    }
                  >
                    <Check size={17} />
                    Emitir proforma
                  </button>
                </div>
                {issue && (
                  <div className="issued-card">
                    <span className="icon-tile">
                      <Check size={22} />
                    </span>
                    <h3>Tu proforma está lista</h3>
                    <p>Descárgala y compártela con tu cliente.</p>
                    <a className="btn dark" href={`/api/issues/${issue}/pdf`}>
                      <FileDown size={18} />
                      Descargar PDF
                    </a>
                    <Field label="Seguimiento comercial (actualización manual)">
                      <select
                        value={state}
                        onChange={(e) => {
                          const next = e.target.value;
                          action(async () => {
                            await api(`quotes/${record.id}/state`, "POST", {
                              state: next,
                            });
                            setState(next);
                            onNotice(
                              "Estado actualizado. No se ha enviado ningún mensaje al cliente.",
                            );
                          });
                        }}
                      >
                        {["Emitida", "Compartida", "Aceptada", "Rechazada"].map(
                          (s) => (
                            <option key={s}>{s}</option>
                          ),
                        )}
                      </select>
                    </Field>
                    <small>
                      Descargar no equivale a enviar ni a registrar una
                      aceptación.
                    </small>
                  </div>
                )}
                <button
                  className="text-link history-toggle"
                  onClick={() =>
                    action(async () => {
                      setHistory(await api(`quotes/${record.id}/history`));
                      setShowHistory(!showHistory);
                    })
                  }
                >
                  <History size={16} />
                  Historial de documentos emitidos
                </button>
                {showHistory && (
                  <div className="history">
                    {history.length ? (
                      history.map((h) => (
                        <a key={h.id} href={`/api/issues/${h.id}/pdf`}>
                          <span>
                            {h.folio}
                            <small>
                              {new Date(h.date).toLocaleDateString("es-EC")} ·
                              revisión {h.revision}
                            </small>
                          </span>
                          <FileDown size={17} />
                        </a>
                      ))
                    ) : (
                      <p>No has emitido una versión todavía.</p>
                    )}
                  </div>
                )}
              </>
            )}
            <div className="step-actions">
              <button
                className="btn"
                disabled={step === 0}
                onClick={() => setStep(step - 1)}
              >
                <ArrowLeft size={16} />
                Anterior
              </button>
              {step < 3 ? (
                <button className="btn dark" onClick={() => setStep(step + 1)}>
                  Continuar
                  <ArrowRight size={17} />
                </button>
              ) : (
                <button
                  className="btn"
                  onClick={() =>
                    action(async () => onNotice("Borrador guardado."))
                  }
                >
                  <Check size={16} />
                  Guardar cambios
                </button>
              )}
            </div>
          </fieldset>
        </section>
        <aside className="summary-column">
          <section className="quote-summary">
            <span className="eyebrow">TU PROPUESTA, EN UN VISTAZO</span>
            <div className="summary-symbol">↗</div>
            <h2>
              Una inversión.
              <br />
              Nuevas posibilidades.
            </h2>
            <span className="summary-label">Implementación · pago único</span>
            <strong className="summary-price">{money(t.once)}</strong>
            <span className="summary-client">
              {q.client || "Para tu próximo cliente"}
            </span>
            <div className="summary-lines">
              <div>
                <span>Servicios</span>
                <b>{q.lines.filter((l) => l.payer === "issuer").length}</b>
              </div>
              <div>
                <span>Esfuerzo inicial estimado</span>
                <b>{decimal(t.hours, 2)} h</b>
              </div>
              {t.discount > 0 && (
                <div>
                  <span>Descuento inicial</span>
                  <b>−{money(t.discount)}</b>
                </div>
              )}
              <div>
                <span>Impuestos</span>
                <b>{q.taxConfirmed ? money(t.tax) : "Por confirmar"}</b>
              </div>
            </div>
            <div className="summary-monthly">
              <span>Mantenimiento / recurrentes</span>
              <strong>
                {money(t.monthly)} <small>/ mes</small>
              </strong>
            </div>
            {(t.thirdOnce > 0 || t.thirdMonthly > 0) && (
              <div className="summary-third">
                <span>Pagos directos a terceros</span>
                <p>
                  {money(t.thirdOnce)} iniciales
                  <br />
                  {money(t.thirdMonthly)} / mes
                </p>
              </div>
            )}
            <p className="summary-foot">
              El alcance, la inversión y los costos recurrentes se presentan por
              separado.
            </p>
          </section>
          <section className="mini-tip">
            <span className="icon-tile">
              <ArrowUpRight size={19} />
            </span>
            <div>
              <strong>El valor está en el resultado.</strong>
              <p>
                Describe qué cambia para el cliente, además de la tecnología que
                usarás.
              </p>
            </div>
          </section>
          {saving.includes("pudo") && (
            <button className="btn" onClick={() => action(async () => {})}>
              Reintentar guardado
            </button>
          )}
        </aside>
      </div>
    </>
  );
}
