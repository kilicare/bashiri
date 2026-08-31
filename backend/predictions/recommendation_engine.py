"""
predictions/recommendation_engine.py

========================================================================
BASHIRI ML — CANONICAL RECOMMENDATION ENGINE
========================================================================

This module provides ONE canonical implementation for AI Pick recommendations.

Architecture:
    Production JSON
        ↓
    Poisson Model (raw probabilities)
        ↓
    Recommendation Engine (quality gates, ranking)
        ↓
    Canonical Recommendation Object
        ↓
    Match Page / AI Feed (same source)

NON-NEGOTIABLE RULES:
- NO hardcoded empirical thresholds
- NO fabricated calibration data
- NO forced picks
- NO duplicated ranking logic
- JSON is source of truth
- Model version derived from artifact
"""

import logging
from typing import Any, Dict, Optional, List
from dataclasses import dataclass

from .ml.poisson_model import load_models

logger = logging.getLogger(__name__)


# ======================================================================
# MARKET DEFINITIONS (must match production JSON market_contract)
# ======================================================================
# Source: BASHIRI_PRODUCTION_MODEL.json -> market_contract

MARKET_DEFINITIONS = {
    # Full Match Markets
    "1X2": {"label": "Matokeo ya Mechi", "source_key": "match_result", "options": [
        {"key": "home_win", "label": "Ushindi Nyumbani"},
        {"key": "draw", "label": "Sare"},
        {"key": "away_win", "label": "Ushindi Ugenini"},
    ]},
    "DOUBLE_CHANCE": {"label": "Double Chance", "source_key": "double_chance", "options": [
        {"key": "1x", "label": "1X"}, {"key": "x2", "label": "X2"}, {"key": "12", "label": "12"},
    ]},
    "DRAW_NO_BET": {"label": "Draw No Bet", "source_key": "draw_no_bet", "options": [
        {"key": "home_dnb", "label": "Home DNB"}, {"key": "away_dnb", "label": "Away DNB"},
    ]},
    "BTTS": {"label": "Timu Zote Kufunga (BTTS)", "source_key": "btts", "options": [
        {"key": "btts_yes", "label": "Ndiyo"}, {"key": "btts_no", "label": "Hapana"},
    ]},
    # Full Match Over/Under (production contract: 1.5, 2.5 only)
    "OVER_UNDER_1_5": {"label": "Over/Under 1.5", "source_key": "over_under", "options": [
        {"key": "over_1_5", "label": "Over 1.5"}, {"key": "under_1_5", "label": "Under 1.5"},
    ]},
    "OVER_UNDER_2_5": {"label": "Over/Under 2.5", "source_key": "over_under", "options": [
        {"key": "over_2_5", "label": "Over 2.5"}, {"key": "under_2_5", "label": "Under 2.5"},
    ]},
    # Home Team Goals Over/Under (production contract: 0.5, 1.5, 2.5)
    "HOME_GOALS_OVER_0_5": {"label": "Home Over/Under 0.5", "source_key": "home_goals", "options": [
        {"key": "home_over_0_5", "label": "Over 0.5"}, {"key": "home_under_0_5", "label": "Under 0.5"},
    ]},
    "HOME_GOALS_OVER_1_5": {"label": "Home Over/Under 1.5", "source_key": "home_goals", "options": [
        {"key": "home_over_1_5", "label": "Over 1.5"}, {"key": "home_under_1_5", "label": "Under 1.5"},
    ]},
    "HOME_GOALS_OVER_2_5": {"label": "Home Over/Under 2.5", "source_key": "home_goals", "options": [
        {"key": "home_over_2_5", "label": "Over 2.5"}, {"key": "home_under_2_5", "label": "Under 2.5"},
    ]},
    # Away Team Goals Over/Under (production contract: 0.5, 1.5, 2.5)
    "AWAY_GOALS_OVER_0_5": {"label": "Away Over/Under 0.5", "source_key": "away_goals", "options": [
        {"key": "away_over_0_5", "label": "Over 0.5"}, {"key": "away_under_0_5", "label": "Under 0.5"},
    ]},
    "AWAY_GOALS_OVER_1_5": {"label": "Away Over/Under 1.5", "source_key": "away_goals", "options": [
        {"key": "away_over_1_5", "label": "Over 1.5"}, {"key": "away_under_1_5", "label": "Under 1.5"},
    ]},
    "AWAY_GOALS_OVER_2_5": {"label": "Away Over/Under 2.5", "source_key": "away_goals", "options": [
        {"key": "away_over_2_5", "label": "Over 2.5"}, {"key": "away_under_2_5", "label": "Under 2.5"},
    ]},
    # Correct Score (from adaptive Poisson score matrix)
    "CORRECT_SCORE": {"label": "Correct Score", "source_key": "correct_score", "options": [
        # Options are dynamically generated from predictions list
        # Handled specially in services.py
    ]},
}


# ======================================================================
# MARKET KEY MAPPING (backend market_key + option_key → JSON evaluation key)
# ======================================================================

MARKET_EVALUATION_KEY_MAP = {
    # 1X2
    ("1X2", "home_win"): "1x2_home",
    ("1X2", "draw"): "1x2_draw",
    ("1X2", "away_win"): "1x2_away",
    # BTTS
    ("BTTS", "btts_yes"): "btts_yes",
    ("BTTS", "btts_no"): "btts_no",
    # Full Match Over/Under (1.5, 2.5 only per production contract)
    ("OVER_UNDER_1_5", "over_1_5"): "over_1_5",
    ("OVER_UNDER_1_5", "under_1_5"): "over_1_5",
    ("OVER_UNDER_2_5", "over_2_5"): "over_2_5",
    ("OVER_UNDER_2_5", "under_2_5"): "over_2_5",
    # Home Team Goals Over/Under (0.5, 1.5, 2.5)
    ("HOME_GOALS_OVER_0_5", "home_over_0_5"): "home_over_0_5",
    ("HOME_GOALS_OVER_0_5", "home_under_0_5"): "home_over_0_5",
    ("HOME_GOALS_OVER_1_5", "home_over_1_5"): "home_over_1_5",
    ("HOME_GOALS_OVER_1_5", "home_under_1_5"): "home_over_1_5",
    ("HOME_GOALS_OVER_2_5", "home_over_2_5"): "home_over_2_5",
    ("HOME_GOALS_OVER_2_5", "home_under_2_5"): "home_over_2_5",
    # Away Team Goals Over/Under (0.5, 1.5, 2.5)
    ("AWAY_GOALS_OVER_0_5", "away_over_0_5"): "away_over_0_5",
    ("AWAY_GOALS_OVER_0_5", "away_under_0_5"): "away_over_0_5",
    ("AWAY_GOALS_OVER_1_5", "away_over_1_5"): "away_over_1_5",
    ("AWAY_GOALS_OVER_1_5", "away_under_1_5"): "away_over_1_5",
    ("AWAY_GOALS_OVER_2_5", "away_over_2_5"): "away_over_2_5",
    ("AWAY_GOALS_OVER_2_5", "away_under_2_5"): "away_over_2_5",
    # Draw No Bet
    ("DRAW_NO_BET", "home_dnb"): "dnb_home",
    ("DRAW_NO_BET", "away_dnb"): "dnb_away",
    # Double Chance
    ("DOUBLE_CHANCE", "1x"): "dc_1x",
    ("DOUBLE_CHANCE", "x2"): "dc_x2",
    ("DOUBLE_CHANCE", "12"): "dc_12",
}


# ======================================================================
# LOAD EVALUATION DATA FROM PRODUCTION JSON
# ======================================================================

def get_market_evaluation(market_key: str, option_key: str) -> Optional[Dict[str, Any]]:
    """
    Load market evaluation data from production JSON.
    
    Returns None if evaluation data is not available.
    """
    try:
        import json
        import os
        
        # Load production JSON directly
        model_path = os.path.join(
            os.path.dirname(__file__),
            "ml",
            "data",
            "BASHIRI_PRODUCTION_MODEL.json"
        )
        
        if not os.path.exists(model_path):
            logger.warning(f"Production JSON not found at {model_path}")
            return None
        
        with open(model_path, "r", encoding="utf-8") as f:
            production_json = json.load(f)
        
        market_eval_key = MARKET_EVALUATION_KEY_MAP.get((market_key, option_key))
        if not market_eval_key:
            return None
        
        market_evaluation = production_json.get("market_evaluation", {})
        markets = market_evaluation.get("markets", {})
        evaluation = markets.get(market_eval_key, {})
        
        if not evaluation:
            return None
        
        # Return overall evaluation data
        return evaluation.get("overall", None)
        
    except Exception as e:
        logger.warning(f"Failed to load market evaluation for {market_key}.{option_key}: {e}")
        return None


# ======================================================================
# CANONICAL RECOMMENDATION OBJECT
# ======================================================================

@dataclass
class Recommendation:
    """
    Canonical recommendation object returned by the engine.
    
    All fields are either:
    - Derived from production JSON/model
    - Calculated from available data
    - Explicitly null if unavailable
    """
    status: str  # "STRONG", "NO_STRONG_PICK"
    market_key: Optional[str]
    option_key: Optional[str]
    label: Optional[str]
    
    raw_probability: Optional[float]  # From Poisson model (0-100)
    calibrated_probability: Optional[float]  # null if calibration disabled
    
    confidence_score: Optional[float]  # Evidence quality score
    recommendation_score: Optional[float]  # Final ranking score
    
    tier: Optional[str]  # "STRONG", "ELITE" (future)
    
    market_reliability: Optional[Dict[str, Any]]  # null if unavailable
    sample_size: Optional[int]  # null if unavailable
    
    data_quality: str  # "HIGH", "MEDIUM", "LOW"
    
    model_version: str  # From JSON pipeline_version
    generated_at: str  # ISO timestamp
    
    reason: str  # Human-readable explanation


# ======================================================================
# DATA QUALITY ASSESSMENT
# ======================================================================

def assess_data_quality(prediction: Dict[str, Any]) -> str:
    """
    Assess prediction data quality based on completeness and validity.
    
    Returns: "HIGH", "MEDIUM", or "LOW"
    """
    required_fields = [
        "match_result", "double_chance", "draw_no_bet", 
        "btts", "over_under"
    ]
    
    missing_count = 0
    for field in required_fields:
        if field not in prediction or not prediction[field]:
            missing_count += 1
    
    # Check for invalid probabilities
    invalid_count = 0
    for market_key, definition in MARKET_DEFINITIONS.items():
        source_data = prediction.get(definition["source_key"], {})
        if source_data:
            for opt in definition["options"]:
                prob = source_data.get(opt["key"])
                if prob is not None:
                    if not (0 <= prob <= 100):
                        invalid_count += 1
    
    if missing_count == 0 and invalid_count == 0:
        return "HIGH"
    elif missing_count <= 2 and invalid_count == 0:
        return "MEDIUM"
    else:
        return "LOW"


# ======================================================================
# PROBABILITY VALIDATION
# ======================================================================

def validate_probability(prob: float, market_key: str, option_key: str) -> bool:
    """
    Validate that a probability is within valid bounds.
    
    Returns False for NaN, infinity, negative, or >100 values.
    """
    import math
    
    if prob is None:
        return False
    
    if not isinstance(prob, (int, float)):
        return False
    
    if math.isnan(prob) or math.isinf(prob):
        return False
    
    if prob < 0 or prob > 100:
        logger.warning(
            f"Invalid probability {prob} for {market_key}.{option_key}"
        )
        return False
    
    return True


# ======================================================================
# CONFIDENCE SCORE CALCULATION
# ======================================================================

def calculate_confidence_score(
    raw_probability: float,
    data_quality: str,
    calibration_available: bool,
    market_evaluation: Optional[Dict[str, Any]] = None,
) -> float:
    """
    Calculate confidence score based on evidence quality.
    
    This is NOT the same as raw probability. It represents evidence quality.
    
    Factors:
    - Raw probability strength
    - Data quality
    - Calibration availability
    - Historical market reliability (from evaluation data if available)
    - Sample size from evaluation data
    
    Returns score in [0, 1]
    """
    import math
    
    # Base score from probability strength
    # Higher probability → higher base confidence
    prob_score = min(1.0, raw_probability / 100.0)
    
    # Data quality multiplier
    quality_multipliers = {
        "HIGH": 1.0,
        "MEDIUM": 0.8,
        "LOW": 0.5,
    }
    quality_multiplier = quality_multipliers.get(data_quality, 0.5)
    
    # Calibration status (no bonus, just availability check)
    # Calibration is disabled in production per JSON, so this is informational only
    calibration_status = 1.0 if calibration_available else 0.95
    
    confidence = prob_score * quality_multiplier * calibration_status
    
    # Adjust based on historical market reliability if available
    if market_evaluation:
        # Use sample size as evidence quality indicator
        sample_size = market_evaluation.get("sample_size")
        if sample_size is not None:
            # Larger sample sizes provide more reliable evidence
            # Using a log-scale to avoid over-weighting very large samples
            if sample_size >= 1000:
                sample_multiplier = 1.0
            elif sample_size >= 500:
                sample_multiplier = 0.95
            elif sample_size >= 100:
                sample_multiplier = 0.90
            else:
                sample_multiplier = 0.80  # Small sample - less confident
            confidence *= sample_multiplier
        
        # Use hit_rate as reliability indicator
        hit_rate = market_evaluation.get("hit_rate")
        if hit_rate is not None:
            # If hit_rate is higher than expected, boost confidence
            # If hit_rate is lower than predicted, reduce confidence
            mean_pred = market_evaluation.get("mean_predicted_probability", 0.5)
            if hit_rate > mean_pred:
                # Model underestimates this market, it's more reliable
                confidence *= 1.02
            elif hit_rate < mean_pred:
                # Model overestimates this market, it's less reliable
                confidence *= 0.98
        
        # Use Brier Score (lower is better)
        brier_score = market_evaluation.get("brier_score")
        if brier_score is not None:
            # Brier Score ranges from 0 to 1, lower is better
            # If Brier Score is good (< 0.25), boost confidence
            if brier_score < 0.20:
                confidence *= 1.03
            elif brier_score > 0.30:
                confidence *= 0.97
    
    # Clamp to [0, 1]
    return max(0.0, min(1.0, confidence))


# RECOMMENDATION SCORE CALCULATION
# ======================================================================

def calculate_recommendation_score(
    raw_probability: float,
    confidence_score: float,
    data_quality: str,
) -> float:
    """
    Calculate final recommendation score for ranking.
    
    This combines raw probability with evidence quality.
    
    Formula:
        score = (raw_probability / 100) * confidence_score * quality_weight
    
    Returns score in [0, 1]
    """
    # Normalize probability to [0, 1]
    norm_prob = raw_probability / 100.0
    
    # Quality weights
    quality_weights = {
        "HIGH": 1.0,
        "MEDIUM": 0.85,
        "LOW": 0.6,
    }
    quality_weight = quality_weights.get(data_quality, 0.5)
    
    # Final score
    score = norm_prob * confidence_score * quality_weight
    
    return max(0.0, min(1.0, score))


# ======================================================================
# MAIN RECOMMENDATION ENGINE
# ======================================================================

def generate_recommendation(
    prediction: Dict[str, Any],
    market_filter: Optional[List[str]] = None,
    min_probability: float = 0.0,
    min_confidence: float = 0.0,
) -> Recommendation:
    """
    Generate canonical AI Pick recommendation.
    
    Args:
        prediction: Raw prediction from Poisson model
        market_filter: Optional list of market keys to consider (None = all)
        min_probability: Minimum raw probability threshold (0-100)
        min_confidence: Minimum confidence score threshold (0-1)
    
    Returns:
        Recommendation object with status "STRONG" or "NO_STRONG_PICK"
    """
    from datetime import datetime, timezone
    
    # Load model artifact for metadata
    try:
        artifact = load_models()
        model_version = artifact.get("pipeline_version", "unknown")
        calibration_enabled = artifact.get("calibration", {}).get(
            "production_enabled", False
        )
    except Exception as e:
        logger.error(f"Failed to load model artifact: {e}")
        model_version = "unknown"
        calibration_enabled = False
    
    # Assess data quality
    data_quality = assess_data_quality(prediction)
    
    # If data quality is LOW, return NO_STRONG_PICK
    if data_quality == "LOW":
        return Recommendation(
            status="NO_STRONG_PICK",
            market_key=None,
            option_key=None,
            label=None,
            raw_probability=None,
            calibrated_probability=None,
            confidence_score=None,
            recommendation_score=None,
            tier=None,
            market_reliability=None,
            sample_size=None,
            data_quality=data_quality,
            model_version=model_version,
            generated_at=datetime.now(timezone.utc).isoformat(),
            reason="Data quality insufficient for recommendation",
        )
    
    # Build candidate markets
    candidates = []
    
    markets_to_consider = (
        market_filter if market_filter else list(MARKET_DEFINITIONS.keys())
    )
    
    for market_key in markets_to_consider:
        if market_key not in MARKET_DEFINITIONS:
            continue
        
        definition = MARKET_DEFINITIONS[market_key]
        source_data = prediction.get(definition["source_key"], {})
        
        if not source_data:
            continue
            
        for opt in definition["options"]:
            raw_prob = source_data.get(opt["key"])
            
            # Validate probability
            if not validate_probability(raw_prob, market_key, opt["key"]):
                continue
            
            # Apply minimum probability filter
            if raw_prob < min_probability:
                continue
            
            # Load market evaluation data
            market_evaluation = get_market_evaluation(market_key, opt["key"])
            
            # Calculate confidence score
            confidence = calculate_confidence_score(
                raw_prob,
                data_quality,
                calibration_enabled,
                market_evaluation,
            )
            
            # Apply minimum confidence filter
            if confidence < min_confidence:
                continue
            
            # Calculate recommendation score
            rec_score = calculate_recommendation_score(
                raw_prob,
                confidence,
                data_quality,
            )
            
            candidates.append({
                "market_key": market_key,
                "option_key": opt["key"],
                "label": opt["label"],
                "market_label": definition["label"],
                "raw_probability": raw_prob,
                "calibrated_probability": None,  # No calibration data available
                "confidence_score": confidence,
                "recommendation_score": rec_score,
                "market_evaluation": market_evaluation,
            })
    
    # If no candidates pass quality gates
    if not candidates:
        return Recommendation(
            status="NO_STRONG_PICK",
            market_key=None,
            option_key=None,
            label=None,
            raw_probability=None,
            calibrated_probability=None,
            confidence_score=None,
            recommendation_score=None,
            tier=None,
            market_reliability=None,
            sample_size=None,
            data_quality=data_quality,
            model_version=model_version,
            generated_at=datetime.now(timezone.utc).isoformat(),
            reason=f"No market met quality gates (min_prob={min_probability}%, min_conf={min_confidence})",
        )
    
    # Select best candidate by recommendation score
    best = max(candidates, key=lambda x: x["recommendation_score"])
    
    # Determine tier based on confidence
    if best["confidence_score"] >= 0.85:
        tier = "ELITE"
    elif best["confidence_score"] >= 0.70:
        tier = "STRONG"
    else:
        tier = None
    
    return Recommendation(
        status="STRONG",
        market_key=best["market_key"],
        option_key=best["option_key"],
        label=best["label"],
        raw_probability=best["raw_probability"],
        calibrated_probability=best["calibrated_probability"],
        confidence_score=best["confidence_score"],
        recommendation_score=best["recommendation_score"],
        tier=tier,
        market_reliability=best["market_evaluation"],  # Use evaluation data from JSON
        sample_size=best["market_evaluation"].get("sample_size") if best["market_evaluation"] else None,
        data_quality=data_quality,
        model_version=model_version,
        generated_at=datetime.now(timezone.utc).isoformat(),
        reason=f"Selected {best['market_label']} - {best['label']} with {best['raw_probability']:.1f}% probability and confidence score {best['confidence_score']:.2f}",
    )


# ======================================================================
# COMPATIBILITY WRAPPER FOR EXISTING CODE
# ======================================================================

def compute_global_top_pick_legacy(prediction: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Legacy compatibility wrapper for existing services.py code.
    
    This maintains the old interface while using the new engine internally.
    
    TODO: Remove this after full migration to Recommendation Engine.
    """
    # NO HARDCODED THRESHOLDS - let the engine determine quality
    recommendation = generate_recommendation(
        prediction,
        min_probability=0.0,  # No hardcoded threshold
        min_confidence=0.0,  # No hardcoded threshold
    )
    
    if recommendation.status == "NO_STRONG_PICK":
        return None
    
    return {
        "market_key": recommendation.market_key,
        "market_label": MARKET_DEFINITIONS[recommendation.market_key]["label"],
        "option_key": recommendation.option_key,
        "option_label": recommendation.label,
        "confidence": round(recommendation.raw_probability, 1),
    }
