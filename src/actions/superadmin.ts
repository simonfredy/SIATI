"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hashPassword } from "@/lib/auth";
import { Role } from "@prisma/client";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { broadcastRealtimeEvent } from "@/lib/realtime";

export interface ActionResult<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface HospitalProfileItem {
  id: number;
  name: string;
  hospitalClass: string | null;
  ownershipType: string | null;
  phone: string | null;
  email: string | null;
  bpjsPpkCode: string | null;
  kemenkesCode: string | null;
  satuSehatId: string | null;
  address: string | null;
  logoUrl: string | null;
  website: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

async function getClientIpAndUa() {
  const reqHeaders = await headers();
  const ipAddress =
    reqHeaders.get("x-real-ip") ||
    reqHeaders.get("x-forwarded-for")?.split(",")[0].trim() ||
    "127.0.0.1";
  const userAgent = reqHeaders.get("user-agent") || "Unknown";
  return { ipAddress, userAgent };
}

/**
 * 1. Tambah Pengguna Baru (Hanya Superadmin)
 */
export async function createUserAction(formData: FormData): Promise<ActionResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== Role.SUPERADMIN) {
    return { success: false, message: "Akses ditolak. Tindakan ini membutuhkan hak akses SUPERADMIN." };
  }

  const { ipAddress, userAgent } = await getClientIpAndUa();

  const username = (formData.get("username") as string)?.trim().toLowerCase();
  const fullName = (formData.get("fullName") as string)?.trim();
  const nip = (formData.get("nip") as string)?.trim() || null;
  const phoneNumber = (formData.get("phoneNumber") as string)?.trim() || "081200000000";
  const role = (formData.get("role") as Role) || Role.STAFF_USER;
  const departmentUnitId = Number(formData.get("departmentUnitId"));
  const password = (formData.get("password") as string)?.trim() || "Password123!";
  const avatarUrl = (formData.get("avatarUrl") as string)?.trim() || null;

  if (!username || username.length < 3) {
    return { success: false, message: "Username (nama depan) minimal 3 karakter." };
  }

  if (!fullName || fullName.length < 3) {
    return { success: false, message: "Nama lengkap wajib diisi minimal 3 karakter." };
  }

  if (!departmentUnitId || isNaN(departmentUnitId)) {
    return { success: false, message: "Pilih unit/ruangan penempatan yang valid." };
  }

  // Cek apakah username sudah dipakai
  const existingUser = await prisma.user.findUnique({
    where: { username },
  });

  if (existingUser) {
    return { success: false, message: `Username '${username}' sudah digunakan oleh pengguna lain.` };
  }

  const passwordHash = await hashPassword(password);

  try {
    const newUser = await prisma.user.create({
      data: {
        username,
        fullName,
        nip,
        phoneNumber,
        avatarUrl,
        role,
        departmentUnitId,
        passwordHash,
      },
    });

    // Catat ke Audit Log
    await prisma.systemAuditLog.create({
      data: {
        userId: currentUser.userId,
        action: "SUPERADMIN_CREATE_USER",
        ipAddress,
        userAgent,
        payload: {
          createdUserId: newUser.id,
          username: newUser.username,
          role: newUser.role,
          departmentUnitId: newUser.departmentUnitId,
        },
      },
    });

    // Siarkan Event Pembaruan Master User (SSE)
    broadcastRealtimeEvent({
      type: "SYSTEM_UPDATE",
      entity: "USER",
      title: "Pengguna Baru Terdaftar",
      message: `Pengguna '${fullName}' (@${username}) berhasil didaftarkan.`,
      timestamp: Date.now(),
    });

    revalidatePath("/dashboard");
    return { success: true, message: `Pengguna '${fullName}' (${username}) berhasil didaftarkan.` };
  } catch (err: unknown) {
    const error = err as Error;
    return { success: false, message: error.message || "Gagal mendaftarkan pengguna." };
  }
}

/**
 * 2. Toggle Status Aktif / Nonaktif Pengguna
 */
export async function toggleUserStatusAction(userId: string): Promise<ActionResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== Role.SUPERADMIN) {
    return { success: false, message: "Akses ditolak. Tindakan ini membutuhkan hak akses SUPERADMIN." };
  }

  if (currentUser.userId === userId) {
    return { success: false, message: "Anda tidak dapat menonaktifkan akun Anda sendiri." };
  }

  const { ipAddress, userAgent } = await getClientIpAndUa();

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!targetUser) {
    return { success: false, message: "Pengguna tidak ditemukan." };
  }

  const newStatus = !targetUser.isActive;

  await prisma.user.update({
    where: { id: userId },
    data: {
      isActive: newStatus,
      failedLoginCount: 0,
      lockedUntil: null,
    },
  });

  await prisma.systemAuditLog.create({
    data: {
      userId: currentUser.userId,
      action: newStatus ? "SUPERADMIN_ACTIVATE_USER" : "SUPERADMIN_DEACTIVATE_USER",
      ipAddress,
      userAgent,
      payload: {
        targetUserId: targetUser.id,
        targetUsername: targetUser.username,
        newStatus,
      },
    },
  });

  // Siarkan Event Perubahan Status User (SSE)
  broadcastRealtimeEvent({
    type: "SYSTEM_UPDATE",
    entity: "USER",
    title: "Status Akun Berubah",
    message: `Akun '${targetUser.fullName}' diubah menjadi ${newStatus ? "Aktif" : "Nonaktif"}.`,
    timestamp: Date.now(),
  });

  revalidatePath("/dashboard");
  return {
    success: true,
    message: `Status pengguna '${targetUser.fullName}' berhasil diubah menjadi ${newStatus ? "Aktif" : "Nonaktif"}.`,
  };
}

/**
 * 3. Reset Password Pengguna ke Default (Password123!)
 */
export async function resetUserPasswordAction(userId: string): Promise<ActionResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== Role.SUPERADMIN) {
    return { success: false, message: "Akses ditolak. Tindakan ini membutuhkan hak akses SUPERADMIN." };
  }

  const { ipAddress, userAgent } = await getClientIpAndUa();

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!targetUser) {
    return { success: false, message: "Pengguna tidak ditemukan." };
  }

  const defaultHash = await hashPassword("Password123!");

  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash: defaultHash,
      failedLoginCount: 0,
      lockedUntil: null,
    },
  });

  await prisma.systemAuditLog.create({
    data: {
      userId: currentUser.userId,
      action: "SUPERADMIN_RESET_PASSWORD",
      ipAddress,
      userAgent,
      payload: {
        targetUserId: targetUser.id,
        targetUsername: targetUser.username,
        resetTo: "Password123!",
      },
    },
  });

  // Siarkan Event Reset Password (SSE)
  broadcastRealtimeEvent({
    type: "SYSTEM_UPDATE",
    entity: "USER",
    title: "Kata Sandi Direset",
    message: `Kata sandi akun '${targetUser.fullName}' telah direset.`,
    timestamp: Date.now(),
  });

  revalidatePath("/dashboard");
  return {
    success: true,
    message: `Password pengguna '${targetUser.fullName}' berhasil di-reset ke 'Password123!'.`,
  };
}

/**
 * 4. Tambah Master Unit / Ruangan RS Baru
 */
export async function createDepartmentUnitAction(formData: FormData): Promise<ActionResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== Role.SUPERADMIN) {
    return { success: false, message: "Akses ditolak. Tindakan ini membutuhkan hak akses SUPERADMIN." };
  }

  const { ipAddress, userAgent } = await getClientIpAndUa();

  const name = (formData.get("name") as string)?.trim();
  const buildingZone = (formData.get("buildingZone") as string)?.trim();

  if (!name || name.length < 2) {
    return { success: false, message: "Nama unit/ruangan wajib diisi." };
  }

  if (!buildingZone || buildingZone.length < 2) {
    return { success: false, message: "Lokasi gedung/zona wajib diisi." };
  }

  const newUnit = await prisma.departmentUnit.create({
    data: {
      name,
      buildingZone,
    },
  });

  await prisma.systemAuditLog.create({
    data: {
      userId: currentUser.userId,
      action: "SUPERADMIN_CREATE_UNIT",
      ipAddress,
      userAgent,
      payload: {
        unitId: newUnit.id,
        name: newUnit.name,
        buildingZone: newUnit.buildingZone,
      },
    },
  });

  // Siarkan Event Unit Baru (SSE)
  broadcastRealtimeEvent({
    type: "SYSTEM_UPDATE",
    entity: "UNIT",
    title: "Master Ruangan / Unit Ditambahkan",
    message: `Unit '${newUnit.name}' (${newUnit.buildingZone}) berhasil ditambahkan.`,
    timestamp: Date.now(),
  });

  revalidatePath("/dashboard");
  return {
    success: true,
    message: `Unit '${newUnit.name}' (${newUnit.buildingZone}) berhasil ditambahkan.`,
  };
}

/**
 * 5. Tambah Kategori Kendala Baru
 */
export async function createCategoryAction(formData: FormData): Promise<ActionResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== Role.SUPERADMIN) {
    return { success: false, message: "Akses ditolak. Tindakan ini membutuhkan hak akses SUPERADMIN." };
  }

  const { ipAddress, userAgent } = await getClientIpAndUa();

  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const targetSlaMinutes = Number(formData.get("targetSlaMinutes")) || 30;

  if (!name || name.length < 2) {
    return { success: false, message: "Nama kategori wajib diisi." };
  }

  const existing = await prisma.category.findUnique({
    where: { name },
  });

  if (existing) {
    return { success: false, message: `Kategori '${name}' sudah terdaftar.` };
  }

  const newCat = await prisma.category.create({
    data: {
      name,
      description,
      targetSlaMinutes,
    },
  });

  await prisma.systemAuditLog.create({
    data: {
      userId: currentUser.userId,
      action: "SUPERADMIN_CREATE_CATEGORY",
      ipAddress,
      userAgent,
      payload: {
        categoryId: newCat.id,
        name: newCat.name,
        targetSlaMinutes: newCat.targetSlaMinutes,
      },
    },
  });

  // Siarkan Event Kategori Baru (SSE)
  broadcastRealtimeEvent({
    type: "SYSTEM_UPDATE",
    entity: "CATEGORY",
    title: "Kategori Masalah Baru",
    message: `Kategori '${newCat.name}' (Target SLA: ${newCat.targetSlaMinutes}m) ditambahkan.`,
    timestamp: Date.now(),
  });

  revalidatePath("/dashboard");
  return {
    success: true,
    message: `Kategori '${newCat.name}' berhasil ditambahkan dengan target SLA ${newCat.targetSlaMinutes} menit.`,
  };
}

/**
 * 6. Ubah Target SLA Menit Kategori
 */
export async function updateCategorySlaAction(categoryId: number, newSlaMinutes: number): Promise<ActionResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== Role.SUPERADMIN) {
    return { success: false, message: "Akses ditolak. Tindakan ini membutuhkan hak akses SUPERADMIN." };
  }

  const { ipAddress, userAgent } = await getClientIpAndUa();

  const updated = await prisma.category.update({
    where: { id: categoryId },
    data: { targetSlaMinutes: newSlaMinutes },
  });

  await prisma.systemAuditLog.create({
    data: {
      userId: currentUser.userId,
      action: "SUPERADMIN_UPDATE_CATEGORY_SLA",
      ipAddress,
      userAgent,
      payload: {
        categoryId: updated.id,
        name: updated.name,
        newSlaMinutes: updated.targetSlaMinutes,
      },
    },
  });

  // Siarkan Event SLA Kategori Diperbarui (SSE)
  broadcastRealtimeEvent({
    type: "SYSTEM_UPDATE",
    entity: "CATEGORY",
    title: "Target SLA Diperbarui",
    message: `Target SLA '${updated.name}' disesuaikan menjadi ${updated.targetSlaMinutes} menit.`,
    timestamp: Date.now(),
  });

  revalidatePath("/dashboard");
  return {
    success: true,
    message: `Target SLA kategori '${updated.name}' diperbarui menjadi ${updated.targetSlaMinutes} menit.`,
  };
}

/**
 * 7. Ambil Data Profil Rumah Sakit (Singleton)
 */
export async function getHospitalProfileAction() {
  let profile = await prisma.hospitalProfile.findFirst();
  if (!profile) {
    profile = await prisma.hospitalProfile.create({
      data: {
        id: 1,
        name: "Rumah Sakit Umum Daerah",
        hospitalClass: "Kelas B",
        ownershipType: "Pemerintah",
        phone: "(021) 1234567",
        email: "kontak@rumahsakit.co.id",
        bpjsPpkCode: "0123R001",
        kemenkesCode: "3171012",
        satuSehatId: "org-1000001",
        address: "Jl. Kesehatan Medika No. 1, Kota Medika",
        logoUrl: null,
        website: "https://rumahsakit.co.id",
      },
    });
  }
  return profile;
}

/**
 * 8. Simpan / Perbarui Profil Rumah Sakit (Hanya Superadmin)
 */
export async function updateHospitalProfileAction(formData: FormData): Promise<ActionResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== Role.SUPERADMIN) {
    return { success: false, message: "Akses ditolak. Tindakan ini membutuhkan hak akses SUPERADMIN." };
  }

  const { ipAddress, userAgent } = await getClientIpAndUa();

  const name = (formData.get("name") as string)?.trim();
  const hospitalClass = (formData.get("hospitalClass") as string)?.trim() || "Kelas B";
  const ownershipType = (formData.get("ownershipType") as string)?.trim() || "Pemerintah";
  const phone = (formData.get("phone") as string)?.trim() || "";
  const email = (formData.get("email") as string)?.trim() || "";
  const bpjsPpkCode = (formData.get("bpjsPpkCode") as string)?.trim() || null;
  const kemenkesCode = (formData.get("kemenkesCode") as string)?.trim() || null;
  const satuSehatId = (formData.get("satuSehatId") as string)?.trim() || null;
  const address = (formData.get("address") as string)?.trim() || "";
  const logoUrl = (formData.get("logoUrl") as string)?.trim() || null;
  const website = (formData.get("website") as string)?.trim() || null;

  if (!name || name.length < 3) {
    return { success: false, message: "Nama rumah sakit wajib diisi minimal 3 karakter." };
  }

  if (!address || address.length < 5) {
    return { success: false, message: "Alamat rumah sakit wajib diisi lengkap minimal 5 karakter." };
  }

  try {
    const updated = await prisma.hospitalProfile.upsert({
      where: { id: 1 },
      update: {
        name,
        hospitalClass,
        ownershipType,
        phone,
        email,
        bpjsPpkCode,
        kemenkesCode,
        satuSehatId,
        address,
        logoUrl,
        website,
      },
      create: {
        id: 1,
        name,
        hospitalClass,
        ownershipType,
        phone,
        email,
        bpjsPpkCode,
        kemenkesCode,
        satuSehatId,
        address,
        logoUrl,
        website,
      },
    });

    await prisma.systemAuditLog.create({
      data: {
        userId: currentUser.userId,
        action: "SUPERADMIN_UPDATE_HOSPITAL_PROFILE",
        ipAddress,
        userAgent,
        payload: {
          name: updated.name,
          hospitalClass: updated.hospitalClass,
          ownershipType: updated.ownershipType,
          kemenkesCode: updated.kemenkesCode,
        },
      },
    });

    // Siarkan Event Pembaruan Profil Instansi (SSE)
    broadcastRealtimeEvent({
      type: "SYSTEM_UPDATE",
      entity: "HOSPITAL_PROFILE",
      title: "Profil Rumah Sakit Diperbarui",
      message: `Identitas instansi '${updated.name}' berhasil diperbarui oleh Super Admin.`,
      timestamp: Date.now(),
    });

    revalidatePath("/dashboard");
    revalidatePath("/");
    return {
      success: true,
      message: `Profil dan identitas instansi '${updated.name}' berhasil disimpan!`,
      data: updated,
    };
  } catch (error) {
    console.error("Gagal menyimpan profil rumah sakit:", error);
    return { success: false, message: "Terjadi kesalahan server saat menyimpan profil rumah sakit." };
  }
}
