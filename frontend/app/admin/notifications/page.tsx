"use client";
import { useState } from "react";
import { broadcastNotification } from "@/lib/api/admin";
import { BashiriButton } from "@/components/ui/Button";

export default function AdminNotificationsPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [segment, setSegment] = useState("all");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    if (!title.trim() || !body.trim()) {
      setResult("Title na body vinahitajika.");
      return;
    }
    setLoading(true);
    const res = await broadcastNotification({ title, body, segment });
    setResult(res.detail);
    setTitle("");
    setBody("");
    setLoading(false);
  }

  return (
    <div className="max-w-lg w-full">
      <h1 className="text-2xl font-black text-white mb-4">Tuma Notification kwa Watumiaji</h1>

      <div className="rounded-2xl p-6 space-y-4" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div>
          <label className="text-xs mb-1 block" style={{ color: "rgba(255,255,255,0.5)" }}>Kikundi</label>
          <div className="flex gap-2 flex-wrap">
            {[{ v: "all", l: "Wote" }, { v: "subscribers", l: "PRO Subscribers" }, { v: "free", l: "Free Users" }].map((s) => (
              <button
                key={s.v}
                onClick={() => setSegment(s.v)}
                className="px-3 py-1.5 rounded-full text-xs font-bold"
                style={{ background: segment === s.v ? "#00FF87" : "rgba(255,255,255,0.06)", color: segment === s.v ? "#000" : "rgba(255,255,255,0.5)" }}
              >
                {s.l}
              </button>
            ))}
          </div>
        </div>

        <input className="w-full rounded-xl px-3 py-2.5 text-sm text-white bg-[#151515] outline-none" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea className="w-full rounded-xl px-3 py-2.5 text-sm text-white bg-[#151515] outline-none" placeholder="Ujumbe" rows={3} value={body} onChange={(e) => setBody(e.target.value)} />

        {result && <p className="text-xs" style={{ color: "#00FF87" }}>{result}</p>}

        <BashiriButton className="w-full" loading={loading} onClick={handleSend}>Tuma Notification</BashiriButton>
      </div>
    </div>
  );
}
