"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateLanguage } from "@/lib/api/settings";
import { useAuthStore } from "@/stores/auth.store";
import { ArrowLeft, Check } from "lucide-react";

const LANGUAGES = [
  { code: "sw" as const, label: "Kiswahili" },
  { code: "en" as const, label: "English" },
];

export default function LanguageSettingsPage() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [selected, setSelected] = useState<"sw" | "en">(user?.preferred_language || "sw");
  const [saving, setSaving] = useState(false);

  async function handleSelect(lang: "sw" | "en") {
    setSelected(lang);
    setSaving(true);
    const updatedUser = await updateLanguage(lang);
    setUser(updatedUser as any);
    setSaving(false);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="px-5 pt-safe pt-6 pb-4 flex items-center gap-3">
        <button onClick={() => router.back()} aria-label="Rudi nyuma"><ArrowLeft size={20} style={{ color: "rgba(255,255,255,0.6)" }} /></button>
        <h1 className="text-xl font-black text-white">Lugha</h1>
      </div>

      <div className="px-4 space-y-2">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleSelect(lang.code)}
            disabled={saving}
            className="w-full rounded-2xl p-4 flex items-center justify-between"
            style={{
              background: selected === lang.code ? "rgba(0,255,135,0.1)" : "#111111",
              border: selected === lang.code ? "1px solid #00FF87" : "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <span className="text-sm font-bold text-white">{lang.label}</span>
            {selected === lang.code && <Check size={16} style={{ color: "#00FF87" }} />}
          </button>
        ))}
      </div>
    </div>
  );
}
