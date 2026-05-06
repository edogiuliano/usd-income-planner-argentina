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

export function IncomeForm({ onSubmit }: IncomeFormProps) {
  const [paymentType, setPaymentType] = useState<PaymentType>("hour");
  const [rate, setRate] = useState<number>(25);
  const [hoursPerDay, setHoursPerDay] = useState<number>(8);
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
      rate,
      hoursPerDay,
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
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="paymentType" className="block text-sm font-semibold text-gray-700 mb-2">
          Tipo de pago
        </label>
        <select
          id="paymentType"
          value={paymentType}
          onChange={(e) => setPaymentType(e.target.value as PaymentType)}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
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
            type="number"
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            min="0"
            step="0.01"
            className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
          type="number"
          value={hoursPerDay}
          onChange={(e) => setHoursPerDay(Number(e.target.value))}
          min="0"
          max="24"
          step="0.5"
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Días libres semanales
        </label>
        <div className="grid grid-cols-7 gap-2">
          {WEEKDAYS.map((day) => (
            <label
              key={day.value}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg cursor-pointer transition-colors ${
                freeWeekdays.includes(day.value)
                  ? "bg-blue-100 border-2 border-blue-500"
                  : "bg-gray-50 border-2 border-gray-200 hover:border-gray-300"
              }`}
            >
              <input
                type="checkbox"
                checked={freeWeekdays.includes(day.value)}
                onChange={() => handleWeekdayToggle(day.value)}
                className="w-4 h-4 accent-blue-600"
              />
              <span className="text-xs font-medium text-gray-700">{day.label}</span>
            </label>
          ))}
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
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-300 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
      >
        Calcular ingresos
      </button>
    </form>
  );
}
