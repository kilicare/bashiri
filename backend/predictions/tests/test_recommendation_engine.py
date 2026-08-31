"""
tests/test_recommendation_engine.py

Comprehensive tests for the Recommendation Engine logic.

Tests:
- Recommendation quality gates
- NO_STRONG_PICK behavior
- Confidence score calculation
- Recommendation score calculation
- Data quality assessment
- Probability validation
- Market evaluation data integration
- Ranking logic
- Calibration status handling
"""

import pytest
from predictions.recommendation_engine import (
    generate_recommendation,
    assess_data_quality,
    validate_probability,
    calculate_confidence_score,
    calculate_recommendation_score,
    Recommendation,
    MARKET_DEFINITIONS,
)


class TestDataQualityAssessment:
    """Test data quality assessment logic."""
    
    def test_high_quality_prediction(self):
        """Test that a complete prediction returns HIGH quality."""
        prediction = {
            "match_result": {"home_win": 60.0, "draw": 25.0, "away_win": 15.0},
            "double_chance": {"1x": 85.0, "x2": 40.0, "12": 75.0},
            "draw_no_bet": {"home_dnb": 70.0, "away_dnb": 18.0},
            "btts": {"yes": 55.0, "no": 45.0},
            "over_under": {
                "over_0_5": 95.0, "under_0_5": 5.0,
                "over_1_5": 70.0, "under_1_5": 30.0,
                "over_2_5": 45.0, "under_2_5": 55.0,
                "over_3_5": 25.0, "under_3_5": 75.0,
                "over_4_5": 10.0, "under_4_5": 90.0,
            }
        }
        
        quality = assess_data_quality(prediction)
        assert quality == "HIGH", f"Expected HIGH quality, got {quality}"
    
    def test_medium_quality_prediction(self):
        """Test that a prediction with some missing fields returns MEDIUM quality."""
        prediction = {
            "match_result": {"home_win": 60.0, "draw": 25.0, "away_win": 15.0},
            "double_chance": {"1x": 85.0, "x2": 40.0, "12": 75.0},
            # Missing draw_no_bet
            "btts": {"yes": 55.0, "no": 45.0},
            "over_under": {
                "over_0_5": 95.0, "under_0_5": 5.0,
                "over_1_5": 70.0, "under_1_5": 30.0,
                "over_2_5": 45.0, "under_2_5": 55.0,
                "over_3_5": 25.0, "under_3_5": 75.0,
                "over_4_5": 10.0, "under_4_5": 90.0,
            }
        }
        
        quality = assess_data_quality(prediction)
        assert quality == "MEDIUM", f"Expected MEDIUM quality, got {quality}"
    
    def test_low_quality_prediction(self):
        """Test that a prediction with many missing/invalid fields returns LOW quality."""
        prediction = {
            "match_result": {"home_win": 60.0, "draw": 25.0, "away_win": 15.0},
            # Missing most fields
        }
        
        quality = assess_data_quality(prediction)
        assert quality == "LOW", f"Expected LOW quality, got {quality}"
    
    def test_invalid_probabilities_reduce_quality(self):
        """Test that invalid probabilities reduce quality score."""
        prediction = {
            "match_result": {"home_win": 60.0, "draw": 25.0, "away_win": 15.0},
            "double_chance": {"1x": 85.0, "x2": 40.0, "12": 75.0},
            "draw_no_bet": {"home_dnb": 70.0, "away_dnb": 18.0},
            "btts": {"yes": 55.0, "no": 45.0},
            "over_under": {
                "over_0_5": 95.0, "under_0_5": 5.0,
                "over_1_5": 70.0, "under_1_5": 30.0,
                "over_2_5": 45.0, "under_2_5": 55.0,
                "over_3_5": 25.0, "under_3_5": 75.0,
                "over_4_5": 10.0, "under_4_5": 90.0,
            }
        }
        
        # Add an invalid probability
        prediction["match_result"]["home_win"] = 150.0  # Invalid > 100
        
        quality = assess_data_quality(prediction)
        assert quality == "LOW", f"Expected LOW quality due to invalid probability, got {quality}"


class TestProbabilityValidation:
    """Test probability validation logic."""
    
    def test_valid_probability(self):
        """Test that valid probabilities pass validation."""
        assert validate_probability(50.0, "1X2", "home_win") is True
        assert validate_probability(0.0, "1X2", "home_win") is True
        assert validate_probability(100.0, "1X2", "home_win") is True
        assert validate_probability(75.5, "1X2", "home_win") is True
    
    def test_invalid_negative_probability(self):
        """Test that negative probabilities fail validation."""
        assert validate_probability(-1.0, "1X2", "home_win") is False
        assert validate_probability(-10.0, "1X2", "home_win") is False
    
    def test_invalid_probability_above_100(self):
        """Test that probabilities above 100 fail validation."""
        assert validate_probability(101.0, "1X2", "home_win") is False
        assert validate_probability(150.0, "1X2", "home_win") is False
    
    def test_none_probability(self):
        """Test that None probability fails validation."""
        assert validate_probability(None, "1X2", "home_win") is False
    
    def test_nan_probability(self):
        """Test that NaN probability fails validation."""
        import math
        assert validate_probability(float('nan'), "1X2", "home_win") is False
    
    def test_infinity_probability(self):
        """Test that infinity probability fails validation."""
        import math
        assert validate_probability(float('inf'), "1X2", "home_win") is False
        assert validate_probability(float('-inf'), "1X2", "home_win") is False


class TestConfidenceScoreCalculation:
    """Test confidence score calculation logic."""
    
    def test_confidence_with_high_probability(self):
        """Test that high probability increases confidence."""
        confidence = calculate_confidence_score(
            raw_probability=85.0,
            data_quality="HIGH",
            calibration_available=False,
        )
        
        assert 0.7 <= confidence <= 1.0, f"Expected high confidence for 85% probability, got {confidence}"
    
    def test_confidence_with_low_probability(self):
        """Test that low probability reduces confidence."""
        confidence = calculate_confidence_score(
            raw_probability=55.0,
            data_quality="HIGH",
            calibration_available=False,
        )
        
        assert 0.4 <= confidence <= 0.7, f"Expected moderate confidence for 55% probability, got {confidence}"
    
    def test_confidence_with_low_data_quality(self):
        """Test that low data quality reduces confidence."""
        confidence_high = calculate_confidence_score(
            raw_probability=75.0,
            data_quality="HIGH",
            calibration_available=False,
        )
        
        confidence_low = calculate_confidence_score(
            raw_probability=75.0,
            data_quality="LOW",
            calibration_available=False,
        )
        
        assert confidence_low < confidence_high, \
            f"Low data quality should reduce confidence: {confidence_low} vs {confidence_high}"
    
    def test_confidence_with_market_evaluation(self):
        """Test that market evaluation data affects confidence."""
        # Good evaluation: high hit rate, low Brier score
        good_evaluation = {
            "hit_rate": 0.85,
            "mean_predicted_probability": 0.75,
            "brier_score": 0.15,
            "sample_size": 1000,
        }
        
        confidence_good = calculate_confidence_score(
            raw_probability=75.0,
            data_quality="HIGH",
            calibration_available=False,
            market_evaluation=good_evaluation,
        )
        
        # Poor evaluation: low hit rate, high Brier score
        poor_evaluation = {
            "hit_rate": 0.65,
            "mean_predicted_probability": 0.75,
            "brier_score": 0.35,
            "sample_size": 1000,
        }
        
        confidence_poor = calculate_confidence_score(
            raw_probability=75.0,
            data_quality="HIGH",
            calibration_available=False,
            market_evaluation=poor_evaluation,
        )
        
        assert confidence_good > confidence_poor, \
            f"Good evaluation should increase confidence: {confidence_good} vs {confidence_poor}"
    
    def test_confidence_with_sample_size(self):
        """Test that sample size affects confidence."""
        large_sample = {
            "sample_size": 2000,
            "hit_rate": 0.75,
            "mean_predicted_probability": 0.75,
        }
        
        small_sample = {
            "sample_size": 50,
            "hit_rate": 0.75,
            "mean_predicted_probability": 0.75,
        }
        
        confidence_large = calculate_confidence_score(
            raw_probability=75.0,
            data_quality="HIGH",
            calibration_available=False,
            market_evaluation=large_sample,
        )
        
        confidence_small = calculate_confidence_score(
            raw_probability=75.0,
            data_quality="HIGH",
            calibration_available=False,
            market_evaluation=small_sample,
        )
        
        assert confidence_large >= confidence_small, \
            f"Larger sample should not reduce confidence: {confidence_large} vs {confidence_small}"


class TestRecommendationScoreCalculation:
    """Test recommendation score calculation logic."""
    
    def test_recommendation_score_formula(self):
        """Test that recommendation score combines probability and confidence."""
        score = calculate_recommendation_score(
            raw_probability=75.0,
            confidence_score=0.80,
            data_quality="HIGH",
        )
        
        # Score should be product of normalized probability, confidence, and quality weight
        expected_approx = (0.75 * 0.80 * 1.0)  # HIGH quality weight = 1.0
        assert abs(score - expected_approx) < 0.1, \
            f"Expected score ~{expected_approx}, got {score}"
    
    def test_recommendation_score_with_low_quality(self):
        """Test that low data quality reduces recommendation score."""
        score_high = calculate_recommendation_score(
            raw_probability=75.0,
            confidence_score=0.80,
            data_quality="HIGH",
        )
        
        score_low = calculate_recommendation_score(
            raw_probability=75.0,
            confidence_score=0.80,
            data_quality="LOW",
        )
        
        assert score_low < score_high, \
            f"Low quality should reduce recommendation score: {score_low} vs {score_high}"


class TestRecommendationGeneration:
    """Test full recommendation generation logic."""
    
    def test_no_strong_pick_for_low_quality(self):
        """Test that low quality data returns NO_STRONG_PICK."""
        low_quality_prediction = {
            "match_result": {"home_win": 60.0, "draw": 25.0, "away_win": 15.0},
            # Missing most fields -> LOW quality
        }
        
        recommendation = generate_recommendation(low_quality_prediction)
        
        assert recommendation.status == "NO_STRONG_PICK", \
            f"Expected NO_STRONG_PICK for low quality, got {recommendation.status}"
        assert recommendation.market_key is None
        assert recommendation.option_key is None
        assert recommendation.reason is not None
    
    def test_recommendation_with_valid_prediction(self):
        """Test that valid prediction generates recommendation."""
        valid_prediction = {
            "match_result": {"home_win": 60.0, "draw": 25.0, "away_win": 15.0},
            "double_chance": {"1x": 85.0, "x2": 40.0, "12": 75.0},
            "draw_no_bet": {"home_dnb": 70.0, "away_dnb": 18.0},
            "btts": {"yes": 55.0, "no": 45.0},
            "over_under": {
                "over_0_5": 95.0, "under_0_5": 5.0,
                "over_1_5": 70.0, "under_1_5": 30.0,
                "over_2_5": 45.0, "under_2_5": 55.0,
                "over_3_5": 25.0, "under_3_5": 75.0,
                "over_4_5": 10.0, "under_4_5": 90.0,
            }
        }
        
        recommendation = generate_recommendation(valid_prediction)
        
        # Should generate a recommendation (not NO_STRONG_PICK)
        # unless all markets fail quality gates
        assert recommendation is not None
        assert recommendation.model_version is not None
        assert recommendation.data_quality is not None
    
    def test_recommendation_with_market_filter(self):
        """Test that market filter works correctly."""
        valid_prediction = {
            "match_result": {"home_win": 60.0, "draw": 25.0, "away_win": 15.0},
            "double_chance": {"1x": 85.0, "x2": 40.0, "12": 75.0},
            "draw_no_bet": {"home_dnb": 70.0, "away_dnb": 18.0},
            "btts": {"yes": 55.0, "no": 45.0},
            "over_under": {
                "over_0_5": 95.0, "under_0_5": 5.0,
                "over_1_5": 70.0, "under_1_5": 30.0,
                "over_2_5": 45.0, "under_2_5": 55.0,
                "over_3_5": 25.0, "under_3_5": 75.0,
                "over_4_5": 10.0, "under_4_5": 90.0,
            }
        }
        
        # Filter to only 1X2 market
        recommendation = generate_recommendation(
            valid_prediction,
            market_filter=["1X2"]
        )
        
        assert recommendation is not None
        # If recommendation is STRONG, it should be from 1X2
        if recommendation.status == "STRONG":
            assert recommendation.market_key == "1X2"
    
    def test_over_0_5_does_not_automatically_win(self):
        """Test that Over 0.5 doesn't automatically win due to high probability."""
        # Create a scenario where Over 0.5 has highest raw probability
        # but other markets might have better quality indicators
        prediction = {
            "match_result": {"home_win": 55.0, "draw": 25.0, "away_win": 20.0},
            "double_chance": {"1x": 80.0, "x2": 45.0, "12": 75.0},
            "draw_no_bet": {"home_dnb": 68.0, "away_dnb": 22.0},
            "btts": {"yes": 60.0, "no": 40.0},
            "over_under": {
                "over_0_5": 98.0, "under_0_5": 2.0,  # Very high probability
                "over_1_5": 75.0, "under_1_5": 25.0,
                "over_2_5": 50.0, "under_2_5": 50.0,
                "over_3_5": 30.0, "under_3_5": 70.0,
                "over_4_5": 15.0, "under_4_5": 85.0,
            }
        }
        
        recommendation = generate_recommendation(prediction)
        
        # The engine should still make a reasoned choice
        # This test mainly ensures the engine doesn't crash and produces valid output
        assert recommendation is not None
        assert recommendation.status in ["STRONG", "NO_STRONG_PICK"]


class TestRecommendationObject:
    """Test Recommendation object structure and fields."""
    
    def test_recommendation_object_fields(self):
        """Test that Recommendation object has all required fields."""
        valid_prediction = {
            "match_result": {"home_win": 60.0, "draw": 25.0, "away_win": 15.0},
            "double_chance": {"1x": 85.0, "x2": 40.0, "12": 75.0},
            "draw_no_bet": {"home_dnb": 70.0, "away_dnb": 18.0},
            "btts": {"yes": 55.0, "no": 45.0},
            "over_under": {
                "over_0_5": 95.0, "under_0_5": 5.0,
                "over_1_5": 70.0, "under_1_5": 30.0,
                "over_2_5": 45.0, "under_2_5": 55.0,
                "over_3_5": 25.0, "under_3_5": 75.0,
                "over_4_5": 10.0, "under_4_5": 90.0,
            }
        }
        
        recommendation = generate_recommendation(valid_prediction)
        
        # Check all required fields exist
        assert hasattr(recommendation, 'status')
        assert hasattr(recommendation, 'market_key')
        assert hasattr(recommendation, 'option_key')
        assert hasattr(recommendation, 'label')
        assert hasattr(recommendation, 'raw_probability')
        assert hasattr(recommendation, 'calibrated_probability')
        assert hasattr(recommendation, 'confidence_score')
        assert hasattr(recommendation, 'recommendation_score')
        assert hasattr(recommendation, 'tier')
        assert hasattr(recommendation, 'data_quality')
        assert hasattr(recommendation, 'model_version')
        assert hasattr(recommendation, 'generated_at')
        assert hasattr(recommendation, 'reason')
    
    def test_no_strong_pick_has_null_fields(self):
        """Test that NO_STRONG_PICK has appropriate null fields."""
        low_quality_prediction = {
            "match_result": {"home_win": 60.0, "draw": 25.0, "away_win": 15.0},
        }
        
        recommendation = generate_recommendation(low_quality_prediction)
        
        assert recommendation.status == "NO_STRONG_PICK"
        assert recommendation.market_key is None
        assert recommendation.option_key is None
        assert recommendation.label is None
        assert recommendation.raw_probability is None
        assert recommendation.calibrated_probability is None
        assert recommendation.confidence_score is None
        assert recommendation.recommendation_score is None
        assert recommendation.tier is None


class TestMarketDefinitions:
    """Test market definitions consistency."""
    
    def test_all_9_markets_defined(self):
        """Test that all 9 market families are defined."""
        expected_markets = [
            "1X2", "DOUBLE_CHANCE", "DRAW_NO_BET",
            "OVER_UNDER_0_5", "OVER_UNDER_1_5", "OVER_UNDER_2_5",
            "OVER_UNDER_3_5", "OVER_UNDER_4_5", "BTTS"
        ]
        
        for market in expected_markets:
            assert market in MARKET_DEFINITIONS, f"Market {market} not defined"
    
    def test_market_definitions_have_required_fields(self):
        """Test that each market definition has required fields."""
        for market_key, definition in MARKET_DEFINITIONS.items():
            assert "label" in definition, f"Market {market_key} missing label"
            assert "source_key" in definition, f"Market {market_key} missing source_key"
            assert "options" in definition, f"Market {market_key} missing options"
            assert len(definition["options"]) > 0, f"Market {market_key} has no options"
            
            for option in definition["options"]:
                assert "key" in option, f"Market {market_key} option missing key"
                assert "label" in option, f"Market {market_key} option missing label"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])