'use client'

import { motion } from 'framer-motion'
import { Sparkles, TrendingUp, Award, Target } from 'lucide-react'
import { useState, useEffect } from 'react'
import { getAIPerformanceStats, AIPerformanceStats } from '@/lib/api/predictions'

export function AIWeeklyReport() {
  const [aiStats, setAiStats] = useState<AIPerformanceStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAIStats()
  }, [])

  async function fetchAIStats() {
    try {
      const data = await getAIPerformanceStats()
      setAiStats(data)
    } catch (error) {
      console.error('Failed to fetch AI performance stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="rounded-3xl p-5 animate-pulse" style={{
        background: "linear-gradient(135deg, rgba(212,175,55,0.08), rgba(207,175,123,0.04))",
        border: "1px solid rgba(212,175,55,0.15)"
      }}>
        <div className="h-4 w-24 rounded mb-3" style={{ background: "rgba(212,175,55,0.2)" }} />
        <div className="h-8 w-16 rounded mb-1" style={{ background: "rgba(255,255,255,0.1)" }} />
        <div className="h-3 w-32 rounded" style={{ background: "rgba(255,255,255,0.05)" }} />
      </div>
    )
  }

  if (!aiStats) return null

  const weekly = aiStats.weekly

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="rounded-3xl p-5 transition-all duration-300 hover:shadow-lg cursor-pointer"
      style={{
        background: "linear-gradient(135deg, rgba(212,175,55,0.08), rgba(207,175,123,0.04))",
        border: "1px solid rgba(212,175,55,0.15)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.12), 0 0 1px rgba(212,175,55,0.1)"
      }}
      onClick={() => window.location.href = '/ai-picks'}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles size={16} style={{ color: "var(--brand-accent)" }} />
          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--brand-accent)" }}>
            AI Weekly Report
          </span>
        </div>
        {weekly.accuracy_percentage >= 70 && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-full" style={{ background: "rgba(76,175,80,0.2)", border: "1px solid rgba(76,175,80,0.3)" }}>
            <Award size={10} className="text-green-400" />
            <span className="text-[10px] font-bold text-green-400">Hot</span>
          </div>
        )}
      </div>

      <div className="flex items-end gap-3 mb-2">
        <p className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
          {weekly.accuracy_percentage ?? 0}%
        </p>
        <div className="flex items-center gap-1 pb-1">
          {weekly.accuracy_percentage >= 70 ? (
            <TrendingUp size={16} className="text-green-400" />
          ) : (
            <Target size={16} className="text-white/50" />
          )}
        </div>
      </div>

      <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
        {weekly.correct_predictions}/{weekly.total_predictions} sahihi wiki hii
      </p>

      {weekly.high_confidence_accuracy && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-white/50">High Confidence</span>
            <span className="text-[10px] font-bold" style={{ color: "var(--brand-accent)" }}>
              {weekly.high_confidence_accuracy}%
            </span>
          </div>
        </div>
      )}
    </motion.div>
  )
}
