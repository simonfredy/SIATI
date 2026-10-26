import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import LoginForm from "@/components/LoginForm";
import ThemeToggle from "@/components/ThemeToggle";
import { Activity, ShieldCheck, Cpu } from "lucide-react";

export const instant = false;

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between transition-colors duration-200">
      <header className="w-full px-4 sm:px-6 py-3.5 flex items-center justify-between border-b border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-400/30">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="text-slate-900 dark:text-white font-bold text-sm tracking-wide">SIATI</span>
            <span className="text-slate-500 dark:text-slate-400 text-xs block -mt-0.5">Sistem Aduan & Ticketing TI</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="hidden lg:flex lg:col-span-6 flex-col space-y-6">
            <div className="space-y-3">
              <h1 className="text-3xl xl:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                Layanan Siaga & Kendali Cepat Teknologi Informasi
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Platform pelaporan kendala digital fasilitas rumah sakit untuk percepatan pemulihan SIMRS, bridging BPJS, rekam medis elektronik, perangkat keras, dan jaringan medis.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">Stopwatch SLA</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block leading-relaxed">
                  Perhitungan menit respon dan durasi perbaikan bersih otomatis.
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">Bukti Foto & Video</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block leading-relaxed">
                  Unggah langsung dari kamera dengan verifikasi integritas berkas.
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">Skala Urgensi P1-P4</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block leading-relaxed">
                  Klasifikasi prioritas penanganan disesuaikan dengan dampak operasional.
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">Keamanan Akses Terpadu</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block leading-relaxed">
                  Verifikasi CAPTCHA grafis, mitigasi brute force, dan jejak audit forensik.
                </span>
              </div>
            </div>
          </div>

          <div className="w-full lg:col-span-6 flex justify-center">
            <LoginForm />
          </div>
        </div>
      </main>

      <footer className="py-4 px-4 border-t border-slate-200 dark:border-white/10 text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900">
        <div className="max-w-md mx-auto flex items-center justify-between text-[11px]">
          <span className="flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 text-sky-500" />
            v1.4.0 LTS
          </span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Standar Keamanan TI
          </span>
          <span>© 2026 SIATI</span>
        </div>
      </footer>
    </div>
  );
}
