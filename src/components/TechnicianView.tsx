"use client";

import React, { useState, useTransition } from "react";
import { TicketStatus, TicketUrgency } from "@prisma/client";
import { updateTicketStatusAction } from "@/actions/tickets";
import { Clock, CheckCircle2, Play, Pause, AlertCircle, Wrench, Image as ImageIcon, Video as VideoIcon, Check, RefreshCw } from "lucide-react";
import { TicketItem } from "./ReporterView";

interface TechnicianViewProps {
  tickets: TicketItem[];
  technicianName: string;
  technicianId: string;
}

export default function TechnicianView({ tickets, technicianName, technicianId }: TechnicianViewProps) {
  const [activeTab, setActiveTab] = useState<"NEW" | "MY_ACTIVE" | "COMPLETED">("NEW");
  const [isPending, startTransition] = useTransition();

  // Modal Selesaikan Tiket
  const [resolveModalTicket, setResolveModalTicket] = useState<TicketItem | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  // Filter Tiket
  const newQueueTickets = tickets.filter(
    (t) => t.status === TicketStatus.SUBMITTED || (t.status === TicketStatus.ASSIGNED && !t.assignedTechnician)
  );
  const myActiveTickets = tickets.filter(
    (t) =>
      (t.status === TicketStatus.ASSIGNED || t.status === TicketStatus.IN_PROGRESS || t.status === TicketStatus.PENDING_PARTS) &&
      t.assignedTechnician?.fullName === technicianName
  );
  const completedTickets = tickets.filter(
    (t) => t.status === TicketStatus.RESOLVED || t.status === TicketStatus.CLOSED
  );

  const displayedTickets =
    activeTab === "NEW" ? newQueueTickets : activeTab === "MY_ACTIVE" ? myActiveTickets : completedTickets;

  const handleUpdateStatus = (ticketId: string, newStatus: TicketStatus, notes?: string) => {
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

  const getUrgencyBadge = (urgency: TicketUrgency) => {
    switch (urgency) {
      case TicketUrgency.EMERGENCY:
        return { label: "P1 - DARURAT", color: "bg-rose-500/20 text-rose-300 border-rose-500/40" };
      case TicketUrgency.HIGH:
        return { label: "P2 - TINGGI", color: "bg-orange-500/20 text-orange-300 border-orange-500/40" };
      case TicketUrgency.MEDIUM:
        return { label: "P3 - SEDANG", color: "bg-amber-500/20 text-amber-300 border-amber-500/40" };
      default:
        return { label: "P4 - RENDAH", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" };
    }
  };

  // Hitung menit berjalan sejak tiket dibuat
  const getElapsedMinutes = (date: Date) => {
    const diffMs = Date.now() - new Date(date).getTime();
    return Math.max(1, Math.round(diffMs / (60 * 1000)));
  };

  return (
    <div className="space-y-5 pb-10">
      {/* Header Salam Teknisi */}
      <div className="bg-gradient-to-r from-slate-900 to-sky-950 border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-md">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Wrench className="w-5 h-5 text-sky-400" />
            Workbench Teknisi Lapangan: {technicianName}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Pastikan memperbarui status tiket secara real-time agar stopwatch durasi penanganan tercatat akurat.
          </p>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-1.5 border border-white/10"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Data
        </button>
      </div>

      {actionError && (
        <div className="p-3 bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Tab Navigasi Antrean */}
      <div className="flex border-b border-white/10 gap-2 pb-1">
        <button
          onClick={() => setActiveTab("NEW")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
            activeTab === "NEW"
              ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <span>Antrean Baru</span>
          <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[11px] font-bold">
            {newQueueTickets.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("MY_ACTIVE")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
            activeTab === "MY_ACTIVE"
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <span>Sedang Saya Kerjakan</span>
          <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[11px] font-bold">
            {myActiveTickets.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("COMPLETED")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
            activeTab === "COMPLETED"
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <span>Selesai ({completedTickets.length})</span>
        </button>
      </div>

      {/* List Kartu Tiket */}
      <div className="space-y-3.5">
        {displayedTickets.length === 0 ? (
          <div className="bg-slate-800/40 border border-white/10 rounded-2xl p-8 text-center text-slate-400 text-xs">
            <CheckCircle2 className="w-10 h-10 text-slate-500 mx-auto mb-2" />
            Tidak ada tiket pada antrean ini saat ini.
          </div>
        ) : (
          displayedTickets.map((ticket) => {
            const urgencyBadge = getUrgencyBadge(ticket.urgency);
            const elapsedMins = getElapsedMinutes(ticket.submittedAt);
            const isOverdue = ticket.urgency === TicketUrgency.EMERGENCY && elapsedMins > 10;

            return (
              <div
                key={ticket.id}
                className={`bg-slate-800/80 border rounded-2xl p-4 sm:p-5 shadow-sm space-y-3 transition-all ${
                  isOverdue ? "border-rose-500/70 shadow-rose-950/40" : "border-white/10 hover:border-sky-500/30"
                }`}
              >
                {/* Header Kartu: Nomor, Urgensi, dan Stopwatch Menit */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-sky-400">
                      {ticket.ticketNumber}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${urgencyBadge.color}`}>
                      {urgencyBadge.label}
                    </span>
                  </div>

                  {/* Stopwatch Badge */}
                  <div
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold ${
                      isOverdue
                        ? "bg-rose-500 text-white animate-pulse"
                        : "bg-slate-900 text-sky-300 border border-sky-400/20"
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{elapsedMins} Menit Berjalan</span>
                  </div>
                </div>

                {/* Lokasi & Kategori */}
                <div className="text-xs text-slate-300">
                  <span className="font-bold text-white text-sm">{ticket.unit.name}</span>
                  <span className="text-slate-400 block -mt-0.5">{ticket.unit.buildingZone} • Kategori: <strong className="text-slate-200">{ticket.category.name}</strong></span>
                </div>

                {/* Deskripsi Masalah */}
                <p className="text-xs sm:text-sm text-slate-200 bg-slate-900/60 p-3 rounded-xl border border-white/5 leading-relaxed">
                  {ticket.description}
                </p>

                {/* Media Lampiran (Foto & Video) */}
                {ticket.attachments && ticket.attachments.length > 0 && (
                  <div className="pt-1">
                    <span className="text-[11px] font-medium text-slate-400 block mb-1">
                      Bukti Kerusakan Dari Nakes:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {ticket.attachments.map((att) => (
                        <a
                          key={att.id}
                          href={`/api/media/${att.storedFilename}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-xs text-sky-300 border border-white/10"
                        >
                          {att.fileType === "IMAGE" ? (
                            <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
                          ) : (
                            <VideoIcon className="w-3.5 h-3.5 text-amber-400" />
                          )}
                          <span>Lihat {att.fileType === "IMAGE" ? "Foto" : "Video (60s)"}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tombol Aksi 1-Klik Sesuai Tahapan Tiket */}
                <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-[11px] text-slate-400">
                    Masuk: {new Date(ticket.submittedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                    {ticket.repairMinutes && (
                      <span className="ml-2 text-emerald-400 font-semibold">• Durasi Perbaikan: {ticket.repairMinutes} Menit</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Aksi 1: Ambil Tiket dari antrean baru */}
                    {ticket.status === TicketStatus.SUBMITTED && (
                      <button
                        disabled={isPending}
                        onClick={() => handleUpdateStatus(ticket.id, TicketStatus.ASSIGNED, "Tiket diambil oleh teknisi.")}
                        className="py-2 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95 disabled:opacity-60"
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
                        className="py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95 disabled:opacity-60"
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
                          className="py-2 px-3 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 font-semibold text-xs flex items-center gap-1 border border-purple-500/30 disabled:opacity-60"
                          title="Jeda Stopwatch untuk Tunggu Sparepart"
                        >
                          <Pause className="w-3.5 h-3.5" />
                          Tunggu Part
                        </button>

                        <button
                          disabled={isPending}
                          onClick={() => setResolveModalTicket(ticket)}
                          className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95 disabled:opacity-60"
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
                        className="py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5"
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
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/15 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div>
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Konfirmasi Penyelesaian Masalah
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Tiket {resolveModalTicket.ticketNumber} ({resolveModalTicket.unit.name}). Stopwatch perbaikan akan dihentikan dan menit dihitung otomatis.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Catatan Tindakan Teknis yang Dilakukan:
              </label>
              <textarea
                rows={3}
                required
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Contoh: Mengganti roller penarik kertas printer, bersihkan head, uji cetak resep berhasil normal."
                className="w-full p-3 rounded-xl border border-white/10 bg-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setResolveModalTicket(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isPending || !resolutionNotes.trim()}
                onClick={() => handleUpdateStatus(resolveModalTicket.id, TicketStatus.RESOLVED, resolutionNotes)}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs disabled:opacity-50"
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
