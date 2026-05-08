"use client";

import { useState, useEffect } from "react";
import type { PaymentType } from "@/types";

interface IncomeFormProps {
  onSubmit: (data: {
    paymentType: PaymentType;
    rate: number;
    hoursPerDay: number;
    freeWeekdays: number[];
    startDate: string;
    endDate: string;
  }) => void;
}

interface FormState {
  paymentType: PaymentType;
  rate: string;
  hoursPerDay: string;
  freeWeekdays: number[];
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
  return isNaN(parsed) ? 0 : parsed;
};

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
    startDate: defaultDates.startDate,
    endDate: defaultDates.endDate,
  };
};

const isValidPaymentType = (value: unknown): value is PaymentType =>
  value === "minute" || value === "hour" || value === "day" || value === "monthly";

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
    startDate: typeof saved.startDate === "string" ? saved.startDate : defaultState.startDate,
    endDate: typeof saved.endDate === "string" ? saved.endDate : defaultState.endDate,
  };
};

export function IncomeForm({ onSubmit }: IncomeFormProps) {
  const initialState = getDefaultFormState();
  const [paymentType, setPaymentType] = useState<PaymentType>(initialState.paymentType);
  const [rate, setRate] = useState<string>(initialState.rate);
  const [hoursPerDay, setHoursPerDay] = useState<string>(initialState.hoursPerDay);
  const [freeWeekdays, setFreeWeekdays] = useState<number[]>(initialState.freeWeekdays);
  const [startDate, setStartDate] = useState<string>(initialState.startDate);
  const [endDate, setEndDate] = useState<string>(initialState.endDate);
  const [isFormLoaded, setIsFormLoaded] = useState(false);

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
      startDate,
      endDate,
    };
    localStorage.setItem("usd-planner-form-state", JSON.stringify(formState));
  }, [paymentType, rate, hoursPerDay, freeWeekdays, startDate, endDate, isFormLoaded]);

  const handleWeekdayToggle = (day: number) => {
    setFreeWeekdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      paymentType,
      rate: parseNumber(rate),
      hoursPerDay: parseNumber(hoursPerDay),
      freeWeekdays,
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="paymentType" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Tipo de pago
        </label>
        <select
          id="paymentType"
          value={paymentType}
          onChange={(e) => setPaymentType(e.target.value as PaymentType)}
          className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="minute">Por minuto</option>
          <option value="hour">Por hora</option>
          <option value="day">Por día</option>
          <option value="monthly">Mensual fijo</option>
        </select>
      </div>

      <div>
        <label htmlFor="rate" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Monto ({getRateLabel()})
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium">
            $
          </span>
          <input
            id="rate"
            type="text"
            inputMode="decimal"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            placeholder="0.00"
            className="w-full pl-8 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="hoursPerDay" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Horas por día
        </label>
        <input
          id="hoursPerDay"
          type="text"
          inputMode="decimal"
          value={hoursPerDay}
          onChange={(e) => setHoursPerDay(e.target.value)}
          placeholder="0"
          className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
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
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? "bg-blue-500 text-white shadow-md hover:bg-blue-600"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                <span className="text-sm font-semibold">{day.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="startDate" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Fecha de inicio
          </label>
          <input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            required
          />
        </div>

        <div>
          <label htmlFor="endDate" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Fecha de fin
          </label>
          <input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            required
          />
        </div>
      </div>

      {startDate && endDate && new Date(endDate) < new Date(startDate) && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" suppressHydrationWarning>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-700 dark:text-red-300 text-sm font-medium">
            La fecha de fin no puede ser anterior a la fecha de inicio.
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={!startDate || !endDate || new Date(endDate) < new Date(startDate)}
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-300 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
      >
        Calcular ingresos
      </button>
    </form>
  );
}
