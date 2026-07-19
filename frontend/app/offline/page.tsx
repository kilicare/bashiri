export default function OfflinePage() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 text-center" style={{ background: "#0A0A0A" }}>
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5" style={{ background: "rgba(255,71,87,0.1)" }}>
        <span className="text-3xl">📡</span>
      </div>
      <h1 className="text-xl font-black text-white mb-2">Hakuna Mtandao</h1>
      <p className="text-sm max-w-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
        Bashiri inahitaji internet kupata AI Predictions na Live Scores mpya.
        Angalia mtandao wako kisha jaribu tena.
      </p>
    </div>
  );
}
