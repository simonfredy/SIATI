"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  PlusCircle,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Star,
  Image as ImageIcon,
  Video as VideoIcon,
  MapPin,
  Tag,
  ShieldCheck,
} from "lucide-react";
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
    (t) =>
      t.status === TicketStatus.SUBMITTED ||
      t.status === TicketStatus.ASSIGNED ||
      t.status === TicketStatus.IN_PROGRESS ||
      t.status === TicketStatus.PENDING_PARTS
  ).length;
  const resolvedCount = tickets.filter(
    (t) => t.status === TicketStatus.RESOLVED || t.status === TicketStatus.CLOSED
  ).length;

  const getUrgencyBadge = (urgency: TicketUrgency) => {
    switch (urgency) {
      case TicketUrgency.EMERGENCY:
        return { label: "🔴 P1 - DARURAT", color: "bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/40" };
      case TicketUrgency.HIGH:
        return { label: "🟠 P2 - TINGGI", color: "bg-orange-50 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-500/40" };
      case TicketUrgency.MEDIUM:
        return { label: "🟡 P3 - SEDANG", color: "bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/40" };
      default:
        return { label: "🟢 P4 - RENDAH", color: "bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/40" };
    }
  };

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case TicketStatus.SUBMITTED:
        return { label: "Menunggu Respon TI", color: "bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-400/30" };
      case TicketStatus.ASSIGNED:
        return { label: "Teknisi Ditugaskan", color: "bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-400/30" };
      case TicketStatus.IN_PROGRESS:
        return { label: "Sedang Dikerjakan", color: "bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-400/30" };
      case TicketStatus.PENDING_PARTS:
        return { label: "Tunggu Sparepart", color: "bg-purple-50 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-400/30" };
      case TicketStatus.RESOLVED:
        return { label: "Masalah Selesai", color: "bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-400/30" };
      case TicketStatus.CLOSED:
        return { label: "Selesai & Ditutup", color: "bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-600/30" };
      default:
        return { label: "Dibatalkan", color: "bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/30" };
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
    <div className="space-y-6 pb-16">
      {/* Banner Sambutan & Tombol Cepat Lapor */}
      <div className="bg-gradient-to-r from-sky-600 via-sky-700 to-blue-700 text-white rounded-2xl p-4 xs:p-5 sm:p-7 relative overflow-hidden shadow-md">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-sm">
              <ShieldCheck className="w-3.5 h-3.5" />
              Layanan Siaga TI RSBM 24 Jam
            </div>
            <h2 className="text-lg xs:text-xl sm:text-2xl font-bold tracking-tight">
              Selamat Bertugas, {userName} 👋
            </h2>
            <p className="text-xs sm:text-sm text-sky-100">
              Pusat Aduan & Penanganan Kendala Digital Unit: <span className="font-semibold text-white underline decoration-sky-300">{unitName}</span>
            </p>
          </div>

          <Link
            href="/dashboard/lapor"
            className="inline-flex items-center justify-center gap-2 py-3 px-4 sm:py-3.5 sm:px-6 bg-white hover:bg-slate-50 text-sky-700 font-bold text-xs xs:text-sm sm:text-base rounded-xl shadow-lg active:scale-95 transition-all shrink-0"
          >
            <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5 text-sky-600" />
            Lapor Kendala Baru
          </Link>
        </div>
      </div>

      {/* Ringkasan Status Aduan - Responsive across Fold, Tablet, and Desktop */}
      <div className="grid grid-cols-1 xs:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 sm:p-5 lg:p-6 flex items-center gap-3.5 shadow-sm transition-colors">
          <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl bg-sky-100 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6 lg:w-7 lg:h-7" />
          </div>
          <div>
            <span className="text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white block leading-tight">{activeCount}</span>
            <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">Dalam Penanganan</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 sm:p-5 lg:p-6 flex items-center gap-3.5 shadow-sm transition-colors">
          <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6 lg:w-7 lg:h-7" />
          </div>
          <div>
            <span className="text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white block leading-tight">{resolvedCount}</span>
            <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">Selesai Ditangani</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 sm:p-5 lg:p-6 flex items-center gap-3.5 shadow-sm transition-colors">
          <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 lg:w-7 lg:h-7" />
          </div>
          <div>
            <span className="text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white block leading-tight">{tickets.length}</span>
            <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">Total Aduan Terkirim</span>
          </div>
        </div>
      </div>

      {/* Daftar Tiket Aduan Saya */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Riwayat Tiket Aduan Unit Anda
          </h3>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
            {tickets.length} Tiket
          </span>
        </div>

        {tickets.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-8 sm:p-12 text-center shadow-sm">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h4 className="text-base font-bold text-slate-900 dark:text-white">Tidak Ada Kendala IT yang Aktif</h4>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
              Semua sistem SIMRS, jaringan, komputer, dan fasilitas penunjang di unit Anda beroperasi normal.
            </p>
            <Link
              href="/dashboard/lapor"
              className="mt-5 inline-flex items-center gap-2 py-2.5 px-5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md"
            >
              <PlusCircle className="w-4 h-4" /> Buat Laporan Pertama
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => {
              const urgencyBadge = getUrgencyBadge(ticket.urgency);
              const statusBadge = getStatusBadge(ticket.status);

              return (
                <div
                  key={ticket.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 sm:p-6 lg:p-7 shadow-sm hover:border-sky-400 dark:hover:border-sky-500/40 transition-all space-y-4"
                >
                  {/* Baris Atas: Nomor Tiket & Badges */}
                  <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs sm:text-base font-bold text-sky-600 dark:text-sky-400 tracking-wider">
                        {ticket.ticketNumber}
                      </span>
                      <span className={`text-[10px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full border ${urgencyBadge.color}`}>
                        {urgencyBadge.label}
                      </span>
                    </div>

                    <span className={`text-xs font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 self-start xs:self-auto ${statusBadge.color}`}>
                      <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
                      {statusBadge.label}
                    </span>
                  </div>

                  {/* Kategori & Lokasi */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-sky-500" />
                      {ticket.category.name}
                    </span>
                    <span className="text-slate-400 dark:text-slate-600">•</span>
                    <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {ticket.unit.name} ({ticket.unit.buildingZone})
                    </span>
                  </div>

                  {/* Deskripsi Masalah */}
                  <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200/60 dark:border-white/5">
                    <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-normal">
                      {ticket.description}
                    </p>
                  </div>

                  {/* Lampiran Media (Foto / Video) */}
                  {ticket.attachments && ticket.attachments.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">
                        Lampiran Media ({ticket.attachments.length}):
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {ticket.attachments.map((att) => (
                          <div key={att.id}>
                            {att.fileType === "IMAGE" ? (
                              <a
                                href={`/api/media/${att.storedFilename}`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs text-sky-700 dark:text-sky-300 border border-slate-200 dark:border-white/10 transition-colors font-medium"
                              >
                                <ImageIcon className="w-4 h-4 text-sky-500" />
                                <span>Lihat Foto Bukti</span>
                              </a>
                            ) : (
                              <a
                                href={`/api/media/${att.storedFilename}`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs text-amber-700 dark:text-amber-300 border border-slate-200 dark:border-white/10 transition-colors font-medium"
                              >
                                <VideoIcon className="w-4 h-4 text-amber-500" />
                                <span>Lihat Video Bukti</span>
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Footer Tiket: Info Waktu & Teknisi */}
                  <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
                    <div>
                      {ticket.assignedTechnician ? (
                        <span>
                          Teknisi Ditugaskan: <strong className="text-slate-800 dark:text-slate-200 font-semibold">{ticket.assignedTechnician.fullName}</strong>
                        </span>
                      ) : (
                        <span className="italic text-slate-400 dark:text-slate-500">
                          Menunggu penugasan teknisi oleh Helpdesk
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-medium">
                        {new Date(ticket.submittedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                      </span>

                      {/* Tombol Beri Rating Bintang Jika Tiket Selesai */}
                      {ticket.status === TicketStatus.RESOLVED && !ticket.rating && (
                        <button
                          onClick={() => setRatingModalTicket(ticket)}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                        >
                          <Star className="w-3.5 h-3.5 fill-current" />
                          Beri Ulasan Layanan
                        </button>
                      )}

                      {ticket.rating && (
                        <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold text-xs bg-amber-50 dark:bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-500/20">
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/15 rounded-2xl max-w-sm w-full p-6 space-y-5 shadow-2xl">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-2">
                <Star className="w-6 h-6 fill-current" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">Beri Ulasan Layanan IT</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tiket {ratingModalTicket.ticketNumber} telah selesai diperbaiki. Berikan penilaian Anda untuk peningkatan kualitas layanan.
              </p>
            </div>

            {ratingSuccessMsg ? (
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300 rounded-xl text-center text-xs font-semibold">
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
                      className={`p-2 rounded-lg transition-transform hover:scale-110 ${
                        selectedStars >= star ? "text-amber-500 dark:text-amber-400" : "text-slate-300 dark:text-slate-600"
                      }`}
                    >
                      <Star className={`w-8 h-8 ${selectedStars >= star ? "fill-current" : ""}`} />
                    </button>
                  ))}
                </div>

                {/* Input Catatan Opsional */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Catatan Masukan (Opsional)
                  </label>
                  <textarea
                    rows={3}
                    value={ratingFeedback}
                    onChange={(e) => setRatingFeedback(e.target.value)}
                    placeholder="Contoh: Respon teknisi sangat cepat dan printer resep kembali lancar.."
                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                {/* Tombol Simpan & Batal */}
                <div className="flex gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setRatingModalTicket(null)}
                    className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    disabled={isSubmittingRating}
                    onClick={handleSendRating}
                    className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs disabled:opacity-60 transition-colors shadow-sm"
                  >
                    {isSubmittingRating ? "Menyimpan..." : "Kirim Penilaian"}
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
