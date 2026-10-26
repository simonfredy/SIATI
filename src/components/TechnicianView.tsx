"use client";

import React, { useState, useTransition } from "react";
import { TicketStatus, TicketUrgency } from "@prisma/client";
import { updateTicketStatusAction } from "@/actions/tickets";
import {
  Clock,
  CheckCircle2,
  Play,
  Pause,
  AlertCircle,
  Wrench,
  Image as ImageIcon,
  Video as VideoIcon,
  Check,
  RefreshCw,
  MapPin,
  Tag,
  ShieldAlert,
  Lock,
} from "lucide-react";
import { TicketItem } from "./ReporterView";

interface TechnicianViewProps {
  tickets: TicketItem[];
  technicianName: string;
  technicianId: string;
}

export default function TechnicianView({
  tickets,
  technicianName,
  technicianId,
}: TechnicianViewProps) {
  const [activeTab, setActiveTab] = useState<"NEW" | "MY_ACTIVE" | "COMPLETED">("NEW");
  const [isPending, startTransition] = useTransition();

  // Modal Selesaikan Tiket
  const [resolveModalTicket, setResolveModalTicket] = useState<TicketItem | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  // Filter Tiket
  const newQueueTickets = tickets.filter(
    (t) =>
      t.status === TicketStatus.SUBMITTED ||
      (t.status === TicketStatus.ASSIGNED && !t.assignedTechnician)
  );
  const myActiveTickets = tickets.filter(
    (t) =>
      (t.status === TicketStatus.ASSIGNED ||
        t.status === TicketStatus.IN_PROGRESS ||
        t.status === TicketStatus.PENDING_PARTS) &&
      t.assignedTechnician?.fullName === technicianName
  );
  const completedTickets = tickets.filter(
    (t) => t.status === TicketStatus.RESOLVED || t.status === TicketStatus.CLOSED
  );

  const displayedTickets =
    activeTab === "NEW"
      ? newQueueTickets
      : activeTab === "MY_ACTIVE"
      ? myActiveTickets
      : completedTickets;

  const handleUpdateStatus = (
    ticketId: string,
    newStatus: TicketStatus,
    notes?: string
  ) => {
    setActionError(null);
    startTransition(async () => {
      const res = await updateTicketStatusAction({
        ticketId,
        newStatus,
        notes,
        assignedTechnicianId: technicianId,
      });

      if (res.success) {
        setResolveModalTicket(null);
        setResolutionNotes("");
        window.location.reload();
      } else {
        setActionError(res.message || "Gagal mengubah status.");
      }
    });
  };

  const handleUpdateUrgency = (ticketId: string, newUrgency: TicketUrgency) => {
    setActionError(null);
    startTransition(async () => {
      const res = await updateTicketStatusAction({
        ticketId,
        urgency: newUrgency,
        notes: `Urgensi tiket disesuaikan menjadi ${newUrgency} oleh teknisi ${technicianName}`,
      });

      if (res.success) {
        window.location.reload();
      } else {
        setActionError(res.message || "Gagal mengubah tingkat urgensi.");
      }
    });
  };

  const getUrgencyBadgeColor = (urgency: TicketUrgency) => {
    switch (urgency) {
      case TicketUrgency.EMERGENCY:
        return "bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-500/40";
      case TicketUrgency.HIGH:
        return "bg-orange-50 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-500/40";
      case TicketUrgency.MEDIUM:
        return "bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-500/40";
      default:
        return "bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40";
    }
  };

  // Hitung menit berjalan sejak tiket dibuat
  const getElapsedMinutes = (date: Date) => {
    const diffMs = Date.now() - new Date(date).getTime();
    return Math.max(1, Math.round(diffMs / (60 * 1000)));
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header Salam Teknisi */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm transition-colors">
        <div className="space-y-1">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Wrench className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            Workbench Teknisi Lapangan: {technicianName}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Perbarui status secara berkala untuk pencatatan stopwatch durasi respon & perbaikan akurat.
          </p>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="self-start sm:self-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 border border-slate-200 dark:border-white/10 transition-colors shadow-sm active:scale-95"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Data
        </button>
      </div>

      {actionError && (
        <div className="p-4 bg-rose-50 dark:bg-rose-500/20 border border-rose-200 dark:border-rose-500/40 text-rose-700 dark:text-rose-300 text-xs font-medium rounded-xl flex items-center gap-2.5 shadow-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Tab Navigasi Antrean */}
      <div className="flex border-b border-slate-200 dark:border-white/10 gap-2 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("NEW")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
            activeTab === "NEW"
              ? "bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <span>Antrean Baru</span>
          <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[11px] font-bold">
            {newQueueTickets.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("MY_ACTIVE")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
            activeTab === "MY_ACTIVE"
              ? "bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <span>Sedang Saya Kerjakan</span>
          <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[11px] font-bold">
            {myActiveTickets.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("COMPLETED")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
            activeTab === "COMPLETED"
              ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <span>Selesai ({completedTickets.length})</span>
        </button>
      </div>

      {/* List Kartu Tiket */}
      <div className="space-y-4">
        {displayedTickets.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-10 text-center text-slate-500 dark:text-slate-400 text-xs sm:text-sm shadow-sm">
            <CheckCircle2 className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-2" />
            Tidak ada tiket pada antrean ini saat ini.
          </div>
        ) : (
          displayedTickets.map((ticket) => {
            const urgencyColor = getUrgencyBadgeColor(ticket.urgency);
            const elapsedMins = getElapsedMinutes(ticket.submittedAt);
            const isOverdue = ticket.urgency === TicketUrgency.EMERGENCY && elapsedMins > 10;

            return (
              <div
                key={ticket.id}
                className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-sm space-y-4 transition-all ${
                  isOverdue
                    ? "border-rose-400 dark:border-rose-500/70 shadow-rose-100 dark:shadow-rose-950/40"
                    : "border-slate-200 dark:border-white/10 hover:border-sky-400 dark:hover:border-sky-500/30"
                }`}
              >
                {/* Header Kartu: Nomor, Urgensi Evaluator, dan Stopwatch Menit */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono text-xs sm:text-sm font-bold text-sky-600 dark:text-sky-400">
                      {ticket.ticketNumber}
                    </span>

                    {/* Evaluasi Urgensi oleh Staf IT */}
                    <div className="flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
                      {ticket.status === TicketStatus.RESOLVED || ticket.status === TicketStatus.CLOSED ? (
                        <div
                          className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg border opacity-80 cursor-not-allowed ${urgencyColor}`}
                          title="Tingkat urgensi tidak dapat diedit karena tiket sudah selesai"
                        >
                          <Lock className="w-3 h-3 text-slate-500 shrink-0" />
                          <span>
                            {ticket.urgency === "EMERGENCY" && "🔴 P1 - Darurat"}
                            {ticket.urgency === "HIGH" && "🟠 P2 - Tinggi"}
                            {ticket.urgency === "MEDIUM" && "🟡 P3 - Sedang"}
                            {ticket.urgency === "LOW" && "🟢 P4 - Rendah"}
                          </span>
                        </div>
                      ) : (
                        <select
                          disabled={isPending}
                          value={ticket.urgency}
                          onChange={(e) => handleUpdateUrgency(ticket.id, e.target.value as TicketUrgency)}
                          className={`text-xs font-bold px-2.5 py-1 rounded-lg border focus:ring-2 focus:ring-sky-500 transition-all ${urgencyColor}`}
                          title="Tentukan / Ubah Skala Prioritas Urgensi Tiket"
                        >
                          <option value="EMERGENCY">🔴 P1 - Darurat</option>
                          <option value="HIGH">🟠 P2 - Tinggi</option>
                          <option value="MEDIUM">🟡 P3 - Sedang</option>
                          <option value="LOW">🟢 P4 - Rendah</option>
                        </select>
                      )}
                    </div>
                  </div>

                  {/* Stopwatch Badge */}
                  <div
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold ${
                      isOverdue
                        ? "bg-rose-500 text-white"
                        : "bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-sky-300 border border-slate-200 dark:border-sky-400/20"
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{elapsedMins} Menit Berjalan</span>
                  </div>
                </div>

                {/* Lokasi & Kategori */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                    {ticket.unit.name}
                  </span>
                  <span className="text-slate-400 dark:text-slate-600">•</span>
                  <span className="text-slate-500 dark:text-slate-400 font-medium">
                    {ticket.unit.buildingZone}
                  </span>
                  <span className="text-slate-400 dark:text-slate-600">•</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Tag className="w-3 h-3 text-sky-500" />
                    {ticket.category.name}
                  </span>
                </div>

                {/* Deskripsi Masalah */}
                <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200/60 dark:border-white/5">
                  <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-normal">
                    {ticket.description}
                  </p>
                </div>

                {/* Media Lampiran (Foto & Video) */}
                {ticket.attachments && ticket.attachments.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">
                      Bukti Kerusakan Dari Nakes ({ticket.attachments.length}):
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {ticket.attachments.map((att) => (
                        <a
                          key={att.id}
                          href={`/api/media/${att.storedFilename}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs text-sky-700 dark:text-sky-300 border border-slate-200 dark:border-white/10 font-medium"
                        >
                          {att.fileType === "IMAGE" ? (
                            <ImageIcon className="w-4 h-4 text-sky-500" />
                          ) : (
                            <VideoIcon className="w-4 h-4 text-amber-500" />
                          )}
                          <span>Lihat {att.fileType === "IMAGE" ? "Foto Bukti" : "Video Bukti (60s)"}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tombol Aksi 1-Klik Sesuai Tahapan Tiket */}
                <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Masuk: {new Date(ticket.submittedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                    {ticket.repairMinutes && (
                      <span className="ml-2 text-emerald-600 dark:text-emerald-400 font-bold">• Durasi Perbaikan: {ticket.repairMinutes} Menit</span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Aksi 1: Ambil Tiket dari antrean baru */}
                    {ticket.status === TicketStatus.SUBMITTED && (
                      <button
                        disabled={isPending}
                        onClick={() => handleUpdateStatus(ticket.id, TicketStatus.ASSIGNED, "Tiket diambil oleh teknisi.")}
                        className="py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-60"
                      >
                        <Wrench className="w-4 h-4" />
                        Ambil Tiket Ini
                      </button>
                    )}

                    {/* Aksi 2: Mulai Dikerjakan di Lokasi */}
                    {ticket.status === TicketStatus.ASSIGNED && (
                      <button
                        disabled={isPending}
                        onClick={() => handleUpdateStatus(ticket.id, TicketStatus.IN_PROGRESS, "Teknisi tiba di lokasi dan mulai perbaikan.")}
                        className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-60"
                      >
                        <Play className="w-4 h-4 fill-current" />
                        Mulai Kerjakan
                      </button>
                    )}

                    {/* Aksi 3: Sedang Dikerjakan -> Jeda Sparepart atau Selesai */}
                    {ticket.status === TicketStatus.IN_PROGRESS && (
                      <>
                        <button
                          disabled={isPending}
                          onClick={() => handleUpdateStatus(ticket.id, TicketStatus.PENDING_PARTS, "Menunggu pengadaan suku cadang / sparepart.")}
                          className="py-2.5 px-3.5 rounded-xl bg-purple-50 dark:bg-purple-600/20 hover:bg-purple-100 dark:hover:bg-purple-600/30 text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center gap-1.5 border border-purple-200 dark:border-purple-500/30 disabled:opacity-60 transition-colors"
                          title="Jeda Stopwatch untuk Tunggu Sparepart"
                        >
                          <Pause className="w-3.5 h-3.5" />
                          Tunggu Part
                        </button>

                        <button
                          disabled={isPending}
                          onClick={() => setResolveModalTicket(ticket)}
                          className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-60"
                        >
                          <Check className="w-4 h-4" />
                          Selesai
                        </button>
                      </>
                    )}

                    {/* Aksi 4: Lanjutkan jika sebelumnya dijeda */}
                    {ticket.status === TicketStatus.PENDING_PARTS && (
                      <button
                        disabled={isPending}
                        onClick={() => handleUpdateStatus(ticket.id, TicketStatus.IN_PROGRESS, "Sparepart telah tersedia, pengerjaan dilanjutkan.")}
                        className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md"
                      >
                        <Play className="w-4 h-4 fill-current" />
                        Lanjutkan Pengerjaan
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Konfirmasi Selesai & Input Catatan Tindakan */}
      {resolveModalTicket && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/15 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                Konfirmasi Penyelesaian Masalah
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Tiket {resolveModalTicket.ticketNumber} ({resolveModalTicket.unit.name}). Stopwatch perbaikan akan dihentikan dan total menit dihitung otomatis.
              </p>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Catatan Tindakan Teknis yang Dilakukan:
              </label>
              <textarea
                rows={3}
                required
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Contoh: Mengganti roller penarik kertas printer, bersihkan head nozzle, uji cetak resep dan antrean berhasil normal."
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setResolveModalTicket(null)}
                className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isPending || !resolutionNotes.trim()}
                onClick={() => handleUpdateStatus(resolveModalTicket.id, TicketStatus.RESOLVED, resolutionNotes)}
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs disabled:opacity-50 transition-colors shadow-sm"
              >
                {isPending ? "Memproses..." : "Tandai Selesai & Tutup"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
