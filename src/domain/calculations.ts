import type { Line, Quote } from "./schema";
export const money = (cents: number) =>
  new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" }).format(
    cents / 100,
  );
export const decimal = (n: number, digits = 1) =>
  new Intl.NumberFormat("es-EC", { maximumFractionDigits: digits }).format(n);
export function priceLine(line: Line, taxPercent: number) {
  const base =
    line.mode === "hours"
      ? Math.round((line.minutes * line.rateCents * line.quantity) / 60)
      : line.fixedCents * line.quantity;
  const discount = Math.round((base * line.discountPercent) / 100);
  const net = base - discount;
  const tax = line.taxable ? Math.round((net * taxPercent) / 100) : 0;
  return { base, discount, net, tax, total: net + tax };
}
export function totals(q: Quote) {
  const result = {
    once: 0,
    monthly: 0,
    thirdOnce: 0,
    thirdMonthly: 0,
    subtotal: 0,
    discount: 0,
    tax: 0,
    hours: 0,
  };
  for (const l of q.lines) {
    const p = priceLine(l, q.taxPercent);
    const key =
      l.payer === "third"
        ? l.frequency === "once"
          ? "thirdOnce"
          : "thirdMonthly"
        : l.frequency === "once"
          ? "once"
          : "monthly";
    result[key] += p.total;
    if (l.payer === "issuer" && l.frequency === "once") {
      result.subtotal += p.base;
      result.discount += p.discount;
      result.tax += p.tax;
      result.hours += (l.minutes * l.quantity) / 60;
    }
  }
  return result;
}
export function impact(q: Quote) {
  const i = q.impact,
    t = totals(q);
  if (!i.enabled || i.volume === null || i.before === null || i.after === null)
    return null;
  const hours =
    (((i.volume * i.coverage) / 100) * (i.before - i.after)) / 60 -
    i.supervision;
  const investment = t.once + t.thirdOnce + i.internalInitialCents;
  const monthly = t.monthly + t.thirdMonthly + i.extraMonthlyCents;
  const complete = i.costsConfirmed && q.taxConfirmed && i.clientRate !== null;
  const value =
    i.clientRate === null ? null : Math.round(hours * i.clientRate * 100);
  const net = value === null ? null : value - monthly;
  const totalCost = investment + monthly * i.months;
  const totalBenefit = value === null ? null : value * i.months;
  const roi =
    complete && totalBenefit !== null && totalCost > 0
      ? ((totalBenefit - totalCost) / totalCost) * 100
      : null;
  const payback = complete && net !== null && net > 0 ? investment / net : null;
  return {
    hours,
    investment,
    monthly,
    value,
    net,
    totalCost,
    totalBenefit,
    roi,
    payback,
    complete,
  };
}
export function issuanceErrors(
  q: Quote,
  issuer: { name: string; email: string; phone: string },
) {
  const errors: string[] = [];
  if (!q.client.trim() || !q.contact.trim())
    errors.push("Completa la empresa y el contacto del cliente.");
  if (!q.title.trim() || !q.problem.trim() || !q.outcome.trim())
    errors.push("Describe el proyecto, la necesidad y el resultado esperado.");
  if (!q.lines.length || !q.lines.some((l) => l.payer === "issuer"))
    errors.push("Añade al menos un servicio propio.");
  if (q.lines.some((l) => !l.scope.trim()))
    errors.push("Define el alcance de cada concepto.");
  if (!q.taxConfirmed)
    errors.push(
      "Confirma el tratamiento de impuestos; 0 % también requiere confirmación.",
    );
  if (q.lines.some((l) => l.discountPercent > 0) && !q.discountReason.trim())
    errors.push("Indica el motivo del descuento.");
  if (!q.timeline.trim() || !q.payment.trim())
    errors.push("Completa el cronograma y las condiciones de pago.");
  if (!issuer.name.trim() || (!issuer.email.trim() && !issuer.phone.trim()))
    errors.push("Configura tu nombre y al menos un medio de contacto.");
  return errors;
}
