import { NextResponse } from "next/server";
import { generateTextCaptcha } from "@/lib/captcha";

export async function GET() {
  try {
    const captcha = generateTextCaptcha();
    return NextResponse.json(captcha, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("Gagal membuat CAPTCHA:", error);
    return NextResponse.json(
      { error: "Gagal membuat tantangan keamanan CAPTCHA" },
      { status: 500 }
    );
  }
}
