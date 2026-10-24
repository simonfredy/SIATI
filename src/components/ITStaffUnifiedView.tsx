"use client";

import React, { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TicketStatus, TicketUrgency, Role } from "@prisma/client";
import { updateTicketStatusAction } from "@/actions/tickets";
import {
  Clock,
  CheckCircle2,
  Play,
  Pause,
  AlertCircle,
  Wrench,
  Image as ImageIcon,
  Video as VideoIcon,
  Check,
  RefreshCw,
  MapPin,
  Tag,
  ShieldAlert,
  Search,
  UserCheck,
  Zap,
  LayoutDashboard,
  Hammer,
} from "lucide-react";
import { TicketItem } from "./ReporterView";
import { motion, AnimatePresence } from "motion/react";
import {
  staggerContainerVariants,
  cardItemVariants,
  modalBackdropVariants,
  modalContentVariants,
  interactiveCardHover,
} from "@/lib/motionVariants";
import MediaViewerModal, { MediaAttachmentItem } from "@/components/MediaViewerModal";

interface ITStaffUnifiedViewProps {
  tickets: TicketItem[];
  technicians?: { id: string; fullName: string }[];
  currentUserId: string;
  currentUserName: string;
  currentUserRole: Role;
}

export default function ITStaffUnifiedView({
  tickets,
  technicians,
  currentUserId,
  currentUserName,
  currentUserRole,
}: ITStaffUnifiedViewProps) {
  const router = useRouter();
  const [localTickets, setLocalTickets] = useState<TicketItem[]>(tickets);

  // Sinkronisasi data saat props tiket dari server berubah
  useEffect(() => {
    setLocalTickets(tickets);
  }, [tickets]);

  // Mode Navigasi Utama: "MY_WORK" (Pengerjaan Saya) vs "HELPDESK_QUEUE" (Meja Antrean Seluruh RS)
  const [mainView, setMainViewState] = useState<"MY_WORK" | "HELPDESK_QUEUE">("MY_WORK");
  const [myWorkSubTab, setMyWorkSubTabState] = useState<"ACTIVE" | "COMPLETED">("ACTIVE");

  // Pulihkan tab aktif dari localStorage agar tidak reset saat navigasi
  useEffect(() => {
    try {
      const savedMain = localStorage.getItem("siati_it_main_view");
      if (savedMain === "MY_WORK" || savedMain === "HELPDESK_QUEUE") {
        setMainViewState(savedMain);
      }
      const savedSub = localStorage.getItem("siati_it_sub_tab");
      if (savedSub === "ACTIVE" || savedSub === "COMPLETED") {
        setMyWorkSubTabState(savedSub);
      }
    } catch (_) {}
  }, []);

  const setMainView = (view: "MY_WORK" | "HELPDESK_QUEUE") => {
    setMainViewState(view);
    try {
      localStorage.setItem("siati_it_main_view", view);
    } catch (_) {}
  };

  const setMyWorkSubTab = (subTab: "ACTIVE" | "COMPLETED") => {
    setMyWorkSubTabState(subTab);
    try {
      localStorage.setItem("siati_it_sub_tab", subTab);
    } catch (_) {}
  };

  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterUrgency, setFilterUrgency] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "UNASSIGNED" | "EMERGENCY">("ALL");
  const [actionError, setActionError] = useState<string | null>(null);

  // Modal Selesaikan Tiket
  const [resolveModalTicket, setResolveModalTicket] = useState<TicketItem | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [activeMedia, setActiveMedia] = useState<MediaAttachmentItem | null>(null);

  // Filter Tiket untuk "Pengerjaan Saya"
  const myActiveTickets = localTickets.filter(
    (t) =>
      (t.status === TicketStatus.ASSIGNED ||
        t.status === TicketStatus.IN_PROGRESS ||
        t.status === TicketStatus.PENDING_PARTS) &&
      t.assignedTechnician?.fullName === currentUserName
  );

  const myCompletedTickets = localTickets.filter(
    (t) =>
      (t.status === TicketStatus.RESOLVED || t.status === TicketStatus.CLOSED) &&
      t.assignedTechnician?.fullName === currentUserName
  );

  // Antrean Baru belum di-assign
  const unassignedTickets = localTickets.filter(
    (t) => t.status === TicketStatus.SUBMITTED || (t.status === TicketStatus.ASSIGNED && !t.assignedTechnician)
  );

  // Metrik Ringkasan Helpdesk
  const totalTickets = localTickets.length;
  const emergencyCount = localTickets.filter(
    (t) =>
      t.urgency === TicketUrgency.EMERGENCY &&
      t.status !== TicketStatus.CLOSED &&
      t.status !== TicketStatus.RESOLVED
  ).length;

  const ticketsWithResponse = localTickets.filter((t) => t.responseMinutes !== null);
  const avgResponseMins = ticketsWithResponse.length
    ? Math.round(
        ticketsWithResponse.reduce((acc, cur) => acc + (cur.responseMinutes || 0), 0) /
          ticketsWithResponse.length
      )
    : 0;

  const ticketsWithRepair = localTickets.filter((t) => t.repairMinutes !== null);
  const avgRepairMins = ticketsWithRepair.length
    ? Math.round(
        ticketsWithRepair.reduce((acc, cur) => acc + (cur.repairMinutes || 0), 0) /
          ticketsWithRepair.length
      )
    : 0;

  // Filter tiket di meja antrean Helpdesk
  const filteredHelpdeskTickets = localTickets.filter((t) => {
    const matchSearch =
      t.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.unit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchUrgency = filterUrgency === "ALL" || t.urgency === filterUrgency;
    const matchStatus =
      filterStatus === "ALL" ||
      (filterStatus === "UNASSIGNED" && (t.status === TicketStatus.SUBMITTED || !t.assignedTechnician)) ||
      (filterStatus === "EMERGENCY" && t.urgency === TicketUrgency.EMERGENCY);
    return matchSearch && matchUrgency && matchStatus;
  });

  // Action: Ambil & Kerjakan Sendiri (1-Klik Self Assign)
  const handleTakeAndWorkMyself = (ticketId: string) => {
    setActionError(null);
    // Optimistic update lokal langsung
    setLocalTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              status: TicketStatus.ASSIGNED,
              assignedTechnician: { fullName: currentUserName },
            }
          : t
      )
    );

    setMainView("MY_WORK");
    setMyWorkSubTab("ACTIVE");

    startTransition(async () => {
      const res = await updateTicketStatusAction({
        ticketId,
        newStatus: TicketStatus.ASSIGNED,
        assignedTechnicianId: currentUserId,
        notes: `Tiket diambil langsung oleh ${currentUserName} untuk penanganan segera.`,
      });

      if (res.success) {
        router.refresh();
      } else {
        setActionError(res.message || "Gagal mengambil tiket.");
        router.refresh();
      }
    });
  };

  // Action: Perbarui Status (Mulai / Jeda / Selesai)
  const handleUpdateStatus = (
    ticketId: string,
    newStatus: TicketStatus,
    notes?: string
  ) => {
    setActionError(null);
    // Optimistic update lokal langsung
    setLocalTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t))
    );

    startTransition(async () => {
      const res = await updateTicketStatusAction({
        ticketId,
        newStatus,
        notes,
        assignedTechnicianId: currentUserId,
      });

      if (res.success) {
        setResolveModalTicket(null);
        setResolutionNotes("");
        router.refresh();
      } else {
        setActionError(res.message || "Gagal mengubah status pengerjaan.");
        router.refresh();
      }
    });
  };

  // Action: Ubah Urgensi (Tetap di Tab Antrean tanpa Terpental atau Reload Halaman!)
  const handleUpdateUrgency = (ticketId: string, newUrgency: TicketUrgency) => {
    setActionError(null);
    // 1. Optimistic update langsung di state lokal antrean
    setLocalTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, urgency: newUrgency } : t))
    );

    // 2. Kirim update ke server di latar belakang tanpa reload halaman
    startTransition(async () => {
      const res = await updateTicketStatusAction({
        ticketId,
        urgency: newUrgency,
        notes: `Urgensi tiket disesuaikan menjadi ${newUrgency} oleh ${currentUserName}`,
      });

      if (res.success) {
        router.refresh(); // Sinkronisasi cache Server Component tanpa me-reset tab!
      } else {
        setActionError(res.message || "Gagal mengubah tingkat urgensi.");
        router.refresh();
      }
    });
  };


  const getUrgencyBadgeColor = (urgency: TicketUrgency) => {
    switch (urgency) {
      case TicketUrgency.EMERGENCY:
        return "bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-500/40";
      case TicketUrgency.HIGH:
        return "bg-orange-50 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-500/40";
      case TicketUrgency.MEDIUM:
        return "bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-500/40";
      default:
        return "bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40";
    }
  };

  const getElapsedMinutes = (date: Date) => {
    const diffMs = Date.now() - new Date(date).getTime();
    return Math.max(1, Math.round(diffMs / (60 * 1000)));
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header Staf TI */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 text-[11px] xs:text-xs font-semibold">
            <Zap className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            Staf TI RSBM — Pusat Kendali & Pengerjaan
          </div>
          <h2 className="text-base xs:text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            Pusat Kendali & Workbench: {currentUserName}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Anda dapat memantau antrean rumah sakit sekaligus langsung mencatat perbaikan lapangan secara mandiri.
          </p>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="self-start sm:self-auto px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 border border-slate-200 dark:border-white/10 transition-colors shadow-sm active:scale-95"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Data
        </button>
      </div>

      {actionError && (
        <div className="p-4 bg-rose-50 dark:bg-rose-500/20 border border-rose-200 dark:border-rose-500/40 text-rose-700 dark:text-rose-300 text-xs font-medium rounded-xl flex items-center gap-2.5 shadow-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Switcher Mode Utama: Pengerjaan Saya vs Meja Antrean Helpdesk (Centered & Responsive across Fold, Tablet, and Desktop) */}
      <div className="w-full max-w-xl mx-auto grid grid-cols-2 gap-1.5 xs:gap-3 p-1.5 bg-slate-200/80 dark:bg-slate-800/80 rounded-2xl border border-slate-300 dark:border-white/10 shadow-inner">
        <button
          type="button"
          onClick={() => setMainView("MY_WORK")}
          className={`py-2.5 xs:py-3 px-2 xs:px-4 rounded-xl font-bold text-[11px] xs:text-xs sm:text-sm flex items-center justify-center gap-1.5 xs:gap-2 transition-all shadow-sm ${
            mainView === "MY_WORK"
              ? "bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 ring-2 ring-sky-500/20 shadow-md"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Hammer className="w-3.5 h-3.5 xs:w-4 xs:h-4 shrink-0" />
          <span className="truncate">Pengerjaan Saya</span>
          <span className={`px-1.5 xs:px-2 py-0.5 rounded-full text-[10px] xs:text-xs font-extrabold shrink-0 ${
            myActiveTickets.length > 0
              ? "bg-amber-500 text-slate-950"
              : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
          }`}>
            {myActiveTickets.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setMainView("HELPDESK_QUEUE")}
          className={`py-2.5 xs:py-3 px-2 xs:px-4 rounded-xl font-bold text-[11px] xs:text-xs sm:text-sm flex items-center justify-center gap-1.5 xs:gap-2 transition-all shadow-sm ${
            mainView === "HELPDESK_QUEUE"
              ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-500/20 shadow-md"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5 xs:w-4 xs:h-4 shrink-0" />
          <span className="truncate">Antrean & Urgensi</span>
          <span className={`px-1.5 xs:px-2 py-0.5 rounded-full text-[10px] xs:text-xs font-extrabold shrink-0 ${
            unassignedTickets.length > 0
              ? "bg-rose-600 text-white animate-pulse"
              : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
          }`}>
            {unassignedTickets.length}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAMPILAN 1: PENGERJAAN SAYA (WORKBENCH TEKNISI)                          */}
      {/* ========================================================================= */}
      {mainView === "MY_WORK" && (
        <div className="space-y-5">
          {/* Banner Peringatan Tiket Baru Masuk yang Belum Diambil */}
          {unassignedTickets.length > 0 && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-sky-500/10 border border-rose-500/30 dark:border-rose-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm animate-in fade-in duration-300">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/30">
                  <Zap className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{unassignedTickets.length} Tiket Baru Masuk Menunggu Penanganan</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-600 text-white font-extrabold animate-pulse">
                      Siap Diambil
                    </span>
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                    Ada aduan baru dari unit rumah sakit yang belum diambil oleh staf TI mana pun.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMainView("HELPDESK_QUEUE")}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 self-start sm:self-auto shrink-0"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Lihat Antrean & Ambil ({unassignedTickets.length})</span>
              </button>
            </div>
          )}

          {/* Sub Tab: Aktif vs Selesai */}
          <div className="flex border-b border-slate-200 dark:border-white/10 gap-2 pb-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setMyWorkSubTab("ACTIVE")}
              className={`px-3.5 xs:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                myWorkSubTab === "ACTIVE"
                  ? "bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
              }`}
            >
              Sedang Saya Kerjakan ({myActiveTickets.length})
            </button>
            <button
              onClick={() => setMyWorkSubTab("COMPLETED")}
              className={`px-3.5 xs:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                myWorkSubTab === "COMPLETED"
                  ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
              }`}
            >
              Riwayat Selesai ({myCompletedTickets.length})
            </button>
          </div>

          {/* List Tiket Pengerjaan Saya */}
          {myWorkSubTab === "ACTIVE" && (
            <div className="space-y-4">
              {myActiveTickets.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-8 sm:p-10 text-center shadow-sm space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                  <h4 className="text-base font-bold text-slate-800 dark:text-white">
                    Tidak Ada Tugas Aktif di Tangan Anda
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    Saat ini Anda tidak memiliki tiket yang sedang dikerjakan. Buka tab <strong>Antrean & Tingkat Urgensi</strong> untuk mengambil aduan yang baru masuk.
                  </p>
                  <button
                    onClick={() => setMainView("HELPDESK_QUEUE")}
                    className="inline-flex items-center gap-2 py-2.5 px-5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95"
                  >
                    <LayoutDashboard className="w-4 h-4" /> Buka Antrean Seluruh RS ({unassignedTickets.length} Menunggu)
                  </button>
                </div>
              ) : (
                myActiveTickets.map((ticket) => {
                  const urgencyColor = getUrgencyBadgeColor(ticket.urgency);
                  const elapsedMins = getElapsedMinutes(ticket.submittedAt);
                  const isOverdue = ticket.urgency === TicketUrgency.EMERGENCY && elapsedMins > 10;

                  return (
                    <motion.div
                      key={ticket.id}
                      variants={cardItemVariants}
                      whileHover={interactiveCardHover}
                      animate={ticket.urgency === TicketUrgency.EMERGENCY ? {
                        boxShadow: [
                          "0 0 0 0px rgba(244, 63, 94, 0)",
                          "0 0 0 4px rgba(244, 63, 94, 0.25)",
                          "0 0 0 0px rgba(244, 63, 94, 0)",
                        ],
                        transition: { repeat: Infinity, duration: 2.2, ease: "easeInOut" }
                      } : undefined}
                      className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 sm:p-5 lg:p-6 shadow-sm transition-all ${
                        isOverdue
                          ? "border-rose-400 dark:border-rose-500/70 shadow-rose-100 dark:shadow-rose-950/40"
                          : "border-slate-200 dark:border-white/10 hover:border-sky-400"
                      }`}
                    >
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 lg:items-start">
                        {/* Area Informasi Utama (Desktop: 8-kolom, Mobile/Tablet: Atas) */}
                        <div className="lg:col-span-8 space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-xs sm:text-base font-bold text-sky-600 dark:text-sky-400">
                                {ticket.ticketNumber}
                              </span>
                              <span className="text-slate-400">•</span>
                              <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm flex items-center gap-1">
                                <MapPin className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                                {ticket.unit.name}
                              </span>
                              <span className="text-xs text-slate-500 dark:text-slate-400">({ticket.unit.buildingZone})</span>
                            </div>

                            {/* Badge waktu berjalan (mobile & tablet) */}
                            <div className="lg:hidden inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-sky-300 border border-slate-200 dark:border-sky-400/20">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{elapsedMins}m Berjalan</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <Tag className="w-3 h-3 text-sky-500" />
                              {ticket.category.name}
                            </span>
                            <span className="text-slate-400">•</span>
                            <span className="text-slate-500 dark:text-slate-400">
                              Masuk: {new Date(ticket.submittedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                            </span>
                          </div>

                          <div className="bg-slate-50 dark:bg-slate-950/60 p-3.5 sm:p-4 rounded-xl border border-slate-200/60 dark:border-white/5">
                            <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-normal">
                              {ticket.description}
                            </p>
                          </div>

                          {ticket.attachments && ticket.attachments.length > 0 && (
                            <div className="space-y-1.5">
                              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">
                                Bukti Dari Nakes ({ticket.attachments.length}):
                              </span>
                              <div className="flex flex-wrap gap-2">
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
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all active:scale-95 shadow-sm cursor-pointer ${
                                      att.fileType === "IMAGE"
                                        ? "bg-sky-50 hover:bg-sky-100 dark:bg-sky-500/10 dark:hover:bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-500/30"
                                        : "bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30"
                                    }`}
                                    title="Klik untuk membuka pratinjau media di layar ini"
                                  >
                                    {att.fileType === "IMAGE" ? (
                                      <ImageIcon className="w-3.5 h-3.5 text-sky-500" />
                                    ) : (
                                      <VideoIcon className="w-3.5 h-3.5 text-amber-500" />
                                    )}
                                    <span>Lihat {att.fileType === "IMAGE" ? "Foto Bukti" : "Video Bukti"}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Panel Kontrol & Aksi (Desktop: 4-kolom, Mobile/Tablet: Bawah) */}
                        <div className="lg:col-span-4 bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200/70 dark:border-white/10 space-y-3.5">
                          {/* Desktop Stopwatch Header */}
                          <div className="hidden lg:flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Stopwatch Pengerjaan</span>
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-white dark:bg-slate-900 text-slate-800 dark:text-sky-300 border border-slate-200 dark:border-sky-400/20 shadow-sm">
                              <Clock className="w-3.5 h-3.5 text-sky-500" />
                              <span>{elapsedMins} Menit</span>
                            </div>
                          </div>

                          {/* Urgensi Selector */}
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                              Tingkat Urgensi:
                            </label>
                            <select
                              disabled={isPending}
                              value={ticket.urgency}
                              onChange={(e) => handleUpdateUrgency(ticket.id, e.target.value as TicketUrgency)}
                              className={`w-full text-xs font-bold px-3 py-2 rounded-xl border focus:ring-2 focus:ring-sky-500 ${urgencyColor}`}
                              title="Tentukan / Ubah Urgensi"
                            >
                              <option value="EMERGENCY">🔴 P1 - Darurat</option>
                              <option value="HIGH">🟠 P2 - Tinggi</option>
                              <option value="MEDIUM">🟡 P3 - Sedang</option>
                              <option value="LOW">🟢 P4 - Rendah</option>
                            </select>
                          </div>

                          {/* Status & Kontrol Lapangan */}
                          <div className="space-y-2 pt-1 border-t border-slate-200/60 dark:border-white/5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-500 dark:text-slate-400">Status:</span>
                              <span className="font-bold text-slate-800 dark:text-white px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10">
                                {ticket.status}
                              </span>
                            </div>

                            <div className="flex flex-col gap-2 pt-1">
                              {ticket.status === TicketStatus.ASSIGNED && (
                                <button
                                  disabled={isPending}
                                  onClick={() => handleUpdateStatus(ticket.id, TicketStatus.IN_PROGRESS, "Mulai perbaikan fisik di lokasi.")}
                                  className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-60"
                                >
                                  <Play className="w-4 h-4 fill-current" />
                                  Mulai Kerjakan di Lokasi
                                </button>
                              )}

                              {ticket.status === TicketStatus.IN_PROGRESS && (
                                <div className="grid grid-cols-2 gap-2">
                                  <button
                                    disabled={isPending}
                                    onClick={() => handleUpdateStatus(ticket.id, TicketStatus.PENDING_PARTS, "Menunggu ketersediaan sparepart.")}
                                    className="py-2.5 px-2 rounded-xl bg-purple-50 dark:bg-purple-600/20 hover:bg-purple-100 text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center justify-center gap-1.5 border border-purple-200 dark:border-purple-500/30"
                                    title="Jeda stopwatch jika menunggu suku cadang"
                                  >
                                    <Pause className="w-3.5 h-3.5" />
                                    Tunggu Part
                                  </button>

                                  <button
                                    disabled={isPending}
                                    onClick={() => setResolveModalTicket(ticket)}
                                    className="py-2.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95 disabled:opacity-60"
                                  >
                                    <Check className="w-4 h-4" />
                                    Selesai
                                  </button>
                                </div>
                              )}

                              {ticket.status === TicketStatus.PENDING_PARTS && (
                                <button
                                  disabled={isPending}
                                  onClick={() => handleUpdateStatus(ticket.id, TicketStatus.IN_PROGRESS, "Part tersedia, lanjut pengerjaan.")}
                                  className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md"
                                >
                                  <Play className="w-4 h-4 fill-current" />
                                  Lanjutkan Pengerjaan
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          )}

          {/* List Tiket Selesai */}
          {myWorkSubTab === "COMPLETED" && (
            <div className="space-y-3">
              {myCompletedTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sky-600">{ticket.ticketNumber}</span>
                      <span className="font-semibold text-slate-800 dark:text-white">{ticket.unit.name}</span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 line-clamp-1">{ticket.description}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-500/30">
                      Selesai dalam {ticket.repairMinutes || 0} Menit
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAMPILAN 2: MEJA ANTREAN & MONITORING RS (HELPDESK COMMAND CENTER)       */}
      {/* ========================================================================= */}
      {mainView === "HELPDESK_QUEUE" && (
        <div className="space-y-5">
          {/* Baris Kartu Metrik Waktu SLA - Responsive across Fold, Tablet, and Desktop */}
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm transition-colors flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Total Tiket Masuk</span>
                <span className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5 block">{totalTickets}</span>
                <span className="text-[11px] text-slate-400">Semua Unit RSBM</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0">
                <LayoutDashboard className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-500/30 rounded-2xl p-4 shadow-sm transition-colors flex items-center justify-between">
              <div>
                <span className="text-xs text-rose-600 dark:text-rose-300 font-medium block">Tiket Kritis (P1) Aktif</span>
                <span className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-0.5 block">{emergencyCount}</span>
                <span className="text-[11px] text-rose-500/80">Wajib Direspon Segera</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-500/30 rounded-2xl p-4 shadow-sm transition-colors flex items-center justify-between">
              <div>
                <span className="text-xs text-sky-600 dark:text-sky-300 font-medium block">Rata-rata Respon (TTR)</span>
                <span className="text-2xl font-bold text-sky-600 dark:text-sky-400 mt-0.5 block">
                  {avgResponseMins} <span className="text-xs font-normal text-slate-500 dark:text-slate-300">Menit</span>
                </span>
                <span className="text-[11px] text-slate-400">Target: &lt; 5 Menit</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl p-4 shadow-sm transition-colors flex items-center justify-between">
              <div>
                <span className="text-xs text-emerald-600 dark:text-emerald-300 font-medium block">Rata-rata Selesai</span>
                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                  {avgRepairMins} <span className="text-xs font-normal text-slate-500 dark:text-slate-300">Menit</span>
                </span>
                <span className="text-[11px] text-slate-400">Durasi Pengerjaan Bersih</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Filter, Pencarian & Quick Chips (Responsive across Fold, Tablet, and PC) */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm transition-colors space-y-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari no. tiket, ruangan, atau gejala.."
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap font-medium hidden xs:inline">Filter Urgensi:</span>
                <select
                  value={filterUrgency}
                  onChange={(e) => setFilterUrgency(e.target.value)}
                  className="w-full sm:w-auto px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="ALL">Semua Urgensi</option>
                  <option value="EMERGENCY">🔴 P1 - Darurat</option>
                  <option value="HIGH">🟠 P2 - Tinggi</option>
                  <option value="MEDIUM">🟡 P3 - Sedang</option>
                  <option value="LOW">🟢 P4 - Rendah</option>
                </select>
              </div>
            </div>

            {/* Quick Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pt-1 no-scrollbar text-xs">
              <span className="text-slate-400 text-[11px] font-medium hidden sm:inline">Status:</span>
              <button
                type="button"
                onClick={() => setFilterStatus("ALL")}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs whitespace-nowrap transition-all ${
                  filterStatus === "ALL"
                    ? "bg-sky-600 text-white shadow-sm"
                    : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                }`}
              >
                Semua ({tickets.length})
              </button>

              <button
                type="button"
                onClick={() => setFilterStatus("UNASSIGNED")}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  filterStatus === "UNASSIGNED"
                    ? "bg-rose-600 text-white shadow-sm"
                    : "bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/20"
                }`}
              >
                <span>Belum Diambil</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-200 dark:bg-rose-800 font-extrabold text-rose-900 dark:text-white">
                  {unassignedTickets.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFilterStatus("EMERGENCY")}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  filterStatus === "EMERGENCY"
                    ? "bg-amber-600 text-white shadow-sm"
                    : "bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/20"
                }`}
              >
                <span>🔴 Kritis P1 ({emergencyCount})</span>
              </button>
            </div>
          </div>

          {/* List Seluruh Tiket di Meja Antrean (Command Center Layout) */}
          <div className="space-y-4">
            {filteredHelpdeskTickets.map((ticket) => {
              const urgencyColor = getUrgencyBadgeColor(ticket.urgency);
              const isUnassigned = ticket.status === TicketStatus.SUBMITTED || !ticket.assignedTechnician;

              return (
                <motion.div
                  key={ticket.id}
                  variants={cardItemVariants}
                  whileHover={interactiveCardHover}
                  animate={ticket.urgency === TicketUrgency.EMERGENCY ? {
                    boxShadow: [
                      "0 0 0 0px rgba(244, 63, 94, 0)",
                      "0 0 0 4px rgba(244, 63, 94, 0.25)",
                      "0 0 0 0px rgba(244, 63, 94, 0)",
                    ],
                    transition: { repeat: Infinity, duration: 2.2, ease: "easeInOut" }
                  } : undefined}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 sm:p-5 lg:p-6 shadow-sm transition-colors space-y-4"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 lg:items-start">
                    {/* Area Detail Tiket (Desktop: 8-kolom, Mobile/Tablet: Atas) */}
                    <div className="lg:col-span-8 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs sm:text-base font-bold text-sky-600 dark:text-sky-400">
                            {ticket.ticketNumber}
                          </span>
                          <span className="text-slate-400">•</span>
                          <span className="text-xs sm:text-sm text-slate-900 dark:text-white font-bold flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-sky-500" />
                            {ticket.unit.name} ({ticket.unit.buildingZone})
                          </span>
                        </div>

                        {/* Status badge pada mobile & tablet */}
                        <span className="lg:hidden text-xs px-2.5 py-1 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10">
                          {ticket.status}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-0.5 rounded-md font-semibold flex items-center gap-1">
                          <Tag className="w-3 h-3 text-sky-500" />
                          {ticket.category.name}
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                          Target SLA: {ticket.category.targetSlaMinutes} Menit
                        </span>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-950/60 p-3.5 sm:p-4 rounded-xl border border-slate-200/60 dark:border-white/5">
                        <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-normal">
                          {ticket.description}
                        </p>
                      </div>

                      {ticket.attachments && ticket.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-0.5">
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
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all active:scale-95 shadow-sm cursor-pointer ${
                                att.fileType === "IMAGE"
                                  ? "bg-sky-50 hover:bg-sky-100 dark:bg-sky-500/10 dark:hover:bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-500/30"
                                  : "bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30"
                              }`}
                              title="Klik untuk membuka pratinjau media di layar ini"
                            >
                              {att.fileType === "IMAGE" ? (
                                <ImageIcon className="w-3.5 h-3.5 text-sky-500" />
                              ) : (
                                <VideoIcon className="w-3.5 h-3.5 text-amber-500" />
                              )}
                              <span>Lihat {att.fileType === "IMAGE" ? "Foto Bukti" : "Video Bukti"}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Info waktu masuk dan teknisi penangan */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 pt-1">
                        <span>
                          Masuk: {new Date(ticket.submittedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                        </span>
                        {ticket.assignedTechnician ? (
                          <>
                            <span className="text-slate-400">•</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                              <UserCheck className="w-3.5 h-3.5 text-sky-500" />
                              Teknisi: <strong className="text-sky-700 dark:text-sky-300 underline decoration-sky-400">{ticket.assignedTechnician.fullName}</strong>
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="text-slate-400">•</span>
                            <span className="text-amber-600 dark:text-amber-400 font-medium">Belum ada teknisi</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Panel Aksi & Dispatch Helpdesk (Desktop: 4-kolom, Mobile/Tablet: Bawah) */}
                    <div className="lg:col-span-4 bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200/70 dark:border-white/10 space-y-3">
                      {/* Desktop Status Header */}
                      <div className="hidden lg:flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Status Aduan</span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 shadow-sm">
                          {ticket.status}
                        </span>
                      </div>

                      {/* Urgensi Selector */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                          Tingkat Urgensi:
                        </label>
                        <select
                          disabled={isPending}
                          value={ticket.urgency}
                          onChange={(e) => handleUpdateUrgency(ticket.id, e.target.value as TicketUrgency)}
                          className={`w-full text-xs font-bold px-3 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-sky-500 ${urgencyColor}`}
                          title="Tentukan / Ubah Urgensi"
                        >
                          <option value="EMERGENCY">🔴 P1 - Darurat</option>
                          <option value="HIGH">🟠 P2 - Tinggi</option>
                          <option value="MEDIUM">🟡 P3 - Sedang</option>
                          <option value="LOW">🟢 P4 - Rendah</option>
                        </select>
                      </div>

                      {/* Aksi Penanganan Tiket (Mandiri / Status Penangan) */}
                      {isUnassigned ? (
                        <div className="pt-1">
                          <button
                            disabled={isPending}
                            onClick={() => handleTakeAndWorkMyself(ticket.id)}
                            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 active:scale-[0.99] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-sky-600/25 transition-all disabled:opacity-60"
                            title="Ambil tiket ini untuk Anda tangani segera"
                          >
                            <Zap className="w-4 h-4 fill-current" />
                            Ambil & Tangani Tiket Ini
                          </button>
                        </div>
                      ) : ticket.assignedTechnician?.fullName === currentUserName ? (
                        <div className="pt-1 p-3 rounded-xl bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/30 text-sky-800 dark:text-sky-300 text-xs flex items-center justify-between gap-2">
                          <span className="font-bold flex items-center gap-1.5">
                            <UserCheck className="w-4 h-4 text-sky-600 shrink-0" />
                            Sedang Anda Tangani
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setMainView("MY_WORK");
                              setMyWorkSubTab("ACTIVE");
                            }}
                            className="text-[11px] underline font-bold hover:text-sky-900 dark:hover:text-sky-100 shrink-0"
                          >
                            Buka di Tugas Saya &rarr;
                          </button>
                        </div>
                      ) : (
                        <div className="pt-1 p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 text-xs flex items-center gap-2.5">
                          <UserCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                          <div className="min-w-0">
                            <span className="text-[10px] text-slate-400 block font-medium">Sedang Ditangani Oleh:</span>
                            <span className="font-bold text-slate-900 dark:text-white truncate block">
                              {ticket.assignedTechnician?.fullName || "Teknisi Lain"}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Selesai & Input Catatan Tindakan */}
      <AnimatePresence>
        {resolveModalTicket && (
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
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  Konfirmasi Penyelesaian Masalah
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Tiket {resolveModalTicket.ticketNumber} ({resolveModalTicket.unit.name}). Stopwatch perbaikan akan dihentikan dan total menit dihitung otomatis.
                </p>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Catatan Tindakan Teknis yang Dilakukan:
                </label>
                <textarea
                  rows={3}
                  required
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Contoh: Mengganti roller penarik kertas printer, bersihkan head nozzle, uji cetak resep dan antrean berhasil normal."
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setResolveModalTicket(null)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isPending || !resolutionNotes.trim()}
                  onClick={() => handleUpdateStatus(resolveModalTicket.id, TicketStatus.RESOLVED, resolutionNotes)}
                  className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs disabled:opacity-50 transition-colors shadow-sm"
                >
                  {isPending ? "Memproses..." : "Tandai Selesai & Tutup"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Penampil Foto & Video Responsif (Mobile / Tablet / PC) */}
      <MediaViewerModal media={activeMedia} onClose={() => setActiveMedia(null)} />
    </div>
  );
}
