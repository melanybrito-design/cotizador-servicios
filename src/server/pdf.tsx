import React from "react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import path from "node:path";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  renderToBuffer,
  Font,
} from "@react-pdf/renderer";
import type { Quote, Settings } from "@/domain/schema";
import {
  money,
  decimal,
  totals,
  priceLine,
  impact,
} from "@/domain/calculations";
Font.register({
  family: "DM Sans",
  fonts: [
    {
      src: path.join(process.cwd(), "public/fonts/dm-sans-400.woff"),
      fontWeight: 400,
    },
    {
      src: path.join(process.cwd(), "public/fonts/dm-sans-700.woff"),
      fontWeight: 700,
    },
  ],
});
Font.registerHyphenationCallback((word) =>
  word.length > 28 ? word.match(/.{1,20}/g) || [word] : [word],
);
const s = StyleSheet.create({
  page: {
    padding: 44,
    paddingBottom: 65,
    fontFamily: "DM Sans",
    fontSize: 10,
    color: "#222830",
    lineHeight: 1.5,
  },
  brand: {
    fontSize: 19,
    fontFamily: "DM Sans",
    fontWeight: 700,
    lineHeight: 1.25,
  },
  small: { fontSize: 8, color: "#626a70" },
  muted: { color: "#626a70" },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 20 },
  title: {
    fontSize: 30,
    fontFamily: "DM Sans",
    fontWeight: 700,
    lineHeight: 1.25,
    marginTop: 30,
    marginBottom: 8,
    letterSpacing: -1,
  },
  rule: { height: 4, backgroundColor: "#ddf77b", marginVertical: 18 },
  section: {
    fontSize: 12,
    fontFamily: "DM Sans",
    fontWeight: 700,
    lineHeight: 1.25,
    marginTop: 20,
    marginBottom: 8,
  },
  box: {
    backgroundColor: "#f3f5f0",
    padding: 16,
    borderRadius: 8,
    marginTop: 12,
  },
  label: {
    fontSize: 8,
    color: "#626a70",
    marginBottom: 5,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  line: { borderBottomWidth: 1, borderColor: "#e3e6df", paddingVertical: 12 },
  lineTitle: {
    fontFamily: "DM Sans",
    fontWeight: 700,
    lineHeight: 1.25,
    fontSize: 11,
  },
  total: {
    fontSize: 26,
    fontFamily: "DM Sans",
    fontWeight: 700,
    lineHeight: 1.25,
  },
  footer: {
    position: "absolute",
    bottom: 28,
    height: 22,
    lineHeight: 1.3,
    left: 44,
    right: 44,
    borderTopWidth: 1,
    borderColor: "#e3e6df",
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: "#626a70",
  },
  metric: {
    width: "31%",
    padding: 12,
    backgroundColor: "#f3f5f0",
    borderRadius: 8,
  },
  value: {
    fontSize: 21,
    fontFamily: "DM Sans",
    fontWeight: 700,
    lineHeight: 1.25,
    marginVertical: 6,
  },
  bar: { height: 12, borderRadius: 5, marginTop: 5 },
  logo: { width: 55, height: 45, objectFit: "contain" },
});
const date = (iso: string) =>
  new Intl.DateTimeFormat("es-EC", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "America/Guayaquil",
  }).format(new Date(iso));
export async function generatePdf(
  q: Quote,
  issuer: Settings,
  folio: string,
  issuedAt: string,
  draft: boolean,
) {
  const t = totals(q),
    a = impact(q),
    expiry = new Date(
      new Date(issuedAt).getTime() + q.validDays * 86400000,
    ).toISOString();
  const groups = [
    {
      name: "Implementación · pago único",
      items: q.lines.filter(
        (l) => l.frequency === "once" && l.payer === "issuer",
      ),
    },
    {
      name: "Servicios mensuales · contratación separada",
      items: q.lines.filter(
        (l) => l.frequency === "monthly" && l.payer === "issuer",
      ),
    },
    {
      name: "Terceros · pago directo al proveedor",
      items: q.lines.filter((l) => l.payer === "third"),
    },
  ];
  const buffer = await renderToBuffer(
    <Document
      title={`${folio} · ${q.title || "Propuesta de servicios"}`}
      author={issuer.name}
      subject="Proforma de servicios de automatización"
    >
      <Page size="A4" style={s.page} wrap>
        <View style={s.row}>
          <View style={{ maxWidth: "70%" }}>
            <Text style={s.brand}>{issuer.name}</Text>
            <Text style={s.small}>{issuer.tagline}</Text>
            <Text style={s.small}>
              {[issuer.email, issuer.phone].filter(Boolean).join(" · ")}
            </Text>
            {issuer.taxId && (
              <Text style={s.small}>Identificación: {issuer.taxId}</Text>
            )}
            {issuer.address && <Text style={s.small}>{issuer.address}</Text>}
          </View>
          {issuer.logo ? (
            <Image src={issuer.logo} style={s.logo} />
          ) : (
            <View
              style={{
                backgroundColor: "#ddf77b",
                padding: 10,
                borderRadius: 9,
              }}
            >
              <Text
                style={{
                  fontSize: 17,
                  fontFamily: "DM Sans",
                  fontWeight: 700,
                  lineHeight: 1.25,
                }}
              >
                MB.
              </Text>
            </View>
          )}
        </View>
        <Text style={s.title}>
          {draft ? "Borrador de propuesta" : "Proforma de servicios"}
        </Text>
        <View style={s.row}>
          <Text style={s.small}>{folio} · USD</Text>
          <Text style={s.small}>
            Emisión: {date(issuedAt)} · Válida hasta: {date(expiry)}
          </Text>
        </View>
        <View style={s.rule} />
        {draft && (
          <Text style={{ ...s.small, marginBottom: 12 }}>
            VISTA PREVIA. Pendiente de revisión y emisión. No constituye una
            proforma definitiva.
          </Text>
        )}
        <View style={s.row}>
          <View style={{ width: "48%" }}>
            <Text style={s.label}>Preparada para</Text>
            <Text style={s.lineTitle}>{q.client || "Cliente por definir"}</Text>
            <Text>{q.contact}</Text>
            <Text style={s.small}>{q.email}</Text>
            {q.taxId && <Text style={s.small}>Identificación: {q.taxId}</Text>}
            {q.address && <Text style={s.small}>{q.address}</Text>}
          </View>
          <View style={{ width: "48%" }}>
            <Text style={s.label}>Proyecto</Text>
            <Text style={s.lineTitle}>{q.title || "Proyecto por definir"}</Text>
          </View>
        </View>
        <Text style={s.section} minPresenceAhead={50}>
          Tu reto, nuestra propuesta
        </Text>
        <Text>{q.problem || "Necesidad pendiente de definir."}</Text>
        <View style={s.box}>
          <Text style={s.label}>Resultado esperado</Text>
          <Text>{q.outcome || "Resultado pendiente de definir."}</Text>
        </View>
        {groups.map(
          (group) =>
            group.items.length > 0 && (
              <View key={group.name}>
                <Text style={s.section} minPresenceAhead={75}>
                  {group.name}
                </Text>
                {group.items.map((line) => {
                  const p = priceLine(line, q.taxPercent);
                  return (
                    <View key={line.id} style={s.line}>
                      <View style={s.row} minPresenceAhead={35}>
                        <Text style={{ ...s.lineTitle, width: "70%" }}>
                          {line.name}
                        </Text>
                        <Text style={s.lineTitle}>
                          {money(p.total)}
                          {line.frequency === "monthly" ? " / mes" : ""}
                        </Text>
                      </View>
                      <Text style={{ marginTop: 6 }}>{line.scope}</Text>
                      <Text style={s.small}>
                        Cantidad: {line.quantity}
                        {q.showHours && line.mode === "hours"
                          ? ` · ${decimal(line.minutes / 60, 2)} h/unidad × ${money(line.rateCents)}/h`
                          : ""}
                        {line.discountPercent
                          ? ` · Descuento: ${decimal(line.discountPercent)} %`
                          : ""}{" "}
                        ·{" "}
                        {line.taxable
                          ? `Impuesto ${decimal(q.taxPercent)} %: ${money(p.tax)}`
                          : "Sin impuesto aplicado"}
                        {!q.taxConfirmed ? " (pendiente de confirmar)" : ""}
                      </Text>
                      {line.exclusions && (
                        <Text style={s.small}>
                          Fuera del alcance: {line.exclusions}
                        </Text>
                      )}
                    </View>
                  );
                })}
              </View>
            ),
        )}
        <View style={s.box} wrap={false}>
          <View style={s.row}>
            <Text>Subtotal de implementación</Text>
            <Text>{money(t.subtotal)}</Text>
          </View>
          {t.discount > 0 && (
            <View style={s.row}>
              <Text>Descuento</Text>
              <Text>-{money(t.discount)}</Text>
            </View>
          )}
          <View style={s.row}>
            <Text>
              Impuestos {q.taxConfirmed ? "confirmados" : "por confirmar"}
            </Text>
            <Text>{money(t.tax)}</Text>
          </View>
          <View style={{ ...s.row, marginTop: 12 }}>
            <View>
              <Text style={s.label}>Pago único a {issuer.name}</Text>
              <Text style={s.total}>{money(t.once)}</Text>
            </View>
            <View>
              <Text style={s.label}>Mensualidad opcional</Text>
              <Text style={{ fontSize: 18 }}>{money(t.monthly)} / mes</Text>
            </View>
          </View>
          {(t.thirdOnce > 0 || t.thirdMonthly > 0) && (
            <Text style={{ ...s.small, marginTop: 12 }}>
              Terceros, fuera del pago a {issuer.name}: {money(t.thirdOnce)}{" "}
              iniciales + {money(t.thirdMonthly)} / mes.
            </Text>
          )}
        </View>
        {a && (
          <View>
            <Text style={s.section} break>
              El valor de recuperar tiempo
            </Text>
            <View style={s.row} wrap={false}>
              <View style={s.metric}>
                <Text style={s.label}>Horas netas / mes</Text>
                <Text style={s.value}>{decimal(a.hours)}</Text>
                <Text style={s.small}>Capacidad recuperada</Text>
              </View>
              <View style={s.metric}>
                <Text style={s.label}>ROI de capacidad</Text>
                <Text style={s.value}>
                  {a.roi === null ? "Pendiente" : `${decimal(a.roi)} %`}
                </Text>
                <Text style={s.small}>En {q.impact.months} meses</Text>
              </View>
              <View style={s.metric}>
                <Text style={s.label}>Recuperación</Text>
                <Text style={s.value}>
                  {a.payback === null ? "—" : decimal(a.payback, 2)}
                </Text>
                <Text style={s.small}>
                  {a.payback === null
                    ? "No calculable con estos supuestos"
                    : "Meses de operación"}
                </Text>
              </View>
            </View>
            {a.complete && a.totalBenefit !== null && (
              <View style={{ marginTop: 14 }} wrap={false}>
                <Text>
                  Costo considerado en {q.impact.months} meses:{" "}
                  {money(a.totalCost)}
                </Text>
                <View
                  style={{
                    ...s.bar,
                    backgroundColor: "#bec5ce",
                    width: `${Math.max(2, (100 * a.totalCost) / Math.max(a.totalCost, Math.abs(a.totalBenefit), 1))}%`,
                  }}
                />
                <Text style={{ marginTop: 8 }}>
                  Capacidad valorada en {q.impact.months} meses:{" "}
                  {money(a.totalBenefit)}
                </Text>
                <View
                  style={{
                    ...s.bar,
                    backgroundColor: "#b8d34f",
                    width: `${Math.max(2, (100 * Math.max(0, a.totalBenefit)) / Math.max(a.totalCost, Math.abs(a.totalBenefit), 1))}%`,
                  }}
                />
              </View>
            )}
            <Text style={{ ...s.small, marginTop: 12 }}>
              Supuestos: {q.impact.volume} casos al mes (volumen total del
              equipo), de {q.impact.before} a {q.impact.after} min/caso,
              cobertura {q.impact.coverage} %, supervisión adicional{" "}
              {q.impact.supervision} h/mes. Costo del equipo:{" "}
              {q.impact.clientRate === null
                ? "no indicado"
                : `${money(Math.round(q.impact.clientRate * 100))}/h`}
              . Inversión considerada: {money(a.investment)}. Recurrentes
              considerados: {money(a.monthly)}/mes.
            </Text>
            <Text style={{ ...s.small, marginTop: 5 }}>
              Estimación de capacidad, no ahorro en efectivo ni ingresos
              garantizados. Incluye los impuestos aplicados en esta propuesta y
              costos adicionales declarados. Supone operación estable, sin rampa
              de adopción.{" "}
              {a.complete
                ? ""
                : "Faltan costos o confirmaciones; no se presenta un ROI definitivo."}
            </Text>
          </View>
        )}
        <Text style={s.section} minPresenceAhead={40}>
          Cronograma y dependencias
        </Text>
        <Text>{q.timeline || "Por acordar."}</Text>
        <Text style={s.section} minPresenceAhead={40}>
          Condiciones comerciales
        </Text>
        <Text>{q.payment || "Por acordar."}</Text>
        <Text style={{ marginTop: 8 }}>
          Vigencia: {q.validDays} días. Los cambios de alcance se evalúan y
          cotizan antes de implementarse. Los servicios mensuales y pagos
          directos a terceros se muestran por separado.
        </Text>
        {q.notes && (
          <>
            <Text style={s.section} minPresenceAhead={40}>
              Información adicional
            </Text>
            <Text>{q.notes}</Text>
          </>
        )}
        <View style={{ ...s.box, padding: 12 }} wrap={false}>
          <Text style={s.lineTitle}>¿Avanzamos con tu proyecto?</Text>
          <Text>
            Confirma el alcance y las condiciones con {issuer.name}
            {issuer.email
              ? ` en ${issuer.email}`
              : issuer.phone
                ? ` al ${issuer.phone}`
                : ""}{" "}
            para coordinar el inicio.
          </Text>
          <Text style={s.small}>
            Documento comercial de propuesta. No acredita pago ni constituye una
            firma electrónica.
          </Text>
        </View>
      </Page>
    </Document>,
  );
  const document = await PDFDocument.load(buffer);
  const font = await document.embedFont(StandardFonts.Helvetica);
  const pages = document.getPages();
  pages.forEach((page, index) => {
    const width = page.getWidth();
    page.drawLine({
      start: { x: 44, y: 43 },
      end: { x: width - 44, y: 43 },
      thickness: 0.5,
      color: rgb(0.87, 0.89, 0.85),
    });
    page.drawText(folio, {
      x: 44,
      y: 29,
      size: 8,
      font,
      color: rgb(0.38, 0.42, 0.38),
    });
    const label = `${index + 1} / ${pages.length}`;
    page.drawText(label, {
      x: width - 44 - font.widthOfTextAtSize(label, 8),
      y: 29,
      size: 8,
      font,
      color: rgb(0.38, 0.42, 0.38),
    });
  });
  return Buffer.from(await document.save());
}
