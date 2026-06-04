import { afterEach, describe, expect, it } from "vitest";
import { splitTtc, vatRateBps } from "@/lib/billing";

const original = process.env.LUMERO_VAT_RATE_BPS;

afterEach(() => {
  if (original === undefined) delete process.env.LUMERO_VAT_RATE_BPS;
  else process.env.LUMERO_VAT_RATE_BPS = original;
});

describe("vatRateBps", () => {
  it("defaults to 0 (franchise en base)", () => {
    delete process.env.LUMERO_VAT_RATE_BPS;
    expect(vatRateBps()).toBe(0);
  });

  it("reads the configured rate", () => {
    process.env.LUMERO_VAT_RATE_BPS = "2000";
    expect(vatRateBps()).toBe(2000);
  });

  it("ignores invalid values", () => {
    process.env.LUMERO_VAT_RATE_BPS = "abc";
    expect(vatRateBps()).toBe(0);
  });
});

describe("splitTtc", () => {
  it("leaves the amount untouched when no VAT applies", () => {
    delete process.env.LUMERO_VAT_RATE_BPS;
    expect(splitTtc(19000)).toEqual({ amountHt: 19000, taxAmount: 0, taxRate: 0 });
  });

  it("splits a TTC amount into HT + VAT at 20%", () => {
    process.env.LUMERO_VAT_RATE_BPS = "2000";
    const { amountHt, taxAmount, taxRate } = splitTtc(12000);
    expect(taxRate).toBe(2000);
    expect(amountHt).toBe(10000);
    expect(taxAmount).toBe(2000);
    // Le total reconstitué doit être exact (pas de perte d'arrondi).
    expect(amountHt + taxAmount).toBe(12000);
  });
});
