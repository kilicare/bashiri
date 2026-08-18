"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getAdminHeroSlides, createHeroSlide, updateHeroSlide, deleteHeroSlide,
  getHeroImageUploadSignature, uploadHeroImageToCloudinary, AdminHeroSlide,
} from "@/lib/api/admin";
import { BashiriButton } from "@/components/ui/Button";
import { Plus, X, Trash2, Upload, ArrowLeft } from "lucide-react";

const EMPTY_FORM = {
  title: "", subtitle: "", image_url: "", cta_label: "Angalia", route: "",
  accent_color: "#00FF87", starts_at: "", ends_at: "", order: 0, is_active: true,
};

export default function AdminHeroSlidesPage() {
  const router = useRouter();
  const [slides, setSlides] = useState<AdminHeroSlide[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<any>(EMPTY_FORM);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { load(); }, []);

  function load() {
    getAdminHeroSlides().then(setSlides);
  }

  function openNew() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(slide: AdminHeroSlide) {
    setForm({
      title: slide.title, subtitle: slide.subtitle, image_url: slide.image_url,
      cta_label: slide.cta_label, route: slide.route, accent_color: slide.accent_color,
      starts_at: slide.starts_at || "", ends_at: slide.ends_at || "",
      order: slide.order, is_active: slide.is_active,
    });
    setEditingId(slide.id);
    setShowForm(true);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const sig = await getHeroImageUploadSignature();
      const url = await uploadHeroImageToCloudinary(file, sig);
      setForm((prev: any) => ({ ...prev, image_url: url }));
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        ...form,
        starts_at: form.starts_at || null,
        ends_at: form.ends_at || null,
      };
      if (editingId) await updateHeroSlide(editingId, payload);
      else await createHeroSlide(payload);
      setShowForm(false);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    await deleteHeroSlide(id);
    load();
  }

  async function toggleActive(slide: AdminHeroSlide) {
    await updateHeroSlide(slide.id, { is_active: !slide.is_active });
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} aria-label="Rudi nyuma">
            <ArrowLeft size={20} style={{ color: "rgba(255,255,255,0.6)" }} />
          </button>
          <h1 className="text-2xl font-black text-white">Hero Carousel</h1>
        </div>
        <BashiriButton size="md" onClick={openNew}><Plus size={16} /> Slide Mpya</BashiriButton>
      </div>

      <p className="text-xs mb-6" style={{ color: "rgba(255,255,255,0.4)" }}>
        Hizi ni "custom slides" (matangazo) tu — slides za kiotomatiki (Mechi ya Leo, Derby,
        Track Record, PRO, Fan of Match, Did You Know) hazionekani hapa kwa sababu zinatengenezwa
        moja kwa moja kutoka data iliyopo.
      </p>

      {showForm && (
        <div className="rounded-2xl p-6 mb-6 space-y-4 max-w-lg" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-white">{editingId ? "Hariri Slide" : "Slide Mpya"}</h2>
            <button onClick={() => setShowForm(false)}><X size={16} style={{ color: "rgba(255,255,255,0.5)" }} /></button>
          </div>

          <div>
            <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full rounded-xl py-3 flex items-center justify-center gap-2 text-sm font-bold"
              style={{ background: "#151515", border: "1px dashed rgba(255,255,255,0.15)", color: "#fff" }}
            >
              {uploading ? "Inapakia..." : <><Upload size={16} /> {form.image_url ? "Badilisha Picha" : "Pakia Picha"}</>}
            </button>
            {form.image_url && (
              <img src={form.image_url} alt="preview" className="w-full h-32 object-cover rounded-xl mt-2" loading="lazy" />
            )}
          </div>

          <input className="w-full rounded-xl px-3 py-2.5 text-sm text-white bg-[#151515] outline-none" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <input className="w-full rounded-xl px-3 py-2.5 text-sm text-white bg-[#151515] outline-none" placeholder="Subtitle" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <input className="rounded-xl px-3 py-2.5 text-sm text-white bg-[#151515] outline-none" placeholder="CTA Label" value={form.cta_label} onChange={(e) => setForm({ ...form, cta_label: e.target.value })} />
            <input className="rounded-xl px-3 py-2.5 text-sm text-white bg-[#151515] outline-none" placeholder="Route (mfano /subscribe)" value={form.route} onChange={(e) => setForm({ ...form, route: e.target.value })} />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>Accent Color:</label>
            <input type="color" value={form.accent_color} onChange={(e) => setForm({ ...form, accent_color: e.target.value })} className="w-10 h-10 rounded-lg cursor-pointer" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs mb-1 block" style={{ color: "rgba(255,255,255,0.5)" }}>Inaanza (hiari)</label>
              <input type="datetime-local" className="w-full rounded-xl px-3 py-2 text-sm text-white bg-[#151515] outline-none" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: "rgba(255,255,255,0.5)" }}>Inaisha (hiari)</label>
              <input type="datetime-local" className="w-full rounded-xl px-3 py-2 text-sm text-white bg-[#151515] outline-none" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} />
            </div>
          </div>
          <input type="number" className="w-full rounded-xl px-3 py-2.5 text-sm text-white bg-[#151515] outline-none" placeholder="Order (0 = kwanza)" value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} />

          <BashiriButton className="w-full" loading={saving} disabled={!form.title || !form.image_url} onClick={handleSave}>
            {editingId ? "Hifadhi Mabadiliko" : "Tengeneza Slide"}
          </BashiriButton>
        </div>
      )}

      <div className="space-y-3">
        {slides.map((slide) => (
          <div key={slide.id} className="rounded-2xl overflow-hidden flex" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
            <img src={slide.image_url} alt={slide.title} className="w-28 h-24 object-cover" loading="lazy" />
            <div className="flex-1 p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-bold text-white">{slide.title}</p>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: slide.is_active ? "rgba(0,255,135,0.15)" : "rgba(255,71,87,0.15)", color: slide.is_active ? "#00FF87" : "#FF4757" }}>
                  {slide.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              <p className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>{slide.subtitle}</p>
              <div className="flex gap-2">
                <button onClick={() => openEdit(slide)} className="text-xs font-bold" style={{ color: "#00FF87" }}>Hariri</button>
                <button onClick={() => toggleActive(slide)} className="text-xs font-bold" style={{ color: "#FFD600" }}>
                  {slide.is_active ? "Zima" : "Washa"}
                </button>
                <button onClick={() => handleDelete(slide.id)} className="text-xs font-bold flex items-center gap-1" style={{ color: "#FF4757" }}>
                  <Trash2 size={12} /> Futa
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
