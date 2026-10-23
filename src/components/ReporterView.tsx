"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PlusCircle, Clock, AlertTriangle, CheckCircle2, Star, Image as ImageIcon, Video as VideoIcon, ChevronRight } from "lucide-react";
import { TicketStatus, TicketUrgency } from "@prisma/client";
import { rateTicketAction } from "@/actions/tickets";

export interface TicketItem {
  id: string;
  ticketNumber: string;
  description: string;
  urgency: TicketUrgency;
  status: TicketStatus;
  submittedAt: Date;
  responseMinutes: number | null;
  repairMinutes: number | null;
  unit: { name: string; buildingZone: string };
  category: { name: string; targetSlaMinutes: number };
  assignedTechnician?: { fullName: string } | null;
  attachments: {
    id: string;
    fileType: string;
    storedFilename: string;
    originalName: string;
  }[];
  rating?: { ratingScore: number; feedback: string | null } | null;
}

interface ReporterViewProps {
  tickets: TicketItem[];
  userName: string;
  unitName: string;
}

export default function ReporterView({ tickets, userName, unitName }: ReporterViewProps) {
  const [ratingModalTicket, setRatingModalTicket] = useState<TicketItem | null>(null);
  const [selectedStars, setSelectedStars] = useState(5);
  const [ratingFeedback, setRatingFeedback] = useState("");
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [ratingSuccessMsg, setRatingSuccessMsg] = useState<string | null>(null);

  // Filter statistik cepat
  const activeCount = tickets.filter(
    (t) => t.status === TicketStatus.SUBMITTED || t.status === TicketStatus.ASSIGNED || t.status === TicketStatus.IN_PROGRESS
  ).length;
  const resolvedCount = tickets.filter((t) => t.status === TicketStatus.RESOLVED || t.status === TicketStatus.CLOSED).length;

  const getUrgencyBadge = (urgency: TicketUrgency) => {
    switch (urgency) {
      case TicketUrgency.EMERGENCY:
        return { label: "P1 - DARURAT", color: "bg-rose-500/20 text-rose-300 border-rose-500/30" };
      case TicketUrgency.HIGH:
        return { label: "P2 - TINGGI", color: "bg-orange-500/20 text-orange-300 border-orange-500/30" };
      case TicketUrgency.MEDIUM:
        return { label: "P3 - SEDANG", color: "bg-amber-500/20 text-amber-300 border-amber-500/30" };
      default:
        return { label: "P4 - RENDAH", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" };
    }
  };

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case TicketStatus.SUBMITTED:
        return { label: "Menunggu Tim IT", color: "bg-sky-500/15 text-sky-300 border-sky-400/30" };
      case TicketStatus.ASSIGNED:
        return { label: "Teknisi Ditugaskan", color: "bg-blue-500/20 text-blue-300 border-blue-400/30" };
      case TicketStatus.IN_PROGRESS:
        return { label: "Sedang Dikerjakan", color: "bg-amber-500/20 text-amber-300 border-amber-400/30" };
      case TicketStatus.PENDING_PARTS:
        return { label: "Tunggu Sparepart", color: "bg-purple-500/20 text-purple-300 border-purple-400/30" };
      case TicketStatus.RESOLVED:
        return { label: "Masalah Selesai", color: "bg-emerald-500/20 text-emerald-300 border-emerald-400/30" };
      case TicketStatus.CLOSED:
        return { label: "Selesai & Ditutup", color: "bg-slate-700/50 text-slate-400 border-slate-600/30" };
      default:
        return { label: "Ditolak", color: "bg-rose-500/15 text-rose-300 border-rose-500/30" };
    }
  };

  const handleSendRating = async () => {
    if (!ratingModalTicket) return;
    setIsSubmittingRating(true);
    setRatingSuccessMsg(null);

    const res = await rateTicketAction({
      ticketId: ratingModalTicket.id,
      ratingScore: selectedStars,
      feedback: ratingFeedback,
    });

    setIsSubmittingRating(false);
    if (res.success) {
      setRatingSuccessMsg(res.message || "Ulasan tersimpan!");
      setTimeout(() => {
        setRatingModalTicket(null);
        window.location.reload();
      }, 1000);
    }
  };

  return (
    <div className="space-y-5 pb-10">
      {/* Banner Sambutan & Tombol Cepat Lapor */}
      <div className="bg-gradient-to-r from-sky-900/60 to-blue-900/60 border border-sky-500/20 rounded-2xl p-4 sm:p-6 backdrop-blur-md relative overflow-hidden shadow-lg">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Selamat Bertugas, {userName} 👋
            </h2>
            <p className="text-xs sm:text-sm text-sky-200/80 mt-1">
              Unit: <span className="font-semibold text-white">{unitName}</span> • Layanan Siaga IT 24 Jam
            </p>
          </div>

          <Link
            href="/dashboard/lapor"
            className="inline-flex items-center justify-center gap-2 py-3 px-5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-sky-500/25 active:scale-95 transition-all"
          >
            <PlusCircle className="w-5 h-5" />
            Lapor Kendala IT Baru
          </Link>
        </div>
      </div>

      {/* Ringkasan Status Aduan */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-slate-800/60 border border-white/10 rounded-xl p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl font-bold text-white">{activeCount}</span>
            <span className="block text-xs text-slate-400">Sedang Ditangani</span>
          </div>
        </div>

        <div className="bg-slate-800/60 border border-white/10 rounded-xl p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl font-bold text-white">{resolvedCount}</span>
            <span className="block text-xs text-slate-400">Selesai Ditangani</span>
          </div>
        </div>

        <div className="bg-slate-800/60 border border-white/10 rounded-xl p-3.5 flex items-center gap-3 col-span-2 sm:col-span-1">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl font-bold text-white">{tickets.length}</span>
            <span className="block text-xs text-slate-400">Total Aduan Saya</span>
          </div>
        </div>
      </div>

      {/* Daftar Tiket Aduan Saya */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Riwayat Tiket Aduan Anda
          </h3>
          <span className="text-xs text-slate-400">{tickets.length} Tiket Tercatat</span>
        </div>

        {tickets.length === 0 ? (
          <div className="bg-slate-800/40 border border-white/10 rounded-2xl p-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <h4 className="text-sm font-semibold text-white">Belum Ada Tiket Kendala</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Saat ini tidak ada laporan kerusakan aktif. Jika terdapat kendala SIMRS, komputer, printer, atau jaringan, silakan buat laporan baru.
            </p>
            <Link
              href="/dashboard/lapor"
              className="mt-4 inline-flex items-center gap-2 py-2 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold"
            >
              <PlusCircle className="w-4 h-4" /> Buat Laporan Pertama
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => {
              const urgencyBadge = getUrgencyBadge(ticket.urgency);
              const statusBadge = getStatusBadge(ticket.status);

              return (
                <div
                  key={ticket.id}
                  className="bg-slate-800/80 border border-white/10 rounded-2xl p-4 sm:p-5 shadow-sm hover:border-sky-500/40 transition-all space-y-3"
                >
                  {/* Baris Atas: Nomor Tiket & Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-sky-400 tracking-wider">
                        {ticket.ticketNumber}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${urgencyBadge.color}`}>
                        {urgencyBadge.label}
                      </span>
                    </div>

                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${statusBadge.color}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
                      {statusBadge.label}
                    </span>
                  </div>

                  {/* Kategori & Lokasi */}
                  <div className="text-xs text-slate-300 flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-white bg-slate-700/60 px-2 py-0.5 rounded-md">
                      {ticket.category.name}
                    </span>
                    <span>•</span>
                    <span className="text-slate-400">{ticket.unit.name} ({ticket.unit.buildingZone})</span>
                  </div>

                  {/* Deskripsi Masalah */}
                  <p className="text-xs sm:text-sm text-slate-200 bg-slate-900/60 p-3 rounded-xl border border-white/5 leading-relaxed">
                    {ticket.description}
                  </p>

                  {/* Lampiran Media (Foto / Video) */}
                  {ticket.attachments && ticket.attachments.length > 0 && (
                    <div className="pt-1">
                      <span className="text-[11px] font-medium text-slate-400 block mb-1.5">
                        Lampiran Media Bukti ({ticket.attachments.length}):
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {ticket.attachments.map((att) => (
                          <div key={att.id} className="relative group">
                            {att.fileType === "IMAGE" ? (
                              <a
                                href={`/api/media/${att.storedFilename}`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-[11px] text-sky-300 border border-white/10 transition-colors"
                              >
                                <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
                                <span>Foto Bukti</span>
                              </a>
                            ) : (
                              <a
                                href={`/api/media/${att.storedFilename}`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-[11px] text-amber-300 border border-white/10 transition-colors"
                              >
                                <VideoIcon className="w-3.5 h-3.5 text-amber-400" />
                                <span>Video Bukti</span>
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Footer Tiket: Info Waktu & Teknisi */}
                  <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
                    <div>
                      {ticket.assignedTechnician ? (
                        <span>Teknisi: <strong className="text-slate-200">{ticket.assignedTechnician.fullName}</strong></span>
                      ) : (
                        <span className="italic text-slate-500">Belum ada teknisi ditugaskan</span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <span>{new Date(ticket.submittedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB</span>

                      {/* Tombol Beri Rating Bintang Jika Tiket Selesai */}
                      {ticket.status === TicketStatus.RESOLVED && !ticket.rating && (
                        <button
                          onClick={() => setRatingModalTicket(ticket)}
                          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1 shadow-sm transition-all"
                        >
                          <Star className="w-3.5 h-3.5 fill-current" />
                          Beri Nilai
                        </button>
                      )}

                      {ticket.rating && (
                        <span className="flex items-center gap-1 text-amber-400 font-semibold text-xs bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          {ticket.rating.ratingScore}/5 Bintang
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Rating Bintang Interaktif */}
      {ratingModalTicket && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/15 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl animate-scale-up">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-2">
                <Star className="w-6 h-6 fill-current" />
              </div>
              <h4 className="text-base font-bold text-white">Beri Nilai Layanan IT</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Tiket {ratingModalTicket.ticketNumber} telah selesai ditangani. Seberapa puas Anda?
              </p>
            </div>

            {ratingSuccessMsg ? (
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-xl text-center text-xs">
                {ratingSuccessMsg}
              </div>
            ) : (
              <>
                {/* Pilihan Bintang 1 - 5 */}
                <div className="flex justify-center gap-2 pt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setSelectedStars(star)}
                      className={`p-1.5 rounded-lg transition-transform hover:scale-110 ${
                        selectedStars >= star ? "text-amber-400" : "text-slate-600"
                      }`}
                    >
                      <Star className={`w-8 h-8 ${selectedStars >= star ? "fill-current" : ""}`} />
                    </button>
                  ))}
                </div>

                {/* Input Ulasan / Masukan Opsional */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                    Catatan Masukan (Opsional)
                  </label>
                  <textarea
                    rows={2}
                    value={ratingFeedback}
                    onChange={(e) => setRatingFeedback(e.target.value)}
                    placeholder="Contoh: Sangat cepat dan printer sudah berfungsi kembali.."
                    className="w-full p-2.5 rounded-xl border border-white/10 bg-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                {/* Tombol Simpan & Batal */}
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setRatingModalTicket(null)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    disabled={isSubmittingRating}
                    onClick={handleSendRating}
                    className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs disabled:opacity-60"
                  >
                    {isSubmittingRating ? "Menyimpan..." : "Kirim Nilai"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
