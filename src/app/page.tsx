import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import LoginForm from "@/components/LoginForm";
import ThemeToggle from "@/components/ThemeToggle";
import { Activity, ShieldAlert, Cpu } from "lucide-react";

export const instant = false;

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50/70 via-slate-50 to-blue-50/70 dark:from-slate-900 dark:via-slate-950 dark:to-sky-950 flex flex-col justify-between relative overflow-hidden transition-colors duration-200">
      {/* Background Subtle Medical Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#0284c7_1px,transparent_1px)] dark:bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none"></div>

      {/* Decorative Blur Circles */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-sky-200/40 dark:bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-blue-200/40 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Bar Status */}
      <header className="relative z-10 w-full px-4 sm:px-6 py-3.5 flex items-center justify-between border-b border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-400/30 shadow-sm">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="text-slate-800 dark:text-white font-bold text-sm tracking-wide">SIATI RSBM</span>
            <span className="text-slate-500 dark:text-slate-400 text-xs block -mt-0.5">Sistem Aduan & Ticketing TI</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center py-6 sm:py-10 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Hero Showcase on Laptop & Desktop PC */}
          <div className="hidden lg:flex lg:col-span-6 flex-col space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 text-xs font-bold w-fit">
              <ShieldAlert className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              Sistem Aduan & Ticketing Terpadu TI RSBM
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl xl:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                Layanan Siaga & Kendali Cepat Teknologi Informasi
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Platform pelaporan kendala digital Rumah Sakit Bhayangkara Medan untuk percepatan pemulihan SIMRS, bridging BPJS, rekam medis elektronik, perangkat keras, dan jaringan medis.
              </p>
            </div>

            {/* Fitur Utama 3-Grid */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 shadow-sm backdrop-blur-sm">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">⏱️ Stopwatch SLA</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                  Perhitungan menit respon & durasi perbaikan bersih otomatis.
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 shadow-sm backdrop-blur-sm">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">📸 Bukti Foto & Video</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                  Unggah langsung dari kamera native dengan sanitasi magic-bytes.
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 shadow-sm backdrop-blur-sm">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">⚡ Penentuan Urgensi</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                  Skala prioritas P1-P4 ditentukan langsung oleh tim TI RSBM.
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 shadow-sm backdrop-blur-sm">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">🛡️ Keamanan Zero-Trust</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                  Anti-bot CAPTCHA grafis, mitigasi brute-force, dan audit trail.
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Login Card */}
          <div className="w-full lg:col-span-6 flex justify-center">
            <LoginForm />
          </div>
        </div>
      </main>

      {/* Footer Info RS */}
      <footer className="relative z-10 py-3.5 px-4 border-t border-slate-200/70 dark:border-white/10 text-center text-xs text-slate-500 dark:text-slate-400 bg-white/40 dark:bg-transparent">
        <div className="max-w-md mx-auto flex items-center justify-between text-[11px]">
          <span className="flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 text-sky-500" />
            v1.1.0 LTS
          </span>
          <span className="flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Zero-Trust Protected
          </span>
          <span>© 2026 SIATI RSBM</span>
        </div>
      </footer>
    </div>
  );
}
