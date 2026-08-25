"""
predictions/ml/poisson_model.py

======================================================================
BASHIRI ML v2.0 - PRODUCTION POISSON PREDICTION ENGINE
======================================================================

CANONICAL RULE:

    This file is ONLY the prediction engine.

    It does NOT invent team parameters.
    It does NOT calculate a new league average from historical data.
    It does NOT silently replace missing teams.
    It does NOT invent an Elo formula.

    All trained team parameters and league baselines MUST come from:

        predictions/ml/data/bashiri_prediction_models.json

Expected JSON structure:

{
    "model_info": {
        "version": "2.0"
    },

    "features_used": {
        "elo_engine": {
            "home_advantage_points": 65
        }
    },

    "team_parameters": {
        "per_league": {
            "LaLiga": {
                "baseline": {
                    "home_advantage": 1.10,
                    "avg_goals": 1.326
                },
                "teams": {
                    "FC Barcelona": {
                        "attack": 1.20,
                        "defense": 0.90
                    }
                }
            }
        }
    }
}

IMPORTANT:

    home_advantage_points = 65
        -> Elo configuration/metadata.

    baseline.home_advantage
        -> multiplier actually used by the Poisson xG formula.

    baseline.avg_goals
        -> fixed trained league baseline.

    teams.<team>.attack
    teams.<team>.defense
        -> trained team parameters.

BASHIRI ML v2.0 configuration:

    Model version:
        2.0

    Reference date:
        2026-08-24

    Home advantage points:
        65

    BTTS calibration:
        0.86

    Over/Under calibration:
        0.83
======================================================================
"""

import json
import logging
import os
from difflib import SequenceMatcher
from functools import lru_cache
from typing import Any, Dict, List, Optional, Tuple

from scipy.stats import poisson


# ======================================================================
# LOGGING
# ======================================================================

logger = logging.getLogger(__name__)


# ======================================================================
# MODEL CONFIGURATION
# ======================================================================

MODEL_VERSION = "2.0"
REFERENCE_DATE = "2026-08-24"

EXPECTED_HOME_ADVANTAGE_POINTS = 65

BTTS_CALIBRATION_MULTIPLIER = 0.86
OVER_CALIBRATION_MULTIPLIER = 0.83

DEFAULT_MAX_GOALS = 8

MIN_XG = 0.05
MAX_XG = 6.0

MIN_ATTACK_DEFENSE = 0.5
MAX_ATTACK_DEFENSE = 3.0

MIN_HOME_ADVANTAGE = 0.5
MAX_HOME_ADVANTAGE = 2.0

MIN_LEAGUE_AVG_GOALS = 0.8
MAX_LEAGUE_AVG_GOALS = 2.5


# ======================================================================
# MODEL FILE
# ======================================================================

MODEL_DATA_PATH = os.path.join(
    os.path.dirname(__file__),
    "data",
    "bashiri_prediction_models.json",
)


# ======================================================================
# TEAM ALIASES
# ======================================================================

TEAM_ALIASES = {
    "man city": "manchester city fc",
    "manchester city": "manchester city fc",

    "man utd": "manchester united fc",
    "manchester utd": "manchester united fc",
    "man united": "manchester united fc",
    "manchester united": "manchester united fc",

    "spurs": "tottenham hotspur fc",
    "tottenham": "tottenham hotspur fc",

    "real madrid": "real madrid cf",

    "barca": "fc barcelona",
    "barcelona": "fc barcelona",
    "fc barcelona": "fc barcelona",

    "inter": "fc internazionale milano",
    "inter milan": "fc internazionale milano",

    "bayern": "fc bayern münchen",
    "bayern munich": "fc bayern münchen",
    "bayern münchen": "fc bayern münchen",

    "dortmund": "borussia dortmund",

    "juve": "juventus fc",
    "juventus": "juventus fc",

    "ajax": "afc ajax",

    "psg": "paris saint-germain fc",
    "paris sg": "paris saint-germain fc",

    "west ham": "west ham united fc",

    "newcastle": "newcastle united fc",

    "wolves": "wolverhampton wanderers fc",
    "wolverhampton": "wolverhampton wanderers fc",

    "brighton": "brighton & hove albion fc",
    "hove": "brighton & hove albion fc",
}


# ======================================================================
# BASIC HELPERS
# ======================================================================

def _safe_float(
    value: Any,
    default: Optional[float] = None,
) -> Optional[float]:

    try:
        if value is None:
            return default

        return float(value)

    except (TypeError, ValueError):
        return default


def sanitize_parameter(
    value: Any,
    min_val: float = 0.05,
    max_val: float = 6.0,
) -> float:

    numeric_value = _safe_float(value)

    if numeric_value is None:
        raise ValueError(
            f"Parameter '{value}' haiwezi kuwa number."
        )

    sanitized = max(
        min_val,
        min(max_val, numeric_value),
    )

    if sanitized != numeric_value:
        logger.warning(
            "Parameter sanitized: %s -> %s [%s, %s]",
            numeric_value,
            sanitized,
            min_val,
            max_val,
        )

    return sanitized


def _round_probability(value: float) -> float:

    value = max(
        0.0,
        min(100.0, float(value)),
    )

    return round(value, 1)


def _normalize_team_name(name: str) -> str:

    if name is None:
        return ""

    return " ".join(
        str(name).strip().lower().split()
    )


# ======================================================================
# MODEL STRUCTURE VALIDATION
# ======================================================================

def _validate_model_structure(
    models: Dict[str, Any],
) -> None:

    if not isinstance(models, dict):
        raise ValueError(
            "❌ Model JSON lazima iwe object/dictionary."
        )

    if "leagues" not in models:
        raise ValueError(
            "\n"
            "❌ CRITICAL MODEL ERROR:\n"
            "JSON haina 'leagues'.\n\n"
            "Prediction engine haiwezi kufanya prediction "
            "bila trained team parameters."
        )

    leagues = models["leagues"]

    if not isinstance(leagues, dict):
        raise ValueError(
            "❌ 'leagues' lazima iwe dictionary."
        )

    if not leagues:
        raise ValueError(
            "❌ 'leagues' iko EMPTY."
        )

    # --------------------------------------------------------------
    # Validate every league immediately.
    # --------------------------------------------------------------

    for league_code, league_data in leagues.items():

        if not isinstance(league_data, dict):
            raise ValueError(
                f"❌ League '{league_code}' ina invalid structure."
            )

        baseline = league_data.get("baseline")

        if not isinstance(baseline, dict):
            raise ValueError(
                f"❌ League '{league_code}' haina valid 'baseline'."
            )

        if "avg_goals" not in baseline:
            raise ValueError(
                f"❌ League '{league_code}' haina baseline.avg_goals."
            )

        if "home_advantage" not in baseline:
            raise ValueError(
                f"❌ League '{league_code}' "
                "haina baseline.home_advantage."
            )

        teams = league_data.get("teams")

        if not isinstance(teams, dict) or not teams:
            raise ValueError(
                "\n"
                f"❌ CRITICAL MODEL ERROR: League '{league_code}' "
                "haina trained team parameters.\n"
                "Expected:\n"
                "teams -> team -> attack/defense"
            )

        for team_name, params in teams.items():

            if not isinstance(params, dict):
                raise ValueError(
                    f"❌ Team '{team_name}' "
                    f"kwenye league '{league_code}' "
                    "ina invalid parameters."
                )

            if "attack" not in params:
                raise ValueError(
                    f"❌ Team '{team_name}' "
                    f"kwenye '{league_code}' "
                    "haina attack parameter."
                )

            if "defense" not in params:
                raise ValueError(
                    f"❌ Team '{team_name}' "
                    f"kwenye '{league_code}' "
                    "haina defense parameter."
                )

            if _safe_float(params["attack"]) is None:
                raise ValueError(
                    f"❌ Team '{team_name}' attack "
                    "parameter si number."
                )

            if _safe_float(params["defense"]) is None:
                raise ValueError(
                    f"❌ Team '{team_name}' defense "
                    "parameter si number."
                )


# ======================================================================
# LOAD MODEL
# ======================================================================

@lru_cache(maxsize=1)
def load_models() -> Dict[str, Any]:

    if not os.path.exists(MODEL_DATA_PATH):

        raise FileNotFoundError(
            "\n"
            "❌ BASHIRI ML JSON haipo.\n"
            f"Expected path:\n{MODEL_DATA_PATH}\n"
        )

    try:

        with open(
            MODEL_DATA_PATH,
            "r",
            encoding="utf-8",
        ) as model_file:

            models = json.load(model_file)

    except json.JSONDecodeError as exc:

        raise ValueError(
            f"❌ JSON imeharibika: {exc}"
        ) from exc

    except OSError as exc:

        raise OSError(
            f"❌ Imeshindikana kusoma JSON: {exc}"
        ) from exc

    _validate_model_structure(models)

    model_info = models.get(
        "model_info",
        {},
    )

    version = model_info.get(
        "version",
        "UNKNOWN",
    )

    logger.info(
        "✅ Loaded BASHIRI ML model v%s",
        version,
    )

    # --------------------------------------------------------------
    # Verify home advantage points.
    # --------------------------------------------------------------

    elo_config = models.get("elo", {})

    home_advantage_points = elo_config.get(
        "home_advantage_points"
    )

    if home_advantage_points == EXPECTED_HOME_ADVANTAGE_POINTS:

        logger.info(
            "✅ Elo home_advantage_points = 65"
        )

    elif home_advantage_points is not None:

        logger.warning(
            "⚠️ JSON home_advantage_points=%s "
            "(expected=%s)",
            home_advantage_points,
            EXPECTED_HOME_ADVANTAGE_POINTS,
        )

    else:

        logger.warning(
            "⚠️ JSON does not contain elo.home_advantage_points"
        )

    # --------------------------------------------------------------
    # Log calibration metadata.
    # --------------------------------------------------------------

    calibration = models.get(
        "calibration",
        {},
    )

    if isinstance(calibration, dict):

        logger.info(
            "Calibration multipliers: BTTS=%s, Over=%s",
            calibration.get("btts_multiplier", "N/A"),
            calibration.get("over_2_5_multiplier", "N/A"),
        )

    # --------------------------------------------------------------
    # IMPORTANT:
    # Print summary of trained parameters.
    # --------------------------------------------------------------

    leagues = models["leagues"]

    total_teams = 0

    for league_code, league_data in leagues.items():

        teams = league_data.get(
            "teams",
            {},
        )

        total_teams += len(teams)

        logger.info(
            "📦 League=%s | teams=%s | avg_goals=%s | home_advantage=%s | elo_coefficient=%s",
            league_code,
            len(teams),
            league_data["baseline"]["avg_goals"],
            league_data["baseline"]["home_advantage"],
            league_data.get("elo_coefficient", 0.0),
        )

    logger.info(
        "📊 Model contains %s leagues and %s teams.",
        len(leagues),
        total_teams,
    )

    return models


def reload_models() -> Dict[str, Any]:

    load_models.cache_clear()

    logger.info(
        "🔄 Model cache cleared."
    )

    return load_models()


# ======================================================================
# LEAGUES
# ======================================================================

def get_available_leagues() -> List[str]:

    models = load_models()

    return list(
        models["leagues"].keys()
    )


def get_league_params(
    league_code: str,
) -> Tuple[Dict[str, Any], float, float, float]:

    if not league_code:

        raise ValueError(
            "❌ league_code haiwezi kuwa empty."
        )

    models = load_models()

    leagues = models["leagues"]

    requested = str(
        league_code
    ).strip()

    league_data = leagues.get(
        requested
    )

    # Case-insensitive lookup.
    if league_data is None:

        for code, data in leagues.items():

            if (
                str(code).strip().lower()
                == requested.lower()
            ):

                league_code = code
                league_data = data
                break

    if league_data is None:

        raise ValueError(
            f"\n"
            f"❌ League '{league_code}' haipo kwenye trained model.\n"
            f"Available leagues: {list(leagues.keys())}\n"
        )

    teams = league_data.get(
        "teams",
        {},
    )

    if not teams:

        raise ValueError(
            f"❌ League '{league_code}' haina team parameters."
        )

    baseline = league_data.get(
        "baseline",
        {},
    )

    elo_coefficient = _safe_float(
        league_data.get("elo_coefficient", 0.0)
    )

    if elo_coefficient is None:
        elo_coefficient = 0.0

    home_advantage = sanitize_parameter(
        baseline["home_advantage"],
        MIN_HOME_ADVANTAGE,
        MAX_HOME_ADVANTAGE,
    )

    league_avg_goals = sanitize_parameter(
        baseline["avg_goals"],
        MIN_LEAGUE_AVG_GOALS,
        MAX_LEAGUE_AVG_GOALS,
    )

    logger.info(
        "League loaded: %s | teams=%s | "
        "avg_goals=%.4f | home_advantage=%.4f | elo_coefficient=%.6f",
        league_code,
        len(teams),
        league_avg_goals,
        home_advantage,
        elo_coefficient,
    )

    return (
        teams,
        home_advantage,
        league_avg_goals,
        elo_coefficient,
    )


# ======================================================================
# TEAM MATCHING
# ======================================================================

def find_best_team_match(
    search_name: str,
    available_teams: List[str],
    threshold: float = 0.70,
) -> Tuple[Optional[str], float]:

    if not search_name:
        return None, 0.0

    search = _normalize_team_name(
        search_name
    )

    alias = TEAM_ALIASES.get(
        search
    )

    if alias:
        search = alias

    best_match = None
    best_score = 0.0

    for team_name in available_teams:

        team = _normalize_team_name(
            team_name
        )

        if search == team:

            return team_name, 1.0

        score = SequenceMatcher(
            None,
            search,
            team,
        ).ratio()

        if (
            search in team
            or team in search
        ):

            score += 0.15

        search_words = set(
            search.split()
        )

        team_words = set(
            team.split()
        )

        common_words = (
            search_words
            & team_words
        )

        score += (
            0.10
            * len(common_words)
        )

        score = min(
            score,
            1.0,
        )

        if score > best_score:

            best_score = score
            best_match = team_name

    if (
        best_match is not None
        and best_score >= threshold
    ):

        logger.info(
            "Fuzzy match: '%s' -> '%s' %.2f",
            search_name,
            best_match,
            best_score,
        )

        return (
            best_match,
            best_score,
        )

    return (
        None,
        best_score,
    )


# ======================================================================
# TEAM RESOLUTION
# ======================================================================

def resolve_team(
    team_name: str,
    team_params: Dict[str, Any],
) -> str:

    if team_name in team_params:

        return team_name

    normalized = _normalize_team_name(
        team_name
    )

    normalized_map = {
        _normalize_team_name(name): name
        for name in team_params
    }

    # Case-insensitive exact match.
    if normalized in normalized_map:

        return normalized_map[
            normalized
        ]

    # Alias / fuzzy.
    matched, score = find_best_team_match(
        team_name,
        list(team_params.keys()),
    )

    if matched:

        logger.info(
            "Resolved team '%s' -> '%s' (%.2f)",
            team_name,
            matched,
            score,
        )

        return matched

    raise ValueError(
        "\n"
        f"❌ Team '{team_name}' haipatikani kwenye model.\n"
        f"Best fuzzy score: {score:.2%}\n"
        f"Available teams: {list(team_params.keys())}\n"
    )


# ======================================================================
# POISSON
# ======================================================================

def _build_poisson_probabilities(
    xg: float,
    max_goals: int,
) -> List[float]:

    probabilities = [
        poisson.pmf(
            goals,
            xg,
        )
        for goals in range(max_goals)
    ]

    total = sum(
        probabilities
    )

    if total <= 0:

        raise ValueError(
            "❌ Poisson probability mass is zero."
        )

    # Normalize truncated 0..7 distribution.
    return [
        p / total
        for p in probabilities
    ]


# ======================================================================
# PREDICTION ENGINE
# ======================================================================

def predict_all_markets(
    home_team: str,
    away_team: str,
    team_params: Dict[str, Any],
    elo_ratings: Dict[str, float],
    home_advantage: float,
    league_avg_goals: float,
    elo_coefficient: float,
    max_goals: int = DEFAULT_MAX_GOALS,
) -> Dict[str, Any]:

    if home_team not in team_params:
        raise ValueError(
            f"❌ Home team '{home_team}' haipo."
        )

    if away_team not in team_params:
        raise ValueError(
            f"❌ Away team '{away_team}' haipo."
        )

    if home_team == away_team:

        raise ValueError(
            "❌ Home na away team haziwezi kuwa sawa."
        )

    home = team_params[
        home_team
    ]

    away = team_params[
        away_team
    ]

    # --------------------------------------------------------------
    # TRAINED PARAMETERS
    # --------------------------------------------------------------

    home_attack = sanitize_parameter(
        home["attack"],
        MIN_ATTACK_DEFENSE,
        MAX_ATTACK_DEFENSE,
    )

    home_defense = sanitize_parameter(
        home["defense"],
        MIN_ATTACK_DEFENSE,
        MAX_ATTACK_DEFENSE,
    )

    away_attack = sanitize_parameter(
        away["attack"],
        MIN_ATTACK_DEFENSE,
        MAX_ATTACK_DEFENSE,
    )

    away_defense = sanitize_parameter(
        away["defense"],
        MIN_ATTACK_DEFENSE,
        MAX_ATTACK_DEFENSE,
    )

    home_advantage = sanitize_parameter(
        home_advantage,
        MIN_HOME_ADVANTAGE,
        MAX_HOME_ADVANTAGE,
    )

    league_avg_goals = sanitize_parameter(
        league_avg_goals,
        MIN_LEAGUE_AVG_GOALS,
        MAX_LEAGUE_AVG_GOALS,
    )

    # --------------------------------------------------------------
    # ELO CALCULATION
    # --------------------------------------------------------------

    elo_scale = 100.0  # From JSON config
    initial_rating = 1500.0  # From JSON config

    home_rating = elo_ratings.get(home_team, initial_rating)
    away_rating = elo_ratings.get(away_team, initial_rating)

    # Calculate elo_scaled (rating difference / scale)
    elo_diff = (home_rating - away_rating) / elo_scale

    # --------------------------------------------------------------
    # CANONICAL BASHIRI xG FORMULA with ELO
    # --------------------------------------------------------------
    # home_xg = baseline * home_attack * away_defense * home_advantage * exp(elo_coefficient * elo_scaled)
    # away_xg = baseline * away_attack * home_defense * exp(-elo_coefficient * elo_scaled)

    import math

    home_xg = (
        league_avg_goals
        * home_attack
        * away_defense
        * home_advantage
        * math.exp(elo_coefficient * elo_diff)
    )

    away_xg = (
        league_avg_goals
        * away_attack
        * home_defense
        * math.exp(-elo_coefficient * elo_diff)
    )

    home_xg = sanitize_parameter(
        home_xg,
        MIN_XG,
        MAX_XG,
    )

    away_xg = sanitize_parameter(
        away_xg,
        MIN_XG,
        MAX_XG,
    )

    logger.info(
        "📊 %s vs %s | "
        "Home attack=%.4f defense=%.4f rating=%.1f | "
        "Away attack=%.4f defense=%.4f rating=%.1f | "
        "Elo diff=%.4f | Home xG=%.4f Away xG=%.4f",
        home_team,
        away_team,
        home_attack,
        home_defense,
        home_rating,
        away_attack,
        away_defense,
        away_rating,
        elo_diff,
        home_xg,
        away_xg,
    )

    # --------------------------------------------------------------
    # POISSON
    # --------------------------------------------------------------

    home_probs = _build_poisson_probabilities(
        home_xg,
        max_goals,
    )

    away_probs = _build_poisson_probabilities(
        away_xg,
        max_goals,
    )

    # --------------------------------------------------------------
    # MARKETS
    # --------------------------------------------------------------

    home_win = 0.0
    draw = 0.0
    away_win = 0.0

    over = {
        0.5: 0.0,
        1.5: 0.0,
        2.5: 0.0,
        3.5: 0.0,
        4.5: 0.0,
    }

    btts_yes_raw = 0.0

    # --------------------------------------------------------------
    # SCORE MATRIX
    # --------------------------------------------------------------

    for h in range(max_goals):

        for a in range(max_goals):

            probability = (
                home_probs[h]
                * away_probs[a]
            )

            if h > a:

                home_win += probability

            elif h == a:

                draw += probability

            else:

                away_win += probability

            total_goals = h + a

            for line in over:

                if total_goals > line:

                    over[line] += probability

            if h > 0 and a > 0:

                btts_yes_raw += probability

    # --------------------------------------------------------------
    # 1X2 NORMALIZATION
    # --------------------------------------------------------------

    total_result = (
        home_win
        + draw
        + away_win
    )

    if total_result <= 0:

        raise ValueError(
            "❌ 1X2 probability total is zero."
        )

    home_win /= total_result
    draw /= total_result
    away_win /= total_result

    # --------------------------------------------------------------
    # CALIBRATION
    # --------------------------------------------------------------

    btts_yes = (
        btts_yes_raw
        * BTTS_CALIBRATION_MULTIPLIER
    )

    btts_yes = max(
        0.0,
        min(1.0, btts_yes),
    )

    calibrated_over = {}

    for line, probability in over.items():

        calibrated = (
            probability
            * OVER_CALIBRATION_MULTIPLIER
        )

        calibrated_over[line] = max(
            0.0,
            min(1.0, calibrated),
        )

    # --------------------------------------------------------------
    # UNDER
    # --------------------------------------------------------------

    under = {
        line: max(
            0.0,
            min(
                1.0,
                1.0 - probability,
            ),
        )
        for line, probability
        in calibrated_over.items()
    }

    # --------------------------------------------------------------
    # BTTS NO
    # --------------------------------------------------------------

    btts_no = max(
        0.0,
        min(
            1.0,
            1.0 - btts_yes,
        ),
    )

    # --------------------------------------------------------------
    # DOUBLE CHANCE
    # --------------------------------------------------------------

    double_chance = {
        "1X": home_win + draw,
        "X2": draw + away_win,
        "12": home_win + away_win,
    }

    # --------------------------------------------------------------
    # DNB
    # --------------------------------------------------------------

    dnb_total = (
        home_win
        + away_win
    )

    if dnb_total > 0:

        home_dnb = (
            home_win
            / dnb_total
        )

        away_dnb = (
            away_win
            / dnb_total
        )

    else:

        home_dnb = 0.5
        away_dnb = 0.5

    # --------------------------------------------------------------
    # AI PICK
    # --------------------------------------------------------------

    picks = {
        "Home Win": home_win,
        "Draw": draw,
        "Away Win": away_win,
    }

    best_pick = max(
        picks,
        key=picks.get,
    )

    # --------------------------------------------------------------
    # RESULT
    # --------------------------------------------------------------

    result = {

        "model_version": MODEL_VERSION,

        "reference_date": REFERENCE_DATE,

        "fixture": {
            "home_team": home_team,
            "away_team": away_team,
        },

        "expected_goals": {
            "home_xg": round(
                home_xg,
                2,
            ),
            "away_xg": round(
                away_xg,
                2,
            ),
            "total_xg": round(
                home_xg + away_xg,
                2,
            ),
        },

        "match_result": {
            "home_win": _round_probability(
                home_win * 100
            ),
            "draw": _round_probability(
                draw * 100
            ),
            "away_win": _round_probability(
                away_win * 100
            ),
        },

        "double_chance": {
            key: _round_probability(
                value * 100
            )
            for key, value
            in double_chance.items()
        },

        "draw_no_bet": {
            "home_dnb": _round_probability(
                home_dnb * 100
            ),
            "away_dnb": _round_probability(
                away_dnb * 100
            ),
        },

        "over_under": {},

        "btts": {
            "yes": _round_probability(
                btts_yes * 100
            ),
            "no": _round_probability(
                btts_no * 100
            ),
        },

        "ai_pick": {
            "market": "1X2",
            "selection": best_pick,
            "confidence": _round_probability(
                picks[best_pick] * 100
            ),
        },

        "calibration": {
            "btts_multiplier": (
                BTTS_CALIBRATION_MULTIPLIER
            ),
            "over_multiplier": (
                OVER_CALIBRATION_MULTIPLIER
            ),
            "home_advantage_points": (
                EXPECTED_HOME_ADVANTAGE_POINTS
            ),
            "elo_coefficient": elo_coefficient,
        },

        "accuracy_info": {
            "model_type": (
                "Poisson + trained team parameters + Dynamic Elo"
            ),
            "reference_date": REFERENCE_DATE,
        },
    }

    # --------------------------------------------------------------
    # OVER / UNDER MARKETS
    # --------------------------------------------------------------

    for line in (
        0.5,
        1.5,
        2.5,
        3.5,
        4.5,
    ):

        result["over_under"][
            f"over_{line}"
        ] = _round_probability(
            calibrated_over[line] * 100
        )

        result["over_under"][
            f"under_{line}"
        ] = _round_probability(
            under[line] * 100
        )

    return result


# ======================================================================
# PUBLIC FIXTURE API
# ======================================================================

def predict_fixture(
    league_code: str,
    home_team: str,
    away_team: str,
) -> Dict[str, Any]:

    if not league_code:
        raise ValueError(
            "❌ league_code haijawekwa."
        )

    if not home_team:
        raise ValueError(
            "❌ home_team haijawekwa."
        )

    if not away_team:
        raise ValueError(
            "❌ away_team haijawekwa."
        )

    (
        team_params,
        home_advantage,
        league_avg_goals,
        elo_coefficient,
    ) = get_league_params(
        league_code
    )

    # --------------------------------------------------------------
    # IMPORTANT:
    # Resolve both teams ONLY against the trained JSON.
    # --------------------------------------------------------------

    matched_home = resolve_team(
        home_team,
        team_params,
    )

    matched_away = resolve_team(
        away_team,
        team_params,
    )

    if matched_home == matched_away:

        raise ValueError(
            f"❌ Both fixtures resolved to '{matched_home}'."
        )

    # --------------------------------------------------------------
    # Get ELO ratings from JSON
    # --------------------------------------------------------------

    models = load_models()
    elo_ratings = models.get("elo", {}).get("ratings", {})

    logger.info(
        "🚀 Running canonical prediction: "
        "%s vs %s | league=%s",
        matched_home,
        matched_away,
        league_code,
    )

    return predict_all_markets(
        home_team=matched_home,
        away_team=matched_away,
        team_params=team_params,
        elo_ratings=elo_ratings,
        home_advantage=home_advantage,
        league_avg_goals=league_avg_goals,
        elo_coefficient=elo_coefficient,
        max_goals=DEFAULT_MAX_GOALS,
    )


# ======================================================================
# MODEL INSPECTION
# ======================================================================

def inspect_model() -> Dict[str, Any]:

    models = load_models()

    leagues = models["leagues"]

    summary = {}

    total_teams = 0

    for league_code, league_data in leagues.items():

        teams = league_data[
            "teams"
        ]

        total_teams += len(
            teams
        )

        summary[league_code] = {
            "team_count": len(
                teams
            ),
            "avg_goals": league_data[
                "baseline"
            ]["avg_goals"],
            "home_advantage": league_data[
                "baseline"
            ]["home_advantage"],
            "elo_coefficient": league_data.get("elo_coefficient", 0.0),
            "sample_teams": list(
                teams.keys()
            )[:10],
        }

    return {
        "model_version": models.get(
            "model_info",
            {}
        ).get(
            "version",
            "UNKNOWN",
        ),
        "reference_date": REFERENCE_DATE,
        "league_count": len(
            leagues
        ),
        "total_team_parameters": total_teams,
        "leagues": summary,
        "calibration": {
            "btts": BTTS_CALIBRATION_MULTIPLIER,
            "over": OVER_CALIBRATION_MULTIPLIER,
        },
        "home_advantage_points": (
            EXPECTED_HOME_ADVANTAGE_POINTS
        ),
    }


# ======================================================================
# HEALTH CHECK
# ======================================================================

def model_health_check() -> Dict[str, Any]:

    try:

        inspection = inspect_model()

        return {
            "status": "ok",
            **inspection,
            "model_path": MODEL_DATA_PATH,
        }

    except Exception as exc:

        logger.exception(
            "❌ Model health check failed."
        )

        return {
            "status": "error",
            "model_version": MODEL_VERSION,
            "reference_date": REFERENCE_DATE,
            "error": str(exc),
            "model_path": MODEL_DATA_PATH,
        }


# ======================================================================
# CLI TEST
# ======================================================================

if __name__ == "__main__":

    logging.basicConfig(
        level=logging.INFO,
        format=(
            "%(asctime)s | "
            "%(levelname)s | "
            "%(name)s | "
            "%(message)s"
        ),
    )

    print("=" * 80)
    print("🔥 BASHIRI ML v2.0 - MODEL AUDIT")
    print("=" * 80)

    try:

        # ----------------------------------------------------------
        # 1. HEALTH
        # ----------------------------------------------------------

        health = model_health_check()

        print(
            json.dumps(
                health,
                indent=2,
                ensure_ascii=False,
            )
        )

        if health["status"] != "ok":

            raise RuntimeError(
                health["error"]
            )

        # ----------------------------------------------------------
        # 2. ELCHÉ / BARCELONA TEST
        # ----------------------------------------------------------

        print("\n")
        print("=" * 80)
        print("⚽ ELCHÉ vs FC BARCELONA TEST")
        print("=" * 80)

        # Try common LaLiga identifiers.
        available_leagues = (
            get_available_leagues()
        )

        print(
            f"Available leagues: "
            f"{available_leagues}"
        )

        laliga_code = None

        for code in available_leagues:

            normalized = str(
                code
            ).strip().lower()

            if normalized in {
                "laliga",
                "la liga",
                "laliga_ea",
                "laliga_santander",
                "espana",
                "spain",
            }:

                laliga_code = code
                break

        if laliga_code is None:

            print(
                "\n⚠️ LaLiga code haikupatikana "
                "automatically."
            )

            print(
                "Model loaded successfully, "
                "but Elche/Barcelona test skipped."
            )

        else:

            result = predict_fixture(
                laliga_code,
                "Elche",
                "Barcelona",
            )

            print(
                json.dumps(
                    result,
                    indent=2,
                    ensure_ascii=False,
                )
            )

        print("\n")
        print("=" * 80)
        print(
            "✅ BASHIRI ML v2.0 audit completed."
        )
        print("=" * 80)

    except Exception as exc:

        logger.exception(
            "❌ BASHIRI ML test failed."
        )

        print(
            "\n❌ ERROR:"
        )

        print(
            str(exc)
        )

        raise