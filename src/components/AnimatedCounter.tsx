"use client";

import React, { useEffect, useRef, useState } from "react";
import { animate } from "motion/react";

interface AnimatedCounterProps {
  value: number | string;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

const smoothEase: [number, number, number, number] = [0.16, 1, 0.3, 1];

/**
 * Komponen Penghitung Angka Animatif Berbasis Motion
 * Memberikan efek angka bergulir naik secara dinamis dan presisi saat dimuat atau saat data berubah.
 */
export default function AnimatedCounter({
  value,
  duration = 1.0,
  decimals = 0,
  prefix = "",
  suffix = "",
  className = "",
}: AnimatedCounterProps) {
  const numericValue = typeof value === "number" ? value : parseFloat(value) || 0;

  const [displayValue, setDisplayValue] = useState<string>(
    `${prefix}${numericValue.toFixed(decimals)}${suffix}`
  );
  const prevValueRef = useRef<number>(0);

  useEffect(() => {
    const startVal = prevValueRef.current;
    const endVal = typeof value === "number" ? value : parseFloat(value) || 0;
    prevValueRef.current = endVal;

    const controls = animate(startVal, endVal, {
      duration,
      ease: smoothEase, // Kurva easing kubik halus (Apple-style spring)
      onUpdate: (latest) => {
        setDisplayValue(
          `${prefix}${latest.toFixed(decimals)}${suffix}`
        );
      },
    });

    return () => controls.stop();
  }, [value, duration, decimals, prefix, suffix]);

  return <span className={className}>{displayValue}</span>;
}
