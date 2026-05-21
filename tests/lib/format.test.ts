import { describe, expect, it } from "vitest";
import { formatEUR, slugify } from "@/lib/format";

describe("formatEUR", () => {
  it("renders a placeholder for null/undefined", () => {
    expect(formatEUR(null)).toBe("—");
    expect(formatEUR(undefined)).toBe("—");
  });

  it("converts cents to euros", () => {
    expect(formatEUR(0)).toContain("0");
    expect(formatEUR(1000)).toContain("10");
  });
});

describe("slugify", () => {
  it("normalizes accents and spaces", () => {
    expect(slugify("Crème Brûlée")).toBe("creme-brulee");
  });

  it("trims dashes and caps length", () => {
    expect(slugify("  Hello, World!  ")).toBe("hello-world");
    expect(slugify("a".repeat(100)).length).toBeLessThanOrEqual(60);
  });
});
