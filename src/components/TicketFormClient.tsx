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
  Image as ImageIcon,
  Loader2,
  MapPin,
  Sparkles,
} from "lucide-react";

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
  const [urgency, setUrgency] = useState<TicketUrgency>(TicketUrgency.MEDIUM);
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

  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Common quick template descriptions for nurses/doctors
  const quickTags = [
    "Printer label pasien macet / paper jam",
    "SIMRS hang saat simpan rekam medis",
    "Gagal bridging BPJS V-Claim",
    "PC poliklinik mati total / monitor blank",
    "Koneksi WiFi / internet ruangan terputus",
  ];

  // Handler Upload Media Langsung ke API Sanitasi Magic Bytes
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
      // Reset input agar bisa memilih file yang sama jika diinginkan
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
        urgency,
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
      <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 sm:p-8 text-center space-y-4 shadow-xl max-w-lg mx-auto">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          Aduan Berhasil Diterbitkan!
        </h2>
        <div className="bg-slate-950 p-4 rounded-xl border border-sky-500/30 inline-block w-full">
          <span className="text-xs text-slate-400 block">Nomor Tiket Resmi:</span>
          <span className="text-2xl font-mono font-bold text-sky-400 tracking-wider">
            {successResult.ticketNumber}
          </span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Notifikasi telah dikirimkan ke tim siaga IT rumah sakit. Teknisi akan segera merespon sesuai skala prioritas yang ditentukan.
        </p>
        <div className="pt-2">
          <Link
            href="/dashboard"
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm shadow-md transition-all"
          >
            Kembali ke Dashboard Tiket
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-16">
      {/* Header Form */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/10 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Lapor Kendala IT Baru
            </h1>
            <p className="text-xs text-slate-400">
              Pelapor: <strong className="text-slate-200">{userName}</strong>
            </p>
          </div>
        </div>
      </div>

      {submitError && (
        <div className="p-3.5 bg-rose-500/20 border border-rose-500/40 text-rose-300 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 1. Pilih Lokasi / Unit Ruangan */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-sky-400" />
            Lokasi Ruangan / Bangsal Pelayanan
          </label>
          <select
            value={unitId}
            onChange={(e) => setUnitId(Number(e.target.value))}
            className="w-full px-3.5 py-3 rounded-xl border border-white/10 bg-slate-900 text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
          >
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.buildingZone})
              </option>
            ))}
          </select>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Pilih ruangan tempat perangkat IT yang bermasalah berada.
          </span>
        </div>

        {/* 2. Pilih Kategori Masalah IT */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Kategori Kendala
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {categories.map((cat) => {
              const isSelected = categoryId === cat.id;
              return (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setCategoryId(cat.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? "bg-sky-600/30 border-sky-400 text-white shadow-md shadow-sky-600/20"
                      : "bg-slate-900/60 border-white/10 text-slate-300 hover:border-white/20"
                  }`}
                >
                  <span className="font-bold text-xs block">{cat.name}</span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Target SLA: {cat.targetSlaMinutes} Menit
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Tingkat Urgensi (SLA Impact) */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Tingkat Urgensi Masalah
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setUrgency(TicketUrgency.EMERGENCY)}
              className={`p-3 rounded-xl border text-left transition-all ${
                urgency === TicketUrgency.EMERGENCY
                  ? "bg-rose-500/30 border-rose-400 text-rose-200 shadow-md shadow-rose-950/50"
                  : "bg-slate-900/60 border-white/10 text-slate-400"
              }`}
            >
              <span className="font-bold text-xs flex items-center gap-1.5 text-rose-400">
                🔴 P1 - DARURAT
              </span>
              <span className="text-[10px] text-slate-300 block mt-0.5">
                Pelayanan pasien berhenti total (IGD/Farmasi/OK)
              </span>
            </button>

            <button
              type="button"
              onClick={() => setUrgency(TicketUrgency.HIGH)}
              className={`p-3 rounded-xl border text-left transition-all ${
                urgency === TicketUrgency.HIGH
                  ? "bg-orange-500/30 border-orange-400 text-orange-200 shadow-md shadow-orange-950/50"
                  : "bg-slate-900/60 border-white/10 text-slate-400"
              }`}
            >
              <span className="font-bold text-xs flex items-center gap-1.5 text-orange-400">
                🟠 P2 - TINGGI
              </span>
              <span className="text-[10px] text-slate-300 block mt-0.5">
                Layanan melambat tapi ada alternatif
              </span>
            </button>

            <button
              type="button"
              onClick={() => setUrgency(TicketUrgency.MEDIUM)}
              className={`p-3 rounded-xl border text-left transition-all ${
                urgency === TicketUrgency.MEDIUM
                  ? "bg-amber-500/30 border-amber-400 text-amber-200 shadow-md shadow-amber-950/50"
                  : "bg-slate-900/60 border-white/10 text-slate-400"
              }`}
            >
              <span className="font-bold text-xs flex items-center gap-1.5 text-amber-400">
                🟡 P3 - SEDANG
              </span>
              <span className="text-[10px] text-slate-300 block mt-0.5">
                Kendala minor administrasi
              </span>
            </button>

            <button
              type="button"
              onClick={() => setUrgency(TicketUrgency.LOW)}
              className={`p-3 rounded-xl border text-left transition-all ${
                urgency === TicketUrgency.LOW
                  ? "bg-emerald-500/30 border-emerald-400 text-emerald-200 shadow-md shadow-emerald-950/50"
                  : "bg-slate-900/60 border-white/10 text-slate-400"
              }`}
            >
              <span className="font-bold text-xs flex items-center gap-1.5 text-emerald-400">
                🟢 P4 - RENDAH
              </span>
              <span className="text-[10px] text-slate-300 block mt-0.5">
                Pemasangan baru / pemeliharaan rutin
              </span>
            </button>
          </div>
        </div>

        {/* 4. Deskripsi Gejala Kerusakan */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Deskripsi Masalah / Gejala Kerusakan
            </label>
            <span className="text-[11px] text-slate-400">Min. 10 Karakter</span>
          </div>

          {/* Quick Tags Suggestions */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {quickTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setDescription(tag)}
                className="text-[10px] px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10 flex items-center gap-1"
              >
                <Sparkles className="w-2.5 h-2.5 text-sky-400" />
                {tag}
              </button>
            ))}
          </div>

          <textarea
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Jelaskan kendala yang dialami, misalnya: Printer di meja kasir macet berbunyi beep terus dan lampu merah berkedip.."
            className="w-full p-3.5 rounded-xl border border-white/10 bg-slate-900 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        {/* 5. Upload Lampiran Media (Foto & Video) */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Lampiran Bukti (Foto / Video Singkat 60s)
          </label>

          {/* Hidden inputs untuk file native camera capture */}
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

          {/* Action Buttons for Mobile Camera */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              disabled={isUploading}
              onClick={() => photoInputRef.current?.click()}
              className="py-3 px-4 rounded-xl bg-slate-900 border border-white/15 hover:border-sky-400 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-60"
            >
              <Camera className="w-4 h-4 text-sky-400" />
              <span>Ambil / Pilih Foto</span>
            </button>

            <button
              type="button"
              disabled={isUploading}
              onClick={() => videoInputRef.current?.click()}
              className="py-3 px-4 rounded-xl bg-slate-900 border border-white/15 hover:border-amber-400 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-60"
            >
              <Video className="w-4 h-4 text-amber-400" />
              <span>Rekam Video (60s)</span>
            </button>
          </div>

          {/* Upload Status / Error */}
          {isUploading && (
            <div className="mt-2 text-xs text-sky-400 flex items-center gap-2 p-2 rounded-lg bg-sky-950/40 border border-sky-500/20">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Sedang memproses dan mensanitasi berkas aman...</span>
            </div>
          )}

          {uploadError && (
            <div className="mt-2 text-xs text-rose-400 flex items-center gap-2 p-2 rounded-lg bg-rose-950/40 border border-rose-500/20">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Thumbnail Preview Berkas Terupload */}
          {attachments.length > 0 && (
            <div className="mt-3 space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Berkas Terlampir ({attachments.length}):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {attachments.map((att) => (
                  <div
                    key={att.storedFilename}
                    className="relative group bg-slate-900 border border-white/10 rounded-xl p-2.5 flex items-center gap-2.5 overflow-hidden"
                  >
                    <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden">
                      {att.fileType === "IMAGE" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={att.previewUrl}
                          alt="Thumbnail"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Video className="w-5 h-5 text-amber-400" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-medium text-white block truncate">
                        {att.originalName}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {(att.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB • {att.fileType}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(att.storedFilename)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
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

        {/* Tombol Terbitkan Tiket Sticky */}
        <div className="pt-3">
          <button
            type="submit"
            disabled={isPending || isUploading || description.trim().length < 10}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 active:scale-[0.99] text-white font-bold rounded-xl shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2 text-sm transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Menerbitkan Tiket...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Terbitkan Tiket Aduan Sekarang
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
