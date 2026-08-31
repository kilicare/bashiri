"""
predictions/ml/poisson_model.py

========================================================================
BASHIRI ML — PRODUCTION POISSON INFERENCE ENGINE
========================================================================

CANONICAL PRODUCTION CONTRACT
-----------------------------

This module performs inference ONLY.

The production JSON artifact is the single source of truth:

    predictions/ml/data/BASHIRI_PRODUCTION_MODEL.json

IMPORTANT:

    This engine does NOT reconstruct:

        league_avg_goals
        attack
        defense
        home_advantage multipliers

    It does NOT use legacy calibration multipliers.

    It does NOT invent Elo formulas.

    It does NOT silently replace unknown teams.

    It does NOT silently substitute missing leagues.

    It does NOT train.

    It does NOT calibrate.

    It does NOT mutate the model artifact.

Canonical mathematical source:

    log(lambda) =
        Intercept
        + home * beta_home
        + team coefficient
        + opponent coefficient
        + elo_scaled * beta_elo

The coefficient vector stored in the production artifact is authoritative.

Markets are derived from the same adaptive Poisson score matrix:

    1X2
    BTTS
    Over/Under 0.5, 1.5, 2.5, 3.5, 4.5
    Draw No Bet
    Double Chance
    AI Pick

Calibration is intentionally disabled in production.

========================================================================
"""

from __future__ import annotations

import hashlib
import json
import logging
import math
import os
import unicodedata
from functools import lru_cache
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
from scipy.stats import poisson


# ======================================================================
# LOGGING
# ======================================================================

logger = logging.getLogger(__name__)


# ======================================================================
# PRODUCTION CONSTANTS
# ======================================================================

MODEL_FILE_NAME = "BASHIRI_PRODUCTION_MODEL.json"

MODEL_DATA_PATH = os.path.join(
    os.path.dirname(__file__),
    "data",
    MODEL_FILE_NAME,
)

EXPECTED_SCHEMA_VERSION = "4.0"

DEFAULT_SCORE_TAIL_TOLERANCE = 1e-10
DEFAULT_SCORE_MAX_GOALS = 100
DEFAULT_PROBABILITY_TOLERANCE = 1e-10

MIN_XG = 1e-12
MAX_XG = float(math.exp(50.0))


# ======================================================================
# TEAM ALIASES
#
# Aliases are ONLY input-name conveniences.
#
# They never create new model parameters.
# Resolution must end at an exact trained team contained in JSON.
# ======================================================================

TEAM_ALIASES = {
    "man city": "Manchester City FC",
    "manchester city": "Manchester City FC",

    "man utd": "Manchester United FC",
    "manchester utd": "Manchester United FC",
    "man united": "Manchester United FC",
    "manchester united": "Manchester United FC",

    "spurs": "Tottenham Hotspur FC",
    "tottenham": "Tottenham Hotspur FC",

    "real madrid": "Real Madrid CF",

    "barca": "FC Barcelona",
    "barcelona": "FC Barcelona",
    "fc barcelona": "FC Barcelona",

    "inter": "FC Internazionale Milano",
    "inter milan": "FC Internazionale Milano",

    "bayern": "FC Bayern München",
    "bayern munich": "FC Bayern München",
    "bayern münchen": "FC Bayern München",

    "dortmund": "Borussia Dortmund",

    "juve": "Juventus FC",
    "juventus": "Juventus FC",

    "ajax": "AFC Ajax",

    "psg": "Paris Saint-Germain FC",
    "paris sg": "Paris Saint-Germain FC",

    "west ham": "West Ham United FC",

    "newcastle": "Newcastle United FC",

    "wolves": "Wolverhampton Wanderers FC",
    "wolverhampton": "Wolverhampton Wanderers FC",

    "brighton": "Brighton & Hove Albion FC",
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

        result = float(value)

        if not np.isfinite(result):
            return default

        return result

    except (TypeError, ValueError):
        return default


def _require_finite_float(
    value: Any,
    name: str,
) -> float:
    result = _safe_float(value)

    if result is None:
        raise ValueError(
            f"❌ {name} must be a finite numeric value."
        )

    return result


def _normalize_team_name(
    name: Any,
) -> str:

    if name is None:
        return ""

    value = str(name).strip()

    value = unicodedata.normalize(
        "NFKC",
        value,
    )

    return " ".join(
        value.casefold().split()
    )


def _round_probability(
    probability: float,
) -> float:

    value = _require_finite_float(
        probability,
        "probability",
    )

    value = min(
        100.0,
        max(0.0, value),
    )

    return round(
        value,
        1,
    )


def _validate_probability(
    probability: float,
    name: str,
) -> float:

    value = _require_finite_float(
        probability,
        name,
    )

    tolerance = (
        DEFAULT_PROBABILITY_TOLERANCE
    )

    if (
        value < -tolerance
        or value > 1.0 + tolerance
    ):
        raise ValueError(
            f"❌ Invalid probability "
            f"{name}={value}"
        )

    return float(
        min(
            1.0,
            max(0.0, value),
        )
    )


# ======================================================================
# JSON SAFE / FINITE VALIDATION
# ======================================================================

def _assert_json_finite(
    obj: Any,
    path: str = "root",
) -> None:

    if isinstance(obj, dict):

        for key, value in obj.items():

            _assert_json_finite(
                value,
                f"{path}.{key}",
            )

    elif isinstance(obj, (list, tuple)):

        for index, value in enumerate(obj):

            _assert_json_finite(
                value,
                f"{path}[{index}]",
            )

    elif isinstance(obj, (float, np.floating)):

        if not np.isfinite(float(obj)):

            raise ValueError(
                f"❌ Non-finite JSON value at {path}"
            )


# ======================================================================
# MODEL STRUCTURE VALIDATION
# ======================================================================

def _validate_model_structure(
    artifact: Dict[str, Any],
) -> None:

    if not isinstance(
        artifact,
        dict,
    ):
        raise ValueError(
            "❌ Production JSON must be an object."
        )

    required_top_level = {
        "schema_version",
        "pipeline_version",
        "model_info",
        "elo",
        "time_decay",
        "calibration",
        "training_data",
        "leagues",
        "score_matrix",
        "market_contract",
        "api_contract",
        "reproducibility",
    }

    missing = (
        required_top_level
        - set(artifact.keys())
    )

    if missing:

        raise ValueError(
            "❌ Production artifact is missing "
            f"required keys: {sorted(missing)}"
        )

    schema_version = str(
        artifact["schema_version"]
    )

    if schema_version != EXPECTED_SCHEMA_VERSION:

        raise ValueError(
            "❌ Unsupported production artifact "
            f"schema_version={schema_version}. "
            f"Expected={EXPECTED_SCHEMA_VERSION}."
        )

    leagues = artifact["leagues"]

    if not isinstance(
        leagues,
        dict,
    ) or not leagues:

        raise ValueError(
            "❌ Production artifact contains "
            "no trained leagues."
        )

    # --------------------------------------------------------------
    # Validate each league.
    # --------------------------------------------------------------

    for competition, state in leagues.items():

        if not isinstance(
            state,
            dict,
        ):
            raise ValueError(
                f"❌ League '{competition}' "
                "has invalid state."
            )

        teams = state.get(
            "teams"
        )

        coefficients = state.get(
            "coefficients"
        )

        if not isinstance(
            teams,
            list,
        ) or not teams:

            raise ValueError(
                f"❌ League '{competition}' "
                "has no trained team list."
            )

        if not isinstance(
            coefficients,
            dict,
        ) or not coefficients:

            raise ValueError(
                f"❌ League '{competition}' "
                "has no coefficient vector."
            )

        if len(set(teams)) != len(teams):

            raise ValueError(
                f"❌ League '{competition}' "
                "contains duplicate team names."
            )

        # Every coefficient must be finite.
        for name, value in coefficients.items():

            numeric = _safe_float(value)

            if numeric is None:

                raise ValueError(
                    f"❌ Non-finite coefficient "
                    f"'{name}' in '{competition}'."
                )

        # Required canonical coefficients.
        if "Intercept" not in coefficients:

            raise ValueError(
                f"❌ League '{competition}' "
                "has no Intercept coefficient."
            )

        if "elo_scaled" not in coefficients:

            raise ValueError(
                f"❌ League '{competition}' "
                "has no elo_scaled coefficient."
            )

    # --------------------------------------------------------------
    # Elo.
    # --------------------------------------------------------------

    elo = artifact["elo"]

    if not isinstance(
        elo,
        dict,
    ):
        raise ValueError(
            "❌ artifact.elo must be an object."
        )

    scale = _safe_float(
        elo.get("scale")
    )

    if scale is None or scale <= 0:

        raise ValueError(
            "❌ artifact.elo.scale must be > 0."
        )

    ratings = elo.get(
        "ratings",
        {},
    )

    if not isinstance(
        ratings,
        dict,
    ):
        raise ValueError(
            "❌ artifact.elo.ratings must "
            "be an object."
        )

    for team, rating in ratings.items():

        numeric = _safe_float(
            rating
        )

        if numeric is None:

            raise ValueError(
                f"❌ Invalid Elo rating "
                f"for '{team}'."
            )

    # --------------------------------------------------------------
    # Score matrix configuration.
    # --------------------------------------------------------------

    score_config = artifact[
        "score_matrix"
    ]

    if not isinstance(
        score_config,
        dict,
    ):
        raise ValueError(
            "❌ score_matrix configuration "
            "must be an object."
        )

    tail_tol = _safe_float(
        score_config.get(
            "tail_probability_tolerance",
            DEFAULT_SCORE_TAIL_TOLERANCE,
        )
    )

    hard_cap = _safe_float(
        score_config.get(
            "hard_cap",
            DEFAULT_SCORE_MAX_GOALS,
        )
    )

    if (
        tail_tol is None
        or tail_tol <= 0
        or tail_tol >= 1
    ):
        raise ValueError(
            "❌ Invalid score-matrix "
            "tail_probability_tolerance."
        )

    if (
        hard_cap is None
        or hard_cap < 8
    ):
        raise ValueError(
            "❌ Invalid score-matrix hard_cap."
        )

    # --------------------------------------------------------------
    # Market contract validation.
    # --------------------------------------------------------------

    market_contract = artifact.get("market_contract")

    if not isinstance(
        market_contract,
        dict,
    ):
        raise ValueError(
            "❌ market_contract must be an object."
        )

    # Validate full_match markets
    full_match = market_contract.get("full_match", {})
    if not isinstance(full_match, dict):
        raise ValueError(
            "❌ market_contract.full_match must be an object."
        )

    # Validate full_match over_under_lines
    full_match_ou = full_match.get("over_under_lines", [])
    if not isinstance(full_match_ou, list):
        raise ValueError(
            "❌ market_contract.full_match.over_under_lines must be a list."
        )
    # Production contract specifies only 1.5 and 2.5
    expected_full_ou = {1.5, 2.5}
    actual_full_ou = set(full_match_ou)
    if actual_full_ou != expected_full_ou:
        raise ValueError(
            f"❌ market_contract.full_match.over_under_lines must be {expected_full_ou}, got {actual_full_ou}"
        )

    # Validate home_team_goals markets
    home_goals = market_contract.get("home_team_goals", {})
    if not isinstance(home_goals, dict):
        raise ValueError(
            "❌ market_contract.home_team_goals must be an object."
        )

    home_goals_ou = home_goals.get("over_under_lines", [])
    if not isinstance(home_goals_ou, list):
        raise ValueError(
            "❌ market_contract.home_team_goals.over_under_lines must be a list."
        )
    # Production contract specifies 0.5, 1.5, 2.5
    expected_home_ou = {0.5, 1.5, 2.5}
    actual_home_ou = set(home_goals_ou)
    if actual_home_ou != expected_home_ou:
        raise ValueError(
            f"❌ market_contract.home_team_goals.over_under_lines must be {expected_home_ou}, got {actual_home_ou}"
        )

    # Validate away_team_goals markets
    away_goals = market_contract.get("away_team_goals", {})
    if not isinstance(away_goals, dict):
        raise ValueError(
            "❌ market_contract.away_team_goals must be an object."
        )

    away_goals_ou = away_goals.get("over_under_lines", [])
    if not isinstance(away_goals_ou, list):
        raise ValueError(
            "❌ market_contract.away_team_goals.over_under_lines must be a list."
        )
    expected_away_ou = {0.5, 1.5, 2.5}
    actual_away_ou = set(away_goals_ou)
    if actual_away_ou != expected_away_ou:
        raise ValueError(
            f"❌ market_contract.away_team_goals.over_under_lines must be {expected_away_ou}, got {actual_away_ou}"
        )

    # Validate correct_score configuration
    correct_score = market_contract.get("correct_score", {})
    if not isinstance(correct_score, dict):
        raise ValueError(
            "❌ market_contract.correct_score must be an object."
        )

    cs_source = correct_score.get("source")
    if cs_source != "adaptive_poisson_score_matrix":
        raise ValueError(
            f"❌ market_contract.correct_score.source must be 'adaptive_poisson_score_matrix', got '{cs_source}'"
        )

    cs_top_n = correct_score.get("top_n_default")
    if not isinstance(cs_top_n, int) or cs_top_n <= 0:
        raise ValueError(
            f"❌ market_contract.correct_score.top_n_default must be a positive integer, got {cs_top_n}"
        )

    # --------------------------------------------------------------
    # Calibration must be fail-closed.
    # --------------------------------------------------------------

    calibration = artifact[
        "calibration"
    ]

    if not isinstance(
        calibration,
        dict,
    ):
        raise ValueError(
            "❌ calibration metadata invalid."
        )

    if calibration.get(
        "production_enabled"
    ) is not False:

        raise ValueError(
            "❌ Production calibration must "
            "remain disabled/fail-closed."
        )


# ======================================================================
# MODEL LOADING
# ======================================================================

@lru_cache(maxsize=1)
def load_models() -> Dict[str, Any]:

    if not os.path.exists(
        MODEL_DATA_PATH
    ):

        raise FileNotFoundError(
            "\n"
            "❌ BASHIRI production artifact "
            "haipo.\n\n"
            f"Expected path:\n"
            f"{MODEL_DATA_PATH}\n"
        )

    try:

        with open(
            MODEL_DATA_PATH,
            "r",
            encoding="utf-8",
        ) as model_file:

            artifact = json.load(
                model_file
            )

    except json.JSONDecodeError as exc:

        raise ValueError(
            "❌ Production JSON imeharibika: "
            f"{exc}"
        ) from exc

    except OSError as exc:

        raise OSError(
            "❌ Production JSON "
            f"imeshindwa kusomwa: {exc}"
        ) from exc

    _assert_json_finite(
        artifact
    )

    _validate_model_structure(
        artifact
    )

    logger.info(
        "✅ Loaded BASHIRI production artifact "
        "schema=%s pipeline=%s",
        artifact["schema_version"],
        artifact["pipeline_version"],
    )

    logger.info(
        "📦 Production leagues=%d",
        len(artifact["leagues"]),
    )

    return artifact


def reload_models() -> Dict[str, Any]:

    load_models.cache_clear()

    logger.info(
        "🔄 Production artifact cache cleared."
    )

    return load_models()


# ======================================================================
# MODEL FINGERPRINT
# ======================================================================

def get_model_fingerprint() -> str:

    artifact = load_models()

    canonical = json.dumps(
        artifact,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    )

    return hashlib.sha256(
        canonical.encode("utf-8")
    ).hexdigest()


# ======================================================================
# LEAGUES
# ======================================================================

def get_available_leagues() -> List[str]:

    artifact = load_models()

    return list(
        artifact["leagues"].keys()
    )


def get_league_state(
    league_code: str,
) -> Dict[str, Any]:

    if not league_code:

        raise ValueError(
            "❌ competition haijawekwa."
        )

    artifact = load_models()

    requested = str(
        league_code
    ).strip()

    if requested in artifact["leagues"]:

        return artifact[
            "leagues"
        ][requested]

    requested_cf = requested.casefold()

    for code, state in artifact[
        "leagues"
    ].items():

        if str(code).casefold() == requested_cf:

            return state

    raise ValueError(
        "\n"
        f"❌ Competition '{league_code}' "
        "haipo kwenye production artifact.\n"
        f"Available competitions: "
        f"{get_available_leagues()}\n"
    )


# ======================================================================
# TEAM RESOLUTION
# ======================================================================

def resolve_team(
    team_name: str,
    available_teams: List[str],
) -> str:

    if not team_name:

        raise ValueError(
            "❌ Team name haiwezi kuwa empty."
        )

    if team_name in available_teams:

        return team_name

    normalized = _normalize_team_name(
        team_name
    )

    normalized_map = {
        _normalize_team_name(name): name
        for name in available_teams
    }

    # --------------------------------------------------------------
    # Exact case-insensitive match.
    # --------------------------------------------------------------

    if normalized in normalized_map:

        return normalized_map[
            normalized
        ]

    # --------------------------------------------------------------
    # Alias.
    # --------------------------------------------------------------

    alias_target = TEAM_ALIASES.get(
        normalized
    )

    if alias_target:

        alias_normalized = (
            _normalize_team_name(
                alias_target
            )
        )

        if alias_normalized in normalized_map:

            return normalized_map[
                alias_normalized
            ]

    # --------------------------------------------------------------
    # IMPORTANT:
    #
    # No fuzzy matching.
    #
    # A production prediction must never silently convert:
    #
    #   Team A -> Team B
    #
    # because they happen to look similar.
    # --------------------------------------------------------------

    raise ValueError(
        "\n"
        f"❌ Team '{team_name}' "
        "haipo kwenye trained production state.\n"
        f"Available teams: {available_teams}\n"
    )


# ======================================================================
# COEFFICIENT ACCESS
# ======================================================================

def _coefficient(
    coefficients: Dict[str, Any],
    name: str,
) -> float:

    value = _safe_float(
        coefficients.get(name)
    )

    if value is None:

        raise ValueError(
            f"❌ Required coefficient "
            f"'{name}' is missing/non-finite."
        )

    return value


def _team_coefficient(
    coefficients: Dict[str, Any],
    team: str,
) -> float:

    key = f"C(team)[T.{team}]"

    return _coefficient(
        coefficients,
        key,
    ) if key in coefficients else 0.0


def _opponent_coefficient(
    coefficients: Dict[str, Any],
    opponent: str,
) -> float:

    key = (
        f"C(opponent)[T.{opponent}]"
    )

    return _coefficient(
        coefficients,
        key,
    ) if key in coefficients else 0.0


# ======================================================================
# EXACT LINEAR PREDICTOR
# ======================================================================

def _linear_predictor(
    state: Dict[str, Any],
    team: str,
    opponent: str,
    home_indicator: float,
    elo_scaled: float,
) -> float:

    if team == opponent:

        raise ValueError(
            "❌ Team and opponent cannot be identical."
        )

    teams = set(
        state["teams"]
    )

    if (
        team not in teams
        or opponent not in teams
    ):

        raise KeyError(
            f"❌ Unknown team: "
            f"{team} vs {opponent}"
        )

    coefficients = state[
        "coefficients"
    ]

    intercept = _coefficient(
        coefficients,
        "Intercept",
    )

    home_beta = _coefficient(
        coefficients,
        "home",
    )

    elo_beta = _coefficient(
        coefficients,
        "elo_scaled",
    )

    team_beta = _team_coefficient(
        coefficients,
        team,
    )

    opponent_beta = (
        _opponent_coefficient(
            coefficients,
            opponent,
        )
    )

    eta = (
        intercept
        + float(home_indicator) * home_beta
        + team_beta
        + opponent_beta
        + float(elo_scaled) * elo_beta
    )

    if not np.isfinite(eta):

        raise FloatingPointError(
            "❌ Non-finite linear predictor."
        )

    return float(eta)


# ======================================================================
# EXACT xG
# ======================================================================

def _exact_xg(
    state: Dict[str, Any],
    home_team: str,
    away_team: str,
    elo_scaled: float,
    neutral_venue: bool = False,
) -> Tuple[float, float]:

    if home_team == away_team:

        raise ValueError(
            "❌ Home team and away team "
            "cannot be identical."
        )

    # --------------------------------------------------------------
    # EXACT notebook behavior:
    #
    # normal fixture:
    #
    # home indicator = 1
    #
    # neutral fixture:
    #
    # home indicator = 0
    #
    # Away side always receives home=0.
    # --------------------------------------------------------------

    home_eta = _linear_predictor(
        state=state,
        team=home_team,
        opponent=away_team,
        home_indicator=(
            0.0
            if bool(neutral_venue)
            else 1.0
        ),
        elo_scaled=float(
            elo_scaled
        ),
    )

    away_eta = _linear_predictor(
        state=state,
        team=away_team,
        opponent=home_team,
        home_indicator=0.0,
        elo_scaled=-float(
            elo_scaled
        ),
    )

    home_xg = float(
        np.exp(
            np.clip(
                home_eta,
                -50.0,
                50.0,
            )
        )
    )

    away_xg = float(
        np.exp(
            np.clip(
                away_eta,
                -50.0,
                50.0,
            )
        )
    )

    if (
        not np.isfinite(home_xg)
        or not np.isfinite(away_xg)
        or home_xg <= 0
        or away_xg <= 0
    ):

        raise FloatingPointError(
            "❌ Non-finite/non-positive xG."
        )

    return (
        home_xg,
        away_xg,
    )


# ======================================================================
# ADAPTIVE POISSON SUPPORT
# ======================================================================

def _poisson_support(
    mu: float,
    tail_tolerance: float,
    hard_cap: int,
) -> int:

    mu = _require_finite_float(
        mu,
        "Poisson mean",
    )

    if mu <= 0:

        raise ValueError(
            f"❌ Invalid Poisson mean={mu}"
        )

    tail_tolerance = (
        _require_finite_float(
            tail_tolerance,
            "tail_tolerance",
        )
    )

    if not (
        0 < tail_tolerance < 1
    ):

        raise ValueError(
            "❌ tail_tolerance must "
            "be between 0 and 1."
        )

    hard_cap = int(
        hard_cap
    )

    if hard_cap < 8:

        raise ValueError(
            "❌ hard_cap must be >= 8."
        )

    quantile = poisson.ppf(
        1.0 - tail_tolerance,
        mu,
    )

    if not np.isfinite(
        quantile
    ):

        raise FloatingPointError(
            "❌ Unable to determine finite "
            "Poisson support."
        )

    n = int(
        quantile
    )

    if n >= hard_cap:

        raise FloatingPointError(
            "\n"
            "❌ Required Poisson support "
            f"({n}) reached hard cap "
            f"({hard_cap}).\n"
            "Increase score_matrix.hard_cap "
            "in the trained artifact instead "
            "of silently truncating probability."
        )

    return max(
        8,
        n,
    )


# ======================================================================
# SCORE MATRIX
# ======================================================================

def _score_matrix(
    home_xg: float,
    away_xg: float,
) -> np.ndarray:

    artifact = load_models()

    score_config = artifact[
        "score_matrix"
    ]

    tail_tolerance = float(
        score_config.get(
            "tail_probability_tolerance",
            DEFAULT_SCORE_TAIL_TOLERANCE,
        )
    )

    hard_cap = int(
        score_config.get(
            "hard_cap",
            DEFAULT_SCORE_MAX_GOALS,
        )
    )

    home_support = _poisson_support(
        home_xg,
        tail_tolerance,
        hard_cap,
    )

    away_support = _poisson_support(
        away_xg,
        tail_tolerance,
        hard_cap,
    )

    n = max(
        home_support,
        away_support,
    )

    home_probs = poisson.pmf(
        np.arange(n + 1),
        home_xg,
    )

    away_probs = poisson.pmf(
        np.arange(n + 1),
        away_xg,
    )

    matrix = np.outer(
        home_probs,
        away_probs,
    )

    mass = float(
        matrix.sum()
    )

    if (
        not np.isfinite(mass)
        or mass <= 0
    ):

        raise FloatingPointError(
            "❌ Invalid score-matrix mass."
        )

    # --------------------------------------------------------------
    # Exact notebook behavior:
    #
    # Only omitted Poisson tail is renormalized.
    # --------------------------------------------------------------

    matrix = matrix / mass

    if abs(
        float(matrix.sum()) - 1.0
    ) > 1e-12:

        raise FloatingPointError(
            "❌ Score matrix failed mass check."
        )

    return matrix


# ======================================================================
# ELO
# ======================================================================

def get_elo_ratings() -> Dict[str, float]:

    artifact = load_models()

    return {
        str(team): float(rating)
        for team, rating
        in artifact["elo"].get(
            "ratings",
            {},
        ).items()
    }


def get_elo_scale() -> float:

    artifact = load_models()

    scale = _safe_float(
        artifact["elo"].get(
            "scale"
        )
    )

    if (
        scale is None
        or scale <= 0
    ):

        raise ValueError(
            "❌ Invalid Elo scale."
        )

    return float(scale)


def compute_elo_scaled(
    home_team: str,
    away_team: str,
) -> float:

    ratings = get_elo_ratings()
    scale = get_elo_scale()

    if home_team not in ratings:

        raise KeyError(
            f"❌ No production Elo rating "
            f"for home team '{home_team}'."
        )

    if away_team not in ratings:

        raise KeyError(
            f"❌ No production Elo rating "
            f"for away team '{away_team}'."
        )

    elo_difference = (
        float(ratings[home_team])
        - float(ratings[away_team])
    )

    return float(
        elo_difference / scale
    )


# ======================================================================
# EXACT MARKET ENGINE
# ======================================================================

def _predict_from_resolved_teams(
    competition: str,
    home_team: str,
    away_team: str,
    elo_scaled: float,
    neutral_venue: bool = False,
) -> Dict[str, Any]:

    artifact = load_models()

    state = artifact[
        "leagues"
    ][competition]

    home_xg, away_xg = _exact_xg(
        state=state,
        home_team=home_team,
        away_team=away_team,
        elo_scaled=elo_scaled,
        neutral_venue=neutral_venue,
    )

    matrix = _score_matrix(
        home_xg,
        away_xg,
    )

    # Calculate goal distributions from matrix marginals for consistency
    # This ensures all markets derive from the same adaptive score matrix
    home_goal_dist = matrix.sum(axis=1)  # Sum over away goals
    away_goal_dist = matrix.sum(axis=0)  # Sum over home goals

    # Get market contract configuration from artifact
    full_match_ou_lines = artifact.get(
        'market_contract', {}
    ).get(
        'full_match', {}
    ).get(
        'over_under_lines', [1.5, 2.5]
    )
    
    home_goals_lines = artifact.get(
        'market_contract', {}
    ).get(
        'home_team_goals', {}
    ).get(
        'over_under_lines', [0.5, 1.5, 2.5]
    )
    
    away_goals_lines = artifact.get(
        'market_contract', {}
    ).get(
        'away_team_goals', {}
    ).get(
        'over_under_lines', [0.5, 1.5, 2.5]
    )
    
    correct_score_top_n = artifact.get(
        'market_contract', {}
    ).get(
        'correct_score', {}
    ).get(
        'top_n_default', 10
    )

    # --------------------------------------------------------------
    # 1X2
    # --------------------------------------------------------------

    p_home = _validate_probability(
        float(
            np.tril(
                matrix,
                -1,
            ).sum()
        ),
        "1X2 home",
    )

    p_draw = _validate_probability(
        float(
            np.trace(matrix)
        ),
        "1X2 draw",
    )

    p_away = _validate_probability(
        float(
            np.triu(
                matrix,
                1,
            ).sum()
        ),
        "1X2 away",
    )

    # --------------------------------------------------------------
    # BTTS
    # --------------------------------------------------------------

    p_btts = _validate_probability(
        float(
            matrix[1:, 1:].sum()
        ),
        "BTTS yes",
    )

    p_btts_no = (
        1.0 - p_btts
    )

    # --------------------------------------------------------------
    # OVER / UNDER (from market_contract)
    # --------------------------------------------------------------

    totals = np.add.outer(
        np.arange(
            matrix.shape[0]
        ),
        np.arange(
            matrix.shape[1]
        ),
    )

    over_under = {}

    for line in full_match_ou_lines:

        over = _validate_probability(
            float(
                matrix[
                    totals > line
                ].sum()
            ),
            f"over_{line}",
        )

        key = str(
            line
        ).replace(
            ".",
            "_",
        )

        over_under[
            f"over_{key}"
        ] = over

        over_under[
            f"under_{key}"
        ] = (
            1.0 - over
        )

    # --------------------------------------------------------------
    # DNB
    # --------------------------------------------------------------

    dnb_denominator = (
        p_home
        + p_away
    )

    if dnb_denominator <= 0:

        raise FloatingPointError(
            "❌ Invalid DNB denominator."
        )

    dnb_home = (
        p_home
        / dnb_denominator
    )

    dnb_away = (
        p_away
        / dnb_denominator
    )

    # --------------------------------------------------------------
    # HOME TEAM GOALS (per production JSON market_contract)
    # --------------------------------------------------------------

    home_goals = {}

    for line in home_goals_lines:
        # For Over X.5, we need goals >= (X + 1)
        # Over 0.5 -> goals >= 1
        # Over 1.5 -> goals >= 2
        # Over 2.5 -> goals >= 3
        min_goals = int(line) + 1
        over = _validate_probability(
            float(
                home_goal_dist[min_goals:].sum()
            ),
            f"home_over_{line}",
        )

        key = str(line).replace(".", "_")

        home_goals[f"home_over_{key}"] = over
        home_goals[f"home_under_{key}"] = 1.0 - over

    # --------------------------------------------------------------
    # AWAY TEAM GOALS (per production JSON market_contract)
    # --------------------------------------------------------------

    away_goals = {}

    for line in away_goals_lines:
        # For Over X.5, we need goals >= (X + 1)
        min_goals = int(line) + 1
        over = _validate_probability(
            float(
                away_goal_dist[min_goals:].sum()
            ),
            f"away_over_{line}",
        )

        key = str(line).replace(".", "_")

        away_goals[f"away_over_{key}"] = over
        away_goals[f"away_under_{key}"] = 1.0 - over

    # --------------------------------------------------------------
    # CORRECT SCORE (per production JSON market_contract)
    # --------------------------------------------------------------

    def _get_top_correct_scores(score_matrix: np.ndarray, top_n: int = 10) -> Dict[str, Any]:
        """
        Extract top N correct scores from the adaptive Poisson score matrix.
        
        The probability for each score (i-j) comes directly from matrix[i, j].
        Scores are sorted by probability descending, with deterministic tie-breaking.
        
        Args:
            score_matrix: The adaptive Poisson score matrix
            top_n: Number of top scores to return (from market_contract)
            
        Returns:
            Dict with source, top_n, and list of ranked predictions
        """
        # Find all non-zero probability scores
        n_goals = score_matrix.shape[0]
        scores = []
        
        for home_goals in range(n_goals):
            for away_goals in range(n_goals):
                prob = score_matrix[home_goals, away_goals]
                if prob > 0:
                    scores.append({
                        'home_goals': home_goals,
                        'away_goals': away_goals,
                        'score': f"{home_goals}-{away_goals}",
                        'probability': prob
                    })
        
        # Sort by probability descending, then by home goals ascending, then away goals ascending
        # for deterministic tie-breaking
        scores.sort(key=lambda x: (-x['probability'], x['home_goals'], x['away_goals']))
        
        # Take top N
        top_scores = scores[:top_n]
        
        # Format output with ranks and percentages
        predictions = []
        for rank, score in enumerate(top_scores, start=1):
            predictions.append({
                'rank': rank,
                'home_goals': score['home_goals'],
                'away_goals': score['away_goals'],
                'score': score['score'],
                'probability': float(score['probability']),
                'probability_percent': _round_probability(score['probability'] * 100.0)
            })
        
        return {
            'source': 'adaptive_poisson_score_matrix',
            'top_n': top_n,
            'predictions': predictions
        }
    
    correct_score = _get_top_correct_scores(matrix, top_n=correct_score_top_n)

    # --------------------------------------------------------------
    # DOUBLE CHANCE
    # --------------------------------------------------------------

    double_chance = {
        "1x": p_home + p_draw,
        "x2": p_draw + p_away,
        "12": p_home + p_away,
    }

    # --------------------------------------------------------------
    # AI PICK
    # --------------------------------------------------------------

    selections = (
        ("Home", p_home),
        ("Draw", p_draw),
        ("Away", p_away),
    )

    best_selection = max(
        selections,
        key=lambda item: item[1],
    )

    # --------------------------------------------------------------
    # INTEGRITY
    # --------------------------------------------------------------

    if abs(
        (
            p_home
            + p_draw
            + p_away
        )
        - 1.0
    ) > 1e-10:

        raise AssertionError(
            "❌ 1X2 probabilities "
            "do not sum to one."
        )

    if abs(
        p_btts
        + p_btts_no
        - 1.0
    ) > 1e-10:

        raise AssertionError(
            "❌ BTTS probabilities "
            "do not sum to one."
        )

    # Validate O/U pairs from market_contract
    full_match_ou_lines = artifact.get(
        'market_contract', {}
    ).get(
        'full_match', {}
    ).get(
        'over_under_lines', [1.5, 2.5]
    )

    for line in full_match_ou_lines:

        key = str(
            line
        ).replace(
            ".",
            "_",
        )

        if abs(
            over_under[
                f"over_{key}"
            ]
            + over_under[
                f"under_{key}"
            ]
            - 1.0
        ) > 1e-10:

            raise AssertionError(
                f"❌ O/U integrity failed "
                f"for line={line}."
            )

    # --------------------------------------------------------------
    # MODEL METADATA
    # --------------------------------------------------------------

    model_info = artifact.get(
        "model_info",
        {},
    )

    return {
        "model_version": model_info.get(
            "version",
            artifact.get(
                "pipeline_version"
            ),
        ),

        "pipeline_version": artifact.get(
            "pipeline_version"
        ),

        "schema_version": artifact.get(
            "schema_version"
        ),

        "fixture": {
            "competition": competition,
            "home_team": home_team,
            "away_team": away_team,
            "neutral_venue": bool(
                neutral_venue
            ),
        },

        "elo": {
            "elo_scaled": float(
                elo_scaled
            ),
            "home_rating": get_elo_ratings().get(
                home_team
            ),
            "away_rating": get_elo_ratings().get(
                away_team
            ),
            "scale": get_elo_scale(),
        },

        "expected_goals": {
            "home_xg": round(
                home_xg,
                6,
            ),
            "away_xg": round(
                away_xg,
                6,
            ),
            "total_xg": round(
                home_xg + away_xg,
                6,
            ),
        },

        "match_result": {
            "home_win": _round_probability(
                p_home * 100.0
            ),
            "draw": _round_probability(
                p_draw * 100.0
            ),
            "away_win": _round_probability(
                p_away * 100.0
            ),
        },

        "draw_no_bet": {
            "home_dnb": _round_probability(
                dnb_home * 100.0
            ),
            "away_dnb": _round_probability(
                dnb_away * 100.0
            ),
        },

        "double_chance": {
            key: _round_probability(
                value * 100.0
            )
            for key, value
            in double_chance.items()
        },

        "btts": {
            "btts_yes": _round_probability(
                p_btts * 100.0
            ),
            "btts_no": _round_probability(
                p_btts_no * 100.0
            ),
        },

        "over_under": {
            key: _round_probability(
                value * 100.0
            )
            for key, value
            in over_under.items()
        },

        "home_goals": {
            key: _round_probability(
                value * 100.0
            )
            for key, value
            in home_goals.items()
        },

        "away_goals": {
            key: _round_probability(
                value * 100.0
            )
            for key, value
            in away_goals.items()
        },

        "correct_score": correct_score,

        "ai_pick": {
            "market": "1X2",
            "selection": best_selection[0],
            "confidence": _round_probability(
                best_selection[1] * 100.0
            ),
        },

        "production": {
            "calibration_enabled": False,
            "dixon_coles": False,
            "prediction_source": (
                "exact_fitted_coefficient_vector"
            ),
            "model_fingerprint": (
                get_model_fingerprint()
            ),
        },
    }


# ======================================================================
# PUBLIC PREDICTION API
# ======================================================================

def predict_fixture(
    league_code: str,
    home_team: str,
    away_team: str,
    *,
    elo_scaled: Optional[float] = None,
    neutral_venue: bool = False,
) -> Dict[str, Any]:

    if not league_code:

        raise ValueError(
            "❌ competition haijawekwa."
        )

    if not home_team:

        raise ValueError(
            "❌ home_team haijawekwa."
        )

    if not away_team:

        raise ValueError(
            "❌ away_team haijawekwa."
        )

    if home_team == away_team:

        raise ValueError(
            "❌ Home na away team "
            "haziwezi kuwa sawa."
        )

    # --------------------------------------------------------------
    # Load exact production league.
    # --------------------------------------------------------------

    state = get_league_state(
        league_code
    )

    competition = next(
        code
        for code, value
        in load_models()["leagues"].items()
        if value is state
    )

    available_teams = list(
        state["teams"]
    )

    matched_home = resolve_team(
        home_team,
        available_teams,
    )

    matched_away = resolve_team(
        away_team,
        available_teams,
    )

    if matched_home == matched_away:

        raise ValueError(
            f"❌ Both fixtures resolved "
            f"to '{matched_home}'."
        )

    # --------------------------------------------------------------
    # Elo:
    #
    # If caller supplies a historical/pre-match value, use it.
    #
    # Otherwise compute from the production artifact's stored Elo
    # state.
    # --------------------------------------------------------------

    if elo_scaled is None:

        elo_value = compute_elo_scaled(
            matched_home,
            matched_away,
        )

        elo_source = (
            "production_artifact_elo_ratings"
        )

    else:

        elo_value = (
            _require_finite_float(
                elo_scaled,
                "elo_scaled",
            )
        )

        elo_source = (
            "explicit_pre_match_elo_scaled"
        )

    result = _predict_from_resolved_teams(
        competition=competition,
        home_team=matched_home,
        away_team=matched_away,
        elo_scaled=elo_value,
        neutral_venue=bool(
            neutral_venue
        ),
    )

    result["elo"][
        "source"
    ] = elo_source

    return result


# ======================================================================
# OPTIONAL HISTORICAL / EXTERNAL ELO API
# ======================================================================

def predict_fixture_with_elo(
    league_code: str,
    home_team: str,
    away_team: str,
    elo_scaled: float,
    *,
    neutral_venue: bool = False,
) -> Dict[str, Any]:

    """
    Explicit historical/pre-match inference.

    This is useful when another trusted layer has already calculated
    the correct pre-match Elo state for a historical fixture.

    No recalculation or modification is performed here.
    """

    return predict_fixture(
        league_code=league_code,
        home_team=home_team,
        away_team=away_team,
        elo_scaled=elo_scaled,
        neutral_venue=neutral_venue,
    )


# ======================================================================
# MODEL INSPECTION
# ======================================================================

def inspect_model() -> Dict[str, Any]:

    artifact = load_models()

    leagues_summary = {}

    total_teams = 0

    for competition, state in sorted(
        artifact["leagues"].items()
    ):

        teams = list(
            state["teams"]
        )

        coefficients = state[
            "coefficients"
        ]

        total_teams += len(
            teams
        )

        leagues_summary[
            competition
        ] = {
            "team_count": len(
                teams
            ),
            "coefficient_count": len(
                coefficients
            ),
            "teams": teams,
            "has_intercept": (
                "Intercept"
                in coefficients
            ),
            "has_home_coefficient": (
                "home"
                in coefficients
            ),
            "has_elo_coefficient": (
                "elo_scaled"
                in coefficients
            ),
        }

    return {
        "status": "ok",
        "schema_version": artifact.get(
            "schema_version"
        ),
        "pipeline_version": artifact.get(
            "pipeline_version"
        ),
        "artifact_status": artifact.get(
            "artifact_status"
        ),
        "league_count": len(
            artifact["leagues"]
        ),
        "total_team_parameters": (
            total_teams
        ),
        "leagues": leagues_summary,
        "elo": {
            "scale": artifact[
                "elo"
            ].get(
                "scale"
            ),
            "rating_count": len(
                artifact[
                    "elo"
                ].get(
                    "ratings",
                    {},
                )
            ),
        },
        "score_matrix": artifact[
            "score_matrix"
        ],
        "calibration": artifact[
            "calibration"
        ],
        "model_fingerprint": (
            get_model_fingerprint()
        ),
    }


# ======================================================================
# HEALTH CHECK
# ======================================================================

def model_health_check() -> Dict[str, Any]:

    try:

        inspection = inspect_model()

        return {
            **inspection,
            "status": "ok",
            "model_path": MODEL_DATA_PATH,
        }

    except Exception as exc:

        logger.exception(
            "❌ BASHIRI production model "
            "health check failed."
        )

        return {
            "status": "error",
            "model_version": (
                "UNKNOWN"
            ),
            "error": str(exc),
            "model_path": MODEL_DATA_PATH,
        }


# ======================================================================
# PRODUCTION SELF TEST
# ======================================================================

def _run_integrity_test() -> None:

    artifact = load_models()

    if not artifact[
        "leagues"
    ]:

        raise RuntimeError(
            "❌ No production leagues."
        )

    for competition, state in (
        artifact["leagues"].items()
    ):

        teams = list(
            state["teams"]
        )

        if len(teams) < 2:

            continue

        home_team = teams[0]
        away_team = teams[-1]

        if home_team == away_team:

            continue

        # Test zero Elo state.
        result = _predict_from_resolved_teams(
            competition=competition,
            home_team=home_team,
            away_team=away_team,
            elo_scaled=0.0,
            neutral_venue=False,
        )

        match_result = result[
            "match_result"
        ]

        total_1x2 = (
            match_result["home_win"]
            + match_result["draw"]
            + match_result["away_win"]
        )

        # Rounded output is intentionally allowed
        # to sum to 99.9/100.1 at display precision.
        if not (
            99.8
            <= total_1x2
            <= 100.2
        ):

            raise AssertionError(
                f"❌ Display 1X2 integrity "
                f"failed for {competition}: "
                f"{total_1x2}"
            )

        btts = result[
            "btts"
        ]

        btts_total = (
            btts["btts_yes"]
            + btts["btts_no"]
        )

        if not (
            99.8
            <= btts_total
            <= 100.2
        ):

            raise AssertionError(
                f"❌ Display BTTS integrity "
                f"failed for {competition}: "
                f"{btts_total}"
            )

        break

    logger.info(
        "✅ Production self-test passed."
    )


# ======================================================================
# CLI
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
    print(
        "🔥 BASHIRI ML — PRODUCTION "
        "POISSON ENGINE AUDIT"
    )
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
        # 2. SELF TEST
        # ----------------------------------------------------------

        _run_integrity_test()

        # ----------------------------------------------------------
        # 3. TEST ONE FIXTURE
        # ----------------------------------------------------------

        available = (
            get_available_leagues()
        )

        laliga = None

        for code in available:

            if str(
                code
            ).casefold() in {
                "laliga",
                "la liga",
                "laliga_ea",
                "laliga santander",
            }:

                laliga = code
                break

        if laliga:

            teams = list(
                get_league_state(
                    laliga
                )["teams"]
            )

            if len(teams) >= 2:

                print("\n")
                print("=" * 80)
                print(
                    f"⚽ PRODUCTION TEST: "
                    f"{teams[0]} vs {teams[-1]}"
                )
                print("=" * 80)

                prediction = predict_fixture(
                    laliga,
                    teams[0],
                    teams[-1],
                )

                print(
                    json.dumps(
                        prediction,
                        indent=2,
                        ensure_ascii=False,
                    )
                )

        print("\n")
        print("=" * 80)
        print(
            "✅ BASHIRI ML PRODUCTION "
            "ENGINE AUDIT PASSED"
        )
        print("=" * 80)

    except Exception as exc:

        logger.exception(
            "❌ BASHIRI production engine "
            "audit failed."
        )

        print(
            "\n❌ ERROR:"
        )

        print(
            str(exc)
        )

        raise