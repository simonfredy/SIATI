import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Memulai seeding database awal SIATI RSUD...");

  // 1. Buat Master Unit / Ruangan Rumah Sakit
  const unitsData = [
    { name: "Instalasi Gawat Darurat (IGD)", buildingZone: "Gedung Utama Lt. 1", qrIdentifier: "LOC-IGD-01" },
    { name: "Kamar Operasi / Bedah Sentral (OK)", buildingZone: "Gedung Utama Lt. 2", qrIdentifier: "LOC-OK-01" },
    { name: "Farmasi Rawat Jalan", buildingZone: "Gedung Rawat Jalan Lt. 1", qrIdentifier: "LOC-FARMASI-RJ" },
    { name: "Farmasi Rawat Inap", buildingZone: "Gedung Rawat Inap Lt. 1", qrIdentifier: "LOC-FARMASI-RI" },
    { name: "Laboratorium Patologi Klinik", buildingZone: "Gedung Penunjang Lt. 1", qrIdentifier: "LOC-LAB-01" },
    { name: "Radiologi & Rontgen", buildingZone: "Gedung Penunjang Lt. 1", qrIdentifier: "LOC-RAD-01" },
    { name: "Poliklinik Penyakit Dalam", buildingZone: "Gedung Rawat Jalan Lt. 2", qrIdentifier: "LOC-POLI-DALAM" },
    { name: "Poliklinik Anak", buildingZone: "Gedung Rawat Jalan Lt. 2", qrIdentifier: "LOC-POLI-ANAK" },
    { name: "Rawat Inap Bangsal Melati", buildingZone: "Gedung Rawat Inap Lt. 2", qrIdentifier: "LOC-BANGSAL-MELATI" },
    { name: "Kasir & Pembayaran Pasien", buildingZone: "Gedung Utama Lt. 1", qrIdentifier: "LOC-KASIR-01" },
    { name: "Instalasi SIMRS & TI", buildingZone: "Gedung Manajemen Lt. 3", qrIdentifier: "LOC-IT-SIMRS" },
  ];

  for (const u of unitsData) {
    await prisma.departmentUnit.upsert({
      where: { qrIdentifier: u.qrIdentifier },
      update: {},
      create: u,
    });
  }
  console.log("✅ 11 Master Unit/Ruangan berhasil disiapkan.");

  // 2. Buat Master Kategori Masalah IT & Target SLA
  const categoriesData = [
    { name: "SIMRS & Rekam Medis (RME)", description: "Error bridging BPJS, gagal simpan rekam medis, akun error", targetSlaMinutes: 15 },
    { name: "Printer Label & Resep", description: "Kertas macet (paper jam), hasil bergaris, printer resep mati", targetSlaMinutes: 20 },
    { name: "Hardware & PC Ruangan", description: "PC mati total, monitor blank, scanner barcode tidak terbaca", targetSlaMinutes: 30 },
    { name: "Jaringan LAN & WiFi Medis", description: "Koneksi internet putus, kabel LAN copot, RME offline", targetSlaMinutes: 20 },
    { name: "Fasilitas Penunjang TI", description: "Telepon internal PABX mati, CCTV ruangan, UPS bunyi terus", targetSlaMinutes: 45 },
  ];

  for (const c of categoriesData) {
    await prisma.category.upsert({
      where: { name: c.name },
      update: { targetSlaMinutes: c.targetSlaMinutes, description: c.description },
      create: c,
    });
  }
  console.log("✅ 5 Master Kategori & Target SLA berhasil disiapkan.");

  // Ambil unit IGD dan IT untuk akun percontohan
  const itUnit = await prisma.departmentUnit.findFirst({ where: { qrIdentifier: "LOC-IT-SIMRS" } });
  const igdUnit = await prisma.departmentUnit.findFirst({ where: { qrIdentifier: "LOC-IGD-01" } });

  const defaultPasswordHash = await bcrypt.hash("Password123!", 12);

  // 3. Buat Akun Pengguna Awal (Menggunakan Username Nama Depan)
  const usersData = [
    {
      username: "admin",
      nip: "199001012020011001",
      fullName: "Super Admin SIMRS",
      phoneNumber: "081234567890",
      telegramChatId: "",
      role: Role.SUPERADMIN,
      passwordHash: defaultPasswordHash,
      departmentUnitId: itUnit!.id,
    },
    {
      username: "operator",
      nip: "199202022021021002",
      fullName: "Operator Dispatcher IT",
      phoneNumber: "081234567891",
      telegramChatId: "",
      role: Role.HELPDESK,
      passwordHash: defaultPasswordHash,
      departmentUnitId: itUnit!.id,
    },
    {
      username: "rian",
      nip: "199503032022031003",
      fullName: "Rian Teknisi Lapangan",
      phoneNumber: "081234567892",
      telegramChatId: "",
      role: Role.TECHNICIAN,
      passwordHash: defaultPasswordHash,
      departmentUnitId: itUnit!.id,
    },
    {
      username: "siti",
      nip: "199704042023042004",
      fullName: "Ns. Siti Rahma (Perawat IGD)",
      phoneNumber: "081234567893",
      telegramChatId: "",
      role: Role.STAFF_USER,
      passwordHash: defaultPasswordHash,
      departmentUnitId: igdUnit!.id,
    },
  ];

  for (const usr of usersData) {
    await prisma.user.upsert({
      where: { username: usr.username },
      update: {
        fullName: usr.fullName,
        role: usr.role,
        passwordHash: defaultPasswordHash,
      },
      create: usr,
    });
  }
  console.log("✅ Akun percontohan (Superadmin, Helpdesk, Teknisi, Nakes) berhasil disiapkan.");
  console.log("✨ Seeding selesai!");
}

main()
  .catch((e) => {
    console.error("❌ Terjadi kesalahan saat seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
