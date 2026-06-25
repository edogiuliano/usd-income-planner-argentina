"use client";

import { useEffect, useMemo, useState } from "react";
import { calculatePtoBalance, evaluateVacationPlan } from "@/lib/pto";
import { generateMonthlyProjections } from "@/lib/projections";
import { formatCurrency, formatNumber, formatUsd } from "@/lib/formatters";
import type {
  ExchangeRate,
  MonthlyProjection,
  PaymentType,
  ProjectionHorizon,
  TimeOffDays,
  VacationPlan,
  VacationProjectionInput,
} from "@/types";

type CalculationData = {
  paymentType: PaymentType;
  rate: number;
  hoursPerDay: number;
  freeWeekdays: number[];
  timeOffDays: TimeOffDays;
  startDate: string;
  endDate: string;
};

interface ProjectionPanelProps {
  calculationData: CalculationData | null;
  hireDate: string;
  usedPtoDays: number;
  primaryRate: ExchangeRate | null;
}

type VacationModalProps = {
  projections: MonthlyProjection[];
  selectedMonthKey: string;
  selectedVacationDates: string[];
  keepUncoveredAsVto: boolean;
  vacationPlan: VacationPlan | null;
  ptoAvailableDays: number;
  freeWeekdays: number[];
  vacationEnabled: boolean;
  onMonthChange: (monthKey: string) => void;
  onToggleDate: (value: string) => void;
  onKeepUncoveredAsVtoChange: (value: boolean) => void;
  onApply: () => void;
  onRemove: () => void;
  onClose: () => void;
};

const getTodayIsoDate = () => new Date().toISOString().split("T")[0];

const toIsoDate = (date: Date) => date.toISOString().split("T")[0];

const WEEKDAY_LABELS = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];

const formatCycleDate = (value: string) => {
  const [year, month, day] = value.split("-");
  return day && month && year ? `${day}/${month}` : value;
};

const formatFullDate = (value: string) => {
  const [year, month, day] = value.split("-");
  return day && month && year ? `${day}/${month}/${year}` : value;
};

const getWeekday = (value: string) => new Date(`${value}T12:00:00`).getDay();

const getCycleDates = (startDate: string, endDate: string) => {
  const start = new Date(`${startDate}T12:00:00`);
  const end = new Date(`${endDate}T12:00:00`);
  const dates: string[] = [];

  for (const current = new Date(start); current <= end; current.setDate(current.getDate() + 1)) {
    dates.push(toIsoDate(current));
  }

  return dates;
};

const getDefaultVacationDates = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 11);

  return {
    startDate: toIsoDate(start),
    endDate: toIsoDate(end),
  };
};

function VacationModal({
  projections,
  selectedMonthKey,
  selectedVacationDates,
  keepUncoveredAsVto,
  vacationPlan,
  ptoAvailableDays,
  freeWeekdays,
  vacationEnabled,
  onMonthChange,
  onToggleDate,
  onKeepUncoveredAsVtoChange,
  onApply,
  onRemove,
  onClose,
}: VacationModalProps) {
  const selectedProjection = projections.find((projection) => projection.monthKey === selectedMonthKey);
  const shouldShowShortage = vacationPlan && vacationPlan.missingPtoDays > 0;
  const selectedDateSet = new Set(selectedVacationDates);
  const cycleDates = selectedProjection ? getCycleDates(selectedProjection.startDate, selectedProjection.endDate) : [];
  const leadingEmptyDays = cycleDates[0] ? getWeekday(cycleDates[0]) : 0;
  const selectedRangeText =
    selectedVacationDates.length > 0
      ? `${formatFullDate(selectedVacationDates[0])} - ${formatFullDate(selectedVacationDates[selectedVacationDates.length - 1])}`
      : "Elegí los días en el calendario";

  return (
    <div className="fixed inset-0 z-50 flex min-h-[100dvh] items-end justify-center overflow-y-auto bg-zinc-950/60 px-2 py-2 backdrop-blur-sm sm:items-center sm:px-3 sm:py-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="vacation-modal-title"
        className="flex max-h-[calc(100dvh-1rem)] w-full max-w-2xl flex-col overflow-hidden rounded-[1.35rem] bg-white shadow-[0_30px_100px_-40px_rgba(0,0,0,0.8)] ring-1 ring-zinc-200 dark:bg-[#15171d] dark:ring-white/10 sm:rounded-[1.75rem]"
      >
        <div className="shrink-0 flex items-start justify-between gap-4 border-b border-zinc-200 px-4 py-3 dark:border-white/10 sm:px-5 sm:py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-400">
              🌴 Vacaciones
            </p>
            <h3 id="vacation-modal-title" className="mt-1 text-xl font-black tracking-tight text-zinc-950 dark:text-zinc-50">
              Planificar PTO / VTO
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar vacaciones"
            className="grid size-10 place-items-center rounded-2xl bg-zinc-100 text-lg font-black text-zinc-700 transition hover:-translate-y-0.5 active:scale-[0.98] dark:bg-zinc-800 dark:text-zinc-100"
          >
            ×
          </button>
        </div>

        <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto overscroll-contain p-4 sm:p-5">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
            <div>
              <label htmlFor="vacationMonth" className="mb-2 block text-sm font-bold text-zinc-800 dark:text-zinc-200">
                Mes / ciclo
              </label>
              <select
                id="vacationMonth"
                value={selectedMonthKey}
                onChange={(event) => onMonthChange(event.target.value)}
                className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm font-black text-zinc-950 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:ring-emerald-900"
              >
                {projections.map((projection) => (
                  <option key={projection.monthKey} value={projection.monthKey}>
                    {projection.monthLabel} · {formatCycleDate(projection.startDate)}-{formatCycleDate(projection.endDate)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <p className="mb-2 text-sm font-bold text-zinc-800 dark:text-zinc-200">Seleccionados</p>
              <p className="rounded-2xl bg-zinc-100 px-4 py-3 text-sm font-black text-zinc-800 dark:bg-[#20242d] dark:text-zinc-100">
                {selectedVacationDates.length} dias
              </p>
            </div>
          </div>

          <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 p-2 dark:border-white/10 dark:bg-[#101218] sm:p-3">
            <div className="grid grid-cols-7 gap-1 pb-2 text-center text-[11px] font-black text-zinc-500 dark:text-zinc-400">
              {WEEKDAY_LABELS.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: leadingEmptyDays }, (_, index) => (
                <span key={`empty-${index}`} className="aspect-square" />
              ))}
              {cycleDates.map((date) => {
                const dayNumber = date.split("-")[2];
                const isSelected = selectedDateSet.has(date);
                const isConfiguredOff = freeWeekdays.includes(getWeekday(date));

                return (
                  <button
                    key={date}
                    type="button"
                    onClick={() => onToggleDate(date)}
                    className={`min-h-9 rounded-xl text-xs font-black transition hover:-translate-y-0.5 active:scale-[0.96] sm:aspect-square sm:text-sm ${
                      isSelected
                        ? "bg-emerald-600 text-white shadow-[0_12px_24px_-16px_rgba(16,185,129,0.9)]"
                        : isConfiguredOff
                          ? "bg-blue-50 text-blue-700 ring-1 ring-blue-100 hover:bg-blue-100 dark:bg-blue-950/35 dark:text-blue-200 dark:ring-blue-900"
                          : "bg-white text-zinc-800 ring-1 ring-zinc-200 hover:bg-emerald-50 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-800 dark:hover:bg-zinc-800"
                    }`}
                    title={formatFullDate(date)}
                  >
                    <span>{dayNumber}</span>
                    {isConfiguredOff && <span className="block text-[9px] leading-none opacity-75">OFF</span>}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              {selectedRangeText}
            </p>
          </div>

          {vacationPlan && (
            <div className="grid gap-3 rounded-[1.25rem] bg-zinc-50 p-4 text-sm dark:bg-zinc-950/70 sm:grid-cols-4">
              <div>
                <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400">PTO disponibles</p>
                <p className="mt-1 font-mono text-2xl font-black text-blue-700 dark:text-blue-300">
                  {formatNumber(vacationPlan.availablePtoDays)}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Laborales</p>
                <p className="mt-1 font-mono text-2xl font-black text-zinc-950 dark:text-zinc-50">
                  {formatNumber(vacationPlan.vacationWorkDays)}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400">PTO usados</p>
                <p className="mt-1 font-mono text-2xl font-black text-emerald-700 dark:text-emerald-400">
                  {formatNumber(vacationPlan.ptoDays)}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Días off</p>
                <p className="mt-1 font-mono text-2xl font-black text-zinc-950 dark:text-zinc-50">
                  {formatNumber(vacationPlan.vacationFreeDays)}
                </p>
              </div>
            </div>
          )}

          {!vacationPlan && (
            <div className="rounded-[1.25rem] bg-blue-50 p-4 text-sm font-bold text-blue-900 dark:bg-blue-950/30 dark:text-blue-200">
              Tenes {formatNumber(ptoAvailableDays)} PTO disponibles para este ciclo. Selecciona uno o mas dias para estimar el uso.
            </div>
          )}

          {shouldShowShortage && (
            <div className="rounded-[1.25rem] border border-amber-300 bg-amber-50 p-4 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
              <p className="text-sm font-black">
                ⚠️ Te faltan {formatNumber(vacationPlan.missingPtoDays)} PTO para cubrir este rango.
              </p>
              {vacationPlan.nextMissingPtoDate && (
                <p className="mt-1 text-xs font-semibold leading-5">
                  Recién tendrías ese PTO faltante el {formatFullDate(vacationPlan.nextMissingPtoDate)}.
                </p>
              )}
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => onKeepUncoveredAsVtoChange(true)}
                  className={`rounded-xl px-3 py-2 text-sm font-black transition active:scale-[0.98] ${
                    keepUncoveredAsVto
                      ? "bg-amber-900 text-white dark:bg-amber-200 dark:text-amber-950"
                      : "bg-white text-amber-950 ring-1 ring-amber-200 dark:bg-zinc-950 dark:text-amber-100 dark:ring-amber-900"
                  }`}
                >
                  Mantener y poner VTO
                </button>
                <button
                  type="button"
                  onClick={() => onKeepUncoveredAsVtoChange(false)}
                  className={`rounded-xl px-3 py-2 text-sm font-black transition active:scale-[0.98] ${
                    !keepUncoveredAsVto
                      ? "bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950"
                      : "bg-white text-zinc-700 ring-1 ring-zinc-200 dark:bg-zinc-950 dark:text-zinc-200 dark:ring-zinc-800"
                  }`}
                >
                  Cambiar fechas
                </button>
              </div>
            </div>
          )}

          <p className="text-xs leading-5 text-zinc-500 dark:text-zinc-400">
            Estimación orientativa. No reemplaza políticas internas de la empresa ni obliga a pedir esos días.
          </p>
        </div>

        <div className="shrink-0 grid gap-2 border-t border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-white/10 dark:bg-[#101218] sm:grid-cols-[auto_1fr_auto] sm:px-5 sm:py-4">
          <button
            type="button"
            onClick={onRemove}
            className="rounded-2xl px-4 py-3 text-sm font-black text-zinc-600 ring-1 ring-zinc-200 transition hover:-translate-y-0.5 active:scale-[0.98] dark:text-zinc-300 dark:ring-zinc-800"
          >
            Quitar
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl px-4 py-3 text-sm font-black text-zinc-600 transition hover:bg-zinc-100 active:scale-[0.98] dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onApply}
            disabled={selectedVacationDates.length === 0}
            className="rounded-2xl bg-zinc-950 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 dark:bg-zinc-50 dark:text-zinc-950"
          >
            {vacationEnabled ? "Actualizar vacaciones" : "Aplicar vacaciones"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ProjectionPanel({
  calculationData,
  hireDate,
  usedPtoDays,
  primaryRate,
}: ProjectionPanelProps) {
  const defaultVacationDates = getDefaultVacationDates();
  const [horizon, setHorizon] = useState<ProjectionHorizon>("3");
  const [selectedVacationMonthKey, setSelectedVacationMonthKey] = useState("");
  const [vacationStartDate, setVacationStartDate] = useState(defaultVacationDates.startDate);
  const [vacationEndDate, setVacationEndDate] = useState(defaultVacationDates.endDate);
  const [selectedVacationDates, setSelectedVacationDates] = useState<string[]>([]);
  const [keepUncoveredAsVto, setKeepUncoveredAsVto] = useState(false);
  const [vacationEnabled, setVacationEnabled] = useState(false);
  const [isVacationModalOpen, setIsVacationModalOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("usd-planner-projection-state");

    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Partial<{
          horizon: ProjectionHorizon;
          selectedVacationMonthKey: string;
          vacationStartDate: string;
          vacationEndDate: string;
          selectedVacationDates: string[];
          keepUncoveredAsVto: boolean;
          vacationEnabled: boolean;
        }>;

        if (parsed.horizon === "3" || parsed.horizon === "6" || parsed.horizon === "12" || parsed.horizon === "year") {
          setHorizon(parsed.horizon);
        }
        if (typeof parsed.selectedVacationMonthKey === "string") {
          setSelectedVacationMonthKey(parsed.selectedVacationMonthKey);
        }
        if (typeof parsed.vacationStartDate === "string") {
          setVacationStartDate(parsed.vacationStartDate);
        }
        if (typeof parsed.vacationEndDate === "string") {
          setVacationEndDate(parsed.vacationEndDate);
        }
        if (Array.isArray(parsed.selectedVacationDates)) {
          setSelectedVacationDates(
            parsed.selectedVacationDates.filter((date): date is string => typeof date === "string").sort(),
          );
        }
        if (typeof parsed.keepUncoveredAsVto === "boolean") {
          setKeepUncoveredAsVto(parsed.keepUncoveredAsVto);
        }
        if (typeof parsed.vacationEnabled === "boolean") {
          setVacationEnabled(parsed.vacationEnabled);
        }
      } catch {
        localStorage.removeItem("usd-planner-projection-state");
      }
    }

    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    localStorage.setItem(
      "usd-planner-projection-state",
      JSON.stringify({
        horizon,
        selectedVacationMonthKey,
        vacationStartDate,
        vacationEndDate,
        selectedVacationDates,
        keepUncoveredAsVto,
        vacationEnabled,
      }),
    );
  }, [
    horizon,
    selectedVacationMonthKey,
    vacationStartDate,
    vacationEndDate,
    selectedVacationDates,
    keepUncoveredAsVto,
    vacationEnabled,
    isLoaded,
  ]);

  const draftVacation: VacationProjectionInput | undefined = useMemo(
    () =>
      vacationStartDate && vacationEndDate && selectedVacationDates.length > 0
        ? {
            startDate: selectedVacationDates[0],
            endDate: selectedVacationDates[selectedVacationDates.length - 1],
            selectedDates: selectedVacationDates,
            keepUncoveredAsVto,
          }
        : undefined,
    [vacationStartDate, vacationEndDate, selectedVacationDates, keepUncoveredAsVto],
  );

  const vacation = vacationEnabled ? draftVacation : undefined;

  const vacationPlan = useMemo(() => {
    if (!calculationData || !draftVacation) return null;

    return evaluateVacationPlan({
      vacationStartDate: draftVacation.startDate,
      vacationEndDate: draftVacation.endDate,
      selectedDates: draftVacation.selectedDates,
      freeWeekdays: calculationData.freeWeekdays,
      hireDate,
      usedPtoDays,
      keepUncoveredAsVto,
    });
  }, [calculationData, draftVacation, hireDate, usedPtoDays, keepUncoveredAsVto]);

  const projections = useMemo(() => {
    if (!calculationData) return [];

    return generateMonthlyProjections({
      fromDate: getTodayIsoDate(),
      startDate: calculationData.startDate,
      endDate: calculationData.endDate,
      horizon,
      paymentType: calculationData.paymentType,
      rate: calculationData.rate,
      hoursPerDay: calculationData.hoursPerDay,
      freeWeekdays: calculationData.freeWeekdays,
      hireDate,
      usedPtoDays,
      vacation,
    });
  }, [calculationData, horizon, hireDate, usedPtoDays, vacation]);

  useEffect(() => {
    if (projections.length === 0) return;
    if (projections.some((projection) => projection.monthKey === selectedVacationMonthKey)) return;

    setSelectedVacationMonthKey(projections[0].monthKey);
  }, [projections, selectedVacationMonthKey]);

  const handleVacationMonthChange = (monthKey: string) => {
    setSelectedVacationMonthKey(monthKey);

    const selectedProjection = projections.find((projection) => projection.monthKey === monthKey);
    if (!selectedProjection) return;

    setVacationStartDate(selectedProjection.startDate);
    setVacationEndDate(selectedProjection.endDate);
    setSelectedVacationDates([]);
  };

  const handleApplyVacation = () => {
    if (selectedVacationDates.length === 0) return;

    setVacationEnabled(true);
    setIsVacationModalOpen(false);
  };

  const handleRemoveVacation = () => {
    setVacationEnabled(false);
    setIsVacationModalOpen(false);
  };

  const handleToggleVacationDate = (value: string) => {
    setSelectedVacationDates((current) => {
      const next = current.includes(value)
        ? current.filter((date) => date !== value)
        : [...current, value].sort();

      if (next.length > 0) {
        setVacationStartDate(next[0]);
        setVacationEndDate(next[next.length - 1]);
      }

      return next;
    });
  };

  const selectedProjection = projections.find((projection) => projection.monthKey === selectedVacationMonthKey);
  const ptoAvailableDays = calculatePtoBalance({
    hireDate,
    asOfDate: selectedVacationDates[0] ?? selectedProjection?.startDate ?? getTodayIsoDate(),
    usedPtoDays,
  }).availablePtoDays;

  const projectedTotalUsd = projections.reduce(
    (total, projection) => total + projection.income.totalIncomeUsd,
    0,
  );
  const projectedTotalLocal =
    primaryRate && projectedTotalUsd > 0
      ? formatCurrency(projectedTotalUsd * primaryRate.sell, primaryRate.currencyCode, primaryRate.locale)
      : null;

  if (!calculationData) {
    return (
      <section className="mx-auto w-full max-w-4xl rounded-[1.75rem] bg-white p-6 text-center shadow-[0_24px_60px_-38px_rgba(15,23,42,0.55)] ring-1 ring-zinc-200/70 dark:bg-zinc-900 dark:ring-zinc-800">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-400">
          📈 Proyección
        </p>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-zinc-950 dark:text-zinc-50">
          Primero calculá tu sueldo actual
        </h2>
        <p className="mx-auto mt-2 max-w-[56ch] text-sm leading-6 text-zinc-600 dark:text-zinc-300">
          La proyección usa tu tipo de pago, monto, horas por día y días libres semanales.
        </p>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-5xl">
      <div className="rounded-[2rem] bg-white p-5 shadow-[0_24px_70px_-44px_rgba(15,23,42,0.5)] ring-1 ring-zinc-200/70 dark:bg-[#15171d] dark:ring-white/10 sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-400">
              📈 Proyectar
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-3xl">
              Lista mensual de ingresos
            </h2>
            <p className="mt-2 max-w-[62ch] text-sm leading-6 text-zinc-600 dark:text-zinc-300">
              Una vista rápida de cuánto cobrarías mes a mes usando tu configuración actual.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-[auto_auto]">
            <select
              value={horizon}
              onChange={(event) => setHorizon(event.target.value as ProjectionHorizon)}
              aria-label="Horizonte de proyección"
              className="rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm font-black text-zinc-950 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-white/10 dark:bg-[#101218] dark:text-zinc-50 dark:focus:ring-emerald-900"
            >
              <option value="3">3 meses</option>
              <option value="6">6 meses</option>
              <option value="12">12 meses</option>
              <option value="year">Hasta fin de año</option>
            </select>
            <button
              type="button"
              onClick={() => setIsVacationModalOpen(true)}
              className="rounded-2xl bg-zinc-950 px-4 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 active:scale-[0.98] dark:bg-zinc-50 dark:text-zinc-950"
            >
              {vacationEnabled ? "🌴 Editar vacaciones" : "🌴 Agregar vacaciones"}
            </button>
          </div>
        </div>

        <div className="mt-6 rounded-[1.5rem] bg-zinc-950 p-4 text-white dark:bg-[#20242d] dark:text-zinc-50 dark:ring-1 dark:ring-white/10 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300 dark:text-emerald-700">
                Total proyectado
              </p>
              <p className="mt-1 font-mono text-3xl font-black tabular-nums tracking-tight">
                {formatUsd(projectedTotalUsd)}
              </p>
            </div>
            {projectedTotalLocal && (
              <div className="sm:text-right">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-400">
                  Moneda local
                </p>
                <p className="mt-1 font-mono text-xl font-black tabular-nums text-emerald-300 dark:text-emerald-300">
                  {projectedTotalLocal}
                </p>
              </div>
            )}
          </div>
          {vacationEnabled && draftVacation && (
            <p className="mt-3 text-xs font-semibold text-zinc-300 dark:text-zinc-400">
              🌴 Vacaciones aplicadas: {formatNumber(draftVacation.selectedDates?.length ?? 0)} dias seleccionados
            </p>
          )}
        </div>

        <div className="mt-4 overflow-hidden rounded-[1.5rem] border border-zinc-200 bg-zinc-50 dark:border-white/10 dark:bg-[#101218]">
          {projections.map((projection) => {
            const converted = primaryRate
              ? formatCurrency(
                  projection.income.totalIncomeUsd * primaryRate.sell,
                  primaryRate.currencyCode,
                  primaryRate.locale,
                )
              : null;

            return (
              <div
                key={projection.monthKey}
                className="group grid gap-3 border-b border-zinc-200 px-4 py-4 transition last:border-b-0 hover:bg-white dark:border-white/10 dark:hover:bg-[#171a21] sm:grid-cols-[1fr_auto] sm:items-center sm:px-5"
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
                    {projection.monthKey}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-black capitalize tracking-tight text-zinc-950 dark:text-zinc-50">
                      {projection.monthLabel}
                    </h3>
                    {(projection.cycleDays.ptoDays > 0 || projection.cycleDays.vtoDays > 0) && (
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-black text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        🌴 PTO {formatNumber(projection.cycleDays.ptoDays)}
                        {projection.cycleDays.vtoDays > 0 ? ` · VTO ${formatNumber(projection.cycleDays.vtoDays)}` : ""}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                    Ciclo {formatCycleDate(projection.startDate)} - {formatCycleDate(projection.endDate)}
                  </p>
                </div>

                <div className="grid gap-1 sm:text-right">
                  <span className="font-mono text-2xl font-black tabular-nums text-zinc-950 dark:text-zinc-50">
                    {formatUsd(projection.income.totalIncomeUsd)}
                  </span>
                  {converted && (
                    <span className="font-mono text-sm font-black tabular-nums text-emerald-700 dark:text-emerald-400">
                      {converted}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isVacationModalOpen && (
        <VacationModal
          projections={projections}
          selectedMonthKey={selectedVacationMonthKey || projections[0]?.monthKey || ""}
          selectedVacationDates={selectedVacationDates}
          keepUncoveredAsVto={keepUncoveredAsVto}
          vacationPlan={vacationPlan}
          ptoAvailableDays={ptoAvailableDays}
          freeWeekdays={calculationData.freeWeekdays}
          vacationEnabled={vacationEnabled}
          onMonthChange={handleVacationMonthChange}
          onToggleDate={handleToggleVacationDate}
          onKeepUncoveredAsVtoChange={setKeepUncoveredAsVto}
          onApply={handleApplyVacation}
          onRemove={handleRemoveVacation}
          onClose={() => setIsVacationModalOpen(false)}
        />
      )}
    </section>
  );
}
