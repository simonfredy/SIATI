import { Variants, TargetAndTransition } from "motion/react";

/**
 * Variasi Animasi Terpadu SIATI RSBM Berbasis Motion
 */

const smoothEase: [number, number, number, number] = [0.16, 1, 0.3, 1];

// Kontainer Kartu dengan Efek Masuk Bertahap (Staggered Children)
export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.05,
    },
  },
};

// Item Kartu Tunggal (Masuk dengan Lembut dari Bawah)
export const cardItemVariants: Variants = {
  hidden: { opacity: 0, y: 14, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: smoothEase,
    },
  },
};

// Transisi Konten Tab Saat Berpindah Menu
export const tabContentVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: smoothEase,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: 0.18,
      ease: "easeIn",
    },
  },
};

// Animasi Modal Pop-up (Backdrop & Content)
export const modalBackdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

export const modalContentVariants: Variants = {
  hidden: { opacity: 0, scale: 0.94, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: smoothEase,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 15,
    transition: { duration: 0.2, ease: "easeIn" },
  },
};

// Hover State untuk Kartu Interaktif
export const interactiveCardHover: TargetAndTransition = {
  y: -3,
  transition: { duration: 0.2, ease: "easeOut" },
};

// Tap State untuk Tombol Interaktif
export const buttonTap: TargetAndTransition = {
  scale: 0.96,
  transition: { duration: 0.1 },
};
