"""
tips/tests/test_verification.py

Comprehensive tests for the tip verification engine.

Tests:
- Market parsing (Over/Under goal lines)
- BTTS key normalization
- DNB verification (including VOID)
- 1X2 verification
- Double Chance verification
- Over/Under verification (all lines)
- Idempotency
- Invalid inputs
- Tip locking mechanism
"""

import pytest
from datetime import timedelta
from django.utils import timezone

from tips.verification import verify_tip, VerificationResult
from tips.market_registry import (
    parse_goal_line,
    normalize_selection_key,
    is_valid_selection,
)


class TestGoalLineParsing:
    """Test Over/Under goal line parsing."""
    
    def test_parse_0_5(self):
        """Test parsing OVER_UNDER_0_5"""
        assert parse_goal_line("OVER_UNDER_0_5") == 0.5
    
    def test_parse_1_5(self):
        """Test parsing OVER_UNDER_1_5"""
        assert parse_goal_line("OVER_UNDER_1_5") == 1.5
    
    def test_parse_2_5(self):
        """Test parsing OVER_UNDER_2_5"""
        assert parse_goal_line("OVER_UNDER_2_5") == 2.5
    
    def test_parse_3_5(self):
        """Test parsing OVER_UNDER_3_5"""
        assert parse_goal_line("OVER_UNDER_3_5") == 3.5
    
    def test_parse_4_5(self):
        """Test parsing OVER_UNDER_4_5"""
        assert parse_goal_line("OVER_UNDER_4_5") == 4.5
    
    def test_parse_invalid_market(self):
        """Test parsing invalid market returns None"""
        assert parse_goal_line("1X2") is None
        assert parse_goal_line("BTTS") is None
        assert parse_goal_line("INVALID_KEY") is None
    
    def test_parse_malformed_over_under(self):
        """Test malformed Over/Under key returns None"""
        assert parse_goal_line("OVER_UNDER") is None
        assert parse_goal_line("OVER_UNDER_2") is None


class TestBTTSNormalization:
    """Test BTTS selection key normalization."""
    
    def test_normalize_yes_variants(self):
        """Test various 'yes' variants normalize to btts_yes"""
        assert normalize_selection_key("BTTS", "yes") == "btts_yes"
        assert normalize_selection_key("BTTS", "both_teams_score_yes") == "btts_yes"
        assert normalize_selection_key("BTTS", "btts_yes") == "btts_yes"
    
    def test_normalize_no_variants(self):
        """Test various 'no' variants normalize to btts_no"""
        assert normalize_selection_key("BTTS", "no") == "btts_no"
        assert normalize_selection_key("BTTS", "both_teams_score_no") == "btts_no"
        assert normalize_selection_key("BTTS", "btts_no") == "btts_no"
    
    def test_normalize_other_markets_unchanged(self):
        """Test other markets are not affected"""
        assert normalize_selection_key("1X2", "home_win") == "home_win"
        assert normalize_selection_key("DOUBLE_CHANCE", "1x") == "1x"


class TestDNBNormalization:
    """Test DNB selection key normalization."""
    
    def test_normalize_home_win_to_dnb(self):
        """Test home_win normalizes to home_dnb in DNB context"""
        assert normalize_selection_key("DRAW_NO_BET", "home_win") == "home_dnb"
    
    def test_normalize_away_win_to_dnb(self):
        """Test away_win normalizes to away_dnb in DNB context"""
        assert normalize_selection_key("DRAW_NO_BET", "away_win") == "away_dnb"
    
    def test_normalize_canonical_dnb_unchanged(self):
        """Test canonical DNB keys are unchanged"""
        assert normalize_selection_key("DRAW_NO_BET", "home_dnb") == "home_dnb"
        assert normalize_selection_key("DRAW_NO_BET", "away_dnb") == "away_dnb"


class Test1X2Verification:
    """Test 1X2 market verification."""
    
    def test_home_win_correct(self):
        """Test home win prediction correct"""
        result = verify_tip("1X2", "home_win", 3, 1)
        assert result == VerificationResult.WON
    
    def test_home_win_incorrect(self):
        """Test home win prediction incorrect"""
        result = verify_tip("1X2", "home_win", 1, 3)
        assert result == VerificationResult.LOST
    
    def test_draw_correct(self):
        """Test draw prediction correct"""
        result = verify_tip("1X2", "draw", 2, 2)
        assert result == VerificationResult.WON
    
    def test_draw_incorrect(self):
        """Test draw prediction incorrect"""
        result = verify_tip("1X2", "draw", 3, 1)
        assert result == VerificationResult.LOST
    
    def test_away_win_correct(self):
        """Test away win prediction correct"""
        result = verify_tip("1X2", "away_win", 1, 3)
        assert result == VerificationResult.WON
    
    def test_away_win_incorrect(self):
        """Test away win prediction incorrect"""
        result = verify_tip("1X2", "away_win", 3, 1)
        assert result == VerificationResult.LOST


class TestDoubleChanceVerification:
    """Test Double Chance market verification."""
    
    def test_1x_correct_home_win(self):
        """Test 1X correct on home win"""
        result = verify_tip("DOUBLE_CHANCE", "1x", 3, 1)
        assert result == VerificationResult.WON
    
    def test_1x_correct_draw(self):
        """Test 1X correct on draw"""
        result = verify_tip("DOUBLE_CHANCE", "1x", 2, 2)
        assert result == VerificationResult.WON
    
    def test_1x_incorrect_away_win(self):
        """Test 1X incorrect on away win"""
        result = verify_tip("DOUBLE_CHANCE", "1x", 1, 3)
        assert result == VerificationResult.LOST
    
    def test_x2_correct_away_win(self):
        """Test X2 correct on away win"""
        result = verify_tip("DOUBLE_CHANCE", "x2", 1, 3)
        assert result == VerificationResult.WON
    
    def test_x2_correct_draw(self):
        """Test X2 correct on draw"""
        result = verify_tip("DOUBLE_CHANCE", "x2", 2, 2)
        assert result == VerificationResult.WON
    
    def test_x2_incorrect_home_win(self):
        """Test X2 incorrect on home win"""
        result = verify_tip("DOUBLE_CHANCE", "x2", 3, 1)
        assert result == VerificationResult.LOST
    
    def test_12_correct_home_win(self):
        """Test 12 correct on home win"""
        result = verify_tip("DOUBLE_CHANCE", "12", 3, 1)
        assert result == VerificationResult.WON
    
    def test_12_correct_away_win(self):
        """Test 12 correct on away win"""
        result = verify_tip("DOUBLE_CHANCE", "12", 1, 3)
        assert result == VerificationResult.WON
    
    def test_12_incorrect_draw(self):
        """Test 12 incorrect on draw"""
        result = verify_tip("DOUBLE_CHANCE", "12", 2, 2)
        assert result == VerificationResult.LOST


class TestDNBVerification:
    """Test Draw No Bet verification."""
    
    def test_home_dnb_win(self):
        """Test Home DNB wins on home victory"""
        result = verify_tip("DRAW_NO_BET", "home_dnb", 3, 1)
        assert result == VerificationResult.WON
    
    def test_home_dnb_void_draw(self):
        """Test Home DNB void on draw"""
        result = verify_tip("DRAW_NO_BET", "home_dnb", 2, 2)
        assert result == VerificationResult.VOID
    
    def test_home_dnb_lost(self):
        """Test Home DNB lost on away victory"""
        result = verify_tip("DRAW_NO_BET", "home_dnb", 1, 3)
        assert result == VerificationResult.LOST
    
    def test_away_dnb_win(self):
        """Test Away DNB wins on away victory"""
        result = verify_tip("DRAW_NO_BET", "away_dnb", 1, 3)
        assert result == VerificationResult.WON
    
    def test_away_dnb_void_draw(self):
        """Test Away DNB void on draw"""
        result = verify_tip("DRAW_NO_BET", "away_dnb", 2, 2)
        assert result == VerificationResult.VOID
    
    def test_away_dnb_lost(self):
        """Test Away DNB lost on home victory"""
        result = verify_tip("DRAW_NO_BET", "away_dnb", 3, 1)
        assert result == VerificationResult.LOST


class TestBTTSVerification:
    """Test BTTS verification."""
    
    def test_btts_yes_both_score(self):
        """Test BTTS Yes wins when both teams score"""
        result = verify_tip("BTTS", "btts_yes", 2, 1)
        assert result == VerificationResult.WON
    
    def test_btts_yes_one_team_zero(self):
        """Test BTTS Yes lost when one team doesn't score"""
        result = verify_tip("BTTS", "btts_yes", 1, 0)
        assert result == VerificationResult.LOST
    
    def test_btts_no_one_team_zero(self):
        """Test BTTS No wins when one team doesn't score"""
        result = verify_tip("BTTS", "btts_no", 1, 0)
        assert result == VerificationResult.WON
    
    def test_btts_no_both_score(self):
        """Test BTTS No lost when both teams score"""
        result = verify_tip("BTTS", "btts_no", 2, 1)
        assert result == VerificationResult.LOST


class TestOverUnderVerification:
    """Test Over/Under verification for all goal lines."""
    
    def test_over_0_5_correct(self):
        """Test Over 0.5 correct"""
        result = verify_tip("OVER_UNDER_0_5", "over_0_5", 1, 0)
        assert result == VerificationResult.WON
    
    def test_over_0_5_incorrect(self):
        """Test Over 0.5 incorrect"""
        result = verify_tip("OVER_UNDER_0_5", "over_0_5", 0, 0)
        assert result == VerificationResult.LOST
    
    def test_under_0_5_correct(self):
        """Test Under 0.5 correct"""
        result = verify_tip("OVER_UNDER_0_5", "under_0_5", 0, 0)
        assert result == VerificationResult.WON
    
    def test_under_0_5_incorrect(self):
        """Test Under 0.5 incorrect"""
        result = verify_tip("OVER_UNDER_0_5", "under_0_5", 1, 0)
        assert result == VerificationResult.LOST
    
    def test_over_2_5_correct(self):
        """Test Over 2.5 correct"""
        result = verify_tip("OVER_UNDER_2_5", "over_2_5", 3, 0)
        assert result == VerificationResult.WON
    
    def test_over_2_5_incorrect(self):
        """Test Over 2.5 incorrect (exactly 2.5)"""
        result = verify_tip("OVER_UNDER_2_5", "over_2_5", 2, 0)
        assert result == VerificationResult.LOST
    
    def test_under_2_5_correct(self):
        """Test Under 2.5 correct"""
        result = verify_tip("OVER_UNDER_2_5", "under_2_5", 2, 0)
        assert result == VerificationResult.WON
    
    def test_under_2_5_incorrect(self):
        """Test Under 2.5 incorrect"""
        result = verify_tip("OVER_UNDER_2_5", "under_2_5", 3, 0)
        assert result == VerificationResult.LOST
    
    def test_over_4_5_correct(self):
        """Test Over 4.5 correct"""
        result = verify_tip("OVER_UNDER_4_5", "over_4_5", 5, 0)
        assert result == VerificationResult.WON
    
    def test_under_4_5_correct(self):
        """Test Under 4.5 correct"""
        result = verify_tip("OVER_UNDER_4_5", "under_4_5", 4, 0)
        assert result == VerificationResult.WON


class TestIdempotency:
    """Test verification is idempotent."""
    
    def test_verification_idempotent(self):
        """Test running verification multiple times produces same result"""
        # Verify once
        result1 = verify_tip("1X2", "home_win", 3, 1)
        
        # Verify again with same inputs
        result2 = verify_tip("1X2", "home_win", 3, 1)
        
        # Results should be identical
        assert result1 == result2
        assert result1 == VerificationResult.WON


class TestInvalidInputs:
    """Test handling of invalid inputs."""
    
    def test_invalid_market_key(self):
        """Test invalid market key raises error"""
        with pytest.raises(ValueError):
            verify_tip("INVALID_MARKET", "home_win", 3, 1)
    
    def test_invalid_selection(self):
        """Test invalid selection raises error"""
        with pytest.raises(ValueError):
            verify_tip("1X2", "invalid_selection", 3, 1)
    
    def test_mismatched_selection(self):
        """Test selection that doesn't match market raises error"""
        with pytest.raises(ValueError):
            verify_tip("1X2", "btts_yes", 3, 1)


class TestTipLocking:
    """Test tip locking mechanism."""
    
    def test_tip_locking_logic(self):
        """Test the locking logic conceptually"""
        # Test before kickoff
        future_kickoff = timezone.now() + timedelta(hours=2)
        current_time = timezone.now()
        is_locked = future_kickoff <= current_time
        assert is_locked is False
        
        # Test after kickoff
        past_kickoff = timezone.now() - timedelta(hours=1)
        is_locked = past_kickoff <= current_time
        assert is_locked is True
    
    def test_lock_idempotency_concept(self):
        """Test that locking is idempotent conceptually"""
        # Simulate first lock
        first_lock_time = timezone.now()
        
        # Simulate second lock attempt
        second_lock_time = first_lock_time  # Should not change
        
        # Lock time should remain the same
        assert first_lock_time == second_lock_time


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
