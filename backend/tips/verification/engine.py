"""
tips/verification/engine.py

Centralized tip verification engine.

Provides deterministic, idempotent market resolution logic.
Each market has its own resolver for clear separation of concerns.
"""

from typing import Tuple, Optional
from enum import Enum
import logging

from ..market_registry import (
    get_market_definition,
    parse_goal_line,
    normalize_selection_key,
    is_valid_selection,
)

logger = logging.getLogger(__name__)


class VerificationResult(str, Enum):
    """Tip verification result"""
    WON = "CORRECT"
    LOST = "INCORRECT"
    VOID = "VOID"
    PENDING = "PENDING"


class VerificationEngine:
    """
    Centralized verification engine for tip resolution.
    
    This engine is:
    - Deterministic: Same inputs always produce same output
    - Idempotent: Running verification multiple times produces same result
    - Market-specific: Each market has its own resolver
    - Traceable: Verification path is logged for debugging
    """

    @staticmethod
    def verify(
        market_key: str,
        selection_key: str,
        home_score: int,
        away_score: int,
    ) -> VerificationResult:
        """
        Verify a tip against final match score.
        
        Args:
            market_key: Market identifier (e.g., "1X2", "OVER_UNDER_2_5")
            selection_key: Selection identifier (e.g., "home_win", "over_2_5")
            home_score: Final home team score
            away_score: Final away team score
        
        Returns:
            VerificationResult: WON, LOST, VOID, or PENDING
        
        Raises:
            ValueError: If market_key or selection_key is invalid
        """
        # Normalize selection key to canonical form
        normalized_selection = normalize_selection_key(market_key, selection_key)
        
        # Validate market and selection
        if not is_valid_selection(market_key, normalized_selection):
            raise ValueError(
                f"Invalid selection '{selection_key}' for market '{market_key}'"
            )

        # Route to market-specific resolver
        resolvers = {
            "1X2": VerificationEngine._verify_1x2,
            "DOUBLE_CHANCE": VerificationEngine._verify_double_chance,
            "DRAW_NO_BET": VerificationEngine._verify_dnb,
            "BTTS": VerificationEngine._verify_btts,
        }

        # Over/Under markets use generic resolver
        if market_key.startswith("OVER_UNDER"):
            return VerificationEngine._verify_over_under(
                market_key, normalized_selection, home_score, away_score
            )

        # Get market-specific resolver
        resolver = resolvers.get(market_key)
        if not resolver:
            raise ValueError(f"No resolver for market: {market_key}")

        # Execute resolver
        result = resolver(normalized_selection, home_score, away_score)
        
        logger.info(
            f"Verification: market={market_key}, selection={normalized_selection}, "
            f"score={home_score}-{away_score}, result={result.value}"
        )
        
        return result

    @staticmethod
    def _verify_1x2(selection: str, home_score: int, away_score: int) -> VerificationResult:
        """Verify 1X2 market"""
        if selection == "home_win":
            return VerificationResult.WON if home_score > away_score else VerificationResult.LOST
        elif selection == "draw":
            return VerificationResult.WON if home_score == away_score else VerificationResult.LOST
        elif selection == "away_win":
            return VerificationResult.WON if away_score > home_score else VerificationResult.LOST
        else:
            raise ValueError(f"Invalid 1X2 selection: {selection}")

    @staticmethod
    def _verify_double_chance(selection: str, home_score: int, away_score: int) -> VerificationResult:
        """Verify Double Chance market"""
        if selection == "1x":  # Home win or Draw
            return VerificationResult.WON if home_score >= away_score else VerificationResult.LOST
        elif selection == "x2":  # Away win or Draw
            return VerificationResult.WON if away_score >= home_score else VerificationResult.LOST
        elif selection == "12":  # Home win or Away win (no draw)
            return VerificationResult.WON if home_score != away_score else VerificationResult.LOST
        else:
            raise ValueError(f"Invalid Double Chance selection: {selection}")

    @staticmethod
    def _verify_dnb(selection: str, home_score: int, away_score: int) -> VerificationResult:
        """
        Verify Draw No Bet market.
        
        Rules:
        - Home DNB: Home win → WON, Draw → VOID, Away win → LOST
        - Away DNB: Away win → WON, Draw → VOID, Home win → LOST
        """
        if selection == "home_dnb":
            if home_score > away_score:
                return VerificationResult.WON
            elif home_score == away_score:
                return VerificationResult.VOID
            else:
                return VerificationResult.LOST
        elif selection == "away_dnb":
            if away_score > home_score:
                return VerificationResult.WON
            elif home_score == away_score:
                return VerificationResult.VOID
            else:
                return VerificationResult.LOST
        else:
            raise ValueError(f"Invalid DNB selection: {selection}")

    @staticmethod
    def _verify_btts(selection: str, home_score: int, away_score: int) -> VerificationResult:
        """
        Verify BTTS market.
        
        Rules:
        - BTTS Yes: Both teams score → WON, otherwise → LOST
        - BTTS No: At least one team doesn't score → WON, otherwise → LOST
        """
        both_scored = home_score > 0 and away_score > 0
        
        if selection == "btts_yes":
            return VerificationResult.WON if both_scored else VerificationResult.LOST
        elif selection == "btts_no":
            return VerificationResult.WON if not both_scored else VerificationResult.LOST
        else:
            raise ValueError(f"Invalid BTTS selection: {selection}")

    @staticmethod
    def _verify_over_under(
        market_key: str,
        selection: str,
        home_score: int,
        away_score: int,
    ) -> VerificationResult:
        """
        Verify Over/Under market.
        
        FIXED: Properly parses goal line from market key.
        Example: OVER_UNDER_2_5 → threshold = 2.5
        
        Rules:
        - Over X: Total goals > X → WON, otherwise → LOST
        - Under X: Total goals < X → WON, otherwise → LOST
        """
        # Parse goal line from market key
        threshold = parse_goal_line(market_key)
        if threshold is None:
            raise ValueError(f"Invalid Over/Under market key: {market_key}")

        total_goals = home_score + away_score

        if selection.startswith("over"):
            return VerificationResult.WON if total_goals > threshold else VerificationResult.LOST
        elif selection.startswith("under"):
            return VerificationResult.WON if total_goals < threshold else VerificationResult.LOST
        else:
            raise ValueError(f"Invalid Over/Under selection: {selection}")


# Convenience function for direct use
def verify_tip(
    market_key: str,
    selection_key: str,
    home_score: int,
    away_score: int,
) -> VerificationResult:
    """
    Convenience function to verify a tip.
    
    This is the main entry point for tip verification.
    """
    return VerificationEngine.verify(market_key, selection_key, home_score, away_score)
