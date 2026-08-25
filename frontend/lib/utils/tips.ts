export function getMarketLabel(marketKey: string): string {
  const labels: Record<string, string> = {
    '1X2': 'Win/Draw/Loss',
    'DRAW_NO_BET': 'Draw No Bet',
    'OVER_UNDER_0_5': 'Over/Under 0.5',
    'OVER_UNDER_1_5': 'Over/Under 1.5',
    'OVER_UNDER_2_5': 'Over/Under 2.5',
    'OVER_UNDER_3_5': 'Over/Under 3.5',
    'OVER_UNDER_4_5': 'Over/Under 4.5',
    'BTTS': 'Both Teams To Score',
    'DOUBLE_CHANCE': 'Double Chance',
    'CORRECT_SCORE': 'Correct Score',
  }
  return labels[marketKey] || marketKey
}

export function getSelectionLabel(selectionKey: string): string {
  const labels: Record<string, string> = {
    'home_win': 'Home Win',
    'draw': 'Draw',
    'away_win': 'Away Win',
    'home_win_or_draw': 'Home or Draw',
    'draw_or_away_win': 'Draw or Away',
    'home_win_or_away_win': 'Either Wins',
    'over_0_5': 'Over 0.5',
    'under_0_5': 'Under 0.5',
    'over_1_5': 'Over 1.5',
    'under_1_5': 'Under 1.5',
    'over_2_5': 'Over 2.5',
    'under_2_5': 'Under 2.5',
    'over_3_5': 'Over 3.5',
    'under_3_5': 'Under 3.5',
    'over_4_5': 'Over 4.5',
    'under_4_5': 'Under 4.5',
    'both_teams_score_yes': 'Both Score',
    'both_teams_score_no': "One Doesn't Score",
  }
  return labels[selectionKey] || selectionKey
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    'PENDING': 'bg-yellow-500/20 text-yellow-400',
    'CORRECT': 'bg-green-500/20 text-green-400',
    'INCORRECT': 'bg-red-500/20 text-red-400',
    'VOID': 'bg-gray-500/20 text-gray-400',
  }
  return colors[status] || ''
}
