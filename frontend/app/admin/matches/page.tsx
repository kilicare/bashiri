"use client";
import { useEffect, useState } from "react";
import { getMatches, updateMatch } from "@/lib/api/admin";

export default function AdminMatchesPage() {
  const [matches, setMatches] = useState<any[]>([]);
  const [allMatches, setAllMatches] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [leagueFilter, setLeagueFilter] = useState("");

  useEffect(() => {
    getMatches({ status: statusFilter || undefined, league: leagueFilter || undefined }).then(setMatches);
  }, [statusFilter, leagueFilter]);

  useEffect(() => {
    getMatches().then(setAllMatches);
  }, []);

  const uniqueLeagues = Array.from(new Set(allMatches.map((m) => m.league_name))).filter(Boolean);

  async function toggleBigMatch(id: number, current: boolean) {
    await updateMatch(id, { is_big_match: !current });
    setMatches((prev) => prev.map((m) => (m.id === id ? { ...m, is_big_match: !current } : m)));
  }

  return (
    <div>
      <h1 className="text-2xl font-black text-white mb-4">Mechi</h1>
      <div className="flex gap-2 mb-4 flex-wrap">
        {["", "SCHEDULED", "LIVE", "FINISHED"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className="px-3 py-1.5 rounded-full text-xs font-bold"
            style={{ background: statusFilter === s ? "#00FF87" : "rgba(255,255,255,0.06)", color: statusFilter === s ? "#000" : "rgba(255,255,255,0.5)" }}
          >
            {s || "Zote"}
          </button>
        ))}
      </div>
      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setLeagueFilter("")}
          className="px-3 py-1.5 rounded-full text-xs font-bold"
          style={{ background: leagueFilter === "" ? "#00FF87" : "rgba(255,255,255,0.06)", color: leagueFilter === "" ? "#000" : "rgba(255,255,255,0.5)" }}
        >
          Ligi Zote
        </button>
        {uniqueLeagues.map((league) => (
          <button
            key={league}
            onClick={() => setLeagueFilter(league)}
            className="px-3 py-1.5 rounded-full text-xs font-bold"
            style={{ background: leagueFilter === league ? "#00FF87" : "rgba(255,255,255,0.06)", color: leagueFilter === league ? "#000" : "rgba(255,255,255,0.5)" }}
          >
            {league}
          </button>
        ))}
      </div>

      {/* Mobile Card Layout */}
      <div className="md:hidden space-y-3">
        {matches.map((m) => (
          <div
            key={m.id}
            className="rounded-2xl p-4"
            style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <p className="text-white font-bold mb-2">{m.home_team_name} vs {m.away_team_name}</p>
            <div className="grid grid-cols-2 gap-2 text-xs mb-3">
              <div>
                <p style={{ color: "rgba(255,255,255,0.4)" }}>Ligi</p>
                <p style={{ color: "rgba(255,255,255,0.6)" }}>{m.league_name}</p>
              </div>
              <div>
                <p style={{ color: "rgba(255,255,255,0.4)" }}>Status</p>
                <p style={{ color: "rgba(255,255,255,0.6)" }}>{m.status}</p>
              </div>
            </div>
            <button
              onClick={() => toggleBigMatch(m.id, m.is_big_match)}
              className="w-full px-3 py-2 rounded-full text-xs font-bold"
              style={{ background: m.is_big_match ? "#00FF87" : "rgba(255,255,255,0.06)", color: m.is_big_match ? "#000" : "rgba(255,255,255,0.5)" }}
            >
              {m.is_big_match ? "Ndiyo - Big Match" : "Hapana"}
            </button>
          </div>
        ))}
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden md:block rounded-2xl overflow-hidden" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "rgba(255,255,255,0.03)" }}>
              <th className="text-left px-4 py-3 font-bold" style={{ color: "rgba(255,255,255,0.5)" }}>Mechi</th>
              <th className="text-left px-4 py-3 font-bold" style={{ color: "rgba(255,255,255,0.5)" }}>Ligi</th>
              <th className="text-left px-4 py-3 font-bold" style={{ color: "rgba(255,255,255,0.5)" }}>Status</th>
              <th className="text-left px-4 py-3 font-bold" style={{ color: "rgba(255,255,255,0.5)" }}>Big Match</th>
            </tr>
          </thead>
          <tbody>
            {matches.map((m) => (
              <tr key={m.id} style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <td className="px-4 py-3 text-white font-bold">{m.home_team_name} vs {m.away_team_name}</td>
                <td className="px-4 py-3" style={{ color: "rgba(255,255,255,0.6)" }}>{m.league_name}</td>
                <td className="px-4 py-3" style={{ color: "rgba(255,255,255,0.6)" }}>{m.status}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleBigMatch(m.id, m.is_big_match)}
                    className="px-3 py-1 rounded-full text-xs font-bold"
                    style={{ background: m.is_big_match ? "#00FF87" : "rgba(255,255,255,0.06)", color: m.is_big_match ? "#000" : "rgba(255,255,255,0.5)" }}
                  >
                    {m.is_big_match ? "Ndiyo" : "Hapana"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
