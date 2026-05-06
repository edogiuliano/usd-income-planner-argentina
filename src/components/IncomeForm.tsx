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
  { value: 0, label: "Domingo" },
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Tipo de pago</label>
        <select
          value={paymentType}
          onChange={(e) => setPaymentType(e.target.value as PaymentType)}
          className="w-full p-2 border rounded"
        >
          <option value="minute">Por minuto</option>
          <option value="hour">Por hora</option>
          <option value="day">Por día</option>
          <option value="monthly">Mensual fijo</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Monto ({getRateLabel()})
        </label>
        <input
          type="number"
          value={rate}
          onChange={(e) => setRate(Number(e.target.value))}
          min="0"
          step="0.01"
          className="w-full p-2 border rounded"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Horas por día
        </label>
        <input
          type="number"
          value={hoursPerDay}
          onChange={(e) => setHoursPerDay(Number(e.target.value))}
          min="0"
          max="24"
          step="0.5"
          className="w-full p-2 border rounded"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Días libres semanales
        </label>
        <div className="grid grid-cols-7 gap-2">
          {WEEKDAYS.map((day) => (
            <label key={day.value} className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={freeWeekdays.includes(day.value)}
                onChange={() => handleWeekdayToggle(day.value)}
                className="w-4 h-4"
              />
              <span className="text-xs">{day.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Fecha de inicio
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Fecha de fin
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
      </div>

      {startDate && endDate && new Date(endDate) < new Date(startDate) && (
        <p className="text-red-500 text-sm">
          La fecha de fin no puede ser anterior a la fecha de inicio.
        </p>
      )}

      <button
        type="submit"
        disabled={!startDate || !endDate || new Date(endDate) < new Date(startDate)}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        Calcular
      </button>
    </form>
  );
}
