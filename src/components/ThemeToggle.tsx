"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    // Cek preferensi tersimpan di localStorage atau default ke Light
    const saved = localStorage.getItem("siati_theme");
    if (saved === "dark") {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    } else {
      setIsDark(false);
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("siati_theme", "light");
      setIsDark(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("siati_theme", "dark");
      setIsDark(true);
    }
  };

  if (!mounted) {
    return (
      <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800" />
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-sm transition-all active:scale-95 flex items-center justify-center"
      title={isDark ? "Ganti ke Tema Terang (Light)" : "Ganti ke Tema Gelap (Dark)"}
      aria-label="Toggle Theme"
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
      ) : (
        <Moon className="w-4 h-4 text-sky-600" />
      )}
    </button>
  );
}
