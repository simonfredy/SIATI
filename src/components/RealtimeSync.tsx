"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Bell, CheckCircle2, AlertTriangle, RefreshCw, X, Radio, UserCheck, Wrench } from "lucide-react";
import { RealtimeEventPayload } from "@/lib/realtime";

interface ToastNotification extends RealtimeEventPayload {
  id: string;
}

/**
 * Sintesis Audio Menggunakan Web Audio API Bawaan Browser
 * Menghasilkan nada lonceng notifikasi elegan tanpa perlu download file .mp3 eksternal.
 */
function playNotificationChime(isEmergency: boolean = false) {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (isEmergency) {
      // Nada Darurat / P1: Dua beep tegas berurutan
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(880, now); // A5
      gain1.gain.setValueAtTime(0.15, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.18);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(1046.5, now + 0.2); // C6
      gain2.gain.setValueAtTime(0.2, now + 0.2);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.2);
      osc2.stop(now + 0.45);
    } else {
      // Nada Halus Standar: Dua nada lonceng lembut (D5 -> A5)
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    }
  } catch {
    // Abaikan jika browser memblokir audio otomatis sebelum ada interaksi pengguna
  }
}

export default function RealtimeSync() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "connecting" | "error">("connecting");
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const lastEventRef = useRef<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let retryTimeout: NodeJS.Timeout | null = null;

    const connectSSE = () => {
      setConnectionStatus("connecting");
      eventSource = new EventSource("/api/realtime");

      eventSource.addEventListener("connected", () => {
        setConnectionStatus("connected");
      });

      eventSource.addEventListener("update", (e: MessageEvent) => {
        try {
          const payload: RealtimeEventPayload = JSON.parse(e.data);
          const eventKey = `${payload.type}_${payload.timestamp}_${payload.ticketNumber || payload.entity || ""}`;

          // Hindari duplikasi pesan jika event tiba bersamaan
          if (lastEventRef.current === eventKey) return;
          lastEventRef.current = eventKey;

          // Filter Ketat: Notifikasi toast & suara lonceng HANYA untuk 4 jenis kejadian:
          // 1. Tiket Baru (TICKET_CREATED)
          // 2. Yang Menangani Tiket (TICKET_ASSIGNED)
          // 3. Pergantian Parts (TICKET_PENDING_PARTS)
          // 4. Tiket Selesai (TICKET_RESOLVED)
          // Pergantian urgensi maupun status lainnya TIDAK memunculkan notifikasi/suara.
          const shouldNotify =
            payload.type === "TICKET_CREATED" ||
            payload.type === "TICKET_ASSIGNED" ||
            payload.type === "TICKET_PENDING_PARTS" ||
            payload.type === "TICKET_RESOLVED";

          if (shouldNotify) {
            // 1. Putar Nada Notifikasi
            const isEmergency = payload.urgency === "EMERGENCY" || payload.urgency === "HIGH";
            playNotificationChime(isEmergency);

            // 2. Tampilkan Toast Melayang
            const toastId = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
            const newToast: ToastNotification = { ...payload, id: toastId };

            setToasts((prev) => [newToast, ...prev.slice(0, 3)]); // Maksimal 4 notifikasi bersamaan

            // Auto-dismiss toast setelah 6 detik
            setTimeout(() => {
              removeToast(toastId);
            }, 6000);
          }

          // 3. Selalu perbarui data UI di latar belakang secara mulus tanpa reload
          router.refresh();
        } catch (err) {
          console.error("Gagal memproses pesan real-time:", err);
        }
      });

      eventSource.onerror = () => {
        setConnectionStatus("error");
        if (eventSource) {
          eventSource.close();
        }
        // Auto-reconnect setelah 4 detik
        retryTimeout = setTimeout(() => {
          connectSSE();
        }, 4000);
      };
    };

    connectSSE();

    // 2. Polling Cadangan Berkala (setiap 12 detik) sebagai jaring pengaman jika SSE diblokir proxy / firewall
    const fallbackPollInterval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        router.refresh();
      }
    }, 12000);

    // 3. Penyegaran otomatis saat pengguna kembali membuka / fokus ke tab peramban
    const handleVisibilityChange = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        router.refresh();
      }
    };
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
      clearInterval(fallbackPollInterval);
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      }
    };
  }, [router, removeToast]);

  if (!mounted) return null;

  return (
    <>
      {/* Indikator Status Koneksi Real-Time di Header */}
      <div className="flex items-center">
        {connectionStatus === "connected" ? (
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 shadow-sm"
            title="Koneksi Siaran Real-Time Aktif (Server-Sent Events terhubung)"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="hidden sm:inline">Realtime</span>
          </span>
        ) : connectionStatus === "connecting" ? (
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 shadow-sm"
            title="Sedang menghubungkan ke siaran real-time..."
          >
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
            <span className="hidden sm:inline">Menghubungkan</span>
          </span>
        ) : (
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-500/30 shadow-sm"
            title="Koneksi SSE sedang menunggu / dibatasi proxy. Auto-Sync berkala aktif."
          >
            <span className="w-2 h-2 rounded-full bg-sky-500"></span>
            <span className="hidden sm:inline">Auto-Sync</span>
          </span>
        )}
      </div>

      {/* Render Notifikasi Toast via React Portal */}
      {toasts.length > 0 &&
        createPortal(
    <div className="fixed top-20 right-3 sm:top-24 sm:right-6 z-[9999] flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none px-2 sm:px-0">
      {toasts.map((toast) => {
        const isEmergency = toast.urgency === "EMERGENCY";
        const isResolved = toast.type === "TICKET_RESOLVED";
        const isPendingParts = toast.type === "TICKET_PENDING_PARTS";
        const isAssigned = toast.type === "TICKET_ASSIGNED";

        let cardBg = "bg-slate-900/95 text-white border-slate-700/80 shadow-black/60";
        let iconBg = "bg-sky-500/30 text-sky-300";
        let iconEl = <Bell className="w-4 h-4" />;

        if (isEmergency) {
          cardBg = "bg-rose-950/95 text-white border-rose-500/60 shadow-rose-950/50";
          iconBg = "bg-rose-500/30 text-rose-300";
          iconEl = <AlertTriangle className="w-4 h-4 animate-bounce" />;
        } else if (isResolved) {
          cardBg = "bg-emerald-950/95 text-white border-emerald-500/60 shadow-emerald-950/50";
          iconBg = "bg-emerald-500/30 text-emerald-300";
          iconEl = <CheckCircle2 className="w-4 h-4" />;
        } else if (isPendingParts) {
          cardBg = "bg-purple-950/95 text-white border-purple-500/60 shadow-purple-950/50";
          iconBg = "bg-purple-500/30 text-purple-300";
          iconEl = <Wrench className="w-4 h-4" />;
        } else if (isAssigned) {
          cardBg = "bg-indigo-950/95 text-white border-indigo-500/60 shadow-indigo-950/50";
          iconBg = "bg-indigo-500/30 text-indigo-300";
          iconEl = <UserCheck className="w-4 h-4" />;
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl border shadow-2xl backdrop-blur-md transition-all animate-in slide-in-from-top-3 fade-in duration-300 ${cardBg}`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-sm ${iconBg}`}
            >
              {iconEl}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1.5">
                <span className="text-xs sm:text-sm font-bold truncate">
                  {toast.title}
                </span>
                <span className="text-[10px] text-slate-400 shrink-0">
                  Baru saja
                </span>
              </div>
              <p className="text-xs text-slate-200 mt-0.5 line-clamp-2 leading-relaxed">
                {toast.message}
              </p>
              {toast.ticketNumber && (
                <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                  <span className="font-mono text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded bg-white/10 border border-white/15">
                    {toast.ticketNumber}
                  </span>
                  {toast.urgency && (
                    <span
                      className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded ${
                        toast.urgency === "EMERGENCY"
                          ? "bg-rose-500 text-white"
                          : toast.urgency === "HIGH"
                          ? "bg-amber-500 text-slate-950"
                          : "bg-sky-500 text-white"
                      }`}
                    >
                      {toast.urgency}
                    </span>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0"
              title="Tutup Notifikasi"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>,
    document.body
  )}
    </>
  );
}
