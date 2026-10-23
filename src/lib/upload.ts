import crypto from "crypto";
import fs from "fs/promises";
import path from "path";

export interface FileValidationResult {
  isValid: boolean;
  fileType: "IMAGE" | "VIDEO" | null;
  mimeType: string | null;
  extension: string | null;
  error?: string;
}

/**
 * Memvalidasi Magic Bytes biner asli dari file buffer untuk mencegah upload Web Shell / Malware.
 */
export function validateMagicBytes(buffer: Buffer): FileValidationResult {
  if (!buffer || buffer.length < 12) {
    return { isValid: false, fileType: null, mimeType: null, extension: null, error: "File terlalu kecil atau rusak." };
  }

  // 1. Cek JPEG (FF D8 FF)
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { isValid: true, fileType: "IMAGE", mimeType: "image/jpeg", extension: ".jpg" };
  }

  // 2. Cek PNG (89 50 4E 47 0D 0A 1A 0A)
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { isValid: true, fileType: "IMAGE", mimeType: "image/png", extension: ".png" };
  }

  // 3. Cek WebP (RIFF .... WEBP)
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { isValid: true, fileType: "IMAGE", mimeType: "image/webp", extension: ".webp" };
  }

  // 4. Cek MP4 / QuickTime (....ftyp)
  if (
    buffer[4] === 0x66 &&
    buffer[5] === 0x74 &&
    buffer[6] === 0x79 &&
    buffer[7] === 0x70
  ) {
    return { isValid: true, fileType: "VIDEO", mimeType: "video/mp4", extension: ".mp4" };
  }

  // 5. Cek WebM (1A 45 DF A3 - EBML header)
  if (
    buffer[0] === 0x1a &&
    buffer[1] === 0x45 &&
    buffer[2] === 0xdf &&
    buffer[3] === 0xa3
  ) {
    return { isValid: true, fileType: "VIDEO", mimeType: "video/webm", extension: ".webm" };
  }

  return {
    isValid: false,
    fileType: null,
    mimeType: null,
    extension: null,
    error: "Tipe berkas tidak diizinkan. Hanya format JPG, PNG, WebP, MP4, dan WebM yang diperbolehkan.",
  };
}

/**
 * Menyimpan buffer berkas ke folder penyimpanan aman dengan penamaan UUIDv4 acak.
 */
export async function saveMediaFile(buffer: Buffer, originalName: string) {
  const validation = validateMagicBytes(buffer);
  if (!validation.isValid || !validation.extension || !validation.fileType || !validation.mimeType) {
    throw new Error(validation.error || "Validasi berkas gagal.");
  }

  // Cek batas ukuran: Foto maks 10MB, Video maks 50MB
  const maxPhotoBytes = 10 * 1024 * 1024;
  const maxVideoBytes = 50 * 1024 * 1024;

  if (validation.fileType === "IMAGE" && buffer.length > maxPhotoBytes) {
    throw new Error("Ukuran foto maksimal 10MB.");
  }

  if (validation.fileType === "VIDEO" && buffer.length > maxVideoBytes) {
    throw new Error("Ukuran video maksimal 50MB.");
  }

  // Hitung SHA-256 hash untuk audit integritas file
  const sha256Hash = crypto.createHash("sha256").update(buffer).digest("hex");

  // Nama file acak menggunakan UUIDv4 murni (ekstensi ganda ditolak)
  const storedFilename = `${crypto.randomUUID()}${validation.extension}`;

  const uploadDir = process.env.MEDIA_UPLOAD_DIR || path.join(process.cwd(), "uploads");
  await fs.mkdir(uploadDir, { recursive: true });

  const filePath = path.join(uploadDir, storedFilename);
  await fs.writeFile(/*turbopackIgnore: true*/ filePath, buffer);

  return {
    storedFilename,
    originalName: path.basename(originalName),
    filePath,
    fileSizeBytes: buffer.length,
    fileType: validation.fileType,
    mimeType: validation.mimeType,
    sha256Hash,
  };
}
