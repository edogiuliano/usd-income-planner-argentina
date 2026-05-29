"use client";

import { useEffect, useMemo, useState } from "react";

type DockPanel = "feedback" | "share";
type SubmitStatus = "idle" | "loading" | "success" | "error";

const PUBLIC_URL = "https://calculadora-ingresos-usd.vercel.app/";
const SHARE_TEXT =
  "Estoy usando esta calculadora para convertir mi sueldo en USD a pesos y ver cotizaciones actualizadas.";
const FULL_SHARE_TEXT = `${SHARE_TEXT} ${PUBLIC_URL}`;

function IconMessage() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.9 9.9 0 0 1-4.255-.949L3 20l1.395-3.72A7.4 7.4 0 0 1 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8Z" />
    </svg>
  );
}

function IconShare() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12v7a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-7M16 6l-4-4m0 0L8 6m4-4v14" />
    </svg>
  );
}

function IconWhatsApp() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2A9.88 9.88 0 0 0 2.1 11.82c0 1.73.45 3.42 1.3 4.91L2 22l5.4-1.37a10.02 10.02 0 0 0 4.64 1.14A9.88 9.88 0 0 0 22 11.95C22 6.46 17.54 2 12.04 2Zm0 17.98a8.23 8.23 0 0 1-4.19-1.14l-.3-.18-3.2.82.86-3.08-.2-.32a8.03 8.03 0 0 1-1.25-4.26 8.24 8.24 0 0 1 8.28-8.04 8.18 8.18 0 0 1 8.2 8.17 8.24 8.24 0 0 1-8.2 8.03Zm4.52-6.02c-.25-.12-1.47-.72-1.7-.8-.23-.09-.4-.13-.57.12-.17.25-.65.8-.8.97-.15.16-.3.18-.55.06-.25-.13-1.06-.39-2.02-1.24a7.6 7.6 0 0 1-1.4-1.74c-.15-.25-.02-.38.11-.51.12-.12.25-.3.38-.44.13-.15.17-.25.25-.42.09-.16.04-.31-.02-.44-.06-.12-.57-1.37-.78-1.88-.2-.49-.41-.42-.57-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.6.13.17 1.78 2.72 4.3 3.8.6.26 1.07.42 1.44.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.16-.48-.29Z" />
    </svg>
  );
}

function IconFacebook() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22 12.06C22 6.51 17.52 2 12 2S2 6.51 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.84c0-2.52 1.49-3.91 3.77-3.91 1.09 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.44 2.91h-2.34V22C18.34 21.24 22 17.08 22 12.06Z" />
    </svg>
  );
}

function IconX() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.9 2.25h3.05l-6.67 7.63 7.84 10.37h-6.14l-4.8-6.28-5.5 6.28H3.63l7.13-8.15L3.25 2.25h6.3l4.35 5.75 5-5.75Zm-1.07 16.17h1.69L8.64 3.98H6.83l11 14.44Z" />
    </svg>
  );
}

function IconLinkedIn() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.41v1.56h.05a3.74 3.74 0 0 1 3.37-1.85c3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.32 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13Zm1.78 13.02H3.54V9H7.1v11.45ZM22.23 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.72V1.72C24 .77 23.21 0 22.23 0Z" />
    </svg>
  );
}

function IconInstagram() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.42.56.22.96.48 1.38.9.42.42.68.82.9 1.38.17.43.37 1.06.42 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.42 2.23a3.7 3.7 0 0 1-.9 1.38 3.7 3.7 0 0 1-1.38.9c-.43.17-1.06.37-2.23.42-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.42a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.17-.43-.37-1.06-.42-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.42-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.43-.17 1.06-.37 2.23-.42C8.42 2.17 8.8 2.16 12 2.16ZM12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63a5.86 5.86 0 0 0-2.12 1.38A5.86 5.86 0 0 0 .64 4.14C.34 4.9.14 5.78.08 7.05.02 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.31.78.72 1.45 1.38 2.12.67.66 1.34 1.07 2.12 1.38.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56a5.86 5.86 0 0 0 2.12-1.38 5.86 5.86 0 0 0 1.38-2.12c.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.86 5.86 0 0 0-1.38-2.12A5.86 5.86 0 0 0 19.86.64c-.76-.3-1.64-.5-2.91-.56C15.67.02 15.26 0 12 0Zm0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm7.85-10.4a1.44 1.44 0 1 1-2.88 0 1.44 1.44 0 0 1 2.88 0Z" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}

function buildShareLinks() {
  const encodedUrl = encodeURIComponent(PUBLIC_URL);
  const encodedText = encodeURIComponent(SHARE_TEXT);
  const encodedFullText = encodeURIComponent(FULL_SHARE_TEXT);

  return [
    {
      name: "WhatsApp",
      icon: <IconWhatsApp />,
      href: `https://wa.me/?text=${encodedFullText}`,
    },
    {
      name: "Facebook",
      icon: <IconFacebook />,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
    },
    {
      name: "X / Twitter",
      icon: <IconX />,
      href: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    },
    {
      name: "LinkedIn",
      icon: <IconLinkedIn />,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    },
  ];
}

export function FeedbackShareDock() {
  const [activePanel, setActivePanel] = useState<DockPanel | null>(null);
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const [showNudge, setShowNudge] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [contact, setContact] = useState("");
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const firstNudge = window.setTimeout(() => {
      setShowNudge(true);
    }, 7000);

    const nudgeInterval = window.setInterval(() => {
      setShowNudge((current) => (isWidgetOpen ? current : true));
    }, 45000);

    return () => {
      window.clearTimeout(firstNudge);
      window.clearInterval(nudgeInterval);
    };
  }, [isWidgetOpen]);

  useEffect(() => {
    if (isWidgetOpen) {
      setShowNudge(false);
    }
  }, [isWidgetOpen]);

  const shareLinks = useMemo(() => buildShareLinks(), []);

  const openPanel = (panel: DockPanel) => {
    setIsWidgetOpen(true);
    setActivePanel(panel);
    setShowNudge(false);
  };

  const closeWidget = () => {
    setIsWidgetOpen(false);
    setActivePanel(null);
    setMessage("");
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(FULL_SHARE_TEXT);
      setMessage("Mensaje copiado. Pegalo donde quieras compartirlo.");
      setStatus("success");
    } catch {
      setMessage("No pude copiar el mensaje automaticamente.");
      setStatus("error");
    }
  };

  const handleNativeShare = async () => {
    if (!navigator.share) {
      await handleCopyText();
      return;
    }

    try {
      await navigator.share({
        title: "Calculadora de Sueldo USD",
        text: SHARE_TEXT,
        url: PUBLIC_URL,
      });
    } catch {
      // User cancelled the native share sheet.
    }
  };

  const handleInstagramShare = async () => {
    await handleCopyText();
    window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedFeedback = feedback.trim();

    if (trimmedFeedback.length < 5) {
      setStatus("error");
      setMessage("Contame un poquito mas para que el feedback sirva.");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          feedback: trimmedFeedback,
          contact: contact.trim(),
          pageUrl: PUBLIC_URL,
          source: "floating-widget",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "No se pudo enviar el feedback.");
      }

      setFeedback("");
      setContact("");
      setStatus("success");
      setMessage(data.message ?? "Gracias. Me ayuda un monton para seguir mejorando la calculadora.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "No se pudo enviar el feedback.");
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex max-w-[calc(100vw-2rem)] flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {showNudge && !isWidgetOpen && (
        <div className="max-w-[18rem] rounded-2xl border border-gray-200 bg-white/95 p-3 shadow-xl shadow-blue-950/15 backdrop-blur transition-all dark:border-gray-700 dark:bg-gray-900/95">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
              <IconMessage />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 dark:text-white">Estoy puliendo esta calculadora</p>
              <p className="mt-0.5 text-xs leading-5 text-gray-600 dark:text-gray-300">
                Si viste algo raro, mandame feedback en dos segundos.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowNudge(false)}
              className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 active:scale-95 dark:hover:bg-gray-800 dark:hover:text-gray-100"
              aria-label="Cerrar aviso de feedback"
            >
              <IconClose />
            </button>
          </div>
        </div>
      )}

      {isWidgetOpen && (
        <div className="w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-gray-200 bg-white/95 shadow-2xl shadow-blue-950/20 backdrop-blur dark:border-gray-700 dark:bg-gray-900/95">
          <div className="flex items-start justify-between gap-3 border-b border-gray-100 p-4 dark:border-gray-800">
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">Ayudame a mejorarla</p>
              <p className="mt-1 text-xs leading-5 text-gray-600 dark:text-gray-300">
                Feedback rapido o compartila con alguien que cobre en USD.
              </p>
            </div>
            <button
              type="button"
              onClick={closeWidget}
              className="rounded-xl border border-gray-200 p-2 text-gray-500 transition hover:bg-gray-50 hover:text-gray-900 active:scale-95 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
              aria-label="Cerrar panel"
            >
              <IconClose />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 p-3">
            <button
              type="button"
              onClick={() => openPanel("feedback")}
              className={`rounded-xl px-4 py-2.5 text-sm font-bold transition active:scale-[0.98] ${
                activePanel === "feedback"
                  ? "bg-blue-600 text-white"
                  : "border border-gray-200 text-gray-800 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              Feedback
            </button>
            <button
              type="button"
              onClick={() => openPanel("share")}
              className={`rounded-xl px-4 py-2.5 text-sm font-bold transition active:scale-[0.98] ${
                activePanel === "share"
                  ? "bg-gray-900 text-white dark:bg-blue-600"
                  : "border border-gray-200 text-gray-800 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              Compartir
            </button>
          </div>

          {activePanel === "feedback" && (
            <form onSubmit={handleSubmit} className="border-t border-gray-100 p-3 dark:border-gray-800">
              <label htmlFor="feedback-message" className="mb-2 block text-sm font-semibold text-gray-800 dark:text-gray-200">
                Tu comentario
              </label>
              <textarea
                id="feedback-message"
                value={feedback}
                onChange={(event) => setFeedback(event.target.value)}
                rows={4}
                placeholder="Ej: faltaria comparar dos ciclos, el grafico no se ve claro en celu..."
                className="w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:ring-blue-950"
              />
              <input
                value={contact}
                onChange={(event) => setContact(event.target.value)}
                placeholder="Email o WhatsApp opcional"
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:ring-blue-950"
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="mt-3 w-full rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-gray-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gray-400 dark:bg-blue-600 dark:hover:bg-blue-700"
              >
                {status === "loading" ? "Enviando..." : "Enviar feedback"}
              </button>
            </form>
          )}

          {activePanel === "share" && (
            <div className="border-t border-gray-100 p-3 dark:border-gray-800">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs leading-5 text-gray-600 dark:border-gray-700 dark:bg-gray-800/70 dark:text-gray-300">
                {FULL_SHARE_TEXT}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {shareLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-bold text-gray-800 transition hover:bg-gray-50 active:scale-[0.98] dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-800"
                  >
                    <span className="flex h-6 min-w-6 items-center justify-center rounded-lg bg-gray-900 text-white dark:bg-gray-700">
                      {link.icon}
                    </span>
                    {link.name}
                  </a>
                ))}
                <button
                  type="button"
                  onClick={handleInstagramShare}
                  className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-bold text-gray-800 transition hover:bg-gray-50 active:scale-[0.98] dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-800"
                >
                  <span className="flex h-6 min-w-6 items-center justify-center rounded-lg bg-gray-900 text-white dark:bg-gray-700">
                    <IconInstagram />
                  </span>
                  Instagram
                </button>
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 active:scale-[0.98]"
                >
                  <IconShare />
                  Compartir
                </button>
              </div>
            </div>
          )}

          {message && (
            <p
              className={`border-t px-3 py-2 text-sm font-medium dark:border-gray-800 ${
                status === "success"
                  ? "border-emerald-100 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
                  : "border-red-100 bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-200"
              }`}
            >
              {message}
            </p>
          )}
        </div>
      )}

      {!isWidgetOpen && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => openPanel("share")}
            className="hidden rounded-full border border-gray-200 bg-white/95 px-4 py-3 text-sm font-bold text-gray-800 shadow-lg shadow-blue-950/10 backdrop-blur transition hover:-translate-y-0.5 hover:bg-gray-50 active:scale-95 dark:border-gray-700 dark:bg-gray-900/95 dark:text-gray-100 dark:hover:bg-gray-800 sm:inline-flex"
          >
            Compartir
          </button>
          <button
            type="button"
            onClick={() => openPanel("feedback")}
            className="group flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl shadow-blue-950/25 transition hover:-translate-y-0.5 hover:bg-blue-700 active:scale-95"
            aria-label="Abrir feedback"
          >
            <IconMessage />
            <span className="absolute -right-0.5 -top-0.5 h-4 w-4 rounded-full border-2 border-white bg-emerald-400 dark:border-gray-900" />
          </button>
        </div>
      )}
    </div>
  );
}
