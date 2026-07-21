"use client";

import { motion } from "framer-motion";
import { User, Star } from "lucide-react";

interface PlayerCardProps {
  playerName: string;
  form: number; // 1-5 stars
  goals?: number;
  assists?: number;
  last5Matches?: ("G" | "A" | "W" | "L" | "D")[];
  position?: string;
  team?: string;
}

export function PlayerCard({ 
  playerName, 
  form, 
  goals, 
  assists, 
  last5Matches,
  position,
  team 
}: PlayerCardProps) {
  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={14}
            style={{ 
              color: star <= rating ? "var(--brand-primary)" : "var(--border)"
            }}
            fill={star <= rating ? "var(--brand-primary)" : "none"}
          />
        ))}
      </div>
    );
  };

  const getMatchResultColor = (result: string) => {
    switch (result) {
      case "G":
        return "var(--success)";
      case "A":
        return "var(--brand-accent)";
      case "W":
        return "var(--success)";
      case "L":
        return "var(--danger)";
      case "D":
        return "var(--warning)";
      default:
        return "var(--text-secondary)";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="rounded-2xl p-4 border"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div 
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(212, 175, 55, 0.1)" }}
        >
          <User size={18} style={{ color: "var(--brand-primary)" }} />
        </div>
        <div className="flex-1">
          <div 
            className="text-sm font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            {playerName}
          </div>
          {team && (
            <div 
              className="text-xs"
              style={{ color: "var(--text-secondary)" }}
            >
              {team}
            </div>
          )}
        </div>
        {position && (
          <div 
            className="px-2 py-1 rounded-lg text-xs font-bold"
            style={{ 
              background: "var(--glass-bg)",
              color: "var(--text-secondary)"
            }}
          >
            {position}
          </div>
        )}
      </div>

      {/* Form */}
      <div className="mb-4">
        <div 
          className="text-xs mb-2"
          style={{ color: "var(--text-secondary)" }}
        >
          Form
        </div>
        {renderStars(form)}
      </div>

      {/* Stats */}
      {(goals !== undefined || assists !== undefined) && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          {goals !== undefined && (
            <div 
              className="p-3 rounded-xl text-center"
              style={{ background: "var(--surface-alt)" }}
            >
              <div 
                className="text-xl font-bold"
                style={{ color: "var(--brand-primary)" }}
              >
                {goals}
              </div>
              <div 
                className="text-xs"
                style={{ color: "var(--text-secondary)" }}
              >
                Goals
              </div>
            </div>
          )}
          {assists !== undefined && (
            <div 
              className="p-3 rounded-xl text-center"
              style={{ background: "var(--surface-alt)" }}
            >
              <div 
                className="text-xl font-bold"
                style={{ color: "var(--brand-accent)" }}
              >
                {assists}
              </div>
              <div 
                className="text-xs"
                style={{ color: "var(--text-secondary)" }}
              >
                Assists
              </div>
            </div>
          )}
        </div>
      )}

      {/* Last 5 Matches */}
      {last5Matches && last5Matches.length > 0 && (
        <div>
          <div 
            className="text-xs mb-2"
            style={{ color: "var(--text-secondary)" }}
          >
            Last 5 Matches
          </div>
          <div className="flex gap-2">
            {last5Matches.map((result, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm border"
                style={{
                  background: "var(--surface-alt)",
                  borderColor: getMatchResultColor(result),
                  color: getMatchResultColor(result),
                }}
              >
                {result}
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
