"use client";

import { useEffect, useState } from "react";
import type { CountryCode } from "@/types";

type SubmitStatus = "idle" | "loading" | "success" | "error";

interface WhatsAppAlertSignupProps {
  countryCode: CountryCode;
}

const STORAGE_KEY = "usd-planner-whatsapp-phone";

function normalizePhone(value: string) {
  return value.replace(/[^\d+]/g, "").trim();
}

export function WhatsAppAlertSignup({ countryCode }: WhatsAppAlertSignupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [message, setMessage] = useState("");

  const isArgentina = countryCode === "ar";

  useEffect(() => {
    const savedPhone = localStorage.getItem(STORAGE_KEY);
    if (savedPhone) {
      setPhone(savedPhone);
    }
  }, []);

  if (!isArgentina) {
    return null;
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const normalizedPhone = normalizePhone(phone);

    if (!normalizedPhone || normalizedPhone.length < 8) {
      setStatus("error");
      setMessage("Revisá el número. Usá código de país, por ejemplo +549...");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/whatsapp-alerts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: normalizedPhone,
          country: "ar",
          source: "rates-panel",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "No se pudo registrar la alerta.");
      }

      localStorage.setItem(STORAGE_KEY, normalizedPhone);
      setPhone(normalizedPhone);
      setStatus("success");
      setMessage(data.message ?? "Listo. Te avisamos por WhatsApp cuando el dólar toque máximo mensual.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "No se pudo registrar la alerta.");
    }
  };

  return (
    <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50/70 dark:border-emerald-900 dark:bg-emerald-950/30">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div>
          <p className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
            ¿Querés alertas por WhatsApp?
          </p>
          <p className="text-xs text-emerald-700 dark:text-emerald-300">
            Te avisamos si el dólar cripto toca el máximo de los últimos 30 días.
          </p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-emerald-700 shadow-sm dark:bg-gray-900 dark:text-emerald-300">
          {isOpen ? "Cerrar" : "Activar"}
        </span>
      </button>

      {isOpen && (
        <form onSubmit={handleSubmit} className="border-t border-emerald-200 p-4 dark:border-emerald-900">
          <label htmlFor="whatsapp-phone" className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
            Número de WhatsApp
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="whatsapp-phone"
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+549..."
              className="min-w-0 flex-1 rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-gray-900 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-emerald-900 dark:bg-gray-800 dark:text-white dark:focus:ring-emerald-950"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
            >
              {status === "loading" ? "Guardando..." : "Recibir alertas"}
            </button>
          </div>

          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Solo Argentina por ahora. No guardamos tu número en esta web: se envía al workflow de n8n.
          </p>

          {message && (
            <p
              className={`mt-3 rounded-lg px-3 py-2 text-sm font-medium ${
                status === "success"
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
                  : "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200"
              }`}
            >
              {message}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
