import { z } from "zod";
const text = z.string().trim().max(4000);
const short = z.string().trim().max(180);
const cents = z.number().int().min(0).max(100_000_000);
const number = z.number().finite().min(0).max(10_000_000);
export const serviceSchema = z.object({
  id: short.min(1),
  name: short.min(1),
  category: z.enum([
    "Diagnóstico",
    "Automatización",
    "Apps Script",
    "RPA",
    "Agente de IA",
    "Capacitación",
    "Soporte",
  ]),
  scope: text,
  exclusions: text,
  minutes: z.number().int().min(0).max(600000),
  mode: z.enum(["hours", "fixed"]),
  fixedCents: cents,
  active: z.boolean(),
});
export type Service = z.infer<typeof serviceSchema>;
export const settingsSchema = z.object({
  name: short.min(1),
  tagline: short,
  email: z.union([z.literal(""), z.email()]),
  phone: short,
  address: short,
  taxId: short,
  rateCents: cents.min(1),
  validDays: z.number().int().min(1).max(365),
  payment: text,
  logo: z
    .string()
    .max(200000)
    .refine(
      (v) =>
        v === "" || /^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(v),
      "Usa un logo PNG o JPG de menos de 140 KB.",
    ),
});
export type Settings = z.infer<typeof settingsSchema>;
export const lineSchema = z
  .object({
    id: short.min(1),
    name: short.min(1),
    scope: text,
    exclusions: text,
    mode: z.enum(["hours", "fixed"]),
    minutes: z.number().int().min(0).max(600000),
    rateCents: cents,
    fixedCents: cents,
    quantity: z.number().int().min(1).max(1000),
    frequency: z.enum(["once", "monthly"]),
    payer: z.enum(["issuer", "third"]),
    discountPercent: z.number().min(0).max(100).multipleOf(0.01),
    taxable: z.boolean(),
  })
  .refine(
    (l) =>
      (l.mode === "hours"
        ? (l.minutes * l.rateCents * l.quantity) / 60
        : l.fixedCents * l.quantity) <= 100_000_000_000,
    "El importe del concepto excede el límite admitido.",
  );
export type Line = z.infer<typeof lineSchema>;
export const impactSchema = z
  .object({
    enabled: z.boolean(),
    volume: number.nullable(),
    before: z.number().min(0).max(44640).nullable(),
    after: z.number().min(0).max(44640).nullable(),
    coverage: z.number().min(0).max(100),
    supervision: number,
    clientRate: z.number().min(0).max(10000).nullable(),
    internalInitialCents: cents,
    extraMonthlyCents: cents,
    costsConfirmed: z.boolean(),
    months: z.number().int().min(1).max(60),
  })
  .refine(
    (i) =>
      i.volume === null ||
      i.before === null ||
      i.after === null ||
      i.clientRate === null ||
      Math.abs(
        ((((i.volume * i.coverage) / 100) * (i.before - i.after)) / 60 -
          i.supervision) *
          i.clientRate *
          100 *
          i.months,
      ) <= 100_000_000_000_000,
    "El escenario excede el límite numérico. Revisa volumen, tiempos y costo por hora.",
  );
export const quoteSchema = z.object({
  title: short,
  client: short,
  contact: short,
  email: z.union([z.literal(""), z.email()]),
  taxId: short,
  address: short,
  problem: text,
  outcome: text,
  lines: z.array(lineSchema).max(30),
  taxPercent: z.number().min(0).max(100).multipleOf(0.01),
  taxConfirmed: z.boolean(),
  discountReason: short,
  validDays: z.number().int().min(1).max(365),
  timeline: text,
  payment: text,
  notes: text,
  internalNotes: text,
  showHours: z.boolean(),
  impact: impactSchema,
  requestId: short.optional(),
});
export type Quote = z.infer<typeof quoteSchema>;
export const requestSchema = z.object({
  key: z.uuid(),
  name: short.min(2),
  company: short.min(2),
  email: z.email().max(180),
  phone: short,
  need: text.min(15),
  outcome: text,
  tools: short,
  volume: number.nullable(),
  minutes: number.nullable(),
  people: z.number().int().min(1).max(100000).nullable(),
  budget: short,
  deadline: short,
  category: short,
  details: text,
  consent: z.literal(true),
  website: z.string().max(200).optional(),
});
export type Intake = z.infer<typeof requestSchema>;
export type QuoteRecord = {
  id: string;
  data: Quote;
  revision: number;
  state: string;
  createdAt: string;
  updatedAt: string;
  folio?: string;
  issueId?: number;
};
export type Issued = {
  id: number;
  quoteId: string;
  folio: string;
  createdAt: string;
  revision: number;
  data: Quote;
  issuer: Settings;
};
export const defaults: Settings = {
  name: "Melany Brito",
  tagline: "Automatización & soluciones digitales",
  email: "",
  phone: "",
  address: "",
  taxId: "",
  rateCents: 1500,
  validDays: 10,
  payment:
    "50 % al inicio y 50 % contra entrega. El trabajo comienza después de confirmar el alcance y recibir los accesos necesarios.",
  logo: "",
};
export const catalog: Service[] = [
  [
    "diagnostico",
    "Diagnóstico de procesos",
    "Diagnóstico",
    240,
    "Revisión de un proceso, identificación de oportunidades y hoja de ruta de implementación.",
    "No incluye desarrollo ni implementación.",
  ],
  [
    "automation",
    "Automatización de flujos",
    "Automatización",
    480,
    "Conexión de herramientas y automatización de una tarea repetitiva. Definir integraciones, reglas y pruebas.",
    "Licencias y consumo de plataformas se cotizan por separado.",
  ],
  [
    "script",
    "Desarrollo en Apps Script",
    "Apps Script",
    720,
    "Automatización de un flujo en Google Workspace. Definir archivos, permisos, funciones y disparadores.",
    "No incluye procesos adicionales al alcance acordado.",
  ],
  [
    "rpa",
    "Automatización RPA",
    "RPA",
    1200,
    "Automatización de una secuencia de tareas en interfaces. Definir pasos, aplicaciones y excepciones.",
    "Cambios posteriores en las interfaces requieren evaluación.",
  ],
  [
    "agent",
    "Agente de IA",
    "Agente de IA",
    1800,
    "Configuración de un agente con fuentes de información, pruebas y derivación humana. Definir canal y herramientas.",
    "No incluye consumo de modelos, mensajería ni atención humana.",
  ],
  [
    "training",
    "Capacitación del equipo",
    "Capacitación",
    120,
    "Sesión práctica y guía de uso para el equipo.",
    "Soporte continuo se contrata por separado.",
  ],
].map(([id, name, category, minutes, scope, exclusions]) => ({
  id,
  name,
  category,
  minutes,
  scope,
  exclusions,
  mode: "hours",
  fixedCents: 0,
  active: true,
})) as Service[];
export function newQuote(settings: Settings): Quote {
  return {
    title: "",
    client: "",
    contact: "",
    email: "",
    taxId: "",
    address: "",
    problem: "",
    outcome: "",
    lines: [],
    taxPercent: 0,
    taxConfirmed: false,
    discountReason: "",
    validDays: settings.validDays,
    timeline: "",
    payment: settings.payment,
    notes: "",
    internalNotes: "",
    showHours: false,
    impact: {
      enabled: false,
      volume: null,
      before: null,
      after: null,
      coverage: 100,
      supervision: 0,
      clientRate: null,
      internalInitialCents: 0,
      extraMonthlyCents: 0,
      costsConfirmed: false,
      months: 12,
    },
  };
}
export function fromService(service: Service, rateCents: number): Line {
  return {
    id: crypto.randomUUID(),
    name: service.name,
    scope: service.scope,
    exclusions: service.exclusions,
    mode: service.mode,
    minutes: service.minutes,
    rateCents,
    fixedCents: service.fixedCents,
    quantity: 1,
    frequency: "once",
    payer: "issuer",
    discountPercent: 0,
    taxable: true,
  };
}
