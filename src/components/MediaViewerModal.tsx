"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Download,
  Image as ImageIcon,
  Video as VideoIcon,
  Maximize2,
  Minimize2,
  ExternalLink,
  Volume2,
} from "lucide-react";
import { modalBackdropVariants, modalContentVariants } from "@/lib/motionVariants";

export interface MediaAttachmentItem {
  id: string;
  fileType: "IMAGE" | "VIDEO";
  storedFilename: string;
  originalName: string;
}

interface MediaViewerModalProps {
  media: MediaAttachmentItem | null;
  onClose: () => void;
}

export default function MediaViewerModal({
  media,
  onClose,
}: MediaViewerModalProps) {
  const [isZoomed, setIsZoomed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Kunci scroll body saat modal aktif dan tangani tombol ESC
  useEffect(() => {
    if (!media) return;

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
  }, [media, onClose]);

  // Reset zoom saat media berganti
  useEffect(() => {
    setIsZoomed(false);
  }, [media]);

  if (!media) return null;

  const mediaUrl = `/api/media/${media.storedFilename}`;
  const isVideo = media.fileType === "VIDEO";

  return (
    <AnimatePresence>
      <motion.div
        variants={modalBackdropVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-2.5 xs:p-4 sm:p-6 overflow-y-auto"
      >
        {/*
          CARD PENAMPIL MEDIA RESPONSIF:
          - Mobile  (< 640px) : w-[96vw] max-w-sm sm:max-w-md, p-3.5, rounded-2xl
          - Tablet  (640-1024px): max-w-2xl md:max-w-3xl, p-5, rounded-2xl
          - Laptop/PC (> 1024px): lg:max-w-4xl xl:max-w-5xl, p-6, rounded-3xl
        */}
        <motion.div
          variants={modalContentVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/15 rounded-2xl sm:rounded-3xl shadow-2xl w-[96vw] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl flex flex-col max-h-[92vh] sm:max-h-[90vh] overflow-hidden transition-all duration-300"
        >
          {/* Header Card Penampil */}
          <div className="p-3.5 sm:p-5 border-b border-slate-100 dark:border-white/10 flex items-center justify-between gap-3 shrink-0 bg-slate-50/80 dark:bg-slate-950/40">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                  isVideo
                    ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                    : "bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/30"
                }`}
              >
                {isVideo ? <VideoIcon className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full ${
                      isVideo
                        ? "bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30"
                        : "bg-sky-100 dark:bg-sky-500/20 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-500/30"
                    }`}
                  >
                    {isVideo ? "Rekaman Video Gangguan" : "Foto Bukti Kerusakan"}
                  </span>
                  <span className="text-[11px] text-slate-400 hidden xs:inline">•</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
                    Lampiran Medis Terproteksi
                  </span>
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate mt-0.5" title={media.originalName}>
                  {media.originalName}
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {!isVideo && (
                <button
                  type="button"
                  onClick={() => setIsZoomed((prev) => !prev)}
                  className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 transition-colors"
                  title={isZoomed ? "Ukuran Pas Layar" : "Perbesar Foto (100%)"}
                >
                  {isZoomed ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                  <span className="text-[11px]">{isZoomed ? "Fit" : "Zoom"}</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-all border border-slate-200 dark:border-white/10 active:scale-95"
                title="Tutup Pratinjau (ESC)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Area Konten Media (Fleksibel & Responsif Sesuai Ukuran Device) */}
          <div className="relative flex-1 min-h-[220px] max-h-[60vh] sm:max-h-[65vh] lg:max-h-[72vh] overflow-auto bg-slate-950 flex items-center justify-center p-2 sm:p-4">
            {isVideo ? (
              <div className="w-full h-full flex flex-col items-center justify-center">
                <video
                  ref={videoRef}
                  src={mediaUrl}
                  controls
                  playsInline
                  autoPlay
                  preload="metadata"
                  className="w-full max-h-[58vh] sm:max-h-[62vh] lg:max-h-[68vh] rounded-xl bg-black object-contain shadow-2xl focus:outline-none"
                >
                  <track kind="captions" />
                  Peramban Anda tidak mendukung pemutaran video langsung.
                </video>
                <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-2">
                  <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Kontrol player tersedia: Play, Pause, Scrubber, Volume, dan Fullscreen.</span>
                </div>
              </div>
            ) : (
              <div className={`w-full flex items-center justify-center transition-all duration-300 ${isZoomed ? "cursor-zoom-out overflow-auto" : "cursor-zoom-in"}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={mediaUrl}
                  alt={media.originalName}
                  onClick={() => setIsZoomed((prev) => !prev)}
                  className={`rounded-xl shadow-2xl transition-all duration-200 select-none ${
                    isZoomed
                      ? "max-w-none w-auto max-h-none object-none"
                      : "max-h-[58vh] sm:max-h-[62vh] lg:max-h-[68vh] w-auto max-w-full object-contain"
                  }`}
                />
              </div>
            )}
          </div>

          {/* Footer Card Penampil */}
          <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-white/10 flex flex-wrap items-center justify-between gap-2.5 shrink-0 bg-slate-50/60 dark:bg-slate-950/40 text-xs">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {isVideo ? "Format Video MP4 / WebM" : "Format Gambar JPEG / PNG / WebP"}
            </span>

            <div className="flex items-center gap-2">
              <a
                href={mediaUrl}
                download={media.originalName}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold flex items-center gap-1.5 transition-colors border border-slate-200 dark:border-white/10 shadow-sm active:scale-95 text-xs"
                title="Unduh berkas ke perangkat"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Berkas</span>
              </a>

              <a
                href={mediaUrl}
                target="_blank"
                rel="noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold transition-colors border border-slate-200 dark:border-white/10 text-xs"
                title="Buka URL asli di tab baru jika diperlukan"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Tab Baru</span>
              </a>

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold transition-all shadow-md shadow-sky-600/20 active:scale-95 text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
