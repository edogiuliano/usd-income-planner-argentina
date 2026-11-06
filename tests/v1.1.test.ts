import { describe, expect, it, vi, afterEach } from "vitest";
import {
  calculateIncome,
  getCalendarMonthFraction,
} from "../src/lib/calculator";
import { getCycleDays } from "../src/lib/dates";
import { convertUsd, selectPreferredRate } from "../src/lib/conversion";
import { fetchExchangeRates } from "../src/lib/rates";
import {
  parseSavedCalculation,
  restoreSavedForm,
  isDateOnly,
} from "../src/lib/formState";
import {
  calculatePtoBalance,
  getPtoUnlockDate,
  evaluateVacationPlan,
} from "../src/lib/pto";
import { generateMonthlyProjections } from "../src/lib/projections";
import type { CountryCode, ExchangeRate } from "../src/types";

describe("v1.1 monthly calendar proration", () => {
  it.each([
    ["2026-01-01", "2026-03-31", 3],
    ["2026-01-16", "2026-01-31", 16 / 31],
    ["2024-02-01", "2024-02-29", 1],
    ["2024-02-29", "2024-03-01", 1 / 29 + 1 / 31],
    ["2025-12-26", "2026-01-25", 6 / 31 + 25 / 31],
    ["2026-01-15", "2026-03-10", 17 / 31 + 1 + 10 / 31],
  ])("prorates %s through %s", (startDate, endDate, fraction) => {
    expect(getCalendarMonthFraction(startDate, endDate)).toBeCloseTo(
      fraction,
      10,
    );
    expect(
      calculateIncome({
        paymentType: "monthly",
        rate: 3000,
        hoursPerDay: 8,
        workedDays: 20,
        startDate,
        endDate,
      }).totalIncomeUsd,
    ).toBeCloseTo(3000 * fraction);
  });
  it("pays PTO and discounts VTO exactly once across years", () => {
    const startDate = "2025-12-15",
      endDate = "2026-02-10";
    const days = getCycleDays(startDate, endDate, [0, 6], {
      ptoDays: 3,
      vtoDays: 2,
    });
    const input = {
      paymentType: "monthly" as const,
      rate: 3100,
      hoursPerDay: 8,
      startDate,
      endDate,
      workedDays: days.workedDays,
      scheduledWorkDays: days.scheduledWorkDays,
      paidLeaveDays: days.ptoDays,
      unpaidLeaveDays: days.vtoDays,
    };
    const result = calculateIncome(input);
    const base = 3100 * (17 / 31 + 1 + 10 / 28);
    expect(result.baseIncomeUsd).toBeCloseTo(base);
    expect(result.totalIncomeUsd).toBeCloseTo(
      base * (1 - 2 / days.scheduledWorkDays),
    );
    expect(
      calculateIncome({
        ...input,
        workedDays: days.workedDays + 3,
        paidLeaveDays: 0,
      }).totalIncomeUsd,
    ).toBeCloseTo(result.totalIncomeUsd);
  });
  it("rejects invalid/reversed periods", () => {
    expect(getCalendarMonthFraction("bad", "2026-01-01")).toBe(0);
    expect(getCalendarMonthFraction("2026-02-01", "2026-01-01")).toBe(0);
  });
});

const rate: ExchangeRate = {
  casa: "cripto",
  name: "Cripto",
  buy: 1000,
  sell: 1100,
  currencyCode: "ARS",
  locale: "es-AR",
  updatedAt: "2026-01-01",
};
describe("v1.1 conversions and rate identifiers", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("uses entity buy to sell USD and entity sell to buy USD", () => {
    expect(convertUsd(100, rate)).toBe(100000);
    expect(convertUsd(100, rate, "buy-usd")).toBe(110000);
    expect(convertUsd(100, { ...rate, buy: 0 })).toBeNull();
  });
  it("migrates indexed legacy IDs and preserves choice after API reorder", () => {
    const rates = [{ ...rate, casa: "oficial" }, rate];
    expect(selectPreferredRate(rates)?.casa).toBe("cripto");
    expect(selectPreferredRate(rates, "cripto-4")?.casa).toBe("cripto");
    expect(selectPreferredRate([...rates].reverse(), "oficial-0")?.casa).toBe(
      "oficial",
    );
  });
  it.each(["ar", "cl", "uy", "mx", "bo", "br", "co", "ve"] as CountryCode[])(
    "normalizes reference-only rates in %s",
    async (country) => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          json: async () => ({
            nombre: "Referencia",
            promedio: 42,
            compra: null,
            venta: null,
          }),
        }),
      );
      const rates = await fetchExchangeRates(country);
      expect(rates[0].isReference).toBe(true);
      expect(convertUsd(2, rates[0])).toBe(84);
      expect(convertUsd(2, rates[0], "buy-usd")).toBe(84);
    },
  );
  it("uses the available single quote instead of converting to zero", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ compra: 45, venta: 0 }),
      }),
    );
    expect(convertUsd(2, (await fetchExchangeRates("uy"))[0], "buy-usd")).toBe(
      90,
    );
  });
  it("keeps USD-only mode offline", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    expect(convertUsd(12, (await fetchExchangeRates("other"))[0])).toBe(12);
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe("v1.1 saved calculations", () => {
  const saved = {
    paymentType: "hour",
    rate: "5,31",
    hoursPerDay: "8",
    startDate: "2026-06-26",
    endDate: "2026-07-25",
    freeWeekdays: [3, 6],
    timeOffDays: { ptoDays: 1, vtoDays: 0 },
  };
  it("restores legacy form data and recomputes matching results", () => {
    const data = parseSavedCalculation(JSON.parse(JSON.stringify(saved)))!;
    expect(data.rate).toBe(5.31);
    const days = getCycleDays(
      data.startDate,
      data.endDate,
      data.freeWeekdays,
      data.timeOffDays,
    );
    const result = calculateIncome({
      ...data,
      workedDays: days.workedDays,
      paidLeaveDays: days.ptoDays,
      scheduledWorkDays: days.scheduledWorkDays,
    });
    expect(result.totalIncomeUsd).toBeCloseTo(892.08);
    expect(result.paidLeaveDays).toBe(1);
  });
  it.each([
    { rate: "no" },
    { rate: "1,2,3" },
    { hoursPerDay: "1..5" },
    { hoursPerDay: "25" },
    { startDate: "2026-02-30" },
    { endDate: "2025-01-01" },
    { rate: "" },
  ])("does not show stale results for invalid drafts %o", (change) => {
    expect(parseSavedCalculation({ ...saved, ...change })).toBeNull();
  });
  it("validates dates without UTC conversion", () => {
    expect(isDateOnly("2026-01-01")).toBe(true);
    expect(isDateOnly("2026-02-30")).toBe(false);
    expect(isDateOnly("2026-01-01T00:00:00Z")).toBe(false);
  });
  it("restores a matching last valid form when an interrupted draft is invalid", () => {
    const restored = restoreSavedForm(
      JSON.stringify({ ...saved, rate: "incomplete" }),
      JSON.stringify(saved),
    );
    expect(restored).toEqual(saved);
    expect(parseSavedCalculation(restored)?.rate).toBe(5.31);
    expect(restoreSavedForm("{broken", JSON.stringify(saved))).toEqual(saved);
    expect(restoreSavedForm("{broken", null)).toBeNull();
  });
});

describe("v1.1 configurable PTO and projections", () => {
  it("accrues only on completed anniversaries, including fractional rates", () => {
    expect(
      calculatePtoBalance({
        hireDate: "2026-01-01",
        asOfDate: "2026-02-01",
        ptoPerMonth: 2,
      }).availablePtoDays,
    ).toBe(2);
    expect(
      calculatePtoBalance({
        hireDate: "2026-01-01",
        asOfDate: "2026-01-31",
        ptoPerMonth: 2,
      }).availablePtoDays,
    ).toBe(0);
    expect(
      calculatePtoBalance({
        hireDate: "2026-01-01",
        asOfDate: "2026-04-01",
        ptoPerMonth: 0.5,
      }).availablePtoDays,
    ).toBe(1.5);
    expect(
      getPtoUnlockDate({
        hireDate: "2026-01-01",
        requestedPtoDays: 3,
        usedPtoDays: 1,
        ptoPerMonth: 2,
      }),
    ).toBe("2026-03-01");
    expect(
      getPtoUnlockDate({
        hireDate: "2026-01-01",
        requestedPtoDays: 1,
        ptoPerMonth: 0,
      }),
    ).toBeNull();
  });
  it("does not spend a fractional PTO as a full day", () => {
    const plan = evaluateVacationPlan({
      hireDate: "2026-01-01",
      vacationStartDate: "2026-02-02",
      vacationEndDate: "2026-02-02",
      ptoPerMonth: 0.5,
      freeWeekdays: [0, 6],
      keepUncoveredAsVto: true,
    });
    expect(plan.ptoDays).toBe(0);
    expect(plan.vtoDays).toBe(1);
    expect(plan.nextMissingPtoDate).toBe("2026-03-01");
  });
  it("does not delay the unlock anniversary due to decimal rounding", () => {
    expect(
      getPtoUnlockDate({
        hireDate: "2026-01-01",
        requestedPtoDays: 29,
        ptoPerMonth: 0.29,
      }),
    ).toBe("2034-05-01");
  });
  it("keeps month-end cycles whole through February and a year change", () => {
    const projections = generateMonthlyProjections({
      fromDate: "2025-12-01",
      startDate: "2025-12-01",
      endDate: "2025-12-31",
      horizon: "3",
      paymentType: "monthly",
      rate: 3000,
      hoursPerDay: 8,
      freeWeekdays: [0, 6],
      hireDate: "2025-01-01",
    });
    expect(projections.map((item) => item.endDate)).toEqual([
      "2025-12-31",
      "2026-01-31",
      "2026-02-28",
    ]);
    expect(projections.map((item) => item.income.totalIncomeUsd)).toEqual([
      3000, 3000, 3000,
    ]);
  });
  it("includes manual PTO/VTO only in the initial cycle, not every future month", () => {
    const items = generateMonthlyProjections({
      fromDate: "2026-01-01",
      startDate: "2026-01-01",
      endDate: "2026-01-31",
      horizon: "3",
      paymentType: "day",
      rate: 100,
      hoursPerDay: 8,
      freeWeekdays: [0, 6],
      hireDate: "2025-01-01",
      timeOffDays: { ptoDays: 2, vtoDays: 1 },
    });
    expect(items[0].cycleDays.ptoDays).toBe(2);
    expect(items[0].cycleDays.vtoDays).toBe(1);
    expect(items[0].income.totalIncomeUsd).toBe(2100);
    expect(items[1].cycleDays.ptoDays).toBe(0);
    expect(items[1].cycleDays.vtoDays).toBe(0);
  });
  it("projects multiple-month fixed salaries with the same formula and PTO rate", () => {
    const items = generateMonthlyProjections({
      fromDate: "2026-01-01",
      startDate: "2026-01-01",
      endDate: "2026-02-28",
      horizon: "3",
      paymentType: "monthly",
      rate: 3000,
      hoursPerDay: 8,
      freeWeekdays: [0, 6],
      hireDate: "2025-12-01",
      ptoPerMonth: 2,
      vacation: {
        startDate: "2026-01-05",
        endDate: "2026-01-07",
        keepUncoveredAsVto: true,
      },
    });
    expect(items[0].cycleDays.ptoDays).toBe(2);
    expect(items[0].cycleDays.vtoDays).toBe(1);
    expect(items[0].income.baseIncomeUsd).toBe(6000);
    expect(items[0].income.totalIncomeUsd).toBeCloseTo(
      6000 * (1 - 1 / items[0].cycleDays.scheduledWorkDays),
    );
  });
});
