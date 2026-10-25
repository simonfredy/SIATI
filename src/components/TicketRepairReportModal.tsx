"use client";

import React, { useEffect } from "react";
import { TicketUrgency } from "@prisma/client";
import {
  X,
  Printer,
  Building2,
  Star,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Tag,
  AlertTriangle,
  FileCheck,
  User,
  MapPin,
  Calendar,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { modalBackdropVariants, modalContentVariants } from "@/lib/motionVariants";
import { TicketItem } from "./ReporterView";
import { HospitalProfileItem } from "@/actions/superadmin";
import { BarcodeSignature } from "./BarcodeSignature";

interface TicketRepairReportModalProps {
  ticket: TicketItem | null;
  hospitalProfile?: HospitalProfileItem | null;
  currentUserName?: string;
  onClose: () => void;
}

export default function TicketRepairReportModal({
  ticket,
  hospitalProfile,
  onClose,
}: TicketRepairReportModalProps) {
  // Lock body scroll and listen for ESC key
  useEffect(() => {
    if (!ticket) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [ticket, onClose]);

  if (!ticket) return null;

  // Nama Kota dari alamat rumah sakit untuk bagian tertanda
  let hospitalCity = "Kota Rumah Sakit";
  if (hospitalProfile?.address) {
    const parts = hospitalProfile.address.split(",");
    if (parts.length > 1) {
      hospitalCity = parts[parts.length - 1].trim();
    }
  }

  // Format Tanggal & Waktu Bahasa Indonesia
  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "-";
    const d = new Date(date);
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatDateTime = (date: Date | string | null | undefined) => {
    if (!date) return "-";
    const d = new Date(date);
    return `${d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })}, ${d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB`;
  };

  const ticketDate = new Date(ticket.submittedAt);
  const regMonth = String(ticketDate.getMonth() + 1).padStart(2, "0");
  const regYear = ticketDate.getFullYear();
  const rawTicketNum = ticket.ticketNumber.replace("TKT-", "");
  const docRegNumber = `BA-IT/${rawTicketNum}/${regMonth}/${regYear}`;

  // Penentuan Status SLA
  const targetSla = ticket.category.targetSlaMinutes || 30;
  const actualWorkMinutes = ticket.repairMinutes ?? 0;
  const isSlaCompliant = actualWorkMinutes <= targetSla;

  // Label Urgensi
  const getUrgencyLabel = (urgency: TicketUrgency) => {
    switch (urgency) {
      case TicketUrgency.EMERGENCY:
        return { label: "P1 - DARURAT (Gawat Darurat / Pelayanan Vital)", color: "text-rose-700 bg-rose-50 border-rose-200" };
      case TicketUrgency.HIGH:
        return { label: "P2 - TINGGI (Prioritas Tinggi)", color: "text-orange-700 bg-orange-50 border-orange-200" };
      case TicketUrgency.MEDIUM:
        return { label: "P3 - SEDANG (Standar Operasional)", color: "text-amber-700 bg-amber-50 border-amber-200" };
      case TicketUrgency.LOW:
        return { label: "P4 - RENDAH (Permintaan Rutin)", color: "text-blue-700 bg-blue-50 border-blue-200" };
      default:
        return { label: urgency, color: "text-slate-700 bg-slate-50 border-slate-200" };
    }
  };

  const urgencyMeta = getUrgencyLabel(ticket.urgency);

  // Filter foto lampiran awal
  const imageAttachments = ticket.attachments?.filter((a) => a.fileType === "IMAGE") || [];

  // Pemicu Cetak Dokumen Resmi
  const handlePrint = () => {
    document.body.classList.add("printing-repair-report");
    window.print();
    setTimeout(() => {
      document.body.classList.remove("printing-repair-report");
    }, 600);
  };

  const ratingScore = ticket.rating?.ratingScore ?? 5;
  const ratingFeedback = ticket.rating?.feedback;

  // Nama Pelapor & Nama Teknisi
  const reporterName = ticket.reporter?.fullName || "Pelapor Ruangan";
  const technicianName = ticket.assignedTechnician?.fullName || "Staf TI Penanggung Jawab";

  return (
    <AnimatePresence>
      <motion.div
        variants={modalBackdropVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          variants={modalContentVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={(e) => e.stopPropagation()}
          className="bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-white/15 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[95vh] overflow-hidden transition-all duration-300"
        >
          {/* ========================================================================= */}
          {/* HEADER TOOLBAR MODAL (HANYA MUNCUL DI LAYAR - PRINT HIDDEN)              */}
          {/* ========================================================================= */}
          <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/10 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3 shrink-0 print:hidden">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                <FileCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                  Dokumen Berita Acara & Laporan Perbaikan Layanan TI
                </h3>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-mono font-semibold text-sky-600 dark:text-sky-400">
                    {ticket.ticketNumber}
                  </span>
                  <span>•</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Telah Diverifikasi & Diberi Ulasan
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handlePrint}
                className="px-3.5 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-sky-600/20 active:scale-95 transition-all cursor-pointer"
                title="Cetak Dokumen atau Simpan sebagai PDF"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak / Simpan PDF</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Tutup Pratinjau Dokumen"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* AREA DOKUMEN KERTAS RESMI FORMAT A4 (DAPAT DI-SCROLL DI SCREEN, UTUH DI PRINT) */}
          {/* ========================================================================= */}
          <div id="report-modal-scroll-area" className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8">
            <div
              id="siati-repair-report-print"
              className="bg-white text-black p-6 sm:p-10 lg:p-12 rounded-xl shadow-md border border-slate-200 print:shadow-none print:border-none print:p-0 print:m-0 space-y-5 text-left font-sans text-xs leading-relaxed"
            >
              {/* 1. KOP SURAT RESMI RUMAH SAKIT */}
              <div className="border-b-2 border-black pb-3 print-avoid-break">
                <div className="flex items-center justify-between gap-5 pb-2">
                  {hospitalProfile?.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={hospitalProfile.logoUrl}
                      alt={hospitalProfile.name}
                      className="w-20 h-20 object-contain shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 border-2 border-black rounded-lg flex flex-col items-center justify-center font-bold text-[10px] uppercase text-center p-1 shrink-0">
                      <Building2 className="w-6 h-6 mb-1 text-black" />
                      <span>LOGO RS</span>
                    </div>
                  )}

                  <div className="flex-1 text-center">
                    <div className="text-xl font-black tracking-wider uppercase text-black">
                      {hospitalProfile?.name || "RUMAH SAKIT UMUM"}
                    </div>
                    <div className="text-[10px] font-normal mt-0.5 text-gray-700 leading-tight">
                      {hospitalProfile?.address || "Alamat Fasilitas Pelayanan Kesehatan"}
                    </div>
                    <div className="text-[9.5px] text-gray-600 flex items-center justify-center gap-3 flex-wrap mt-0.5">
                      {hospitalProfile?.phone && <span>Telp: {hospitalProfile.phone}</span>}
                      {hospitalProfile?.email && <span>Email: {hospitalProfile.email}</span>}
                      {hospitalProfile?.website && <span>Web: {hospitalProfile.website}</span>}
                    </div>
                  </div>

                  <div className="w-20 shrink-0" />
                </div>

                <div className="w-full h-0.5 bg-black mt-1"></div>
                <div className="w-full h-[1px] bg-black mt-0.5"></div>
              </div>

              {/* 2. JUDUL DOKUMEN & KOTAK REGISTRASI ADMINISTRASI */}
              <div className="space-y-3 print-avoid-break">
                <div className="text-center space-y-0.5">
                  <h1 className="text-base font-extrabold uppercase tracking-wide text-black">
                    BERITA ACARA & LAPORAN HASIL PERBAIKAN TEKNOLOGI INFORMASI
                  </h1>
                  <p className="text-[11px] font-semibold text-gray-700 uppercase tracking-wider">
                    Instalasi / Unit Teknologi Informasi & SIMRS
                  </p>
                </div>

                {/* Kotak Informasi Administrasi Laporan */}
                <div className="border border-black rounded-lg p-3 text-[10.5px] bg-gray-50/50">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                    <div className="flex">
                      <span className="w-36 font-bold text-gray-800">Nomor Berita Acara:</span>
                      <span className="font-mono font-bold">{docRegNumber}</span>
                    </div>
                    <div className="flex">
                      <span className="w-36 font-bold text-gray-800">Nomor Tiket Aduan:</span>
                      <span className="font-mono font-bold text-black">{ticket.ticketNumber}</span>
                    </div>
                    <div className="flex">
                      <span className="w-36 font-bold text-gray-800">Waktu Terbit Dokumen:</span>
                      <span>{formatDateTime(ticket.rating?.createdAt || ticket.workResolvedAt || new Date())}</span>
                    </div>
                    <div className="flex">
                      <span className="w-36 font-bold text-gray-800">Status Validasi:</span>
                      <span className="font-bold text-emerald-800 flex items-center gap-1">
                        ✓ SELESAI & TERVERIFIKASI PELAPOR
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. BAGIAN I: IDENTITAS TIKET & DATA RUANGAN PELAPOR */}
              <div className="space-y-2 print-avoid-break">
                <div className="flex items-center gap-1.5 border-b border-black pb-1">
                  <span className="text-xs font-extrabold uppercase tracking-wider">
                    I. Data Identitas Tiket & Ruangan Pelapor
                  </span>
                </div>

                <table className="w-full border-collapse border border-black text-[10px]">
                  <tbody>
                    <tr className="border-b border-black">
                      <td className="w-1/4 p-2 font-bold bg-gray-100 border-r border-black">Unit / Ruangan</td>
                      <td className="w-1/4 p-2 border-r border-black font-semibold">{ticket.unit.name}</td>
                      <td className="w-1/4 p-2 font-bold bg-gray-100 border-r border-black">Lokasi / Gedung</td>
                      <td className="w-1/4 p-2 font-medium">{ticket.unit.buildingZone}</td>
                    </tr>
                    <tr className="border-b border-black">
                      <td className="p-2 font-bold bg-gray-100 border-r border-black">Nama Pelapor</td>
                      <td className="p-2 border-r border-black font-semibold">{reporterName}</td>
                      <td className="p-2 font-bold bg-gray-100 border-r border-black">Kontak Pelapor</td>
                      <td className="p-2 font-mono">{ticket.reporter?.phoneNumber || "-"}</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold bg-gray-100 border-r border-black">Kategori Layanan</td>
                      <td className="p-2 border-r border-black font-semibold">{ticket.category.name}</td>
                      <td className="p-2 font-bold bg-gray-100 border-r border-black">Tingkat Urgensi</td>
                      <td className="p-2 font-bold text-gray-900">{urgencyMeta.label}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 4. BAGIAN II: DESKRIPSI KELUHAN AWAL & BUKTI FOTO KENDALA */}
              <div className="space-y-2 print-avoid-break">
                <div className="flex items-center gap-1.5 border-b border-black pb-1">
                  <span className="text-xs font-extrabold uppercase tracking-wider">
                    II. Deskripsi Keluhan & Bukti Permasalahan Awal
                  </span>
                </div>

                <div className="border border-black rounded-lg p-3 bg-gray-50/50 space-y-2 text-[10.5px]">
                  <div>
                    <span className="font-bold text-gray-800 block mb-0.5">Uraian Kendala Pelapor:</span>
                    <p className="text-gray-900 whitespace-pre-wrap leading-relaxed italic bg-white p-2.5 rounded border border-gray-300">
                      &quot;{ticket.description}&quot;
                    </p>
                  </div>

                  {/* Foto Bukti Kerusakan Awal */}
                  {imageAttachments.length > 0 && (
                    <div className="pt-1">
                      <span className="font-bold text-gray-800 block mb-1">
                        Lampiran Bukti Foto Kerusakan Awal ({imageAttachments.length} Berkas):
                      </span>
                      <div className="flex flex-wrap gap-3">
                        {imageAttachments.map((img) => (
                          <div
                            key={img.id}
                            className="border border-black rounded p-1 bg-white flex flex-col items-center text-center max-w-[140px]"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={`/api/media/${img.storedFilename}`}
                              alt={img.originalName}
                              className="w-28 h-20 object-cover rounded border border-gray-300"
                            />
                            <span className="text-[8.5px] text-gray-600 truncate w-full mt-1">
                              {img.originalName}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 5. BAGIAN III: LAPORAN TINDAKAN TEKNIS & HASIL PENGERJAAN */}
              <div className="space-y-2 print-avoid-break">
                <div className="flex items-center gap-1.5 border-b border-black pb-1">
                  <span className="text-xs font-extrabold uppercase tracking-wider">
                    III. Laporan Tindakan Teknis & Realisasi Pengerjaan
                  </span>
                </div>

                <table className="w-full border-collapse border border-black text-[10px]">
                  <tbody>
                    <tr className="border-b border-black">
                      <td className="w-1/3 p-2 font-bold bg-gray-100 border-r border-black">
                        Staf TI / Teknisi Penanggung Jawab
                      </td>
                      <td className="p-2 font-semibold text-gray-900">
                        {technicianName}
                      </td>
                    </tr>
                    <tr className="border-b border-black">
                      <td className="p-2 font-bold bg-gray-100 border-r border-black align-top">
                        Tindakan Teknis & Catatan Perbaikan
                      </td>
                      <td className="p-2 text-gray-900 leading-relaxed">
                        {ticket.timelineLogs && ticket.timelineLogs.length > 0 ? (
                          <ul className="list-disc list-inside space-y-1">
                            {ticket.timelineLogs.map((log) => (
                              <li key={log.id} className="text-[9.5px]">
                                <span className="font-semibold">{log.actorName}:</span>{" "}
                                <span>{log.notes || `Perubahan status ke ${log.newStatus}`}</span>{" "}
                                <span className="text-gray-500 font-mono text-[8.5px]">
                                  ({new Date(log.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB)
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="italic text-gray-600">
                            Pemeriksaan diagnostik fisik, konfigurasi perbaikan sistem, dan pengujian operasional telah selesai dilakukan di lokasi.
                          </p>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold bg-gray-100 border-r border-black">
                        Hasil Akhir Perbaikan
                      </td>
                      <td className="p-2 font-bold text-emerald-800">
                        TELAH BERFUNGSI NORMAL & KEMBALI DIGUNAKAN UNTUK LAYANAN OPERASIONAL MEDIS
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 6. BAGIAN IV: METRIK STOPWATCH & KEPATUHAN WAKTU SLA */}
              <div className="space-y-2 print-avoid-break">
                <div className="flex items-center gap-1.5 border-b border-black pb-1">
                  <span className="text-xs font-extrabold uppercase tracking-wider">
                    IV. Matriks Stopwatch & Kepatuhan Standar Waktu (SLA)
                  </span>
                </div>

                <table className="w-full border-collapse border border-black text-[9.5px] text-center">
                  <thead>
                    <tr className="bg-gray-100 border-b border-black font-bold">
                      <th className="p-1.5 border-r border-black">Waktu Lapor Masuk</th>
                      <th className="p-1.5 border-r border-black">Respon Awal TI</th>
                      <th className="p-1.5 border-r border-black">Mulai Pengerjaan</th>
                      <th className="p-1.5 border-r border-black">Selesai Perbaikan</th>
                      <th className="p-1.5 border-r border-black">Durasi Kerja Bersih</th>
                      <th className="p-1.5 border-r border-black">Target Standar SLA</th>
                      <th className="p-1.5">Evaluasi SLA</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-black">
                      <td className="p-1.5 border-r border-black font-mono">
                        {new Date(ticket.submittedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                      </td>
                      <td className="p-1.5 border-r border-black font-mono">
                        {ticket.responseMinutes !== null ? `${ticket.responseMinutes} Menit` : "-"}
                      </td>
                      <td className="p-1.5 border-r border-black font-mono">
                        {ticket.workStartedAt
                          ? `${new Date(ticket.workStartedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB`
                          : "-"}
                      </td>
                      <td className="p-1.5 border-r border-black font-mono">
                        {ticket.workResolvedAt
                          ? `${new Date(ticket.workResolvedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB`
                          : "-"}
                      </td>
                      <td className="p-1.5 border-r border-black font-bold font-mono">
                        {actualWorkMinutes} Menit
                      </td>
                      <td className="p-1.5 border-r border-black font-semibold">
                        {targetSla} Menit
                      </td>
                      <td className="p-1.5 font-bold">
                        {isSlaCompliant ? (
                          <span className="text-emerald-800">MEMENUHI SLA</span>
                        ) : (
                          <span className="text-rose-800">MELEBIHI SLA</span>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 7. BAGIAN V: EVALUASI KEPUASAN & ULASAN PELAPOR */}
              <div className="space-y-2 print-avoid-break">
                <div className="flex items-center gap-1.5 border-b border-black pb-1">
                  <span className="text-xs font-extrabold uppercase tracking-wider">
                    V. Evaluasi Kepuasan & Ulasan Pelapor (Customer Review)
                  </span>
                </div>

                <div className="border-2 border-black rounded-lg p-3.5 bg-amber-50/40 text-[10.5px] space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-800">Penilaian Skor Pelayanan:</span>
                      <div className="flex items-center gap-0.5 text-amber-500">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              ratingScore >= star ? "fill-amber-500 text-amber-500" : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="font-bold text-black ml-1">
                        ({ratingScore} dari 5 Bintang)
                      </span>
                    </div>

                    <div className="text-[9.5px] text-gray-600 font-mono">
                      Waktu Verifikasi: {formatDateTime(ticket.rating?.createdAt || new Date())}
                    </div>
                  </div>

                  <div>
                    <span className="font-bold text-gray-800 block mb-0.5">Catatan Ulasan Pelapor:</span>
                    <p className="text-gray-900 italic bg-white p-2.5 rounded border border-gray-300 leading-relaxed font-serif">
                      &quot;{ratingFeedback || "Layanan perbaikan telah diselesaikan dengan sangat baik, sistem telah diuji dan berfungsi normal kembali."}&quot;
                    </p>
                  </div>
                </div>
              </div>

              {/* 8. BAGIAN VI: LEMBAR PENGESAHAN DUA PIHAK (SERAH TERIMA RESMI) */}
              <div className="print-avoid-break pt-4 border-t border-black space-y-3">
                <div className="text-right text-[10.5px] text-gray-800 font-medium">
                  {hospitalCity}, {formatDate(ticket.rating?.createdAt || ticket.workResolvedAt || new Date())}
                </div>

                <div className="grid grid-cols-2 gap-8 text-[11px] pt-1">
                  {/* Pihak Pelapor */}
                  <div className="flex flex-col items-center text-center">
                    <div className="h-10 flex flex-col justify-end items-center pb-1">
                      <span className="font-semibold text-gray-800">Penerima Layanan / Pelapor,</span>
                    </div>

                    <div className="h-20 flex items-center justify-center my-1">
                      <BarcodeSignature
                        value={`SIATI-SIGN-${ticket.ticketNumber}-REP`}
                        signerName={reporterName}
                        signerRole="Penerima Layanan / Pelapor"
                        timestamp={ticket.rating?.createdAt ? formatDateTime(ticket.rating.createdAt) : undefined}
                      />
                    </div>

                    <div className="w-full">
                      <div className="font-bold uppercase tracking-wide text-black border-t border-black pt-1 max-w-[210px] mx-auto truncate">
                        {reporterName}
                      </div>
                      <div className="text-[9.5px] text-gray-600 mt-0.5">
                        Unit: {ticket.unit.name}
                      </div>
                    </div>
                  </div>

                  {/* Pihak Staf IT */}
                  <div className="flex flex-col items-center text-center">
                    <div className="h-10 flex flex-col justify-end items-center pb-1">
                      <span className="font-bold text-gray-800 leading-tight">Tertanda</span>
                      <span className="font-extrabold uppercase tracking-wider text-black text-xs leading-tight">
                        STAFF IT
                      </span>
                    </div>

                    <div className="h-20 flex items-center justify-center my-1">
                      <BarcodeSignature
                        value={`SIATI-SIGN-${ticket.ticketNumber}-IT`}
                        signerName={technicianName}
                        signerRole="STAFF IT"
                        timestamp={ticket.workResolvedAt ? formatDateTime(ticket.workResolvedAt) : undefined}
                      />
                    </div>

                    <div className="w-full">
                      <div className="font-bold uppercase tracking-wide text-black border-t border-black pt-1 max-w-[210px] mx-auto truncate">
                        {technicianName}
                      </div>
                      <div className="text-[9.5px] text-gray-600 mt-0.5">
                        Instalasi SIMRS & Teknologi Informasi
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 9. BAGIAN VII: KEABSAHAN & DIGITAL AUDIT TRAIL */}
              <div className="print-avoid-break pt-3 border-t border-gray-300 text-[8.5px] text-gray-600 text-center leading-relaxed space-y-1">
                <div className="font-mono font-bold text-gray-700">
                  [ KODE OTENTIKASI ELEKTRONIK: SIATI-VERIFIED-{ticket.ticketNumber}-CSAT{ratingScore} ]
                </div>
                <p>
                  Dokumen Berita Acara & Laporan Hasil Perbaikan Layanan TI ini diterbitkan secara otomatis dan sah melalui Sistem SIATI (Sistem Informasi Aduan & Ticketing Terpadu TI).
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
