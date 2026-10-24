"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  TrendingUp,
  CheckCircle2,
  Clock,
  Zap,
  Star,
  AlertTriangle,
  Building2,
  Layers,
  FileSpreadsheet,
  Printer,
  Search,
  Filter,
  Award,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  X,
  Calendar,
  Timer,
  Check,
  BarChart3,
  Lightbulb,
  FileText,
  RotateCcw,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { TicketStatus, TicketUrgency } from "@prisma/client";
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

export interface ManagementTicketItem {
  id: string;
  ticketNumber: string;
  description: string;
  urgency: TicketUrgency;
  status: TicketStatus;
  submittedAt: Date | string;
  firstAssignedAt?: Date | string | null;
  workStartedAt?: Date | string | null;
  workResolvedAt?: Date | string | null;
  responseMinutes: number | null;
  repairMinutes: number | null;
  totalLeadMinutes: number | null;
  unit: {
    id: number;
    name: string;
    buildingZone: string;
  };
  category: {
    id: number;
    name: string;
    targetSlaMinutes: number;
  };
  reporter: {
    id: string;
    fullName: string;
    username: string;
  };
  assignedTechnician: {
    id?: string;
    fullName: string;
    username?: string;
  } | null;
  rating: {
    ratingScore: number;
    feedback?: string | null;
  } | null;
  attachments?: {
    id: string;
    fileType: "IMAGE" | "VIDEO";
    storedFilename: string;
    originalName: string;
  }[];
}

export interface ManagementUnitItem {
  id: number;
  name: string;
  buildingZone: string;
  _count?: {
    tickets: number;
    users?: number;
  };
}

export interface ManagementCategoryItem {
  id: number;
  name: string;
  description?: string | null;
  targetSlaMinutes: number;
  _count?: {
    tickets: number;
  };
}

export interface ManagementTechnicianItem {
  id: string;
  fullName: string;
  username: string;
  role: string;
  departmentUnit?: {
    name: string;
  } | null;
}

interface ManagementViewProps {
  tickets: ManagementTicketItem[];
  units: ManagementUnitItem[];
  categories: ManagementCategoryItem[];
  technicians: ManagementTechnicianItem[];
  currentUserName: string;
}

// Helper: Format Date object to YYYY-MM-DD
function formatYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Helper: Check if a date string/Date falls within [startDate, endDate] (Local Time Aware)
function isDateInRange(
  dateInput: Date | string,
  startStr: string,
  endStr: string
): boolean {
  if (!startStr && !endStr) return true;
  const targetDate = new Date(dateInput);
  if (isNaN(targetDate.getTime())) return false;

  if (startStr) {
    const [y, m, d] = startStr.split("-").map(Number);
    const start = new Date(y, m - 1, d, 0, 0, 0, 0);
    if (targetDate < start) return false;
  }
  if (endStr) {
    const [y, m, d] = endStr.split("-").map(Number);
    const end = new Date(y, m - 1, d, 23, 59, 59, 999);
    if (targetDate > end) return false;
  }
  return true;
}

// Preset Generator
function getPresetDates(preset: "today" | "week" | "month" | "all") {
  const now = new Date();
  if (preset === "today") {
    const todayStr = formatYMD(now);
    return { start: todayStr, end: todayStr };
  } else if (preset === "week") {
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return { start: formatYMD(weekAgo), end: formatYMD(now) };
  } else if (preset === "month") {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return { start: formatYMD(monthStart), end: formatYMD(now) };
  } else {
    return { start: "", end: "" };
  }
}

export default function ManagementView({
  tickets,
  units,
  categories,
  technicians,
  currentUserName,
}: ManagementViewProps) {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<
    "overview" | "technicians" | "tickets" | "recommendations"
  >("overview");

  // Expand-Collapse State untuk Sidebar Tablet & Laptop / PC
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("siati_mgmt_sidebar_collapsed");
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
        localStorage.setItem("siati_mgmt_sidebar_collapsed", String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // ========================================================
  // 1. RENTANG WAKTU PER TANGGAL UNTUK 6 KARTU KPI ATAS
  // ========================================================
  const [cardsStartDate, setCardsStartDate] = useState<string>("");
  const [cardsEndDate, setCardsEndDate] = useState<string>("");

  const handleCardsPreset = (preset: "today" | "week" | "month" | "all") => {
    const { start, end } = getPresetDates(preset);
    setCardsStartDate(start);
    setCardsEndDate(end);
  };

  // ========================================================
  // 2. RENTANG WAKTU PER TANGGAL UNTUK SETIAP MENU / TAB
  // ========================================================
  // Tab 1: Ikhtisar & Heatmap Ruangan
  const [tab1StartDate, setTab1StartDate] = useState<string>("");
  const [tab1EndDate, setTab1EndDate] = useState<string>("");
  const [unitPage, setUnitPage] = useState<number>(1);
  const unitsPerPage = 6;

  // Tab 2: Matriks Kinerja Staf TI
  const [tab2StartDate, setTab2StartDate] = useState<string>("");
  const [tab2EndDate, setTab2EndDate] = useState<string>("");
  const [techPage, setTechPage] = useState<number>(1);
  const techPerPage = 6;

  // Tab 3: Audit Rekapitulasi Tiket Detail
  const [tab3StartDate, setTab3StartDate] = useState<string>("");
  const [tab3EndDate, setTab3EndDate] = useState<string>("");
  const [unitFilter, setUnitFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [urgencyFilter, setUrgencyFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [ticketPage, setTicketPage] = useState<number>(1);
  const [ticketItemsPerPage, setTicketItemsPerPage] = useState<number>(10);

  // Tab 4: Rekomendasi Manajerial & Aset TI
  const [tab4StartDate, setTab4StartDate] = useState<string>("");
  const [tab4EndDate, setTab4EndDate] = useState<string>("");

  // Modal Detail Tiket
  const [selectedTicket, setSelectedTicket] =
    useState<ManagementTicketItem | null>(null);

  // Reset pagination saat filter di Tab 3 berubah
  useEffect(() => {
    setTicketPage(1);
  }, [
    tab3StartDate,
    tab3EndDate,
    unitFilter,
    categoryFilter,
    urgencyFilter,
    statusFilter,
    searchQuery,
    ticketItemsPerPage,
  ]);

  // Helper Urgency Label & Style
  const getUrgencyBadge = (urgency: TicketUrgency) => {
    switch (urgency) {
      case "EMERGENCY":
        return {
          label: "P1 - Kritis",
          badgeClass:
            "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border-rose-300 dark:border-rose-800",
        };
      case "HIGH":
        return {
          label: "P2 - Tinggi",
          badgeClass:
            "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-300 dark:border-amber-800",
        };
      case "MEDIUM":
        return {
          label: "P3 - Sedang",
          badgeClass:
            "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-300 dark:border-blue-800",
        };
      case "LOW":
        return {
          label: "P4 - Rendah",
          badgeClass:
            "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700",
        };
      default:
        return {
          label: urgency,
          badgeClass: "bg-slate-100 text-slate-800 dark:bg-slate-800",
        };
    }
  };

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case "RESOLVED":
      case "CLOSED":
        return {
          label: "Selesai",
          badgeClass:
            "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800",
        };
      case "IN_PROGRESS":
        return {
          label: "Dikerjakan",
          badgeClass:
            "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800",
        };
      case "PENDING_PARTS":
        return {
          label: "Menunggu Sparepart",
          badgeClass:
            "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-300 dark:border-amber-800",
        };
      case "ASSIGNED":
        return {
          label: "Ditugaskan",
          badgeClass:
            "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300 border-sky-300 dark:border-sky-800",
        };
      case "SUBMITTED":
        return {
          label: "Belum Diambil",
          badgeClass:
            "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-300 dark:border-purple-800",
        };
      default:
        return {
          label: status,
          badgeClass: "bg-slate-100 text-slate-800 dark:bg-slate-800",
        };
    }
  };

  // ========================================================
  // KALKULASI 6 KARTU KPI ATAS BERDASARKAN RENTANG TANGGAL KARTU
  // ========================================================
  const cardsTickets = useMemo(() => {
    return tickets.filter((t) =>
      isDateInRange(t.submittedAt, cardsStartDate, cardsEndDate)
    );
  }, [tickets, cardsStartDate, cardsEndDate]);

  const kpis = useMemo(() => {
    const total = cardsTickets.length;
    const resolved = cardsTickets.filter(
      (t) => t.status === "RESOLVED" || t.status === "CLOSED"
    );
    const inProgress = cardsTickets.filter(
      (t) =>
        t.status === "IN_PROGRESS" ||
        t.status === "ASSIGNED" ||
        t.status === "PENDING_PARTS"
    );
    const pendingParts = cardsTickets.filter(
      (t) => t.status === "PENDING_PARTS"
    );
    const emergencyP1 = cardsTickets.filter((t) => t.urgency === "EMERGENCY");

    // SLA Compliance: Tiket selesai yang waktu pengerjaannya <= target SLA kategori
    let compliantCount = 0;
    resolved.forEach((t) => {
      const targetSla = t.category.targetSlaMinutes || 30;
      if (t.repairMinutes !== null && t.repairMinutes <= targetSla) {
        compliantCount++;
      } else if (t.repairMinutes === null) {
        compliantCount++;
      }
    });
    const slaComplianceRate =
      resolved.length > 0
        ? Math.round((compliantCount / resolved.length) * 100)
        : 100;

    // MTTA (Mean Time to Acknowledge / Respon)
    const ticketsWithResponse = cardsTickets.filter(
      (t) => t.responseMinutes !== null
    );
    const totalResponseMinutes = ticketsWithResponse.reduce(
      (acc, t) => acc + (t.responseMinutes || 0),
      0
    );
    const mtta =
      ticketsWithResponse.length > 0
        ? (totalResponseMinutes / ticketsWithResponse.length).toFixed(1)
        : "0";

    // MTTR (Mean Time to Repair)
    const ticketsWithRepair = resolved.filter((t) => t.repairMinutes !== null);
    const totalRepairMinutes = ticketsWithRepair.reduce(
      (acc, t) => acc + (t.repairMinutes || 0),
      0
    );
    const mttr =
      ticketsWithRepair.length > 0
        ? (totalRepairMinutes / ticketsWithRepair.length).toFixed(1)
        : "0";

    // CSAT (Customer Satisfaction Score)
    const ratedTickets = cardsTickets.filter(
      (t) => t.rating && t.rating.ratingScore
    );
    const totalScore = ratedTickets.reduce(
      (acc, t) => acc + (t.rating?.ratingScore || 0),
      0
    );
    const csat =
      ratedTickets.length > 0
        ? (totalScore / ratedTickets.length).toFixed(1)
        : "5.0";

    return {
      total,
      resolvedCount: resolved.length,
      inProgressCount: inProgress.length,
      pendingPartsCount: pendingParts.length,
      emergencyP1Count: emergencyP1.length,
      slaComplianceRate,
      mtta,
      mttr,
      csat,
      ratedCount: ratedTickets.length,
    };
  }, [cardsTickets]);

  // ========================================================
  // DATA TAB 1: IKHTISAR & HEATMAP RUANGAN (DENGAN TANGGAL SENDIRI)
  // ========================================================
  const tab1Tickets = useMemo(() => {
    return tickets.filter((t) =>
      isDateInRange(t.submittedAt, tab1StartDate, tab1EndDate)
    );
  }, [tickets, tab1StartDate, tab1EndDate]);

  const categoryStats = useMemo(() => {
    return categories
      .map((cat) => {
        const matchingTickets = tab1Tickets.filter(
          (t) => t.category.name === cat.name
        );
        const resolved = matchingTickets.filter(
          (t) => t.status === "RESOLVED" || t.status === "CLOSED"
        );
        const totalRepair = resolved.reduce(
          (acc, t) => acc + (t.repairMinutes || 0),
          0
        );
        const avgRepair =
          resolved.length > 0
            ? Math.round(totalRepair / resolved.length)
            : cat.targetSlaMinutes;
        const percentage =
          tab1Tickets.length > 0
            ? Math.round((matchingTickets.length / tab1Tickets.length) * 100)
            : 0;

        return {
          id: cat.id,
          name: cat.name,
          targetSla: cat.targetSlaMinutes,
          count: matchingTickets.length,
          percentage,
          avgRepair,
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [categories, tab1Tickets]);

  const unitStats = useMemo(() => {
    const statsMap: Record<
      string,
      {
        name: string;
        buildingZone: string;
        total: number;
        emergency: number;
        resolved: number;
      }
    > = {};

    tab1Tickets.forEach((t) => {
      const uName = t.unit.name;
      if (!statsMap[uName]) {
        statsMap[uName] = {
          name: uName,
          buildingZone: t.unit.buildingZone,
          total: 0,
          emergency: 0,
          resolved: 0,
        };
      }
      statsMap[uName].total += 1;
      if (t.urgency === "EMERGENCY") statsMap[uName].emergency += 1;
      if (t.status === "RESOLVED" || t.status === "CLOSED")
        statsMap[uName].resolved += 1;
    });

    return Object.values(statsMap).sort((a, b) => b.total - a.total);
  }, [tab1Tickets]);

  // Pagination Heatmap Ruangan
  const totalUnitPages = Math.ceil(unitStats.length / unitsPerPage) || 1;
  const paginatedUnitStats = useMemo(() => {
    const startIdx = (unitPage - 1) * unitsPerPage;
    return unitStats.slice(startIdx, startIdx + unitsPerPage);
  }, [unitStats, unitPage]);

  // ========================================================
  // DATA TAB 2: MATRIKS KINERJA STAF TI (DENGAN TANGGAL SENDIRI)
  // ========================================================
  const tab2Tickets = useMemo(() => {
    return tickets.filter((t) =>
      isDateInRange(t.submittedAt, tab2StartDate, tab2EndDate)
    );
  }, [tickets, tab2StartDate, tab2EndDate]);

  const technicianStats = useMemo(() => {
    return technicians
      .map((tech) => {
        const assigned = tab2Tickets.filter(
          (t) => t.assignedTechnician?.fullName === tech.fullName
        );
        const resolved = assigned.filter(
          (t) => t.status === "RESOLVED" || t.status === "CLOSED"
        );

        // MTTA Staf
        const withResponse = assigned.filter((t) => t.responseMinutes !== null);
        const avgMtta =
          withResponse.length > 0
            ? (
                withResponse.reduce(
                  (acc, t) => acc + (t.responseMinutes || 0),
                  0
                ) / withResponse.length
              ).toFixed(1)
            : "-";

        // MTTR Staf
        const withRepair = resolved.filter((t) => t.repairMinutes !== null);
        const avgMttr =
          withRepair.length > 0
            ? (
                withRepair.reduce(
                  (acc, t) => acc + (t.repairMinutes || 0),
                  0
                ) / withRepair.length
              ).toFixed(1)
            : "-";

        // Kepatuhan SLA Staf
        let compliant = 0;
        resolved.forEach((t) => {
          if (
            t.repairMinutes !== null &&
            t.repairMinutes <= (t.category.targetSlaMinutes || 30)
          ) {
            compliant++;
          } else if (t.repairMinutes === null) {
            compliant++;
          }
        });
        const slaRate =
          resolved.length > 0
            ? Math.round((compliant / resolved.length) * 100)
            : 100;

        // Rating Staf
        const withRating = assigned.filter(
          (t) => t.rating && t.rating.ratingScore
        );
        const avgRating =
          withRating.length > 0
            ? (
                withRating.reduce(
                  (acc, t) => acc + (t.rating?.ratingScore || 0),
                  0
                ) / withRating.length
              ).toFixed(1)
            : "-";

        // Evaluasi Kinerja (SKP / Remunerasi Grade)
        let grade = "A";
        let gradeLabel = "Sangat Memuaskan";
        let gradeColor =
          "text-emerald-700 bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300";

        if (assigned.length === 0) {
          grade = "-";
          gradeLabel = "Siaga / Belum Ada Penugasan";
          gradeColor =
            "text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 border-slate-300";
        } else if (slaRate < 80) {
          grade = "C";
          gradeLabel = "Perlu Peningkatan";
          gradeColor =
            "text-rose-700 bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300";
        } else if (slaRate < 90) {
          grade = "B";
          gradeLabel = "Memuaskan";
          gradeColor =
            "text-blue-700 bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300";
        }

        return {
          id: tech.id,
          fullName: tech.fullName,
          username: tech.username,
          role: tech.role,
          assignedCount: assigned.length,
          resolvedCount: resolved.length,
          avgMtta,
          avgMttr,
          slaRate,
          avgRating,
          ratedCount: withRating.length,
          grade,
          gradeLabel,
          gradeColor,
        };
      })
      .sort((a, b) => b.resolvedCount - a.resolvedCount);
  }, [technicians, tab2Tickets]);

  // Pagination Staf TI
  const totalTechPages = Math.ceil(technicianStats.length / techPerPage) || 1;
  const paginatedTechnicians = useMemo(() => {
    const startIdx = (techPage - 1) * techPerPage;
    return technicianStats.slice(startIdx, startIdx + techPerPage);
  }, [technicianStats, techPage]);

  // ========================================================
  // DATA TAB 3: AUDIT REKAPITULASI TIKET DETAIL & PAGINATION
  // ========================================================
  const tab3FilteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      // 1. Filter Rentang Waktu Per Tanggal
      if (!isDateInRange(ticket.submittedAt, tab3StartDate, tab3EndDate)) {
        return false;
      }

      // 2. Filter Unit
      if (unitFilter !== "all" && ticket.unit.name !== unitFilter) {
        return false;
      }

      // 3. Filter Kategori
      if (categoryFilter !== "all" && ticket.category.name !== categoryFilter) {
        return false;
      }

      // 4. Filter Urgensi
      if (urgencyFilter !== "all" && ticket.urgency !== urgencyFilter) {
        return false;
      }

      // 5. Filter Status
      if (statusFilter !== "all" && ticket.status !== statusFilter) {
        return false;
      }

      // 6. Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchNumber = ticket.ticketNumber.toLowerCase().includes(query);
        const matchDesc = ticket.description.toLowerCase().includes(query);
        const matchUnit = ticket.unit.name.toLowerCase().includes(query);
        const matchCategory = ticket.category.name.toLowerCase().includes(query);
        const matchTech = ticket.assignedTechnician?.fullName
          .toLowerCase()
          .includes(query);
        const matchReporter = ticket.reporter.fullName
          .toLowerCase()
          .includes(query);
        if (
          !matchNumber &&
          !matchDesc &&
          !matchUnit &&
          !matchCategory &&
          !matchTech &&
          !matchReporter
        ) {
          return false;
        }
      }

      return true;
    });
  }, [
    tickets,
    tab3StartDate,
    tab3EndDate,
    unitFilter,
    categoryFilter,
    urgencyFilter,
    statusFilter,
    searchQuery,
  ]);

  // Pagination Tiket Tab 3
  const totalTicketPages =
    Math.ceil(tab3FilteredTickets.length / ticketItemsPerPage) || 1;
  const paginatedTickets = useMemo(() => {
    const startIdx = (ticketPage - 1) * ticketItemsPerPage;
    return tab3FilteredTickets.slice(startIdx, startIdx + ticketItemsPerPage);
  }, [tab3FilteredTickets, ticketPage, ticketItemsPerPage]);

  // ========================================================
  // DATA TAB 4: REKOMENDASI MANAJERIAL
  // ========================================================
  const tab4Tickets = useMemo(() => {
    return tickets.filter((t) =>
      isDateInRange(t.submittedAt, tab4StartDate, tab4EndDate)
    );
  }, [tickets, tab4StartDate, tab4EndDate]);

  // Fungsi Ekspor CSV (Menggunakan Data Tab 3 yang Sedang Difilter)
  const handleExportCSV = () => {
    const headers = [
      "No. Tiket",
      "Waktu Lapor",
      "Unit Kerja / Ruangan",
      "Zona Gedung",
      "Kategori Masalah",
      "Tingkat Urgensi",
      "Status Penanganan",
      "Pelapor Nakes",
      "Teknisi Penanggungjawab",
      "Waktu Respon (Menit)",
      "Waktu Perbaikan (Menit)",
      "Target SLA (Menit)",
      "Kepatuhan SLA",
      "Rating Bintang",
      "Ulasan Nakes",
      "Deskripsi Masalah",
    ];

    const rows = tab3FilteredTickets.map((t) => {
      const targetSla = t.category.targetSlaMinutes || 30;
      const isCompliant =
        t.status === "RESOLVED" || t.status === "CLOSED"
          ? (t.repairMinutes !== null ? t.repairMinutes <= targetSla : true)
            ? "Sesuai SLA"
            : "Melampaui SLA"
          : "Dalam Proses";

      return [
        `"${t.ticketNumber}"`,
        `"${new Date(t.submittedAt).toLocaleString("id-ID")}"`,
        `"${t.unit.name.replace(/"/g, '""')}"`,
        `"${t.unit.buildingZone.replace(/"/g, '""')}"`,
        `"${t.category.name.replace(/"/g, '""')}"`,
        `"${t.urgency}"`,
        `"${t.status}"`,
        `"${t.reporter.fullName.replace(/"/g, '""')}"`,
        `"${(t.assignedTechnician?.fullName || "-").replace(/"/g, '""')}"`,
        `"${t.responseMinutes !== null ? t.responseMinutes : "-"}"`,
        `"${t.repairMinutes !== null ? t.repairMinutes : "-"}"`,
        `"${targetSla}"`,
        `"${isCompliant}"`,
        `"${t.rating?.ratingScore || "-"}"`,
        `"${(t.rating?.feedback || "-").replace(/"/g, '""')}"`,
        `"${t.description.replace(/"/g, '""').replace(/\n/g, " ")}"`,
      ].join(",");
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const timestamp = new Date().toISOString().slice(0, 10);
    link.setAttribute(
      "download",
      `SIATI_Laporan_Eksekutif_${timestamp}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintReport = () => {
    window.print();
  };

  // Reusable Date Range Picker Component
  const renderDateFilterBar = (
    startDate: string,
    endDate: string,
    onStartChange: (val: string) => void,
    onEndChange: (val: string) => void,
    onPreset: (preset: "today" | "week" | "month" | "all") => void,
    label: string,
    filteredCount: number
  ) => {
    return (
      <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="font-bold text-slate-800 dark:text-slate-200">
            {label}:
          </span>
          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold text-[11px]">
            {filteredCount} Tiket
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Input Dari Tanggal */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px]">
              Dari:
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartChange(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            />
          </div>

          {/* Input Sampai Tanggal */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px]">
              Sampai:
            </span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndChange(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            />
          </div>

          {/* Quick Preset Pills */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPreset("today")}
              className="px-2 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-[11px] transition-all"
            >
              Hari Ini
            </button>
            <button
              onClick={() => onPreset("week")}
              className="px-2 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-[11px] transition-all"
            >
              7 Hari
            </button>
            <button
              onClick={() => onPreset("month")}
              className="px-2 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-[11px] transition-all"
            >
              Bulan Ini
            </button>
            <button
              onClick={() => onPreset("all")}
              className="px-2 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-[11px] transition-all flex items-center gap-1"
              title="Reset ke Semua Waktu"
            >
              <RotateCcw className="w-3 h-3 text-slate-400" />
              <span>Semua</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Reusable Pagination Component
  const renderPagination = (
    currentPage: number,
    totalPages: number,
    totalItems: number,
    itemsPerPage: number,
    onPageChange: (page: number) => void,
    onItemsPerPageChange?: (items: number) => void,
    itemsPerPageOptions: number[] = [10, 25, 50]
  ) => {
    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return (
      <div className="p-3 border-t border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-3">
          <span>
            Menampilkan <strong className="text-slate-900 dark:text-white">{startItem}</strong> -{" "}
            <strong className="text-slate-900 dark:text-white">{endItem}</strong> dari{" "}
            <strong className="text-slate-900 dark:text-white">{totalItems}</strong> data
          </span>

          {onItemsPerPageChange && (
            <div className="flex items-center gap-1.5 ml-2">
              <span className="text-[11px] text-slate-500">Tampilkan:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                className="px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:outline-none"
              >
                {itemsPerPageOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Buttons Navigasi Halaman */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-slate-700 dark:text-slate-300"
            title="Halaman Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Page Number Pills (Max 5 buttons) */}
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => {
              if (totalPages <= 5) return true;
              if (p === 1 || p === totalPages) return true;
              return Math.abs(p - currentPage) <= 1;
            })
            .map((p, idx, arr) => {
              const prev = arr[idx - 1];
              const showEllipsis = prev && p - prev > 1;

              return (
                <React.Fragment key={p}>
                  {showEllipsis && <span className="px-1 text-slate-400">...</span>}
                  <button
                    onClick={() => onPageChange(p)}
                    className={`min-w-[28px] h-7 px-2 rounded-lg font-bold text-xs transition-all ${
                      currentPage === p
                        ? "bg-amber-500 text-slate-950 shadow-sm"
                        : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {p}
                  </button>
                </React.Fragment>
              );
            })}

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-slate-700 dark:text-slate-300"
            title="Halaman Berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* ======================================================== */}
      {/* 1. KOP SURAT RESMI CETAK (HANYA MUNCUL DI CETAK/PDF) */}
      {/* ======================================================== */}
      <div className="hidden print:block print:mb-8 text-black border-b-2 border-black pb-4 text-center">
        <div className="text-xs font-bold tracking-widest uppercase">
          Pelayanan Kesehatan & Fasilitas Medis
        </div>
        <div className="text-base font-extrabold tracking-wider uppercase mt-1">
          Instalasi Teknologi Informasi Rumah Sakit
        </div>
        <div className="text-[11px] font-normal italic mt-0.5">
          Sistem Informasi Aduan & Ticketing Terpadu TI • Laporan Eksekutif SIATI
        </div>
        <div className="w-full h-0.5 bg-black mt-2"></div>
        <div className="text-sm font-bold uppercase mt-3">
          Rekapitulasi Kinerja Pelayanan & Tingkat Kepatuhan SLA Teknologi
          Informasi
        </div>
        <div className="text-xs text-gray-700">
          Tanggal Cetak:{" "}
          {new Date().toLocaleDateString("id-ID", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}{" "}
          • Pemeriksa: {currentUserName}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. TATA LETAK UTAMA DASHBOARD DENGAN EXPANDABLE SIDEBAR */}
      {/* ======================================================== */}
      <div className="flex flex-col md:flex-row items-start gap-4 lg:gap-6">
        {/* ======================================================== */}
        {/* SIDEBAR NAVIGASI (TABLET & LAPTOP/PC) EXPANDABLE/COLLAPSIBLE */}
        {/* ======================================================== */}
        <aside
          className={`hidden md:flex flex-col sticky top-20 shrink-0 transition-all duration-300 ease-in-out print:hidden ${
            isSidebarCollapsed ? "w-18 lg:w-20" : "w-64 lg:w-72"
          }`}
        >
          <div className="w-full p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm space-y-3">
            {/* Header Sidebar with Title & Collapse Toggle Button */}
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
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block truncate">
                      Navigasi Menu
                    </span>
                    <div className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5 truncate">
                      Portal Manajemen
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
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <button
                    type="button"
                    onClick={toggleSidebar}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Perluas Menu Navigasi"
                  >
                    <PanelLeftOpen className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Menu Items */}
            <nav className="space-y-1.5">
              {/* Menu 1: overview */}
              <button
                type="button"
                onClick={() => setActiveTab("overview")}
                title={
                  isSidebarCollapsed
                    ? `Ikhtisar & Heatmap (${tab1Tickets.length} Tiket)`
                    : undefined
                }
                className={`w-full rounded-xl transition-all flex items-center group ${
                  isSidebarCollapsed
                    ? "justify-center p-2.5"
                    : "justify-between p-2.5"
                } ${
                  activeTab === "overview"
                    ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 font-bold shadow-sm"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-medium"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors relative ${
                      activeTab === "overview"
                        ? "bg-amber-500 text-slate-950 font-bold shadow-sm"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:text-amber-500"
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    {isSidebarCollapsed && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-white dark:ring-slate-900" />
                    )}
                  </div>
                  {!isSidebarCollapsed && (
                    <div className="min-w-0 text-left">
                      <div className="text-xs truncate">Ikhtisar & Heatmap</div>
                      <div className="text-[10px] text-slate-400 truncate">
                        5 Pilar & Ruangan RS
                      </div>
                    </div>
                  )}
                </div>
                {!isSidebarCollapsed && (
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                      activeTab === "overview"
                        ? "bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {tab1Tickets.length}
                  </span>
                )}
              </button>

              {/* Menu 2: technicians */}
              <button
                type="button"
                onClick={() => setActiveTab("technicians")}
                title={
                  isSidebarCollapsed
                    ? `Kinerja Staf TI (${technicians.length} Staf)`
                    : undefined
                }
                className={`w-full rounded-xl transition-all flex items-center group ${
                  isSidebarCollapsed
                    ? "justify-center p-2.5"
                    : "justify-between p-2.5"
                } ${
                  activeTab === "technicians"
                    ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 font-bold shadow-sm"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-medium"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors relative ${
                      activeTab === "technicians"
                        ? "bg-amber-500 text-slate-950 font-bold shadow-sm"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:text-amber-500"
                    }`}
                  >
                    <Award className="w-4 h-4" />
                    {isSidebarCollapsed && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-white dark:ring-slate-900" />
                    )}
                  </div>
                  {!isSidebarCollapsed && (
                    <div className="min-w-0 text-left">
                      <div className="text-xs truncate">Kinerja Staf TI</div>
                      <div className="text-[10px] text-slate-400 truncate">
                        Scorecard SKP & TPP
                      </div>
                    </div>
                  )}
                </div>
                {!isSidebarCollapsed && (
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                      activeTab === "technicians"
                        ? "bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {technicians.length} Staf
                  </span>
                )}
              </button>

              {/* Menu 3: tickets */}
              <button
                type="button"
                onClick={() => setActiveTab("tickets")}
                title={
                  isSidebarCollapsed
                    ? `Audit Rekapitulasi (${tab3FilteredTickets.length} Tiket)`
                    : undefined
                }
                className={`w-full rounded-xl transition-all flex items-center group ${
                  isSidebarCollapsed
                    ? "justify-center p-2.5"
                    : "justify-between p-2.5"
                } ${
                  activeTab === "tickets"
                    ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 font-bold shadow-sm"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-medium"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors relative ${
                      activeTab === "tickets"
                        ? "bg-amber-500 text-slate-950 font-bold shadow-sm"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:text-amber-500"
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    {isSidebarCollapsed && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-white dark:ring-slate-900" />
                    )}
                  </div>
                  {!isSidebarCollapsed && (
                    <div className="min-w-0 text-left">
                      <div className="text-xs truncate">Audit Rekapitulasi</div>
                      <div className="text-[10px] text-slate-400 truncate">
                        Presisi menit & SLA
                      </div>
                    </div>
                  )}
                </div>
                {!isSidebarCollapsed && (
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                      activeTab === "tickets"
                        ? "bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {tab3FilteredTickets.length}
                  </span>
                )}
              </button>

              {/* Menu 4: recommendations */}
              <button
                type="button"
                onClick={() => setActiveTab("recommendations")}
                title={
                  isSidebarCollapsed
                    ? "Rekomendasi Aset TI (Strategis)"
                    : undefined
                }
                className={`w-full rounded-xl transition-all flex items-center group ${
                  isSidebarCollapsed
                    ? "justify-center p-2.5"
                    : "justify-between p-2.5"
                } ${
                  activeTab === "recommendations"
                    ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 font-bold shadow-sm"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-medium"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors relative ${
                      activeTab === "recommendations"
                        ? "bg-amber-500 text-slate-950 font-bold shadow-sm"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:text-amber-500"
                    }`}
                  >
                    <Lightbulb className="w-4 h-4" />
                    {isSidebarCollapsed && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-white dark:ring-slate-900" />
                    )}
                  </div>
                  {!isSidebarCollapsed && (
                    <div className="min-w-0 text-left">
                      <div className="text-xs truncate">Rekomendasi Aset TI</div>
                      <div className="text-[10px] text-slate-400 truncate">
                        Wawasan belanja & alat
                      </div>
                    </div>
                  )}
                </div>
                {!isSidebarCollapsed && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 shrink-0">
                    Strategis
                  </span>
                )}
              </button>
            </nav>

            {/* Sidebar quick actions & info */}
            {!isSidebarCollapsed ? (
              <div className="pt-3 border-t border-slate-100 dark:border-white/10 space-y-2">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                  <div className="flex items-center justify-between">
                    <span>Standar SLA:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      ≥ 90.0%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Target MTTA:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      &lt; 15 Menit
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="pt-2 border-t border-slate-100 dark:border-white/10 flex justify-center">
                <div
                  className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm"
                  title="Standar Mutu: SLA ≥ 90.0%, MTTA < 15 m"
                />
              </div>
            )}
          </div>
        </aside>

        {/* ======================================================== */}
        {/* AREA UTAMA DASHBOARD DI SEBELAH KANAN SIDEBAR */}
        {/* ======================================================== */}
        <div className="flex-1 min-w-0 w-full space-y-6">
          {/* ======================================================== */}
          {/* 2. EXECUTIVE HERO BANNER */}
          {/* ======================================================== */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-900 text-white p-5 sm:p-7 shadow-xl border border-white/10 print:hidden">
        {/* Decorative Ambient Circles */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 -mb-10 w-48 h-48 bg-sky-500/15 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                Portal Eksekutif Manajemen
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-white/10 text-slate-200">
                <Calendar className="w-3.5 h-3.5 text-sky-400" />
                {new Date().toLocaleDateString("id-ID", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-white">
              Pusat Kendali Kinerja & Analitik Mutu TI
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Monitoring real-time tingkat kepatuhan SLA, stopwatch perbaikan teknisi
              presisi menit, dan heatmap kendala fasilitas kesehatan di seluruh instalasi dan unit rumah sakit.
            </p>
          </div>

          {/* Quick Action Export Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap shrink-0">
            <button
              onClick={handlePrintReport}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white border border-white/20 text-xs sm:text-sm font-semibold transition-all backdrop-blur-sm shadow-sm"
              title="Cetak Laporan Resmi Format Surat Rumah Sakit"
            >
              <Printer className="w-4 h-4 text-sky-300" />
              <span>Cetak Laporan</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white text-xs sm:text-sm font-bold transition-all shadow-md shadow-emerald-900/30"
              title="Ekspor Seluruh Rekapitulasi Menit SLA ke File Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              <span>Export CSV / Excel</span>
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* RENTANG WAKTU PER TANGGAL KHUSUS 6 KARTU KPI ATAS */}
        {/* ======================================================== */}
        <div className="mt-5 pt-4 border-t border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <span className="text-xs font-bold text-white">
                Rentang Waktu 6 Indikator Kunci (KPI):
              </span>
              <span className="ml-2 text-[11px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-semibold border border-amber-400/30">
                {cardsTickets.length} Tiket Terhitung
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Input Dari Tanggal */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-300 text-[11px]">Dari:</span>
              <input
                type="date"
                value={cardsStartDate}
                onChange={(e) => setCardsStartDate(e.target.value)}
                className="px-2.5 py-1 rounded-lg border border-white/20 bg-slate-950/80 text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
            </div>

            {/* Input Sampai Tanggal */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-300 text-[11px]">Sampai:</span>
              <input
                type="date"
                value={cardsEndDate}
                onChange={(e) => setCardsEndDate(e.target.value)}
                className="px-2.5 py-1 rounded-lg border border-white/20 bg-slate-950/80 text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
            </div>

            {/* Preset Buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleCardsPreset("today")}
                className="px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-slate-200 text-[11px] font-medium transition-all"
              >
                Hari Ini
              </button>
              <button
                onClick={() => handleCardsPreset("week")}
                className="px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-slate-200 text-[11px] font-medium transition-all"
              >
                7 Hari
              </button>
              <button
                onClick={() => handleCardsPreset("month")}
                className="px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-slate-200 text-[11px] font-medium transition-all"
              >
                Bulan Ini
              </button>
              <button
                onClick={() => handleCardsPreset("all")}
                className="px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-slate-200 text-[11px] font-medium transition-all flex items-center gap-1"
                title="Reset Rentang Tanggal Kartu"
              >
                <RotateCcw className="w-3 h-3 text-amber-300" />
                <span>Semua</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. EXECUTIVE SCORECARD (6 KPI CARDS) */}
      {/* ======================================================== */}
      <motion.div
        variants={staggerContainerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4"
      >
        {/* Card 1: Total Tiket */}
        <motion.div
          variants={cardItemVariants}
          whileHover={interactiveCardHover}
          className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total Aduan
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              <AnimatedCounter value={kpis.total} />
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {kpis.resolvedCount} selesai
              </span>
              <span>•</span>
              <span className="font-semibold text-amber-600 dark:text-amber-400">
                {kpis.inProgressCount} proses
              </span>
            </div>
          </div>
        </motion.div>

        {/* Card 2: Kepatuhan SLA (%) */}
        <motion.div
          variants={cardItemVariants}
          whileHover={interactiveCardHover}
          className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Kepatuhan SLA
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
              <AnimatedCounter value={kpis.slaComplianceRate} decimals={1} suffix="%" />
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Target Standar: <span className="font-semibold">≥ 90.0%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  kpis.slaComplianceRate >= 90 ? "bg-emerald-500" : "bg-amber-500"
                }`}
                style={{ width: `${Math.min(kpis.slaComplianceRate, 100)}%` }}
              ></div>
            </div>
          </div>
        </motion.div>

        {/* Card 3: MTTA (Rata-rata Respon) */}
        <motion.div
          variants={cardItemVariants}
          whileHover={interactiveCardHover}
          className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              MTTA (Respon)
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-extrabold text-sky-600 dark:text-sky-400">
              <AnimatedCounter value={kpis.mtta} decimals={1} suffix=" mnt" />
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Tiket dibuat ➔ Teknisi respon
            </div>
          </div>
        </motion.div>

        {/* Card 4: MTTR (Rata-rata Perbaikan) */}
        <motion.div
          variants={cardItemVariants}
          whileHover={interactiveCardHover}
          className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              MTTR (Perbaikan)
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Timer className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
              <AnimatedCounter value={kpis.mttr} decimals={1} suffix=" mnt" />
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Stopwatch kerja teknisi
            </div>
          </div>
        </motion.div>

        {/* Card 5: Kepuasan Layanan (CSAT) */}
        <motion.div
          variants={cardItemVariants}
          whileHover={interactiveCardHover}
          className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Indeks Kepuasan
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/20 text-amber-500 flex items-center justify-center">
              <Star className="w-4 h-4 fill-amber-500" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-500">
              <AnimatedCounter value={kpis.csat} decimals={1} suffix=" / 5.0" />
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Dari {kpis.ratedCount} ulasan nakes
            </div>
          </div>
        </motion.div>

        {/* Card 6: Insiden Emergency (P1) */}
        <motion.div
          variants={cardItemVariants}
          whileHover={interactiveCardHover}
          className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Kritis (P1)
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-extrabold text-rose-600 dark:text-rose-400">
              <AnimatedCounter value={kpis.emergencyP1Count} />
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Pelayanan darurat (IGD/OK)
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* ======================================================== */}
      {/* 4. MOBILE HORIZONTAL TABS (Hanya muncul di Ponsel Layar Kecil < md) */}
      {/* ======================================================== */}
      <div className="md:hidden flex items-center gap-1 sm:gap-2 border-b border-slate-200 dark:border-white/10 overflow-x-auto pb-1 text-sm font-semibold print:hidden mb-2">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-t-xl transition-all whitespace-nowrap border-b-2 ${
            activeTab === "overview"
              ? "border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20"
              : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Ikhtisar & Heatmap Ruangan</span>
        </button>

        <button
          onClick={() => setActiveTab("technicians")}
          className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-t-xl transition-all whitespace-nowrap border-b-2 ${
            activeTab === "technicians"
              ? "border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20"
              : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Matriks Kinerja Staf TI ({technicians.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("tickets")}
          className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-t-xl transition-all whitespace-nowrap border-b-2 ${
            activeTab === "tickets"
              ? "border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20"
              : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Audit Rekapitulasi Tiket ({tab3FilteredTickets.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("recommendations")}
          className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-t-xl transition-all whitespace-nowrap border-b-2 ${
            activeTab === "recommendations"
              ? "border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20"
              : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <Lightbulb className="w-4 h-4" />
          <span>Rekomendasi Manajerial & Aset TI</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* 5. TAB 1: OVERVIEW & HEATMAP */}
      {/* ======================================================== */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          variants={tabContentVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {activeTab === "overview" && (
        <div className="space-y-4">
          {/* Filter Tanggal Tab 1 */}
          {renderDateFilterBar(
            tab1StartDate,
            tab1EndDate,
            setTab1StartDate,
            setTab1EndDate,
            (preset) => {
              const { start, end } = getPresetDates(preset);
              setTab1StartDate(start);
              setTab1EndDate(end);
              setUnitPage(1);
            },
            "Rentang Tanggal Ikhtisar & Heatmap",
            tab1Tickets.length
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Kolom Kiri: 5 Pilar Kategori Masalah (7 Kolom) */}
            <div className="lg:col-span-7 space-y-5">
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-amber-500" />
                      Distribusi 5 Pilar Masalah TI
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Proporsi insiden berdasarkan klasifikasi kategori resmi rumah sakit
                    </p>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                    {tab1Tickets.length} Tiket
                  </span>
                </div>

                <div className="space-y-3.5 pt-2">
                  {categoryStats.map((cat) => (
                    <div key={cat.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                          <span>{cat.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-normal">
                            Target SLA: {cat.targetSla} mnt
                          </span>
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {cat.count} Tiket ({cat.percentage}%)
                        </span>
                      </div>
                      {/* Progress Bar */}
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-600 transition-all duration-500"
                          style={{ width: `${cat.percentage}%` }}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                        <span>Rata-rata pengerjaan: {cat.avgRepair} menit</span>
                        <span
                          className={
                            cat.avgRepair <= cat.targetSla
                              ? "text-emerald-600 font-medium"
                              : "text-amber-600 font-medium"
                          }
                        >
                          {cat.avgRepair <= cat.targetSla
                            ? "✓ Memenuhi Target SLA"
                            : "⚠ Melebihi Target SLA"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Resolusi Tiket */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm space-y-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Status Penyelesaian Aduan
                </h3>
                <div className="grid grid-cols-2 xs:grid-cols-4 gap-3 pt-1">
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-center">
                    <div className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                      {
                        tab1Tickets.filter(
                          (t) => t.status === "RESOLVED" || t.status === "CLOSED"
                        ).length
                      }
                    </div>
                    <div className="text-xs text-emerald-800 dark:text-emerald-400 font-semibold mt-0.5">
                      Selesai
                    </div>
                    <div className="text-[10px] text-emerald-600/80 mt-1">
                      {tab1Tickets.length > 0
                        ? Math.round(
                            (tab1Tickets.filter(
                              (t) =>
                                t.status === "RESOLVED" || t.status === "CLOSED"
                            ).length /
                              tab1Tickets.length) *
                              100
                          )
                        : 0}
                      % total
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/40 text-center">
                    <div className="text-xl font-bold text-indigo-700 dark:text-indigo-300">
                      {
                        tab1Tickets.filter(
                          (t) =>
                            t.status === "IN_PROGRESS" || t.status === "ASSIGNED"
                        ).length
                      }
                    </div>
                    <div className="text-xs text-indigo-800 dark:text-indigo-400 font-semibold mt-0.5">
                      Dikerjakan
                    </div>
                    <div className="text-[10px] text-indigo-600/80 mt-1">
                      Teknisi aktif di lokasi
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 text-center">
                    <div className="text-xl font-bold text-amber-700 dark:text-amber-300">
                      {
                        tab1Tickets.filter((t) => t.status === "PENDING_PARTS")
                          .length
                      }
                    </div>
                    <div className="text-xs text-amber-800 dark:text-amber-400 font-semibold mt-0.5">
                      Sparepart
                    </div>
                    <div className="text-[10px] text-amber-600/80 mt-1">
                      Stopwatch dijeda
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/40 text-center">
                    <div className="text-xl font-bold text-purple-700 dark:text-purple-300">
                      {
                        tab1Tickets.filter((t) => t.status === "SUBMITTED")
                          .length
                      }
                    </div>
                    <div className="text-xs text-purple-800 dark:text-purple-400 font-semibold mt-0.5">
                      Antrean Baru
                    </div>
                    <div className="text-[10px] text-purple-600/80 mt-1">
                      Menunggu penugasan
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Kolom Kanan: Heatmap Kerusakan Unit & Bangsal (5 Kolom) DENGAN PAGINATION */}
            <div className="lg:col-span-5 space-y-5">
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-sky-500" />
                      Heatmap Beban Kendala Unit
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Ruangan & bangsal dengan frekuensi aduan tertinggi
                    </p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                    {unitStats.length} Ruangan
                  </span>
                </div>

                {unitStats.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 text-xs">
                    Tidak ada data tiket untuk rentang tanggal yang dipilih.
                  </div>
                ) : (
                  <>
                    <div className="space-y-2.5">
                      {paginatedUnitStats.map((u, idx) => (
                        <div
                          key={u.name}
                          className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 flex items-center justify-between gap-3 hover:border-slate-300 transition-colors"
                        >
                          <div className="min-w-0 flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center shrink-0">
                              {(unitPage - 1) * unitsPerPage + idx + 1}
                            </span>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {u.name}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                {u.buildingZone}
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                              {u.total}{" "}
                              <span className="text-[10px] font-normal text-slate-500">
                                tiket
                              </span>
                            </div>
                            {u.emergency > 0 && (
                              <span className="inline-block text-[10px] px-1.5 py-0.2 rounded font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300">
                                {u.emergency} Kritis
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pagination Heatmap Unit */}
                    {unitStats.length > unitsPerPage &&
                      renderPagination(
                        unitPage,
                        totalUnitPages,
                        unitStats.length,
                        unitsPerPage,
                        setUnitPage
                      )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. TAB 2: MATRIKS KINERJA STAF TI (DENGAN TANGGAL & PAGINATION) */}
      {/* ======================================================== */}
      {activeTab === "technicians" && (
        <div className="space-y-4">
          {/* Filter Tanggal Tab 2 */}
          {renderDateFilterBar(
            tab2StartDate,
            tab2EndDate,
            setTab2StartDate,
            setTab2EndDate,
            (preset) => {
              const { start, end } = getPresetDates(preset);
              setTab2StartDate(start);
              setTab2EndDate(end);
              setTechPage(1);
            },
            "Rentang Tanggal Penilaian Kinerja Staf TI",
            tab2Tickets.length
          )}

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  Scorecard Kinerja Staf & Teknisi TI
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Rujukan resmi penilaian Sasaran Kinerja Pegawai (SKP) & pembagian
                  Tambahan Penghasilan Pegawai (TPP) tenaga IT
                </p>
              </div>
              <div className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
                Standar Mutu: Respon &lt; 15 mnt • SLA &gt; 90%
              </div>
            </div>

            {/* Tabel Kinerja Teknisi */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-white/10 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-3.5">Petugas Staf TI</th>
                    <th className="py-3 px-3 text-center">Ditugaskan</th>
                    <th className="py-3 px-3 text-center">Selesai</th>
                    <th className="py-3 px-3 text-center">MTTA (Respon)</th>
                    <th className="py-3 px-3 text-center">MTTR (Kerja)</th>
                    <th className="py-3 px-3 text-center">Kepatuhan SLA</th>
                    <th className="py-3 px-3 text-center">Rating Kepuasan</th>
                    <th className="py-3 px-3 text-center">Grade Evaluasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {paginatedTechnicians.map((t) => (
                    <tr
                      key={t.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-3 px-3.5">
                        <div className="font-bold text-slate-900 dark:text-white text-sm">
                          {t.fullName}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <span>@{t.username}</span>
                          <span>•</span>
                          <span className="capitalize">
                            {t.role.replace("_", " ")}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center font-semibold text-slate-800 dark:text-slate-200">
                        {t.assignedCount}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-emerald-600 dark:text-emerald-400">
                        {t.resolvedCount}
                      </td>
                      <td className="py-3 px-3 text-center text-slate-700 dark:text-slate-300">
                        {t.avgMtta !== "-" ? `${t.avgMtta} mnt` : "-"}
                      </td>
                      <td className="py-3 px-3 text-center text-slate-700 dark:text-slate-300">
                        {t.avgMttr !== "-" ? `${t.avgMttr} mnt` : "-"}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full font-bold text-[11px] ${
                            t.slaRate >= 90
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                          }`}
                        >
                          {t.slaRate}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {t.avgRating !== "-" ? (
                          <span className="inline-flex items-center gap-1 font-bold text-amber-500">
                            <Star className="w-3.5 h-3.5 fill-amber-500" />
                            {t.avgRating}
                            <span className="text-[10px] text-slate-400 font-normal">
                              ({t.ratedCount})
                            </span>
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-lg border font-bold text-xs ${t.gradeColor}`}
                        >
                          {t.grade} • {t.gradeLabel}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Matriks Staf TI */}
            {technicianStats.length > techPerPage &&
              renderPagination(
                techPage,
                totalTechPages,
                technicianStats.length,
                techPerPage,
                setTechPage
              )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 7. TAB 3: AUDIT REKAPITULASI TIKET (DENGAN TANGGAL & PAGINATION) */}
      {/* ======================================================== */}
      {activeTab === "tickets" && (
        <div className="space-y-4">
          {/* Filter Tanggal Tab 3 */}
          {renderDateFilterBar(
            tab3StartDate,
            tab3EndDate,
            setTab3StartDate,
            setTab3EndDate,
            (preset) => {
              const { start, end } = getPresetDates(preset);
              setTab3StartDate(start);
              setTab3EndDate(end);
            },
            "Rentang Tanggal Audit Tiket",
            tab3FilteredTickets.length
          )}

          {/* Filter Bar Kriteria Tambahan Tiket */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Search Box */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari No. Tiket, Kendala, Ruangan, Teknisi, atau Nakes..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              {/* Dropdown Filters */}
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                {/* Filter Unit */}
                <select
                  value={unitFilter}
                  onChange={(e) => setUnitFilter(e.target.value)}
                  className="px-2.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  <option value="all">Semua Ruangan</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.name}>
                      {u.name}
                    </option>
                  ))}
                </select>

                {/* Filter Kategori */}
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-2.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  <option value="all">Semua Kategori</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>

                {/* Filter Urgensi */}
                <select
                  value={urgencyFilter}
                  onChange={(e) => setUrgencyFilter(e.target.value)}
                  className="px-2.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  <option value="all">Semua Urgensi</option>
                  <option value="EMERGENCY">P1 - Kritis</option>
                  <option value="HIGH">P2 - Tinggi</option>
                  <option value="MEDIUM">P3 - Sedang</option>
                  <option value="LOW">P4 - Rendah</option>
                </select>

                {/* Filter Status */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  <option value="all">Semua Status</option>
                  <option value="RESOLVED">Selesai</option>
                  <option value="IN_PROGRESS">Dikerjakan</option>
                  <option value="PENDING_PARTS">Menunggu Sparepart</option>
                  <option value="SUBMITTED">Belum Diambil</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tabel Tiket Audit dengan Pagination */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-white/10 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-3">No. Tiket & Tanggal</th>
                  <th className="py-3 px-3">Unit Ruangan</th>
                  <th className="py-3 px-3">Kategori & Urgensi</th>
                  <th className="py-3 px-3">Teknisi Staf</th>
                  <th className="py-3 px-2.5 text-center">Respon</th>
                  <th className="py-3 px-2.5 text-center">Kerja</th>
                  <th className="py-3 px-3 text-center">Status SLA</th>
                  <th className="py-3 px-3 text-center">Rating</th>
                  <th className="py-3 px-2 text-center">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {paginatedTickets.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="py-8 text-center text-slate-500 dark:text-slate-400"
                    >
                      Tidak ada tiket yang cocok dengan kriteria pencarian & rentang
                      tanggal.
                    </td>
                  </tr>
                ) : (
                  paginatedTickets.map((t) => {
                    const urgBadge = getUrgencyBadge(t.urgency);
                    const stBadge = getStatusBadge(t.status);
                    const targetSla = t.category.targetSlaMinutes || 30;
                    const isCompliant =
                      t.status === "RESOLVED" || t.status === "CLOSED"
                        ? t.repairMinutes !== null
                          ? t.repairMinutes <= targetSla
                          : true
                        : null;

                    return (
                      <tr
                        key={t.id}
                        onClick={() => setSelectedTicket(t)}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-3">
                          <div className="font-mono font-bold text-slate-900 dark:text-white">
                            {t.ticketNumber}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">
                            {new Date(t.submittedAt).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {t.unit.name}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {t.unit.buildingZone}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-medium text-slate-800 dark:text-slate-200">
                            {t.category.name}
                          </div>
                          <div className="mt-0.5">
                            <span
                              className={`inline-block text-[10px] px-1.5 py-0.2 rounded border font-semibold ${urgBadge.badgeClass}`}
                            >
                              {urgBadge.label}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-medium text-slate-900 dark:text-white">
                            {t.assignedTechnician?.fullName || (
                              <span className="italic text-slate-400">
                                Belum Ditugaskan
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Oleh: {t.reporter.fullName}
                          </div>
                        </td>
                        <td className="py-3 px-2.5 text-center font-mono">
                          {t.responseMinutes !== null ? (
                            <span className="text-slate-700 dark:text-slate-300 font-semibold">
                              {t.responseMinutes} m
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-2.5 text-center font-mono">
                          {t.repairMinutes !== null ? (
                            <span className="text-slate-700 dark:text-slate-300 font-semibold">
                              {t.repairMinutes} m
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {isCompliant !== null ? (
                            isCompliant ? (
                              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold">
                                <Check className="w-3 h-3" /> Sesuai SLA
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-semibold">
                                <AlertTriangle className="w-3 h-3" /> Over SLA
                              </span>
                            )
                          ) : (
                            <span
                              className={`inline-block text-[10px] px-2 py-0.5 rounded-full border font-semibold ${stBadge.badgeClass}`}
                            >
                              {stBadge.label}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {t.rating?.ratingScore ? (
                            <span className="inline-flex items-center gap-0.5 font-bold text-amber-500">
                              <Star className="w-3.5 h-3.5 fill-amber-500" />
                              {t.rating.ratingScore}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-center text-slate-400">
                          <ChevronRight className="w-4 h-4 inline" />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {/* Pagination Controls Tab 3 */}
            {tab3FilteredTickets.length > 0 &&
              renderPagination(
                ticketPage,
                totalTicketPages,
                tab3FilteredTickets.length,
                ticketItemsPerPage,
                setTicketPage,
                setTicketItemsPerPage,
                [10, 25, 50]
              )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 8. TAB 4: REKOMENDASI MANAJERIAL (DENGAN TANGGAL) */}
      {/* ======================================================== */}
      {activeTab === "recommendations" && (
        <div className="space-y-4">
          {/* Filter Tanggal Tab 4 */}
          {renderDateFilterBar(
            tab4StartDate,
            tab4EndDate,
            setTab4StartDate,
            setTab4EndDate,
            (preset) => {
              const { start, end } = getPresetDates(preset);
              setTab4StartDate(start);
              setTab4EndDate(end);
            },
            "Rentang Tanggal Evaluasi Rekomendasi Manajerial",
            tab4Tickets.length
          )}

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                <Lightbulb className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Rekomendasi Strategis & Pemeliharaan Aset TI
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Wawasan manajerial berbasis data statistik aduan untuk efisiensi
                  anggaran belanja rumah sakit
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Rekomendasi 1: Hardware & Peremajaan Aset */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-slate-800/40 space-y-2">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                  Peremajaan Perangkat Keras (Hardware & Printer)
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Unit <strong>Instalasi Gawat Darurat (IGD)</strong> dan{" "}
                  <strong>Farmasi Rawat Jalan</strong> memiliki tingkat insiden hardware
                  tertinggi (khususnya printer barcode label resep dan PC tindakan).
                  Disarankan pengadaan unit cadangan (spare backup) siap pasang untuk
                  mencegah antrean pasien darurat.
                </p>
                <div className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold pt-1">
                  Prioritas Tindakan: TINGGI • Estimasi Dampak: Menghilangkan downtime
                  antrean obat.
                </div>
              </div>

              {/* Rekomendasi 2: Infrastruktur Jaringan WiFi Medis */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-slate-800/40 space-y-2">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                  Stabilitas Jaringan Nirkabel (WiFi Medis Bangsal)
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Aduan jaringan dominan terjadi di area{" "}
                  <strong>Rawat Inap Bangsal Melati</strong> saat jam visit dokter.
                  Direkomendasikan penambahan 2 unit Access Point kelas enterprise
                  dengan dukungan PoE dan pemisahan SSID khusus perangkat medis
                  terenkripsi.
                </p>
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold pt-1">
                  Prioritas Tindakan: SEDANG • Estimasi Dampak: Kelancaran entri RME
                  visit spesialis.
                </div>
              </div>

              {/* Rekomendasi 3: Bridging SIMRS & BPJS V-Claim */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-slate-800/40 space-y-2">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                  Monitoring Integrasi SIMRS & BPJS Kesehatan
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Mayoritas tiket kategori <strong>SIMRS & RME</strong> terkait
                  kegagalan koneksi bridging web service BPJS saat jam puncak pendaftaran
                  pagi (08.00 - 10.30 WIB). Diusulkan pembuatan cron auto-retry queue
                  agar nakes tidak perlu input ulang data rekam medis saat server BPJS
                  mengalami lonjakan beban.
                </p>
                <div className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold pt-1">
                  Prioritas Tindakan: TINGGI • Estimasi Dampak: Efisiensi kerja loket
                  kasir & poli.
                </div>
              </div>

              {/* Rekomendasi 4: Kesiapan Personel & Shift Staf TI */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-slate-800/40 space-y-2">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                  <div className="w-2.5 h-2.5 rounded-full bg-purple-500"></div>
                  Keseimbangan Beban Kerja Staf TI
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Rata-rata kepatuhan SLA seluruh staf telah mencapai{" "}
                  <strong>{kpis.slaComplianceRate}%</strong> dengan rating kepuasan{" "}
                  <strong>{kpis.csat} / 5.0</strong>. Model Unified Workbench berhasil
                  memangkas MTTA respon awal hingga <strong>{kpis.mtta} menit</strong>.
                  Disarankan mempertahankan pola kerja kolaboratif ini untuk evaluasi
                  penilaian SKP pegawai.
                </p>
                <div className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold pt-1">
                  Prioritas Tindakan: TERJAGA • Estimasi Dampak: Motivasi tim TI &
                  kepuasan nakes.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
        </motion.div>
      </AnimatePresence>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 9. MODAL DETAIL AUDIT TIKET (DRILL DOWN) */}
      {/* ======================================================== */}
      <AnimatePresence>
        {selectedTicket && (
          <motion.div
            variants={modalBackdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
          >
            <motion.div
              variants={modalContentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                  {selectedTicket.ticketNumber}
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${
                    getUrgencyBadge(selectedTicket.urgency).badgeClass
                  }`}
                >
                  {getUrgencyBadge(selectedTicket.urgency).label}
                </span>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              {/* Unit & Kategori */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                <div>
                  <span className="text-slate-500 dark:text-slate-400">
                    Unit / Ruangan:
                  </span>
                  <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                    {selectedTicket.unit.name}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {selectedTicket.unit.buildingZone}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">
                    Kategori Masalah:
                  </span>
                  <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                    {selectedTicket.category.name}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Target SLA: {selectedTicket.category.targetSlaMinutes} Menit
                  </div>
                </div>
              </div>

              {/* Pelapor & Teknisi */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                <div>
                  <span className="text-slate-500 dark:text-slate-400">
                    Pelapor (Nakes):
                  </span>
                  <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                    {selectedTicket.reporter.fullName}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">
                    Teknisi Penanggungjawab:
                  </span>
                  <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                    {selectedTicket.assignedTechnician?.fullName ||
                      "Belum Ditugaskan"}
                  </div>
                </div>
              </div>

              {/* Stopwatch Waktu SLA Presisi */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 space-y-2">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  Presisi Waktu SLA:
                </span>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5">
                    <div className="text-slate-500 text-[10px]">Waktu Respon</div>
                    <div className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">
                      {selectedTicket.responseMinutes !== null
                        ? `${selectedTicket.responseMinutes} m`
                        : "-"}
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5">
                    <div className="text-slate-500 text-[10px]">
                      Waktu Perbaikan
                    </div>
                    <div className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">
                      {selectedTicket.repairMinutes !== null
                        ? `${selectedTicket.repairMinutes} m`
                        : "-"}
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5">
                    <div className="text-slate-500 text-[10px]">Total Siklus</div>
                    <div className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">
                      {selectedTicket.totalLeadMinutes !== null
                        ? `${selectedTicket.totalLeadMinutes} m`
                        : "-"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Deskripsi Masalah */}
              <div className="space-y-1">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  Deskripsi Kendala:
                </span>
                <p className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 leading-relaxed border border-slate-200 dark:border-white/5">
                  {selectedTicket.description}
                </p>
              </div>

              {/* Rating & Ulasan Nakes jika ada */}
              {selectedTicket.rating && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-800 dark:text-amber-300">
                      Ulasan & Rating Nakes:
                    </span>
                    <span className="flex items-center gap-0.5 font-bold text-amber-500">
                      <Star className="w-4 h-4 fill-amber-500" />
                      {selectedTicket.rating.ratingScore} / 5
                    </span>
                  </div>
                  {selectedTicket.rating.feedback && (
                    <p className="italic text-slate-600 dark:text-slate-300 pt-1 text-xs">
                      &quot;{selectedTicket.rating.feedback}&quot;
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/60 flex justify-end">
              <button
                onClick={() => setSelectedTicket(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all"
              >
                Tutup
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </div>
  );
}
