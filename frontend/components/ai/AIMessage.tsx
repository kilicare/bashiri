"use client";

import { MessageBubble } from "./MessageBubble";
import { MessageActions } from "./MessageActions";
import { MessageToolbar } from "./MessageToolbar";
import { AIResponseContainer } from "./AIResponseContainer";
import { StreamingText } from "./StreamingText";
import { PredictionCard } from "./PredictionCard";
import { TeamCard } from "./TeamCard";
import { FormCard } from "./FormCard";
import { MomentumIndicator } from "./MomentumIndicator";
import { TeamComparisonCard } from "./TeamComparisonCard";
import { ProbabilityVisualization } from "./ProbabilityVisualization";
import { ConfidenceIndicator } from "./ConfidenceIndicator";
import { FollowUpActions } from "./FollowUpActions";
import { ReactNode, useState, memo } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

type MessageState = "thinking" | "generating" | "complete";

interface ResponseSection {
  id: string;
  title: string;
  content: ReactNode;
  icon?: ReactNode;
}

interface AIMessageProps {
  content: string | ResponseSection[];
  timestamp?: string;
  state?: MessageState;
  toolResult?: {
    tool_name: string;
    data: any;
  };
  messageId?: number;
  onHelpful?: (messageId: number) => void;
  onNotHelpful?: (messageId: number) => void;
}

export const AIMessage = memo(function AIMessage({ content, timestamp, state = "complete", toolResult, messageId, onHelpful, onNotHelpful }: AIMessageProps) {
  const [showActions, setShowActions] = useState(false);
  const router = useRouter();

  const handleCopy = () => {
    const textContent = Array.isArray(content) 
      ? content.map(s => `${s.title}: ${typeof s.content === 'string' ? s.content : ''}`).join('\n')
      : content;
    if (typeof textContent === 'string') {
      navigator.clipboard.writeText(textContent);
    }
  };

  const handleHelpful = () => {
    if (messageId && onHelpful) {
      onHelpful(messageId);
    }
  };

  const handleNotHelpful = () => {
    if (messageId && onNotHelpful) {
      onNotHelpful(messageId);
    }
  };

  const renderToolCard = () => {
    if (!toolResult || !toolResult.data || !toolResult.data.success) return null;

    const { tool_name, data } = toolResult;

    switch (tool_name) {
      case "predict_fixture":
        return (
          <div className="mt-4 space-y-3">
            <PredictionCard
              prediction={data.data.prediction || "TBD"}
              confidence={data.data.confidence || 50}
              teams={{
                home: data.data.home_team,
                away: data.data.away_team,
              }}
            />
            {data.data.probabilities && (
              <ProbabilityVisualization
                probabilities={data.data.probabilities}
                title="Match Probability"
              />
            )}
            <FollowUpActions
              actions={[
                {
                  id: "dashboard",
                  label: "Ona Dashboard Kamili",
                  icon: null,
                  onClick: () => router.push(`/create/${data.data.match_id}/predict`),
                },
              ]}
            />
          </div>
        );

      case "team_form":
        return (
          <div className="mt-4 space-y-3">
            <TeamCard
              teamName={data.data.team_name}
              attack={data.data.attack || 50}
              defense={data.data.defense || 50}
              form={data.data.form || 50}
              recentResults={data.data.sequence?.split('') || []}
            />
            {data.data.sequence && (
              <FormCard
                teamName={data.data.team_name}
                results={data.data.sequence.split('') as ("W" | "D" | "L")[]}
              />
            )}
            <MomentumIndicator
              team={data.data.team_name}
              direction={data.data.momentum || "neutral"}
              intensity={data.data.momentum_intensity || 5}
            />
          </div>
        );

      case "head_to_head":
        return (
          <div className="mt-4">
            <TeamComparisonCard
              homeTeam={data.data.team1_name}
              awayTeam={data.data.team2_name}
              homeStats={{
                attack: data.data.home_stats?.attack || 3,
                defense: data.data.home_stats?.defense || 3,
                form: data.data.home_stats?.form || 3,
              }}
              awayStats={{
                attack: data.data.away_stats?.attack || 3,
                defense: data.data.away_stats?.defense || 3,
                form: data.data.away_stats?.form || 3,
              }}
            />
          </div>
        );

      case "ai_track_record":
        return (
          <div className="mt-4 p-4 rounded-2xl border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <h3 className="font-bold text-sm mb-3" style={{ color: "var(--text-primary)" }}>AI Track Record</h3>
            <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Overall Accuracy: <span className="font-bold" style={{ color: "var(--brand-primary)" }}>{data.data.overall_accuracy}%</span>
            </div>
            {data.data.created_at && (
              <div className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
                Updated: {new Date(data.data.created_at).toLocaleDateString()}
              </div>
            )}
          </div>
        );

      case "active_derby":
        if (!data.data.active) {
          return (
            <div className="mt-4 p-4 rounded-2xl border w-full overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Hakuna Derby inayoendelea sasa.
              </div>
            </div>
          );
        }
        return (
          <div className="mt-4 space-y-3">
            {data.data.derbies.map((derby: any) => (
              <div
                key={derby.id}
                className="p-4 rounded-2xl border cursor-pointer transition-all hover:border-opacity-50 w-full overflow-hidden"
                style={{ background: "var(--surface)", borderColor: derby.theme_accent_color || "var(--border)" }}
                onClick={() => router.push(`/create/${derby.match_id}/predict`)}
              >
                <h3 className="font-bold text-sm mb-2 truncate" style={{ color: "var(--text-primary)" }} title={derby.derby_name}>{derby.derby_name}</h3>
                <div className="flex items-center justify-between text-sm gap-2">
                  <span className="truncate" style={{ color: "var(--text-secondary)" }} title={`${derby.home_team} vs ${derby.away_team}`}>{derby.home_team} vs {derby.away_team}</span>
                  <span className="font-bold flex-shrink-0" style={{ color: "var(--brand-primary)" }}>→</span>
                </div>
              </div>
            ))}
          </div>
        );

      case "search_matches":
        return (
          <div className="mt-4 space-y-3">
            {data.data.matches.map((match: any) => (
              <div
                key={match.id}
                className="p-4 rounded-2xl border cursor-pointer transition-all w-full overflow-hidden"
                style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                onClick={() => router.push(`/create/${match.id}/predict`)}
              >
                <div className="flex items-center justify-between mb-2 gap-2">
                  <div className="text-sm font-bold truncate" style={{ color: "var(--text-primary)" }} title={`${match.home_team} vs ${match.away_team}`}>
                    {match.home_team} vs {match.away_team}
                  </div>
                  <div className="text-xs px-2 py-1 rounded-lg flex-shrink-0" style={{ background: "var(--glass-bg)", color: "var(--text-secondary)" }}>
                    {match.status}
                  </div>
                </div>
                <div className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                  {new Date(match.kickoff_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  const getStateMessage = () => {
    switch (state) {
      case "thinking":
        return "BASHIRI AI inachambua...";
      case "generating":
        return "Building match analysis...";
      default:
        return null;
    }
  };

  const stateMessage = getStateMessage();

  return (
    <MessageBubble isUser={false}>
      <div className="flex gap-3">
        {/* AI Avatar */}
        <div 
          className="w-8 h-8 rounded-2xl flex items-center justify-center text-xs font-black flex-shrink-0"
          style={{
            background: "var(--gradient-gold)",
            color: "#000",
          }}
        >
          B
        </div>

        {/* Message Content */}
        <div className="flex-1 min-w-0">
          <div
            className="rounded-3xl px-4 py-3 max-w-[85%] md:max-w-[70%] text-sm leading-relaxed relative group overflow-hidden"
            style={{
              background: "var(--surface)",
              color: "var(--text-primary)",
              border: "1px solid var(--border)",
              borderBottomLeftRadius: "var(--radius-md)",
            }}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
          >
            {stateMessage && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2"
                style={{ color: "var(--text-secondary)" }}
              >
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: "var(--brand-primary)" }}
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        delay: i * 0.2,
                      }}
                    />
                  ))}
                </div>
                <span className="text-xs">{stateMessage}</span>
              </motion.div>
            )}
            
            {!stateMessage && Array.isArray(content) ? (
              <AIResponseContainer sections={content} />
            ) : (
              !stateMessage && (
                <>
                  <StreamingText text={content as string} speed={10} />
                  {renderToolCard()}
                </>
              )
            )}
            
            {timestamp && state === "complete" && (
              <div 
                className="text-xs mt-2 opacity-50"
                style={{ color: "var(--text-secondary)" }}
              >
                {timestamp}
              </div>
            )}
          </div>
          <MessageActions show={showActions && state === "complete"} onCopy={handleCopy} />
          <MessageToolbar 
            show={showActions && state === "complete"} 
            onHelpful={handleHelpful}
            onNotHelpful={handleNotHelpful}
          />
        </div>
      </div>
    </MessageBubble>
  );
});
