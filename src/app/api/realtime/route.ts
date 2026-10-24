import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { realtimeEmitter, RealtimeEventPayload } from "@/lib/realtime";

/**
 * Route Handler Server-Sent Events (SSE) untuk Siaran Real-Time SIATI
 * Memungkinkan pembaruan data tiket dan analitik secara instan tanpa reload browser.
 */
export async function GET(req: NextRequest) {
  // 1. Verifikasi Keamanan Sesi Pengguna
  const user = await getCurrentUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Akses ditolak. Sesi tidak valid." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();

  // 2. Buat Stream Respons SSE
  const stream = new ReadableStream({
    start(controller) {
      // Kirim event jabat tangan awal (Handshake)
      controller.enqueue(
        encoder.encode(
          `event: connected\ndata: ${JSON.stringify({
            status: "connected",
            userId: user.userId,
            fullName: user.fullName,
            role: user.role,
            timestamp: Date.now(),
          })}\n\n`
        )
      );

      // Listener untuk menangkap event dari Server Actions
      const handleEvent = (payload: RealtimeEventPayload) => {
        try {
          const sseMessage = `event: update\ndata: ${JSON.stringify(payload)}\n\n`;
          controller.enqueue(encoder.encode(sseMessage));
        } catch (err) {
          console.error("Gagal mengirim event SSE ke klien:", err);
        }
      };

      realtimeEmitter.on("siati_event", handleEvent);

      // Heartbeat ping berkala (setiap 20 detik) untuk menjaga koneksi tetap hidup melalui Nginx / firewall
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          clearInterval(pingInterval);
        }
      }, 20000);

      // Bersihkan listener saat klien menutup browser atau koneksi terputus
      req.signal.addEventListener("abort", () => {
        realtimeEmitter.off("siati_event", handleEvent);
        clearInterval(pingInterval);
        try {
          controller.close();
        } catch {
          // ignore stream already closed
        }
      });
    },
    cancel() {
      // Penanganan pembatalan stream
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no", // Instruksi khusus untuk mematikan proxy buffering di Nginx
    },
  });
}
