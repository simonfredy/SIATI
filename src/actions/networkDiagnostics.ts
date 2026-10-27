"use server";

import net from "net";
import os from "os";
import crypto from "crypto";
import { performance } from "perf_hooks";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Role } from "@prisma/client";

export interface ServerSystemInfo {
  hostname: string;
  platform: string;
  osRelease: string;
  arch: string;
  uptimeFormatted: string;
  uptimeSeconds: number;
  memory: {
    totalBytes: number;
    freeBytes: number;
    usedBytes: number;
    usedPercent: number;
  };
  cpu: {
    model: string;
    cores: number;
    speedMhz: number;
  };
  networkInterfaces: Array<{
    name: string;
    family: string;
    address: string;
    mac: string;
    internal: boolean;
  }>;
  nodeVersion: string;
  environment: string;
}

export interface NetworkDeviceItem {
  id: string;
  name: string;
  host: string;
  port: number;
  category: "PC" | "SERVER" | "PRINTER" | "ROUTER" | "DATABASE" | string;
  createdAt: string;
  status: "ONLINE" | "CLOSED" | "OFFLINE" | "UNTESTED";
  latencyMs?: number;
  message?: string;
  lastTestedAt?: string;
}

export interface ExternalEndpointItem {
  id: string;
  name: string;
  description?: string | null;
  targetUrl: string;
  type: "BPJS" | "KEMENKES" | "PUBLIC_DNS" | "WEBSITE_RS" | "OTHER" | string;
  httpMethod: "HEAD" | "GET" | string;
  createdAt: string;
  status: "ONLINE" | "DEGRADED" | "OFFLINE" | "UNTESTED";
  statusCode?: number;
  latencyMs?: number;
  message?: string;
  lastTestedAt?: string;
}

export interface PingResult {
  reachable: boolean;
  host: string;
  port: number;
  latencyMs: number;
  state: "OPEN" | "CLOSED" | "TIMEOUT" | "UNREACHABLE" | "ERROR";
  message: string;
  timestamp: string;
}

export interface UrlTestResult {
  reachable: boolean;
  url: string;
  method: string;
  statusCode?: number;
  statusText?: string;
  latencyMs: number;
  sslSecure: boolean;
  serverHeader?: string;
  message: string;
  timestamp: string;
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const parts: string[] = [];
  if (d > 0) parts.push(`${d} hari`);
  if (h > 0) parts.push(`${h} jam`);
  if (m > 0) parts.push(`${m} menit`);
  if (parts.length === 0 || s > 0) parts.push(`${s} detik`);
  return parts.join(", ");
}

/**
 * 1. Mendapatkan Informasi Host Server & Antarmuka Jaringan Fisik
 */
export async function getServerSystemInfoAction(): Promise<{
  success: boolean;
  data?: ServerSystemInfo;
  message?: string;
}> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== Role.SUPERADMIN) {
    return { success: false, message: "Akses ditolak. Memerlukan hak akses Super Admin." };
  }

  try {
    const rawInterfaces = os.networkInterfaces();
    const networkInterfaces: ServerSystemInfo["networkInterfaces"] = [];

    for (const [name, netList] of Object.entries(rawInterfaces)) {
      if (netList) {
        for (const netItem of netList) {
          networkInterfaces.push({
            name,
            family: netItem.family,
            address: netItem.address,
            mac: netItem.mac,
            internal: netItem.internal,
          });
        }
      }
    }

    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const usedPercent = Math.round((usedMem / totalMem) * 100);

    const cpus = os.cpus();
    const firstCpu = cpus[0] || { model: "Unknown CPU", speed: 0 };

    const info: ServerSystemInfo = {
      hostname: os.hostname(),
      platform: os.platform(),
      osRelease: os.release(),
      arch: os.arch(),
      uptimeFormatted: formatUptime(os.uptime()),
      uptimeSeconds: os.uptime(),
      memory: {
        totalBytes: totalMem,
        freeBytes: freeMem,
        usedBytes: usedMem,
        usedPercent,
      },
      cpu: {
        model: firstCpu.model,
        cores: cpus.length,
        speedMhz: firstCpu.speed,
      },
      networkInterfaces,
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || "development",
    };

    return { success: true, data: info };
  } catch (error) {
    console.error("Gagal membaca sistem server:", error);
    return { success: false, message: "Gagal mendeteksi informasi antarmuka jaringan server." };
  }
}

/**
 * 2. Mengambil Daftar Target Perangkat LAN / Server RS (Status awal UNTESTED / Belum diuji)
 */
export async function getNetworkDevicesAction(): Promise<{
  success: boolean;
  data?: NetworkDeviceItem[];
  message?: string;
}> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== Role.SUPERADMIN) {
    return { success: false, message: "Akses ditolak. Memerlukan hak akses Super Admin." };
  }

  try {
    // Ambil data dari tabel network_device_targets
    const rows = await prisma.$queryRawUnsafe<
      Array<{ id: string; name: string; host: string; port: number; category: string; createdAt: Date }>
    >("SELECT * FROM `network_device_targets` ORDER BY `createdAt` ASC");

    // Jika tabel masih kosong, lakukan auto-seeding perangkat awal RS
    if (rows.length === 0) {
      const defaultDevices = [
        {
          id: crypto.randomUUID(),
          name: "Server Database Lokal (MariaDB)",
          host: "127.0.0.1",
          port: 3306,
          category: "DATABASE",
        },
        {
          id: crypto.randomUUID(),
          name: "Gateway Router Utama LAN RS",
          host: "192.168.1.1",
          port: 80,
          category: "ROUTER",
        },
        {
          id: crypto.randomUUID(),
          name: "PC Registrasi & Kasir IGD",
          host: "192.168.1.50",
          port: 80,
          category: "PC",
        },
        {
          id: crypto.randomUUID(),
          name: "Printer Etiket Obat Farmasi",
          host: "192.168.1.150",
          port: 9100,
          category: "PRINTER",
        },
      ];

      for (const d of defaultDevices) {
        await prisma.$executeRawUnsafe(
          "INSERT INTO `network_device_targets` (`id`, `name`, `host`, `port`, `category`, `createdAt`) VALUES (?, ?, ?, ?, ?, NOW())",
          d.id,
          d.name,
          d.host,
          d.port,
          d.category
        );
      }

      const seeded = defaultDevices.map((d) => ({
        ...d,
        createdAt: new Date().toISOString(),
        status: "UNTESTED" as const,
        message: "Belum diuji. Tekan tombol Uji untuk memeriksa.",
      }));

      return { success: true, data: seeded };
    }

    const items: NetworkDeviceItem[] = rows.map((r) => ({
      id: r.id,
      name: r.name,
      host: r.host,
      port: Number(r.port),
      category: r.category,
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
      status: "UNTESTED",
      message: "Belum diuji. Tekan tombol Uji untuk memeriksa.",
    }));

    return { success: true, data: items };
  } catch (error) {
    console.error("Gagal mengambil perangkat jaringan:", error);
    return { success: false, message: "Gagal memuat daftar perangkat jaringan dari database." };
  }
}

/**
 * 3. Tambah Perangkat / Server Baru ke Pemantauan Jaringan Internal
 */
export async function addNetworkDeviceAction(params: {
  name: string;
  host: string;
  port: number;
  category: string;
}): Promise<{
  success: boolean;
  data?: NetworkDeviceItem;
  message?: string;
}> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== Role.SUPERADMIN) {
    return { success: false, message: "Akses ditolak. Memerlukan hak akses Super Admin." };
  }

  const name = params.name?.trim();
  const rawHost = params.host?.trim();
  const port = Number(params.port) || 80;
  const category = params.category?.trim() || "PC";

  if (!name) return { success: false, message: "Nama perangkat / PC / server harus diisi." };
  if (!rawHost) return { success: false, message: "Alamat IP atau Hostname target harus diisi." };
  if (port < 1 || port > 65535) {
    return { success: false, message: "Nomor port harus berada di antara 1 dan 65535." };
  }

  const host = rawHost.replace(/[^a-zA-Z0-9.-]/g, "");
  const id = crypto.randomUUID();
  const createdAt = new Date();

  try {
    await prisma.$executeRawUnsafe(
      "INSERT INTO `network_device_targets` (`id`, `name`, `host`, `port`, `category`, `createdAt`) VALUES (?, ?, ?, ?, ?, ?)",
      id,
      name,
      host,
      port,
      category,
      createdAt
    );

    const newItem: NetworkDeviceItem = {
      id,
      name,
      host,
      port,
      category,
      createdAt: createdAt.toISOString(),
      status: "UNTESTED",
      message: "Baru ditambahkan. Siap diuji.",
    };

    return { success: true, data: newItem, message: `Perangkat '${name}' berhasil ditambahkan.` };
  } catch (error) {
    console.error("Gagal menambah perangkat:", error);
    return { success: false, message: "Terjadi kegagalan saat menyimpan perangkat ke database." };
  }
}

/**
 * 4. Hapus Perangkat / Server dari Pemantauan Jaringan Internal
 */
export async function deleteNetworkDeviceAction(id: string): Promise<{
  success: boolean;
  message?: string;
}> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== Role.SUPERADMIN) {
    return { success: false, message: "Akses ditolak. Memerlukan hak akses Super Admin." };
  }

  if (!id) return { success: false, message: "ID perangkat tidak valid." };

  try {
    await prisma.$executeRawUnsafe("DELETE FROM `network_device_targets` WHERE `id` = ?", id);
    return { success: true, message: "Perangkat berhasil dihapus dari pemantauan." };
  } catch (error) {
    console.error("Gagal menghapus perangkat:", error);
    return { success: false, message: "Gagal menghapus perangkat dari database." };
  }
}

/**
 * 5. Uji TCP Socket Koneksi ke Host & Port Tertentu
 */
export async function pingDeviceConnection(
  host: string,
  port: number,
  timeoutMs = 3000
): Promise<PingResult> {
  const timestamp = new Date().toISOString();
  return new Promise((resolve) => {
    const startTime = performance.now();
    const socket = new net.Socket();
    let isResolved = false;

    socket.setTimeout(timeoutMs);

    const finish = (result: PingResult) => {
      if (!isResolved) {
        isResolved = true;
        socket.destroy();
        resolve(result);
      }
    };

    socket.on("connect", () => {
      const latencyMs = parseFloat((performance.now() - startTime).toFixed(2));
      finish({
        reachable: true,
        host,
        port,
        latencyMs,
        state: "OPEN",
        message: `Port ${port} Terbuka & Online (${latencyMs} ms).`,
        timestamp,
      });
    });

    socket.on("timeout", () => {
      finish({
        reachable: false,
        host,
        port,
        latencyMs: timeoutMs,
        state: "TIMEOUT",
        message: `Batas waktu (${timeoutMs} ms) terlampaui. Perangkat tidak merespon / RTO.`,
        timestamp,
      });
    });

    socket.on("error", (err: NodeJS.ErrnoException) => {
      const latencyMs = parseFloat((performance.now() - startTime).toFixed(2));
      if (err.code === "ECONNREFUSED") {
        finish({
          reachable: true,
          host,
          port,
          latencyMs,
          state: "CLOSED",
          message: `Host Aktif (${latencyMs} ms), namun Port ${port} tertutup / belum listen.`,
          timestamp,
        });
      } else if (err.code === "EHOSTUNREACH" || err.code === "ENETUNREACH") {
        finish({
          reachable: false,
          host,
          port,
          latencyMs,
          state: "UNREACHABLE",
          message: `Routing terputus / Host tidak dapat dijangkau.`,
          timestamp,
        });
      } else {
        finish({
          reachable: false,
          host,
          port,
          latencyMs,
          state: "ERROR",
          message: err.message || "Gagal menghubungi host.",
          timestamp,
        });
      }
    });

    socket.connect(port, host);
  });
}

/**
 * 6. Eksekusi Uji 1 Perangkat Berdasarkan Host & Port (Dipicu Tombol Trigger)
 */
export async function testSingleDeviceAction(params: {
  host: string;
  port: number;
  timeoutMs?: number;
}): Promise<{
  success: boolean;
  data?: PingResult;
  message?: string;
}> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== Role.SUPERADMIN) {
    return { success: false, message: "Akses ditolak. Memerlukan hak akses Super Admin." };
  }

  const host = params.host?.trim();
  const port = Number(params.port) || 80;
  if (!host) return { success: false, message: "Host tidak boleh kosong." };

  const result = await pingDeviceConnection(host, port, params.timeoutMs || 3000);
  return { success: true, data: result };
}

/**
 * 7. Eksekusi Uji Semua Perangkat Sekaligus (Dipicu Tombol Trigger Utama)
 */
export async function testAllDevicesAction(
  devices: Array<{ id: string; host: string; port: number }>
): Promise<{
  success: boolean;
  data?: Record<string, PingResult>;
  message?: string;
}> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== Role.SUPERADMIN) {
    return { success: false, message: "Akses ditolak. Memerlukan hak akses Super Admin." };
  }

  const results: Record<string, PingResult> = {};

  await Promise.all(
    devices.map(async (dev) => {
      const res = await pingDeviceConnection(dev.host, dev.port, 3500);
      results[dev.id] = res;
    })
  );

  return { success: true, data: results };
}

/**
 * 8. Mengambil Daftar Endpoint API & Web Service Eksternal (Status awal UNTESTED)
 */
export async function getExternalEndpointsAction(): Promise<{
  success: boolean;
  data?: ExternalEndpointItem[];
  message?: string;
}> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== Role.SUPERADMIN) {
    return { success: false, message: "Akses ditolak. Memerlukan hak akses Super Admin." };
  }

  try {
    const rows = await prisma.$queryRawUnsafe<
      Array<{
        id: string;
        name: string;
        description: string | null;
        targetUrl: string;
        type: string;
        httpMethod: string;
        createdAt: Date;
      }>
    >("SELECT * FROM `external_endpoint_targets` ORDER BY `createdAt` ASC");

    // Jika masih kosong, seeding lengkap termasuk aneka service BPJS
    if (rows.length === 0) {
      const defaultEndpoints = [
        {
          id: crypto.randomUUID(),
          name: "BPJS V-Claim Rest API",
          description: "Klaim, Penerbitan SEP & Rujukan Pasien JKN",
          targetUrl: "https://apijkn.bpjs-kesehatan.go.id/vclaim-rest",
          type: "BPJS",
          httpMethod: "HEAD",
        },
        {
          id: crypto.randomUUID(),
          name: "BPJS Antrean Online Faskes",
          description: "Bridging Antrean Pasien Mobile JKN & Poliklinik",
          targetUrl: "https://apijkn.bpjs-kesehatan.go.id/antreanrs",
          type: "BPJS",
          httpMethod: "HEAD",
        },
        {
          id: crypto.randomUUID(),
          name: "BPJS I-Care JKN",
          description: "Riwayat Pelayanan Medis Peserta Antar Faskes",
          targetUrl: "https://apijkn.bpjs-kesehatan.go.id/ihs",
          type: "BPJS",
          httpMethod: "HEAD",
        },
        {
          id: crypto.randomUUID(),
          name: "BPJS Aplicares Bed Availability",
          description: "Pembaruan Ketersediaan Tempat Tidur Real-time",
          targetUrl: "https://dvlp.bpjs-kesehatan.go.id:8888/aplicaresws",
          type: "BPJS",
          httpMethod: "HEAD",
        },
        {
          id: crypto.randomUUID(),
          name: "Kemenkes SatuSehat Platform",
          description: "Gateway Interoperabilitas Rekam Medis Elektronik (RME)",
          targetUrl: "https://satusehat.kemkes.go.id",
          type: "KEMENKES",
          httpMethod: "HEAD",
        },
        {
          id: crypto.randomUUID(),
          name: "Cloudflare Public DNS Gateway",
          description: "Uji latensi internet gateway & resolusi DNS 1.1.1.1",
          targetUrl: "https://1.1.1.1",
          type: "PUBLIC_DNS",
          httpMethod: "HEAD",
        },
        {
          id: crypto.randomUUID(),
          name: "Google Public DNS Gateway",
          description: "Jalur cadangan gateway internet publik dns.google",
          targetUrl: "https://dns.google",
          type: "PUBLIC_DNS",
          httpMethod: "HEAD",
        },
      ];

      for (const ep of defaultEndpoints) {
        await prisma.$executeRawUnsafe(
          "INSERT INTO `external_endpoint_targets` (`id`, `name`, `description`, `targetUrl`, `type`, `httpMethod`, `createdAt`) VALUES (?, ?, ?, ?, ?, ?, NOW())",
          ep.id,
          ep.name,
          ep.description,
          ep.targetUrl,
          ep.type,
          ep.httpMethod
        );
      }

      const seeded = defaultEndpoints.map((ep) => ({
        ...ep,
        createdAt: new Date().toISOString(),
        status: "UNTESTED" as const,
        message: "Belum diuji. Tekan tombol Uji untuk memeriksa.",
      }));

      return { success: true, data: seeded };
    }

    const items: ExternalEndpointItem[] = rows.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      targetUrl: r.targetUrl,
      type: r.type,
      httpMethod: r.httpMethod || "HEAD",
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
      status: "UNTESTED",
      message: "Belum diuji. Tekan tombol Uji untuk memeriksa.",
    }));

    return { success: true, data: items };
  } catch (error) {
    console.error("Gagal mengambil endpoint eksternal:", error);
    return { success: false, message: "Gagal memuat daftar endpoint eksternal dari database." };
  }
}

/**
 * 9. Tambah Endpoint API / Web Service Baru ke Pemantauan
 */
export async function addExternalEndpointAction(params: {
  name: string;
  description?: string;
  targetUrl: string;
  type: string;
  httpMethod: string;
}): Promise<{
  success: boolean;
  data?: ExternalEndpointItem;
  message?: string;
}> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== Role.SUPERADMIN) {
    return { success: false, message: "Akses ditolak. Memerlukan hak akses Super Admin." };
  }

  const name = params.name?.trim();
  let rawUrl = params.targetUrl?.trim();
  const description = params.description?.trim() || null;
  const type = params.type?.trim() || "BPJS";
  const httpMethod = params.httpMethod?.trim() || "HEAD";

  if (!name) return { success: false, message: "Nama layanan API / Web harus diisi." };
  if (!rawUrl) return { success: false, message: "Target URL harus diisi." };

  if (!rawUrl.startsWith("http://") && !rawUrl.startsWith("https://")) {
    rawUrl = `https://${rawUrl}`;
  }

  try {
    new URL(rawUrl);
  } catch {
    return { success: false, message: "Format URL tidak valid. Contoh: https://apijkn.bpjs-kesehatan.go.id" };
  }

  const id = crypto.randomUUID();
  const createdAt = new Date();

  try {
    await prisma.$executeRawUnsafe(
      "INSERT INTO `external_endpoint_targets` (`id`, `name`, `description`, `targetUrl`, `type`, `httpMethod`, `createdAt`) VALUES (?, ?, ?, ?, ?, ?, ?)",
      id,
      name,
      description,
      rawUrl,
      type,
      httpMethod,
      createdAt
    );

    const newItem: ExternalEndpointItem = {
      id,
      name,
      description,
      targetUrl: rawUrl,
      type,
      httpMethod,
      createdAt: createdAt.toISOString(),
      status: "UNTESTED",
      message: "Baru ditambahkan. Siap diuji.",
    };

    return { success: true, data: newItem, message: `Layanan '${name}' berhasil ditambahkan.` };
  } catch (error) {
    console.error("Gagal menambah endpoint:", error);
    return { success: false, message: "Gagal menyimpan endpoint ke database." };
  }
}

/**
 * 10. Hapus Endpoint API / Web Service dari Pemantauan
 */
export async function deleteExternalEndpointAction(id: string): Promise<{
  success: boolean;
  message?: string;
}> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== Role.SUPERADMIN) {
    return { success: false, message: "Akses ditolak. Memerlukan hak akses Super Admin." };
  }

  if (!id) return { success: false, message: "ID endpoint tidak valid." };

  try {
    await prisma.$executeRawUnsafe("DELETE FROM `external_endpoint_targets` WHERE `id` = ?", id);
    return { success: true, message: "Endpoint layanan berhasil dihapus dari pemantauan." };
  } catch (error) {
    console.error("Gagal menghapus endpoint:", error);
    return { success: false, message: "Gagal menghapus endpoint dari database." };
  }
}

/**
 * 11. Helper Eksekusi Uji 1 URL / Endpoint HTTP(S)
 */
export async function pingUrlConnection(
  url: string,
  method = "HEAD",
  timeoutMs = 6000
): Promise<UrlTestResult> {
  const timestamp = new Date().toISOString();
  const startTime = performance.now();

  try {
    const response = await fetch(url, {
      method: method === "GET" ? "GET" : "HEAD",
      headers: {
        "User-Agent": "SIATI-Hospital-Network-Monitor/2.0",
        Accept: "*/*",
      },
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });

    const latencyMs = parseFloat((performance.now() - startTime).toFixed(2));
    const serverHeader = response.headers.get("server") || undefined;
    const sslSecure = url.startsWith("https://");

    return {
      reachable: response.status < 500,
      url,
      method,
      statusCode: response.status,
      statusText: response.statusText,
      latencyMs,
      sslSecure,
      serverHeader,
      message: `HTTP ${response.status} ${response.statusText || "OK"} (${latencyMs} ms).`,
      timestamp,
    };
  } catch (err: unknown) {
    const latencyMs = parseFloat((performance.now() - startTime).toFixed(2));
    const msg = err instanceof Error ? err.message : "Koneksi terputus";

    return {
      reachable: false,
      url,
      method,
      latencyMs,
      sslSecure: url.startsWith("https://"),
      message: `Koneksi gagal atau timeout: ${msg}`,
      timestamp,
    };
  }
}

/**
 * 12. Eksekusi Uji 1 Endpoint (Dipicu Tombol Trigger)
 */
export async function testSingleEndpointAction(params: {
  url: string;
  method?: string;
  timeoutMs?: number;
}): Promise<{
  success: boolean;
  data?: UrlTestResult;
  message?: string;
}> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== Role.SUPERADMIN) {
    return { success: false, message: "Akses ditolak. Memerlukan hak akses Super Admin." };
  }

  const url = params.url?.trim();
  if (!url) return { success: false, message: "URL tidak boleh kosong." };

  const result = await pingUrlConnection(url, params.method || "HEAD", params.timeoutMs || 6000);
  return { success: true, data: result };
}

/**
 * 13. Eksekusi Uji Semua Endpoint API Sekaligus (Dipicu Tombol Trigger Utama)
 */
export async function testAllEndpointsAction(
  endpoints: Array<{ id: string; targetUrl: string; httpMethod?: string }>
): Promise<{
  success: boolean;
  data?: Record<string, UrlTestResult>;
  message?: string;
}> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== Role.SUPERADMIN) {
    return { success: false, message: "Akses ditolak. Memerlukan hak akses Super Admin." };
  }

  const results: Record<string, UrlTestResult> = {};

  await Promise.all(
    endpoints.map(async (ep) => {
      const res = await pingUrlConnection(ep.targetUrl, ep.httpMethod || "HEAD", 6000);
      results[ep.id] = res;
    })
  );

  return { success: true, data: results };
}
