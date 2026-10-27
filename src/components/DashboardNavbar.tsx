"use client";

import React, { useState } from "react";
import { logoutAction } from "@/actions/auth";
import { useRouter } from "next/navigation";
import { LogOut, Activity, MapPin, Shield, BarChart3, KeyRound } from "lucide-react";
import { Role } from "@prisma/client";
import ThemeToggle from "@/components/ThemeToggle";
import RealtimeSync from "@/components/RealtimeSync";
import ChangePasswordModal from "@/components/ChangePasswordModal";

interface NavbarProps {
  user: {
    userId: string;
    username: string;
    fullName: string;
    role: Role;
    departmentUnitName?: string;
  };
  hospitalName?: string;
  hospitalLogo?: string | null;
  activeView?: "superadmin" | "management";
}

export default function DashboardNavbar({
  user,
  hospitalName,
  hospitalLogo,
  activeView = "superadmin",
}: NavbarProps) {
  const router = useRouter();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const handleLogout = async () => {
    await logoutAction();
    window.location.href = "/";
  };

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case Role.SUPERADMIN:
        return { label: "Super Admin TI", color: "bg-purple-50 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-400/30" };
      case Role.MANAGEMENT:
        return { label: "Manajemen", color: "bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-400/30" };
      case Role.IT_STAFF:
        return { label: "Staf TI", color: "bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-400/30" };
      default:
        return { label: "Staf Medis / Nakes", color: "bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-400/30" };
    }
  };

  const badge = getRoleBadge(user.role);

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-white/10 px-3 sm:px-6 lg:px-8 py-3 shadow-sm dark:shadow-md transition-colors print:hidden">
      <div className="max-w-7xl xl:max-w-[1600px] mx-auto flex items-center justify-between gap-3">
        {/* Brand Identitas */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-sky-600/30 shrink-0 overflow-hidden">
            {hospitalLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={hospitalLogo} alt={hospitalName || "Logo"} className="w-full h-full object-cover" />
            ) : (
              <Activity className="w-5 h-5 sm:w-5 sm:h-5" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <span className="text-slate-900 dark:text-white font-bold text-sm sm:text-base tracking-wide whitespace-nowrap">
                SIATI
              </span>
              {hospitalName && (
                <span className="hidden sm:inline-block text-xs font-semibold text-slate-500 dark:text-slate-400 border-l border-slate-300 dark:border-slate-700 pl-2 max-w-xs truncate">
                  {hospitalName}
                </span>
              )}
              <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full border font-semibold whitespace-nowrap ${badge.color}`}>
                {badge.label}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[120px] sm:max-w-[200px] md:max-w-none">
                {user.fullName}
              </span>
              {user.departmentUnitName && (
                <>
                  <span className="text-slate-400 dark:text-slate-600 hidden xs:inline">•</span>
                  <span className="hidden xs:flex items-center gap-0.5 truncate max-w-[120px] sm:max-w-xs text-slate-500 dark:text-slate-400">
                    <MapPin className="w-3 h-3 text-sky-500 shrink-0" />
                    {user.departmentUnitName}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Switcher Mode Akses Khusus Super Admin */}
        {user.role === Role.SUPERADMIN && (
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-white/10 text-xs">
            <a
              href="/dashboard"
              className={`px-2.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 text-xs ${
                activeView !== "management"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
              title="Pusat Administrasi & Keamanan Super Admin"
            >
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Pusat Super Admin</span>
            </a>
            <a
              href="/dashboard?view=management"
              className={`px-2.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 text-xs ${
                activeView === "management"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400"
              }`}
              title="Portal Analitik & Mutu Manajemen RS"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Portal Manajemen</span>
            </a>
          </div>
        )}

        {/* Action Realtime Status, Toggle Theme, Ganti Password & Logout */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <RealtimeSync />

          <ThemeToggle />

          <button
            type="button"
            onClick={() => setIsPasswordModalOpen(true)}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            title="Ganti Kata Sandi Akun"
            aria-label="Ganti Kata Sandi Akun"
          >
            <KeyRound className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span className="hidden md:inline">Ganti Password</span>
          </button>

          <button
            onClick={handleLogout}
            className="p-2 sm:px-3.5 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
            title="Keluar dari Akun"
          >
            <LogOut className="w-4 h-4 text-rose-500" />
            <span className="hidden md:inline">Keluar</span>
          </button>
        </div>
      </div>

      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </header>
  );
}
