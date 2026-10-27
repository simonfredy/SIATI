"use client";

import React, { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Role, TicketStatus, TicketUrgency } from "@prisma/client";
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
  PanelLeftClose,
  PanelLeftOpen,
  BarChart3,
  Image as ImageIcon,
  Video as VideoIcon,
  Filter,
  AlertTriangle,
  Flame,
  Check,
  ChevronDown,
  X,
  Upload,
  Globe,
  Phone,
  Mail,
  FileCheck,
  Eye,
  Sparkles,
  Landmark,
  Loader2,
  Camera,
  Server,
} from "lucide-react";
import {
  createUserAction,
  toggleUserStatusAction,
  resetUserPasswordAction,
  createDepartmentUnitAction,
  createCategoryAction,
  updateCategorySlaAction,
  updateHospitalProfileAction,
  HospitalProfileItem,
} from "@/actions/superadmin";
import { updateTicketStatusAction } from "@/actions/tickets";
import MediaViewerModal, { MediaAttachmentItem } from "@/components/MediaViewerModal";
import TicketRepairReportModal from "@/components/TicketRepairReportModal";
import InternalNetworkDiagnostic from "@/components/InternalNetworkDiagnostic";
import ExternalApiConnectivity from "@/components/ExternalApiConnectivity";
import { TicketItem } from "./ReporterView";
import { motion, AnimatePresence } from "motion/react";
import AnimatedCounter from "@/components/AnimatedCounter";
import {
  staggerContainerVariants,
  cardItemVariants,
  tabContentVariants,
  modalBackdropVariants,
  modalContentVariants,
  interactiveCardHover,
} from "@/lib/motionVariants";

export interface SuperadminUserItem {
  id: string;
  username: string;
  fullName: string;
  nip: string | null;
  phoneNumber: string;
  avatarUrl?: string | null;
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
  hospitalProfile?: HospitalProfileItem | null;
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
  hospitalProfile,
}: SuperadminViewProps) {
  const [activeTab, setActiveTab] = useState<
    | "USERS"
    | "UNITS"
    | "CATEGORIES"
    | "AUDIT_LOGS"
    | "TICKETS"
    | "HOSPITAL_PROFILE"
    | "INTERNAL_NETWORK"
    | "EXTERNAL_CONNECTIVITY"
  >("USERS");

  // Expand-Collapse State untuk Sidebar Tablet & Laptop / PC
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("siati_admin_sidebar_collapsed");
      if (saved !== null) {
        setIsSidebarCollapsed(saved === "true");
      }
    } catch {
      // ignore
    }
  }, []);

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("siati_admin_sidebar_collapsed", String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const [isPending, startTransition] = useTransition();
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  // State lokal pengguna untuk pembaruan instan (optimistic UI) tanpa reload halaman
  const [localUsers, setLocalUsers] = useState<SuperadminUserItem[]>(users);
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null);
  const [reportDocTicket, setReportDocTicket] = useState<TicketItem | null>(null);

  useEffect(() => {
    setLocalUsers(users);
  }, [users]);

  // Auto-dismiss feedback message setelah 5 detik
  useEffect(() => {
    if (feedbackMsg) {
      const timer = setTimeout(() => {
        setFeedbackMsg(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [feedbackMsg]);

  // Filter User
  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");

  // Modals
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isAddUnitOpen, setIsAddUnitOpen] = useState(false);
  const [isAddCatOpen, setIsAddCatOpen] = useState(false);

  // State Unggah Foto Profil Pengguna Baru
  const [newUserAvatarUrl, setNewUserAvatarUrl] = useState<string>("");
  const [isUploadingUserAvatar, setIsUploadingUserAvatar] = useState<boolean>(false);
  const [userAvatarError, setUserAvatarError] = useState<string | null>(null);
  const [newFullNamePreview, setNewFullNamePreview] = useState<string>("");

  // Edit SLA Category
  const [editingCatId, setEditingCatId] = useState<number | null>(null);
  const [editSlaMinutes, setEditSlaMinutes] = useState<number>(30);

  // Filter Log
  const [logFilterAction, setLogFilterAction] = useState<string>("ALL");

  // State untuk Tab 5: Daftar Tiket Antrean Layanan TI (Monitoring Masuk & Belum Selesai)
  const router = useRouter();
  const [localTickets, setLocalTickets] = useState<TicketItem[]>(tickets);
  const [ticketSearch, setTicketSearch] = useState<string>("");
  const [ticketStatusFilter, setTicketStatusFilter] = useState<
    "UNRESOLVED" | "SUBMITTED" | "ASSIGNED" | "IN_PROGRESS" | "PENDING_PARTS" | "RESOLVED" | "ALL"
  >("UNRESOLVED");
  const [ticketUrgencyFilter, setTicketUrgencyFilter] = useState<string>("ALL");
  const [activeMedia, setActiveMedia] = useState<MediaAttachmentItem | null>(null);

  // State untuk Tab 6: Profil Rumah Sakit & Identitas Instansi
  const [hpForm, setHpForm] = useState({
    name: hospitalProfile?.name || "Rumah Sakit Umum Daerah",
    hospitalClass: hospitalProfile?.hospitalClass || "Kelas B",
    ownershipType: hospitalProfile?.ownershipType || "Pemerintah",
    phone: hospitalProfile?.phone || "",
    email: hospitalProfile?.email || "",
    bpjsPpkCode: hospitalProfile?.bpjsPpkCode || "",
    kemenkesCode: hospitalProfile?.kemenkesCode || "",
    satuSehatId: hospitalProfile?.satuSehatId || "",
    address: hospitalProfile?.address || "",
    logoUrl: hospitalProfile?.logoUrl || "",
    website: hospitalProfile?.website || "",
  });
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [hpSavedMsg, setHpSavedMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (hospitalProfile) {
      setHpForm({
        name: hospitalProfile.name || "",
        hospitalClass: hospitalProfile.hospitalClass || "Kelas B",
        ownershipType: hospitalProfile.ownershipType || "Pemerintah",
        phone: hospitalProfile.phone || "",
        email: hospitalProfile.email || "",
        bpjsPpkCode: hospitalProfile.bpjsPpkCode || "",
        kemenkesCode: hospitalProfile.kemenkesCode || "",
        satuSehatId: hospitalProfile.satuSehatId || "",
        address: hospitalProfile.address || "",
        logoUrl: hospitalProfile.logoUrl || "",
        website: hospitalProfile.website || "",
      });
    }
  }, [hospitalProfile]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("Hanya file gambar (PNG, JPG, JPEG, SVG, WebP) yang diizinkan untuk logo.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Ukuran logo maksimal 5 MB.");
      return;
    }

    setUploadError(null);
    setIsUploadingLogo(true);

    try {
      const data = new FormData();
      data.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: data,
      });

      const json = await res.json();
      if (res.ok && json.success && json.attachment?.previewUrl) {
        setHpForm((prev) => ({ ...prev, logoUrl: json.attachment.previewUrl }));
      } else {
        setUploadError(json.error || "Gagal mengunggah logo rumah sakit.");
      }
    } catch (err) {
      console.error(err);
      setUploadError("Terjadi kegagalan jaringan saat mengunggah logo.");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // Handler Unggah Foto Profil Pengguna Baru
  const handleUserAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setUserAvatarError("Ukuran berkas foto maksimal 5 MB.");
      return;
    }

    setIsUploadingUserAvatar(true);
    setUserAvatarError(null);

    try {
      const data = new FormData();
      data.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: data,
      });

      const json = await res.json();
      if (res.ok && json.success && json.attachment?.previewUrl) {
        setNewUserAvatarUrl(json.attachment.previewUrl);
      } else {
        setUserAvatarError(json.error || "Gagal mengunggah foto profil.");
      }
    } catch {
      setUserAvatarError("Terjadi kegagalan jaringan saat mengunggah foto.");
    } finally {
      setIsUploadingUserAvatar(false);
    }
  };

  useEffect(() => {
    setLocalTickets(tickets);
  }, [tickets]);

  // Statistik Ringkasan Tiket Antrean Layanan TI
  const unresolvedTickets = localTickets.filter(
    (t) => t.status !== TicketStatus.RESOLVED && t.status !== TicketStatus.CLOSED
  );
  const submittedTickets = localTickets.filter((t) => t.status === TicketStatus.SUBMITTED);
  const inProgressTickets = localTickets.filter(
    (t) => t.status === TicketStatus.IN_PROGRESS || t.status === TicketStatus.ASSIGNED
  );
  const pendingPartsTickets = localTickets.filter((t) => t.status === TicketStatus.PENDING_PARTS);
  const resolvedTickets = localTickets.filter(
    (t) => t.status === TicketStatus.RESOLVED || t.status === TicketStatus.CLOSED
  );
  const emergencyTickets = localTickets.filter(
    (t) =>
      t.urgency === TicketUrgency.EMERGENCY &&
      t.status !== TicketStatus.RESOLVED &&
      t.status !== TicketStatus.CLOSED
  );

  // Filter Tiket untuk Daftar Kendali Super Admin
  const filteredTickets = localTickets.filter((t) => {
    if (ticketStatusFilter === "UNRESOLVED") {
      if (t.status === TicketStatus.RESOLVED || t.status === TicketStatus.CLOSED) {
        return false;
      }
    } else if (ticketStatusFilter === "RESOLVED") {
      if (t.status !== TicketStatus.RESOLVED && t.status !== TicketStatus.CLOSED) {
        return false;
      }
    } else if (ticketStatusFilter !== "ALL") {
      if (t.status !== ticketStatusFilter) {
        return false;
      }
    }

    if (ticketUrgencyFilter !== "ALL" && t.urgency !== ticketUrgencyFilter) {
      return false;
    }

    if (ticketSearch.trim()) {
      const q = ticketSearch.toLowerCase();
      const matchNumber = t.ticketNumber.toLowerCase().includes(q);
      const matchUnit =
        t.unit.name.toLowerCase().includes(q) ||
        t.unit.buildingZone.toLowerCase().includes(q);
      const matchDesc = t.description.toLowerCase().includes(q);
      const matchCategory = t.category.name.toLowerCase().includes(q);
      const matchTech = t.assignedTechnician?.fullName.toLowerCase().includes(q) || false;
      if (!matchNumber && !matchUnit && !matchDesc && !matchCategory && !matchTech) {
        return false;
      }
    }

    return true;
  });

  const handleAdminUpdateUrgency = async (ticketId: string, newUrgency: TicketUrgency) => {
    const targetTicket = localTickets.find((t) => t.id === ticketId);
    if (
      targetTicket &&
      (targetTicket.status === TicketStatus.RESOLVED || targetTicket.status === TicketStatus.CLOSED)
    ) {
      alert("Tingkat urgensi tidak dapat diedit karena tiket sudah selesai.");
      return;
    }

    // Optimistic update lokal langsung tanpa notifikasi berlebihan
    setLocalTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, urgency: newUrgency } : t))
    );

    try {
      const res = await updateTicketStatusAction({
        ticketId,
        urgency: newUrgency,
        silent: true, // Tidak memicu notifikasi popup/audio ke seluruh sistem
      });

      if (res.success) {
        // Notifikasi sengaja tidak ditampilkan agar penyesuaian urgensi oleh super admin tidak memicu kecurigaan atau kebisingan sistem
        router.refresh();
      } else {
        setLocalTickets(tickets);
      }
    } catch {
      setLocalTickets(tickets);
    }
  };

  const formatTicketDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRelativeTime = (date: Date) => {
    const diffMs = Date.now() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Baru saja";
    if (diffMins < 60) return `${diffMins} mnt lalu`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} jam lalu`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} hari lalu`;
  };

  const getTicketStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case TicketStatus.SUBMITTED:
        return {
          label: "Baru Masuk",
          color: "bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-500/30",
          dot: "bg-sky-500",
        };
      case TicketStatus.ASSIGNED:
        return {
          label: "Ditugaskan",
          color: "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30",
          dot: "bg-indigo-500",
        };
      case TicketStatus.IN_PROGRESS:
        return {
          label: "Sedang Dikerjakan",
          color: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30",
          dot: "bg-amber-500",
        };
      case TicketStatus.PENDING_PARTS:
        return {
          label: "Menunggu Part",
          color: "bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/30",
          dot: "bg-purple-500",
        };
      case TicketStatus.RESOLVED:
        return {
          label: "Selesai",
          color: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30",
          dot: "bg-emerald-500",
        };
      case TicketStatus.CLOSED:
        return {
          label: "Ditutup",
          color: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
          dot: "bg-slate-500",
        };
      default:
        return {
          label: status,
          color: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
          dot: "bg-slate-400",
        };
    }
  };

  const getTicketUrgencyBadge = (urgency: TicketUrgency) => {
    switch (urgency) {
      case TicketUrgency.EMERGENCY:
        return {
          label: "P1 - DARURAT",
          color: "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-500/40",
        };
      case TicketUrgency.HIGH:
        return {
          label: "P2 - TINGGI",
          color: "bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-500/40",
        };
      case TicketUrgency.MEDIUM:
        return {
          label: "P3 - SEDANG",
          color: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-500/40",
        };
      case TicketUrgency.LOW:
        return {
          label: "P4 - RENDAH",
          color: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40",
        };
      default:
        return {
          label: urgency,
          color: "bg-slate-100 text-slate-700 border-slate-300",
        };
    }
  };

  const filteredUsers = localUsers.filter((u) => {
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
        return { label: "Staf TI", color: "bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-400/30" };
      case Role.MANAGEMENT:
        return { label: "Manajemen", color: "bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-400/30" };
      default:
        return { label: "Staf Medis / Nakes", color: "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-400/30" };
    }
  };

  // Helper Pembuat Inisial Nama untuk Avatar Placeholder
  const getInitials = (name: string) => {
    if (!name) return "P";
    const clean = name.replace(/^(dr\.|drg\.|prof\.|ns\.|apt\.|ir\.)\s*/i, "").trim();
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "P";
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  // Actions
  const handleToggleUserStatus = (userId: string) => {
    setFeedbackMsg(null);
    setTogglingUserId(userId);

    // Optimistic UI: langsung perbarui status di state lokal seketika tanpa refresh/reload halaman
    setLocalUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, isActive: !u.isActive } : u))
    );

    startTransition(async () => {
      try {
        const res = await toggleUserStatusAction(userId);
        if (res.success) {
          setFeedbackMsg({ type: "success", text: res.message || "Status pengguna berhasil diperbarui." });
          router.refresh(); // Sinkronisasi server di latar belakang tanpa reload halaman
        } else {
          // Rollback ke data asli jika server gagal
          setLocalUsers(users);
          setFeedbackMsg({ type: "error", text: res.message || "Gagal mengubah status pengguna." });
        }
      } catch {
        setLocalUsers(users);
        setFeedbackMsg({ type: "error", text: "Terjadi gangguan jaringan saat memperbarui status akun." });
      } finally {
        setTogglingUserId(null);
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
        router.refresh();
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
        router.refresh();
      } else {
        setFeedbackMsg({ type: "error", text: res.message || "Gagal memperbarui target SLA." });
      }
    });
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Tata letak utama dashboard */}
      <div className="flex flex-col md:flex-row items-start gap-4 lg:gap-6">
        {/* SIDEBAR NAVIGASI (TABLET & LAPTOP/PC) DENGAN EXPAND-COLLAPSE */}
        <aside
          className={`hidden md:flex flex-col sticky top-20 shrink-0 transition-all duration-300 ease-in-out print:hidden ${
            isSidebarCollapsed ? "w-18 lg:w-20" : "w-64 lg:w-72"
          }`}
        >
          <div className="w-full p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm space-y-3">
            {/* Header Sidebar */}
            <div
              className={`pb-3 border-b border-slate-100 dark:border-white/10 flex items-center ${
                isSidebarCollapsed
                  ? "justify-center flex-col gap-2"
                  : "justify-between"
              }`}
            >
              {!isSidebarCollapsed ? (
                <>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 block truncate">
                      Pusat Pengendali
                    </span>
                    <div className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5 truncate">
                      Menu Super Admin TI
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={toggleSidebar}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
                    title="Ciutkan Menu Navigasi"
                  >
                    <PanelLeftClose className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <Shield className="w-4 h-4" />
                  </div>
                  <button
                    type="button"
                    onClick={toggleSidebar}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-purple-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Perluas Menu Navigasi"
                  >
                    <PanelLeftOpen className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Daftar Navigasi Sidebar */}
            <nav className="space-y-1.5">
              {/* Menu 1: USERS */}
              <button
                type="button"
                onClick={() => setActiveTab("USERS")}
                title={
                  isSidebarCollapsed
                    ? `Pengguna Pegawai (${localUsers.length} Pegawai)`
                    : undefined
                }
                className={`w-full rounded-xl transition-all flex items-center group ${
                  isSidebarCollapsed
                    ? "justify-center p-2.5"
                    : "justify-between p-2.5"
                } ${
                  activeTab === "USERS"
                    ? "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 font-bold shadow-sm"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-medium"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors relative ${
                      activeTab === "USERS"
                        ? "bg-purple-600 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:text-purple-600 dark:group-hover:text-purple-400"
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    {isSidebarCollapsed && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-purple-600 ring-2 ring-white dark:ring-slate-900" />
                    )}
                  </div>
                  {!isSidebarCollapsed && (
                    <div className="min-w-0 text-left">
                      <div className="text-xs truncate">Pengguna Pegawai</div>
                      <div className="text-[10px] text-slate-400 truncate">
                        Kelola akun & status
                      </div>
                    </div>
                  )}
                </div>
                {!isSidebarCollapsed && (
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                      activeTab === "USERS"
                        ? "bg-purple-200/80 dark:bg-purple-900/60 text-purple-900 dark:text-purple-200"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {localUsers.length}
                  </span>
                )}
              </button>

              {/* Menu 2: UNITS */}
              <button
                type="button"
                onClick={() => setActiveTab("UNITS")}
                title={
                  isSidebarCollapsed
                    ? `Master Ruangan (${units.length} Unit)`
                    : undefined
                }
                className={`w-full rounded-xl transition-all flex items-center group ${
                  isSidebarCollapsed
                    ? "justify-center p-2.5"
                    : "justify-between p-2.5"
                } ${
                  activeTab === "UNITS"
                    ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 font-bold shadow-sm"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-medium"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors relative ${
                      activeTab === "UNITS"
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    {isSidebarCollapsed && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-indigo-600 ring-2 ring-white dark:ring-slate-900" />
                    )}
                  </div>
                  {!isSidebarCollapsed && (
                    <div className="min-w-0 text-left">
                      <div className="text-xs truncate">Master Ruangan</div>
                      <div className="text-[10px] text-slate-400 truncate">
                        Gedung, lantai & poli
                      </div>
                    </div>
                  )}
                </div>
                {!isSidebarCollapsed && (
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                      activeTab === "UNITS"
                        ? "bg-indigo-200/80 dark:bg-indigo-900/60 text-indigo-900 dark:text-indigo-200"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {units.length}
                  </span>
                )}
              </button>

              {/* Menu 3: CATEGORIES */}
              <button
                type="button"
                onClick={() => setActiveTab("CATEGORIES")}
                title={
                  isSidebarCollapsed
                    ? `Kategori & SLA (${categories.length} Kategori)`
                    : undefined
                }
                className={`w-full rounded-xl transition-all flex items-center group ${
                  isSidebarCollapsed
                    ? "justify-center p-2.5"
                    : "justify-between p-2.5"
                } ${
                  activeTab === "CATEGORIES"
                    ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 font-bold shadow-sm"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-medium"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors relative ${
                      activeTab === "CATEGORIES"
                        ? "bg-amber-500 text-slate-950 font-bold"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:text-amber-500"
                    }`}
                  >
                    <Tag className="w-4 h-4" />
                    {isSidebarCollapsed && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-white dark:ring-slate-900" />
                    )}
                  </div>
                  {!isSidebarCollapsed && (
                    <div className="min-w-0 text-left">
                      <div className="text-xs truncate">Kategori & SLA</div>
                      <div className="text-[10px] text-slate-400 truncate">
                        5 Pilar & target menit
                      </div>
                    </div>
                  )}
                </div>
                {!isSidebarCollapsed && (
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                      activeTab === "CATEGORIES"
                        ? "bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {categories.length}
                  </span>
                )}
              </button>

              {/* Menu 4: AUDIT_LOGS */}
              <button
                type="button"
                onClick={() => setActiveTab("AUDIT_LOGS")}
                title={
                  isSidebarCollapsed
                    ? `Log Audit Keamanan (${auditLogs.length} Log)`
                    : undefined
                }
                className={`w-full rounded-xl transition-all flex items-center group ${
                  isSidebarCollapsed
                    ? "justify-center p-2.5"
                    : "justify-between p-2.5"
                } ${
                  activeTab === "AUDIT_LOGS"
                    ? "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 font-bold shadow-sm"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-medium"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors relative ${
                      activeTab === "AUDIT_LOGS"
                        ? "bg-purple-600 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:text-purple-600 dark:group-hover:text-purple-400"
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    {isSidebarCollapsed && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-purple-600 ring-2 ring-white dark:ring-slate-900" />
                    )}
                  </div>
                  {!isSidebarCollapsed && (
                    <div className="min-w-0 text-left">
                      <div className="text-xs truncate">Log Audit Keamanan</div>
                      <div className="text-[10px] text-slate-400 truncate">
                        Forensik & aktivitas
                      </div>
                    </div>
                  )}
                </div>
                {!isSidebarCollapsed && (
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                      activeTab === "AUDIT_LOGS"
                        ? "bg-purple-200/80 dark:bg-purple-900/60 text-purple-900 dark:text-purple-200"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {auditLogs.length}
                  </span>
                )}
              </button>

              {/* Menu 5: TICKETS */}
              <button
                type="button"
                onClick={() => setActiveTab("TICKETS")}
                title={
                  isSidebarCollapsed
                    ? `Daftar Tiket Antrean (${unresolvedTickets.length} Belum Selesai)`
                    : undefined
                }
                className={`w-full rounded-xl transition-all flex items-center group ${
                  isSidebarCollapsed
                    ? "justify-center p-2.5"
                    : "justify-between p-2.5"
                } ${
                  activeTab === "TICKETS"
                    ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 font-bold shadow-sm"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-medium"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors relative ${
                      activeTab === "TICKETS"
                        ? "bg-rose-600 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:text-rose-600 dark:group-hover:text-rose-400"
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    {isSidebarCollapsed && unresolvedTickets.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-600 ring-2 ring-white dark:ring-slate-900" />
                    )}
                  </div>
                  {!isSidebarCollapsed && (
                    <div className="min-w-0 text-left">
                      <div className="text-xs truncate">Daftar Tiket Antrean</div>
                      <div className="text-[10px] text-slate-400 truncate">
                        Tiket masuk & belum selesai
                      </div>
                    </div>
                  )}
                </div>
                {!isSidebarCollapsed && (
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                      activeTab === "TICKETS"
                        ? "bg-rose-200/80 dark:bg-rose-900/60 text-rose-900 dark:text-rose-200"
                        : unresolvedTickets.length > 0
                        ? "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {unresolvedTickets.length}
                  </span>
                )}
              </button>

              {/* Menu 6: PROFIL RUMAH SAKIT */}
              <button
                type="button"
                onClick={() => setActiveTab("HOSPITAL_PROFILE")}
                title={
                  isSidebarCollapsed
                    ? "Profil Rumah Sakit & Identitas Instansi"
                    : undefined
                }
                className={`w-full rounded-xl transition-all flex items-center group ${
                  isSidebarCollapsed
                    ? "justify-center p-2.5"
                    : "justify-between p-2.5"
                } ${
                  activeTab === "HOSPITAL_PROFILE"
                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 font-bold shadow-sm"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-medium"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      activeTab === "HOSPITAL_PROFILE"
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400"
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                  </div>
                  {!isSidebarCollapsed && (
                    <div className="min-w-0 text-left">
                      <div className="text-xs truncate">Profil Rumah Sakit</div>
                      <div className="text-[10px] text-slate-400 truncate">
                        Identitas & Kop Surat
                      </div>
                    </div>
                  )}
                </div>
                {!isSidebarCollapsed && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                      activeTab === "HOSPITAL_PROFILE"
                        ? "bg-emerald-200/80 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    Instansi
                  </span>
                )}
              </button>

              {/* Menu 7: INTERNAL_NETWORK (Jaringan Server & LAN) */}
              <button
                type="button"
                onClick={() => setActiveTab("INTERNAL_NETWORK")}
                title={
                  isSidebarCollapsed
                    ? "Diagnostik Jaringan Server & LAN"
                    : undefined
                }
                className={`w-full rounded-xl transition-all flex items-center group ${
                  isSidebarCollapsed
                    ? "justify-center p-2.5"
                    : "justify-between p-2.5"
                } ${
                  activeTab === "INTERNAL_NETWORK"
                    ? "bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/60 font-bold shadow-sm"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-medium"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      activeTab === "INTERNAL_NETWORK"
                        ? "bg-cyan-600 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:text-cyan-600 dark:group-hover:text-cyan-400"
                    }`}
                  >
                    <Server className="w-4 h-4" />
                  </div>
                  {!isSidebarCollapsed && (
                    <div className="min-w-0 text-left">
                      <div className="text-xs truncate">Jaringan Server & LAN</div>
                      <div className="text-[10px] text-slate-400 truncate">
                        Kesehatan server & ping LAN
                      </div>
                    </div>
                  )}
                </div>
                {!isSidebarCollapsed && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                      activeTab === "INTERNAL_NETWORK"
                        ? "bg-cyan-200/80 dark:bg-cyan-900/60 text-cyan-900 dark:text-cyan-200"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    LAN RS
                  </span>
                )}
              </button>

              {/* Menu 8: EXTERNAL_CONNECTIVITY (Konektivitas API & Web) */}
              <button
                type="button"
                onClick={() => setActiveTab("EXTERNAL_CONNECTIVITY")}
                title={
                  isSidebarCollapsed
                    ? "Konektivitas API & Layanan Web Eksternal"
                    : undefined
                }
                className={`w-full rounded-xl transition-all flex items-center group ${
                  isSidebarCollapsed
                    ? "justify-center p-2.5"
                    : "justify-between p-2.5"
                } ${
                  activeTab === "EXTERNAL_CONNECTIVITY"
                    ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 font-bold shadow-sm"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-medium"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      activeTab === "EXTERNAL_CONNECTIVITY"
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400"
                    }`}
                  >
                    <Globe className="w-4 h-4" />
                  </div>
                  {!isSidebarCollapsed && (
                    <div className="min-w-0 text-left">
                      <div className="text-xs truncate">Konektivitas API & Web</div>
                      <div className="text-[10px] text-slate-400 truncate">
                        BPJS, SatuSehat & internet
                      </div>
                    </div>
                  )}
                </div>
                {!isSidebarCollapsed && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                      activeTab === "EXTERNAL_CONNECTIVITY"
                        ? "bg-blue-200/80 dark:bg-blue-900/60 text-blue-900 dark:text-blue-200"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    Integrasi
                  </span>
                )}
              </button>

              {/* Menu 9: PORTAL MANAJEMEN */}
              <div className="pt-2 mt-2 border-t border-slate-100 dark:border-white/10">
                <a
                  href="/dashboard?view=management"
                  className={`w-full rounded-xl transition-all flex items-center group ${
                    isSidebarCollapsed
                      ? "justify-center p-2"
                      : "justify-between p-2.5"
                  } bg-amber-50/80 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 font-semibold shadow-sm`}
                  title={isSidebarCollapsed ? "Beralih ke Portal Analitik Manajemen" : undefined}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-amber-500 text-slate-950 shadow-sm group-hover:scale-105 transition-transform">
                      <BarChart3 className="w-4 h-4" />
                    </div>
                    {!isSidebarCollapsed && (
                      <div className="min-w-0 text-left">
                        <div className="text-xs truncate font-bold text-amber-900 dark:text-amber-200">
                          Portal Manajemen
                        </div>
                        <div className="text-[10px] text-amber-700/80 dark:text-amber-400/80 truncate">
                          Analitik & Mutu RS
                        </div>
                      </div>
                    )}
                  </div>
                  {!isSidebarCollapsed && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 bg-amber-200/80 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200">
                      Manajemen
                    </span>
                  )}
                </a>
              </div>
            </nav>
          </div>
        </aside>

        {/* AREA UTAMA DASHBOARD DI SEBELAH KANAN SIDEBAR */}
        <div className="flex-1 min-w-0 w-full space-y-6">
          {/* Header Utama Superadmin */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-7 border border-slate-800 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-400/30 backdrop-blur-sm">
              <Shield className="w-3.5 h-3.5 text-purple-400" />
              Portal Pengendali Tertinggi SIATI
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight">
              Pusat Administrasi & Keamanan Sistem
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Administrator aktif: <strong className="text-white">{currentUserName}</strong>. Kelola akun pegawai, master data ruangan, target SLA waktu respon, dan pantau log audit keamanan siber rumah sakit.
            </p>
          </div>

          <button
            onClick={() => router.refresh()}
            className="self-start sm:self-auto px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold flex items-center gap-2 backdrop-blur-md transition-all active:scale-95 shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Segarkan Data
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-between gap-2.5 shadow-sm transition-all ${
            feedbackMsg.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300"
              : "bg-rose-50 dark:bg-rose-500/20 border border-rose-200 dark:border-rose-500/40 text-rose-800 dark:text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedbackMsg.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMsg(null)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors shrink-0"
            title="Tutup pesan"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Baris Ringkasan KPI Sistem (4 Kolom pada Tablet & PC) */}
      <motion.div
        variants={staggerContainerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4"
      >
        <motion.div
          variants={cardItemVariants}
          whileHover={interactiveCardHover}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm transition-colors flex items-center justify-between"
        >
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Total Pengguna</span>
            <span className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5 block">
              <AnimatedCounter value={localUsers.length} />
            </span>
            <span className="text-[11px] text-slate-400">Pegawai Terdaftar</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </motion.div>

        <motion.div
          variants={cardItemVariants}
          whileHover={interactiveCardHover}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm transition-colors flex items-center justify-between"
        >
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Unit / Ruangan</span>
            <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-0.5 block">
              <AnimatedCounter value={units.length} />
            </span>
            <span className="text-[11px] text-slate-400">Bangsal & Poliklinik</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
        </motion.div>

        <motion.div
          variants={cardItemVariants}
          whileHover={interactiveCardHover}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm transition-colors flex items-center justify-between"
        >
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Kategori Masalah</span>
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-0.5 block">
              <AnimatedCounter value={categories.length} />
            </span>
            <span className="text-[11px] text-slate-400">Target SLA Aktif</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Tag className="w-5 h-5" />
          </div>
        </motion.div>

        <motion.div
          variants={cardItemVariants}
          whileHover={interactiveCardHover}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm transition-colors flex items-center justify-between"
        >
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Log Keamanan</span>
            <span className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-0.5 block">
              <AnimatedCounter value={auditLogs.length} />
            </span>
            <span className="text-[11px] text-slate-400">Audit Trail Tersimpan</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5" />
          </div>
        </motion.div>
      </motion.div>

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
            <span>Pengguna ({localUsers.length})</span>
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
            <span>Daftar Tiket ({unresolvedTickets.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("HOSPITAL_PROFILE")}
            className={`py-2.5 px-3 sm:px-4 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap flex items-center gap-2 transition-all shadow-sm ${
              activeTab === "HOSPITAL_PROFILE"
                ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/20 shadow-md"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Profil RS</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("INTERNAL_NETWORK")}
            className={`py-2.5 px-3 sm:px-4 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap flex items-center gap-2 transition-all shadow-sm ${
              activeTab === "INTERNAL_NETWORK"
                ? "bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 ring-2 ring-cyan-500/20 shadow-md"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Server className="w-4 h-4" />
            <span>Jaringan Server</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("EXTERNAL_CONNECTIVITY")}
            className={`py-2.5 px-3 sm:px-4 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap flex items-center gap-2 transition-all shadow-sm ${
              activeTab === "EXTERNAL_CONNECTIVITY"
                ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/20 shadow-md"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>API & Web</span>
          </button>

          <a
            href="/dashboard?view=management"
            className="py-2.5 px-3 sm:px-4 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap flex items-center gap-2 transition-all shadow-sm bg-amber-500 text-slate-950 hover:bg-amber-400"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Portal Manajemen</span>
          </a>
        </div>

      {/* Tab 1: Manajemen pengguna */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          variants={tabContentVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
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
                <option value="IT_STAFF">Staf TI</option>
                <option value="STAFF_USER">Staf Medis / Nakes</option>
                <option value="MANAGEMENT">Manajemen</option>
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
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {u.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={u.avatarUrl}
                          alt={u.fullName}
                          className="w-11 h-11 rounded-full object-cover border-2 border-slate-200 dark:border-white/10 shrink-0 shadow-sm"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-sky-500 via-indigo-600 to-purple-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-sm ring-2 ring-white dark:ring-slate-800">
                          {getInitials(u.fullName)}
                        </div>
                      )}
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-base truncate">
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
                      disabled={togglingUserId === u.id || isCurrentUser}
                      onClick={() => handleToggleUserStatus(u.id)}
                      className={`py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 ${
                        u.isActive
                          ? "bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/20"
                          : "bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20"
                      }`}
                      title={u.isActive ? "Nonaktifkan akun" : "Aktifkan akun"}
                    >
                      {togglingUserId === u.id ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />
                          Memproses...
                        </>
                      ) : u.isActive ? (
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

      {/* Tab 2: Master unit */}
      {activeTab === "UNITS" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Daftar Ruangan & Bangsal Pelayanan Rumah Sakit
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

      {/* Tab 3: Master kategori & target SLA */}
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

      {/* Tab 4: Log audit */}
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

      {/* Tab 5: Tiket antrean layanan TI */}
      {activeTab === "TICKETS" && (
        <div className="space-y-5">
          {/* Header Banner Tab Tiket */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 text-[11px] font-bold border border-rose-200 dark:border-rose-500/30">
                <Layers className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                Daftar Tiket Antrean Layanan TI
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Monitoring Aduan Masuk & Belum Selesai
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
                Tinjau seluruh tiket kendala fasilitas TI yang baru diajukan (SUBMITTED) dan belum diselesaikan oleh staf teknisi lapangan. Anda juga dapat memperbarui tingkat urgensi tiket secara langsung.
              </p>
            </div>

            <button
              type="button"
              onClick={() => router.refresh()}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors self-start sm:self-auto shrink-0 shadow-sm"
              title="Perbarui data tiket antrean"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Muat Ulang Tiket</span>
            </button>
          </div>

          {/* 4 Kartu Metrik Ringkasan Status Tiket */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/40 rounded-2xl p-4 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs text-rose-700 dark:text-rose-400 font-semibold block">Belum Selesai</span>
                <span className="text-2xl font-black text-rose-700 dark:text-rose-400 mt-0.5 block">
                  <AnimatedCounter value={unresolvedTickets.length} />
                </span>
                <span className="text-[11px] text-slate-400">Antrean Aktif Total</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-900/40 rounded-2xl p-4 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs text-sky-700 dark:text-sky-400 font-semibold block">Baru Masuk</span>
                <span className="text-2xl font-black text-sky-700 dark:text-sky-400 mt-0.5 block">
                  <AnimatedCounter value={submittedTickets.length} />
                </span>
                <span className="text-[11px] text-slate-400">Menunggu Respon Teknisi</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-4 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs text-amber-700 dark:text-amber-400 font-semibold block">Sedang Ditangani</span>
                <span className="text-2xl font-black text-amber-700 dark:text-amber-400 mt-0.5 block">
                  <AnimatedCounter value={inProgressTickets.length} />
                </span>
                <span className="text-[11px] text-slate-400">Dalam Pengerjaan Staf TI</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Activity className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/40 rounded-2xl p-4 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs text-red-700 dark:text-red-400 font-semibold block">Darurat Kritis</span>
                <span className="text-2xl font-black text-red-600 dark:text-red-400 mt-0.5 block">
                  <AnimatedCounter value={emergencyTickets.length} />
                </span>
                <span className="text-[11px] text-slate-400">Tingkat Urgensi P1</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <Flame className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Bar Filter & Pencarian */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm space-y-3">
            {/* Baris Atas: Input Pencarian & Dropdown Urgensi */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Cari no. tiket, nama ruangan, gedung, uraian masalah, atau teknisi..."
                  value={ticketSearch}
                  onChange={(e) => setTicketSearch(e.target.value)}
                  className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                {ticketSearch && (
                  <button
                    type="button"
                    onClick={() => setTicketSearch("")}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                <Filter className="w-4 h-4 text-slate-400 hidden sm:block shrink-0" />
                <select
                  value={ticketUrgencyFilter}
                  onChange={(e) => setTicketUrgencyFilter(e.target.value)}
                  className="w-full sm:w-52 py-2.5 px-3 rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="ALL">Semua Tingkat Urgensi</option>
                  <option value="EMERGENCY">P1 - DARURAT</option>
                  <option value="HIGH">P2 - TINGGI</option>
                  <option value="MEDIUM">P3 - SEDANG</option>
                  <option value="LOW">P4 - RENDAH</option>
                </select>
              </div>
            </div>

            {/* Baris Bawah: Tombol Pills Filter Status Tiket */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 hidden sm:inline">
                Status:
              </span>
              <button
                type="button"
                onClick={() => setTicketStatusFilter("UNRESOLVED")}
                className={`py-1.5 px-3 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                  ticketStatusFilter === "UNRESOLVED"
                    ? "bg-rose-600 text-white shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                <span>Belum Selesai (Aktif)</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
                    ticketStatusFilter === "UNRESOLVED"
                      ? "bg-white/20 text-white"
                      : "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300"
                  }`}
                >
                  {unresolvedTickets.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTicketStatusFilter("SUBMITTED")}
                className={`py-1.5 px-3 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                  ticketStatusFilter === "SUBMITTED"
                    ? "bg-sky-600 text-white shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                <span>Baru Masuk</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
                    ticketStatusFilter === "SUBMITTED"
                      ? "bg-white/20 text-white"
                      : "bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300"
                  }`}
                >
                  {submittedTickets.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTicketStatusFilter("ASSIGNED")}
                className={`py-1.5 px-3 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                  ticketStatusFilter === "ASSIGNED"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                <span>Ditugaskan</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
                    ticketStatusFilter === "ASSIGNED"
                      ? "bg-white/20 text-white"
                      : "bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300"
                  }`}
                >
                  {localTickets.filter((t) => t.status === TicketStatus.ASSIGNED).length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTicketStatusFilter("IN_PROGRESS")}
                className={`py-1.5 px-3 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                  ticketStatusFilter === "IN_PROGRESS"
                    ? "bg-amber-600 text-white shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                <span>Sedang Dikerjakan</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
                    ticketStatusFilter === "IN_PROGRESS"
                      ? "bg-white/20 text-white"
                      : "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300"
                  }`}
                >
                  {localTickets.filter((t) => t.status === TicketStatus.IN_PROGRESS).length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTicketStatusFilter("PENDING_PARTS")}
                className={`py-1.5 px-3 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                  ticketStatusFilter === "PENDING_PARTS"
                    ? "bg-purple-600 text-white shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                <span>Menunggu Part</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
                    ticketStatusFilter === "PENDING_PARTS"
                      ? "bg-white/20 text-white"
                      : "bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300"
                  }`}
                >
                  {pendingPartsTickets.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTicketStatusFilter("RESOLVED")}
                className={`py-1.5 px-3 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                  ticketStatusFilter === "RESOLVED"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                <span>Selesai Dikerjakan</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
                    ticketStatusFilter === "RESOLVED"
                      ? "bg-white/20 text-white"
                      : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                  }`}
                >
                  {resolvedTickets.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTicketStatusFilter("ALL")}
                className={`py-1.5 px-3 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                  ticketStatusFilter === "ALL"
                    ? "bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                <span>Semua Tiket</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
                    ticketStatusFilter === "ALL"
                      ? "bg-white/20 text-white dark:bg-black/20 dark:text-slate-900"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {localTickets.length}
                </span>
              </button>
            </div>
          </div>

          {/* Keterangan Jumlah Hasil */}
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
            <span>
              Menampilkan <strong className="text-slate-900 dark:text-white font-bold">{filteredTickets.length}</strong> tiket {
                ticketStatusFilter === "UNRESOLVED" 
                  ? "yang belum selesai" 
                  : ticketStatusFilter === "RESOLVED"
                  ? "yang telah selesai dikerjakan"
                  : "sesuai filter"
              }
            </span>
            {ticketStatusFilter !== "UNRESOLVED" && (
              <button
                type="button"
                onClick={() => {
                  setTicketStatusFilter("UNRESOLVED");
                  setTicketUrgencyFilter("ALL");
                  setTicketSearch("");
                }}
                className="text-rose-600 dark:text-rose-400 hover:underline font-semibold"
              >
                Kembali ke Tiket Belum Selesai (Default)
              </button>
            )}
          </div>

          {/* Daftar Tiket: Versi Tabel Desktop & Tablet (md+) */}
          <div className="hidden md:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden">
            {filteredTickets.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  {ticketStatusFilter === "UNRESOLVED" && !ticketSearch && ticketUrgencyFilter === "ALL"
                    ? "Tidak Ada Tiket Antrean yang Belum Selesai"
                    : ticketStatusFilter === "RESOLVED" && !ticketSearch && ticketUrgencyFilter === "ALL"
                    ? "Belum Ada Tiket yang Selesai Dikerjakan"
                    : "Tidak Ada Tiket yang Cocok"}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  {ticketStatusFilter === "UNRESOLVED" && !ticketSearch && ticketUrgencyFilter === "ALL"
                    ? "Luar biasa! Seluruh kendala fasilitas TI rumah sakit saat ini telah terselesaikan dengan baik oleh Staf TI."
                    : ticketStatusFilter === "RESOLVED" && !ticketSearch && ticketUrgencyFilter === "ALL"
                    ? "Belum ada tiket aduan fasilitas TI yang ditandai selesai atau ditutup."
                    : "Coba sesuaikan kata kunci pencarian atau ubah filter status & tingkat urgensi."}
                </p>
                {(ticketSearch || ticketUrgencyFilter !== "ALL" || ticketStatusFilter !== "UNRESOLVED") && (
                  <button
                    type="button"
                    onClick={() => {
                      setTicketSearch("");
                      setTicketUrgencyFilter("ALL");
                      setTicketStatusFilter("UNRESOLVED");
                    }}
                    className="mt-2 px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    Reset Filter
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-white/10">
                    <tr>
                      <th className="py-3.5 px-4">No. Tiket & Waktu</th>
                      <th className="py-3.5 px-4">Ruangan & Lokasi</th>
                      <th className="py-3.5 px-4">Kategori & SLA</th>
                      <th className="py-3.5 px-4">Tingkat Urgensi</th>
                      <th className="py-3.5 px-4">Uraian Masalah & Lampiran</th>
                      <th className="py-3.5 px-4">Status & Teknisi</th>
                      <th className="py-3.5 px-4 text-right">Durasi Respon</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {filteredTickets.map((ticket) => {
                      const statusBadge = getTicketStatusBadge(ticket.status);
                      const urgencyBadge = getTicketUrgencyBadge(ticket.urgency);
                      return (
                        <tr
                          key={ticket.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          {/* 1. No Tiket & Waktu */}
                          <td className="py-3.5 px-4 align-top whitespace-nowrap">
                            <span className="font-mono font-bold text-rose-600 dark:text-rose-400 text-xs block">
                              {ticket.ticketNumber}
                            </span>
                            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>{getRelativeTime(ticket.submittedAt)}</span>
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {formatTicketDate(ticket.submittedAt)}
                            </div>
                          </td>

                          {/* 2. Ruangan & Lokasi */}
                          <td className="py-3.5 px-4 align-top">
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                              <span>{ticket.unit.name}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{ticket.unit.buildingZone}</span>
                            </div>
                          </td>

                          {/* 3. Kategori & SLA */}
                          <td className="py-3.5 px-4 align-top whitespace-nowrap">
                            <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                              {ticket.category.name}
                            </span>
                            <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                              SLA: {ticket.category.targetSlaMinutes} Menit
                            </span>
                          </td>

                          {/* 4. Tingkat Urgensi (Terkunci jika tiket sudah selesai) */}
                          <td className="py-3.5 px-4 align-top whitespace-nowrap">
                            {ticket.status === TicketStatus.RESOLVED || ticket.status === TicketStatus.CLOSED ? (
                              <div
                                className={`inline-flex items-center gap-1.5 text-[11px] font-bold py-1 px-2.5 rounded-lg border opacity-80 cursor-not-allowed ${urgencyBadge.color}`}
                                title="Tingkat urgensi tidak dapat diedit karena tiket sudah selesai"
                              >
                                <Lock className="w-3 h-3 text-slate-500 shrink-0" />
                                <span>{urgencyBadge.label}</span>
                              </div>
                            ) : (
                              <select
                                value={ticket.urgency}
                                onChange={(e) => handleAdminUpdateUrgency(ticket.id, e.target.value as TicketUrgency)}
                                className={`text-[11px] font-bold py-1 px-2 rounded-lg border focus:outline-none transition-colors cursor-pointer ${urgencyBadge.color}`}
                                title="Ubah Tingkat Urgensi Tiket Ini"
                              >
                                <option value={TicketUrgency.EMERGENCY}>P1 - DARURAT</option>
                                <option value={TicketUrgency.HIGH}>P2 - TINGGI</option>
                                <option value={TicketUrgency.MEDIUM}>P3 - SEDANG</option>
                                <option value={TicketUrgency.LOW}>P4 - RENDAH</option>
                              </select>
                            )}
                          </td>

                          {/* 5. Uraian Masalah & Lampiran */}
                          <td className="py-3.5 px-4 align-top max-w-sm">
                            <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-normal">
                              {ticket.description}
                            </p>

                            {/* Lampiran Foto/Video */}
                            {ticket.attachments && ticket.attachments.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {ticket.attachments.map((att) => (
                                  <button
                                    key={att.id}
                                    type="button"
                                    onClick={() =>
                                      setActiveMedia({
                                        id: att.id,
                                        fileType: att.fileType as "IMAGE" | "VIDEO",
                                        storedFilename: att.storedFilename,
                                        originalName: att.originalName,
                                      })
                                    }
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all active:scale-95 shadow-sm ${
                                      att.fileType === "IMAGE"
                                        ? "bg-sky-50 hover:bg-sky-100 dark:bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-500/30"
                                        : "bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30"
                                    }`}
                                    title="Klik untuk membuka lampiran di layar ini"
                                  >
                                    {att.fileType === "IMAGE" ? (
                                      <ImageIcon className="w-3 h-3 text-sky-500" />
                                    ) : (
                                      <VideoIcon className="w-3 h-3 text-amber-500" />
                                    )}
                                    <span>{att.fileType === "IMAGE" ? "Foto Bukti" : "Video Bukti"}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </td>

                          {/* 6. Status & Teknisi */}
                          <td className="py-3.5 px-4 align-top whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${statusBadge.color}`}
                            >
                              <span className={`w-2 h-2 rounded-full ${statusBadge.dot}`} />
                              <span>{statusBadge.label}</span>
                            </span>

                            {ticket.assignedTechnician ? (
                              <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-semibold mt-1.5">
                                <UserCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                <span>{ticket.assignedTechnician.fullName}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                <span>Belum Ada Teknisi</span>
                              </div>
                            )}

                            {ticket.rating && (
                              <button
                                type="button"
                                onClick={() => setReportDocTicket(ticket)}
                                className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 dark:bg-sky-500/15 dark:hover:bg-sky-500/25 text-sky-700 dark:text-sky-300 font-bold text-[10.5px] border border-sky-200 dark:border-sky-500/30 cursor-pointer shadow-2xs transition-all"
                                title="Buka Berita Acara & Dokumen Laporan Hasil Perbaikan"
                              >
                                <FileCheck className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                                <span>Dokumen Laporan ({ticket.rating.ratingScore}★)</span>
                              </button>
                            )}
                          </td>

                          {/* 7. Durasi Respon */}
                          <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                            {ticket.responseMinutes !== null ? (
                              <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                                {ticket.responseMinutes} mnt
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400 font-mono italic">
                                Belum direspon
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Daftar Tiket: Versi Kartu Mobile (< md) */}
          <div className="md:hidden space-y-3">
            {filteredTickets.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 p-8 text-center space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {ticketStatusFilter === "UNRESOLVED"
                    ? "Tidak Ada Tiket yang Belum Selesai"
                    : ticketStatusFilter === "RESOLVED"
                    ? "Belum Ada Tiket yang Selesai Dikerjakan"
                    : "Tidak Ada Tiket yang Cocok"}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {ticketStatusFilter === "UNRESOLVED"
                    ? "Seluruh aduan fasilitas TI saat ini telah terselesaikan dengan baik."
                    : ticketStatusFilter === "RESOLVED"
                    ? "Belum ada tiket aduan yang berstatus selesai atau ditutup."
                    : "Coba sesuaikan pencarian atau filter status tiket."}
                </p>
              </div>
            ) : (
              filteredTickets.map((ticket) => {
                const statusBadge = getTicketStatusBadge(ticket.status);
                const urgencyBadge = getTicketUrgencyBadge(ticket.urgency);
                return (
                  <div
                    key={ticket.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 p-4 shadow-sm space-y-3"
                  >
                    {/* Header Kartu: No Tiket & Status */}
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-white/5 pb-2.5">
                      <div>
                        <span className="font-mono font-bold text-rose-600 dark:text-rose-400 text-xs">
                          {ticket.ticketNumber}
                        </span>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{getRelativeTime(ticket.submittedAt)}</span>
                        </div>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border ${statusBadge.color}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`} />
                        <span>{statusBadge.label}</span>
                      </span>
                    </div>

                    {/* Lokasi & Kategori */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Ruangan:</span>
                        <span className="font-bold text-slate-900 dark:text-white truncate block">
                          {ticket.unit.name}
                        </span>
                        <span className="text-[10px] text-slate-500 truncate block">
                          {ticket.unit.buildingZone}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Kategori:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                          {ticket.category.name}
                        </span>
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold block">
                          SLA {ticket.category.targetSlaMinutes}m
                        </span>
                      </div>
                    </div>

                    {/* Tingkat Urgensi Dropdown */}
                    <div className="flex items-center justify-between gap-2 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl">
                      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                        Tingkat Urgensi:
                      </span>
                      {ticket.status === TicketStatus.RESOLVED || ticket.status === TicketStatus.CLOSED ? (
                        <div
                          className={`inline-flex items-center gap-1.5 text-[11px] font-bold py-1 px-2.5 rounded-lg border opacity-80 cursor-not-allowed ${urgencyBadge.color}`}
                          title="Tingkat urgensi tidak dapat diedit karena tiket sudah selesai"
                        >
                          <Lock className="w-3 h-3 text-slate-500 shrink-0" />
                          <span>{urgencyBadge.label}</span>
                        </div>
                      ) : (
                        <select
                          value={ticket.urgency}
                          onChange={(e) => handleAdminUpdateUrgency(ticket.id, e.target.value as TicketUrgency)}
                          className={`text-[11px] font-bold py-1 px-2 rounded-lg border focus:outline-none ${urgencyBadge.color}`}
                        >
                          <option value={TicketUrgency.EMERGENCY}>P1 - DARURAT</option>
                          <option value={TicketUrgency.HIGH}>P2 - TINGGI</option>
                          <option value={TicketUrgency.MEDIUM}>P3 - SEDANG</option>
                          <option value={TicketUrgency.LOW}>P4 - RENDAH</option>
                        </select>
                      )}
                    </div>

                    {/* Deskripsi Masalah */}
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      {ticket.description}
                    </p>

                    {/* Lampiran Media */}
                    {ticket.attachments && ticket.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {ticket.attachments.map((att) => (
                          <button
                            key={att.id}
                            type="button"
                            onClick={() =>
                              setActiveMedia({
                                id: att.id,
                                fileType: att.fileType as "IMAGE" | "VIDEO",
                                storedFilename: att.storedFilename,
                                originalName: att.originalName,
                              })
                            }
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${
                              att.fileType === "IMAGE"
                                ? "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300 border-sky-200"
                                : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300 border-amber-200"
                            }`}
                          >
                            {att.fileType === "IMAGE" ? (
                              <ImageIcon className="w-3 h-3 text-sky-500" />
                            ) : (
                              <VideoIcon className="w-3 h-3 text-amber-500" />
                            )}
                            <span>{att.fileType === "IMAGE" ? "Foto Bukti" : "Video Bukti"}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Teknisi Penangan */}
                    <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-400">Teknisi Penangan:</span>
                      {ticket.assignedTechnician ? (
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5" />
                          {ticket.assignedTechnician.fullName}
                        </span>
                      ) : (
                        <span className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Menunggu Staf TI
                        </span>
                      )}
                    </div>

                    {/* Tombol Dokumen Laporan Perbaikan jika tiket sudah dinilai */}
                    {ticket.rating && (
                      <div className="pt-2 border-t border-slate-100 dark:border-white/5">
                        <button
                          type="button"
                          onClick={() => setReportDocTicket(ticket)}
                          className="w-full py-2 px-3 rounded-xl bg-sky-50 hover:bg-sky-100 dark:bg-sky-500/15 dark:hover:bg-sky-500/25 text-sky-700 dark:text-sky-300 font-bold text-xs flex items-center justify-center gap-1.5 border border-sky-200 dark:border-sky-500/30 shadow-xs cursor-pointer"
                        >
                          <FileCheck className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                          <span>Lihat Dokumen Laporan ({ticket.rating.ratingScore}★)</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Tab 6: Profil rumah sakit */}
      {activeTab === "HOSPITAL_PROFILE" && (
        <div className="space-y-6">
          {/* Header Banner Tab Profil Rumah Sakit */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 border border-emerald-500/30 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-400/30">
                <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Identitas Resmi Rumah Sakit & Kop Surat</span>
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                <span>Pengaturan Profil Rumah Sakit</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-600 text-white font-semibold">
                  Dinamis Global
                </span>
              </h3>
              <p className="text-xs text-emerald-100/80 max-w-3xl leading-relaxed">
                Kelola identitas resmi fasilitas kesehatan Anda: nama rumah sakit, kelas, jenis kepemilikan, kontak, kode integrasi nasional (BPJS, Kemenkes, SATUSEHAT), serta logo resmi. Data ini otomatis digunakan di seluruh kop surat laporan cetak, file ekspor Excel, dan header sistem SIATI.
              </p>
            </div>

            <button
              type="button"
              onClick={() => router.refresh()}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors self-start sm:self-auto shrink-0 shadow-sm border border-white/15"
              title="Segarkan data profil rumah sakit"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Muat Ulang</span>
            </button>
          </div>

          {/* Feedback Message Banner */}
          {hpSavedMsg && (
            <div
              className={`p-4 rounded-xl border flex items-center gap-3 text-xs sm:text-sm font-semibold transition-all shadow-sm ${
                hpSavedMsg.type === "success"
                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                  : "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800"
              }`}
            >
              {hpSavedMsg.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <div className="flex-1">{hpSavedMsg.text}</div>
              <button
                type="button"
                onClick={() => setHpSavedMsg(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>
          )}

          {/* Grid Layout: Form Pengaturan (Kiri) & Live Preview Kop Surat (Kanan) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* KOLOM KIRI: FORMULIR IDENTITAS (7 Kolom) */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 sm:p-6 shadow-sm space-y-6">
              <div className="border-b border-slate-100 dark:border-white/10 pb-4">
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Formulir Data Rumah Sakit
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Lengkapi setiap informasi fasilitas kesehatan secara akurat sesuai data perizinan resmi.
                </p>
              </div>

              <form
                action={async (formData) => {
                  setHpSavedMsg(null);
                  startTransition(async () => {
                    formData.set("logoUrl", hpForm.logoUrl || "");
                    const res = await updateHospitalProfileAction(formData);
                    if (res.success) {
                      setHpSavedMsg({
                        type: "success",
                        text: res.message || "Profil rumah sakit berhasil disimpan!",
                      });
                      router.refresh();
                    } else {
                      setHpSavedMsg({
                        type: "error",
                        text: res.message || "Gagal menyimpan profil rumah sakit.",
                      });
                    }
                  });
                }}
                className="space-y-5 text-xs"
              >
                {/* 1. SEKSI IDENTITAS DASAR */}
                <div className="space-y-3">
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" />
                    1. Identitas Pokok Rumah Sakit
                  </span>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300 block">
                      Nama Resmi Rumah Sakit *
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={hpForm.name}
                      onChange={(e) => setHpForm({ ...hpForm, name: e.target.value })}
                      placeholder="Contoh: RSUD Dr. Soetomo Surabaya"
                      className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-xs focus:ring-2 focus:ring-emerald-500/40"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 dark:text-slate-300 block">
                        Kelas Rumah Sakit *
                      </label>
                      <select
                        name="hospitalClass"
                        value={hpForm.hospitalClass}
                        onChange={(e) => setHpForm({ ...hpForm, hospitalClass: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-emerald-500/40"
                      >
                        <option value="Kelas A">Kelas A (Rujukan Nasional / Provinsi)</option>
                        <option value="Kelas B">Kelas B (Rujukan Regional)</option>
                        <option value="Kelas C">Kelas C (Rujukan Kabupaten / Kota)</option>
                        <option value="Kelas D">Kelas D (Pratama)</option>
                        <option value="Kelas Khusus">Kelas Khusus (Ibu & Anak, Jiwa, Kanker, dll)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 dark:text-slate-300 block">
                        Jenis Kepemilikan (Swasta / Pemerintah) *
                      </label>
                      <select
                        name="ownershipType"
                        value={hpForm.ownershipType}
                        onChange={(e) => setHpForm({ ...hpForm, ownershipType: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-emerald-500/40"
                      >
                        <option value="Pemerintah">Pemerintah (Kemenkes / Pemda / Daerah)</option>
                        <option value="Swasta">Swasta (Korporasi / PT Swasta)</option>
                        <option value="BUMN">BUMN (Badan Usaha Milik Negara)</option>
                        <option value="TNI">TNI (Rumkit Angkatan)</option>
                        <option value="Polri">Polri (Rumkit Bhayangkara)</option>
                        <option value="Yayasan">Yayasan / Nirlaba / Organisasi</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 2. SEKSI KONTAK & ALAMAT */}
                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-white/10">
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    2. Kontak & Alamat Lengkap
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 dark:text-slate-300 block">
                        Nomor Telepon / Call Center
                      </label>
                      <div className="relative">
                        <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          name="phone"
                          value={hpForm.phone}
                          onChange={(e) => setHpForm({ ...hpForm, phone: e.target.value })}
                          placeholder="Contoh: (021) 1234567 / 0812345678"
                          className="w-full pl-9 pr-3 p-2.5 rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 dark:text-slate-300 block">
                        Email Resmi
                      </label>
                      <div className="relative">
                        <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="email"
                          name="email"
                          value={hpForm.email}
                          onChange={(e) => setHpForm({ ...hpForm, email: e.target.value })}
                          placeholder="Contoh: kontak@rsud-daerah.go.id"
                          className="w-full pl-9 pr-3 p-2.5 rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300 block">
                      Alamat Lengkap Instansi *
                    </label>
                    <textarea
                      name="address"
                      required
                      rows={2}
                      value={hpForm.address}
                      onChange={(e) => setHpForm({ ...hpForm, address: e.target.value })}
                      placeholder="Contoh: Jl. Kesehatan Medika No. 1, Kel. Gambir, Kec. Gambir, Kota Jakarta Pusat, DKI Jakarta 10110"
                      className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs resize-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300 block">
                      Situs Web Resmi (Opsional)
                    </label>
                    <div className="relative">
                      <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="url"
                        name="website"
                        value={hpForm.website}
                        onChange={(e) => setHpForm({ ...hpForm, website: e.target.value })}
                        placeholder="Contoh: https://rsud.go.id"
                        className="w-full pl-9 pr-3 p-2.5 rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. SEKSI KODE INTEGRASI NASIONAL */}
                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-white/10">
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5" />
                    3. Kode Integrasi Layanan Nasional
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 dark:text-slate-300 block">
                        Kode PPK BPJS
                      </label>
                      <input
                        type="text"
                        name="bpjsPpkCode"
                        value={hpForm.bpjsPpkCode}
                        onChange={(e) => setHpForm({ ...hpForm, bpjsPpkCode: e.target.value })}
                        placeholder="Contoh: 0123R001"
                        className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 dark:text-slate-300 block">
                        Kode Kemenkes RS
                      </label>
                      <input
                        type="text"
                        name="kemenkesCode"
                        value={hpForm.kemenkesCode}
                        onChange={(e) => setHpForm({ ...hpForm, kemenkesCode: e.target.value })}
                        placeholder="Contoh: 3171012"
                        className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 dark:text-slate-300 block">
                        ID Organisasi SATUSEHAT
                      </label>
                      <input
                        type="text"
                        name="satuSehatId"
                        value={hpForm.satuSehatId}
                        onChange={(e) => setHpForm({ ...hpForm, satuSehatId: e.target.value })}
                        placeholder="Contoh: org-1000001"
                        className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. SEKSI LOGO RUMAH SAKIT */}
                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-white/10">
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5" />
                    4. Logo Resmi Rumah Sakit
                  </span>

                  <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl border border-dashed border-slate-300 dark:border-white/20 bg-slate-50 dark:bg-slate-800/50">
                    {/* Preview Box */}
                    <div className="w-24 h-24 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 flex items-center justify-center p-2 shrink-0 shadow-sm relative overflow-hidden">
                      {hpForm.logoUrl ? (
                        <img
                          src={hpForm.logoUrl}
                          alt="Logo Rumah Sakit"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="text-center text-slate-400">
                          <Building2 className="w-8 h-8 mx-auto mb-1 opacity-50" />
                          <span className="text-[9px] font-bold uppercase block">Belum Ada</span>
                        </div>
                      )}
                      {isUploadingLogo && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white">
                          <RefreshCw className="w-5 h-5 animate-spin" />
                        </div>
                      )}
                    </div>

                    {/* Upload Controls */}
                    <div className="flex-1 space-y-2 text-center sm:text-left w-full">
                      <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
                        <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all active:scale-95">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{isUploadingLogo ? "Mengunggah..." : "Unggah Berkas Logo"}</span>
                          <input
                            type="file"
                            accept="image/*"
                            disabled={isUploadingLogo}
                            onChange={handleLogoUpload}
                            className="hidden"
                          />
                        </label>

                        {hpForm.logoUrl && (
                          <button
                            type="button"
                            onClick={() => setHpForm((prev) => ({ ...prev, logoUrl: "" }))}
                            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-200 hover:bg-rose-100 hover:text-rose-700 dark:bg-slate-800 dark:hover:bg-rose-950/50 dark:hover:text-rose-300 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Hapus Logo</span>
                          </button>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Format: PNG, JPG, SVG, atau WebP (disarankan latar transparan, maks 5 MB).
                      </p>

                      {uploadError && (
                        <div className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1 justify-center sm:justify-start">
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                          <span>{uploadError}</span>
                        </div>
                      )}

                      {/* Atau Input Link URL Manual */}
                      <div className="pt-1">
                        <input
                          type="text"
                          value={hpForm.logoUrl}
                          onChange={(e) => setHpForm({ ...hpForm, logoUrl: e.target.value })}
                          placeholder="Atau tempel URL gambar logo langsung di sini..."
                          className="w-full p-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-[11px] text-slate-800 dark:text-slate-200"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tombol Simpan Form */}
                <div className="pt-4 border-t border-slate-100 dark:border-white/10 flex justify-end">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white font-extrabold text-xs sm:text-sm transition-all shadow-md shadow-emerald-900/30 disabled:opacity-50"
                  >
                    {isPending ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Menyimpan Profil...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Simpan Profil Rumah Sakit</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* KOLOM KANAN: LIVE PREVIEW KOP SURAT CETAK (5 Kolom) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-extrabold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                      Pratinjau Kop Surat Resmi
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    Live Real-Time
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Berikut tampilan kop surat resmi saat manajemen mencetak laporan atau mengekspor PDF rekapitulasi kinerja IT:
                </p>

                {/* Simulated Paper Sheet Kop Surat */}
                <div className="bg-white text-black p-5 rounded-xl border-2 border-slate-300 dark:border-white/20 shadow-md space-y-3">
                  <div className="flex items-center justify-between gap-4 pb-2 border-b-2 border-black">
                    {hpForm.logoUrl ? (
                      <img
                        src={hpForm.logoUrl}
                        alt="Logo RS"
                        className="w-16 h-16 object-contain shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 border border-dashed border-black rounded-lg flex flex-col items-center justify-center font-bold text-[9px] uppercase text-center p-1 shrink-0">
                        <Building2 className="w-5 h-5 mb-0.5 text-black" />
                        <span>LOGO RS</span>
                      </div>
                    )}

                    <div className="flex-1 text-center">
                      <div className="text-sm font-black tracking-wider uppercase mt-0.5 line-clamp-2">
                        {hpForm.name || "NAMA RUMAH SAKIT"}
                      </div>
                      <div className="text-[9px] font-normal mt-0.5 text-gray-700 leading-tight">
                        {hpForm.address || "Alamat Fasilitas Kesehatan"}
                      </div>
                      <div className="text-[9px] text-gray-600 flex items-center justify-center gap-2 flex-wrap mt-0.5">
                        {hpForm.phone && <span>Telp: {hpForm.phone}</span>}
                        {hpForm.email && <span>Email: {hpForm.email}</span>}
                        {hpForm.website && <span>Web: {hpForm.website}</span>}
                      </div>
                    </div>

                    <div className="w-14 shrink-0" />
                  </div>

                  {/* Sample Title under Kop */}
                  <div className="text-center pt-1 space-y-1">
                    <div className="text-[11px] font-extrabold uppercase">
                      Rekapitulasi Kinerja Pelayanan & Tingkat Kepatuhan SLA TI
                    </div>
                    <div className="text-[9px] text-gray-600">
                      Instalasi Teknologi Informasi • Tanggal: {new Date().toLocaleDateString("id-ID")}
                    </div>
                  </div>

                  {/* Mini Mock Table */}
                  <div className="border border-gray-300 rounded overflow-hidden text-[8px] mt-2">
                    <div className="grid grid-cols-4 bg-gray-100 font-bold p-1 text-center border-b border-gray-300">
                      <span>No Tiket</span>
                      <span>Unit RS</span>
                      <span>Target SLA</span>
                      <span>Status</span>
                    </div>
                    <div className="grid grid-cols-4 p-1 text-center border-b border-gray-200">
                      <span className="font-mono">TKT-202610-001</span>
                      <span>Rawat Inap A</span>
                      <span>15 Menit</span>
                      <span className="text-emerald-700 font-bold">Selesai</span>
                    </div>
                    <div className="grid grid-cols-4 p-1 text-center">
                      <span className="font-mono">TKT-202610-002</span>
                      <span>IGD Medika</span>
                      <span>10 Menit</span>
                      <span className="text-emerald-700 font-bold">Selesai</span>
                    </div>
                  </div>

                  {/* Mini Signature Preview */}
                  <div className="flex justify-end pt-2 text-[8px]">
                    <div className="text-right space-y-0.5">
                      <div className="text-gray-600">{new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</div>
                      <div className="font-bold text-gray-700">Tertanda</div>
                      <div className="font-black text-[9px] uppercase tracking-wider text-black">STAFF IT</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info Card: Integrasi Global */}
              <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-white/10 rounded-2xl p-4 space-y-2.5 text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-xs">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Alur Penyebaran Dinamis Data Rumah Sakit
                </span>
                <ul className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed list-disc list-inside">
                  <li>
                    <strong className="text-slate-900 dark:text-slate-200">Dashboard Navbar:</strong> Menampilkan logo dan nama rumah sakit di samping merek SIATI.
                  </li>
                  <li>
                    <strong className="text-slate-900 dark:text-slate-200">Kop Cetak & PDF:</strong> Otomatis dicantumkan saat klik tombol &apos;Cetak Laporan&apos; di Portal Manajemen.
                  </li>
                  <li>
                    <strong className="text-slate-900 dark:text-slate-200">Berkas Ekspor Excel / CSV:</strong> Identitas instansi, kode BPJS, dan Kemenkes disematkan pada baris ringkasan berkas.
                  </li>
                  <li>
                    <strong className="text-slate-900 dark:text-slate-200">Audit Keamanan:</strong> Setiap perubahan profil tercatat di riwayat log audit super admin.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 7: Diagnostik Jaringan Server & LAN */}
      {activeTab === "INTERNAL_NETWORK" && <InternalNetworkDiagnostic />}

      {/* Tab 8: Konektivitas API & Layanan Web Eksternal */}
      {activeTab === "EXTERNAL_CONNECTIVITY" && <ExternalApiConnectivity />}
        </motion.div>
      </AnimatePresence>
        </div>
      </div>

      {/* Modal: Tambah pengguna baru */}
      <AnimatePresence>
        {isAddUserOpen && (
          <motion.div
            variants={modalBackdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              variants={modalContentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/15 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl"
            >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
              <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                Daftarkan Pengguna Pegawai Baru
              </h4>
              <button
                onClick={() => {
                  setIsAddUserOpen(false);
                  setNewUserAvatarUrl("");
                  setNewFullNamePreview("");
                  setUserAvatarError(null);
                }}
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
                    setNewUserAvatarUrl("");
                    setNewFullNamePreview("");
                    setUserAvatarError(null);
                    setFeedbackMsg({ type: "success", text: res.message || "Pengguna berhasil didaftarkan." });
                    router.refresh();
                  } else {
                    setFeedbackMsg({ type: "error", text: res.message || "Gagal mendaftarkan pengguna." });
                  }
                });
              }}
              className="space-y-3.5 text-xs"
            >
              {/* Unggah Foto Profil Pegawai */}
              <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-white/10">
                <div className="relative shrink-0">
                  {newUserAvatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={newUserAvatarUrl}
                      alt="Pratinjau Foto Profil"
                      className="w-16 h-16 rounded-full object-cover border-2 border-sky-500 shadow-md ring-2 ring-sky-500/20"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 text-center shadow-inner">
                      {newFullNamePreview.trim() ? (
                        <span className="font-extrabold text-sm text-slate-700 dark:text-slate-200">
                          {getInitials(newFullNamePreview)}
                        </span>
                      ) : (
                        <Camera className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                      )}
                      <span className="text-[9px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                        {newUserAvatarUrl ? "Foto" : "Placeholder"}
                      </span>
                    </div>
                  )}

                  {isUploadingUserAvatar && (
                    <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center backdrop-blur-xs">
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      Foto Profil Pegawai
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">Opsional</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                    Format JPG, PNG, atau WebP. Jika dikosongkan, sistem otomatis menggunakan foto placeholder berinisial nama.
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    <label className="cursor-pointer py-1.5 px-3 rounded-lg bg-sky-600 hover:bg-sky-700 active:scale-95 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{newUserAvatarUrl ? "Ganti Foto" : "Pilih Foto"}</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/jpg"
                        className="hidden"
                        onChange={handleUserAvatarUpload}
                        disabled={isUploadingUserAvatar}
                      />
                    </label>

                    {newUserAvatarUrl && (
                      <button
                        type="button"
                        onClick={() => setNewUserAvatarUrl("")}
                        className="py-1.5 px-2.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40 text-xs font-semibold flex items-center gap-1 transition-colors"
                        title="Hapus foto dan gunakan placeholder"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Pakai Placeholder</span>
                      </button>
                    )}
                  </div>

                  {userAvatarError && (
                    <p className="text-[11px] text-rose-500 font-medium mt-1">
                      {userAvatarError}
                    </p>
                  )}
                </div>

                {/* Hidden input agar avatarUrl ikut terkirim dalam formData */}
                <input type="hidden" name="avatarUrl" value={newUserAvatarUrl} />
              </div>

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
                  value={newFullNamePreview}
                  onChange={(e) => setNewFullNamePreview(e.target.value)}
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
                    <option value={Role.IT_STAFF}>Staf TI (Helpdesk & Lapangan)</option>
                    <option value={Role.MANAGEMENT}>Manajemen</option>
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
                        {u.name} ({u.buildingZone})
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
                  onClick={() => {
                    setIsAddUserOpen(false);
                    setNewUserAvatarUrl("");
                    setNewFullNamePreview("");
                    setUserAvatarError(null);
                  }}
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
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

      {/* Modal: Tambah master unit */}
      <AnimatePresence>
        {isAddUnitOpen && (
          <motion.div
            variants={modalBackdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              variants={modalContentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/15 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl"
            >
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
                    router.refresh();
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
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

      {/* Modal: Tambah kategori kendala & SLA */}
      <AnimatePresence>
        {isAddCatOpen && (
          <motion.div
            variants={modalBackdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              variants={modalContentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/15 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl"
            >
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
                      router.refresh();
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Penampil Foto & Video Lampiran (Responsif Mobile / Tablet / PC) */}
      <MediaViewerModal media={activeMedia} onClose={() => setActiveMedia(null)} />

      {/* Modal Pratinjau & Cetak Dokumen Berita Acara & Laporan Perbaikan Layanan TI */}
      <TicketRepairReportModal
        ticket={reportDocTicket}
        hospitalProfile={hospitalProfile}
        onClose={() => setReportDocTicket(null)}
      />
    </div>
  );
}
