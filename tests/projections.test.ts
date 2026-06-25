import { describe, expect, it } from "vitest";
import { generateMonthlyProjections } from "../src/lib/projections";

describe("generateMonthlyProjections", () => {
  it("generates a rolling 3-month projection from the current month", () => {
    const projections = generateMonthlyProjections({
      fromDate: "2026-06-25",
      startDate: "2026-06-01",
      endDate: "2026-06-30",
      horizon: "3",
      paymentType: "hour",
      rate: 25,
      hoursPerDay: 8,
      freeWeekdays: [0, 6],
      hireDate: "2026-01-01",
      usedPtoDays: 0,
    });

    expect(projections).toHaveLength(3);
    expect(projections.map((projection) => projection.monthKey)).toEqual([
      "2026-06",
      "2026-07",
      "2026-08",
    ]);
    expect(projections[0].income.totalIncomeUsd).toBeGreaterThan(0);
  });

  it("generates remaining months in the calendar year", () => {
    const projections = generateMonthlyProjections({
      fromDate: "2026-10-15",
      startDate: "2026-10-01",
      endDate: "2026-10-31",
      horizon: "year",
      paymentType: "day",
      rate: 200,
      hoursPerDay: 8,
      freeWeekdays: [0, 6],
      hireDate: "2026-01-01",
      usedPtoDays: 0,
    });

    expect(projections.map((projection) => projection.monthKey)).toEqual([
      "2026-10",
      "2026-11",
      "2026-12",
    ]);
  });

  it("allocates vacation PTO and VTO into the affected projection month", () => {
    const projections = generateMonthlyProjections({
      fromDate: "2026-03-01",
      startDate: "2026-03-01",
      endDate: "2026-03-31",
      horizon: "3",
      paymentType: "day",
      rate: 200,
      hoursPerDay: 8,
      freeWeekdays: [0, 6],
      hireDate: "2026-01-01",
      usedPtoDays: 0,
      vacation: {
        startDate: "2026-03-02",
        endDate: "2026-03-08",
        keepUncoveredAsVto: true,
      },
    });

    expect(projections[0].monthKey).toBe("2026-03");
    expect(projections[0].vacation?.ptoDays).toBe(2);
    expect(projections[0].vacation?.vtoDays).toBe(3);
    expect(projections[0].cycleDays.ptoDays).toBe(2);
    expect(projections[0].cycleDays.vtoDays).toBe(3);
  });

  it("allocates specific selected vacation dates into the affected projection month", () => {
    const projections = generateMonthlyProjections({
      fromDate: "2026-03-01",
      startDate: "2026-03-01",
      endDate: "2026-03-31",
      horizon: "3",
      paymentType: "day",
      rate: 200,
      hoursPerDay: 8,
      freeWeekdays: [0, 6],
      hireDate: "2026-01-01",
      usedPtoDays: 0,
      vacation: {
        startDate: "2026-03-02",
        endDate: "2026-03-08",
        selectedDates: ["2026-03-02", "2026-03-04", "2026-03-07"],
        keepUncoveredAsVto: true,
      },
    });

    expect(projections[0].vacation?.vacationWorkDays).toBe(2);
    expect(projections[0].vacation?.vacationFreeDays).toBe(1);
    expect(projections[0].vacation?.availablePtoDays).toBe(2);
    expect(projections[0].cycleDays.ptoDays).toBe(2);
    expect(projections[0].cycleDays.vtoDays).toBe(0);
  });

  it("projects by shifting the configured cycle dates instead of calendar months", () => {
    const projections = generateMonthlyProjections({
      fromDate: "2026-06-25",
      startDate: "2026-06-10",
      endDate: "2026-07-09",
      horizon: "3",
      paymentType: "day",
      rate: 100,
      hoursPerDay: 8,
      freeWeekdays: [0, 6],
      hireDate: "2026-01-01",
      usedPtoDays: 0,
    });

    expect(projections.map((projection) => [projection.startDate, projection.endDate])).toEqual([
      ["2026-06-10", "2026-07-09"],
      ["2026-07-10", "2026-08-09"],
      ["2026-08-10", "2026-09-09"],
    ]);
  });

  it("labels payroll cycles by the closing month instead of the start month", () => {
    const projections = generateMonthlyProjections({
      fromDate: "2026-06-25",
      startDate: "2026-05-26",
      endDate: "2026-06-25",
      horizon: "3",
      paymentType: "hour",
      rate: 5.5,
      hoursPerDay: 8,
      freeWeekdays: [0, 1, 2, 4, 5, 6],
      hireDate: "2026-01-01",
      usedPtoDays: 0,
    });

    expect(projections.map((projection) => projection.monthKey)).toEqual([
      "2026-06",
      "2026-07",
      "2026-08",
    ]);
    expect(projections.map((projection) => [projection.startDate, projection.endDate])).toEqual([
      ["2026-05-26", "2026-06-25"],
      ["2026-06-26", "2026-07-25"],
      ["2026-07-26", "2026-08-25"],
    ]);
  });

  it("counts the remaining year from the cycle closing month", () => {
    const projections = generateMonthlyProjections({
      fromDate: "2026-10-20",
      startDate: "2026-10-26",
      endDate: "2026-11-25",
      horizon: "year",
      paymentType: "day",
      rate: 100,
      hoursPerDay: 8,
      freeWeekdays: [0, 6],
      hireDate: "2026-01-01",
      usedPtoDays: 0,
    });

    expect(projections.map((projection) => projection.monthKey)).toEqual(["2026-11", "2026-12"]);
  });
});
