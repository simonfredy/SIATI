import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import LoginForm from "@/components/LoginForm";
import { Activity, ShieldAlert, Cpu } from "lucide-react";

export const instant = false;

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-sky-950 flex flex-col justify-between relative overflow-hidden">
      {/* Background Subtle Medical Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none"></div>

      {/* Decorative Blur Circles */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-sky-500/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Bar Status */}
      <header className="relative z-10 w-full px-4 py-3 flex items-center justify-between border-b border-white/10 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-sky-500/20 flex items-center justify-center text-sky-400 border border-sky-400/30">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="text-white font-bold text-sm tracking-wide">RSUD SIATI</span>
            <span className="text-slate-400 text-xs block -mt-0.5">Sistem Tiket & Aduan IT</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs text-emerald-300 font-medium hidden sm:inline">Server Normal</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center py-6 px-4">
        <LoginForm />
      </main>

      {/* Footer Info RS */}
      <footer className="relative z-10 py-3 px-4 border-t border-white/10 text-center text-xs text-slate-400">
        <div className="max-w-md mx-auto flex items-center justify-between text-[11px]">
          <span className="flex items-center gap-1 text-slate-400">
            <Cpu className="w-3.5 h-3.5 text-sky-400" />
            v1.1.0 LTS
          </span>
          <span className="flex items-center gap-1 text-slate-400">
            <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
            Zero-Trust Protected
          </span>
          <span>© 2026 RSUD SIMRS</span>
        </div>
      </footer>
    </div>
  );
}
