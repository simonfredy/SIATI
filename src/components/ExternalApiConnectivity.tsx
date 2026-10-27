"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
  Globe,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Search,
  ExternalLink,
  ShieldCheck,
  Zap,
  ArrowUpRight,
  Loader2,
  Lock,
  Plus,
  Trash2,
  Play,
  PlayCircle,
  Info,
  X,
  Layers,
  Filter,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  getExternalEndpointsAction,
  addExternalEndpointAction,
  deleteExternalEndpointAction,
  testSingleEndpointAction,
  testAllEndpointsAction,
  ExternalEndpointItem,
  UrlTestResult,
} from "@/actions/networkDiagnostics";
import {
  staggerContainerVariants,
  cardItemVariants,
  interactiveCardHover,
  modalBackdropVariants,
  modalContentVariants,
} from "@/lib/motionVariants";

export default function ExternalApiConnectivity() {
  const [isPending, startTransition] = useTransition();
  const [endpoints, setEndpoints] = useState<ExternalEndpointItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isTestingAll, setIsTestingAll] = useState<boolean>(false);
  const [testingEndpointId, setTestingEndpointId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filter Kategori
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("ALL");

  // Modal Tambah Endpoint Baru
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>("");
  const [newDesc, setNewDesc] = useState<string>("");
  const [newUrl, setNewUrl] = useState<string>("");
  const [newType, setNewType] = useState<string>("BPJS");
  const [newMethod, setNewMethod] = useState<string>("HEAD");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Muat data awal (HANYA MEMUAT DAFTAR, TIDAK MENJALANKAN TEST OTOMATIS)
  const loadInitialData = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await getExternalEndpointsAction();
      if (res.success && res.data) {
        setEndpoints(res.data);
      } else {
        setErrorMsg(res.message || "Gagal memuat daftar endpoint eksternal.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Terjadi kegagalan komunikasi saat memuat modul API eksternal.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // TRIGGER 1: Uji Semua Endpoint Sekaligus
  const handleTestAllEndpoints = async () => {
    if (endpoints.length === 0) return;
    setIsTestingAll(true);
    setErrorMsg(null);
    try {
      const payload = endpoints.map((ep) => ({
        id: ep.id,
        targetUrl: ep.targetUrl,
        httpMethod: ep.httpMethod,
      }));
      const res = await testAllEndpointsAction(payload);

      if (res.success && res.data) {
        const resultsMap = res.data;
        setEndpoints((prev) =>
          prev.map((ep) => {
            const resItem = resultsMap[ep.id];
            if (!resItem) return ep;
            const isOnline = resItem.reachable;
            return {
              ...ep,
              status: !isOnline ? "OFFLINE" : resItem.latencyMs > 1500 ? "DEGRADED" : "ONLINE",
              statusCode: resItem.statusCode,
              latencyMs: resItem.latencyMs,
              message: resItem.message,
              lastTestedAt: resItem.timestamp,
            };
          })
        );
        setSuccessMsg("Pengujian seluruh endpoint API & Web selesai.");
      } else {
        setErrorMsg(res.message || "Gagal menjalankan pengujian massal endpoint.");
      }
    } catch {
      setErrorMsg("Koneksi terputus saat menguji endpoint eksternal.");
    } finally {
      setIsTestingAll(false);
    }
  };

  // TRIGGER 2: Uji 1 Endpoint Individu
  const handleTestSingleEndpoint = async (endpoint: ExternalEndpointItem) => {
    setTestingEndpointId(endpoint.id);
    setErrorMsg(null);
    try {
      const res = await testSingleEndpointAction({
        url: endpoint.targetUrl,
        method: endpoint.httpMethod,
      });

      if (res.success && res.data) {
        const r = res.data;
        const isOnline = r.reachable;
        setEndpoints((prev) =>
          prev.map((ep) => {
            if (ep.id !== endpoint.id) return ep;
            return {
              ...ep,
              status: !isOnline ? "OFFLINE" : r.latencyMs > 1500 ? "DEGRADED" : "ONLINE",
              statusCode: r.statusCode,
              latencyMs: r.latencyMs,
              message: r.message,
              lastTestedAt: r.timestamp,
            };
          })
        );
      } else {
        setErrorMsg(res.message || "Gagal menguji endpoint.");
      }
    } catch {
      setErrorMsg("Terjadi kesalahan jaringan saat menguji endpoint.");
    } finally {
      setTestingEndpointId(null);
    }
  };

  // Tambah Endpoint Baru
  const handleAddEndpoint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newUrl.trim()) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await addExternalEndpointAction({
        name: newName.trim(),
        description: newDesc.trim() || undefined,
        targetUrl: newUrl.trim(),
        type: newType,
        httpMethod: newMethod,
      });

      if (res.success && res.data) {
        setEndpoints((prev) => [...prev, res.data!]);
        setSuccessMsg(res.message || "Layanan API baru berhasil ditambahkan.");
        setIsAddModalOpen(false);
        setNewName("");
        setNewDesc("");
        setNewUrl("");
        setNewType("BPJS");
        setNewMethod("HEAD");
      } else {
        setErrorMsg(res.message || "Gagal menambahkan layanan.");
      }
    } catch {
      setErrorMsg("Koneksi gagal saat menyimpan endpoint baru.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Hapus Endpoint dari Pemantauan
  const handleDeleteEndpoint = async (id: string, name: string) => {
    if (!confirm(`Hapus layanan '${name}' dari daftar pemantauan API?`)) return;

    setErrorMsg(null);
    try {
      const res = await deleteExternalEndpointAction(id);
      if (res.success) {
        setEndpoints((prev) => prev.filter((ep) => ep.id !== id));
        setSuccessMsg(`Layanan '${name}' telah dihapus.`);
      } else {
        setErrorMsg(res.message || "Gagal menghapus endpoint.");
      }
    } catch {
      setErrorMsg("Terjadi kegagalan jaringan saat menghapus endpoint.");
    }
  };

  const filteredEndpoints = endpoints.filter((ep) => {
    if (selectedTypeFilter === "ALL") return true;
    return ep.type === selectedTypeFilter;
  });

  const onlineCount = endpoints.filter((e) => e.status === "ONLINE").length;
  const degradedCount = endpoints.filter((e) => e.status === "DEGRADED").length;
  const offlineCount = endpoints.filter((e) => e.status === "OFFLINE").length;
  const untestedCount = endpoints.filter((e) => e.status === "UNTESTED").length;

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-7 border border-slate-800 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-400/30 backdrop-blur-sm">
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              Integrasi Cloud, BPJS Kesehatan & Kemenkes
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Konektivitas API & Layanan Web Eksternal
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Kelola daftar service integrasi BPJS Kesehatan (V-Claim, Antrean, I-Care, Aplicares), Kemenkes SatuSehat, dan portal web rumah sakit. Jalankan pengujian kesiapan bridging kapan saja melalui tombol trigger.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto shrink-0">
            {/* Tombol Tambah Endpoint */}
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Layanan / API</span>
            </button>

            {/* Tombol TRIGGER UTAMA Pengecekan */}
            <button
              type="button"
              onClick={handleTestAllEndpoints}
              disabled={isTestingAll || endpoints.length === 0}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-extrabold flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
            >
              {isTestingAll ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menguji Seluruh Endpoint...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Mulai Pengecekan Semua API</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Banner Pesan Feedback */}
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

      {/* 4 Kartu KPI Ringkasan Status */}
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
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">Total Layanan</span>
          <span className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5 block">{endpoints.length}</span>
          <span className="text-[11px] text-slate-400">Endpoint Terdaftar</span>
        </motion.div>

        <motion.div
          variants={cardItemVariants}
          whileHover={interactiveCardHover}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm"
        >
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">Online & Siap</span>
          <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">{onlineCount}</span>
          <span className="text-[11px] text-slate-400">HTTP Respon Cepat (&lt; 1500ms)</span>
        </motion.div>

        <motion.div
          variants={cardItemVariants}
          whileHover={interactiveCardHover}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm"
        >
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">Respon Lambat</span>
          <span className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-0.5 block">{degradedCount}</span>
          <span className="text-[11px] text-slate-400">Latensi Tinggi (&gt; 1500ms)</span>
        </motion.div>

        <motion.div
          variants={cardItemVariants}
          whileHover={interactiveCardHover}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm"
        >
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">Belum Diuji / Putus</span>
          <span className="text-2xl font-bold text-slate-600 dark:text-slate-400 mt-0.5 block">
            {untestedCount > 0 ? `${untestedCount} Menunggu` : `${offlineCount} Putus`}
          </span>
          <span className="text-[11px] text-slate-400">
            {untestedCount > 0 ? "Tekan tombol Uji untuk cek" : "Offline / Gangguan Server"}
          </span>
        </motion.div>
      </motion.div>

      {/* FILTER & DAFTAR ENDPOINT API EKSTERNAL */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/10">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Daftar Layanan Web Service & API Rumah Sakit
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Pantau endpoint BPJS, SatuSehat, dan portal faskes. Klik tombol &apos;Uji&apos; pada baris atau gunakan tombol utama di atas.
            </p>
          </div>

          {/* Filter Jenis Layanan */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {["ALL", "BPJS", "KEMENKES", "WEBSITE_RS", "PUBLIC_DNS"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setSelectedTypeFilter(t)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  selectedTypeFilter === t
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {t === "ALL" ? "Semua Layanan" : t}
              </button>
            ))}
          </div>
        </div>

        {/* Tabel / Grid Layanan */}
        {isLoading && endpoints.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-xs gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            <span>Memuat daftar layanan API...</span>
          </div>
        ) : filteredEndpoints.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-3">
            <Globe className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="text-xs">Tidak ada endpoint yang cocok dengan filter yang dipilih.</p>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Tambah Endpoint Baru
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEndpoints.map((ep) => {
              const isCheckingThis = testingEndpointId === ep.id || isTestingAll;

              return (
                <div
                  key={ep.id}
                  className="p-4 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-all space-y-2.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Kolom Kiri: Nama & Deskripsi */}
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                        {ep.type === "BPJS" ? (
                          <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        ) : ep.type === "KEMENKES" ? (
                          <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        ) : (
                          <Globe className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                            {ep.name}
                          </span>
                          <span className="text-[9px] uppercase px-1.5 py-0.5 rounded font-extrabold bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300">
                            {ep.type}
                          </span>
                          <span className="text-[9px] uppercase px-1 py-0.5 rounded font-mono bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            {ep.httpMethod}
                          </span>
                        </div>
                        {ep.description && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                            {ep.description}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Kolom Kanan: Status & Tombol Trigger */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 dark:border-white/5">
                      {/* Badge Status */}
                      <div className="text-right">
                        {ep.status === "UNTESTED" ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            Belum Diuji
                          </span>
                        ) : ep.status === "ONLINE" ? (
                          <div className="flex items-center gap-1.5 text-right">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <div>
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 block">
                                ONLINE • {ep.latencyMs} ms
                              </span>
                            </div>
                          </div>
                        ) : ep.status === "DEGRADED" ? (
                          <div className="flex items-center gap-1.5 text-right">
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 block">
                              LAMBAT • {ep.latencyMs} ms
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-right">
                            <XCircle className="w-4 h-4 text-rose-500" />
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 block">
                              OFFLINE / TIMEOUT
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Tombol TRIGGER Individu */}
                      <button
                        type="button"
                        onClick={() => handleTestSingleEndpoint(ep)}
                        disabled={isCheckingThis}
                        title="Uji keterjangkauan endpoint ini sekarang"
                        className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-slate-200 dark:border-white/10 text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50"
                      >
                        {isCheckingThis ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                        ) : (
                          <PlayCircle className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        )}
                        <span>Uji</span>
                      </button>

                      {/* Tombol Hapus */}
                      <button
                        type="button"
                        onClick={() => handleDeleteEndpoint(ep.id, ep.name)}
                        title="Hapus endpoint dari pemantauan"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Baris Bawah: URL & Pesan Respon */}
                  <div className="pt-2 border-t border-slate-200/60 dark:border-white/5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                    <a
                      href={ep.targetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 truncate max-w-md"
                    >
                      {ep.targetUrl}
                      <ArrowUpRight className="w-3 h-3 shrink-0" />
                    </a>
                    {ep.message && ep.status !== "UNTESTED" && (
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        {ep.message}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL TAMBAH ENDPOINT / LAYANAN API BARU */}
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
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      Tambah Layanan API / Web Baru
                    </h3>
                    <p className="text-[11px] text-slate-400">Daftarkan endpoint BPJS, SatuSehat, atau web</p>
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

              <form onSubmit={handleAddEndpoint} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Nama Layanan / Service
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: BPJS Antrean Faskes, SIMRS Cloud"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Deskripsi Singkat (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Integrasi kuota jadwal poli spesialis"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Alamat Target URL (HTTP / HTTPS)
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://apijkn.bpjs-kesehatan.go.id/antreanrs"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-7 space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Kategori Layanan
                    </label>
                    <select
                      value={newType}
                      onChange={(e) => setNewType(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="BPJS">BPJS Kesehatan (V-Claim / Antrean / I-Care)</option>
                      <option value="KEMENKES">Kemenkes SatuSehat</option>
                      <option value="WEBSITE_RS">Website Resmi Rumah Sakit</option>
                      <option value="PUBLIC_DNS">DNS / Backbone Internet</option>
                      <option value="OTHER">Layanan Pihak Ketiga Lainnya</option>
                    </select>
                  </div>

                  <div className="col-span-5 space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Metode HTTP
                    </label>
                    <select
                      value={newMethod}
                      onChange={(e) => setNewMethod(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="HEAD">HEAD (Cepat & Hemat Kuota)</option>
                      <option value="GET">GET (Full Status Respon)</option>
                    </select>
                  </div>
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
                    disabled={isSubmitting || !newName.trim() || !newUrl.trim()}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Menyimpan...
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" /> Simpan Layanan
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
