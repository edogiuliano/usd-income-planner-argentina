import { describe, expect, it } from "vitest";
import { parseDayCountInput, parseMoneyInput, parseNumberInput } from "@/lib/inputNumbers";

describe("input number parsing", () => {
  it("parses comma decimals for regular decimal inputs", () => {
    expect(parseNumberInput("5,31")).toBe(5.31);
  });

  it("keeps dot decimals for non-monthly money inputs", () => {
    expect(parseMoneyInput("5.31", "hour")).toBe(5.31);
  });

  it("treats dots as thousands separators and comma as decimal for monthly money", () => {
    expect(parseMoneyInput("1.500,50", "monthly")).toBe(1500.5);
  });

  it("parses monthly values with thousands separators and no decimals", () => {
    expect(parseMoneyInput("2.500", "monthly")).toBe(2500);
  });

  it("normalizes day counts to non-negative integers", () => {
    expect(parseDayCountInput("2,9")).toBe(2);
    expect(parseDayCountInput("-3")).toBe(0);
  });
});
