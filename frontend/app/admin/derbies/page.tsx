"use client";
import { useEffect, useState } from "react";
import { getDerbies, createDerby, updateDerby, deleteDerby, getTeams, getMatches } from "@/lib/api/admin";
import { BashiriButton } from "@/components/ui/Button";
import { Plus, X, Trash2 } from "lucide-react";

export default function AdminDerbiesPage() {
  const [derbies, setDerbies] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    home_team: "", away_team: "", match: "", derby_name: "", starts_at: "", ends_at: "",
    theme_accent_color: "#FF4757", banner_text: "",
  });
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    load();
    getTeams().then(setTeams);
    getMatches().then((data) => {
      console.log('Matches data:', data);
      setMatches(data);
    });
  }, []);

  function load() {
    getDerbies().then(setDerbies);
  }

  async function handleCreate() {
    setSaving(true);
    await createDerby({
      home_team: Number(form.home_team),
      away_team: Number(form.away_team),
      match: form.match ? Number(form.match) : null,
      derby_name: form.derby_name,
      starts_at: form.starts_at,
      ends_at: form.ends_at,
      theme_accent_color: form.theme_accent_color,
      banner_text: form.banner_text,
    });
    setSaving(false);
    setShowForm(false);
    setForm({ home_team: "", away_team: "", match: "", derby_name: "", starts_at: "", ends_at: "", theme_accent_color: "#FF4757", banner_text: "" });
    load();
  }

  async function toggleActive(id: number, current: boolean) {
    await updateDerby(id, { is_active: !current });
    load();
  }

  async function handleDeleteConfirm() {
    if (deletingId === null) return;
    await deleteDerby(deletingId);
    setShowDeleteConfirm(false);
    setDeletingId(null);
    load();
  }

  function handleDeleteClick(id: number) {
    setDeletingId(id);
    setShowDeleteConfirm(true);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-white">Local Derby Mode</h1>
        <BashiriButton size="md" onClick={() => setShowForm(!showForm)}>
          {showForm ? <X size={16} /> : <Plus size={16} />} {showForm ? "Funga" : "Tengeneza Derby"}
        </BashiriButton>
      </div>

      {showForm && (
        <div className="rounded-2xl p-6 mb-6 space-y-4 max-w-lg w-full" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <select
              className="rounded-xl px-3 py-2.5 text-sm text-white bg-[#151515] outline-none"
              value={form.home_team}
              onChange={(e) => setForm({ ...form, home_team: e.target.value })}
            >
              <option value="">Home Team</option>
              {teams.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <select
              className="rounded-xl px-3 py-2.5 text-sm text-white bg-[#151515] outline-none"
              value={form.away_team}
              onChange={(e) => setForm({ ...form, away_team: e.target.value })}
            >
              <option value="">Away Team</option>
              {teams.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          <select
            className="w-full rounded-xl px-3 py-2.5 text-sm text-white bg-[#151515] outline-none"
            value={form.match}
            onChange={(e) => setForm({ ...form, match: e.target.value })}
          >
            <option value="">Link na Mechi (Hiari - chagua mechi halisi)</option>
            {matches.map((m: any) => (
              <option key={m.id} value={m.id}>
                {m.home_team_name || m.home_team?.name} vs {m.away_team_name || m.away_team?.name} - {new Date(m.kickoff_at).toLocaleDateString()}
              </option>
            ))}
          </select>

          <input
            className="w-full rounded-xl px-3 py-2.5 text-sm text-white bg-[#151515] outline-none"
            placeholder="Jina la Derby (mfano: Kariakoo Derby)"
            value={form.derby_name}
            onChange={(e) => setForm({ ...form, derby_name: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs mb-1 block" style={{ color: "rgba(255,255,255,0.5)" }}>Inaanza</label>
              <input
                type="datetime-local"
                className="w-full rounded-xl px-3 py-2.5 text-sm text-white bg-[#151515] outline-none"
                value={form.starts_at}
                onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: "rgba(255,255,255,0.5)" }}>Inaisha</label>
              <input
                type="datetime-local"
                className="w-full rounded-xl px-3 py-2.5 text-sm text-white bg-[#151515] outline-none"
                value={form.ends_at}
                onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>Theme Color:</label>
            <input
              type="color"
              value={form.theme_accent_color}
              onChange={(e) => setForm({ ...form, theme_accent_color: e.target.value })}
              className="w-10 h-10 rounded-lg cursor-pointer"
            />
          </div>

          <input
            className="w-full rounded-xl px-3 py-2.5 text-sm text-white bg-[#151515] outline-none"
            placeholder="Banner text (hiari)"
            value={form.banner_text}
            onChange={(e) => setForm({ ...form, banner_text: e.target.value })}
          />

          <BashiriButton className="w-full" loading={saving} onClick={handleCreate}>Hifadhi Derby</BashiriButton>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {derbies.map((d: any) => (
          <div key={d.id} className="rounded-2xl p-5" style={{ background: "#111111", border: `1px solid ${d.theme_accent_color}44` }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-black" style={{ color: d.theme_accent_color }}>{d.derby_name}</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleActive(d.id, d.is_active)}
                  className="px-2 py-1 rounded-full text-[10px] font-bold"
                  style={{ background: d.is_active ? "rgba(0,255,135,0.15)" : "rgba(255,71,87,0.15)", color: d.is_active ? "#00FF87" : "#FF4757" }}
                >
                  {d.is_active ? "Active" : "Inactive"}
                </button>
                <button
                  onClick={() => handleDeleteClick(d.id)}
                  className="p-1.5 rounded-lg hover:bg-red-500/20 transition-colors"
                  title="Futa Derby"
                >
                  <Trash2 size={14} className="text-red-500" />
                </button>
              </div>
            </div>
            <p className="text-white font-bold mb-2">{d.home_team_name} vs {d.away_team_name}</p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
              {new Date(d.starts_at).toLocaleString()} → {new Date(d.ends_at).toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="rounded-2xl p-6 max-w-sm w-full" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
            <h3 className="text-lg font-black text-white mb-2">Futa Derby?</h3>
            <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.6)" }}>
              Una uhakika unataka kufuta derby hii? Hatua hii haiwezi kurudishwa.
            </p>
            <div className="flex gap-3 justify-end">
              <BashiriButton variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                Ghairi
              </BashiriButton>
              <BashiriButton
                onClick={handleDeleteConfirm}
                style={{ background: "#FF4757", borderColor: "#FF4757" }}
              >
                Futa
              </BashiriButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
