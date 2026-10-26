"use client";

import React, { useState, useTransition, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { KeyRound, Eye, EyeOff, CheckCircle2, AlertCircle, X, Check, ShieldCheck } from "lucide-react";
import { changePasswordAction } from "@/actions/auth";
import { modalBackdropVariants, modalContentVariants } from "@/lib/motionVariants";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const [mounted, setMounted] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [feedback, setFeedback] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const rules = [
    {
      id: "length",
      label: "Minimal 8 karakter",
      met: newPassword.length >= 8,
    },
    {
      id: "uppercase",
      label: "Mengandung huruf besar (A-Z)",
      met: /[A-Z]/.test(newPassword),
    },
    {
      id: "number",
      label: "Mengandung angka (0-9)",
      met: /[0-9]/.test(newPassword),
    },
    {
      id: "special",
      label: "Karakter khusus (@, #, $, !, dll)",
      met: /[^A-Za-z0-9]/.test(newPassword),
    },
  ];

  const allRulesMet = rules.every((r) => r.met);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isPending) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isPending, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowCurrent(false);
      setShowNew(false);
      setShowConfirm(false);
      setFeedback(null);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFeedback(null);

    if (!currentPassword) {
      setFeedback({ type: "error", text: "Kata sandi saat ini harus diisi." });
      return;
    }

    if (!allRulesMet) {
      setFeedback({
        type: "error",
        text: "Harap penuhi semua syarat keamanan kata sandi baru di bawah ini.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setFeedback({ type: "error", text: "Konfirmasi kata sandi baru tidak cocok." });
      return;
    }

    if (currentPassword === newPassword) {
      setFeedback({
        type: "error",
        text: "Kata sandi baru tidak boleh sama dengan kata sandi saat ini.",
      });
      return;
    }

    const formData = new FormData();
    formData.append("currentPassword", currentPassword);
    formData.append("newPassword", newPassword);
    formData.append("confirmPassword", confirmPassword);

    startTransition(async () => {
      const res = await changePasswordAction(formData);
      if (res.success) {
        setFeedback({ type: "success", text: res.message || "Kata sandi berhasil diperbarui." });
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setFeedback({ type: "error", text: res.message || "Gagal memperbarui kata sandi." });
      }
    });
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={modalBackdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={onClose}
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        >
          <motion.div
            variants={modalContentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            className="my-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl relative"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-200 dark:border-sky-500/20 shrink-0">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Ganti Kata Sandi
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Perbarui kata sandi akun SIATI Anda secara mandiri.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                aria-label="Tutup modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Feedback Message */}
            {feedback && (
              <div
                className={`mt-4 p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  feedback.type === "success"
                    ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
                    : "bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-500/30 text-rose-800 dark:text-rose-300"
                }`}
              >
                {feedback.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                )}
                <span>{feedback.text}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
              {/* Kata Sandi Saat Ini */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                  Kata Sandi Saat Ini
                </label>
                <div className="relative">
                  <input
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    disabled={isPending}
                    placeholder="Masukkan kata sandi lama"
                    className="w-full px-3 py-2.5 pr-10 rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                    aria-label={showCurrent ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                  >
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Kata Sandi Baru */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                    Kata Sandi Baru
                  </label>
                  <span className="text-[11px] text-slate-400">Min. 8 karakter</span>
                </div>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    disabled={isPending}
                    placeholder="Ketik kata sandi baru"
                    className="w-full px-3 py-2.5 pr-10 rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                    aria-label={showNew ? "Sembunyikan kata sandi baru" : "Tampilkan kata sandi baru"}
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Syarat Keamanan Kata Sandi Baru */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Syarat Keamanan Kata Sandi:
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      allRulesMet
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-500/30"
                        : "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-500/30"
                    }`}
                  >
                    {allRulesMet ? "Semua Syarat Terpenuhi" : "Belum Memenuhi Syarat"}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-0.5">
                  {rules.map((rule) => (
                    <div
                      key={rule.id}
                      className={`flex items-center gap-1.5 text-[11px] transition-colors ${
                        rule.met
                          ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                          : "text-rose-600 dark:text-rose-400 font-medium"
                      }`}
                    >
                      {rule.met ? (
                        <Check className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <X className="w-3.5 h-3.5 shrink-0 text-rose-500 dark:text-rose-400" />
                      )}
                      <span>{rule.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Konfirmasi Kata Sandi Baru */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                  Ulangi Kata Sandi Baru
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    disabled={isPending}
                    placeholder="Ulangi kata sandi baru"
                    className="w-full px-3 py-2.5 pr-10 rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                    aria-label={showConfirm ? "Sembunyikan konfirmasi kata sandi" : "Tampilkan konfirmasi kata sandi"}
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword.length > 0 && (
                  <div
                    className={`flex items-center gap-1.5 text-[11px] mt-1 font-medium ${
                      confirmPassword === newPassword
                        ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                        : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {confirmPassword === newPassword ? (
                      <Check className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <X className="w-3.5 h-3.5 shrink-0 text-rose-500 dark:text-rose-400" />
                    )}
                    <span>
                      {confirmPassword === newPassword
                        ? "Konfirmasi kata sandi cocok"
                        : "Konfirmasi kata sandi belum cocok"}
                    </span>
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isPending}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold shadow-sm transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isPending ? "Menyimpan..." : "Simpan Kata Sandi"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
