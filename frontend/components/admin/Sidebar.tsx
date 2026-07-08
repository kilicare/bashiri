"use client";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, Calendar, CreditCard, Bell, Brain, LogOut, X } from "lucide-react";
import { useAdminAuthStore } from "@/stores/admin-auth.store";
import { useEffect } from "react";

const NAV_ITEMS = [
  { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/users", icon: Users, label: "Watumiaji" },
  { href: "/admin/matches", icon: Calendar, label: "Mechi" },
  { href: "/admin/transactions", icon: CreditCard, label: "Malipo" },
  { href: "/admin/notifications", icon: Bell, label: "Notifications" },
  { href: "/admin/ml-status", icon: Brain, label: "ML Model" },
];

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function AdminSidebar({ isOpen = false, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { admin, logout } = useAdminAuthStore();

  // Debug sidebar state
  useEffect(() => {
    console.log('Sidebar isOpen changed:', isOpen);
  }, [isOpen]);

  const handleNavClick = (href: string) => {
    router.push(href);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => {
            console.log('Overlay clicked, closing sidebar');
            if (onClose) onClose();
          }}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full flex flex-col transition-transform duration-300 ease-in-out z-[60]
          ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
          w-60`}
        style={{ background: "#111111", borderRight: "1px solid rgba(255,255,255,0.06)" }}
      >
        {/* Mobile Close Button */}
        <div className="md:hidden flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <h1 className="text-lg font-black" style={{ color: "#00FF87" }}>BASHIRI ADMIN</h1>
          <button onClick={() => {
            console.log('Close button clicked');
            if (onClose) onClose();
          }} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
            <X size={18} className="text-white/60" />
          </button>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:block px-5 py-6">
          <h1 className="text-lg font-black" style={{ color: "#00FF87" }}>BASHIRI ADMIN</h1>
          <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>@{admin?.username}</p>
        </div>

        <nav className="flex-1 px-3 space-y-1 py-4 md:py-0">
          {NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <button
                key={item.href}
                onClick={() => handleNavClick(item.href)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold"
                style={{
                  background: active ? "rgba(0,255,135,0.1)" : "transparent",
                  color: active ? "#00FF87" : "rgba(255,255,255,0.6)",
                }}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="px-3 pb-6">
          <button
            onClick={() => { logout(); router.push("/admin/login"); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold"
            style={{ color: "#FF4757" }}
          >
            <LogOut size={18} /> Toka
          </button>
        </div>
      </aside>
    </>
  );
}
