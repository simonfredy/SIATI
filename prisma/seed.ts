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
    { name: "Manajemen Rumah Sakit", buildingZone: "Gedung Manajemen Lt. 3", qrIdentifier: "LOC-MANAJEMEN-01" },
  ];

  for (const u of unitsData) {
    await prisma.departmentUnit.upsert({
      where: { qrIdentifier: u.qrIdentifier },
      update: {},
      create: u,
    });
  }
  console.log("✅ 12 Master Unit/Ruangan berhasil disiapkan.");

  // 2. Buat Master Kategori Masalah IT Sesuai Kebutuhan Rumah Sakit
  const categoriesData = [
    { name: "SIMRS & RME", description: "Kendala SIMRS Khanza/web, rekam medis elektronik, bridging BPJS V-Claim", targetSlaMinutes: 15 },
    { name: "Software Lainnya", description: "Aplikasi penunjang RS, sistem antrean, e-prescribing, OS / Office", targetSlaMinutes: 25 },
    { name: "Hardware & PC", description: "PC mati, monitor, printer label resep, scanner barcode, UPS", targetSlaMinutes: 30 },
    { name: "Jaringan", description: "Koneksi LAN, WiFi medis ruangan, access point, internet terputus", targetSlaMinutes: 20 },
    { name: "Fasilitas Penunjang TI", description: "Telepon internal PABX, sound system poli, CCTV, kelistrikan IT", targetSlaMinutes: 45 },
  ];

  // Bersihkan kategori lama yang namanya tidak cocok
  await prisma.category.deleteMany({
    where: {
      name: { notIn: categoriesData.map((c) => c.name) },
    },
  });

  for (const c of categoriesData) {
    await prisma.category.upsert({
      where: { name: c.name },
      update: { targetSlaMinutes: c.targetSlaMinutes, description: c.description },
      create: c,
    });
  }
  console.log("✅ 5 Master Kategori & Target SLA berhasil disiapkan.");

  // Ambil unit IGD, IT, dan Manajemen untuk akun percontohan
  const itUnit = await prisma.departmentUnit.findFirst({ where: { qrIdentifier: "LOC-IT-SIMRS" } });
  const igdUnit = await prisma.departmentUnit.findFirst({ where: { qrIdentifier: "LOC-IGD-01" } });
  const manajemenUnit = (await prisma.departmentUnit.findFirst({ where: { qrIdentifier: "LOC-MANAJEMEN-01" } })) || (await prisma.departmentUnit.findFirst({ where: { qrIdentifier: "LOC-DIREKSI-01" } }));

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
      username: "manajemen",
      nip: "197805152003121002",
      fullName: "dr. Martinus Ginting, Sp.P (Manajemen)",
      phoneNumber: "08116000001",
      telegramChatId: "",
      role: Role.MANAGEMENT,
      passwordHash: defaultPasswordHash,
      departmentUnitId: manajemenUnit?.id || itUnit!.id,
    },
    {
      username: "direksi",
      nip: "197805152003121002",
      fullName: "dr. Martinus Ginting, Sp.P (Manajemen)",
      phoneNumber: "08116000001",
      telegramChatId: "",
      role: Role.MANAGEMENT,
      passwordHash: defaultPasswordHash,
      departmentUnitId: manajemenUnit?.id || itUnit!.id,
    },
    {
      username: "operator",
      nip: "199202022021021002",
      fullName: "Operator Staf TI",
      phoneNumber: "081234567891",
      telegramChatId: "",
      role: Role.IT_STAFF,
      passwordHash: defaultPasswordHash,
      departmentUnitId: itUnit!.id,
    },
    {
      username: "rian",
      nip: "199503032022031003",
      fullName: "Rian Staf TI",
      phoneNumber: "081234567892",
      telegramChatId: "",
      role: Role.IT_STAFF,
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
  console.log("✅ Akun percontohan (Superadmin, Manajemen, Staf TI, Nakes) berhasil disiapkan.");

  // 4. Buat Tiket Contoh Realistis untuk Analitik Dasbor Manajemen & Pelayanan RS
  const existingTicketsCount = await prisma.ticket.count();
  if (existingTicketsCount === 0) {
    console.log("📊 Mengisi tiket percontohan realistis untuk analitik manajemen...");
    const sitiUser = await prisma.user.findUnique({ where: { username: "siti" } });
    const operatorUser = await prisma.user.findUnique({ where: { username: "operator" } });
    const rianUser = await prisma.user.findUnique({ where: { username: "rian" } });

    const okUnit = await prisma.departmentUnit.findFirst({ where: { qrIdentifier: "LOC-OK-01" } });
    const farmasiUnit = await prisma.departmentUnit.findFirst({ where: { qrIdentifier: "LOC-FARMASI-RJ" } });
    const labUnit = await prisma.departmentUnit.findFirst({ where: { qrIdentifier: "LOC-LAB-01" } });
    const radUnit = await prisma.departmentUnit.findFirst({ where: { qrIdentifier: "LOC-RAD-01" } });
    const bangsalUnit = await prisma.departmentUnit.findFirst({ where: { qrIdentifier: "LOC-BANGSAL-MELATI" } });
    const poliDalamUnit = await prisma.departmentUnit.findFirst({ where: { qrIdentifier: "LOC-POLI-DALAM" } });
    const kasirUnit = await prisma.departmentUnit.findFirst({ where: { qrIdentifier: "LOC-KASIR-01" } });

    const catSimrs = await prisma.category.findFirst({ where: { name: "SIMRS & RME" } });
    const catSoftware = await prisma.category.findFirst({ where: { name: "Software Lainnya" } });
    const catHardware = await prisma.category.findFirst({ where: { name: "Hardware & PC" } });
    const catJaringan = await prisma.category.findFirst({ where: { name: "Jaringan" } });
    const catFasilitas = await prisma.category.findFirst({ where: { name: "Fasilitas Penunjang TI" } });

    const sampleTickets = [
      {
        ticketNumber: "TKT-20261023-0001",
        reporterId: sitiUser!.id,
        unitId: igdUnit!.id,
        categoryId: catSimrs!.id,
        urgency: "EMERGENCY" as const,
        status: "RESOLVED" as const,
        description: "PC Tindakan IGD error bridging BPJS V-Claim. Resep pasien darurat tidak bisa terkirim ke Farmasi.",
        assignedTechnicianId: operatorUser!.id,
        responseMinutes: 3,
        repairMinutes: 11,
        totalLeadMinutes: 14,
        ratingScore: 5,
        ratingFeedback: "Sangat responsif dan sigap! Pelayanan darurat IGD langsung normal kembali.",
      },
      {
        ticketNumber: "TKT-20261023-0002",
        reporterId: sitiUser!.id,
        unitId: okUnit!.id,
        categoryId: catHardware!.id,
        urgency: "EMERGENCY" as const,
        status: "RESOLVED" as const,
        description: "Monitor PC intra-operatif OK Bedah 2 blank saat pergantian pasien. Kabel konektor display longgar.",
        assignedTechnicianId: rianUser!.id,
        responseMinutes: 4,
        repairMinutes: 16,
        totalLeadMinutes: 20,
        ratingScore: 5,
        ratingFeedback: "Teknisi langsung tiba dalam hitungan menit di OK. Mantap!",
      },
      {
        ticketNumber: "TKT-20261023-0003",
        reporterId: sitiUser!.id,
        unitId: farmasiUnit!.id,
        categoryId: catHardware!.id,
        urgency: "HIGH" as const,
        status: "RESOLVED" as const,
        description: "Printer barcode etiket obat macet roll kertasnya. Antrean pasien rawat jalan mulai menumpuk.",
        assignedTechnicianId: operatorUser!.id,
        responseMinutes: 6,
        repairMinutes: 18,
        totalLeadMinutes: 24,
        ratingScore: 4,
        ratingFeedback: "Printer normal kembali setelah roller dibersihkan dan kalibrasi ulang.",
      },
      {
        ticketNumber: "TKT-20261023-0004",
        reporterId: sitiUser!.id,
        unitId: labUnit!.id,
        categoryId: catSimrs!.id,
        urgency: "HIGH" as const,
        status: "IN_PROGRESS" as const,
        description: "Interfacing alat hematology analyzer gagal sinkronisasi otomatis ke modul Laboratorium SIMRS.",
        assignedTechnicianId: rianUser!.id,
        responseMinutes: 5,
        repairMinutes: null,
        totalLeadMinutes: null,
      },
      {
        ticketNumber: "TKT-20261023-0005",
        reporterId: sitiUser!.id,
        unitId: radUnit!.id,
        categoryId: catSoftware!.id,
        urgency: "MEDIUM" as const,
        status: "RESOLVED" as const,
        description: "Viewer DICOM PACS radiologi meminta update sertifikat SSL internal server rumah sakit.",
        assignedTechnicianId: operatorUser!.id,
        responseMinutes: 9,
        repairMinutes: 15,
        totalLeadMinutes: 24,
        ratingScore: 5,
        ratingFeedback: "Update sertifikat cepat selesai tanpa mengganggu pembacaan rontgen.",
      },
      {
        ticketNumber: "TKT-20261023-0006",
        reporterId: sitiUser!.id,
        unitId: bangsalUnit!.id,
        categoryId: catJaringan!.id,
        urgency: "MEDIUM" as const,
        status: "RESOLVED" as const,
        description: "Access Point WiFi bangsal rawat inap Melati putus sambungan ke tablet visit dokter spesialis.",
        assignedTechnicianId: rianUser!.id,
        responseMinutes: 8,
        repairMinutes: 14,
        totalLeadMinutes: 22,
        ratingScore: 5,
        ratingFeedback: "Sinyal WiFi sudah stabil di sepanjang lorong bangsal.",
      },
      {
        ticketNumber: "TKT-20261023-0007",
        reporterId: sitiUser!.id,
        unitId: poliDalamUnit!.id,
        categoryId: catFasilitas!.id,
        urgency: "LOW" as const,
        status: "PENDING_PARTS" as const,
        description: "Mikrofon pemanggil antrean poliklinik suara berdegung keras. Menunggu kabel jack pengganti dari logistik.",
        assignedTechnicianId: operatorUser!.id,
        responseMinutes: 14,
        repairMinutes: null,
        totalLeadMinutes: null,
      },
      {
        ticketNumber: "TKT-20261023-0008",
        reporterId: sitiUser!.id,
        unitId: kasirUnit!.id,
        categoryId: catSimrs!.id,
        urgency: "HIGH" as const,
        status: "RESOLVED" as const,
        description: "Kwitansi pelunasan pasien rawat inap tidak muncul barcode verifikasi kasir.",
        assignedTechnicianId: rianUser!.id,
        responseMinutes: 5,
        repairMinutes: 9,
        totalLeadMinutes: 14,
        ratingScore: 5,
        ratingFeedback: "Template laporan kasir langsung diperbaiki, antrean pasien lancar.",
      },
      {
        ticketNumber: "TKT-20261023-0009",
        reporterId: sitiUser!.id,
        unitId: igdUnit!.id,
        categoryId: catSoftware!.id,
        urgency: "MEDIUM" as const,
        status: "SUBMITTED" as const,
        description: "Permintaan instalasi shortcut sistem antrean triase IGD di komputer perawat 2.",
        assignedTechnicianId: null,
        responseMinutes: null,
        repairMinutes: null,
        totalLeadMinutes: null,
      },
    ];

    for (const t of sampleTickets) {
      const createdTicket = await prisma.ticket.create({
        data: {
          ticketNumber: t.ticketNumber,
          reporterId: t.reporterId,
          unitId: t.unitId,
          categoryId: t.categoryId,
          urgency: t.urgency,
          status: t.status,
          description: t.description,
          assignedTechnicianId: t.assignedTechnicianId,
          responseMinutes: t.responseMinutes,
          repairMinutes: t.repairMinutes,
          totalLeadMinutes: t.totalLeadMinutes,
        },
      });

      if (t.ratingScore) {
        await prisma.ticketRating.create({
          data: {
            ticketId: createdTicket.id,
            ratingScore: t.ratingScore,
            feedback: t.ratingFeedback,
          },
        });
      }
    }
    console.log("✅ 9 Tiket percontohan realistis & ulasan kepuasan nakes berhasil di-generate.");
  }

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
