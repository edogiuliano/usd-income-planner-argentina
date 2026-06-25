import {
  addDays,
  addMonths,
  differenceInDays,
  format,
  getDay,
  isAfter,
  isBefore,
  isWithinInterval,
  parseISO,
} from "date-fns";
import { es } from "date-fns/locale";
import { calculateIncome } from "@/lib/calculator";
import { getCycleDays } from "@/lib/dates";
import { calculatePtoBalance, evaluateVacationPlan } from "@/lib/pto";
import type {
  MonthlyProjection,
  PaymentType,
  ProjectionHorizon,
  VacationPlan,
  VacationProjectionInput,
} from "@/types";

type GenerateMonthlyProjectionsInput = {
  fromDate: string;
  startDate: string;
  endDate: string;
  horizon: ProjectionHorizon;
  paymentType: PaymentType;
  rate: number;
  hoursPerDay: number;
  freeWeekdays: number[];
  hireDate: string;
  usedPtoDays?: number;
  vacation?: VacationProjectionInput;
};

const toIsoDate = (date: Date) => format(date, "yyyy-MM-dd");

const getProjectionMonthCount = (cycleEnd: Date, horizon: ProjectionHorizon) => {
  if (horizon === "year") {
    return 12 - cycleEnd.getMonth();
  }

  return Number(horizon);
};

const getVacationWorkDates = (vacation: VacationProjectionInput, freeWeekdays: number[]) => {
  if (vacation.selectedDates?.length) {
    return Array.from(new Set(vacation.selectedDates))
      .sort()
      .filter((date) => !freeWeekdays.includes(getDay(parseISO(date))));
  }

  const start = parseISO(vacation.startDate);
  const end = parseISO(vacation.endDate);
  const totalDays = differenceInDays(end, start) + 1;

  if (totalDays <= 0) {
    return [];
  }

  const dates: string[] = [];
  for (let i = 0; i < totalDays; i++) {
    const currentDate = addDays(start, i);

    if (!freeWeekdays.includes(getDay(currentDate))) {
      dates.push(toIsoDate(currentDate));
    }
  }

  return dates;
};

const getVacationForMonth = (input: {
  monthStart: Date;
  monthEnd: Date;
  vacation: VacationProjectionInput;
  freeWeekdays: number[];
  hireDate: string;
  usedPtoDays: number;
}): VacationPlan => {
  const selectedDates = input.vacation.selectedDates
    ? Array.from(new Set(input.vacation.selectedDates)).sort()
    : undefined;
  const workDates = getVacationWorkDates(input.vacation, input.freeWeekdays);
  const availablePtoDays = calculatePtoBalance({
    hireDate: input.hireDate,
    asOfDate: selectedDates?.[0] ?? input.vacation.startDate,
    usedPtoDays: input.usedPtoDays,
  }).availablePtoDays;

  const monthWorkDates = workDates.filter((date) => {
    const parsedDate = parseISO(date);
    return isWithinInterval(parsedDate, { start: input.monthStart, end: input.monthEnd });
  });
  const monthSelectedDates = (selectedDates ?? []).filter((date) => {
    const parsedDate = parseISO(date);
    return isWithinInterval(parsedDate, { start: input.monthStart, end: input.monthEnd });
  });
  const monthFreeDates = monthSelectedDates.filter((date) => input.freeWeekdays.includes(getDay(parseISO(date))));
  const ptoDates = workDates.slice(0, availablePtoDays);
  const vtoDates = input.vacation.keepUncoveredAsVto ? workDates.slice(availablePtoDays) : [];
  const totalPlan = evaluateVacationPlan({
    vacationStartDate: input.vacation.startDate,
    vacationEndDate: input.vacation.endDate,
    selectedDates,
    freeWeekdays: input.freeWeekdays,
    hireDate: input.hireDate,
    usedPtoDays: input.usedPtoDays,
    keepUncoveredAsVto: input.vacation.keepUncoveredAsVto,
  });

  return {
    totalVacationDays: selectedDates ? monthSelectedDates.length : monthWorkDates.length,
    vacationWorkDays: monthWorkDates.length,
    vacationFreeDays: monthFreeDates.length,
    availablePtoDays,
    ptoDays: monthWorkDates.filter((date) => ptoDates.includes(date)).length,
    vtoDays: monthWorkDates.filter((date) => vtoDates.includes(date)).length,
    missingPtoDays: monthWorkDates.filter((date) => !ptoDates.includes(date)).length,
    nextMissingPtoDate: totalPlan.nextMissingPtoDate,
  };
};

export function generateMonthlyProjections(
  input: GenerateMonthlyProjectionsInput,
): MonthlyProjection[] {
  const cycleStart = parseISO(input.startDate);
  const cycleEnd = parseISO(input.endDate);
  const monthCount = getProjectionMonthCount(cycleEnd, input.horizon);
  const usedPtoDays = Math.max(Math.trunc(input.usedPtoDays ?? 0), 0);

  return Array.from({ length: monthCount }, (_, index) => {
    const projectionStart = addMonths(cycleStart, index);
    const projectionEnd = addMonths(cycleEnd, index);
    let ptoDays = 0;
    let vtoDays = 0;
    let vacation: VacationPlan | undefined;

    if (input.vacation) {
      const selectedDates = input.vacation.selectedDates
        ? Array.from(new Set(input.vacation.selectedDates)).sort()
        : undefined;
      const vacationStart = parseISO(selectedDates?.[0] ?? input.vacation.startDate);
      const vacationEnd = parseISO(selectedDates?.[selectedDates.length - 1] ?? input.vacation.endDate);
      const overlapsProjection =
        !isAfter(vacationStart, projectionEnd) && !isBefore(vacationEnd, projectionStart);

      if (overlapsProjection) {
        vacation = getVacationForMonth({
          monthStart: projectionStart,
          monthEnd: projectionEnd,
          vacation: input.vacation,
          freeWeekdays: input.freeWeekdays,
          hireDate: input.hireDate,
          usedPtoDays,
        });
        ptoDays = vacation.ptoDays;
        vtoDays = vacation.vtoDays;
      }
    }

    const cycleDays = getCycleDays(toIsoDate(projectionStart), toIsoDate(projectionEnd), input.freeWeekdays, {
      ptoDays,
      vtoDays,
    });
    const income = calculateIncome({
      paymentType: input.paymentType,
      rate: input.rate,
      hoursPerDay: input.hoursPerDay,
      workedDays: cycleDays.workedDays,
      scheduledWorkDays: cycleDays.scheduledWorkDays,
      paidLeaveDays: cycleDays.ptoDays,
      unpaidLeaveDays: cycleDays.vtoDays,
    });

    return {
      monthKey: format(projectionEnd, "yyyy-MM"),
      monthLabel: format(projectionEnd, "MMMM yyyy", { locale: es }),
      startDate: toIsoDate(projectionStart),
      endDate: toIsoDate(projectionEnd),
      cycleDays,
      income,
      vacation,
    };
  });
}
