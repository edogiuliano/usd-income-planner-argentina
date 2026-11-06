"use client";

import { useEffect, useState } from "react";
import { addDays, format } from "date-fns";
import { parseSavedCalculation, restoreSavedForm } from "@/lib/formState";
import { parseDayCountInput } from "@/lib/inputNumbers";
import {
  cycleFromEndDay,
  cycleFromStartDay,
  DEFAULT_MONTHLY_CYCLE,
  getMonthlyQuickPeriod,
  MONTHLY_CYCLE_STORAGE_KEY,
  normalizeMonthlyCycle,
  readMonthlyCycle,
} from "@/lib/monthlyCycles";
import type {
  CalculationData,
  MonthlyCycle,
  PaymentType,
  TimeOffDays,
} from "@/types";

interface IncomeFormProps {
  onShowResults?: () => void;
  onInvalid: () => void;
  onSubmit: (data: CalculationData) => void;
}

interface FormState {
  monthlyCycle: MonthlyCycle;
  paymentType: PaymentType;
  rate: string;
  hoursPerDay: string;
  freeWeekdays: number[];
  timeOffDays: TimeOffDays;
  startDate: string;
  endDate: string;
}

const WEEKDAYS = [
  { value: 0, label: "Dom" },
  { value: 1, label: "Lun" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Mié" },
  { value: 4, label: "Jue" },
  { value: 5, label: "Vie" },
  { value: 6, label: "Sáb" },
];

const getDefaultDates = (): { startDate: string; endDate: string } => {
  return getMonthlyQuickPeriod(
    format(new Date(), "yyyy-MM-dd"),
    DEFAULT_MONTHLY_CYCLE,
  );
};

const getDefaultFormState = (): FormState => {
  const defaultDates = getDefaultDates();
  return {
    monthlyCycle: { ...DEFAULT_MONTHLY_CYCLE },
    paymentType: "hour",
    rate: "25",
    hoursPerDay: "8",
    freeWeekdays: [0, 6],
    timeOffDays: { vtoDays: 0, ptoDays: 0 },
    startDate: defaultDates.startDate,
    endDate: defaultDates.endDate,
  };
};

const isValidPaymentType = (value: unknown): value is PaymentType =>
  value === "minute" ||
  value === "hour" ||
  value === "day" ||
  value === "monthly";

const normalizeTimeOffDays = (value: unknown): TimeOffDays => {
  if (!value || typeof value !== "object") {
    return { vtoDays: 0, ptoDays: 0 };
  }

  const raw = value as Partial<TimeOffDays>;
  return {
    vtoDays:
      typeof raw.vtoDays === "number"
        ? Math.max(Math.trunc(raw.vtoDays), 0)
        : 0,
    ptoDays:
      typeof raw.ptoDays === "number"
        ? Math.max(Math.trunc(raw.ptoDays), 0)
        : 0,
  };
};

const normalizeSavedFormState = (value: unknown): FormState | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const saved = value as Partial<FormState>;
  const defaultState = getDefaultFormState();
  const freeWeekdays = Array.isArray(saved.freeWeekdays)
    ? saved.freeWeekdays.filter(
        (day) => Number.isInteger(day) && day >= 0 && day <= 6,
      )
    : defaultState.freeWeekdays;

  return {
    monthlyCycle: normalizeMonthlyCycle(saved.monthlyCycle),
    paymentType: isValidPaymentType(saved.paymentType)
      ? saved.paymentType
      : defaultState.paymentType,
    rate: typeof saved.rate === "string" ? saved.rate : defaultState.rate,
    hoursPerDay:
      typeof saved.hoursPerDay === "string"
        ? saved.hoursPerDay
        : defaultState.hoursPerDay,
    freeWeekdays,
    timeOffDays: normalizeTimeOffDays(saved.timeOffDays),
    startDate:
      typeof saved.startDate === "string"
        ? saved.startDate
        : defaultState.startDate,
    endDate:
      typeof saved.endDate === "string" ? saved.endDate : defaultState.endDate,
  };
};

export function IncomeForm({
  onSubmit,
  onInvalid,
  onShowResults,
}: IncomeFormProps) {
  const initialState = getDefaultFormState();
  const [paymentType, setPaymentType] = useState<PaymentType>(
    initialState.paymentType,
  );
  const [rate, setRate] = useState(initialState.rate);
  const [hoursPerDay, setHoursPerDay] = useState(initialState.hoursPerDay);
  const [freeWeekdays, setFreeWeekdays] = useState<number[]>(
    initialState.freeWeekdays,
  );
  const [vtoDays, setVtoDays] = useState(
    String(initialState.timeOffDays.vtoDays),
  );
  const [legacyPtoDays, setLegacyPtoDays] = useState(0);
  const [monthlyCycle, setMonthlyCycle] = useState<MonthlyCycle>(
    initialState.monthlyCycle,
  );
  const [isTimeOffOpen, setIsTimeOffOpen] = useState(false);
  const [startDate, setStartDate] = useState(initialState.startDate);
  const [endDate, setEndDate] = useState(initialState.endDate);
  const [isFormLoaded, setIsFormLoaded] = useState(false);

  const timeOffDays = {
    vtoDays: parseDayCountInput(vtoDays),
    ptoDays: legacyPtoDays,
  };
  const hasTimeOff = timeOffDays.vtoDays > 0;
  const validData = parseSavedCalculation({
    paymentType,
    rate,
    hoursPerDay,
    freeWeekdays,
    timeOffDays,
    startDate,
    endDate,
    monthlyCycle,
  });
  const dateError = !startDate || !endDate || endDate < startDate;
  const numberError = !validData && !dateError;

  useEffect(() => {
    const saved = localStorage.getItem("usd-planner-form-state");
    const lastValid = localStorage.getItem("usd-planner-last-valid-form-state");
    const savedCycle = localStorage.getItem(MONTHLY_CYCLE_STORAGE_KEY);
    if (savedCycle !== null) {
      const cycle = readMonthlyCycle(savedCycle);
      setMonthlyCycle(cycle);
      const dates = getMonthlyQuickPeriod(
        format(new Date(), "yyyy-MM-dd"),
        cycle,
      );
      setStartDate(dates.startDate);
      setEndDate(dates.endDate);
    }

    if (saved || lastValid) {
      try {
        const savedState = normalizeSavedFormState(
          restoreSavedForm(saved, lastValid, savedCycle),
        );

        if (savedState) {
          setPaymentType(savedState.paymentType);
          setRate(savedState.rate);
          setHoursPerDay(savedState.hoursPerDay);
          setFreeWeekdays(savedState.freeWeekdays);
          setVtoDays(String(savedState.timeOffDays.vtoDays));
          setLegacyPtoDays(savedState.timeOffDays.ptoDays);
          setMonthlyCycle(savedState.monthlyCycle);
          setIsTimeOffOpen(savedState.timeOffDays.vtoDays > 0);
          setStartDate(savedState.startDate);
          setEndDate(savedState.endDate);
        }
      } catch {
        localStorage.removeItem("usd-planner-form-state");
      }
    }

    setIsFormLoaded(true);
  }, []);

  useEffect(() => {
    if (!isFormLoaded) return;

    const formState: FormState = {
      monthlyCycle,
      paymentType,
      rate,
      hoursPerDay,
      freeWeekdays,
      timeOffDays: {
        vtoDays: parseDayCountInput(vtoDays),
        ptoDays: legacyPtoDays,
      },
      startDate,
      endDate,
    };
    localStorage.setItem("usd-planner-form-state", JSON.stringify(formState));
    localStorage.setItem(
      MONTHLY_CYCLE_STORAGE_KEY,
      JSON.stringify(monthlyCycle),
    );
    const data = parseSavedCalculation(formState);
    if (data) {
      localStorage.setItem(
        "usd-planner-last-valid-form-state",
        JSON.stringify(formState),
      );
      onSubmit(data);
    } else onInvalid();
  }, [
    paymentType,
    rate,
    hoursPerDay,
    freeWeekdays,
    vtoDays,
    legacyPtoDays,
    monthlyCycle,
    startDate,
    endDate,
    isFormLoaded,
    onSubmit,
    onInvalid,
  ]);

  const handleWeekdayToggle = (day: number) => {
    setFreeWeekdays((prev) =>
      prev.includes(day)
        ? prev.filter((currentDay) => currentDay !== day)
        : [...prev, day],
    );
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (validData) {
      onSubmit(validData);
      onShowResults?.();
    }
  };

  const selectPeriod = (period: string) => {
    const now = new Date();
    const dates =
      period === "7" || period === "14"
        ? {
            startDate: format(now, "yyyy-MM-dd"),
            endDate: format(addDays(now, Number(period) - 1), "yyyy-MM-dd"),
          }
        : getMonthlyQuickPeriod(
            format(now, "yyyy-MM-dd"),
            monthlyCycle,
            period === "next" ? 1 : 0,
          );
    setStartDate(dates.startDate);
    setEndDate(dates.endDate);
  };

  const getRateLabel = () => {
    switch (paymentType) {
      case "minute":
        return "USD por minuto";
      case "hour":
        return "USD por hora";
      case "day":
        return "USD por día";
      case "monthly":
        return "USD mensual fijo";
    }
  };

  return (
    <form onSubmit={handleSubmit} className="income-form space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label
            htmlFor="paymentType"
            className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300"
          >
            Tipo de pago
          </label>
          <select
            id="paymentType"
            value={paymentType}
            onChange={(event) =>
              setPaymentType(event.target.value as PaymentType)
            }
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="minute">Por minuto</option>
            <option value="hour">Por hora</option>
            <option value="day">Por día</option>
            <option value="monthly">Mensual fijo</option>
          </select>
        </div>

        <div
          className={
            paymentType === "day" || paymentType === "monthly"
              ? "col-span-2"
              : ""
          }
        >
          <label
            htmlFor="rate"
            className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300"
          >
            Monto ({getRateLabel()})
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-medium text-gray-500 dark:text-gray-400">
              $
            </span>
            <input
              id="rate"
              type="text"
              inputMode="decimal"
              value={rate}
              onChange={(event) => setRate(event.target.value)}
              placeholder={
                paymentType === "monthly" ? "Usá comas para decimales" : "0.00"
              }
              className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-8 pr-4 text-gray-900 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
        </div>

        {(paymentType === "hour" || paymentType === "minute") && (
          <div>
            <label
              htmlFor="hoursPerDay"
              className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300"
            >
              Horas por día
            </label>
            <input
              id="hoursPerDay"
              type="text"
              inputMode="decimal"
              value={hoursPerDay}
              onChange={(event) => setHoursPerDay(event.target.value)}
              placeholder="0"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
        )}
      </div>

      {(paymentType === "day" || paymentType === "monthly") && (
        <details className="text-sm text-zinc-600 dark:text-zinc-300">
          <summary className="cursor-pointer font-medium">
            Jornada para estadísticas (opcional)
          </summary>
          <label htmlFor="optionalHours" className="mt-3 block">
            Horas por día
          </label>
          <input
            id="optionalHours"
            className="mt-2 w-full"
            inputMode="decimal"
            value={hoursPerDay}
            onChange={(event) => setHoursPerDay(event.target.value)}
          />
        </details>
      )}

      <div>
        <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
          Días libres semanales
        </label>
        <div className="grid grid-cols-7 gap-2">
          {WEEKDAYS.map((day) => {
            const isSelected = freeWeekdays.includes(day.value);
            return (
              <button
                key={day.value}
                type="button"
                aria-pressed={isSelected}
                onClick={() => handleWeekdayToggle(day.value)}
                suppressHydrationWarning
                className={`flex cursor-pointer flex-col items-center justify-center rounded-xl p-2.5 transition-all duration-200 ${
                  isSelected
                    ? "bg-blue-500 text-white shadow-md hover:bg-blue-600"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                <span className="text-sm font-semibold">{day.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/30">
        <button
          type="button"
          aria-expanded={isTimeOffOpen}
          onClick={() => setIsTimeOffOpen((current) => !current)}
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        >
          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              VTO · Días sin pago
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Opcional: cargá solo la cantidad de días.
            </p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-gray-700 shadow-sm dark:bg-gray-800 dark:text-gray-200">
            {hasTimeOff ? `${timeOffDays.vtoDays} VTO` : "Agregar"}
          </span>
        </button>

        {isTimeOffOpen && (
          <div className="border-t border-gray-200 p-4 dark:border-gray-700">
            <div>
              <label
                htmlFor="vtoDays"
                className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300"
              >
                VTO sin pago
              </label>
              <input
                id="vtoDays"
                type="number"
                min="0"
                step="1"
                value={vtoDays}
                onChange={(event) => setVtoDays(event.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                No trabajás y no se paga.
              </p>
            </div>
          </div>
        )}
      </div>

      {legacyPtoDays > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
          <p>
            Tu cálculo anterior incluye {legacyPtoDays} PTO pagos. Para nuevas
            vacaciones, usá Proyectar.
          </p>
          <button
            type="button"
            className="secondary-button px-2 py-1"
            onClick={() => setLegacyPtoDays(0)}
          >
            Quitar PTO anteriores
          </button>
        </div>
      )}

      <fieldset className="min-w-0">
        <legend className="mb-2 text-sm font-medium">Tu ciclo mensual</legend>
        <div className="grid grid-cols-2 gap-3">
          <label htmlFor="cycleStartDay" className="min-w-0 text-xs">
            Empieza el día
            <select
              id="cycleStartDay"
              className="mt-1 w-full"
              value={monthlyCycle.startDay}
              onChange={(event) =>
                setMonthlyCycle(cycleFromStartDay(Number(event.target.value)))
              }
            >
              {Array.from({ length: 31 }, (_, index) => (
                <option key={index + 1} value={index + 1}>
                  {index + 1}
                </option>
              ))}
            </select>
          </label>
          <label htmlFor="cycleEndDay" className="min-w-0 text-xs">
            Termina el día
            <select
              id="cycleEndDay"
              className="mt-1 w-full"
              value={monthlyCycle.endDay}
              onChange={(event) =>
                setMonthlyCycle(
                  cycleFromEndDay(
                    event.target.value === "last"
                      ? "last"
                      : Number(event.target.value),
                  ),
                )
              }
            >
              <option value="last">Fin de mes</option>
              {Array.from({ length: 30 }, (_, index) => (
                <option key={index + 1} value={index + 1}>
                  {index + 1}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="mt-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
          En meses cortos, el cierre pasa al último día.
        </p>
      </fieldset>

      <div className="flex flex-wrap gap-2" aria-label="Períodos rápidos">
        {[
          ["month", "Este mes"],
          ["next", "Próximo mes"],
          ["7", "7 días"],
          ["14", "14 días"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => selectPeriod(value)}
            className="period-button rounded-lg border border-zinc-200 px-2.5 py-2 text-xs font-semibold dark:border-white/10"
          >
            {label}
          </button>
        ))}
      </div>
      <details
        className="text-sm text-zinc-600 dark:text-zinc-300"
        onInvalid={(event) => {
          event.currentTarget.open = true;
        }}
      >
        <summary className="cursor-pointer font-medium">
          Personalizar fechas
        </summary>
        <p className="mt-2 text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
          {startDate.split("-").reverse().join("/")} -{" "}
          {endDate.split("-").reverse().join("/")}
        </p>
        <div className="mt-3 grid grid-cols-1 gap-4 min-[360px]:grid-cols-2">
          <div>
            <label
              htmlFor="startDate"
              className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300"
            >
              Fecha de inicio
            </label>
            <input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          <div>
            <label
              htmlFor="endDate"
              className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300"
            >
              Fecha de fin
            </label>
            <input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
        </div>
      </details>

      {startDate && endDate && new Date(endDate) < new Date(startDate) && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
          <svg
            className="h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            suppressHydrationWarning
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-sm font-medium text-red-700 dark:text-red-300">
            La fecha de fin no puede ser anterior a la fecha de inicio.
          </p>
        </div>
      )}
      {numberError && (
        <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">
          Ingresá un monto válido y una jornada entre 0 y 24 horas.
        </p>
      )}
      {paymentType === "monthly" && (
        <p className="text-xs leading-5 text-zinc-500 dark:text-zinc-400">
          Un ciclo completo equivale a un sueldo mensual. Los períodos parciales
          se pagan según los días del ciclo; el VTO se descuenta una sola vez.
        </p>
      )}

      <button
        type="submit"
        disabled={!validData}
        className="primary-button w-full px-5 py-3 text-sm font-semibold"
      >
        Calcular ingresos
      </button>
    </form>
  );
}
