"use client";

import React, { useState, useTransition } from "react";
import { TicketStatus, TicketUrgency } from "@prisma/client";
import { updateTicketStatusAction } from "@/actions/tickets";
import { Clock, ShieldAlert, CheckCircle2, AlertTriangle, UserCheck, Search, Image as ImageIcon, Video as VideoIcon } from "lucide-react";
import { TicketItem } from "./ReporterView";

interface AdminHelpdeskViewProps {
  tickets: TicketItem[];
  technicians: { id: string; fullName: string }[];
  adminName: string;
}

export default function AdminHelpdeskView({ tickets, technicians, adminName }: AdminHelpdeskViewProps) {
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterUrgency, setFilterUrgency] = useState<string>("ALL");

  // Metrik Kinerja SLA
  const totalTickets = tickets.length;
  const emergencyCount = tickets.filter((t) => t.urgency === TicketUrgency.EMERGENCY && t.status !== TicketStatus.CLOSED && t.status !== TicketStatus.RESOLVED).length;
  
  // Rata-rata menit respon
  const ticketsWithResponse = tickets.filter((t) => t.responseMinutes !== null);
  const avgResponseMins = ticketsWithResponse.length
    ? Math.round(ticketsWithResponse.reduce((acc, cur) => acc + (cur.responseMinutes || 0), 0) / ticketsWithResponse.length)
    : 0;

  // Rata-rata menit perbaikan bersih
  const ticketsWithRepair = tickets.filter((t) => t.repairMinutes !== null);
  const avgRepairMins = ticketsWithRepair.length
    ? Math.round(ticketsWithRepair.reduce((acc, cur) => acc + (cur.repairMinutes || 0), 0) / ticketsWithRepair.length)
    : 0;

  const handleAssignTechnician = (ticketId: string, technicianId: string) => {
    if (!technicianId) return;
    startTransition(async () => {
      await updateTicketStatusAction({
        ticketId,
        newStatus: TicketStatus.ASSIGNED,
        assignedTechnicianId: technicianId,
        notes: "Penugasan langsung dari meja Dispatcher Helpdesk.",
      });
      window.location.reload();
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

  return (
    <div className="space-y-5 pb-10">
      {/* Header Dispatcher */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 border border-white/10 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-indigo-400" />
            Pusat Komando Helpdesk SIMRS & TI
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Operator: <strong className="text-white">{adminName}</strong> • Monitoring & Triase Antrean Tiket Seluruh Ruangan RSUD
          </p>
        </div>
      </div>

      {/* Baris Kartu Metrik Waktu SLA */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-800/60 border border-white/10 rounded-xl p-3.5">
          <span className="text-xs text-slate-400 font-medium block">Total Tiket Masuk</span>
          <span className="text-2xl font-bold text-white mt-1 block">{totalTickets}</span>
          <span className="text-[11px] text-slate-500">Semua Unit RS</span>
        </div>

        <div className="bg-slate-800/60 border border-white/10 rounded-xl p-3.5">
          <span className="text-xs text-rose-300 font-medium block">Tiket Kritis (P1) Aktif</span>
          <span className="text-2xl font-bold text-rose-400 mt-1 block">{emergencyCount}</span>
          <span className="text-[11px] text-rose-400/70">Wajib Direspon Segera</span>
        </div>

        <div className="bg-slate-800/60 border border-white/10 rounded-xl p-3.5">
          <span className="text-xs text-sky-300 font-medium block">Rata-rata Respon (TTR)</span>
          <span className="text-2xl font-bold text-sky-400 mt-1 block">{avgResponseMins} <span className="text-sm font-normal text-slate-300">Menit</span></span>
          <span className="text-[11px] text-slate-400">Target: &lt; 5 Menit</span>
        </div>

        <div className="bg-slate-800/60 border border-white/10 rounded-xl p-3.5">
          <span className="text-xs text-emerald-300 font-medium block">Rata-rata Selesai</span>
          <span className="text-2xl font-bold text-emerald-400 mt-1 block">{avgRepairMins} <span className="text-sm font-normal text-slate-300">Menit</span></span>
          <span className="text-[11px] text-slate-400">Durasi Pengerjaan Bersih</span>
        </div>
      </div>

      {/* Filter & Pencarian */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-800/40 p-3 rounded-xl border border-white/10">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari no. tiket, ruangan, atau gejala.."
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400 whitespace-nowrap">Filter Urgensi:</span>
          <select
            value={filterUrgency}
            onChange={(e) => setFilterUrgency(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="ALL">Semua Urgensi</option>
            <option value="EMERGENCY">P1 - Darurat</option>
            <option value="HIGH">P2 - Tinggi</option>
            <option value="MEDIUM">P3 - Sedang</option>
            <option value="LOW">P4 - Rendah</option>
          </select>
        </div>
      </div>

      {/* Tabel Triase Tiket */}
      <div className="space-y-3">
        {filteredTickets.map((ticket) => (
          <div
            key={ticket.id}
            className="bg-slate-800/80 border border-white/10 rounded-xl p-4 shadow-sm space-y-2.5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-sky-400">{ticket.ticketNumber}</span>
                <span className="text-xs text-white font-semibold">{ticket.unit.name} ({ticket.unit.buildingZone})</span>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-slate-700 text-slate-200">
                {ticket.status}
              </span>
            </div>

            <p className="text-xs text-slate-300 bg-slate-900/50 p-2.5 rounded-lg border border-white/5">
              {ticket.description}
            </p>

            {ticket.attachments && ticket.attachments.length > 0 && (
              <div className="flex gap-2">
                {ticket.attachments.map((att) => (
                  <a
                    key={att.id}
                    href={`/api/media/${att.storedFilename}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-sky-400 hover:underline"
                  >
                    {att.fileType === "IMAGE" ? <ImageIcon className="w-3.5 h-3.5" /> : <VideoIcon className="w-3.5 h-3.5" />}
                    Lampiran {att.fileType}
                  </a>
                ))}
              </div>
            )}

            {/* Triase Assign Teknisi */}
            <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-slate-400">
                Masuk: {new Date(ticket.submittedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
              </span>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-sky-400" />
                  Tugaskan Teknisi:
                </span>
                <select
                  disabled={isPending}
                  defaultValue={ticket.assignedTechnician?.fullName || ""}
                  onChange={(e) => handleAssignTechnician(ticket.id, e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-sky-500/30 text-xs font-medium text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
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
        ))}
      </div>
    </div>
  );
}
