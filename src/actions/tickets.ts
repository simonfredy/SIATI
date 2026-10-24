"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createTicketSchema, updateTicketStatusSchema, rateTicketSchema } from "@/lib/validations";
import { TicketStatus, TicketUrgency, AttachmentType, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { broadcastRealtimeEvent } from "@/lib/realtime";

export interface ActionResult<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  fieldErrors?: Record<string, string>;
}

export interface AttachmentInput {
  storedFilename: string;
  originalName: string;
  fileType: "IMAGE" | "VIDEO";
  mimeType: string;
  fileSizeBytes: number;
  sha256Hash: string;
  durationSeconds?: number;
}

/**
 * Membuat Tiket Aduan Baru oleh Pegawai/Nakes
 * Dilengkapi Mekanisme Concurrency-Safe & Auto-Retry Loop untuk Penanganan Submit Bersamaan
 */
export async function createTicketAction(
  data: {
    unitId: number;
    categoryId: number;
    urgency?: TicketUrgency;
    description: string;
    attachments: AttachmentInput[];
  }
): Promise<ActionResult<{ ticketNumber: string; ticketId: string }>> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, message: "Akses ditolak. Silakan login terlebih dahulu." };
  }

  // 1. Validasi Input
  const validation = createTicketSchema.safeParse({
    unitId: Number(data.unitId),
    categoryId: Number(data.categoryId),
    urgency: data.urgency,
    description: data.description,
  });

  if (!validation.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of validation.error.issues) {
      fieldErrors[issue.path[0]?.toString() || "form"] = issue.message;
    }
    return { success: false, message: "Data aduan tidak valid.", fieldErrors };
  }

  try {
    // 2. Generate Nomor Tiket Urut Harian (TKT-YYYYMMDD-XXXX) dengan Concurrency Safe Loop
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const datePrefix = `${year}${month}${day}`;
    const ticketPrefix = `TKT-${datePrefix}-`;

    let ticket = null;
    let ticketNumber = "";
    const maxRetries = 5;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Cari tiket dengan urutan nomor tertinggi yang terbit pada hari ini
        const latestTicket = await prisma.ticket.findFirst({
          where: {
            ticketNumber: {
              startsWith: ticketPrefix,
            },
          },
          orderBy: {
            ticketNumber: "desc",
          },
          select: {
            ticketNumber: true,
          },
        });

        let nextSeq = 1;
        if (latestTicket && latestTicket.ticketNumber) {
          const parts = latestTicket.ticketNumber.split("-");
          const lastNum = parseInt(parts[parts.length - 1], 10);
          if (!isNaN(lastNum)) {
            nextSeq = lastNum + 1 + attempt;
          }
        } else {
          nextSeq = 1 + attempt;
        }

        const sequenceNumber = String(nextSeq).padStart(4, "0");
        ticketNumber = `${ticketPrefix}${sequenceNumber}`;

        // 3. Simpan Tiket ke Database MariaDB
        ticket = await prisma.ticket.create({
          data: {
            ticketNumber,
            reporterId: user.userId,
            unitId: validation.data.unitId,
            categoryId: validation.data.categoryId,
            urgency: validation.data.urgency,
            description: validation.data.description,
            status: TicketStatus.SUBMITTED,
            attachments: {
              create: (data.attachments || []).map((att) => ({
                fileType: att.fileType as AttachmentType,
                originalName: att.originalName,
                storedFilename: att.storedFilename,
                filePath: `uploads/${att.storedFilename}`,
                fileSizeBytes: att.fileSizeBytes,
                mimeType: att.mimeType,
                sha256Hash: att.sha256Hash,
                durationSeconds: att.durationSeconds || null,
              })),
            },
            timelineLogs: {
              create: {
                actorUserId: user.userId,
                actorName: user.fullName,
                previousStatus: null,
                newStatus: TicketStatus.SUBMITTED,
                notes: "Tiket berhasil diterbitkan oleh pelapor.",
              },
            },
          },
          include: {
            unit: true,
            category: true,
          },
        });

        // Sukses dibuat, keluar dari retry loop
        break;
      } catch (err) {
        // Jika ada pengguna lain yang membuat tiket di milidetik yang sama persis (P2002 unique constraint)
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === "P2002" &&
          attempt < maxRetries - 1
        ) {
          console.warn(`[Concurrency] Tabrakan nomor tiket ${ticketNumber} terdeteksi, mencoba ulang (${attempt + 1}/${maxRetries})...`);
          continue;
        }
        throw err;
      }
    }

    if (!ticket) {
      throw new Error("Gagal mengalokasikan nomor tiket urut setelah percobaan maksimal.");
    }

    // 4. Catat Audit Log
    await prisma.systemAuditLog.create({
      data: {
        userId: user.userId,
        action: "CREATE_TICKET",
        ipAddress: "127.0.0.1",
        userAgent: "Browser",
        payload: { ticketNumber, urgency: validation.data.urgency },
      },
    });

    // 5. Siarkan Notifikasi Real-Time (SSE)
    broadcastRealtimeEvent({
      type: "TICKET_CREATED",
      ticketId: ticket.id,
      ticketNumber: ticket.ticketNumber,
      urgency: ticket.urgency,
      status: ticket.status,
      unitName: ticket.unit.name,
      categoryName: ticket.category.name,
      reporterName: user.fullName,
      title: "Tiket Aduan Baru Masuk",
      message: `[${ticket.ticketNumber}] ${ticket.unit.name} - ${ticket.category.name} (${ticket.urgency})`,
      timestamp: Date.now(),
    });

    revalidatePath("/dashboard");
    return {
      success: true,
      message: `Tiket ${ticketNumber} berhasil dibuat!`,
      data: { ticketNumber, ticketId: ticket.id },
    };
  } catch (error) {
    console.error("Gagal membuat tiket:", error);
    return { success: false, message: "Terjadi kesalahan server saat menyimpan tiket." };
  }
}

/**
 * Memperbarui Status Tiket & Menghitung Stopwatch Waktu SLA (Menit)
 */
export async function updateTicketStatusAction(data: {
  ticketId: string;
  newStatus?: TicketStatus;
  urgency?: TicketUrgency;
  notes?: string;
  assignedTechnicianId?: string;
  silent?: boolean;
}): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, message: "Akses ditolak." };
  }

  const validation = updateTicketStatusSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, message: "Parameter status atau urgensi tidak valid." };
  }

  const { ticketId, newStatus, urgency, notes, assignedTechnicianId, silent } = validation.data;

  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return { success: false, message: "Tiket tidak ditemukan." };
    }

    const now = new Date();
    const updateData: Record<string, unknown> = {};

    if (urgency) {
      updateData.urgency = urgency;
    }

    if (newStatus) {
      updateData.status = newStatus;
    }

    // 1. Logika Durasi Respon (TTR): Saat tiket pertama kali di-assign ke teknisi
    if (newStatus === TicketStatus.ASSIGNED) {
      // Cegah race condition jika dua staf TI mengklik 'Ambil Tiket' secara bersamaan
      if (
        ticket.status !== TicketStatus.SUBMITTED &&
        ticket.assignedTechnicianId &&
        ticket.assignedTechnicianId !== (assignedTechnicianId || user.userId)
      ) {
        return {
          success: false,
          message: "Tiket ini baru saja diambil dan sedang ditangani oleh staf TI lain.",
        };
      }
      updateData.firstAssignedAt = ticket.firstAssignedAt || now;
      updateData.assignedTechnicianId = assignedTechnicianId || user.userId;
      const responseMinutes = Math.max(
        1,
        Math.round((now.getTime() - ticket.submittedAt.getTime()) / (60 * 1000))
      );
      updateData.responseMinutes = responseMinutes;
    }

    // 2. Logika Mulai Pengerjaan Lapangan (Work Started)
    if (newStatus === TicketStatus.IN_PROGRESS && !ticket.workStartedAt) {
      updateData.workStartedAt = now;
      if (!ticket.assignedTechnicianId) {
        updateData.assignedTechnicianId = user.userId;
      }
    }

    // 3. Logika Selesai Pengerjaan (Resolved) & Perhitungan Menit Kerja Bersih
    if (newStatus === TicketStatus.RESOLVED) {
      updateData.workResolvedAt = now;
      const startTime = ticket.workStartedAt || ticket.firstAssignedAt || ticket.submittedAt;
      const totalRawWorkMinutes = Math.max(
        1,
        Math.round((now.getTime() - startTime.getTime()) / (60 * 1000))
      );
      const cleanRepairMinutes = Math.max(
        1,
        totalRawWorkMinutes - (ticket.totalPendingMinutes || 0)
      );
      const totalLeadMinutes = Math.max(
        1,
        Math.round((now.getTime() - ticket.submittedAt.getTime()) / (60 * 1000))
      );

      updateData.repairMinutes = cleanRepairMinutes;
      updateData.totalLeadMinutes = totalLeadMinutes;
    }

    // 4. Logika Tiket Ditutup (Closed)
    if (newStatus === TicketStatus.CLOSED) {
      updateData.closedAt = now;
    }

    const finalStatus = newStatus || ticket.status;

    // Update Tiket dan Buat Timeline Log
    await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        ...updateData,
        timelineLogs: {
          create: {
            actorUserId: user.userId,
            actorName: user.fullName,
            previousStatus: ticket.status,
            newStatus: finalStatus,
            notes: notes || (urgency && !newStatus ? "Penyesuaian tingkat urgensi layanan" : urgency ? `Urgensi diset ke ${urgency}` : `Status diubah ke ${finalStatus}`),
          },
        },
      },
    });

    // Catat Audit Log
    await prisma.systemAuditLog.create({
      data: {
        userId: user.userId,
        action: urgency && !newStatus ? "TICKET_ADJUST_URGENCY" : urgency ? `TICKET_SET_URGENCY_${urgency}` : `TICKET_STATUS_${finalStatus}`,
        ipAddress: "127.0.0.1",
        userAgent: "Browser",
        payload: { ticketNumber: ticket.ticketNumber, previousStatus: ticket.status, newStatus: finalStatus, urgency, silent },
      },
    });

    // Siarkan Pembaruan Status Real-Time (SSE)
    // Sesuai aturan: Notifikasi HANYA untuk:
    // 1. Yang menangani tiket (ASSIGNED)
    // 2. Pergantian parts (PENDING_PARTS)
    // 3. Tiket selesai (RESOLVED / CLOSED)
    // Pergantian urgensi maupun perubahan status biasa TIDAK memunculkan notifikasi toast/audio.
    if (!silent) {
      if (newStatus === TicketStatus.ASSIGNED) {
        broadcastRealtimeEvent({
          type: "TICKET_ASSIGNED",
          ticketId: ticket.id,
          ticketNumber: ticket.ticketNumber,
          status: newStatus,
          urgency: (urgency || ticket.urgency) as string,
          technicianName: user.fullName,
          title: "Penugasan Staf TI",
          message: `[${ticket.ticketNumber}] Tiket sedang ditangani oleh ${user.fullName}.`,
          timestamp: Date.now(),
        });
      } else if (newStatus === TicketStatus.PENDING_PARTS) {
        broadcastRealtimeEvent({
          type: "TICKET_PENDING_PARTS",
          ticketId: ticket.id,
          ticketNumber: ticket.ticketNumber,
          status: newStatus,
          urgency: (urgency || ticket.urgency) as string,
          technicianName: user.fullName,
          title: "Menunggu Pergantian Suku Cadang",
          message: `[${ticket.ticketNumber}] Tiket membutuhkan suku cadang/part pengganti (${user.fullName}).`,
          timestamp: Date.now(),
        });
      } else if (newStatus === TicketStatus.RESOLVED || newStatus === TicketStatus.CLOSED) {
        broadcastRealtimeEvent({
          type: "TICKET_RESOLVED",
          ticketId: ticket.id,
          ticketNumber: ticket.ticketNumber,
          status: newStatus,
          urgency: (urgency || ticket.urgency) as string,
          technicianName: user.fullName,
          title: "Tiket Selesai Dikerjakan",
          message: `[${ticket.ticketNumber}] Kendala fasilitas TI telah berhasil diselesaikan oleh ${user.fullName}.`,
          timestamp: Date.now(),
        });
      } else {
        // Untuk pergantian urgensi atau status pengerjaan biasa (IN_PROGRESS),
        // hanya kirim event SYSTEM_UPDATE senyap agar data UI ter-refresh tanpa memicu notifikasi/suara
        broadcastRealtimeEvent({
          type: "SYSTEM_UPDATE",
          ticketId: ticket.id,
          ticketNumber: ticket.ticketNumber,
          status: finalStatus,
          urgency: (urgency || ticket.urgency) as string,
          title: "Pembaruan Data",
          message: `Tiket ${ticket.ticketNumber} diperbarui`,
          timestamp: Date.now(),
        });
      }
    }

    revalidatePath("/dashboard");
    return { success: true, message: "Tiket berhasil diperbarui." };
  } catch (error) {
    console.error("Gagal memperbarui status tiket:", error);
    return { success: false, message: "Terjadi kesalahan saat memperbarui tiket." };
  }
}

/**
 * Memberikan Penilaian Bintang 1-5 untuk Tiket yang Telah Selesai
 */
export async function rateTicketAction(data: {
  ticketId: string;
  ratingScore: number;
  feedback?: string;
}): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, message: "Akses ditolak." };

  const validation = rateTicketSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, message: "Penilaian bintang harus antara 1 sampai 5." };
  }

  try {
    await prisma.ticketRating.upsert({
      where: { ticketId: validation.data.ticketId },
      update: {
        ratingScore: validation.data.ratingScore,
        feedback: validation.data.feedback,
      },
      create: {
        ticketId: validation.data.ticketId,
        ratingScore: validation.data.ratingScore,
        feedback: validation.data.feedback,
      },
    });

    // Siarkan Event Penilaian Tiket (SSE)
    broadcastRealtimeEvent({
      type: "TICKET_RATED",
      ticketId: validation.data.ticketId,
      title: "Penilaian Layanan TI Masuk",
      message: `Pelapor memberikan skor bintang ${validation.data.ratingScore} / 5.`,
      timestamp: Date.now(),
    });

    revalidatePath("/dashboard");
    return { success: true, message: "Terima kasih atas penilaian Anda terhadap layanan IT RS!" };
  } catch (error) {
    console.error("Gagal menyimpan ulasan tiket:", error);
    return { success: false, message: "Gagal menyimpan ulasan." };
  }
}
