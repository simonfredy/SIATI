"use client";

import React, { useState, useTransition } from "react";
import { TicketStatus, TicketUrgency } from "@prisma/client";
import { updateTicketStatusAction } from "@/actions/tickets";
import {
  Clock,
  ShieldAlert,
  Search,
  Image as ImageIcon,
  Video as VideoIcon,
  UserCheck,
  MapPin,
  Tag,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { TicketItem } from "./ReporterView";

interface AdminHelpdeskViewProps {
  tickets: TicketItem[];
  technicians: { id: string; fullName: string }[];
  adminName: string;
}

export default function AdminHelpdeskView({
  tickets,
  technicians,
  adminName,
}: AdminHelpdeskViewProps) {
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterUrgency, setFilterUrgency] = useState<string>("ALL");
  const [actionError, setActionError] = useState<string | null>(null);

  // Metrik Kinerja SLA
  const totalTickets = tickets.length;
  const emergencyCount = tickets.filter(
    (t) =>
      t.urgency === TicketUrgency.EMERGENCY &&
      t.status !== TicketStatus.CLOSED &&
      t.status !== TicketStatus.RESOLVED
  ).length;

  // Rata-rata menit respon
  const ticketsWithResponse = tickets.filter((t) => t.responseMinutes !== null);
  const avgResponseMins = ticketsWithResponse.length
    ? Math.round(
        ticketsWithResponse.reduce((acc, cur) => acc + (cur.responseMinutes || 0), 0) /
          ticketsWithResponse.length
      )
    : 0;

  // Rata-rata menit perbaikan bersih
  const ticketsWithRepair = tickets.filter((t) => t.repairMinutes !== null);
  const avgRepairMins = ticketsWithRepair.length
    ? Math.round(
        ticketsWithRepair.reduce((acc, cur) => acc + (cur.repairMinutes || 0), 0) /
          ticketsWithRepair.length
      )
    : 0;

  const handleAssignTechnician = (ticketId: string, technicianId: string) => {
    if (!technicianId) return;
    setActionError(null);
    startTransition(async () => {
      const res = await updateTicketStatusAction({
        ticketId,
        newStatus: TicketStatus.ASSIGNED,
        assignedTechnicianId: technicianId,
        notes: "Penugasan langsung dari meja Dispatcher Helpdesk.",
      });
      if (res.success) {
        window.location.reload();
      } else {
        setActionError(res.message || "Gagal menugaskan teknisi.");
      }
    });
  };

  const handleUpdateUrgency = (ticketId: string, newUrgency: TicketUrgency) => {
    setActionError(null);
    startTransition(async () => {
      const res = await updateTicketStatusAction({
        ticketId,
        urgency: newUrgency,
        notes: `Urgensi tiket disesuaikan menjadi ${newUrgency} oleh Helpdesk ${adminName}`,
      });
      if (res.success) {
        window.location.reload();
      } else {
        setActionError(res.message || "Gagal mengubah urgensi.");
      }
    });
  };

  const filteredTickets = tickets.filter((t) => {
    const matchSearch =
      t.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.unit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchUrgency = filterUrgency === "ALL" || t.urgency === filterUrgency;
    return matchSearch && matchUrgency;
  });

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

  return (
    <div className="space-y-6 pb-16">
      {/* Header Dispatcher */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors">
        <div className="space-y-1">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Pusat Komando Helpdesk SIMRS & TI
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Operator: <strong className="text-slate-800 dark:text-white">{adminName}</strong> • Monitoring Antrean & Tingkat Urgensi Seluruh Ruangan RSBM
          </p>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="self-start sm:self-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 border border-slate-200 dark:border-white/10 transition-colors shadow-sm active:scale-95"
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

      {/* Baris Kartu Metrik Waktu SLA */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm transition-colors">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">Total Tiket Masuk</span>
          <span className="text-2xl font-bold text-slate-900 dark:text-white mt-1 block">{totalTickets}</span>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">Semua Unit RS</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm transition-colors">
          <span className="text-xs text-rose-600 dark:text-rose-300 font-medium block">Tiket Kritis (P1) Aktif</span>
          <span className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1 block">{emergencyCount}</span>
          <span className="text-[11px] text-rose-500/80">Wajib Direspon Segera</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm transition-colors">
          <span className="text-xs text-sky-600 dark:text-sky-300 font-medium block">Rata-rata Respon (TTR)</span>
          <span className="text-2xl font-bold text-sky-600 dark:text-sky-400 mt-1 block">
            {avgResponseMins} <span className="text-sm font-normal text-slate-500 dark:text-slate-300">Menit</span>
          </span>
          <span className="text-[11px] text-slate-400">Target: &lt; 5 Menit</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm transition-colors">
          <span className="text-xs text-emerald-600 dark:text-emerald-300 font-medium block">Rata-rata Selesai</span>
          <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
            {avgRepairMins} <span className="text-sm font-normal text-slate-500 dark:text-slate-300">Menit</span>
          </span>
          <span className="text-[11px] text-slate-400">Durasi Pengerjaan Bersih</span>
        </div>
      </div>

      {/* Filter & Pencarian */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm transition-colors">
        <div className="relative w-full sm:w-80">
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
          <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap font-medium">Filter Urgensi:</span>
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

      {/* Tabel Triase Tiket */}
      <div className="space-y-4">
        {filteredTickets.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-10 text-center text-slate-500 dark:text-slate-400 text-xs sm:text-sm shadow-sm">
            Tidak ada tiket yang cocok dengan kriteria pencarian.
          </div>
        ) : (
          filteredTickets.map((ticket) => {
            const urgencyColor = getUrgencyBadgeColor(ticket.urgency);

            return (
              <div
                key={ticket.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3.5 transition-colors"
              >
                <div className="flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs sm:text-sm font-bold text-sky-600 dark:text-sky-400">{ticket.ticketNumber}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-xs text-slate-900 dark:text-white font-bold flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-sky-500" />
                      {ticket.unit.name} ({ticket.unit.buildingZone})
                    </span>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10">
                    {ticket.status}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md font-semibold flex items-center gap-1">
                    <Tag className="w-3 h-3 text-sky-500" />
                    {ticket.category.name}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                    SLA Target: {ticket.category.targetSlaMinutes} Menit
                  </span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-xl border border-slate-200/60 dark:border-white/5">
                  <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-normal">
                    {ticket.description}
                  </p>
                </div>

                {ticket.attachments && ticket.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {ticket.attachments.map((att) => (
                      <a
                        key={att.id}
                        href={`/api/media/${att.storedFilename}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-xs text-sky-600 dark:text-sky-400 font-medium transition-colors"
                      >
                        {att.fileType === "IMAGE" ? <ImageIcon className="w-3.5 h-3.5" /> : <VideoIcon className="w-3.5 h-3.5" />}
                        Lampiran {att.fileType}
                      </a>
                    ))}
                  </div>
                )}

                {/* Penentuan Urgensi & Assign Teknisi */}
                <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Masuk: {new Date(ticket.submittedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                  </span>

                  <div className="flex flex-wrap items-center gap-3">
                    {/* Urgensi Selector */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Tingkat Urgensi:</span>
                      <select
                        disabled={isPending}
                        value={ticket.urgency}
                        onChange={(e) => handleUpdateUrgency(ticket.id, e.target.value as TicketUrgency)}
                        className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all ${urgencyColor}`}
                        title="Tentukan / Ubah Urgensi Tiket"
                      >
                        <option value="EMERGENCY">🔴 P1 - Darurat</option>
                        <option value="HIGH">🟠 P2 - Tinggi</option>
                        <option value="MEDIUM">🟡 P3 - Sedang</option>
                        <option value="LOW">🟢 P4 - Rendah</option>
                      </select>
                    </div>

                    {/* Penugasan Teknisi */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
                        <UserCheck className="w-3.5 h-3.5 text-sky-500" />
                        Teknisi:
                      </span>
                      <select
                        disabled={isPending}
                        defaultValue={ticket.assignedTechnician?.fullName || ""}
                        onChange={(e) => handleAssignTechnician(ticket.id, e.target.value)}
                        className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                      >
                        <option value="" disabled>-- Pilih Teknisi --</option>
                        {technicians.map((tech) => (
                          <option key={tech.id} value={tech.id}>
                            {tech.fullName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
