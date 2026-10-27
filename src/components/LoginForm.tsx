"use client";

import React, { useState, useEffect, useTransition } from "react";
import { loginAction } from "@/actions/auth";
import { RefreshCw, Lock, User, ShieldCheck, AlertCircle, Eye, EyeOff } from "lucide-react";
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
  const [showPassword, setShowPassword] = useState(false);
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captchaData, setCaptchaData] = useState<CaptchaResponse | null>(null);
  const [loadingCaptcha, setLoadingCaptcha] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    username?: string;
    password?: string;
    captchaAnswer?: string;
  }>({});
  const [errorType, setErrorType] = useState<
    "CAPTCHA_ERROR" | "CREDENTIALS_ERROR" | "ACCOUNT_LOCKED" | "GENERAL_ERROR" | null
  >(null);

  const loadNewCaptcha = async () => {
    setLoadingCaptcha(true);
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
    setFieldErrors({});
    setErrorType(null);

    if (!captchaData) {
      setErrorMessage("Kode CAPTCHA belum termuat. Silakan tunggu sejenak.");
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
          window.location.href = "/dashboard";
        }, 500);
      } else {
        setErrorMessage(result.message || "Gagal masuk.");
        setFieldErrors(result.fieldErrors || {});
        setErrorType(result.errorType || null);

        // Refresh CAPTCHA on failure to prevent replay.
        loadNewCaptcha();
      }
    });
  };

  const isCaptchaError = errorType === "CAPTCHA_ERROR" || !!fieldErrors.captchaAnswer;
  const isCredentialsError = errorType === "CREDENTIALS_ERROR" || (!!fieldErrors.username && !!fieldErrors.password);

  return (
    <div className="w-full max-w-md mx-auto p-2 xs:p-4 sm:p-6">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl dark:shadow-2xl border border-slate-200/80 dark:border-white/10 p-5 sm:p-8 transition-colors duration-200">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded-2xl mb-3 shadow-inner border border-sky-100 dark:border-sky-500/20">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">SIATI</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Sistem Informasi Aduan & Ticketing TI Rumah Sakit
          </p>
        </div>

        {/* Notifikasi Error CAPTCHA Spesifik */}
        {isCaptchaError && errorMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-500/40 text-amber-800 dark:text-amber-200 text-xs sm:text-sm flex items-start gap-2.5 animate-shake shadow-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <div className="flex-1">
              <span className="font-bold block">Verifikasi CAPTCHA Gagal</span>
              <span className="text-xs text-amber-700 dark:text-amber-300/90 leading-relaxed">
                {errorMessage} Gambar kode telah diperbarui, silakan masukkan kembali.
              </span>
            </div>
          </div>
        )}

        {/* Notifikasi Error Kredensial Username / Password Salah */}
        {!isCaptchaError && isCredentialsError && errorMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-500/40 text-rose-800 dark:text-rose-200 text-xs sm:text-sm flex items-start gap-2.5 animate-shake shadow-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
            <div className="flex-1">
              <span className="font-bold block">Username atau Kata Sandi Salah</span>
              <span className="text-xs text-rose-700 dark:text-rose-300/90 leading-relaxed">
                {errorMessage} Mohon periksa kembali huruf besar/kecil pada username dan kata sandi Anda.
              </span>
            </div>
          </div>
        )}

        {/* Notifikasi Error Umum / Akun Terkunci */}
        {!isCaptchaError && !isCredentialsError && errorMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs sm:text-sm flex items-start gap-2.5 animate-shake shadow-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold block">Gagal Masuk</span>
              <span className="text-xs text-rose-700 dark:text-rose-300/90 leading-relaxed">{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Notifikasi Sukses */}
        {successMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm flex items-center gap-2.5 shadow-sm">
            <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span className="font-medium">{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Input Username (Nama Depan / NIP) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Username (Nama Depan / NIP)
              </label>
              {fieldErrors.username && (
                <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                  Tidak Cocok
                </span>
              )}
            </div>
            <div className="relative">
              <div
                className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors ${
                  fieldErrors.username ? "text-rose-500" : "text-slate-400"
                }`}
              >
                <User className="w-5 h-5" />
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (fieldErrors.username || fieldErrors.password) {
                    setFieldErrors((prev) => ({ ...prev, username: undefined, password: undefined }));
                  }
                  if (errorMessage && isCredentialsError) {
                    setErrorMessage(null);
                  }
                }}
                placeholder="Contoh: hendra, dewi, admin"
                autoCapitalize="none"
                autoCorrect="off"
                className={`w-full pl-11 pr-4 py-3 rounded-xl border text-slate-900 dark:text-white text-sm focus:outline-none transition-all ${
                  fieldErrors.username
                    ? "border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 ring-2 ring-rose-500/20 focus:ring-rose-500 focus:border-rose-500"
                    : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-sky-500 focus:bg-white dark:focus:bg-slate-800"
                }`}
              />
            </div>
            {fieldErrors.username && (
              <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{fieldErrors.username}</span>
              </p>
            )}
          </div>

          {/* Input Password dengan Toggle Lihat Sandi */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Kata Sandi
              </label>
              {fieldErrors.password && (
                <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                  Tidak Cocok
                </span>
              )}
            </div>
            <div className="relative">
              <div
                className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors ${
                  fieldErrors.password ? "text-rose-500" : "text-slate-400"
                }`}
              >
                <Lock className="w-5 h-5" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.username || fieldErrors.password) {
                    setFieldErrors((prev) => ({ ...prev, username: undefined, password: undefined }));
                  }
                  if (errorMessage && isCredentialsError) {
                    setErrorMessage(null);
                  }
                }}
                placeholder="Masukkan kata sandi"
                className={`w-full pl-11 pr-11 py-3 rounded-xl border text-slate-900 dark:text-white text-sm focus:outline-none transition-all ${
                  fieldErrors.password
                    ? "border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 ring-2 ring-rose-500/20 focus:ring-rose-500 focus:border-rose-500"
                    : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-sky-500 focus:bg-white dark:focus:bg-slate-800"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded-lg transition-colors"
                title={showPassword ? "Sembunyikan kata sandi" : "Lihat kata sandi"}
                aria-label={showPassword ? "Sembunyikan kata sandi" : "Lihat kata sandi"}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200" />
                ) : (
                  <Eye className="w-5 h-5 text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200" />
                )}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{fieldErrors.password}</span>
              </p>
            )}
          </div>

          {/* Modul Keamanan CAPTCHA Gambar Interaktif */}
          <div className="pt-1">
            <div className="flex items-center justify-between mb-1.5">
              <label
                className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 ${
                  fieldErrors.captchaAnswer ? "text-rose-600 dark:text-rose-400" : "text-slate-700 dark:text-slate-300"
                }`}
              >
                <ShieldCheck
                  className={`w-3.5 h-3.5 ${
                    fieldErrors.captchaAnswer ? "text-rose-600 dark:text-rose-400" : "text-sky-600 dark:text-sky-400"
                  }`}
                />
                Kode Keamanan CAPTCHA
              </label>
              <button
                type="button"
                onClick={loadNewCaptcha}
                disabled={loadingCaptcha}
                className="text-xs text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 font-medium inline-flex items-center gap-1 transition-colors"
                title="Ganti Gambar Kode"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingCaptcha ? "animate-spin" : ""}`} />
                Ganti Gambar
              </button>
            </div>

            <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2.5 sm:gap-3">
              {/* Tampilan Gambar SVG Kode CAPTCHA */}
              <div
                className={`h-12 w-full xs:w-40 sm:w-44 shrink-0 border rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-inner transition-colors ${
                  fieldErrors.captchaAnswer
                    ? "border-rose-400 dark:border-rose-500/60 ring-2 ring-rose-500/20"
                    : "border-slate-200 dark:border-slate-700"
                }`}
              >
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

              {/* Input Ketik Kode Gambar dengan Error State */}
              <div className="flex-1">
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={captchaAnswer}
                  onChange={(e) => {
                    setCaptchaAnswer(e.target.value.toUpperCase());
                    if (fieldErrors.captchaAnswer) {
                      setFieldErrors((prev) => ({ ...prev, captchaAnswer: undefined }));
                    }
                    if (errorMessage && isCaptchaError) {
                      setErrorMessage(null);
                    }
                  }}
                  placeholder="Ketik kode"
                  autoComplete="off"
                  autoCapitalize="characters"
                  className={`w-full px-3.5 py-3 rounded-xl border text-slate-900 dark:text-white text-sm text-center font-bold tracking-widest uppercase focus:outline-none transition-all ${
                    fieldErrors.captchaAnswer
                      ? "border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 ring-2 ring-rose-500/20 focus:ring-rose-500 focus:border-rose-500"
                      : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-sky-500 focus:bg-white dark:focus:bg-slate-800"
                  }`}
                />
              </div>
            </div>

            {fieldErrors.captchaAnswer ? (
              <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{fieldErrors.captchaAnswer}</span>
              </p>
            ) : (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Ketik 5 karakter yang tampak pada gambar di atas (huruf besar/kecil sama saja).
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full mt-2 py-3.5 px-4 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-semibold rounded-xl shadow-sm flex items-center justify-center gap-2 text-sm transition-all disabled:opacity-60 disabled:pointer-events-none"
          >
            {isPending ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Memverifikasi...
              </>
            ) : (
              "Masuk ke SIATI"
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
