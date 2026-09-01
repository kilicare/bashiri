"""
AI Pick Settlement Engine

Deterministic settlement logic for all AI Pick markets.
Each market has a specific settlement function that takes final scores
and returns WON, LOST, PUSH, or VOID.
"""

from typing import Tuple, Optional


class SettlementResult:
    """Result of settlement calculation."""
    def __init__(self, status: str, reason: str = ""):
        self.status = status  # "WON", "LOST", "PUSH", "VOID"
        self.reason = reason

    def to_dict(self):
        return {"status": self.status, "reason": self.reason}


def settle_1x2_home(market: str, selection: str, home_score: int, away_score: int) -> SettlementResult:
    """Settle 1X2 Home predictions."""
    if selection != "Home":
        return SettlementResult("VOID", f"Invalid selection for 1x2_home: {selection}")

    if home_score > away_score:
        return SettlementResult("WON", f"Home won {home_score}-{away_score}")
    elif home_score < away_score:
        return SettlementResult("LOST", f"Home lost {home_score}-{away_score}")
    else:
        return SettlementResult("LOST", f"Match ended in draw {home_score}-{away_score}")


def settle_1x2_draw(market: str, selection: str, home_score: int, away_score: int) -> SettlementResult:
    """Settle 1X2 Draw predictions."""
    if selection != "Draw":
        return SettlementResult("VOID", f"Invalid selection for 1x2_draw: {selection}")

    if home_score == away_score:
        return SettlementResult("WON", f"Match ended in draw {home_score}-{away_score}")
    else:
        return SettlementResult("LOST", f"Match did not end in draw {home_score}-{away_score}")


def settle_1x2_away(market: str, selection: str, home_score: int, away_score: int) -> SettlementResult:
    """Settle 1X2 Away predictions."""
    if selection != "Away":
        return SettlementResult("VOID", f"Invalid selection for 1x2_away: {selection}")

    if away_score > home_score:
        return SettlementResult("WON", f"Away won {home_score}-{away_score}")
    elif away_score < home_score:
        return SettlementResult("LOST", f"Away lost {home_score}-{away_score}")
    else:
        return SettlementResult("LOST", f"Match ended in draw {home_score}-{away_score}")


def settle_btts_yes(market: str, selection: str, home_score: int, away_score: int) -> SettlementResult:
    """Settle BTTS Yes predictions."""
    if selection != "Yes":
        return SettlementResult("VOID", f"Invalid selection for btts_yes: {selection}")

    if home_score >= 1 and away_score >= 1:
        return SettlementResult("WON", f"Both teams scored {home_score}-{away_score}")
    else:
        return SettlementResult("LOST", f"Both teams did not score {home_score}-{away_score}")


def settle_btts_no(market: str, selection: str, home_score: int, away_score: int) -> SettlementResult:
    """Settle BTTS No predictions."""
    if selection != "No":
        return SettlementResult("VOID", f"Invalid selection for btts_no: {selection}")

    if home_score == 0 or away_score == 0:
        return SettlementResult("WON", f"At least one team failed to score {home_score}-{away_score}")
    else:
        return SettlementResult("LOST", f"Both teams scored {home_score}-{away_score}")


def settle_dc_1x(market: str, selection: str, home_score: int, away_score: int) -> SettlementResult:
    """Settle Double Chance 1X (Home or Draw)."""
    if selection != "1X":
        return SettlementResult("VOID", f"Invalid selection for dc_1x: {selection}")

    if home_score >= away_score:
        return SettlementResult("WON", f"Home won or drew {home_score}-{away_score}")
    else:
        return SettlementResult("LOST", f"Away won {home_score}-{away_score}")


def settle_dc_x2(market: str, selection: str, home_score: int, away_score: int) -> SettlementResult:
    """Settle Double Chance X2 (Draw or Away)."""
    if selection != "X2":
        return SettlementResult("VOID", f"Invalid selection for dc_x2: {selection}")

    if away_score >= home_score:
        return SettlementResult("WON", f"Away won or drew {home_score}-{away_score}")
    else:
        return SettlementResult("LOST", f"Home won {home_score}-{away_score}")


def settle_dc_12(market: str, selection: str, home_score: int, away_score: int) -> SettlementResult:
    """Settle Double Chance 12 (Home or Away - no draw)."""
    if selection != "12":
        return SettlementResult("VOID", f"Invalid selection for dc_12: {selection}")

    if home_score != away_score:
        return SettlementResult("WON", f"Match did not end in draw {home_score}-{away_score}")
    else:
        return SettlementResult("LOST", f"Match ended in draw {home_score}-{away_score}")


def settle_dnb_home(market: str, selection: str, home_score: int, away_score: int) -> SettlementResult:
    """Settle Draw No Bet Home predictions."""
    if selection != "Home":
        return SettlementResult("VOID", f"Invalid selection for dnb_home: {selection}")

    if home_score > away_score:
        return SettlementResult("WON", f"Home won {home_score}-{away_score}")
    elif home_score == away_score:
        return SettlementResult("PUSH", f"Match ended in draw {home_score}-{away_score}")
    else:
        return SettlementResult("LOST", f"Home lost {home_score}-{away_score}")


def settle_dnb_away(market: str, selection: str, home_score: int, away_score: int) -> SettlementResult:
    """Settle Draw No Bet Away predictions."""
    if selection != "Away":
        return SettlementResult("VOID", f"Invalid selection for dnb_away: {selection}")

    if away_score > home_score:
        return SettlementResult("WON", f"Away won {home_score}-{away_score}")
    elif home_score == away_score:
        return SettlementResult("PUSH", f"Match ended in draw {home_score}-{away_score}")
    else:
        return SettlementResult("LOST", f"Away lost {home_score}-{away_score}")


def settle_over_1_5(market: str, selection: str, home_score: int, away_score: int) -> SettlementResult:
    """Settle Over 1.5 Goals predictions."""
    if selection != "Over":
        return SettlementResult("VOID", f"Invalid selection for over_1_5: {selection}")

    total_goals = home_score + away_score
    if total_goals >= 2:
        return SettlementResult("WON", f"Total goals {total_goals} >= 2")
    else:
        return SettlementResult("LOST", f"Total goals {total_goals} < 2")


def settle_over_2_5(market: str, selection: str, home_score: int, away_score: int) -> SettlementResult:
    """Settle Over 2.5 Goals predictions."""
    if selection != "Over":
        return SettlementResult("VOID", f"Invalid selection for over_2_5: {selection}")

    total_goals = home_score + away_score
    if total_goals >= 3:
        return SettlementResult("WON", f"Total goals {total_goals} >= 3")
    else:
        return SettlementResult("LOST", f"Total goals {total_goals} < 3")


def settle_under_1_5(market: str, selection: str, home_score: int, away_score: int) -> SettlementResult:
    """Settle Under 1.5 Goals predictions."""
    if selection != "Under":
        return SettlementResult("VOID", f"Invalid selection for under_1_5: {selection}")

    total_goals = home_score + away_score
    if total_goals <= 1:
        return SettlementResult("WON", f"Total goals {total_goals} <= 1")
    else:
        return SettlementResult("LOST", f"Total goals {total_goals} > 1")


def settle_under_2_5(market: str, selection: str, home_score: int, away_score: int) -> SettlementResult:
    """Settle Under 2.5 Goals predictions."""
    if selection != "Under":
        return SettlementResult("VOID", f"Invalid selection for under_2_5: {selection}")

    total_goals = home_score + away_score
    if total_goals <= 2:
        return SettlementResult("WON", f"Total goals {total_goals} <= 2")
    else:
        return SettlementResult("LOST", f"Total goals {total_goals} > 2")


def settle_home_over_0_5(market: str, selection: str, home_score: int, away_score: int) -> SettlementResult:
    """Settle Home Over 0.5 Goals predictions."""
    if selection != "Over":
        return SettlementResult("VOID", f"Invalid selection for home_over_0_5: {selection}")

    if home_score >= 1:
        return SettlementResult("WON", f"Home scored {home_score} goals")
    else:
        return SettlementResult("LOST", f"Home scored {home_score} goals")


def settle_home_over_1_5(market: str, selection: str, home_score: int, away_score: int) -> SettlementResult:
    """Settle Home Over 1.5 Goals predictions."""
    if selection != "Over":
        return SettlementResult("VOID", f"Invalid selection for home_over_1_5: {selection}")

    if home_score >= 2:
        return SettlementResult("WON", f"Home scored {home_score} goals")
    else:
        return SettlementResult("LOST", f"Home scored {home_score} goals")


def settle_home_over_2_5(market: str, selection: str, home_score: int, away_score: int) -> SettlementResult:
    """Settle Home Over 2.5 Goals predictions."""
    if selection != "Over":
        return SettlementResult("VOID", f"Invalid selection for home_over_2_5: {selection}")

    if home_score >= 3:
        return SettlementResult("WON", f"Home scored {home_score} goals")
    else:
        return SettlementResult("LOST", f"Home scored {home_score} goals")


def settle_away_over_0_5(market: str, selection: str, home_score: int, away_score: int) -> SettlementResult:
    """Settle Away Over 0.5 Goals predictions."""
    if selection != "Over":
        return SettlementResult("VOID", f"Invalid selection for away_over_0_5: {selection}")

    if away_score >= 1:
        return SettlementResult("WON", f"Away scored {away_score} goals")
    else:
        return SettlementResult("LOST", f"Away scored {away_score} goals")


def settle_away_over_1_5(market: str, selection: str, home_score: int, away_score: int) -> SettlementResult:
    """Settle Away Over 1.5 Goals predictions."""
    if selection != "Over":
        return SettlementResult("VOID", f"Invalid selection for away_over_1_5: {selection}")

    if away_score >= 2:
        return SettlementResult("WON", f"Away scored {away_score} goals")
    else:
        return SettlementResult("LOST", f"Away scored {away_score} goals")


def settle_away_over_2_5(market: str, selection: str, home_score: int, away_score: int) -> SettlementResult:
    """Settle Away Over 2.5 Goals predictions."""
    if selection != "Over":
        return SettlementResult("VOID", f"Invalid selection for away_over_2_5: {selection}")

    if away_score >= 3:
        return SettlementResult("WON", f"Away scored {away_score} goals")
    else:
        return SettlementResult("LOST", f"Away scored {away_score} goals")


# Settlement function registry
SETTLEMENT_FUNCTIONS = {
    "1x2_home": settle_1x2_home,
    "1x2_draw": settle_1x2_draw,
    "1x2_away": settle_1x2_away,
    "btts_yes": settle_btts_yes,
    "btts_no": settle_btts_no,
    "dc_1x": settle_dc_1x,
    "dc_x2": settle_dc_x2,
    "dc_12": settle_dc_12,
    "dnb_home": settle_dnb_home,
    "dnb_away": settle_dnb_away,
    "over_1_5": settle_over_1_5,
    "over_2_5": settle_over_2_5,
    "under_1_5": settle_under_1_5,
    "under_2_5": settle_under_2_5,
    "home_over_0_5": settle_home_over_0_5,
    "home_over_1_5": settle_home_over_1_5,
    "home_over_2_5": settle_home_over_2_5,
    "away_over_0_5": settle_away_over_0_5,
    "away_over_1_5": settle_away_over_1_5,
    "away_over_2_5": settle_away_over_2_5,
}


def settle_ai_pick(market: str, selection: str, home_score: int, away_score: int) -> SettlementResult:
    """
    Main settlement function - routes to appropriate market settlement logic.

    Args:
        market: Market key (e.g., "1x2_home", "dc_1x")
        selection: Selection key (e.g., "Home", "1X", "Over")
        home_score: Final home score
        away_score: Final away score

    Returns:
        SettlementResult with status and reason
    """
    settlement_func = SETTLEMENT_FUNCTIONS.get(market)

    if settlement_func is None:
        return SettlementResult("VOID", f"Unknown market: {market}")

    return settlement_func(market, selection, home_score, away_score)
