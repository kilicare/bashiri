"use client";

import { usePathname, useRouter } from "next/navigation";
import { clsx } from "clsx";

interface NavItem {
  id: string;
  label: string;
  icon: string;
  href: string;
}

const navItems: NavItem[] = [
  { id: "home", label: "Home", icon: "home", href: "/home" },
  { id: "matches", label: "Matches", icon: "matches", href: "/matches" },
  { id: "ai", label: "AI", icon: "ai", href: "/ai" },
  { id: "profile", label: "Profile", icon: "profile", href: "/profile" },
];

const icons = {
  home: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  matches: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  ai: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  profile: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
};

export function PremiumBottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
      <div className="bg-[#050508]/80 backdrop-blur-xl border border-white/10 rounded-[30px] px-4 md:px-6 py-3 md:py-4 shadow-2xl">
        <div className="flex items-center justify-between gap-4 md:gap-8">
          {navItems.slice(0, 2).map((item) => (
            <a
              key={item.id}
              href={item.href}
              className={clsx(
                "flex flex-col items-center gap-1 transition-all duration-300",
                pathname === item.href ? "text-white" : "text-white/40 hover:text-white"
              )}
            >
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {icons[item.icon as keyof typeof icons]}
              </svg>
              <span className="text-[10px] md:text-xs font-medium">{item.label}</span>
            </a>
          ))}

          {/* Floating Center Button */}
          <button 
            onClick={() => router.push("/create")}
            className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-r from-[#FFD54A] to-[#FFB300] rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,213,74,0.4)] hover:shadow-[0_0_40px_rgba(255,213,74,0.5)] transition-all duration-300 -mt-4 md:-mt-8 border-4 border-[#050508]"
          >
            <svg className="w-6 h-6 md:w-7 md:h-7 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
          </button>

          {navItems.slice(2).map((item) => (
            <a
              key={item.id}
              href={item.href}
              className={clsx(
                "flex flex-col items-center gap-1 transition-all duration-300",
                pathname === item.href ? "text-white" : "text-white/40 hover:text-white"
              )}
            >
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {icons[item.icon as keyof typeof icons]}
              </svg>
              <span className="text-[10px] md:text-xs font-medium">{item.label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
