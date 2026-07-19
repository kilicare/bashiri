"use client";

const MOODS = [
  { key: "FUNNY", emoji: "😂", label: "Funny" },
  { key: "FIRE", emoji: "🔥", label: "Fire" },
  { key: "ANGRY", emoji: "😡", label: "Angry" },
  { key: "RESPECT", emoji: "👏", label: "Respect" },
  { key: "SHOCK", emoji: "🤯", label: "Shock" },
  { key: "PAIN", emoji: "💔", label: "Pain" },
];

export function MoodSelector({ selected, onSelect }: { selected: string; onSelect: (mood: string) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {MOODS.map((m) => (
        <button
          key={m.key}
          onClick={() => onSelect(m.key)}
          className="rounded-2xl p-3 text-center"
          style={{
            background: selected === m.key ? "rgba(212,175,55,0.12)" : "#151515",
            border: selected === m.key ? "2px solid var(--brand-primary)" : "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <p className="text-2xl mb-1">{m.emoji}</p>
          <p className="text-[10px] font-bold text-white">{m.label}</p>
        </button>
      ))}
    </div>
  );
}