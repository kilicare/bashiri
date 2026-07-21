"use client";

import { motion } from "framer-motion";
import { Trophy, Shield, Target, Star, Edit, Check } from "lucide-react";
import { useState } from "react";

interface FootballProfileProps {
  profile?: {
    favoriteLeague?: string;
    analysisStyle?: "detailed" | "concise" | "balanced";
    riskPreference?: "conservative" | "balanced" | "aggressive";
    favoriteTeams?: string[];
    preferredMarkets?: string[];
  };
  onUpdateProfile?: (profile: any) => void;
}

const LEAGUES = [
  { id: "premier-league", name: "Premier League", icon: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { id: "la-liga", name: "La Liga", icon: "🇪🇸" },
  { id: "bundesliga", name: "Bundesliga", icon: "🇩🇪" },
  { id: "serie-a", name: "Serie A", icon: "🇮🇹" },
  { id: "ligue-1", name: "Ligue 1", icon: "🇫🇷" },
  { id: "champions-league", name: "Champions League", icon: "🏆" },
];

const ANALYSIS_STYLES = [
  { id: "detailed", name: "Detailed", description: "In-depth analysis with all factors" },
  { id: "concise", name: "Concise", description: "Quick insights and key points" },
  { id: "balanced", name: "Balanced", description: "Mix of detail and brevity" },
];

const RISK_PREFERENCES = [
  { id: "conservative", name: "Conservative", description: "Safer, lower-risk predictions" },
  { id: "balanced", name: "Balanced", description: "Moderate risk-reward balance" },
  { id: "aggressive", name: "Aggressive", description: "High-risk, high-reward opportunities" },
];

const MARKETS = [
  "Match Winner",
  "Over/Under",
  "Both Teams to Score",
  "Asian Handicap",
  "Correct Score",
  "First Goalscorer",
];

export function FootballProfile({ profile, onUpdateProfile }: FootballProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempProfile, setTempProfile] = useState(profile || {});

  const handleSave = () => {
    onUpdateProfile?.(tempProfile);
    setIsEditing(false);
  };

  const toggleTeam = (team: string) => {
    const currentTeams = tempProfile.favoriteTeams || [];
    const newTeams = currentTeams.includes(team)
      ? currentTeams.filter((t: string) => t !== team)
      : [...currentTeams, team];
    setTempProfile({ ...tempProfile, favoriteTeams: newTeams });
  };

  const toggleMarket = (market: string) => {
    const currentMarkets = tempProfile.preferredMarkets || [];
    const newMarkets = currentMarkets.includes(market)
      ? currentMarkets.filter((m: string) => m !== market)
      : [...currentMarkets, market];
    setTempProfile({ ...tempProfile, preferredMarkets: newMarkets });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(212, 175, 55, 0.1)" }}
          >
            <Trophy size={20} style={{ color: "var(--brand-primary)" }} />
          </div>
          <div>
            <h3 
              className="font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              Football Preferences
            </h3>
            <p 
              className="text-xs"
              style={{ color: "var(--text-secondary)" }}
            >
              Customize your AI experience
            </p>
          </div>
        </div>
        {!isEditing && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setTempProfile(profile || {});
              setIsEditing(true);
            }}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "var(--glass-bg)" }}
          >
            <Edit size={16} style={{ color: "var(--text-secondary)" }} />
          </motion.button>
        )}
      </div>

      {isEditing ? (
        <>
          {/* Favorite League */}
          <div>
            <label 
              className="text-sm font-medium mb-3 block"
              style={{ color: "var(--text-primary)" }}
            >
              Favorite League
            </label>
            <div className="grid grid-cols-2 gap-2">
              {LEAGUES.map((league) => (
                <motion.button
                  key={league.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setTempProfile({ ...tempProfile, favoriteLeague: league.id })}
                  className={`p-3 rounded-xl text-sm font-medium border transition-all ${
                    tempProfile.favoriteLeague === league.id ? "border-2" : "border"
                  }`}
                  style={{
                    background: tempProfile.favoriteLeague === league.id 
                      ? "rgba(212, 175, 55, 0.1)" 
                      : "var(--surface)",
                    borderColor: tempProfile.favoriteLeague === league.id 
                      ? "var(--brand-primary)" 
                      : "var(--border)",
                    color: "var(--text-primary)",
                  }}
                >
                  <span className="mr-2">{league.icon}</span>
                  {league.name}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Analysis Style */}
          <div>
            <label 
              className="text-sm font-medium mb-3 block"
              style={{ color: "var(--text-primary)" }}
            >
              Analysis Style
            </label>
            <div className="space-y-2">
              {ANALYSIS_STYLES.map((style) => (
                <motion.button
                  key={style.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setTempProfile({ ...tempProfile, analysisStyle: style.id as "detailed" | "concise" | "balanced" })}
                  className={`w-full p-3 rounded-xl text-left border transition-all ${
                    tempProfile.analysisStyle === style.id ? "border-2" : "border"
                  }`}
                  style={{
                    background: tempProfile.analysisStyle === style.id 
                      ? "rgba(212, 175, 55, 0.1)" 
                      : "var(--surface)",
                    borderColor: tempProfile.analysisStyle === style.id 
                      ? "var(--brand-primary)" 
                      : "var(--border)",
                  }}
                >
                  <div 
                    className="text-sm font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {style.name}
                  </div>
                  <div 
                    className="text-xs"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {style.description}
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Risk Preference */}
          <div>
            <label 
              className="text-sm font-medium mb-3 block"
              style={{ color: "var(--text-primary)" }}
            >
              Risk Preference
            </label>
            <div className="space-y-2">
              {RISK_PREFERENCES.map((risk) => (
                <motion.button
                  key={risk.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setTempProfile({ ...tempProfile, riskPreference: risk.id as "conservative" | "balanced" | "aggressive" })}
                  className={`w-full p-3 rounded-xl text-left border transition-all ${
                    tempProfile.riskPreference === risk.id ? "border-2" : "border"
                  }`}
                  style={{
                    background: tempProfile.riskPreference === risk.id 
                      ? "rgba(212, 175, 55, 0.1)" 
                      : "var(--surface)",
                    borderColor: tempProfile.riskPreference === risk.id 
                      ? "var(--brand-primary)" 
                      : "var(--border)",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Shield size={16} style={{ color: "var(--brand-primary)" }} />
                    <div 
                      className="text-sm font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {risk.name}
                    </div>
                  </div>
                  <div 
                    className="text-xs"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {risk.description}
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Preferred Markets */}
          <div>
            <label 
              className="text-sm font-medium mb-3 block"
              style={{ color: "var(--text-primary)" }}
            >
              Preferred Markets
            </label>
            <div className="flex flex-wrap gap-2">
              {MARKETS.map((market) => (
                <motion.button
                  key={market}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => toggleMarket(market)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                    (tempProfile.preferredMarkets || []).includes(market) ? "border-2" : "border"
                  }`}
                  style={{
                    background: (tempProfile.preferredMarkets || []).includes(market)
                      ? "rgba(212, 175, 55, 0.1)" 
                      : "var(--surface)",
                    borderColor: (tempProfile.preferredMarkets || []).includes(market)
                      ? "var(--brand-primary)" 
                      : "var(--border)",
                    color: "var(--text-primary)",
                  }}
                >
                  {(tempProfile.preferredMarkets || []).includes(market) && (
                    <Check size={14} className="inline mr-1" style={{ color: "var(--brand-primary)" }} />
                  )}
                  {market}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            className="w-full py-3 rounded-xl font-medium text-sm"
            style={{
              background: "var(--gradient-gold)",
              color: "#000",
            }}
          >
            Save Preferences
          </motion.button>
        </>
      ) : (
        <>
          {/* Display Mode */}
          <div className="space-y-4">
            {profile?.favoriteLeague && (
              <div className="p-4 rounded-xl" style={{ background: "var(--surface-alt)" }}>
                <div 
                  className="text-xs mb-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Favorite League
                </div>
                <div 
                  className="text-sm font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  {LEAGUES.find((l) => l.id === profile.favoriteLeague)?.name}
                </div>
              </div>
            )}

            {profile?.analysisStyle && (
              <div className="p-4 rounded-xl" style={{ background: "var(--surface-alt)" }}>
                <div 
                  className="text-xs mb-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Analysis Style
                </div>
                <div 
                  className="text-sm font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  {ANALYSIS_STYLES.find((s) => s.id === profile.analysisStyle)?.name}
                </div>
              </div>
            )}

            {profile?.riskPreference && (
              <div className="p-4 rounded-xl" style={{ background: "var(--surface-alt)" }}>
                <div 
                  className="text-xs mb-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Risk Preference
                </div>
                <div 
                  className="text-sm font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  {RISK_PREFERENCES.find((r) => r.id === profile.riskPreference)?.name}
                </div>
              </div>
            )}

            {profile?.preferredMarkets && profile.preferredMarkets.length > 0 && (
              <div className="p-4 rounded-xl" style={{ background: "var(--surface-alt)" }}>
                <div 
                  className="text-xs mb-2"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Preferred Markets
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.preferredMarkets.map((market) => (
                    <span
                      key={market}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium"
                      style={{
                        background: "var(--glass-bg)",
                        color: "var(--text-primary)",
                      }}
                    >
                      {market}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
