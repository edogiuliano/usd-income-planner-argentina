import { describe, it, expect } from "vitest";
import { calculateIncome } from "../src/lib/calculator";

describe("calculateIncome", () => {
  it("should calculate income by minute", () => {
    const result = calculateIncome({
      paymentType: "minute",
      rate: 0.5,
      hoursPerDay: 8,
      workedDays: 5,
    });

    expect(result.totalIncomeUsd).toBe(1200);
    expect(result.totalHours).toBe(40);
    expect(result.averageDailyIncomeUsd).toBe(240);
    expect(result.averageHourlyIncomeUsd).toBe(30);
  });

  it("should calculate income by hour", () => {
    const result = calculateIncome({
      paymentType: "hour",
      rate: 25,
      hoursPerDay: 8,
      workedDays: 5,
    });

    expect(result.totalIncomeUsd).toBe(1000);
    expect(result.totalHours).toBe(40);
    expect(result.averageDailyIncomeUsd).toBe(200);
    expect(result.averageHourlyIncomeUsd).toBe(25);
  });

  it("should calculate income by day", () => {
    const result = calculateIncome({
      paymentType: "day",
      rate: 200,
      hoursPerDay: 8,
      workedDays: 5,
    });

    expect(result.totalIncomeUsd).toBe(1000);
    expect(result.totalHours).toBe(40);
    expect(result.averageDailyIncomeUsd).toBe(200);
    expect(result.averageHourlyIncomeUsd).toBe(25);
  });

  it("should calculate fixed monthly income", () => {
    const result = calculateIncome({
      paymentType: "monthly",
      rate: 2500,
      hoursPerDay: 8,
      workedDays: 20,
    });

    expect(result.totalIncomeUsd).toBe(2500);
    expect(result.totalHours).toBe(160);
    expect(result.averageDailyIncomeUsd).toBe(125);
    expect(result.averageHourlyIncomeUsd).toBe(15.625);
  });

  it("should return zero income when workedDays is zero", () => {
    const result = calculateIncome({
      paymentType: "hour",
      rate: 25,
      hoursPerDay: 8,
      workedDays: 0,
    });

    expect(result.totalIncomeUsd).toBe(0);
    expect(result.totalHours).toBe(0);
    expect(result.averageDailyIncomeUsd).toBe(0);
    expect(result.averageHourlyIncomeUsd).toBe(0);
  });

  it("should return zero income when hoursPerDay is zero for hourly rate", () => {
    const result = calculateIncome({
      paymentType: "hour",
      rate: 25,
      hoursPerDay: 0,
      workedDays: 5,
    });

    expect(result.totalIncomeUsd).toBe(0);
    expect(result.totalHours).toBe(0);
    expect(result.averageDailyIncomeUsd).toBe(0);
    expect(result.averageHourlyIncomeUsd).toBe(0);
  });

  it("should calculate income for day rate even with zero hoursPerDay", () => {
    const result = calculateIncome({
      paymentType: "day",
      rate: 200,
      hoursPerDay: 0,
      workedDays: 5,
    });

    expect(result.totalIncomeUsd).toBe(1000);
    expect(result.totalHours).toBe(0);
    expect(result.averageDailyIncomeUsd).toBe(200);
    expect(result.averageHourlyIncomeUsd).toBe(0);
  });
});
