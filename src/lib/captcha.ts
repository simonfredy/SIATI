import crypto from "crypto";

const CAPTCHA_SECRET = process.env.CAPTCHA_SECRET_KEY || "siati_default_super_secret_captcha_key";
// Excludes ambiguous glyphs (0, O, 1, I).
const CAPTCHA_CHARSET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export interface CaptchaData {
  token: string;
  svg: string;
  expiresAt: number;
}

export function generateTextCaptcha(): CaptchaData {
  const codeLength = 5;
  let code = "";
  for (let i = 0; i < codeLength; i++) {
    const randomIndex = Math.floor(Math.random() * CAPTCHA_CHARSET.length);
    code += CAPTCHA_CHARSET[randomIndex];
  }

  const expiresAt = Date.now() + 2 * 60 * 1000;

  const hmac = crypto.createHmac("sha256", CAPTCHA_SECRET);
  hmac.update(`${code.toUpperCase()}:${expiresAt}`);
  const signature = hmac.digest("hex");
  const token = `${expiresAt}.${signature}`;

  const textColors = ["#1e3a8a", "#0369a1", "#0f766e", "#374151", "#7c2d12", "#1d4ed8", "#4338ca"];

  const charactersSvg = code
    .split("")
    .map((char, index) => {
      const x = 20 + index * 26 + (Math.random() * 4 - 2);
      const y = 30 + (Math.random() * 6 - 3);
      const rotate = Math.floor(Math.random() * 32) - 16;
      const color = textColors[Math.floor(Math.random() * textColors.length)];
      const fontSize = Math.floor(Math.random() * 4) + 23;
      return `<text x="${x}" y="${y}" transform="rotate(${rotate}, ${x}, ${y})" font-family="'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" font-weight="800" font-size="${fontSize}" fill="${color}" letter-spacing="1">
        ${char}
      </text>`;
    })
    .join("");

  const curveY1 = 12 + Math.floor(Math.random() * 20);
  const curveY2 = 12 + Math.floor(Math.random() * 20);
  const waveLine = `<path d="M 5 ${curveY1} Q 75 ${45 - curveY1} 155 ${curveY2}" stroke="#cbd5e1" stroke-width="2" fill="none" />`;
  const dashLine = `<line x1="10" y1="${38 - curveY1}" x2="150" y2="${curveY1}" stroke="#94a3b8" stroke-width="1.2" stroke-dasharray="4,4" />`;

  const noiseDots = Array.from({ length: 12 })
    .map(() => {
      const cx = Math.floor(Math.random() * 155) + 5;
      const cy = Math.floor(Math.random() * 40) + 4;
      const r = Math.random() * 1.5 + 0.8;
      return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#94a3b8" opacity="0.6" />`;
    })
    .join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="165" height="46" viewBox="0 0 165 46" style="border-radius: 8px; background: #f8fafc; user-select: none;">
    <rect width="100%" height="100%" fill="#f1f5f9" rx="8" />
    ${waveLine}
    ${dashLine}
    ${noiseDots}
    ${charactersSvg}
  </svg>`;

  return {
    token,
    svg: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`,
    expiresAt,
  };
}

export async function verifyCaptcha(
  token: string | undefined,
  userAnswer: string | undefined,
  remoteIp?: string
): Promise<{ success: boolean; error?: string }> {
  const mode = process.env.CAPTCHA_MODE || "offline";

  if (mode === "turnstile") {
    if (!token) {
      return { success: false, error: "Token Cloudflare Turnstile tidak ditemukan." };
    }

    try {
      const secret = process.env.TURNSTILE_SECRET_KEY || "";
      const formData = new URLSearchParams();
      formData.append("secret", secret);
      formData.append("response", token);
      if (remoteIp) formData.append("remoteip", remoteIp);

      const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        body: formData,
      });

      const outcome = await res.json();
      if (outcome.success) {
        return { success: true };
      }
      return { success: false, error: "Validasi Cloudflare Turnstile gagal." };
    } catch {
      return { success: false, error: "Gagal memverifikasi Turnstile ke server." };
    }
  }

  if (!token || !userAnswer) {
    return { success: false, error: "Kode gambar CAPTCHA wajib diketik." };
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return { success: false, error: "Token CAPTCHA tidak valid." };
  }

  const [expiresAtStr, signature] = parts;
  const expiresAt = parseInt(expiresAtStr, 10);

  if (isNaN(expiresAt) || Date.now() > expiresAt) {
    return { success: false, error: "CAPTCHA telah kedaluwarsa. Silakan muat ulang kode baru." };
  }

  const cleanedAnswer = userAnswer.trim().toUpperCase();
  const expectedHmac = crypto.createHmac("sha256", CAPTCHA_SECRET);
  expectedHmac.update(`${cleanedAnswer}:${expiresAt}`);
  const expectedSignature = expectedHmac.digest("hex");

  // Constant-time check prevents timing side-channel attacks.
  if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return { success: true };
  }

  return { success: false, error: "Kode yang Anda ketik tidak cocok dengan gambar." };
}
