"""
AI Pick Market Qualification Engine

Centralized configuration for AI Pick tier thresholds and market qualification.
Backend determines tier - UI just displays it.
"""

# Market tier thresholds configuration
AI_PICK_THRESHOLDS = {
    "free": {
        "1x2_home": 0.60,
        "btts_yes": 0.50,
        "dc_1x": 0.70,
        "home_over_0_5": 0.70,
        "over_1_5": 0.70,
    },
    "elite": {
        "dc_1x": 0.80,
        "dc_12": 0.80,
        "home_over_0_5": 0.80,
        "over_1_5": 0.80,
        "away_over_0_5": 0.80,
    },
}

# Market whitelist by feed type
ELITE_MARKETS = [
    "dc_1x",
    "dc_12",
    "home_over_0_5",
    "over_1_5",
    "away_over_0_5",
]

FREE_MARKETS = [
    "1x2_home",
    "btts_yes",
    "dc_1x",
    "home_over_0_5",
    "over_1_5",
]

# Market label mapping for display
MARKET_LABELS = {
    "1x2_home": "1X2 Home",
    "1x2_draw": "1X2 Draw",
    "1x2_away": "1X2 Away",
    "btts_yes": "BTTS Yes",
    "btts_no": "BTTS No",
    "dc_1x": "Double Chance 1X",
    "dc_x2": "Double Chance X2",
    "dc_12": "Double Chance 12",
    "dnb_home": "Draw No Bet Home",
    "dnb_away": "Draw No Bet Away",
    "over_1_5": "Over 1.5 Goals",
    "over_2_5": "Over 2.5 Goals",
    "under_1_5": "Under 1.5 Goals",
    "under_2_5": "Under 2.5 Goals",
    "home_over_0_5": "Home Over 0.5 Goals",
    "home_over_1_5": "Home Over 1.5 Goals",
    "home_over_2_5": "Home Over 2.5 Goals",
    "away_over_0_5": "Away Over 0.5 Goals",
    "away_over_1_5": "Away Over 1.5 Goals",
    "away_over_2_5": "Away Over 2.5 Goals",
}

# Selection label mapping
SELECTION_LABELS = {
    "Home": "Home",
    "Draw": "Draw",
    "Away": "Away",
    "1X": "1X",
    "X2": "X2",
    "12": "12",
    "Yes": "Yes",
    "No": "No",
    "Over": "Over",
    "Under": "Under",
}


def qualify_ai_pick(market_key, probability, feed_type="STANDARD"):
    """
    Determine if a market/probability combination qualifies for AI Pick.
    Returns tier or None if not qualified.

    Args:
        market_key: Market key (e.g., "1x2_home", "dc_1x")
        probability: Raw probability (0.0-1.0)
        feed_type: "STANDARD" or "PREMIUM"

    Returns:
        "ELITE", "STRONG", "MINIMUM", or None
    """
    probability_percent = probability * 100

    # Check Elite qualification first
    if market_key in ELITE_MARKETS:
        elite_threshold = AI_PICK_THRESHOLDS["elite"].get(market_key)
        if elite_threshold and probability_percent >= elite_threshold:
            return "ELITE"

    # Check Free/Standard qualification
    if market_key in FREE_MARKETS:
        free_threshold = AI_PICK_THRESHOLDS["free"].get(market_key)
        if free_threshold and probability_percent >= free_threshold:
            return "STRONG"

    # Premium feed only accepts Elite picks
    if feed_type == "PREMIUM":
        return None

    # Check if it meets minimum threshold for standard feed
    if market_key in FREE_MARKETS:
        free_threshold = AI_PICK_THRESHOLDS["free"].get(market_key)
        if free_threshold and probability_percent >= free_threshold:
            return "MINIMUM"

    return None


def get_market_label(market_key):
    """Get display label for market key."""
    return MARKET_LABELS.get(market_key, market_key)


def get_selection_label(selection_key):
    """Get display label for selection key."""
    return SELECTION_LABELS.get(selection_key, selection_key)
