"use client";

import React, { useState, useTransition } from "react";
import { Role } from "@prisma/client";
import {
  Users,
  Shield,
  Building2,
  Tag,
  FileText,
  Plus,
  RefreshCw,
  Search,
  KeyRound,
  UserX,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  Activity,
  Zap,
  Lock,
  Clock,
  Layers,
  MapPin,
} from "lucide-react";
import {
  createUserAction,
  toggleUserStatusAction,
  resetUserPasswordAction,
  createDepartmentUnitAction,
  createCategoryAction,
  updateCategorySlaAction,
} from "@/actions/superadmin";
import ITStaffUnifiedView from "./ITStaffUnifiedView";
import { TicketItem } from "./ReporterView";

export interface SuperadminUserItem {
  id: string;
  username: string;
  fullName: string;
  nip: string | null;
  phoneNumber: string;
  role: Role;
  isActive: boolean;
  departmentUnitId: number;
  departmentUnit: { id: number; name: string; buildingZone: string };
  failedLoginCount: number;
  lockedUntil: Date | null;
  createdAt: Date;
}

export interface DepartmentUnitItem {
  id: number;
  name: string;
  buildingZone: string;
  _count?: { users: number; tickets: number };
}

export interface CategoryItem {
  id: number;
  name: string;
  description: string | null;
  targetSlaMinutes: number;
  _count?: { tickets: number };
}

export interface AuditLogItem {
  id: string;
  action: string;
  ipAddress: string;
  userAgent: string;
  payload: unknown;
  createdAt: Date;
  user?: { fullName: string; username: string; role: Role } | null;
}

interface SuperadminViewProps {
  users: SuperadminUserItem[];
  units: DepartmentUnitItem[];
  categories: CategoryItem[];
  auditLogs: AuditLogItem[];
  tickets: TicketItem[];
  technicians: { id: string; fullName: string }[];
  currentUserId: string;
  currentUserName: string;
  currentUserRole: Role;
}

export default function SuperadminView({
  users,
  units,
  categories,
  auditLogs,
  tickets,
  technicians,
  currentUserId,
  currentUserName,
  currentUserRole,
}: SuperadminViewProps) {
  const [activeTab, setActiveTab] = useState<
    "USERS" | "UNITS" | "CATEGORIES" | "AUDIT_LOGS" | "TICKETS"
  >("USERS");

  const [isPending, startTransition] = useTransition();
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  // Filter User
  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");

  // Modals
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isAddUnitOpen, setIsAddUnitOpen] = useState(false);
  const [isAddCatOpen, setIsAddCatOpen] = useState(false);

  // Edit SLA Category
  const [editingCatId, setEditingCatId] = useState<number | null>(null);
  const [editSlaMinutes, setEditSlaMinutes] = useState<number>(30);

  // Filter Log
  const [logFilterAction, setLogFilterAction] = useState<string>("ALL");

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.fullName.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.departmentUnit.name.toLowerCase().includes(userSearch.toLowerCase());
    const matchRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const filteredLogs = auditLogs.filter((log) => {
    if (logFilterAction === "ALL") return true;
    return log.action.toLowerCase().includes(logFilterAction.toLowerCase());
  });

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case Role.SUPERADMIN:
        return { label: "Super Admin TI", color: "bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-400/30" };
      case Role.IT_STAFF:
        return { label: "Staf TI RSBM", color: "bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-400/30" };
      case Role.MANAGEMENT:
        return { label: "Manajemen / Direksi", color: "bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-400/30" };
      default:
        return { label: "Staf Medis / Nakes", color: "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-400/30" };
    }
  };

  // Actions
  const handleToggleUserStatus = (userId: string) => {
    setFeedbackMsg(null);
    startTransition(async () => {
      const res = await toggleUserStatusAction(userId);
      if (res.success) {
        setFeedbackMsg({ type: "success", text: res.message || "Status berhasil diperbarui." });
        window.location.reload();
      } else {
        setFeedbackMsg({ type: "error", text: res.message || "Gagal mengubah status pengguna." });
      }
    });
  };

  const handleResetPassword = (userId: string, userName: string) => {
    if (!confirm(`Yakin ingin me-reset kata sandi pengguna '${userName}' ke default 'Password123!'?`)) {
      return;
    }
    setFeedbackMsg(null);
    startTransition(async () => {
      const res = await resetUserPasswordAction(userId);
      if (res.success) {
        setFeedbackMsg({ type: "success", text: res.message || "Password berhasil di-reset." });
      } else {
        setFeedbackMsg({ type: "error", text: res.message || "Gagal me-reset password." });
      }
    });
  };

  const handleUpdateSla = (categoryId: number) => {
    setFeedbackMsg(null);
    startTransition(async () => {
      const res = await updateCategorySlaAction(categoryId, editSlaMinutes);
      if (res.success) {
        setEditingCatId(null);
        setFeedbackMsg({ type: "success", text: res.message || "Target SLA berhasil diperbarui." });
        window.location.reload();
      } else {
        setFeedbackMsg({ type: "error", text: res.message || "Gagal memperbarui target SLA." });
      }
    });
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header Utama Superadmin */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 sm:p-7 border border-indigo-900/50 shadow-xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-56 h-56 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-400/30 backdrop-blur-sm">
              <Shield className="w-3.5 h-3.5 text-purple-400" />
              Portal Pengendali Tertinggi SIATI RSBM
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight">
              Pusat Administrasi & Keamanan Sistem
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Administrator aktif: <strong className="text-white">{currentUserName}</strong>. Kelola akun pegawai, master data ruangan, target SLA waktu respon, dan pantau log audit keamanan siber rumah sakit.
            </p>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="self-start sm:self-auto px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold flex items-center gap-2 backdrop-blur-md transition-all active:scale-95 shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Segarkan Data
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2.5 shadow-sm transition-all ${
            feedbackMsg.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300"
              : "bg-rose-50 dark:bg-rose-500/20 border border-rose-200 dark:border-rose-500/40 text-rose-800 dark:text-rose-300"
          }`}
        >
          {feedbackMsg.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Baris Ringkasan KPI Sistem (4 Kolom pada Tablet & PC) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm transition-colors flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Total Pengguna</span>
            <span className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5 block">{users.length}</span>
            <span className="text-[11px] text-slate-400">Pegawai Terdaftar</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm transition-colors flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Unit / Ruangan</span>
            <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-0.5 block">{units.length}</span>
            <span className="text-[11px] text-slate-400">Bangsal & Poliklinik</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm transition-colors flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Kategori Masalah</span>
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-0.5 block">{categories.length}</span>
            <span className="text-[11px] text-slate-400">Target SLA Aktif</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Tag className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm transition-colors flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Log Keamanan</span>
            <span className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-0.5 block">{auditLogs.length}</span>
            <span className="text-[11px] text-slate-400">Audit Trail Tersimpan</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TATA LETAK DUA KOLOM DENGAN SIDEBAR PADA TABLET & LAPTOP                 */}
      {/* ========================================================================= */}
      <div className="md:grid md:grid-cols-12 md:gap-6 items-start">
        {/* SIDEBAR NAV (Muncul pada Layar Tablet & Laptop / Desktop >= md) */}
        <aside className="hidden md:block md:col-span-4 lg:col-span-3 sticky top-20 space-y-4 print:hidden">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm space-y-3">
            {/* Header Sidebar */}
            <div className="pb-3 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 block">
                  Pusat Pengendali
                </span>
                <div className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
                  Menu Super Admin TI
                </div>
              </div>
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4" />
              </div>
            </div>

            {/* Daftar Navigasi Sidebar */}
            <nav className="space-y-1.5">
              {/* Menu 1: USERS */}
              <button
                type="button"
                onClick={() => setActiveTab("USERS")}
                className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between group ${
                  activeTab === "USERS"
                    ? "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 font-bold shadow-sm"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-medium"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      activeTab === "USERS"
                        ? "bg-purple-600 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:text-purple-600 dark:group-hover:text-purple-400"
                    }`}
                  >
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs truncate">Pengguna Pegawai</div>
                    <div className="text-[10px] text-slate-400 truncate">Kelola akun & status</div>
                  </div>
                </div>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                    activeTab === "USERS"
                      ? "bg-purple-200/80 dark:bg-purple-900/60 text-purple-900 dark:text-purple-200"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {users.length}
                </span>
              </button>

              {/* Menu 2: UNITS */}
              <button
                type="button"
                onClick={() => setActiveTab("UNITS")}
                className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between group ${
                  activeTab === "UNITS"
                    ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 font-bold shadow-sm"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-medium"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      activeTab === "UNITS"
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs truncate">Master Ruangan</div>
                    <div className="text-[10px] text-slate-400 truncate">Gedung, lantai & poli</div>
                  </div>
                </div>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                    activeTab === "UNITS"
                      ? "bg-indigo-200/80 dark:bg-indigo-900/60 text-indigo-900 dark:text-indigo-200"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {units.length}
                </span>
              </button>

              {/* Menu 3: CATEGORIES */}
              <button
                type="button"
                onClick={() => setActiveTab("CATEGORIES")}
                className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between group ${
                  activeTab === "CATEGORIES"
                    ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 font-bold shadow-sm"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-medium"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      activeTab === "CATEGORIES"
                        ? "bg-amber-500 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:text-amber-500 dark:group-hover:text-amber-400"
                    }`}
                  >
                    <Tag className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs truncate">Kategori & SLA</div>
                    <div className="text-[10px] text-slate-400 truncate">5 Pilar & target menit</div>
                  </div>
                </div>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                    activeTab === "CATEGORIES"
                      ? "bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {categories.length}
                </span>
              </button>

              {/* Menu 4: AUDIT_LOGS */}
              <button
                type="button"
                onClick={() => setActiveTab("AUDIT_LOGS")}
                className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between group ${
                  activeTab === "AUDIT_LOGS"
                    ? "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 font-bold shadow-sm"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-medium"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      activeTab === "AUDIT_LOGS"
                        ? "bg-purple-600 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:text-purple-600 dark:group-hover:text-purple-400"
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs truncate">Log Audit Keamanan</div>
                    <div className="text-[10px] text-slate-400 truncate">Forensik & aktivitas</div>
                  </div>
                </div>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                    activeTab === "AUDIT_LOGS"
                      ? "bg-purple-200/80 dark:bg-purple-900/60 text-purple-900 dark:text-purple-200"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {auditLogs.length}
                </span>
              </button>

              {/* Menu 5: TICKETS */}
              <button
                type="button"
                onClick={() => setActiveTab("TICKETS")}
                className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between group ${
                  activeTab === "TICKETS"
                    ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 font-bold shadow-sm"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-medium"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      activeTab === "TICKETS"
                        ? "bg-rose-600 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:text-rose-600 dark:group-hover:text-rose-400"
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs truncate">Kendali Tiket TI</div>
                    <div className="text-[10px] text-slate-400 truncate">Meja antrean terpadu</div>
                  </div>
                </div>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                    activeTab === "TICKETS"
                      ? "bg-rose-200/80 dark:bg-rose-900/60 text-rose-900 dark:text-rose-200"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {tickets.length}
                </span>
              </button>
            </nav>

            {/* Sidebar Security & System Info */}
            <div className="pt-3 border-t border-slate-100 dark:border-white/10 space-y-2">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-[11px] text-slate-500 dark:text-slate-400 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span>Proteksi Brute-force:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 inline" /> Aktif
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Enkripsi Hash:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">
                    Bcrypt (Factor 12)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Anti-Bot Gate:</span>
                  <span className="text-sky-600 dark:text-sky-400 font-bold">
                    HMAC CAPTCHA
                  </span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* MOBILE HORIZONTAL TABS (Hanya muncul di Ponsel Layar Kecil < md) */}
        <div className="md:hidden flex items-center gap-1.5 xs:gap-2 p-1.5 bg-slate-200/80 dark:bg-slate-800/80 rounded-2xl border border-slate-300 dark:border-white/10 overflow-x-auto no-scrollbar shadow-inner mb-4">
          <button
            type="button"
            onClick={() => setActiveTab("USERS")}
            className={`py-2.5 px-3 sm:px-4 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap flex items-center gap-2 transition-all shadow-sm ${
              activeTab === "USERS"
                ? "bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 ring-2 ring-sky-500/20 shadow-md"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Pengguna ({users.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("UNITS")}
            className={`py-2.5 px-3 sm:px-4 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap flex items-center gap-2 transition-all shadow-sm ${
              activeTab === "UNITS"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-500/20 shadow-md"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Master Unit ({units.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("CATEGORIES")}
            className={`py-2.5 px-3 sm:px-4 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap flex items-center gap-2 transition-all shadow-sm ${
              activeTab === "CATEGORIES"
                ? "bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 ring-2 ring-amber-500/20 shadow-md"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Kategori & SLA ({categories.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("AUDIT_LOGS")}
            className={`py-2.5 px-3 sm:px-4 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap flex items-center gap-2 transition-all shadow-sm ${
              activeTab === "AUDIT_LOGS"
                ? "bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 ring-2 ring-purple-500/20 shadow-md"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Log Audit ({auditLogs.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("TICKETS")}
            className={`py-2.5 px-3 sm:px-4 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap flex items-center gap-2 transition-all shadow-sm ${
              activeTab === "TICKETS"
                ? "bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 ring-2 ring-rose-500/20 shadow-md"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Kendali Tiket TI ({tickets.length})</span>
          </button>
        </div>

        {/* AREA KONTEN UTAMA DENGAN LEBAR OPTIMAL */}
        <main className="md:col-span-8 lg:col-span-9 space-y-5">

      {/* ========================================================================= */}
      {/* TAB 1: MANAJEMEN PENGGUNA (USER MANAGEMENT)                               */}
      {/* ========================================================================= */}
      {activeTab === "USERS" && (
        <div className="space-y-4">
          {/* Toolbar & Tombol Tambah Pengguna */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto flex-1">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Cari nama, username, unit..."
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full sm:w-auto px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="ALL">Semua Peran (Role)</option>
                <option value="SUPERADMIN">Super Admin TI</option>
                <option value="IT_STAFF">Staf TI RSBM</option>
                <option value="STAFF_USER">Staf Medis / Nakes</option>
                <option value="MANAGEMENT">Manajemen / Direksi</option>
              </select>
            </div>

            <button
              onClick={() => setIsAddUserOpen(true)}
              className="w-full sm:w-auto py-2.5 px-4 bg-sky-600 hover:bg-sky-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              Tambah Pengguna Baru
            </button>
          </div>

          {/* Daftar Pengguna */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredUsers.map((u) => {
              const roleBadge = getRoleBadge(u.role);
              const isCurrentUser = u.id === currentUserId;

              return (
                <div
                  key={u.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3.5 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                          {u.fullName}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${roleBadge.color}`}>
                          {roleBadge.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-mono font-semibold text-sky-600 dark:text-sky-400">@{u.username}</span>
                        {u.nip && (
                          <>
                            <span>•</span>
                            <span>NIP: {u.nip}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 shrink-0 ${
                        u.isActive
                          ? "bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30"
                          : "bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/30"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? "bg-emerald-500" : "bg-rose-500"}`}></span>
                      {u.isActive ? "Aktif" : "Nonaktif"}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-white/5">
                    <MapPin className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                    <span className="font-medium text-slate-800 dark:text-slate-200">{u.departmentUnit.name}</span>
                    <span className="text-slate-400">•</span>
                    <span>{u.departmentUnit.buildingZone}</span>
                    <span className="text-slate-400">•</span>
                    <span>WA: {u.phoneNumber}</span>
                  </div>

                  {/* Tombol Aksi Superadmin */}
                  <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-2">
                    <button
                      disabled={isPending || isCurrentUser}
                      onClick={() => handleResetPassword(u.id, u.fullName)}
                      className="py-1.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-40"
                      title="Reset kata sandi ke Password123!"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                      Reset Sandi
                    </button>

                    <button
                      disabled={isPending || isCurrentUser}
                      onClick={() => handleToggleUserStatus(u.id)}
                      className={`py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-40 ${
                        u.isActive
                          ? "bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/20"
                          : "bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20"
                      }`}
                      title={u.isActive ? "Nonaktifkan akun" : "Aktifkan akun"}
                    >
                      {u.isActive ? (
                        <>
                          <UserX className="w-3.5 h-3.5 text-rose-500" />
                          Nonaktifkan
                        </>
                      ) : (
                        <>
                          <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                          Aktifkan
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MASTER UNIT / BANGSAL PELAYANAN RS                                 */}
      {/* ========================================================================= */}
      {activeTab === "UNITS" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Daftar Ruangan & Bangsal Pelayanan RSBM
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Data master lokasi untuk penempatan perangkat dan titik laporan nakes.
              </p>
            </div>

            <button
              onClick={() => setIsAddUnitOpen(true)}
              className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              Tambah Unit Ruangan
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {units.map((unit) => (
              <div
                key={unit.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm space-y-2.5 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {unit.name}
                  </span>
                  <span className="text-[11px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-md">
                    ID #{unit.id}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <Building2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>{unit.buildingZone}</span>
                </div>
                {unit._count && (
                  <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[11px] text-slate-500">
                    <span>{unit._count.users} Pegawai</span>
                    <span>{unit._count.tickets} Tiket Aduan</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: MASTER KATEGORI & TARGET SLA                                       */}
      {/* ========================================================================= */}
      {activeTab === "CATEGORIES" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Kategori Masalah & Standar Layanan (SLA)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Atur klasifikasi kendala TI dan target menit batas penyelesaian kasus.
              </p>
            </div>

            <button
              onClick={() => setIsAddCatOpen(true)}
              className="py-2.5 px-4 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              Tambah Kategori
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {categories.map((cat) => {
              const isEditing = editingCatId === cat.id;

              return (
                <div
                  key={cat.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-1.5">
                      <Tag className="w-4 h-4 text-amber-500" />
                      {cat.name}
                    </span>

                    <span className="text-xs font-mono font-bold bg-amber-50 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 px-2.5 py-1 rounded-lg">
                      Target SLA: {cat.targetSlaMinutes}m
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {cat.description || "Tidak ada deskripsi rinci."}
                  </p>

                  <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                    {isEditing ? (
                      <div className="flex items-center gap-2 w-full">
                        <input
                          type="number"
                          min={5}
                          max={360}
                          value={editSlaMinutes}
                          onChange={(e) => setEditSlaMinutes(Number(e.target.value))}
                          className="w-24 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                        />
                        <span className="text-xs text-slate-500">Menit</span>
                        <button
                          disabled={isPending}
                          onClick={() => handleUpdateSla(cat.id)}
                          className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-sm"
                        >
                          Simpan
                        </button>
                        <button
                          onClick={() => setEditingCatId(null)}
                          className="px-2.5 py-1.5 text-xs text-slate-500"
                        >
                          Batal
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingCatId(cat.id);
                          setEditSlaMinutes(cat.targetSlaMinutes);
                        }}
                        className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-semibold flex items-center gap-1"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        Ubah Target Menit SLA
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: LOG AUDIT & KEAMANAN SISTEM (AUDIT TRAIL)                           */}
      {/* ========================================================================= */}
      {activeTab === "AUDIT_LOGS" && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                Catatan Audit & Jejak Forensik Siber
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pencatatan aktivitas sistem bersifat *Append-Only* (tidak dapat dimanipulasi/dihapus).
              </p>
            </div>

            <select
              value={logFilterAction}
              onChange={(e) => setLogFilterAction(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="ALL">Semua Aktivitas</option>
              <option value="LOGIN">Autentikasi (LOGIN)</option>
              <option value="FAILED">Gagal Login (FAILED)</option>
              <option value="TICKET">Aktivitas Tiket</option>
              <option value="SUPERADMIN">Aksi Superadmin</option>
            </select>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Waktu</th>
                    <th className="py-3 px-4">Aksi / Event</th>
                    <th className="py-3 px-4">Pelaku (User)</th>
                    <th className="py-3 px-4">IP Address</th>
                    <th className="py-3 px-4">Detail Payload</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-medium">
                  {filteredLogs.slice(0, 50).map((log) => {
                    const isFailure = log.action.includes("FAILED");
                    const isSuper = log.action.includes("SUPERADMIN");

                    return (
                      <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString("id-ID")}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              isFailure
                                ? "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300"
                                : isSuper
                                ? "bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950/40 dark:text-purple-300"
                                : "bg-sky-50 text-sky-700 border-sky-300 dark:bg-sky-950/40 dark:text-sky-300"
                            }`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {log.user ? (
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {log.user.fullName} (@{log.user.username})
                            </span>
                          ) : (
                            <span className="italic text-slate-400">Anonim / Sistem</span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {log.ipAddress}
                        </td>
                        <td className="py-3 px-4 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                          {log.payload ? JSON.stringify(log.payload) : "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: KENDALI TIKET TI (EMBEDDED IT STAFF UNIFIED VIEW)                   */}
      {/* ========================================================================= */}
      {activeTab === "TICKETS" && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-500/30 text-xs text-sky-800 dark:text-sky-300">
            Sebagai <strong>Super Admin TI</strong>, Anda memiliki kendali penuh untuk meninjau seluruh meja antrean bantuan, mengambil tiket, menentukan tingkat urgensi, maupun menugaskan ke staf lapangan.
          </div>
          <ITStaffUnifiedView
            tickets={tickets}
            technicians={technicians}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            currentUserRole={currentUserRole}
          />
        </div>
      )}
        </main>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: TAMBAH PENGGUNA BARU                                             */}
      {/* ========================================================================= */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/15 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
              <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                Daftarkan Pengguna Pegawai Baru
              </h4>
              <button
                onClick={() => setIsAddUserOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form
              action={async (formData) => {
                setFeedbackMsg(null);
                startTransition(async () => {
                  const res = await createUserAction(formData);
                  if (res.success) {
                    setIsAddUserOpen(false);
                    setFeedbackMsg({ type: "success", text: res.message || "Pengguna berhasil didaftarkan." });
                    window.location.reload();
                  } else {
                    setFeedbackMsg({ type: "error", text: res.message || "Gagal mendaftarkan pengguna." });
                  }
                });
              }}
              className="space-y-3.5 text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                    Username (Nama Depan) *
                  </label>
                  <input
                    type="text"
                    name="username"
                    required
                    placeholder="Contoh: hendra, siti"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                    NIP Pegawai (Opsional)
                  </label>
                  <input
                    type="text"
                    name="nip"
                    placeholder="Contoh: 19880420xxxx"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Nama Lengkap Pegawai *
                </label>
                <input
                  type="text"
                  name="fullName"
                  required
                  placeholder="Contoh: dr. Hendra Saputra, Sp.B"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                    Peran / Role *
                  </label>
                  <select
                    name="role"
                    defaultValue={Role.STAFF_USER}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                  >
                    <option value={Role.STAFF_USER}>Staf Medis / Nakes (Pelapor)</option>
                    <option value={Role.IT_STAFF}>Staf TI RSBM (Helpdesk & Lapangan)</option>
                    <option value={Role.MANAGEMENT}>Manajemen / Direksi RS</option>
                    <option value={Role.SUPERADMIN}>Super Admin TI</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                    Unit / Ruangan Penempatan *
                  </label>
                  <select
                    name="departmentUnitId"
                    defaultValue={units[0]?.id || 1}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                  >
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} — ({u.buildingZone})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                    Nomor WhatsApp / HP
                  </label>
                  <input
                    type="text"
                    name="phoneNumber"
                    defaultValue="081200000000"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                    Kata Sandi Default
                  </label>
                  <input
                    type="text"
                    name="password"
                    defaultValue="Password123!"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold shadow-md disabled:opacity-50"
                >
                  {isPending ? "Menyimpan..." : "Simpan Pengguna"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: TAMBAH MASTER UNIT                                               */}
      {/* ========================================================================= */}
      {isAddUnitOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/15 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
              <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Tambah Unit / Ruangan Baru
              </h4>
              <button onClick={() => setIsAddUnitOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form
              action={async (formData) => {
                setFeedbackMsg(null);
                startTransition(async () => {
                  const res = await createDepartmentUnitAction(formData);
                  if (res.success) {
                    setIsAddUnitOpen(false);
                    setFeedbackMsg({ type: "success", text: res.message || "Unit berhasil dibuat." });
                    window.location.reload();
                  } else {
                    setFeedbackMsg({ type: "error", text: res.message || "Gagal membuat unit." });
                  }
                });
              }}
              className="space-y-3.5 text-xs"
            >
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Nama Ruangan / Unit *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Contoh: Poliklinik Jantung, Bangsal Anggrek"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Lokasi Gedung & Lantai *
                </label>
                <input
                  type="text"
                  name="buildingZone"
                  required
                  placeholder="Contoh: Gedung Rawat Jalan Lt. 2"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddUnitOpen(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md disabled:opacity-50"
                >
                  {isPending ? "Menyimpan..." : "Simpan Ruangan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: TAMBAH KATEGORI KENDALA & SLA                                    */}
      {/* ========================================================================= */}
      {isAddCatOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/15 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
              <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Tag className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                Tambah Kategori Kendala Baru
              </h4>
              <button onClick={() => setIsAddCatOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form
              action={async (formData) => {
                setFeedbackMsg(null);
                startTransition(async () => {
                  const res = await createCategoryAction(formData);
                  if (res.success) {
                    setIsAddCatOpen(false);
                    setFeedbackMsg({ type: "success", text: res.message || "Kategori berhasil dibuat." });
                    window.location.reload();
                  } else {
                    setFeedbackMsg({ type: "error", text: res.message || "Gagal membuat kategori." });
                  }
                });
              }}
              className="space-y-3.5 text-xs"
            >
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Nama Kategori *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Contoh: Server & Basis Data"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Uraian Cakupan Masalah
                </label>
                <input
                  type="text"
                  name="description"
                  placeholder="Contoh: Pemadaman database, backup berkas server.."
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Target SLA Waktu Respon (Menit) *
                </label>
                <input
                  type="number"
                  name="targetSlaMinutes"
                  required
                  min={5}
                  max={360}
                  defaultValue={30}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddCatOpen(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-md disabled:opacity-50"
                >
                  {isPending ? "Menyimpan..." : "Simpan Kategori"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
