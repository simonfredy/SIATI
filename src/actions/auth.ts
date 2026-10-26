"use server";

import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations";
import { verifyCaptcha } from "@/lib/captcha";
import {
  verifyPassword,
  hashPassword,
  signSessionToken,
  setSessionCookie,
  clearSessionCookie,
  getCurrentUser,
} from "@/lib/auth";
import { headers } from "next/headers";

export interface ActionResult<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  fieldErrors?: Record<string, string>;
  errorType?: "CAPTCHA_ERROR" | "CREDENTIALS_ERROR" | "ACCOUNT_LOCKED" | "GENERAL_ERROR";
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
      errorType: "GENERAL_ERROR",
    };
  }

  const { username, password, captchaToken, captchaAnswer } = validation.data;

  // Verify CAPTCHA before password hashing to protect against CPU exhaustion.
  const captchaCheck = await verifyCaptcha(captchaToken, captchaAnswer, ipAddress);
  if (!captchaCheck.success) {
    return {
      success: false,
      message: captchaCheck.error || "Kode CAPTCHA yang Anda masukkan salah atau sudah kedaluwarsa.",
      fieldErrors: { captchaAnswer: captchaCheck.error || "Kode CAPTCHA salah atau kedaluwarsa." },
      errorType: "CAPTCHA_ERROR",
    };
  }

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
      message: "Username atau Kata Sandi yang Anda masukkan salah.",
      fieldErrors: {
        username: "Username atau kata sandi tidak cocok.",
        password: "Username atau kata sandi tidak cocok.",
      },
      errorType: "CREDENTIALS_ERROR",
    };
  }

  if (!user.isActive) {
    return {
      success: false,
      message: "Akun ini telah dinonaktifkan. Hubungi Tim TI.",
      fieldErrors: {
        username: "Akun ini telah dinonaktifkan.",
      },
      errorType: "GENERAL_ERROR",
    };
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / (60 * 1000));
    return {
      success: false,
      message: `Akun terkunci sementara karena 5x gagal login. Coba lagi dalam ${minutesLeft} menit.`,
      fieldErrors: {
        username: "Akun sedang terkunci sementara.",
        password: "Akun sedang terkunci sementara.",
      },
      errorType: "ACCOUNT_LOCKED",
    };
  }

  const isPasswordValid = await verifyPassword(password, user.passwordHash);

  if (!isPasswordValid) {
    const updatedFailedCount = user.failedLoginCount + 1;
    let lockTime: Date | null = null;

    if (updatedFailedCount >= 5) {
      lockTime = new Date(Date.now() + 15 * 60 * 1000);
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

    if (updatedFailedCount >= 5) {
      return {
        success: false,
        message: "Akun ini terkunci sementara selama 15 menit akibat 5x percobaan gagal.",
        fieldErrors: {
          username: "Akun terkunci sementara.",
          password: "Akun terkunci sementara.",
        },
        errorType: "ACCOUNT_LOCKED",
      };
    }

    return {
      success: false,
      message: "Username atau Kata Sandi yang Anda masukkan salah.",
      fieldErrors: {
        username: "Username atau kata sandi salah.",
        password: "Username atau kata sandi salah.",
      },
      errorType: "CREDENTIALS_ERROR",
    };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginCount: 0,
      lockedUntil: null,
    },
  });

  const token = await signSessionToken({
    userId: user.id,
    username: user.username,
    nip: user.nip,
    fullName: user.fullName,
    role: user.role,
    departmentUnitId: user.departmentUnitId,
  });

  await setSessionCookie(token);

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

export async function changePasswordAction(formData: FormData): Promise<ActionResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return {
      success: false,
      message: "Sesi autentikasi telah berakhir. Silakan login kembali.",
      errorType: "GENERAL_ERROR",
    };
  }

  const reqHeaders = await headers();
  const ipAddress =
    reqHeaders.get("x-real-ip") ||
    reqHeaders.get("x-forwarded-for")?.split(",")[0].trim() ||
    "127.0.0.1";
  const userAgent = reqHeaders.get("user-agent") || "Unknown";

  const currentPassword = (formData.get("currentPassword") as string) || "";
  const newPassword = (formData.get("newPassword") as string) || "";
  const confirmPassword = (formData.get("confirmPassword") as string) || "";

  if (!currentPassword) {
    return {
      success: false,
      message: "Kata sandi saat ini harus diisi.",
      fieldErrors: { currentPassword: "Kata sandi saat ini wajib diisi." },
      errorType: "GENERAL_ERROR",
    };
  }

  if (!newPassword || newPassword.length < 8) {
    return {
      success: false,
      message: "Kata sandi baru minimal 8 karakter.",
      fieldErrors: { newPassword: "Kata sandi baru minimal 8 karakter." },
      errorType: "GENERAL_ERROR",
    };
  }

  if (!/[A-Z]/.test(newPassword)) {
    return {
      success: false,
      message: "Kata sandi baru harus mengandung minimal 1 huruf besar (A-Z).",
      fieldErrors: { newPassword: "Wajib mengandung huruf besar." },
      errorType: "GENERAL_ERROR",
    };
  }

  if (!/[0-9]/.test(newPassword)) {
    return {
      success: false,
      message: "Kata sandi baru harus mengandung minimal 1 angka (0-9).",
      fieldErrors: { newPassword: "Wajib mengandung angka." },
      errorType: "GENERAL_ERROR",
    };
  }

  if (!/[^A-Za-z0-9]/.test(newPassword)) {
    return {
      success: false,
      message: "Kata sandi baru harus mengandung minimal 1 karakter khusus/simbol.",
      fieldErrors: { newPassword: "Wajib mengandung karakter khusus." },
      errorType: "GENERAL_ERROR",
    };
  }

  if (newPassword !== confirmPassword) {
    return {
      success: false,
      message: "Konfirmasi kata sandi baru tidak cocok.",
      fieldErrors: { confirmPassword: "Konfirmasi kata sandi tidak cocok." },
      errorType: "GENERAL_ERROR",
    };
  }

  if (currentPassword === newPassword) {
    return {
      success: false,
      message: "Kata sandi baru tidak boleh sama dengan kata sandi saat ini.",
      fieldErrors: { newPassword: "Kata sandi baru tidak boleh sama dengan kata sandi lama." },
      errorType: "GENERAL_ERROR",
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: currentUser.userId },
  });

  if (!user || !user.isActive) {
    return {
      success: false,
      message: "Akun pengguna tidak ditemukan atau tidak aktif.",
      errorType: "GENERAL_ERROR",
    };
  }

  const isCurrentValid = await verifyPassword(currentPassword, user.passwordHash);
  if (!isCurrentValid) {
    await prisma.systemAuditLog.create({
      data: {
        userId: user.id,
        action: "PASSWORD_CHANGE_FAILED_WRONG_PASSWORD",
        ipAddress,
        userAgent,
        payload: { reason: "wrong_current_password" },
      },
    });

    return {
      success: false,
      message: "Kata sandi saat ini tidak sesuai.",
      fieldErrors: { currentPassword: "Kata sandi saat ini salah." },
      errorType: "CREDENTIALS_ERROR",
    };
  }

  const newHash = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: newHash,
      failedLoginCount: 0,
    },
  });

  await prisma.systemAuditLog.create({
    data: {
      userId: user.id,
      action: "PASSWORD_CHANGED_SUCCESS",
      ipAddress,
      userAgent,
      payload: { changedBy: user.username, role: user.role },
    },
  });

  return {
    success: true,
    message: "Kata sandi berhasil diperbarui.",
  };
}
