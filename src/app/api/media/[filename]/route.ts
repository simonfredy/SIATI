import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import fs from "fs/promises";
import path from "path";

interface RouteParams {
  params: Promise<{ filename: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { filename } = await params;

    // Cegah path traversal (mencegah ../../../etc/passwd)
    const sanitizedFilename = path.basename(filename);
    const uploadDir = process.env.MEDIA_UPLOAD_DIR || path.join(process.cwd(), "uploads");
    const filePath = path.join(uploadDir, sanitizedFilename);

    try {
      const fileBuffer = await fs.readFile(/*turbopackIgnore: true*/ filePath);

      // Tentukan Content-Type
      const ext = path.extname(sanitizedFilename).toLowerCase();
      let contentType = "application/octet-stream";
      if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
      else if (ext === ".png") contentType = "image/png";
      else if (ext === ".webp") contentType = "image/webp";
      else if (ext === ".mp4") contentType = "video/mp4";
      else if (ext === ".webm") contentType = "video/webm";

      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Type": contentType,
          "X-Content-Type-Options": "nosniff",
          "Cache-Control": "private, max-age=86400",
        },
      });
    } catch {
      return new NextResponse("Berkas media tidak ditemukan", { status: 404 });
    }
  } catch (error) {
    console.error("Gagal menyajikan media:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
