"use server";

import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations";
import { verifyCaptcha } from "@/lib/captcha";
import { verifyPassword, signSessionToken, setSessionCookie, clearSessionCookie } from "@/lib/auth";
import { headers } from "next/headers";

export interface ActionResult<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  fieldErrors?: Record<string, string>;
}

export async function loginAction(formData: FormData): Promise<ActionResult> {
  const reqHeaders = await headers();
  const ipAddress =
    reqHeaders.get("x-real-ip") ||
    reqHeaders.get("x-forwarded-for")?.split(",")[0].trim() ||
    "127.0.0.1";
  const userAgent = reqHeaders.get("user-agent") || "Unknown";

  const rawData = {
    username: formData.get("username"),
    password: formData.get("password"),
    captchaToken: formData.get("captchaToken"),
    captchaAnswer: formData.get("captchaAnswer"),
  };

  // 1. Validasi Skema Input dengan Zod
  const validation = loginSchema.safeParse(rawData);
  if (!validation.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of validation.error.issues) {
      const key = issue.path[0]?.toString() || "form";
      fieldErrors[key] = issue.message;
    }
    return {
      success: false,
      message: "Data input login tidak valid.",
      fieldErrors,
    };
  }

  const { username, password, captchaToken, captchaAnswer } = validation.data;

  // 2. Pre-Auth Gate: Verifikasi CAPTCHA terlebih dahulu (Mencegah CPU Exhaustion DoS)
  const captchaCheck = await verifyCaptcha(captchaToken, captchaAnswer, ipAddress);
  if (!captchaCheck.success) {
    return {
      success: false,
      message: captchaCheck.error || "Validasi CAPTCHA gagal. Silakan ulangi.",
      fieldErrors: { captchaAnswer: captchaCheck.error || "Jawaban salah" },
    };
  }

  // 3. Cari Pengguna Berdasarkan Username (Nama Depan) atau NIP
  const normalizedUsername = username.toLowerCase();
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { username: normalizedUsername },
        { nip: username },
      ],
    },
  });

  if (!user) {
    // Audit Log login gagal (User tidak ditemukan)
    await prisma.systemAuditLog.create({
      data: {
        action: "FAILED_LOGIN_USER_NOT_FOUND",
        ipAddress,
        userAgent,
        payload: { username },
      },
    });

    return {
      success: false,
      message: "Username atau Password yang Anda masukkan salah.",
    };
  }

  // 4. Periksa apakah akun dinonaktifkan atau terkunci
  if (!user.isActive) {
    return {
      success: false,
      message: "Akun ini telah dinonaktifkan. Hubungi Tim SIMRS.",
    };
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / (60 * 1000));
    return {
      success: false,
      message: `Akun terkunci sementara karena 5x gagal login. Coba lagi dalam ${minutesLeft} menit.`,
    };
  }

  // 5. Verifikasi Password Hashing
  const isPasswordValid = await verifyPassword(password, user.passwordHash);

  if (!isPasswordValid) {
    const updatedFailedCount = user.failedLoginCount + 1;
    let lockTime: Date | null = null;

    if (updatedFailedCount >= 5) {
      lockTime = new Date(Date.now() + 15 * 60 * 1000); // Kunci 15 menit
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: updatedFailedCount,
        lockedUntil: lockTime,
      },
    });

    await prisma.systemAuditLog.create({
      data: {
        userId: user.id,
        action: "FAILED_LOGIN_WRONG_PASSWORD",
        ipAddress,
        userAgent,
        payload: { attemptCount: updatedFailedCount },
      },
    });

    return {
      success: false,
      message:
        updatedFailedCount >= 5
          ? "Akun Anda terkunci selama 15 menit akibat 5x salah password."
          : `Password salah (${updatedFailedCount}/5 percobaan).`,
    };
  }

  // 6. Reset Failed Count & Perbarui Sesi
  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginCount: 0,
      lockedUntil: null,
    },
  });

  // 7. Generate JWT Signed Token & Pasang Secure Cookie
  const token = await signSessionToken({
    userId: user.id,
    username: user.username,
    nip: user.nip,
    fullName: user.fullName,
    role: user.role,
    departmentUnitId: user.departmentUnitId,
  });

  await setSessionCookie(token);

  // 8. Catat Audit Log Login Berhasil
  await prisma.systemAuditLog.create({
    data: {
      userId: user.id,
      action: "LOGIN_SUCCESS",
      ipAddress,
      userAgent,
      payload: { role: user.role },
    },
  });

  return {
    success: true,
    message: "Login berhasil. Mengalihkan...",
    data: {
      role: user.role,
      fullName: user.fullName,
    },
  };
}

export async function logoutAction(): Promise<ActionResult> {
  await clearSessionCookie();
  return {
    success: true,
    message: "Berhasil keluar dari sistem.",
  };
}
