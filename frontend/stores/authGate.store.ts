"use client";
import { create } from "zustand";

interface AuthGateState {
  isOpen: boolean;
  message: string;
  open: (message?: string) => void;
  close: () => void;
}

export const useAuthGateStore = create<AuthGateState>((set) => ({
  isOpen: false,
  message: "Ingia ili kuendelea.",
  open: (message) => set({ isOpen: true, message: message || "Ingia ili kuendelea." }),
  close: () => set({ isOpen: false }),
}));
