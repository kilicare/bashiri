"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUsers } from "@/lib/api/admin";
import { Search } from "lucide-react";

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(true);
      getUsers({ search: search || undefined }).then((data) => { setUsers(data.results); setLoading(false); });
    }, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  return (
    <div>
      <h1 className="text-2xl font-black text-white mb-4">Watumiaji</h1>
      <div className="flex items-center gap-2 rounded-2xl px-4 py-3 mb-4 w-full md:max-w-sm" style={{ background: "#151515" }}>
        <Search size={16} style={{ color: "rgba(255,255,255,0.4)" }} />
        <input
          className="bg-transparent outline-none text-sm text-white flex-1"
          placeholder="Tafuta kwa namba au username..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Mobile Card Layout */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <p className="text-center py-6" style={{ color: "rgba(255,255,255,0.4)" }}>Inapakia...</p>
        ) : users.map((u) => (
          <div
            key={u.id}
            onClick={() => router.push(`/admin/users/${u.id}`)}
            className="rounded-2xl p-4 cursor-pointer"
            style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center" style={{ background: "rgba(255,255,255,0.1)" }}>
                {u.avatar_url ? (
                  <img src={u.avatar_url} alt={u.username} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-white">{u.username?.[0]?.toUpperCase() || "?"}</span>
                )}
              </div>
              <div className="flex-1">
                <p className="text-white font-bold">@{u.username || "—"}</p>
                <span className="text-xs" style={{ color: u.is_active ? "#00FF87" : "#FF4757" }}>{u.is_active ? "Active" : "Banned"}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p style={{ color: "rgba(255,255,255,0.4)" }}>Simu</p>
                <p style={{ color: "rgba(255,255,255,0.6)" }}>{u.phone_number}</p>
              </div>
              <div>
                <p style={{ color: "rgba(255,255,255,0.4)" }}>PRO</p>
                <p>{u.is_subscription_active ? "✅" : "—"}</p>
              </div>
              <div>
                <p style={{ color: "rgba(255,255,255,0.4)" }}>Accuracy</p>
                <p style={{ color: "#00FF87" }}>{u.accuracy_percentage}%</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden md:block rounded-2xl overflow-hidden" style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "rgba(255,255,255,0.03)" }}>
              <th className="text-left px-4 py-3 font-bold" style={{ color: "rgba(255,255,255,0.5)" }}>User</th>
              <th className="text-left px-4 py-3 font-bold" style={{ color: "rgba(255,255,255,0.5)" }}>Simu</th>
              <th className="text-left px-4 py-3 font-bold" style={{ color: "rgba(255,255,255,0.5)" }}>PRO</th>
              <th className="text-left px-4 py-3 font-bold" style={{ color: "rgba(255,255,255,0.5)" }}>Accuracy</th>
              <th className="text-left px-4 py-3 font-bold" style={{ color: "rgba(255,255,255,0.5)" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center" style={{ color: "rgba(255,255,255,0.4)" }}>Inapakia...</td></tr>
            ) : users.map((u) => (
              <tr
                key={u.id}
                onClick={() => router.push(`/admin/users/${u.id}`)}
                className="cursor-pointer hover:bg-white/5"
                style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl overflow-hidden flex items-center justify-center" style={{ background: "rgba(255,255,255,0.1)" }}>
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt={u.username} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-white">{u.username?.[0]?.toUpperCase() || "?"}</span>
                      )}
                    </div>
                    <span className="text-white font-bold">@{u.username || "—"}</span>
                  </div>
                </td>
                <td className="px-4 py-3" style={{ color: "rgba(255,255,255,0.6)" }}>{u.phone_number}</td>
                <td className="px-4 py-3">{u.is_subscription_active ? "✅" : "—"}</td>
                <td className="px-4 py-3" style={{ color: "#00FF87" }}>{u.accuracy_percentage}%</td>
                <td className="px-4 py-3">
                  <span style={{ color: u.is_active ? "#00FF87" : "#FF4757" }}>{u.is_active ? "Active" : "Banned"}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
