import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { saveMediaFile } from "@/lib/upload";

export async function POST(req: NextRequest) {
  try {
    // 1. Verifikasi Sesi User (Wajib Login)
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    // 2. Baca Multipart Form Data
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "Berkas tidak ditemukan dalam permintaan." },
        { status: 400 }
      );
    }

    // Konversi file ke Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 3. Sanitasi Magic Bytes dan Simpan Berkas
    const saved = await saveMediaFile(buffer, file.name);

    return NextResponse.json({
      success: true,
      attachment: {
        storedFilename: saved.storedFilename,
        originalName: saved.originalName,
        fileType: saved.fileType,
        mimeType: saved.mimeType,
        fileSizeBytes: saved.fileSizeBytes,
        sha256Hash: saved.sha256Hash,
        previewUrl: `/api/media/${saved.storedFilename}`,
      },
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Gagal memproses upload media:", error.message);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal mengunggah berkas." },
      { status: 400 }
    );
  }
}
