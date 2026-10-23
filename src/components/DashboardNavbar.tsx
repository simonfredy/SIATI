"use client";

import React from "react";
import { logoutAction } from "@/actions/auth";
import { useRouter } from "next/navigation";
import { LogOut, Activity, User, MapPin } from "lucide-react";
import { Role } from "@prisma/client";

interface NavbarProps {
  user: {
    userId: string;
    username: string;
    fullName: string;
    role: Role;
    departmentUnitName?: string;
  };
}

export default function DashboardNavbar({ user }: NavbarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await logoutAction();
    router.push("/");
    router.refresh();
  };

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case Role.SUPERADMIN:
        return { label: "Super Admin", color: "bg-purple-500/20 text-purple-300 border-purple-400/30" };
      case Role.HELPDESK:
        return { label: "Dispatcher IT", color: "bg-blue-500/20 text-blue-300 border-blue-400/30" };
      case Role.TECHNICIAN:
        return { label: "Teknisi Lapangan", color: "bg-amber-500/20 text-amber-300 border-amber-400/30" };
      default:
        return { label: "Staf Medis / Nakes", color: "bg-emerald-500/20 text-emerald-300 border-emerald-400/30" };
    }
  };

  const badge = getRoleBadge(user.role);

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-900/95 backdrop-blur-md border-b border-white/10 px-4 py-3 shadow-md">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        {/* Brand Identitas */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-sky-600/30">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-sm tracking-wide">SIATI RSUD</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${badge.color}`}>
                {badge.label}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400 text-xs">
              <span className="font-medium text-slate-300">{user.fullName}</span>
              {user.departmentUnitName && (
                <>
                  <span className="text-slate-600">•</span>
                  <span className="flex items-center gap-0.5 text-slate-400">
                    <MapPin className="w-3 h-3 text-sky-400" />
                    {user.departmentUnitName}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Logout */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleLogout}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/10 text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
            title="Keluar dari Akun"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </div>
    </header>
  );
}
