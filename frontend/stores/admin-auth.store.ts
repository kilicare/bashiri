"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AdminUser {
  id: number;
  phone_number: string;
  username: string | null;
  is_staff: boolean;
}

interface AdminAuthState {
  access: string | null;
  refresh: string | null;
  admin: AdminUser | null;
  setSession: (access: string, refresh: string, admin: AdminUser) => void;
  logout: () => void;
}

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set) => ({
      access: null,
      refresh: null,
      admin: null,
      setSession: (access, refresh, admin) => set({ access, refresh, admin }),
      logout: () => set({ access: null, refresh: null, admin: null }),
    }),
    { name: "bashiri-admin-auth" }
  )
);
