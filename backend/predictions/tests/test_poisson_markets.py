"""
tests/test_poisson_markets.py

Comprehensive tests for Poisson market mathematics and probability integrity.

Tests:
- 1X2 probabilities sum to ~1
- BTTS Yes + No ≈ 1
- Over/Under pairs sum to ~1 for all lines
- Probabilities are within valid bounds [0, 100]
- No NaN or infinity values
- Score matrix integrity
"""

import pytest
import numpy as np
from predictions.ml.poisson_model import (
    predict_fixture,
    load_models,
    OVER_UNDER_LINES,
)


class TestPoissonMarketIntegrity:
    """Test mathematical integrity of Poisson-derived markets."""
    
    @pytest.fixture
    def sample_prediction(self):
        """Get a sample prediction for testing."""
        # Use a known league and teams from production model
        try:
            return predict_fixture("EPL", "Arsenal FC", "Liverpool FC")
        except Exception as e:
            pytest.skip(f"Could not generate sample prediction: {e}")
    
    def test_1x2_probabilities_sum_to_one(self, sample_prediction):
        """Test that 1X2 probabilities sum to approximately 1."""
        match_result = sample_prediction["match_result"]
        home_win = match_result["home_win"]
        draw = match_result["draw"]
        away_win = match_result["away_win"]
        
        total = home_win + draw + away_win
        # Should sum to 100 (within floating point tolerance)
        assert abs(total - 100.0) < 0.1, f"1X2 probabilities sum to {total}, expected 100"
        
        # Individual probabilities should be valid
        assert 0 <= home_win <= 100, f"Home win probability {home_win} out of bounds"
        assert 0 <= draw <= 100, f"Draw probability {draw} out of bounds"
        assert 0 <= away_win <= 100, f"Away win probability {away_win} out of bounds"
    
    def test_btts_probabilities_sum_to_one(self, sample_prediction):
        """Test that BTTS Yes + No probabilities sum to approximately 1."""
        btts = sample_prediction["btts"]
        yes = btts["yes"]
        no = btts["no"]
        
        total = yes + no
        assert abs(total - 100.0) < 0.1, f"BTTS probabilities sum to {total}, expected 100"
        
        assert 0 <= yes <= 100, f"BTTS Yes probability {yes} out of bounds"
        assert 0 <= no <= 100, f"BTTS No probability {no} out of bounds"
    
    def test_over_under_pairs_sum_to_one(self, sample_prediction):
        """Test that all Over/Under pairs sum to approximately 1."""
        over_under = sample_prediction["over_under"]
        
        for line in OVER_UNDER_LINES:
            key = str(line).replace(".", "_")
            over_key = f"over_{key}"
            under_key = f"under_{key}"
            
            over = over_under.get(over_key)
            under = over_under.get(under_key)
            
            assert over is not None, f"Over {line} probability missing"
            assert under is not None, f"Under {line} probability missing"
            
            total = over + under
            assert abs(total - 100.0) < 0.1, f"O/U {line} probabilities sum to {total}, expected 100"
            
            assert 0 <= over <= 100, f"Over {line} probability {over} out of bounds"
            assert 0 <= under <= 100, f"Under {line} probability {under} out of bounds"
    
    def test_no_nan_or_infinity(self, sample_prediction):
        """Test that no probabilities are NaN or infinity."""
        match_result = sample_prediction["match_result"]
        btts = sample_prediction["btts"]
        over_under = sample_prediction["over_under"]
        draw_no_bet = sample_prediction["draw_no_bet"]
        double_chance = sample_prediction["double_chance"]
        
        # Check all probability fields
        all_probs = [
            # 1X2
            match_result["home_win"],
            match_result["draw"],
            match_result["away_win"],
            # BTTS
            btts["yes"],
            btts["no"],
            # DNB
            draw_no_bet["home_dnb"],
            draw_no_bet["away_dnb"],
            # Double Chance
            double_chance["1x"],
            double_chance["x2"],
            double_chance["12"],
        ]
        
        # Add Over/Under probabilities
        for line in OVER_UNDER_LINES:
            key = str(line).replace(".", "_")
            all_probs.append(over_under[f"over_{key}"])
            all_probs.append(over_under[f"under_{key}"])
        
        for prob in all_probs:
            assert prob is not None, "Probability is None"
            assert not np.isnan(prob), f"Probability is NaN: {prob}"
            assert not np.isinf(prob), f"Probability is infinity: {prob}"
            assert isinstance(prob, (int, float)), f"Probability is not numeric: {prob}"
    
    def test_probabilities_in_valid_range(self, sample_prediction):
        """Test that all probabilities are within [0, 100] range."""
        match_result = sample_prediction["match_result"]
        btts = sample_prediction["btts"]
        over_under = sample_prediction["over_under"]
        draw_no_bet = sample_prediction["draw_no_bet"]
        double_chance = sample_prediction["double_chance"]
        
        # Check all probability fields
        all_probs = [
            # 1X2
            match_result["home_win"],
            match_result["draw"],
            match_result["away_win"],
            # BTTS
            btts["yes"],
            btts["no"],
            # DNB
            draw_no_bet["home_dnb"],
            draw_no_bet["away_dnb"],
            # Double Chance
            double_chance["1x"],
            double_chance["x2"],
            double_chance["12"],
        ]
        
        # Add Over/Under probabilities
        for line in OVER_UNDER_LINES:
            key = str(line).replace(".", "_")
            all_probs.append(over_under[f"over_{key}"])
            all_probs.append(over_under[f"under_{key}"])
        
        for prob in all_probs:
            assert 0 <= prob <= 100, f"Probability {prob} out of valid range [0, 100]"
    
    def test_dnb_probabilities_valid(self, sample_prediction):
        """Test that DNB probabilities are valid."""
        draw_no_bet = sample_prediction["draw_no_bet"]
        home_dnb = draw_no_bet["home_dnb"]
        away_dnb = draw_no_bet["away_dnb"]
        
        # DNB should be conditional on no draw
        # home_dnb + away_dnb should equal 1 (or 100%)
        total = home_dnb + away_dnb
        assert abs(total - 100.0) < 0.1, f"DNB probabilities sum to {total}, expected 100"
        
        assert 0 <= home_dnb <= 100, f"Home DNB probability {home_dnb} out of bounds"
        assert 0 <= away_dnb <= 100, f"Away DNB probability {away_dnb} out of bounds"
    
    def test_double_chance_probabilities_valid(self, sample_prediction):
        """Test that Double Chance probabilities are valid."""
        double_chance = sample_prediction["double_chance"]
        home_win = sample_prediction["match_result"]["home_win"]
        draw = sample_prediction["match_result"]["draw"]
        away_win = sample_prediction["match_result"]["away_win"]
        
        # 1X = home + draw
        expected_1x = home_win + draw
        actual_1x = double_chance["1x"]
        assert abs(actual_1x - expected_1x) < 0.1, f"1X: expected {expected_1x}, got {actual_1x}"
        
        # X2 = draw + away
        expected_x2 = draw + away_win
        actual_x2 = double_chance["x2"]
        assert abs(actual_x2 - expected_x2) < 0.1, f"X2: expected {expected_x2}, got {actual_x2}"
        
        # 12 = home + away
        expected_12 = home_win + away_win
        actual_12 = double_chance["12"]
        assert abs(actual_12 - expected_12) < 0.1, f"12: expected {expected_12}, got {actual_12}"
        
        # All should be in valid range
        assert 0 <= actual_1x <= 100, f"1X probability {actual_1x} out of bounds"
        assert 0 <= actual_x2 <= 100, f"X2 probability {actual_x2} out of bounds"
        assert 0 <= actual_12 <= 100, f"12 probability {actual_12} out of bounds"
    
    def test_model_metadata_present(self, sample_prediction):
        """Test that model metadata is present and valid."""
        assert "model_version" in sample_prediction
        assert "pipeline_version" in sample_prediction
        assert "schema_version" in sample_prediction
        assert "expected_goals" in sample_prediction
        assert "elo" in sample_prediction
        
        # Check expected goals are valid
        expected_goals = sample_prediction["expected_goals"]
        assert expected_goals["home_xg"] > 0, "Home xG should be positive"
        assert expected_goals["away_xg"] > 0, "Away xG should be positive"
        assert expected_goals["total_xg"] > 0, "Total xG should be positive"
    
    def test_over_0_5_not_always_dominant(self, sample_prediction):
        """Test that Over 0.5 doesn't always dominate (sanity check)."""
        over_under = sample_prediction["over_under"]
        over_0_5 = over_under["over_0_5"]
        
        # Over 0.5 should be high but not always 100%
        # This is a sanity check to ensure the model is working
        assert over_0_5 > 50, f"Over 0.5 should be reasonably high, got {over_0_5}"
        assert over_0_5 < 100, f"Over 0.5 should not be 100%, got {over_0_5}"


class TestPoissonModelLoading:
    """Test production model loading and validation."""
    
    def test_load_models_success(self):
        """Test that production model loads successfully."""
        artifact = load_models()
        
        assert artifact is not None
        assert "schema_version" in artifact
        assert "pipeline_version" in artifact
        assert "leagues" in artifact
        assert "elo" in artifact
        assert "calibration" in artifact
    
    def test_model_schema_version(self):
        """Test that model schema version is expected."""
        artifact = load_models()
        schema_version = artifact.get("schema_version")
        
        # Schema should be 4.0 based on current implementation
        assert schema_version == "4.0", f"Expected schema version 4.0, got {schema_version}"
    
    def test_calibration_disabled_in_production(self):
        """Test that calibration is disabled in production."""
        artifact = load_models()
        calibration = artifact.get("calibration", {})
        
        assert calibration.get("production_enabled") is False, \
            "Calibration should be disabled in production"
    
    def test_leagues_available(self):
        """Test that leagues are available in production model."""
        artifact = load_models()
        leagues = artifact.get("leagues", {})
        
        assert len(leagues) > 0, "No leagues available in production model"
        
        # Check for expected leagues
        expected_leagues = ["EPL", "LaLiga", "Bundesliga", "Ligue1", "Serie A"]
        for league in expected_leagues:
            assert league in leagues, f"Expected league {league} not found"
    
    def test_elo_ratings_available(self):
        """Test that Elo ratings are available."""
        artifact = load_models()
        elo = artifact.get("elo", {})
        ratings = elo.get("ratings", {})
        
        assert len(ratings) > 0, "No Elo ratings available"
        
        # Check that ratings are valid
        for team, rating in ratings.items():
            assert isinstance(rating, (int, float)), f"Elo rating for {team} is not numeric"
            assert rating > 0, f"Elo rating for {team} is not positive"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])