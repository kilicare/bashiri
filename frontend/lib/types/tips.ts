// ============================================
// TIP TYPES & INTERFACES
// ============================================

export interface BashiriUser {
  id: number
  username: string
  avatar_url: string
  verified_tipster: boolean
  tip_accuracy: number
  total_tips: number
  tipster_score: number
  followers_count: number
  following_count: number
  current_streak: number
  best_streak: number
}

export interface TipMatch {
  id: number
  home_team_name: string
  away_team_name: string
  league_code: string
  league_name: string
  kickoff_at: string
  status: "SCHEDULED" | "LIVE" | "FINISHED" | "POSTPONED" | "CANCELLED"
  home_score: number | null
  away_score: number | null
}

export interface UserTip {
  id: number
  user: BashiriUser
  match: TipMatch
  market_key: string
  market_label: string
  selection: string
  selection_label: string
  confidence: number
  reasoning: string
  status: "PENDING" | "CORRECT" | "INCORRECT" | "VOID"
  visibility: "PUBLIC" | "FOLLOWERS" | "PRIVATE"
  views_count: number
  upvotes_count: number
  downvotes_count: number
  comments_count: number
  net_votes: number
  engagement_score: number
  is_locked: boolean
  ai_snapshot: {
    model_version: string
    prediction_generated_at: string
    raw_probability: number | null
    calibrated_probability: number | null
    recommendation_tier: string | null
    data_quality: number | null
    confidence_score: number | null
    ai_agrees: boolean
  } | null
  user_vote?: "UP" | "DOWN" | null
  comments: TipComment[]
  created_at: string
  updated_at: string
  verified_at: string | null
  locked_at: string | null
}

export interface UserTipList {
  id: number
  user: BashiriUser
  home_team: string
  away_team: string
  league_name: string
  kickoff_at: string
  market_key: string
  market_label: string
  selection: string
  selection_label: string
  confidence: number
  status: "PENDING" | "CORRECT" | "INCORRECT" | "VOID"
  views_count: number
  upvotes_count: number
  downvotes_count: number
  comments_count: number
  is_locked: boolean
  ai_agrees: boolean | null
  created_at: string
}

export interface TipComment {
  id: number
  user: BashiriUser
  content: string
  created_at: string
  updated_at: string
  replies: TipComment[]
}

export interface SelectionOption {
  key: string
  label: string
}

export interface MarketDefinition {
  key: string
  label: string
  category: string
  selections: SelectionOption[]
  available: boolean
  requires_final_score: boolean
  supports_draw_void: boolean
}

export interface MarketRegistryResponse {
  markets: MarketDefinition[]
  categories: string[]
}

export interface TipPerformance {
  id: number
  user: BashiriUser
  rank: number
  total_tips: number
  correct_tips: number
  incorrect_tips: number
  void_tips: number
  accuracy_percentage: number
  tips_1x2: number
  accuracy_1x2: number
  tips_btts: number
  accuracy_btts: number
  tips_over_under: number
  accuracy_over_under: number
  tips_double_chance: number
  accuracy_double_chance: number
  tips_dnb: number
  accuracy_dnb: number
  tips_epl: number
  accuracy_epl: number
  tips_laliga: number
  accuracy_laliga: number
  tips_seriea: number
  accuracy_seriea: number
  tips_bundesliga: number
  accuracy_bundesliga: number
  tips_ligue1: number
  accuracy_ligue1: number
  tipster_score: number
  tipster_score_version: string
  current_streak: number
  best_streak: number
  recent_form_tips: number
  recent_form_correct: number
  recent_form_percentage: number | null
  market_specialization: {
    market: string
    accuracy: number
    sample_size: number
  } | null
  league_specialization: {
    league: string
    accuracy: number
    sample_size: number
  } | null
  followers_count: number
  total_upvotes_received: number
  updated_at: string
}

export interface TipStar {
  id: number
  user: BashiriUser
  total_tips: number
  correct_tips: number
  accuracy_percentage: number
  tipster_score: number
  current_streak: number
  best_streak: number
  followers_count: number
  updated_at: string
}

export interface CreateTipRequest {
  match: number
  market_key: string
  selection: string
  confidence: number
  reasoning?: string
  visibility: "PUBLIC" | "FOLLOWERS" | "PRIVATE"
}

export interface UpdateTipRequest {
  market_key?: string
  selection?: string
  confidence?: number
  reasoning?: string
  visibility?: "PUBLIC" | "FOLLOWERS" | "PRIVATE"
}

export interface TipFilters {
  league?: string | null
  market?: string | null
  user?: string | null
  following?: boolean | null
  match?: number | null
  status?: string
  sort?: string
  page_size?: number
}

export interface TipsListResponse {
  count: number
  next: string | null
  previous: string | null
  results: UserTipList[]
}

export interface LeaderboardResponse {
  count: number
  results: TipPerformance[]
}

export interface CommentsResponse {
  count: number
  results: TipComment[]
}
