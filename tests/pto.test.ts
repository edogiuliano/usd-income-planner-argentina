import { describe, expect, it } from "vitest";
import { calculatePtoBalance, evaluateVacationPlan, getPtoUnlockDate } from "../src/lib/pto";

describe("calculatePtoBalance", () => {
  it("accrues one PTO after one complete worked month", () => {
    const balance = calculatePtoBalance({
      hireDate: "2026-01-01",
      asOfDate: "2026-02-01",
      usedPtoDays: 0,
    });

    expect(balance.accruedPtoDays).toBe(1);
    expect(balance.availablePtoDays).toBe(1);
    expect(balance.nextPtoDate).toBe("2026-03-01");
  });

  it("does not accrue PTO before the complete month date", () => {
    const balance = calculatePtoBalance({
      hireDate: "2026-01-01",
      asOfDate: "2026-01-31",
      usedPtoDays: 0,
    });

    expect(balance.accruedPtoDays).toBe(0);
    expect(balance.availablePtoDays).toBe(0);
    expect(balance.nextPtoDate).toBe("2026-02-01");
  });

  it("subtracts already used PTO from the available balance", () => {
    const balance = calculatePtoBalance({
      hireDate: "2026-01-01",
      asOfDate: "2026-05-01",
      usedPtoDays: 2,
    });

    expect(balance.accruedPtoDays).toBe(4);
    expect(balance.availablePtoDays).toBe(2);
  });
});

describe("getPtoUnlockDate", () => {
  it("returns the date when the requested PTO count becomes available", () => {
    const unlockDate = getPtoUnlockDate({
      hireDate: "2026-01-01",
      requestedPtoDays: 4,
      usedPtoDays: 0,
    });

    expect(unlockDate).toBe("2026-05-01");
  });
});

describe("evaluateVacationPlan", () => {
  it("does not spend PTO on configured weekly days off", () => {
    const plan = evaluateVacationPlan({
      vacationStartDate: "2026-03-02",
      vacationEndDate: "2026-03-08",
      freeWeekdays: [0, 6],
      hireDate: "2026-01-01",
      usedPtoDays: 0,
      keepUncoveredAsVto: false,
    });

    expect(plan.totalVacationDays).toBe(7);
    expect(plan.vacationWorkDays).toBe(5);
    expect(plan.vacationFreeDays).toBe(2);
    expect(plan.ptoDays).toBe(2);
    expect(plan.missingPtoDays).toBe(3);
    expect(plan.vtoDays).toBe(0);
    expect(plan.nextMissingPtoDate).toBe("2026-06-01");
  });

  it("can keep the range and count uncovered PTO as VTO", () => {
    const plan = evaluateVacationPlan({
      vacationStartDate: "2026-03-02",
      vacationEndDate: "2026-03-08",
      freeWeekdays: [0, 6],
      hireDate: "2026-01-01",
      usedPtoDays: 0,
      keepUncoveredAsVto: true,
    });

    expect(plan.ptoDays).toBe(2);
    expect(plan.missingPtoDays).toBe(3);
    expect(plan.vtoDays).toBe(3);
  });

  it("can evaluate specific selected vacation dates without spending PTO on days off", () => {
    const plan = evaluateVacationPlan({
      vacationStartDate: "2026-03-02",
      vacationEndDate: "2026-03-08",
      selectedDates: ["2026-03-02", "2026-03-04", "2026-03-07"],
      freeWeekdays: [0, 6],
      hireDate: "2026-01-01",
      usedPtoDays: 0,
      keepUncoveredAsVto: true,
    });

    expect(plan.totalVacationDays).toBe(3);
    expect(plan.vacationWorkDays).toBe(2);
    expect(plan.vacationFreeDays).toBe(1);
    expect(plan.availablePtoDays).toBe(2);
    expect(plan.ptoDays).toBe(2);
    expect(plan.missingPtoDays).toBe(0);
    expect(plan.vtoDays).toBe(0);
  });
});
