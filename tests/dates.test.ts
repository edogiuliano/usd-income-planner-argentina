import { describe, expect, it } from "vitest";
import { getCycleDays } from "../src/lib/dates";

describe("getCycleDays", () => {
  it("should calculate 1 day when start and end are the same", () => {
    const result = getCycleDays("2024-01-01", "2024-01-01", []);
    expect(result.totalDays).toBe(1);
    expect(result.workedDays).toBe(1);
    expect(result.freeDays).toBe(0);
    expect(result.scheduledWorkDays).toBe(1);
    expect(result.payableDays).toBe(1);
  });

  it("should count weekend days as free when specified", () => {
    const result = getCycleDays("2024-01-01", "2024-01-07", [0, 6]);
    expect(result.totalDays).toBe(7);
    expect(result.freeDays).toBe(2);
    expect(result.workedDays).toBe(5);
    expect(result.scheduledWorkDays).toBe(5);
  });

  it("should include both start and end dates", () => {
    const result = getCycleDays("2024-01-01", "2024-01-03", []);
    expect(result.totalDays).toBe(3);
    expect(result.workedDays).toBe(3);
    expect(result.freeDays).toBe(0);
  });

  it("should count all days as free when all weekdays are free", () => {
    const result = getCycleDays("2024-01-01", "2024-01-07", [0, 1, 2, 3, 4, 5, 6]);
    expect(result.totalDays).toBe(7);
    expect(result.freeDays).toBe(7);
    expect(result.workedDays).toBe(0);
    expect(result.payableDays).toBe(0);
  });

  it("should handle end date before start date", () => {
    const result = getCycleDays("2024-01-05", "2024-01-01", []);
    expect(result.totalDays).toBe(-3);
    expect(result.workedDays).toBe(-3);
    expect(result.freeDays).toBe(0);
  });

  it("should subtract VTO days from worked and payable days", () => {
    const result = getCycleDays("2024-01-01", "2024-01-05", [], {
      vtoDays: 2,
      ptoDays: 0,
    });

    expect(result.totalDays).toBe(5);
    expect(result.scheduledWorkDays).toBe(5);
    expect(result.workedDays).toBe(3);
    expect(result.payableDays).toBe(3);
    expect(result.vtoDays).toBe(2);
    expect(result.ptoDays).toBe(0);
  });

  it("should subtract PTO from worked days but keep it payable", () => {
    const result = getCycleDays("2024-01-01", "2024-01-05", [], {
      vtoDays: 0,
      ptoDays: 2,
    });

    expect(result.totalDays).toBe(5);
    expect(result.scheduledWorkDays).toBe(5);
    expect(result.workedDays).toBe(3);
    expect(result.payableDays).toBe(5);
    expect(result.vtoDays).toBe(0);
    expect(result.ptoDays).toBe(2);
  });

  it("should clamp VTO and PTO to available scheduled work days", () => {
    const result = getCycleDays("2024-01-01", "2024-01-05", [], {
      vtoDays: 4,
      ptoDays: 4,
    });

    expect(result.scheduledWorkDays).toBe(5);
    expect(result.vtoDays).toBe(4);
    expect(result.ptoDays).toBe(1);
    expect(result.workedDays).toBe(0);
    expect(result.payableDays).toBe(1);
  });
});
