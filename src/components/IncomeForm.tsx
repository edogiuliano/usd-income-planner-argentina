"use client";

import { useState } from "react";
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

export function IncomeForm({ onSubmit }: IncomeFormProps) {
  const [paymentType, setPaymentType] = useState<PaymentType>("hour");
  const [rate, setRate] = useState<string>("25");
  const [hoursPerDay, setHoursPerDay] = useState<string>("8");
  const [freeWeekdays, setFreeWeekdays] = useState<number[]>([0, 6]);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

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
        <label htmlFor="paymentType" className="block text-sm font-semibold text-gray-700 mb-2">
          Tipo de pago
        </label>
        <select
          id="paymentType"
          value={paymentType}
          onChange={(e) => setPaymentType(e.target.value as PaymentType)}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
        >
          <option value="minute">Por minuto</option>
          <option value="hour">Por hora</option>
          <option value="day">Por día</option>
          <option value="monthly">Mensual fijo</option>
        </select>
      </div>

      <div>
        <label htmlFor="rate" className="block text-sm font-semibold text-gray-700 mb-2">
          Monto ({getRateLabel()})
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
            $
          </span>
          <input
            id="rate"
            type="text"
            inputMode="decimal"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            placeholder="0.00"
            className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="hoursPerDay" className="block text-sm font-semibold text-gray-700 mb-2">
          Horas por día
        </label>
        <input
          id="hoursPerDay"
          type="text"
          inputMode="decimal"
          value={hoursPerDay}
          onChange={(e) => setHoursPerDay(e.target.value)}
          placeholder="0"
          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? "bg-blue-500 text-white shadow-md hover:bg-blue-600"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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
          <label htmlFor="startDate" className="block text-sm font-semibold text-gray-700 mb-2">
            Fecha de inicio
          </label>
          <input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            required
          />
        </div>

        <div>
          <label htmlFor="endDate" className="block text-sm font-semibold text-gray-700 mb-2">
            Fecha de fin
          </label>
          <input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            required
          />
        </div>
      </div>

      {startDate && endDate && new Date(endDate) < new Date(startDate) && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-700 text-sm font-medium">
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
