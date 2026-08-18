"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCards, createDebate, resolveDebate, deleteDebate } from "@/lib/api/admin";
import { BashiriButton } from "@/components/ui/Button";
import { Plus, X, Trash2, ArrowLeft } from "lucide-react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

export default function AdminDebatesPage() {
  const router = useRouter();
  const [debates, setDebates] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState("YES,NO");
  const [closesInHours, setClosesInHours] = useState(48);
  const [saving, setSaving] = useState(false);
  const [resolvingId, setResolvingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showResolveConfirm, setShowResolveConfirm] = useState(false);
  const [resolveTarget, setResolveTarget] = useState<{ id: number; result: string } | null>(null);

  useEffect(() => {
    load();
  }, []);

  function load() {
    getCards("DEBATE").then((data) => setDebates(data as unknown as any[]));
  }

  async function handleCreate() {
    setSaving(true);
    await createDebate({
      question,
      options: options.split(",").map((o) => o.trim()).filter(Boolean),
      closes_in_hours: closesInHours,
      match_id: null,
    });
    setSaving(false);
    setShowForm(false);
    setQuestion("");
    setOptions("YES,NO");
    load();
  }

  async function handleResolve(cardId: number, result: string) {
    setResolveTarget({ id: cardId, result });
    setShowResolveConfirm(true);
  }

  async function confirmResolve() {
    if (!resolveTarget) return;
    await resolveDebate(resolveTarget.id, resolveTarget.result);
    setResolvingId(null);
    setShowResolveConfirm(false);
    setResolveTarget(null);
    load();
  }

  async function handleDeleteConfirm() {
    if (deletingId === null) return;
    await deleteDebate(deletingId);
    setShowDeleteConfirm(false);
    setDeletingId(null);
    load();
  }

  function handleDeleteClick(cardId: number) {
    setDeletingId(cardId);
    setShowDeleteConfirm(true);
  }


  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} aria-label="Rudi nyuma">
            <ArrowLeft size={20} style={{ color: "rgba(255,255,255,0.6)" }} />
          </button>
          <h1 className="text-2xl font-black text-white">Debate Cards</h1>
        </div>
        <BashiriButton size="md" onClick={() => setShowForm(!showForm)}>
          {showForm ? <X size={16} /> : <Plus size={16} />} {showForm ? "Funga" : "Tengeneza Debate"}
        </BashiriButton>
      </div>

      {showForm && (
        <div className="rounded-2xl p-6 mb-6 space-y-4 max-w-lg w-full" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
          <input
            className="w-full rounded-xl px-3 py-2.5 text-sm text-white bg-[#151515] outline-none"
            placeholder="Swali la Debate (mfano: Je Yanga ataingia makundi ya CAF?)"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <input
            className="w-full rounded-xl px-3 py-2.5 text-sm text-white bg-[#151515] outline-none"
            placeholder="Options, tenganisha kwa comma (YES,NO)"
            value={options}
            onChange={(e) => setOptions(e.target.value)}
          />
          <div>
            <label className="text-xs mb-1 block" style={{ color: "rgba(255,255,255,0.5)" }}>Inafunga baada ya (masaa)</label>
            <input
              type="number"
              className="w-full rounded-xl px-3 py-2.5 text-sm text-white bg-[#151515] outline-none"
              value={closesInHours}
              onChange={(e) => setClosesInHours(Number(e.target.value))}
            />
          </div>
          <BashiriButton className="w-full" loading={saving} onClick={handleCreate}>Hifadhi Debate</BashiriButton>
        </div>
      )}

      <div className="space-y-3">
        {debates.map((d: any) => (
          <div key={d.id} className="rounded-2xl p-5" style={{ background: "#111111", border: "1px solid rgba(255,71,87,0.15)" }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-bold text-white">{d.data.question}</p>
              <div className="flex items-center gap-2">
                {d.data.is_closed ? (
                  <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: "rgba(0,255,135,0.1)", color: "#00FF87" }}>
                    Resolved: {d.data.result}
                  </span>
                ) : (
                  <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: "rgba(255,214,0,0.1)", color: "#FFD600" }}>
                    {d.data.voting_closed ? "Voting Closed" : "Open"}
                  </span>
                )}
                <button
                  onClick={() => handleDeleteClick(d.id)}
                  disabled={deletingId === d.id}
                  className="p-2 rounded-lg"
                  style={{ background: "rgba(255,71,87,0.1)", color: "#FF4757" }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>
              Votes: {JSON.stringify(d.data.tallies)}
            </p>

            {!d.data.is_closed && (
              d.data.voting_closed ? (
                resolvingId === d.id ? (
                  <div className="flex gap-2">
                    {d.data.options.map((opt: string) => (
                      <BashiriButton key={opt} size="md" onClick={() => handleResolve(d.id, opt)}>{opt}</BashiriButton>
                    ))}
                    <button onClick={() => setResolvingId(null)} className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Ghairi</button>
                  </div>
                ) : (
                  <BashiriButton size="md" variant="outline" onClick={() => setResolvingId(d.id)}>Weka Matokeo (Resolve)</BashiriButton>
                )
              ) : (
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                  Voting bado inaendelea — Resolve itapatikana baada ya muda wa kupiga kura umekwisha.
                </p>
              )
            )}
          </div>
        ))}
      </div>

      {showDeleteConfirm && (
        <ConfirmModal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={handleDeleteConfirm}
          title="Futa Debate?"
          message="Una uhakika unataka kufuta debate hii? Hatua hii haiwezi kurudishwa."
          confirmText="Futa"
          cancelText="Ghairi"
          variant="danger"
        />
      )}

      {showResolveConfirm && resolveTarget && (
        <ConfirmModal
          isOpen={showResolveConfirm}
          onClose={() => setShowResolveConfirm(false)}
          onConfirm={confirmResolve}
          title="Weka Matokeo?"
          message={`Una uhakika unataka kuweka "${resolveTarget.result}" kama matokeo ya mwisho? Hali hii haiwezi kubadilishwa.`}
          confirmText="Ndiyo"
          cancelText="Ghairi"
          variant="warning"
        />
      )}
    </div>
  );
}
