"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X, Target } from "lucide-react";
import { commandSearch, CommandSearchResults } from "@/lib/api/command-search";
import { useCommandPaletteStore } from "@/stores/commandPalette.store";

export function CommandPalette() {
  const router = useRouter();
  const { isOpen, close } = useCommandPaletteStore();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CommandSearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
      setResults(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setResults(null);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(() => {
      commandSearch(query).then((data) => {
        setResults(data);
        setLoading(false);
      });
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function goToMatch(id: number) {
    close();
    router.push(`/create/${id}/overview`);
  }

  function goToTeam(id: number) {
    close();
    router.push(`/team/${id}`);
  }

  function goToLeague(id: number, code: string) {
    close();
    router.push(`/league/${code}`);
  }

  const hasResults = results && (results.matches.length > 0 || results.teams.length > 0 || results.leagues.length > 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-50"
            style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(4px)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          />
          <motion.div
            className="fixed top-20 left-4 right-4 z-50 rounded-3xl overflow-hidden max-w-lg mx-auto"
            style={{ background: "#111111", border: "2px solid rgba(212,175,55,0.3)" }}
            initial={{ opacity: 0, y: -20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: "rgba(212,175,55,0.15)" }}>
              <Search size={18} style={{ color: "#D4AF37" }} />
              <input
                ref={inputRef}
                className="flex-1 bg-transparent outline-none text-sm text-white"
                placeholder="Tafuta timu, ligi, au mechi..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button onClick={close}><X size={16} style={{ color: "#D4AF37" }} /></button>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {loading && <p className="text-xs text-center py-6" style={{ color: "rgba(255,255,255,0.4)" }}>Inatafuta...</p>}

              {!loading && query.length >= 2 && !hasResults && (
                <p className="text-xs text-center py-6" style={{ color: "rgba(255,255,255,0.4)" }}>Hakuna matokeo.</p>
              )}

              {results && results.teams.length > 0 && (
                <div className="px-2 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest px-2 mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>Timu</p>
                  {results.teams.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => goToTeam(t.id)}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all hover:scale-[1.02] text-left"
                      style={{ background: "rgba(212,175,55,0.05)", border: "1px solid rgba(212,175,55,0.1)" }}
                    >
                      <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden" style={{ background: "rgba(212,175,55,0.15)" }}>
                        {t.crest_url ? (
                          <img 
                            src={t.crest_url} 
                            alt={t.name}
                            className="w-full h-full object-contain p-1"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <Target size={16} style={{ color: "#D4AF37" }} className={t.crest_url ? 'hidden' : ''} />
                      </div>
                      <div>
                        <div className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>{t.name}</div>
                        <div className="text-xs" style={{ color: "var(--text-secondary)" }}>{t.league?.name || ''}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {results && results.leagues.length > 0 && (
                <div className="px-2 py-2 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest px-2 mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>Ligi</p>
                  {results.leagues.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => goToLeague(l.id, l.code)}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all hover:scale-[1.02] text-left"
                      style={{ background: "rgba(212,175,55,0.05)", border: "1px solid rgba(212,175,55,0.1)" }}
                    >
                      <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden" style={{ background: "rgba(212,175,55,0.15)" }}>
                        {l.logo_url ? (
                          <img 
                            src={l.logo_url} 
                            alt={l.name}
                            className="w-full h-full object-contain p-1"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <Target size={16} style={{ color: "#D4AF37" }} className={l.logo_url ? 'hidden' : ''} />
                      </div>
                      <div>
                        <div className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>{l.name}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {results && results.matches.length > 0 && (
                <div className="px-2 py-2 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest px-2 mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>Mechi</p>
                  {results.matches.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => goToMatch(m.id)}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all hover:scale-[1.02] text-left"
                      style={{ background: "rgba(212,175,55,0.05)", border: "1px solid rgba(212,175,55,0.1)" }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden" style={{ background: "rgba(212,175,55,0.15)" }}>
                          {m.home_team.crest_url ? (
                            <img 
                              src={m.home_team.crest_url} 
                              alt={m.home_team.name}
                              className="w-full h-full object-contain p-1"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <Target size={12} style={{ color: "#D4AF37" }} className={m.home_team.crest_url ? 'hidden' : ''} />
                        </div>
                        <span className="text-xs" style={{ color: "var(--text-secondary)" }}>vs</span>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden" style={{ background: "rgba(212,175,55,0.15)" }}>
                          {m.away_team.crest_url ? (
                            <img 
                              src={m.away_team.crest_url} 
                              alt={m.away_team.name}
                              className="w-full h-full object-contain p-1"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <Target size={12} style={{ color: "#D4AF37" }} className={m.away_team.crest_url ? 'hidden' : ''} />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>{m.home_team.name} vs {m.away_team.name}</div>
                        <div className="text-xs" style={{ color: "var(--text-secondary)" }}>{m.league.name}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
