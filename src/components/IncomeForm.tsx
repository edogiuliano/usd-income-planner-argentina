"use client";

import { useEffect, useState } from "react";
import type { PaymentType, TimeOffDays } from "@/types";

interface IncomeFormProps {
  onSubmit: (data: {
    paymentType: PaymentType;
    rate: number;
    hoursPerDay: number;
    freeWeekdays: number[];
    timeOffDays: TimeOffDays;
    startDate: string;
    endDate: string;
  }) => void;
}

interface FormState {
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

const parseNumber = (value: string): number => {
  if (!value) return 0;
  const normalized = value.replace(",", ".");
  const parsed = parseFloat(normalized);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const parseDayCount = (value: string): number => Math.max(Math.trunc(parseNumber(value)), 0);

const getDefaultDates = (): { startDate: string; endDate: string } => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    startDate: firstDay.toISOString().split("T")[0],
    endDate: lastDay.toISOString().split("T")[0],
  };
};

const getDefaultFormState = (): FormState => {
  const defaultDates = getDefaultDates();
  return {
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
  value === "minute" || value === "hour" || value === "day" || value === "monthly";

const normalizeTimeOffDays = (value: unknown): TimeOffDays => {
  if (!value || typeof value !== "object") {
    return { vtoDays: 0, ptoDays: 0 };
  }

  const raw = value as Partial<TimeOffDays>;
  return {
    vtoDays: typeof raw.vtoDays === "number" ? Math.max(Math.trunc(raw.vtoDays), 0) : 0,
    ptoDays: typeof raw.ptoDays === "number" ? Math.max(Math.trunc(raw.ptoDays), 0) : 0,
  };
};

const normalizeSavedFormState = (value: unknown): FormState | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const saved = value as Partial<FormState>;
  const defaultState = getDefaultFormState();
  const freeWeekdays = Array.isArray(saved.freeWeekdays)
    ? saved.freeWeekdays.filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)
    : defaultState.freeWeekdays;

  return {
    paymentType: isValidPaymentType(saved.paymentType) ? saved.paymentType : defaultState.paymentType,
    rate: typeof saved.rate === "string" ? saved.rate : defaultState.rate,
    hoursPerDay: typeof saved.hoursPerDay === "string" ? saved.hoursPerDay : defaultState.hoursPerDay,
    freeWeekdays,
    timeOffDays: normalizeTimeOffDays(saved.timeOffDays),
    startDate: typeof saved.startDate === "string" ? saved.startDate : defaultState.startDate,
    endDate: typeof saved.endDate === "string" ? saved.endDate : defaultState.endDate,
  };
};

export function IncomeForm({ onSubmit }: IncomeFormProps) {
  const initialState = getDefaultFormState();
  const [paymentType, setPaymentType] = useState<PaymentType>(initialState.paymentType);
  const [rate, setRate] = useState(initialState.rate);
  const [hoursPerDay, setHoursPerDay] = useState(initialState.hoursPerDay);
  const [freeWeekdays, setFreeWeekdays] = useState<number[]>(initialState.freeWeekdays);
  const [vtoDays, setVtoDays] = useState(String(initialState.timeOffDays.vtoDays));
  const [ptoDays, setPtoDays] = useState(String(initialState.timeOffDays.ptoDays));
  const [isTimeOffOpen, setIsTimeOffOpen] = useState(false);
  const [startDate, setStartDate] = useState(initialState.startDate);
  const [endDate, setEndDate] = useState(initialState.endDate);
  const [isFormLoaded, setIsFormLoaded] = useState(false);

  const timeOffDays = {
    vtoDays: parseDayCount(vtoDays),
    ptoDays: parseDayCount(ptoDays),
  };
  const hasTimeOff = timeOffDays.vtoDays > 0 || timeOffDays.ptoDays > 0;

  useEffect(() => {
    const saved = localStorage.getItem("usd-planner-form-state");

    if (saved) {
      try {
        const savedState = normalizeSavedFormState(JSON.parse(saved));

        if (savedState) {
          setPaymentType(savedState.paymentType);
          setRate(savedState.rate);
          setHoursPerDay(savedState.hoursPerDay);
          setFreeWeekdays(savedState.freeWeekdays);
          setVtoDays(String(savedState.timeOffDays.vtoDays));
          setPtoDays(String(savedState.timeOffDays.ptoDays));
          setIsTimeOffOpen(savedState.timeOffDays.vtoDays > 0 || savedState.timeOffDays.ptoDays > 0);
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
      paymentType,
      rate,
      hoursPerDay,
      freeWeekdays,
      timeOffDays,
      startDate,
      endDate,
    };
    localStorage.setItem("usd-planner-form-state", JSON.stringify(formState));
  }, [paymentType, rate, hoursPerDay, freeWeekdays, vtoDays, ptoDays, startDate, endDate, isFormLoaded]);

  const handleWeekdayToggle = (day: number) => {
    setFreeWeekdays((prev) =>
      prev.includes(day) ? prev.filter((currentDay) => currentDay !== day) : [...prev, day]
    );
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit({
      paymentType,
      rate: parseNumber(rate),
      hoursPerDay: parseNumber(hoursPerDay),
      freeWeekdays,
      timeOffDays,
      startDate,
      endDate,
    });
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
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="paymentType" className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
            Tipo de pago
          </label>
          <select
            id="paymentType"
            value={paymentType}
            onChange={(event) => setPaymentType(event.target.value as PaymentType)}
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="minute">Por minuto</option>
            <option value="hour">Por hora</option>
            <option value="day">Por día</option>
            <option value="monthly">Mensual fijo</option>
          </select>
        </div>

        <div>
          <label htmlFor="rate" className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
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
              placeholder="0.00"
              className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-8 pr-4 text-gray-900 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="hoursPerDay" className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
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
      </div>

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
          onClick={() => setIsTimeOffOpen((current) => !current)}
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        >
          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              VTO / PTO
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Opcional: cargá solo la cantidad de días.
            </p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-gray-700 shadow-sm dark:bg-gray-800 dark:text-gray-200">
            {hasTimeOff ? `${timeOffDays.vtoDays} VTO · ${timeOffDays.ptoDays} PTO` : "Agregar"}
          </span>
        </button>

        {isTimeOffOpen && (
          <div className="grid grid-cols-1 gap-3 border-t border-gray-200 p-4 dark:border-gray-700 sm:grid-cols-2">
            <div>
              <label htmlFor="vtoDays" className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
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

            <div>
              <label htmlFor="ptoDays" className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                PTO / vacaciones pagas
              </label>
              <input
                id="ptoDays"
                type="number"
                min="0"
                step="1"
                value={ptoDays}
                onChange={(event) => setPtoDays(event.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                No trabajás, pero se paga.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="startDate" className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
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
          <label htmlFor="endDate" className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
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

      {startDate && endDate && new Date(endDate) < new Date(startDate) && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
          <svg className="h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" suppressHydrationWarning>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm font-medium text-red-700 dark:text-red-300">
            La fecha de fin no puede ser anterior a la fecha de inicio.
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={!startDate || !endDate || new Date(endDate) < new Date(startDate)}
        className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-lg font-semibold text-white shadow-lg transition-all hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl focus:ring-4 focus:ring-blue-300 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500"
      >
        Calcular ingresos
      </button>
    </form>
  );
}
