import { addDays, addMonths, differenceInDays, format, getDay, isAfter, parseISO } from "date-fns";
import type { PtoBalance, VacationPlan } from "@/types";

const toIsoDate = (date: Date) => format(date, "yyyy-MM-dd");

const normalizeDayCount = (value: number) => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(Math.trunc(value), 0);
};

const countCompleteMonths = (hireDate: string, asOfDate: string) => {
  const hire = parseISO(hireDate);
  const asOf = parseISO(asOfDate);

  if (isAfter(hire, asOf)) {
    return 0;
  }

  let months = 0;
  while (!isAfter(addMonths(hire, months + 1), asOf)) {
    months++;
  }

  return months;
};

export function getPtoUnlockDate(input: {
  hireDate: string;
  requestedPtoDays: number;
  usedPtoDays?: number;
}) {
  const requestedPtoDays = normalizeDayCount(input.requestedPtoDays);
  const usedPtoDays = normalizeDayCount(input.usedPtoDays ?? 0);
  const requiredAccruedPtoDays = requestedPtoDays + usedPtoDays;

  return toIsoDate(addMonths(parseISO(input.hireDate), requiredAccruedPtoDays));
}

export function calculatePtoBalance(input: {
  hireDate: string;
  asOfDate: string;
  usedPtoDays?: number;
}): PtoBalance {
  const usedPtoDays = normalizeDayCount(input.usedPtoDays ?? 0);
  const accruedPtoDays = countCompleteMonths(input.hireDate, input.asOfDate);
  const availablePtoDays = Math.max(accruedPtoDays - usedPtoDays, 0);
  const nextPtoDate = toIsoDate(addMonths(parseISO(input.hireDate), accruedPtoDays + 1));

  return {
    hireDate: input.hireDate,
    asOfDate: input.asOfDate,
    accruedPtoDays,
    usedPtoDays,
    availablePtoDays,
    nextPtoDate,
  };
}

export function evaluateVacationPlan(input: {
  vacationStartDate: string;
  vacationEndDate: string;
  selectedDates?: string[];
  freeWeekdays: number[];
  hireDate: string;
  usedPtoDays?: number;
  keepUncoveredAsVto: boolean;
}): VacationPlan {
  const selectedDates = Array.from(new Set(input.selectedDates ?? [])).sort();
  const hasSelectedDates = selectedDates.length > 0;
  const start = parseISO(hasSelectedDates ? selectedDates[0] : input.vacationStartDate);
  const end = parseISO(hasSelectedDates ? selectedDates[selectedDates.length - 1] : input.vacationEndDate);
  const totalVacationDays = hasSelectedDates ? selectedDates.length : differenceInDays(end, start) + 1;

  if (totalVacationDays <= 0) {
    return {
      totalVacationDays,
      vacationWorkDays: 0,
      vacationFreeDays: 0,
      availablePtoDays: 0,
      ptoDays: 0,
      vtoDays: 0,
      missingPtoDays: 0,
      nextMissingPtoDate: null,
    };
  }

  let vacationWorkDays = 0;
  let vacationFreeDays = 0;

  const vacationDates = hasSelectedDates
    ? selectedDates
    : Array.from({ length: totalVacationDays }, (_, index) => toIsoDate(addDays(start, index)));

  for (const vacationDate of vacationDates) {
    const currentDate = parseISO(vacationDate);

    if (input.freeWeekdays.includes(getDay(currentDate))) {
      vacationFreeDays++;
    } else {
      vacationWorkDays++;
    }
  }

  const balance = calculatePtoBalance({
    hireDate: input.hireDate,
    asOfDate: hasSelectedDates ? selectedDates[0] : input.vacationStartDate,
    usedPtoDays: input.usedPtoDays ?? 0,
  });
  const ptoDays = Math.min(vacationWorkDays, balance.availablePtoDays);
  const missingPtoDays = Math.max(vacationWorkDays - ptoDays, 0);
  const vtoDays = input.keepUncoveredAsVto ? missingPtoDays : 0;
  const nextMissingPtoDate =
    missingPtoDays > 0
      ? getPtoUnlockDate({
          hireDate: input.hireDate,
          requestedPtoDays: vacationWorkDays,
          usedPtoDays: input.usedPtoDays ?? 0,
        })
      : null;

  return {
    totalVacationDays,
    vacationWorkDays,
    vacationFreeDays,
    availablePtoDays: balance.availablePtoDays,
    ptoDays,
    vtoDays,
    missingPtoDays,
    nextMissingPtoDate,
  };
}
