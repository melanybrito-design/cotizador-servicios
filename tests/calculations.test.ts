import { test } from "node:test";
import assert from "node:assert/strict";
import {
  defaults,
  newQuote,
  fromService,
  catalog,
  quoteSchema,
  requestSchema,
} from "../src/domain/schema";
import {
  priceLine,
  totals,
  impact,
  issuanceErrors,
} from "../src/domain/calculations";
function fixture() {
  const q = newQuote(defaults);
  q.lines = [{ ...fromService(catalog[3], 1500), minutes: 1200 }];
  q.taxConfirmed = true;
  return q;
}
test("20 hours at USD 15 = USD 300, rounded in cents", () => {
  assert.equal(totals(fixture()).once, 30000);
});
test("fixed services do not charge internal hours again", () => {
  const q = fixture();
  q.lines[0].mode = "fixed";
  q.lines[0].fixedCents = 25000;
  assert.equal(totals(q).once, 25000);
});
test("fractional hours, quantity, discount and line tax applied once", () => {
  const l = {
    ...fixture().lines[0],
    minutes: 25,
    quantity: 3,
    discountPercent: 10,
  };
  assert.deepEqual(priceLine(l, 15), {
    base: 1875,
    discount: 188,
    net: 1687,
    tax: 253,
    total: 1940,
  });
});
test("third parties and monthly payments are separate", () => {
  const q = fixture();
  q.lines.push(
    {
      ...q.lines[0],
      id: "monthly",
      frequency: "monthly",
      mode: "fixed",
      fixedCents: 4000,
    },
    {
      ...q.lines[0],
      id: "third",
      payer: "third",
      mode: "fixed",
      fixedCents: 1000,
    },
  );
  assert.deepEqual(totals(q), {
    once: 30000,
    monthly: 4000,
    thirdOnce: 1000,
    thirdMonthly: 0,
    subtotal: 30000,
    discount: 0,
    tax: 0,
    hours: 20,
  });
});
test("reference ROI scenario is reproducible", () => {
  const q = fixture();
  q.impact = {
    ...q.impact,
    enabled: true,
    volume: 200,
    before: 15,
    after: 3,
    clientRate: 8,
    extraMonthlyCents: 4000,
    costsConfirmed: true,
  };
  const a = impact(q)!;
  assert.equal(a.hours, 40);
  assert.equal(a.value, 32000);
  assert.equal(a.totalCost, 78000);
  assert.equal(a.totalBenefit, 384000);
  assert.ok(Math.abs(a.roi! - 392.3076923) < 0.00001);
  assert.ok(Math.abs(a.payback! - 1.07142857) < 0.00001);
});
test("unknown data is not zero; missing costs suppress ROI", () => {
  const q = fixture();
  q.impact.enabled = true;
  assert.equal(impact(q), null);
  q.impact.volume = 200;
  q.impact.before = 15;
  q.impact.after = 3;
  assert.equal(impact(q)!.hours, 40);
  assert.equal(impact(q)!.value, null);
  q.impact.clientRate = 8;
  assert.equal(impact(q)!.roi, null);
  q.impact.costsConfirmed = true;
  q.taxConfirmed = false;
  assert.equal(impact(q)!.roi, null);
});
test("negative savings stay negative and do not promise payback", () => {
  const q = fixture();
  q.impact = {
    ...q.impact,
    enabled: true,
    volume: 200,
    before: 3,
    after: 15,
    clientRate: 8,
    costsConfirmed: true,
  };
  const a = impact(q)!;
  assert.equal(a.hours, -40);
  assert.equal(a.payback, null);
  assert.ok(a.roi! < 0);
});
test("zero denominator never produces infinity", () => {
  const q = fixture();
  q.lines = [];
  q.impact = {
    ...q.impact,
    enabled: true,
    volume: 0,
    before: 0,
    after: 0,
    clientRate: 0,
    costsConfirmed: true,
  };
  assert.equal(impact(q)!.roi, null);
  assert.equal(impact(q)!.payback, null);
});
test("coverage and supervision applied once", () => {
  const q = fixture();
  q.impact = {
    ...q.impact,
    enabled: true,
    volume: 200,
    before: 15,
    after: 3,
    coverage: 50,
    supervision: 3,
  };
  assert.equal(impact(q)!.hours, 17);
});
test("schema rejects negative, infinite and out of range inputs", () => {
  const q = fixture();
  q.lines[0].minutes = -60;
  assert.equal(quoteSchema.safeParse(q).success, false);
  q.lines[0].minutes = 60;
  q.impact.volume = Infinity;
  assert.equal(quoteSchema.safeParse(q).success, false);
  q.impact.volume = 5;
  q.lines[0].discountPercent = 101;
  assert.equal(quoteSchema.safeParse(q).success, false);
});
test("public form needs consent and strips injected pricing", () => {
  const data = {
    key: crypto.randomUUID(),
    name: "Cliente",
    company: "Empresa",
    email: "client@example.com",
    phone: "",
    need: "Automatizar los reportes semanales",
    outcome: "",
    tools: "",
    volume: null,
    minutes: null,
    people: null,
    budget: "300",
    deadline: "",
    category: "",
    details: "",
    consent: true,
    rateCents: 1,
  };
  const input = requestSchema.parse(data);
  assert.ok(!("rateCents" in input));
  assert.equal(
    requestSchema.safeParse({ ...data, consent: false }).success,
    false,
  );
});
test("issuance blocks missing contact, tax and scope", () => {
  const q = fixture();
  q.taxConfirmed = false;
  const errors = issuanceErrors(q, defaults);
  assert.ok(errors.some((e) => e.includes("impuestos")));
  assert.ok(errors.some((e) => e.includes("contacto")));
});
test("changing defaults cannot alter quote line snapshots", () => {
  const q = fixture();
  const original = totals(q).once;
  const changed = { ...defaults, rateCents: 2500 };
  assert.equal(totals(q).once, original);
  assert.equal(fromService(catalog[3], changed.rateCents).rateCents, 2500);
});
