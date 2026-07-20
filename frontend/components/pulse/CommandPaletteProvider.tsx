"use client";
import { useEffect } from "react";
import { useCommandPaletteStore } from "@/stores/commandPalette.store";
import { CommandPalette } from "./CommandPalette";

/**
 * Global keyboard listener (⌘K / Ctrl+K) — kama Linear/Vercel/GitHub.
 * Mounted MARA MOJA kwenye (main)/layout.tsx, inafanya kazi mahali
 * popote ndani ya app (desktop). Kwenye simu, icon ya Search ndani ya
 * /pulse ndiyo njia pekee (hakuna keyboard shortcut ya mkononi).
 */
export function CommandPaletteProvider() {
  const { toggle, isOpen, close } = useCommandPaletteStore();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggle();
        return;
      }
      if (e.key === "Escape" && isOpen) {
        close();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggle, isOpen, close]);

  return <CommandPalette />;
}
