"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
  Server,
  Activity,
  Cpu,
  Clock,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Laptop,
  Printer,
  Database,
  ArrowRightLeft,
  Loader2,
  Wifi,
  Radio,
  Plus,
  Trash2,
  Play,
  PlayCircle,
  Info,
  X,
  Layers,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  getServerSystemInfoAction,
  getNetworkDevicesAction,
  addNetworkDeviceAction,
  deleteNetworkDeviceAction,
  testSingleDeviceAction,
  testAllDevicesAction,
  ServerSystemInfo,
  NetworkDeviceItem,
  PingResult,
} from "@/actions/networkDiagnostics";
import {
  staggerContainerVariants,
  cardItemVariants,
  interactiveCardHover,
  modalBackdropVariants,
  modalContentVariants,
} from "@/lib/motionVariants";

export default function InternalNetworkDiagnostic() {
  const [isPending, startTransition] = useTransition();
  const [systemInfo, setSystemInfo] = useState<ServerSystemInfo | null>(null);
  const [devices, setDevices] = useState<NetworkDeviceItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isTestingAll, setIsTestingAll] = useState<boolean>(false);
  const [testingDeviceId, setTestingDeviceId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal Tambah Perangkat
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>("");
  const [newHost, setNewHost] = useState<string>("");
  const [newPort, setNewPort] = useState<string>("80");
  const [newCategory, setNewCategory] = useState<string>("PC");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Toggle Tampilkan Info Host Server
  const [showServerDetails, setShowServerDetails] = useState<boolean>(false);

  // Muat data awal (HANYA MEMUAT DAFTAR, TIDAK MENJALANKAN PING OTOMATIS)
  const loadInitialData = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const [sysRes, devRes] = await Promise.all([
        getServerSystemInfoAction(),
        getNetworkDevicesAction(),
      ]);

      if (sysRes.success && sysRes.data) {
        setSystemInfo(sysRes.data);
      }
      if (devRes.success && devRes.data) {
        setDevices(devRes.data);
      } else {
        setErrorMsg(devRes.message || "Gagal memuat daftar perangkat jaringan.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Terjadi kegagalan komunikasi saat memuat modul jaringan server.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // TRIGGER 1: Uji Semua Perangkat Sekaligus
  const handleTestAllDevices = async () => {
    if (devices.length === 0) return;
    setIsTestingAll(true);
    setErrorMsg(null);
    try {
      const payload = devices.map((d) => ({ id: d.id, host: d.host, port: d.port }));
      const res = await testAllDevicesAction(payload);

      if (res.success && res.data) {
        const resultsMap = res.data;
        setDevices((prev) =>
          prev.map((d) => {
            const resItem = resultsMap[d.id];
            if (!resItem) return d;
            return {
              ...d,
              status: resItem.state === "OPEN" ? "ONLINE" : resItem.state === "CLOSED" ? "CLOSED" : "OFFLINE",
              latencyMs: resItem.latencyMs,
              message: resItem.message,
              lastTestedAt: resItem.timestamp,
            };
          })
        );
        setSuccessMsg("Pengujian seluruh perangkat selesai dijalankan.");
      } else {
        setErrorMsg(res.message || "Pengujian massal perangkat gagal.");
      }
    } catch {
      setErrorMsg("Koneksi terputus saat menjalankan pengujian jaringan massal.");
    } finally {
      setIsTestingAll(false);
    }
  };

  // TRIGGER 2: Uji 1 Perangkat Individu
  const handleTestSingleDevice = async (device: NetworkDeviceItem) => {
    setTestingDeviceId(device.id);
    setErrorMsg(null);
    try {
      const res = await testSingleDeviceAction({
        host: device.host,
        port: device.port,
      });

      if (res.success && res.data) {
        const r = res.data;
        setDevices((prev) =>
          prev.map((d) => {
            if (d.id !== device.id) return d;
            return {
              ...d,
              status: r.state === "OPEN" ? "ONLINE" : r.state === "CLOSED" ? "CLOSED" : "OFFLINE",
              latencyMs: r.latencyMs,
              message: r.message,
              lastTestedAt: r.timestamp,
            };
          })
        );
      } else {
        setErrorMsg(res.message || "Gagal menguji perangkat.");
      }
    } catch {
      setErrorMsg("Koneksi gagal saat menghubungi backend untuk menguji perangkat.");
    } finally {
      setTestingDeviceId(null);
    }
  };

  // Tambah Perangkat Baru
  const handleAddDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newHost.trim()) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await addNetworkDeviceAction({
        name: newName.trim(),
        host: newHost.trim(),
        port: parseInt(newPort, 10) || 80,
        category: newCategory,
      });

      if (res.success && res.data) {
        setDevices((prev) => [...prev, res.data!]);
        setSuccessMsg(res.message || "Perangkat baru berhasil ditambahkan.");
        setIsAddModalOpen(false);
        setNewName("");
        setNewHost("");
        setNewPort("80");
        setNewCategory("PC");
      } else {
        setErrorMsg(res.message || "Gagal menambahkan perangkat.");
      }
    } catch {
      setErrorMsg("Koneksi terputus saat menyimpan perangkat baru.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Hapus Perangkat dari Pemantauan
  const handleDeleteDevice = async (id: string, name: string) => {
    if (!confirm(`Hapus '${name}' dari daftar pemantauan jaringan?`)) return;

    setErrorMsg(null);
    try {
      const res = await deleteNetworkDeviceAction(id);
      if (res.success) {
        setDevices((prev) => prev.filter((d) => d.id !== id));
        setSuccessMsg(`Perangkat '${name}' telah dihapus.`);
      } else {
        setErrorMsg(res.message || "Gagal menghapus perangkat.");
      }
    } catch {
      setErrorMsg("Terjadi kegagalan jaringan saat menghapus perangkat.");
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toUpperCase()) {
      case "SERVER":
        return <Server className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />;
      case "DATABASE":
        return <Database className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
      case "PRINTER":
        return <Printer className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case "ROUTER":
      case "SWITCH":
        return <Radio className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      default:
        return <Laptop className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
    }
  };

  const onlineCount = devices.filter((d) => d.status === "ONLINE").length;
  const closedCount = devices.filter((d) => d.status === "CLOSED").length;
  const offlineCount = devices.filter((d) => d.status === "OFFLINE").length;
  const untestedCount = devices.filter((d) => d.status === "UNTESTED").length;

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-7 border border-slate-800 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold border border-cyan-400/30 backdrop-blur-sm">
              <Server className="w-3.5 h-3.5 text-cyan-400" />
              Infrastruktur Jaringan & Perangkat Internal RS
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Jaringan Server & LAN Rumah Sakit
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Kelola daftar IP dan port PC tindakan, printer etiket, server database, dan router gateway ruangan rumah sakit. Uji keterjangkauan (*reachability*) dan respon TCP kapan saja melalui tombol trigger.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto shrink-0">
            {/* Tombol Tambah Perangkat */}
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 active:scale-95 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Perangkat / PC</span>
            </button>

            {/* Tombol TRIGGER UTAMA Pengecekan */}
            <button
              type="button"
              onClick={handleTestAllDevices}
              disabled={isTestingAll || devices.length === 0}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-extrabold flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
            >
              {isTestingAll ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menguji Seluruh Jaringan...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Mulai Pengecekan Jaringan</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Banner Pesan Umpan Balik */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-500/20 border border-rose-200 dark:border-rose-500/40 text-rose-800 dark:text-rose-300 text-xs sm:text-sm font-semibold flex items-center justify-between gap-2 shadow-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button type="button" onClick={() => setErrorMsg(null)} className="text-rose-600 dark:text-rose-400 font-bold text-xs underline">
            Tutup
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm font-semibold flex items-center justify-between gap-2 shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button type="button" onClick={() => setSuccessMsg(null)} className="text-emerald-600 dark:text-emerald-400 font-bold text-xs underline">
            Tutup
          </button>
        </div>
      )}

      {/* Baris Ringkasan KPI Status Pemantauan */}
      <motion.div
        variants={staggerContainerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4"
      >
        <motion.div
          variants={cardItemVariants}
          whileHover={interactiveCardHover}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm"
        >
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">Total Terdaftar</span>
          <span className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5 block">{devices.length}</span>
          <span className="text-[11px] text-slate-400">PC / Server / Printer RS</span>
        </motion.div>

        <motion.div
          variants={cardItemVariants}
          whileHover={interactiveCardHover}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm"
        >
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">Online & Terbuka</span>
          <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">{onlineCount}</span>
          <span className="text-[11px] text-slate-400">Respon TCP Handshake OK</span>
        </motion.div>

        <motion.div
          variants={cardItemVariants}
          whileHover={interactiveCardHover}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm"
        >
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">Host Aktif (Port Tertutup)</span>
          <span className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-0.5 block">{closedCount}</span>
          <span className="text-[11px] text-slate-400">TCP Reset Respon</span>
        </motion.div>

        <motion.div
          variants={cardItemVariants}
          whileHover={interactiveCardHover}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm"
        >
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">Belum Diuji / RTO</span>
          <span className="text-2xl font-bold text-slate-600 dark:text-slate-400 mt-0.5 block">
            {untestedCount > 0 ? `${untestedCount} Menunggu` : `${offlineCount} RTO`}
          </span>
          <span className="text-[11px] text-slate-400">
            {untestedCount > 0 ? "Tekan tombol Uji untuk cek" : "Offline / Masalah Jaringan"}
          </span>
        </motion.div>
      </motion.div>

      {/* Accordion Spesifikasi Host Server (Dapat Dilipat / Expand) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
        <button
          type="button"
          onClick={() => setShowServerDetails((prev) => !prev)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Server className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              Spesifikasi Fisik Host Server SIATI & Adapter Jaringan
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
              {systemInfo?.hostname || "Server Local"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>{showServerDetails ? "Sembunyikan" : "Tampilkan Detail"}</span>
            {showServerDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        <AnimatePresence>
          {showServerDetails && systemInfo && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="p-5 pt-0 border-t border-slate-100 dark:border-white/10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs"
            >
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-1">
                <span className="text-slate-400 block font-medium">Sistem Operasi</span>
                <span className="font-bold text-slate-900 dark:text-white block">{systemInfo.platform} ({systemInfo.arch})</span>
                <span className="text-[10px] text-slate-500">Node {systemInfo.nodeVersion}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-1">
                <span className="text-slate-400 block font-medium">Uptime Server</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 block">{systemInfo.uptimeFormatted}</span>
                <span className="text-[10px] text-slate-500">Waktu hidup server aktif</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-1">
                <span className="text-slate-400 block font-medium">RAM Terpakai</span>
                <span className="font-bold text-purple-600 dark:text-purple-400 block">
                  {systemInfo.memory.usedPercent}% ({(systemInfo.memory.usedBytes / 1024 / 1024 / 1024).toFixed(1)} GB)
                </span>
                <span className="text-[10px] text-slate-500">Total: {(systemInfo.memory.totalBytes / 1024 / 1024 / 1024).toFixed(1)} GB</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-1">
                <span className="text-slate-400 block font-medium">Adapter Jaringan Server</span>
                <span className="font-bold text-cyan-600 dark:text-cyan-400 block truncate">
                  {systemInfo.networkInterfaces.find((i) => !i.internal && i.family === "IPv4")?.address || "127.0.0.1"}
                </span>
                <span className="text-[10px] text-slate-500">{systemInfo.networkInterfaces.length} adapter fisik</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* DAFTAR PERANGKAT LAN / SERVER RS (TABEL & KARTU) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/10">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              Daftar Target Perangkat Jaringan Rumah Sakit
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Klik tombol &apos;Uji&apos; pada baris perangkat atau gunakan tombol utama di atas untuk memulai diagnostik koneksi.
            </p>
          </div>

          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            {devices.length} Perangkat Dipantau
          </span>
        </div>

        {/* Tabel / Grid Perangkat */}
        {isLoading && devices.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-xs gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
            <span>Memuat daftar perangkat jaringan...</span>
          </div>
        ) : devices.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-3">
            <Server className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="text-xs">Belum ada perangkat atau server yang didaftarkan.</p>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-cyan-600 text-white text-xs font-bold inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Tambah Perangkat Pertama
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {devices.map((device) => {
              const isCheckingThis = testingDeviceId === device.id || isTestingAll;

              return (
                <div
                  key={device.id}
                  className="p-3.5 sm:p-4 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  {/* Kolom Kiri: Info Perangkat */}
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                      {getCategoryIcon(device.category)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                          {device.name}
                        </span>
                        <span className="text-[9px] uppercase px-1.5 py-0.5 rounded font-extrabold bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {device.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        <span className="font-bold text-cyan-600 dark:text-cyan-400">{device.host}</span>
                        <span>:</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Port {device.port}</span>
                        {device.message && device.status !== "UNTESTED" && (
                          <>
                            <span className="text-slate-300 dark:text-slate-600">•</span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-xs">
                              {device.message}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Kolom Kanan: Status & Tindakan Trigger */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 dark:border-white/5">
                    {/* Badge Status */}
                    <div className="text-right">
                      {device.status === "UNTESTED" ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          Belum Diuji
                        </span>
                      ) : device.status === "ONLINE" ? (
                        <div className="flex items-center gap-1.5 text-right">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <div>
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 block">
                              ONLINE • {device.latencyMs} ms
                            </span>
                          </div>
                        </div>
                      ) : device.status === "CLOSED" ? (
                        <div className="flex items-center gap-1.5 text-right">
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 block">
                            PORT TERTUTUP • {device.latencyMs} ms
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-right">
                          <XCircle className="w-4 h-4 text-rose-500" />
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 block">
                            OFFLINE / RTO
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Tombol TRIGGER Individu */}
                    <button
                      type="button"
                      onClick={() => handleTestSingleDevice(device)}
                      disabled={isCheckingThis}
                      title="Uji koneksi perangkat ini sekarang"
                      className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border border-slate-200 dark:border-white/10 text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50"
                    >
                      {isCheckingThis ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-500" />
                      ) : (
                        <PlayCircle className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                      )}
                      <span>Uji</span>
                    </button>

                    {/* Tombol Hapus */}
                    <button
                      type="button"
                      onClick={() => handleDeleteDevice(device.id, device.name)}
                      title="Hapus perangkat dari pemantauan"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL TAMBAH PERANGKAT / PC BARU */}
      <AnimatePresence>
        {isAddModalOpen && (
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
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/15 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-cyan-50 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      Tambah Perangkat / Server Baru
                    </h3>
                    <p className="text-[11px] text-slate-400">Daftarkan target IP untuk diuji</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddDevice} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Nama Perangkat / Ruangan
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: PC Tindakan IGD, Printer Farmasi"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-8 space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Alamat IP / Hostname
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: 192.168.1.50 atau localhost"
                      value={newHost}
                      onChange={(e) => setNewHost(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>

                  <div className="col-span-4 space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Port TCP
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="65535"
                      required
                      placeholder="80"
                      value={newPort}
                      onChange={(e) => setNewPort(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Kategori Perangkat
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="PC">Komputer / PC Tindakan</option>
                    <option value="SERVER">Server SIMRS / Aplikasi</option>
                    <option value="DATABASE">Server Database (MariaDB/MySQL)</option>
                    <option value="PRINTER">Printer Jaringan (Etiket/Resep)</option>
                    <option value="ROUTER">Gateway / Router / Core Switch</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !newName.trim() || !newHost.trim()}
                    className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Menyimpan...
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" /> Simpan Perangkat
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
