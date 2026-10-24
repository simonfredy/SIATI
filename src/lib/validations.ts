import { z } from "zod";

export const loginSchema = z.object({
  username: z
    .string()
    .min(3, "Username minimal 3 karakter")
    .max(50, "Username terlalu panjang")
    .trim(),
  password: z
    .string()
    .min(6, "Password minimal 6 karakter")
    .max(100, "Password terlalu panjang"),
  captchaToken: z.string().min(1, "Token CAPTCHA tidak valid"),
  captchaAnswer: z.string().min(1, "Kode CAPTCHA wajib diisi"),
});

export const createTicketSchema = z.object({
  unitId: z.number().int().positive(),
  categoryId: z.number().int().positive(),
  urgency: z.enum(["EMERGENCY", "HIGH", "MEDIUM", "LOW"]).optional().default("MEDIUM"),
  description: z
    .string()
    .min(10, "Deskripsikan gejala kerusakan minimal 10 karakter")
    .max(2000, "Deskripsi masalah maksimal 2000 karakter")
    .trim(),
  attachmentIds: z.array(z.string().uuid()).optional().default([]),
});

export const updateTicketStatusSchema = z.object({
  ticketId: z.string().uuid("ID Tiket tidak valid"),
  newStatus: z.enum([
    "SUBMITTED",
    "ASSIGNED",
    "IN_PROGRESS",
    "PENDING_PARTS",
    "RESOLVED",
    "CLOSED",
    "REJECTED",
  ]).optional(),
  urgency: z.enum(["EMERGENCY", "HIGH", "MEDIUM", "LOW"]).optional(),
  notes: z.string().max(1000, "Catatan maksimal 1000 karakter").optional(),
  assignedTechnicianId: z.string().uuid().optional(),
  silent: z.boolean().optional(),
});

export const rateTicketSchema = z.object({
  ticketId: z.string().uuid("ID Tiket tidak valid"),
  ratingScore: z.number().int().min(1).max(5),
  feedback: z.string().max(500, "Ulasan maksimal 500 karakter").optional(),
});
