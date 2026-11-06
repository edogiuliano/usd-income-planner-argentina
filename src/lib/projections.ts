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
  endOfMonth,
  isLastDayOfMonth,
} from "date-fns";
import { es } from "date-fns/locale";
import { calculateIncome } from "@/lib/calculator";
import { getCycleDays } from "@/lib/dates";
import { calculatePtoBalance, evaluateVacationPlan } from "@/lib/pto";
import {
  getMonthlyCycleContaining,
  shiftMonthlyCycle,
} from "@/lib/monthlyCycles";
import type {
  MonthlyProjection,
  PaymentType,
  ProjectionHorizon,
  VacationPlan,
  VacationProjectionInput,
  TimeOffDays,
  MonthlyCycle,
} from "@/types";

type GenerateMonthlyProjectionsInput = {
  monthlyCycle?: MonthlyCycle;
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
  ptoPerMonth?: number;
  timeOffDays?: TimeOffDays;
  vacation?: VacationProjectionInput;
};

const toIsoDate = (date: Date) => format(date, "yyyy-MM-dd");

const getProjectionMonthCount = (
  cycleEnd: Date,
  horizon: ProjectionHorizon,
) => {
  if (horizon === "year") {
    return 12 - cycleEnd.getMonth();
  }

  return Number(horizon);
};

const getVacationWorkDates = (
  vacation: VacationProjectionInput,
  freeWeekdays: number[],
) => {
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
  ptoPerMonth?: number;
}): VacationPlan => {
  const selectedDates = input.vacation.selectedDates
    ? Array.from(new Set(input.vacation.selectedDates)).sort()
    : undefined;
  const workDates = getVacationWorkDates(input.vacation, input.freeWeekdays);
  const availablePtoDays = calculatePtoBalance({
    hireDate: input.hireDate,
    asOfDate: selectedDates?.[0] ?? input.vacation.startDate,
    usedPtoDays: input.usedPtoDays,
    ptoPerMonth: input.ptoPerMonth,
  }).availablePtoDays;

  const monthWorkDates = workDates.filter((date) => {
    const parsedDate = parseISO(date);
    return isWithinInterval(parsedDate, {
      start: input.monthStart,
      end: input.monthEnd,
    });
  });
  const monthSelectedDates = (selectedDates ?? []).filter((date) => {
    const parsedDate = parseISO(date);
    return isWithinInterval(parsedDate, {
      start: input.monthStart,
      end: input.monthEnd,
    });
  });
  const monthFreeDates = monthSelectedDates.filter((date) =>
    input.freeWeekdays.includes(getDay(parseISO(date))),
  );
  const ptoDates = workDates.slice(0, availablePtoDays);
  const vtoDates = input.vacation.keepUncoveredAsVto
    ? workDates.slice(availablePtoDays)
    : [];
  const totalPlan = evaluateVacationPlan({
    vacationStartDate: input.vacation.startDate,
    vacationEndDate: input.vacation.endDate,
    selectedDates,
    freeWeekdays: input.freeWeekdays,
    hireDate: input.hireDate,
    usedPtoDays: input.usedPtoDays,
    ptoPerMonth: input.ptoPerMonth,
    keepUncoveredAsVto: input.vacation.keepUncoveredAsVto,
  });

  return {
    totalVacationDays: selectedDates
      ? monthSelectedDates.length
      : monthWorkDates.length,
    vacationWorkDays: monthWorkDates.length,
    vacationFreeDays: monthFreeDates.length,
    availablePtoDays,
    ptoDays: monthWorkDates.filter((date) => ptoDates.includes(date)).length,
    vtoDays: monthWorkDates.filter((date) => vtoDates.includes(date)).length,
    missingPtoDays: monthWorkDates.filter((date) => !ptoDates.includes(date))
      .length,
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
  const configuredCycle = input.monthlyCycle
    ? getMonthlyCycleContaining(input.startDate, input.monthlyCycle)
    : null;
  const isCompleteCycle =
    configuredCycle?.startDate === input.startDate &&
    configuredCycle?.endDate === input.endDate;

  return Array.from({ length: monthCount }, (_, index) => {
    const shifted =
      isCompleteCycle && input.monthlyCycle
        ? shiftMonthlyCycle(input.startDate, input.monthlyCycle, index)
        : null;
    const projectionStart = shifted
      ? parseISO(shifted.startDate)
      : addMonths(cycleStart, index);
    const projectionEnd = shifted
      ? parseISO(shifted.endDate)
      : isLastDayOfMonth(cycleEnd)
        ? endOfMonth(addMonths(cycleEnd, index))
        : addMonths(cycleEnd, index);
    let ptoDays = 0;
    let vtoDays = 0;
    let vacation: VacationPlan | undefined;

    if (input.vacation) {
      const selectedDates = input.vacation.selectedDates
        ? Array.from(new Set(input.vacation.selectedDates)).sort()
        : undefined;
      const vacationStart = parseISO(
        selectedDates?.[0] ?? input.vacation.startDate,
      );
      const vacationEnd = parseISO(
        selectedDates?.[selectedDates.length - 1] ?? input.vacation.endDate,
      );
      const overlapsProjection =
        !isAfter(vacationStart, projectionEnd) &&
        !isBefore(vacationEnd, projectionStart);

      if (overlapsProjection) {
        vacation = getVacationForMonth({
          monthStart: projectionStart,
          monthEnd: projectionEnd,
          vacation: input.vacation,
          freeWeekdays: input.freeWeekdays,
          hireDate: input.hireDate,
          usedPtoDays,
          ptoPerMonth: input.ptoPerMonth,
        });
        ptoDays = vacation.ptoDays;
        vtoDays = vacation.vtoDays;
      }
    }

    const cycleDays = getCycleDays(
      toIsoDate(projectionStart),
      toIsoDate(projectionEnd),
      input.freeWeekdays,
      {
        ptoDays:
          ptoDays + (index === 0 ? (input.timeOffDays?.ptoDays ?? 0) : 0),
        vtoDays:
          vtoDays + (index === 0 ? (input.timeOffDays?.vtoDays ?? 0) : 0),
      },
    );
    const income = calculateIncome({
      paymentType: input.paymentType,
      rate: input.rate,
      hoursPerDay: input.hoursPerDay,
      workedDays: cycleDays.workedDays,
      scheduledWorkDays: cycleDays.scheduledWorkDays,
      paidLeaveDays: cycleDays.ptoDays,
      unpaidLeaveDays: cycleDays.vtoDays,
      startDate: toIsoDate(projectionStart),
      endDate: toIsoDate(projectionEnd),
      monthlyCycle: input.monthlyCycle,
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
