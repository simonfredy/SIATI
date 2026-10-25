"use client";

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";

interface BarcodeSignatureProps {
  value: string;
  displayCode?: string;
  signerName: string;
  signerRole: string;
  timestamp?: string;
}

export function BarcodeSignature({
  value,
  displayCode,
  signerName,
  signerRole,
  timestamp,
}: BarcodeSignatureProps) {
  const [qrSrc, setQrSrc] = useState<string>("");

  useEffect(() => {
    // Generate structured QR Code data URL
    const qrPayload = JSON.stringify({
      app: "SIATI-RS",
      type: "TTE_VERIFIED",
      token: value,
      name: signerName,
      role: signerRole,
      time: timestamp || new Date().toISOString(),
    });

    QRCode.toDataURL(qrPayload, {
      width: 130,
      margin: 1,
      errorCorrectionLevel: "M",
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    })
      .then((url) => setQrSrc(url))
      .catch((err) => console.error("Gagal generate QR Code:", err));
  }, [value, signerName, signerRole, timestamp]);

  return (
    <div className="flex flex-col items-center justify-center p-0 m-0">
      {qrSrc ? (
        <img
          src={qrSrc}
          alt={`QR Code Tanda Tangan ${signerRole}`}
          className="w-16 h-16 object-contain print:w-14 print:h-14 block mx-auto"
        />
      ) : (
        <div className="w-16 h-16 bg-gray-100 flex items-center justify-center text-[8px] text-gray-400">
          Memuat QR...
        </div>
      )}
      {displayCode && (
        <div className="font-mono text-[8px] text-gray-600 tracking-wider mt-0.5">
          {displayCode}
        </div>
      )}
    </div>
  );
}
