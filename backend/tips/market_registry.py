"""
tips/market_registry.py

Centralized market registry for Bashiri Tips system.

This is the SINGLE SOURCE OF TRUTH for market definitions.
Frontend and backend must consume this registry.

No hardcoded market lists should exist elsewhere.
"""

from typing import Dict, List, Optional, TypedDict
from enum import Enum


class MarketCategory(str, Enum):
    """Market categories for filtering and grouping"""
    RESULT = "result"
    GOALS = "goals"
    BOTH_TEAMS = "both_teams"
    CORRECT_SCORE = "correct_score"


class SelectionOption(TypedDict):
    """Single selection option within a market"""
    key: str
    label: str


class MarketDefinition(TypedDict):
    """Complete market definition"""
    key: str
    label: str
    category: MarketCategory
    selections: List[SelectionOption]
    available: bool
    requires_final_score: bool
    supports_draw_void: bool


# ============================================
# CANONICAL MARKET REGISTRY
# ============================================

MARKET_REGISTRY: Dict[str, MarketDefinition] = {
    # --- 1X2 (Win/Draw/Loss) ---
    "1X2": {
        "key": "1X2",
        "label": "Win/Draw/Loss",
        "category": MarketCategory.RESULT,
        "selections": [
            {"key": "home_win", "label": "Home Win"},
            {"key": "draw", "label": "Draw"},
            {"key": "away_win", "label": "Away Win"},
        ],
        "available": True,
        "requires_final_score": True,
        "supports_draw_void": False,
    },

    # --- Double Chance ---
    "DOUBLE_CHANCE": {
        "key": "DOUBLE_CHANCE",
        "label": "Double Chance",
        "category": MarketCategory.RESULT,
        "selections": [
            {"key": "1x", "label": "1X (Home or Draw)"},
            {"key": "x2", "label": "X2 (Away or Draw)"},
            {"key": "12", "label": "12 (Home or Away)"},
        ],
        "available": True,
        "requires_final_score": True,
        "supports_draw_void": False,
    },

    # --- Draw No Bet ---
    "DRAW_NO_BET": {
        "key": "DRAW_NO_BET",
        "label": "Draw No Bet",
        "category": MarketCategory.RESULT,
        "selections": [
            {"key": "home_dnb", "label": "Home DNB"},
            {"key": "away_dnb", "label": "Away DNB"},
        ],
        "available": True,
        "requires_final_score": True,
        "supports_draw_void": True,  # Draw = VOID
    },

    # --- Over/Under Markets ---
    "OVER_UNDER_0_5": {
        "key": "OVER_UNDER_0_5",
        "label": "Over/Under 0.5 Goals",
        "category": MarketCategory.GOALS,
        "selections": [
            {"key": "over_0_5", "label": "Over 0.5"},
            {"key": "under_0_5", "label": "Under 0.5"},
        ],
        "available": True,
        "requires_final_score": True,
        "supports_draw_void": False,
    },

    "OVER_UNDER_1_5": {
        "key": "OVER_UNDER_1_5",
        "label": "Over/Under 1.5 Goals",
        "category": MarketCategory.GOALS,
        "selections": [
            {"key": "over_1_5", "label": "Over 1.5"},
            {"key": "under_1_5", "label": "Under 1.5"},
        ],
        "available": True,
        "requires_final_score": True,
        "supports_draw_void": False,
    },

    "OVER_UNDER_2_5": {
        "key": "OVER_UNDER_2_5",
        "label": "Over/Under 2.5 Goals",
        "category": MarketCategory.GOALS,
        "selections": [
            {"key": "over_2_5", "label": "Over 2.5"},
            {"key": "under_2_5", "label": "Under 2.5"},
        ],
        "available": True,
        "requires_final_score": True,
        "supports_draw_void": False,
    },

    "OVER_UNDER_3_5": {
        "key": "OVER_UNDER_3_5",
        "label": "Over/Under 3.5 Goals",
        "category": MarketCategory.GOALS,
        "selections": [
            {"key": "over_3_5", "label": "Over 3.5"},
            {"key": "under_3_5", "label": "Under 3.5"},
        ],
        "available": True,
        "requires_final_score": True,
        "supports_draw_void": False,
    },

    "OVER_UNDER_4_5": {
        "key": "OVER_UNDER_4_5",
        "label": "Over/Under 4.5 Goals",
        "category": MarketCategory.GOALS,
        "selections": [
            {"key": "over_4_5", "label": "Over 4.5"},
            {"key": "under_4_5", "label": "Under 4.5"},
        ],
        "available": True,
        "requires_final_score": True,
        "supports_draw_void": False,
    },

    # --- BTTS (Both Teams To Score) ---
    "BTTS": {
        "key": "BTTS",
        "label": "Both Teams To Score",
        "category": MarketCategory.BOTH_TEAMS,
        "selections": [
            {"key": "btts_yes", "label": "Yes (Both Score)"},
            {"key": "btts_no", "label": "No (One Doesn't Score)"},
        ],
        "available": True,
        "requires_final_score": True,
        "supports_draw_void": False,
    },

    # --- Correct Score (NOT CURRENTLY SUPPORTED FOR USER TIPS) ---
    "CORRECT_SCORE": {
        "key": "CORRECT_SCORE",
        "label": "Correct Score",
        "category": MarketCategory.CORRECT_SCORE,
        "selections": [],  # Dynamically generated based on score ranges
        "available": False,  # Disabled until verification is fully implemented
        "requires_final_score": True,
        "supports_draw_void": False,
    },
}


# ============================================
# MARKET REGISTRY UTILITIES
# ============================================

def get_market_definition(market_key: str) -> Optional[MarketDefinition]:
    """Get market definition by key"""
    return MARKET_REGISTRY.get(market_key)


def get_available_markets() -> List[MarketDefinition]:
    """Get all available (enabled) markets"""
    return [m for m in MARKET_REGISTRY.values() if m["available"]]


def get_markets_by_category(category: MarketCategory) -> List[MarketDefinition]:
    """Get markets by category"""
    return [m for m in MARKET_REGISTRY.values() if m["category"] == category and m["available"]]


def get_selection_label(market_key: str, selection_key: str) -> Optional[str]:
    """Get human-readable label for a selection"""
    market = get_market_definition(market_key)
    if not market:
        return None

    for selection in market["selections"]:
        if selection["key"] == selection_key:
            return selection["label"]

    return None


def is_valid_selection(market_key: str, selection_key: str) -> bool:
    """Check if a selection is valid for a market"""
    market = get_market_definition(market_key)
    if not market:
        return False

    return any(s["key"] == selection_key for s in market["selections"])


def parse_goal_line(market_key: str) -> Optional[float]:
    """
    Parse goal line from Over/Under market key.
    
    Examples:
        OVER_UNDER_0_5 → 0.5
        OVER_UNDER_1_5 → 1.5
        OVER_UNDER_2_5 → 2.5
        OVER_UNDER_3_5 → 3.5
        OVER_UNDER_4_5 → 4.5
    
    Returns None for invalid market keys.
    """
    if not market_key.startswith("OVER_UNDER_"):
        return None

    # Extract the goal line part (everything after "OVER_UNDER_")
    # The format is: OVER_UNDER_X_Y where X_Y is the goal line
    parts = market_key.split("_")
    if len(parts) < 4:  # Should be: OVER, UNDER, X, Y
        return None

    # The goal line is the combination of the last two parts
    # e.g., OVER_UNDER_2_5 → parts = ['OVER', 'UNDER', '2', '5']
    goal_line_str = f"{parts[-2]}.{parts[-1]}"
    
    try:
        return float(goal_line_str)
    except ValueError:
        return None


def normalize_selection_key(market_key: str, selection_key: str) -> str:
    """
    Normalize selection keys to canonical form.
    
    This handles legacy/alternative key formats and converts them to the canonical form.
    
    BTTS normalization:
        "yes" → "btts_yes"
        "no" → "btts_no"
        "both_teams_score_yes" → "btts_yes"
        "both_teams_score_no" → "btts_no"
    
    DNB normalization:
        "home_win" (in DNB context) → "home_dnb"
        "away_win" (in DNB context) → "away_dnb"
    """
    market = get_market_definition(market_key)
    if not market:
        return selection_key

    # BTTS normalization
    if market_key == "BTTS":
        if selection_key in ["yes", "both_teams_score_yes"]:
            return "btts_yes"
        if selection_key in ["no", "both_teams_score_no"]:
            return "btts_no"

    # DNB normalization
    if market_key == "DRAW_NO_BET":
        if selection_key == "home_win":
            return "home_dnb"
        if selection_key == "away_win":
            return "away_dnb"

    # Return as-is if no normalization needed
    return selection_key


def validate_market_key(market_key: str) -> bool:
    """Check if a market key is valid and available"""
    market = get_market_definition(market_key)
    return market is not None and market["available"]


def get_all_market_keys() -> List[str]:
    """Get all market keys (including unavailable ones)"""
    return list(MARKET_REGISTRY.keys())


def get_available_market_keys() -> List[str]:
    """Get all available market keys"""
    return [m["key"] for m in get_available_markets()]
