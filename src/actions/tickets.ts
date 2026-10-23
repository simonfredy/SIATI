"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createTicketSchema, updateTicketStatusSchema, rateTicketSchema } from "@/lib/validations";
import { TicketStatus, TicketUrgency, AttachmentType } from "@prisma/client";
import { revalidatePath } from "next/cache";

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
 */
export async function createTicketAction(
  data: {
    unitId: number;
    categoryId: number;
    urgency: TicketUrgency;
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
    // 2. Generate Nomor Tiket Urut Harian (TKT-YYYYMMDD-XXXX)
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const datePrefix = `${year}${month}${day}`;

    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const todayCount = await prisma.ticket.count({
      where: {
        submittedAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    const sequenceNumber = String(todayCount + 1).padStart(4, "0");
    const ticketNumber = `TKT-${datePrefix}-${sequenceNumber}`;

    // 3. Simpan Tiket ke Database MariaDB
    const ticket = await prisma.ticket.create({
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
    });

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
  newStatus: TicketStatus;
  notes?: string;
  assignedTechnicianId?: string;
}): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, message: "Akses ditolak." };
  }

  const validation = updateTicketStatusSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, message: "Parameter status tidak valid." };
  }

  const { ticketId, newStatus, notes, assignedTechnicianId } = validation.data;

  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return { success: false, message: "Tiket tidak ditemukan." };
    }

    const now = new Date();
    const updateData: Record<string, unknown> = {
      status: newStatus,
    };

    // 1. Logika Durasi Respon (TTR): Saat tiket pertama kali di-assign ke teknisi
    if (newStatus === TicketStatus.ASSIGNED) {
      updateData.firstAssignedAt = now;
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
            newStatus,
            notes: notes || `Status diubah ke ${newStatus}`,
          },
        },
      },
    });

    // Catat Audit Log
    await prisma.systemAuditLog.create({
      data: {
        userId: user.userId,
        action: `TICKET_STATUS_${newStatus}`,
        ipAddress: "127.0.0.1",
        userAgent: "Browser",
        payload: { ticketNumber: ticket.ticketNumber, previousStatus: ticket.status, newStatus },
      },
    });

    revalidatePath("/dashboard");
    return { success: true, message: `Status tiket berhasil diubah menjadi ${newStatus}.` };
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

    revalidatePath("/dashboard");
    return { success: true, message: "Terima kasih atas penilaian Anda terhadap layanan IT RS!" };
  } catch (error) {
    console.error("Gagal menyimpan ulasan tiket:", error);
    return { success: false, message: "Gagal menyimpan ulasan." };
  }
}
