import { EventEmitter } from "events";

export type RealtimeEventType =
  | "TICKET_CREATED"
  | "TICKET_ASSIGNED"
  | "TICKET_PENDING_PARTS"
  | "TICKET_RESOLVED"
  | "TICKET_UPDATED"
  | "TICKET_RATED"
  | "SYSTEM_UPDATE";

export interface RealtimeEventPayload {
  type: RealtimeEventType;
  ticketId?: string;
  ticketNumber?: string;
  urgency?: string;
  status?: string;
  unitName?: string;
  categoryName?: string;
  reporterName?: string;
  technicianName?: string;
  title: string;
  message: string;
  timestamp: number;
  entity?: string;
}

// Global singleton EventEmitter across hot-reloads and requests in Node.js runtime
const globalForRealtime = globalThis as unknown as {
  realtimeEmitter?: EventEmitter;
};

export const realtimeEmitter =
  globalForRealtime.realtimeEmitter ?? new EventEmitter();

realtimeEmitter.setMaxListeners(250);

if (process.env.NODE_ENV !== "production") {
  globalForRealtime.realtimeEmitter = realtimeEmitter;
}

/**
 * Mendorong event real-time ke seluruh klien yang sedang terhubung melalui Server-Sent Events (SSE)
 */
export function broadcastRealtimeEvent(event: RealtimeEventPayload) {
  try {
    realtimeEmitter.emit("siati_event", event);
  } catch (err) {
    console.error("Gagal menyiarkan event real-time:", err);
  }
}
