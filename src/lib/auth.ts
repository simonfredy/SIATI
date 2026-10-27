import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies, headers } from "next/headers";
import { Role } from "@prisma/client";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "siati_hospital_ticketing_super_secure_jwt_secret_2026_xyz"
);

export const AUTH_COOKIE_NAME = "siati_session_token";

export interface SessionPayload {
  userId: string;
  username: string;
  nip?: string | null;
  fullName: string;
  role: Role;
  departmentUnitId: number;
}

/**
 * Hash password menggunakan bcrypt dengan salt work-factor 12
 */
export async function hashPassword(plainText: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(plainText, salt);
}

/**
 * Verifikasi password plain-text dengan hash di database
 */
export async function verifyPassword(plainText: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainText, hash);
}

/**
 * Buat JWT signed token untuk sesi pengguna
 */
export async function signSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_EXPIRES_IN || "1d")
    .sign(JWT_SECRET);
}

/**
 * Verifikasi dan decode token sesi JWT
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/**
 * Mengambil data sesi pengguna yang sedang login saat ini di Server Components/Actions
 */
export async function getCurrentUser(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/**
 * Helper untuk set cookie sesi aman
 */
export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();

  // Deteksi apakah koneksi saat ini adalah HTTPS
  let isHttps = false;
  try {
    const reqHeaders = await headers();
    const proto = reqHeaders.get("x-forwarded-proto");
    const referer = reqHeaders.get("referer") || "";
    isHttps = proto === "https" || referer.startsWith("https://");
  } catch {
    // Abaikan jika dipanggil di luar konteks request
  }

  // Izinkan override eksplisit via .env COOKIE_SECURE jika diinginkan
  let secureFlag = isHttps;
  if (process.env.COOKIE_SECURE === "false") {
    secureFlag = false;
  } else if (process.env.COOKIE_SECURE === "true") {
    secureFlag = true;
  }

  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: secureFlag,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 jam
  });
}

/**
 * Helper untuk menghapus cookie sesi (Logout)
 */
export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
