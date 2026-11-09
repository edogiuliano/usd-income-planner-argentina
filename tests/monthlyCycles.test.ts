import { describe, expect, it } from "vitest";
import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";
import {
  cycleFromStartDay,
  DEFAULT_MONTHLY_CYCLE,
  getMonthlyCycleContaining,
  getMonthlyQuickPeriod,
  getWorkCycleFraction,
  readMonthlyCycle,
  shiftMonthlyCycle,
} from "../src/lib/monthlyCycles";
import { calculateIncome } from "../src/lib/calculator";
import { generateMonthlyProjections } from "../src/lib/projections";
import { parseSavedCalculation, restoreSavedForm } from "../src/lib/formState";

const custom = cycleFromStartDay(26);
describe("monthly work cycles", () => {
  it("selects the cycle containing November 6 and the immediately following cycle", () => {
    expect(getMonthlyQuickPeriod("2026-11-06", custom)).toEqual({
      startDate: "2026-10-26",
      endDate: "2026-11-25",
    });
    expect(getMonthlyQuickPeriod("2026-11-06", custom, 1)).toEqual({
      startDate: "2026-11-26",
      endDate: "2026-12-25",
    });
  });
  it.each([
    ["2026-11-25", "2026-10-26", "2026-11-25"],
    ["2026-11-26", "2026-11-26", "2026-12-25"],
    ["2026-12-26", "2026-12-26", "2027-01-25"],
    ["2027-01-01", "2026-12-26", "2027-01-25"],
  ])(
    "contains both endpoints and handles year boundaries on %s",
    (today, startDate, endDate) => {
      expect(getMonthlyCycleContaining(today, custom)).toEqual({
        startDate,
        endDate,
      });
    },
  );
  it("defaults to calendar months, including leap-year February", () => {
    expect(getMonthlyQuickPeriod("2024-02-06", DEFAULT_MONTHLY_CYCLE)).toEqual({
      startDate: "2024-02-01",
      endDate: "2024-02-29",
    });
    expect(
      getMonthlyQuickPeriod("2026-12-06", DEFAULT_MONTHLY_CYCLE, 1),
    ).toEqual({ startDate: "2027-01-01", endDate: "2027-01-31" });
  });
  it("restores independent days and still accepts legacy and invalid settings", () => {
    expect(readMonthlyCycle(JSON.stringify(custom))).toEqual(custom);
    expect(readMonthlyCycle('{"startDay":10,"endDay":20}')).toEqual({
      startDay: 10,
      endDay: 20,
    });
    expect(readMonthlyCycle('{"startDay":31,"endDay":31}')).toEqual({
      startDay: 31,
      endDay: 31,
    });
    expect(readMonthlyCycle('{"startDay":27,"endDay":26}')).toEqual({
      startDay: 27,
      endDay: 26,
    });
    expect(readMonthlyCycle('{"startDay":26}')).toEqual(custom);
    expect(readMonthlyCycle("bad")).toEqual(DEFAULT_MONTHLY_CYCLE);
    expect(readMonthlyCycle('{"startDay":32}')).toEqual(DEFAULT_MONTHLY_CYCLE);
  });
  it("uses a 27–26 cycle across years without mutating either bound", () => {
    const config = Object.freeze({ startDay: 27, endDay: 26 });
    expect(getMonthlyQuickPeriod("2026-12-27", config)).toEqual({
      startDate: "2026-12-27",
      endDate: "2027-01-26",
    });
    expect(getMonthlyQuickPeriod("2026-12-27", config, 1)).toEqual({
      startDate: "2027-01-27",
      endDate: "2027-02-26",
    });
    expect(config).toEqual({ startDay: 27, endDay: 26 });
  });
  it("uses the named calendar month for an independent same-month range", () => {
    const config = { startDay: 10, endDay: 20 };
    expect(getMonthlyQuickPeriod("2026-12-29", config)).toEqual({
      startDate: "2026-12-10",
      endDate: "2026-12-20",
    });
    expect(getMonthlyQuickPeriod("2026-12-29", config, 1)).toEqual({
      startDate: "2027-01-10",
      endDate: "2027-01-20",
    });
  });
  it.each([
    ["2026", "28"],
    ["2024", "29"],
  ])(
    "clips both bounds in February %s without rewriting them",
    (year, lastDay) => {
      const config = { startDay: 30, endDay: 31 };
      expect(getMonthlyQuickPeriod(`${year}-02-15`, config)).toEqual({
        startDate: `${year}-02-${lastDay}`,
        endDate: `${year}-02-${lastDay}`,
      });
      expect(getMonthlyQuickPeriod(`${year}-02-15`, config, 1)).toEqual({
        startDate: `${year}-03-30`,
        endDate: `${year}-03-31`,
      });
    },
  );
  it("keeps a gap between independent cross-month cycles unless clipping would overlap", () => {
    const config = { startDay: 31, endDay: 29 };
    expect(getMonthlyQuickPeriod("2026-02-10", config)).toEqual({
      startDate: "2026-01-31",
      endDate: "2026-02-28",
    });
    expect(getMonthlyQuickPeriod("2026-02-10", config, 1)).toEqual({
      startDate: "2026-03-01",
      endDate: "2026-03-29",
    });
    expect(getWorkCycleFraction("2026-01-30", "2026-01-30", config)).toBe(0);
  });
  it.each([1, 26, 29, 30, 31])(
    "keeps start day %i cycles contiguous through short months and leap years",
    (startDay) => {
      const config = cycleFromStartDay(startDay);
      const initial = getMonthlyCycleContaining("2023-12-15", config);
      let previousEnd: string | undefined;
      for (let index = 0; index < 40; index++) {
        const cycle = shiftMonthlyCycle(initial.startDate, config, index);
        if (previousEnd)
          expect(cycle.startDate).toBe(
            format(addDays(parseISO(previousEnd), 1), "yyyy-MM-dd"),
          );
        expect(cycle.endDate >= cycle.startDate).toBe(true);
        expect(
          getWorkCycleFraction(cycle.startDate, cycle.endDate, config),
        ).toBe(1);
        previousEnd = cycle.endDate;
      }
    },
  );
  it("adjusts a 31–30 cycle at February's end without overlapping dates", () => {
    const config = cycleFromStartDay(31);
    expect(getMonthlyCycleContaining("2026-02-06", config)).toEqual({
      startDate: "2026-01-31",
      endDate: "2026-02-28",
    });
    expect(shiftMonthlyCycle("2026-01-31", config, 1)).toEqual({
      startDate: "2026-03-01",
      endDate: "2026-03-30",
    });
    expect(getMonthlyCycleContaining("2024-02-06", config).endDate).toBe(
      "2024-02-29",
    );
  });
});

describe("fixed salary by work cycle", () => {
  const input = {
    paymentType: "monthly" as const,
    rate: 3000,
    hoursPerDay: 8,
    workedDays: 20,
    monthlyCycle: custom,
  };
  it("pays one whole salary for a complete 26–25 cycle of any length", () => {
    for (const today of ["2026-11-06", "2026-02-06", "2024-03-06"]) {
      const dates = getMonthlyCycleContaining(today, custom);
      expect(calculateIncome({ ...input, ...dates }).baseIncomeUsd).toBe(3000);
    }
  });
  it("prorates partial periods using the containing cycle's calendar days", () => {
    expect(
      getWorkCycleFraction("2026-11-01", "2026-11-25", custom),
    ).toBeCloseTo(25 / 31);
    expect(
      calculateIncome({
        ...input,
        startDate: "2026-11-01",
        endDate: "2026-11-25",
      }).totalIncomeUsd,
    ).toBeCloseTo((3000 * 25) / 31);
  });
  it("sums complete and partial cycles across February and years", () => {
    expect(getWorkCycleFraction("2026-01-26", "2026-03-25", custom)).toBe(2);
    expect(getWorkCycleFraction("2026-12-26", "2027-01-25", custom)).toBe(1);
    expect(
      getWorkCycleFraction("2026-01-20", "2026-03-10", custom),
    ).toBeCloseTo(6 / 31 + 1 + 13 / 28);
  });
  it("deducts VTO only once, while retaining paid legacy/vacation PTO", () => {
    const result = calculateIncome({
      ...input,
      startDate: "2026-10-26",
      endDate: "2026-11-25",
      workedDays: 17,
      scheduledWorkDays: 20,
      paidLeaveDays: 1,
      unpaidLeaveDays: 2,
    });
    expect(result.baseIncomeUsd).toBe(3000);
    expect(result.unpaidLeaveDeductionUsd).toBe(300);
    expect(result.totalIncomeUsd).toBe(2700);
  });
  it("keeps calendar-month behavior as the default", () => {
    expect(
      getWorkCycleFraction("2026-01-15", "2026-03-10", DEFAULT_MONTHLY_CYCLE),
    ).toBeCloseTo(17 / 31 + 1 + 10 / 31);
  });
  it("prorates only the days in independent windows, with one salary for each complete cycle", () => {
    const config = { startDay: 10, endDay: 20 };
    expect(
      getWorkCycleFraction("2026-11-15", "2026-12-10", config),
    ).toBeCloseTo(7 / 11);
    expect(getWorkCycleFraction("2026-11-01", "2026-12-31", config)).toBe(2);
    expect(
      calculateIncome({
        ...input,
        monthlyCycle: config,
        startDate: "2026-11-10",
        endDate: "2026-11-20",
      }).totalIncomeUsd,
    ).toBe(3000);
  });
});

describe("cycle persistence and projections", () => {
  const saved = {
    paymentType: "monthly",
    rate: "3000",
    hoursPerDay: "8",
    startDate: "2026-10-26",
    endDate: "2026-11-25",
    timeOffDays: { ptoDays: 2, vtoDays: 1 },
    freeWeekdays: [0, 6],
  };
  it("reads legacy saved PTO and adds the default cycle without losing dates", () => {
    const data = parseSavedCalculation(saved)!;
    expect(data.timeOffDays.ptoDays).toBe(2);
    expect(data.monthlyCycle).toEqual(DEFAULT_MONTHLY_CYCLE);
    expect(data.startDate).toBe(saved.startDate);
  });
  it("restores the separately saved cycle, even after invalid manual date edits", () => {
    const restored = restoreSavedForm(
      JSON.stringify({ ...saved, endDate: "" }),
      JSON.stringify(saved),
      JSON.stringify(custom),
    );
    const data = parseSavedCalculation(restored)!;
    expect(data.monthlyCycle).toEqual(custom);
    expect(data.endDate).toBe(saved.endDate);
    expect(calculateIncome({ ...data, workedDays: 20 }).baseIncomeUsd).toBe(
      3000,
    );
  });
  it("restores and projects same-month windows independently across years", () => {
    const monthlyCycle = { startDay: 10, endDay: 20 };
    const restored = restoreSavedForm(
      JSON.stringify(saved),
      null,
      JSON.stringify(monthlyCycle),
    );
    expect(parseSavedCalculation(restored)?.monthlyCycle).toEqual(monthlyCycle);
    const items = generateMonthlyProjections({
      ...getMonthlyQuickPeriod("2026-12-29", monthlyCycle),
      monthlyCycle,
      fromDate: "2026-12-29",
      horizon: "3",
      hireDate: "2026-01-01",
      paymentType: "monthly",
      rate: 3000,
      hoursPerDay: 8,
      freeWeekdays: [0, 6],
    });
    expect(
      items.map(({ startDate, endDate, income }) => [
        startDate,
        endDate,
        income.totalIncomeUsd,
      ]),
    ).toEqual([
      ["2026-12-10", "2026-12-20", 3000],
      ["2027-01-10", "2027-01-20", 3000],
      ["2027-02-10", "2027-02-20", 3000],
    ]);
  });
  it.each([1, 26, 29, 30, 31])(
    "projects complete start-day %i cycles with no gaps and a whole salary each",
    (startDay) => {
      const monthlyCycle = cycleFromStartDay(startDay);
      const dates = getMonthlyCycleContaining("2023-12-15", monthlyCycle);
      const items = generateMonthlyProjections({
        ...dates,
        monthlyCycle,
        fromDate: "2023-12-15",
        horizon: "12",
        paymentType: "monthly",
        rate: 3000,
        hoursPerDay: 8,
        freeWeekdays: [0, 6],
        hireDate: "2023-01-01",
      });
      items.forEach((item, index) => {
        expect(item.income.totalIncomeUsd).toBe(3000);
        if (index)
          expect(
            differenceInCalendarDays(
              parseISO(item.startDate),
              parseISO(items[index - 1].endDate),
            ),
          ).toBe(1);
      });
    },
  );
  it("keeps manual partial dates and uses cycle-based proration in projections", () => {
    const items = generateMonthlyProjections({
      startDate: "2026-11-01",
      endDate: "2026-11-25",
      monthlyCycle: custom,
      fromDate: "2026-11-06",
      horizon: "3",
      paymentType: "monthly",
      rate: 3000,
      hoursPerDay: 8,
      freeWeekdays: [0, 6],
      hireDate: "2026-01-01",
    });
    expect(items[0].startDate).toBe("2026-11-01");
    expect(items[0].income.totalIncomeUsd).toBeCloseTo((3000 * 25) / 31);
    expect(items[1].income.totalIncomeUsd).toBeCloseTo(2500);
  });
  it("keeps vacation PTO/VTO on the right adjusted cycle", () => {
    const monthlyCycle = cycleFromStartDay(31);
    const items = generateMonthlyProjections({
      startDate: "2026-01-31",
      endDate: "2026-02-28",
      monthlyCycle,
      fromDate: "2026-02-06",
      horizon: "3",
      paymentType: "monthly",
      rate: 3000,
      hoursPerDay: 8,
      freeWeekdays: [0, 6],
      hireDate: "2026-01-01",
      vacation: {
        startDate: "2026-03-02",
        endDate: "2026-03-04",
        keepUncoveredAsVto: true,
      },
    });
    expect(items[0].cycleDays.ptoDays).toBe(0);
    expect(items[1].cycleDays.ptoDays).toBe(2);
    expect(items[1].cycleDays.vtoDays).toBe(1);
    expect(items[1].income.baseIncomeUsd).toBe(3000);
    expect(items[1].income.totalIncomeUsd).toBeCloseTo(
      3000 * (1 - 1 / items[1].cycleDays.scheduledWorkDays),
    );
  });
});
