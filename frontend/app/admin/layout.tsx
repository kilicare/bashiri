"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAdminAuthStore } from "@/stores/admin-auth.store";
import { AdminSidebar } from "@/components/admin/Sidebar";
import { Menu } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { access } = useAdminAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated && !access && pathname !== "/admin/login") {
      router.push("/admin/login");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [access, pathname, isHydrated]);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [sidebarOpen]);

  if (pathname === "/admin/login") {
    return <div style={{ background: "#0A0A0A" }} className="min-h-dvh">{children}</div>;
  }

  if (!isHydrated) {
    return (
      <div style={{ background: "#0A0A0A" }} className="min-h-dvh flex items-center justify-center">
        <div className="text-white/60">Loading...</div>
      </div>
    );
  }

  if (!access) return null;

  return (
    <div className="min-h-dvh" style={{ background: "#0A0A0A" }}>
      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-3 py-2" style={{ background: "#0A0A0A", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <button
          onClick={() => {
            console.log('Menu button clicked, setting sidebarOpen to true');
            setSidebarOpen(true);
          }}
          className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center active:scale-95 transition-transform cursor-pointer hover:bg-white/10"
        >
          <Menu size={20} className="text-white/60" />
        </button>
        <h1 className="text-base font-black" style={{ color: "#00FF87" }}>BASHIRI ADMIN</h1>
        <div className="w-10" /> {/* Spacer for centering */}
      </div>

      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="md:ml-60 p-4 md:p-8 pt-14 md:pt-8">{children}</main>
    </div>
  );
}
