"use client";

import React, { useState, useEffect, useTransition } from "react";
import { loginAction } from "@/actions/auth";
import { RefreshCw, Lock, User, ShieldCheck, AlertCircle, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

interface CaptchaResponse {
  token: string;
  svg: string;
  expiresAt: number;
}

export default function LoginForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captchaData, setCaptchaData] = useState<CaptchaResponse | null>(null);
  const [loadingCaptcha, setLoadingCaptcha] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fungsi untuk memuat CAPTCHA baru dari server
  const loadNewCaptcha = async () => {
    setLoadingCaptcha(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/auth/captcha", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setCaptchaData(data);
        setCaptchaAnswer("");
      }
    } catch {
      setErrorMessage("Gagal memuat kode CAPTCHA. Silakan muat ulang.");
    } finally {
      setLoadingCaptcha(false);
    }
  };

  useEffect(() => {
    loadNewCaptcha();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!captchaData) {
      setErrorMessage("Kode CAPTCHA belum termuat.");
      return;
    }

    const formData = new FormData();
    formData.append("username", username);
    formData.append("password", password);
    formData.append("captchaToken", captchaData.token);
    formData.append("captchaAnswer", captchaAnswer);

    startTransition(async () => {
      const result = await loginAction(formData);
      if (result.success) {
        setSuccessMessage("Login berhasil! Mengalihkan ke dashboard...");
        setTimeout(() => {
          router.push("/dashboard");
          router.refresh();
        }, 800);
      } else {
        setErrorMessage(result.message || "Gagal masuk.");
        // Muat ulang CAPTCHA jika gagal untuk mencegah replay attack
        loadNewCaptcha();
      }
    });
  };

  return (
    <div className="w-full max-w-md mx-auto p-2 xs:p-4 sm:p-6">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl dark:shadow-2xl border border-slate-200/80 dark:border-white/10 p-5 sm:p-8 transition-colors duration-200">
        {/* Header Identitas RS */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded-2xl mb-3 shadow-inner border border-sky-100 dark:border-sky-500/20">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">SIATI RSBM</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Sistem Informasi Aduan & Ticketing TI Rumah Sakit Bhayangkara Medan
          </p>
        </div>

        {/* Notifikasi Error */}
        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs sm:text-sm flex items-start gap-2.5 animate-shake">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Notifikasi Sukses */}
        {successMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Input Username (Nama Depan) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Username (Nama Depan)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-5 h-5" />
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Contoh: siti, rian, admin"
                autoCapitalize="none"
                autoCorrect="off"
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
              />
            </div>
          </div>

          {/* Input Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Kata Sandi
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi"
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
              />
            </div>
          </div>

          {/* Modul Keamanan CAPTCHA Gambar Interaktif */}
          <div className="pt-1">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                CAPTCHA
              </label>
              <button
                type="button"
                onClick={loadNewCaptcha}
                disabled={loadingCaptcha}
                className="text-xs text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 font-medium inline-flex items-center gap-1 transition-colors"
                title="Ganti Gambar Kode"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingCaptcha ? "animate-spin" : ""}`} />
                Ganti CAPTCHA
              </button>
            </div>

            <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2.5 sm:gap-3">
              {/* Tampilan Gambar SVG Kode CAPTCHA */}
              <div className="h-12 w-full xs:w-40 sm:w-44 shrink-0 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-inner">
                {captchaData ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={captchaData.svg}
                    alt="Captcha Security Code"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-xs text-slate-400 flex items-center gap-1">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Memuat...
                  </div>
                )}
              </div>

              {/* Input Ketik Kode Gambar */}
              <div className="flex-1">
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={captchaAnswer}
                  onChange={(e) => setCaptchaAnswer(e.target.value.toUpperCase())}
                  placeholder="Ketik kode"
                  autoComplete="off"
                  autoCapitalize="characters"
                  className="w-full px-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm text-center font-bold tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
                />
              </div>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Ketik 5 karakter yang tampak pada gambar di atas (huruf besar/kecil sama saja).
            </p>
          </div>

          {/* Tombol Masuk Utama */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 active:scale-[0.99] text-white font-semibold rounded-xl shadow-md shadow-sky-600/20 flex items-center justify-center gap-2 text-sm transition-all disabled:opacity-60 disabled:pointer-events-none"
          >
            {isPending ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Memverifikasi...
              </>
            ) : (
              <>
                Masuk ke SIATI
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Bantuan RS */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/10 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Lupa kata sandi atau butuh bantuan darurat?
          </p>
          <p className="text-xs font-medium text-sky-600 dark:text-sky-400 mt-0.5">
            Hubungi Staff TI
          </p>
        </div>
      </div>
    </div>
  );
}
