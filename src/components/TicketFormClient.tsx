"use client";

import React, { useState, useRef, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createTicketAction, AttachmentInput } from "@/actions/tickets";
import { TicketUrgency } from "@prisma/client";
import {
  ArrowLeft,
  Camera,
  Video,
  X,
  Send,
  AlertCircle,
  CheckCircle2,
  Loader2,
  MapPin,
  Sparkles,
  ShieldAlert,
} from "lucide-react";
import MediaViewerModal, { MediaAttachmentItem } from "@/components/MediaViewerModal";

interface Unit {
  id: number;
  name: string;
  buildingZone: string;
}

interface Category {
  id: number;
  name: string;
  description: string | null;
  targetSlaMinutes: number;
}

interface TicketFormClientProps {
  defaultUnitId: number;
  units: Unit[];
  categories: Category[];
  userName: string;
}

export default function TicketFormClient({
  defaultUnitId,
  units,
  categories,
  userName,
}: TicketFormClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [unitId, setUnitId] = useState<number>(defaultUnitId);
  const [categoryId, setCategoryId] = useState<number>(categories[0]?.id || 1);
  const [description, setDescription] = useState("");

  const [attachments, setAttachments] = useState<
    (AttachmentInput & { previewUrl: string })[]
  >([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{
    ticketNumber: string;
    ticketId: string;
  } | null>(null);
  const [activeMedia, setActiveMedia] = useState<MediaAttachmentItem | null>(null);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Quick suggestions template
  const quickTags = [
    "Printer label pasien macet / paper jam",
    "SIMRS hang saat simpan rekam medis",
    "Gagal bridging BPJS V-Claim",
    "PC poliklinik mati total / monitor blank",
    "Koneksi WiFi / internet ruangan terputus",
  ];

  // Upload handler with magic bytes validation
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal mengunggah file.");
      }

      setAttachments((prev) => [...prev, data.attachment]);
    } catch (err: unknown) {
      const error = err as Error;
      setUploadError(error.message || "Gagal mengunggah berkas.");
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleRemoveAttachment = (storedFilename: string) => {
    setAttachments((prev) => prev.filter((a) => a.storedFilename !== storedFilename));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    startTransition(async () => {
      const res = await createTicketAction({
        unitId,
        categoryId,
        urgency: TicketUrgency.MEDIUM, // Tingkat urgensi ditentukan staf TI RSBM
        description,
        attachments: attachments.map((att) => ({
          storedFilename: att.storedFilename,
          originalName: att.originalName,
          fileType: att.fileType,
          mimeType: att.mimeType,
          fileSizeBytes: att.fileSizeBytes,
          sha256Hash: att.sha256Hash,
        })),
      });

      if (res.success && res.data) {
        setSuccessResult(res.data);
      } else {
        setSubmitError(res.message || "Gagal menerbitkan tiket.");
      }
    });
  };

  // Tampilan Sukses Setelah Terbit
  if (successResult) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 sm:p-8 md:p-10 text-center space-y-5 shadow-lg max-w-lg mx-auto transition-colors">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Aduan Berhasil Diterbitkan!
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Tiket laporan Anda telah masuk ke sistem antrean TI RSBM.
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-950 p-4 sm:p-5 rounded-2xl border border-sky-300 dark:border-sky-500/30 inline-block w-full shadow-inner">
          <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Nomor Tiket Resmi:</span>
          <span className="text-2xl sm:text-3xl font-mono font-bold text-sky-600 dark:text-sky-400 tracking-wider">
            {successResult.ticketNumber}
          </span>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
          Notifikasi telah dikirimkan ke tim siaga TI rumah sakit. Staf TI akan segera menetapkan tingkat urgensi dan melakukan penanganan.
        </p>

        <div className="pt-2">
          <Link
            href="/dashboard"
            className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm shadow-md transition-all active:scale-95"
          >
            Kembali ke Beranda Tiket
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6 pb-20">
      {/* Header Form */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 sm:p-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 shadow-sm transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight truncate">
              Lapor Kendala TI Baru
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Pelapor: <strong className="text-slate-800 dark:text-slate-200">{userName}</strong>
            </p>
          </div>
        </div>
      </div>

      {submitError && (
        <div className="p-4 bg-rose-50 dark:bg-rose-500/20 border border-rose-200 dark:border-rose-500/40 text-rose-700 dark:text-rose-300 rounded-xl text-xs sm:text-sm flex items-center gap-2.5 shadow-sm">
          <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      {/* Form Container: Responsive 1-col on mobile/fold, 2-col on Tablet & Desktop */}
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 sm:p-6 md:p-7 lg:p-8 shadow-sm transition-colors"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-8">
          {/* Kolom Kiri (Mobile: Atas, Tablet & Desktop: Kiri 6-kolom): Lokasi & Kategori */}
          <div className="md:col-span-6 space-y-5 sm:space-y-6">
            {/* 1. Pilih Lokasi / Unit Ruangan */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                1. Lokasi Ruangan / Bangsal Pelayanan
              </label>
              <select
                value={unitId}
                onChange={(e) => setUnitId(Number(e.target.value))}
                className="w-full px-3.5 py-3 rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white dark:focus:bg-slate-850 transition-all font-medium"
              >
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} — ({u.buildingZone})
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                Pilih ruangan tempat perangkat TI yang mengalami kendala.
              </span>
            </div>

            {/* 2. Pilih Kategori Masalah IT */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  2. Kategori Kendala TI
                </label>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Pilih salah satu</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {categories.map((cat) => {
                  const isSelected = categoryId === cat.id;
                  return (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => setCategoryId(cat.id)}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? "bg-sky-50 dark:bg-sky-600/20 border-sky-500 dark:border-sky-400 text-sky-950 dark:text-white ring-2 ring-sky-500/20 shadow-sm"
                          : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-xs sm:text-sm block">{cat.name}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${isSelected ? "bg-sky-200 dark:bg-sky-500/30 text-sky-800 dark:text-sky-200" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"}`}>
                          SLA {cat.targetSlaMinutes}m
                        </span>
                      </div>
                      {cat.description && (
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block line-clamp-1">
                          {cat.description}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Kolom Kanan (Mobile: Bawah, Tablet & Desktop: Kanan 6-kolom): Deskripsi, Lampiran, Tombol */}
          <div className="md:col-span-6 space-y-5 sm:space-y-6 flex flex-col justify-between">
            <div className="space-y-5 sm:space-y-6">
              {/* 4. Deskripsi Gejala Kerusakan */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    3. Deskripsi Masalah & Gejala Kerusakan
                  </label>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Min. 10 Karakter</span>
                </div>

                {/* Quick Tags Suggestions */}
                <div className="flex flex-wrap gap-1.5 py-1">
                  {quickTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setDescription(tag)}
                      className="text-[10px] xs:text-[11px] px-2.5 sm:px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 flex items-center gap-1.5 active:scale-95 transition-all text-left"
                    >
                      <Sparkles className="w-3 h-3 text-sky-500 dark:text-sky-400 shrink-0" />
                      <span className="truncate max-w-[200px] xs:max-w-[260px] sm:max-w-none">{tag}</span>
                    </button>
                  ))}
                </div>

                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Jelaskan kendala yang dialami secara rinci, misalnya: Printer di meja kasir macet berbunyi beep terus dan lampu merah berkedip saat cetak struk.."
                  className="w-full p-3.5 sm:p-4 rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white dark:focus:bg-slate-850 transition-all leading-relaxed"
                />
              </div>

              {/* 5. Upload Lampiran Media (Foto & Video) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    4. Lampiran Bukti (Foto / Video 60s)
                  </label>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Opsional</span>
                </div>

                {/* Hidden native camera inputs */}
                <input
                  type="file"
                  ref={photoInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                />
                <input
                  type="file"
                  ref={videoInputRef}
                  onChange={handleFileUpload}
                  accept="video/*"
                  capture="environment"
                  className="hidden"
                />

                {/* Action Buttons: Stack on narrow fold (<360px), 2-col on standard screens */}
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-2.5 sm:gap-3">
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={() => photoInputRef.current?.click()}
                    className="py-3 sm:py-3.5 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-300 dark:border-white/15 hover:border-sky-500 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-60 shadow-sm"
                  >
                    <Camera className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                    <span>Ambil / Pilih Foto</span>
                  </button>

                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={() => videoInputRef.current?.click()}
                    className="py-3 sm:py-3.5 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-300 dark:border-white/15 hover:border-amber-500 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-60 shadow-sm"
                  >
                    <Video className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>Rekam Video (60s)</span>
                  </button>
                </div>

                {/* Upload Status / Error */}
                {isUploading && (
                  <div className="text-xs text-sky-700 dark:text-sky-300 flex items-center gap-2 p-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-500/20">
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                    <span>Sedang memproses & memindai keamanan berkas...</span>
                  </div>
                )}

                {uploadError && (
                  <div className="text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/20">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}

                {/* Thumbnail Preview Berkas Terupload */}
                {attachments.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                      Berkas Terlampir ({attachments.length}):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {attachments.map((att) => (
                        <div
                          key={att.storedFilename}
                          className="relative group bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl p-3 flex items-center gap-3 overflow-hidden shadow-sm"
                        >
                          <div
                            onClick={() =>
                              setActiveMedia({
                                id: att.storedFilename,
                                fileType: att.fileType,
                                storedFilename: att.storedFilename,
                                originalName: att.originalName,
                              })
                            }
                            className="w-11 h-11 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                            title="Klik untuk melihat pratinjau"
                          >
                            {att.fileType === "IMAGE" ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={att.previewUrl}
                                alt="Thumbnail"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Video className="w-5 h-5 text-amber-500" />
                            )}
                          </div>

                          <div
                            onClick={() =>
                              setActiveMedia({
                                id: att.storedFilename,
                                fileType: att.fileType,
                                storedFilename: att.storedFilename,
                                originalName: att.originalName,
                              })
                            }
                            className="flex-1 min-w-0 cursor-pointer"
                            title="Klik untuk melihat pratinjau"
                          >
                            <span className="text-xs font-semibold text-slate-800 dark:text-white block truncate hover:text-sky-600 transition-colors">
                              {att.originalName}
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                              {(att.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB • {att.fileType}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveAttachment(att.storedFilename)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            title="Hapus Lampiran"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tombol Terbitkan Tiket */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={isPending || isUploading || description.trim().length < 10}
                className="w-full py-4 px-5 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 active:scale-[0.99] text-white font-bold rounded-xl shadow-lg shadow-sky-600/25 flex items-center justify-center gap-2 text-sm sm:text-base transition-all disabled:opacity-50 disabled:pointer-events-none"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Menerbitkan Tiket...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Terbitkan Tiket Aduan Sekarang
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Modal Penampil Foto & Video Responsif (Mobile / Tablet / PC) */}
      <MediaViewerModal media={activeMedia} onClose={() => setActiveMedia(null)} />
    </div>
  );
}
