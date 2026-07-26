"use client";

import { motion } from "framer-motion";
import { Mail, MessageCircle, Camera, MapPin, Clock, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

const CONTACT_INFO = [
  {
    icon: MessageCircle,
    label: "WhatsApp",
    value: "+255 650 745 642",
    action: "https://wa.me/255650745642",
    color: "#25D366",
  },
  {
    icon: Mail,
    label: "Email",
    value: "kilicareplus",
    action: "mailto:kilicareplus",
    color: "#D4AF37",
  },
  {
    icon: Camera,
    label: "Instagram",
    value: "@lastmateru",
    action: "https://instagram.com/lastmateru",
    color: "#E1306C",
  },
];

const BUSINESS_INFO = [
  {
    icon: MapPin,
    label: "Location",
    value: "Dar es Salaam, Tanzania",
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
            const Icon = contact.icon;
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
                      <Icon size={24} style={{ color: contact.color }} />
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
            {BUSINESS_INFO.map((info, index) => {
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
