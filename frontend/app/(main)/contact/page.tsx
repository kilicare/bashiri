"use client";

import { motion } from "framer-motion";
import { Mail, MapPin, Clock, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

const CONTACT_INFO = [
  {
    label: "WhatsApp",
    value: "+255 650 745 642",
    action: "https://wa.me/255650745642",
    color: "#25D366",
    svg: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    ),
  },
  {
    label: "Email",
    value: "kilicareplus@gmail.com",
    action: "mailto:kilicareplus@gmail.com",
    color: "#D4AF37",
    icon: Mail,
  },
  {
    label: "Instagram",
    value: "@lastmateru",
    action: "https://instagram.com/lastmateru",
    color: "#E1306C",
    svg: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },
];

const BUSINESS_INFO = [
  {
    icon: MapPin,
    label: "Location",
    value: "Moshi, Tanzania",
  },
  {
    icon: Clock,
    label: "Business Hours",
    value: "24/7 Support",
  },
];

export default function ContactPage() {
  const router = useRouter();

  return (
    <div className="min-h-dvh bg-[#050508] overflow-y-auto no-scrollbar">
      {/* Header */}
      <div className="px-5 pt-safe pt-10 pb-4" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 32px)" }}>
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => router.back()} aria-label="Rudi nyuma">
            <ArrowLeft size={20} style={{ color: "rgba(255,255,255,0.6)" }} />
          </button>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Wasiliana Nasi
          </h1>
        </div>
        <p className="text-sm text-white/50">
          Tuna furaha kukusikia. Wasiliana nasi kwa njia yoyote.
        </p>
      </div>

      <div className="px-4 pb-8 space-y-4">
        {/* Contact Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-3"
        >
          {CONTACT_INFO.map((contact, index) => {
            return (
              <motion.a
                key={contact.label}
                href={contact.action}
                target={contact.label === "WhatsApp" || contact.label === "Instagram" ? "_blank" : undefined}
                rel={contact.label === "WhatsApp" || contact.label === "Instagram" ? "noopener noreferrer" : undefined}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + (index * 0.08) }}
                className="block"
              >
                <div
                  className="rounded-2xl p-4 backdrop-blur-sm border transition-all duration-300 hover:scale-[1.02]"
                  style={{
                    background: "rgba(17, 18, 24, 0.7)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        background: `${contact.color}15`,
                        border: `1px solid ${contact.color}30`,
                      }}
                    >
                      {contact.svg ? (
                        <div style={{ color: contact.color }}>
                          {contact.svg}
                        </div>
                      ) : contact.icon ? (
                        <contact.icon size={24} style={{ color: contact.color }} />
                      ) : null}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white/60 mb-1">
                        {contact.label}
                      </p>
                      <p className="text-base font-bold text-white truncate">
                        {contact.value}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.a>
            );
          })}
        </motion.div>

        {/* Business Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl p-4 backdrop-blur-sm border"
          style={{
            background: "rgba(17, 18, 24, 0.7)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <div className="space-y-3">
            {BUSINESS_INFO.map((info) => {
              const Icon = info.icon;
              return (
                <div key={info.label} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[var(--brand-primary)]/10 border border-[var(--brand-primary)]/20 flex items-center justify-center flex-shrink-0">
                    <Icon size={18} className="text-[var(--brand-primary)]" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white/60">{info.label}</p>
                    <p className="text-sm font-bold text-white">{info.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Message Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl p-5 backdrop-blur-sm border"
          style={{
            background: "rgba(212, 175, 55, 0.08)",
            border: "1px solid rgba(212, 175, 55, 0.15)",
          }}
        >
          <p className="text-sm text-white/80 leading-relaxed text-center">
            Tafadhali jisikie huru kuwasiliana nasi kwa maswali yoyote, maoni, au usaidizi. Tunajibu haraka!
          </p>
        </motion.div>
      </div>
    </div>
  );
}
