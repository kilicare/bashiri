"""
predictions/services.py

Business logic ya AI Prediction Dashboard — masoko yote, is_locked
imewekwa server-side (sio blur ya frontend pekee), na form/H2H kwa
MatchOverview.
"""
from django.conf import settings

from .ml.poisson_model import predict_fixture

MARKET_DEFINITIONS = {
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
    "OVER_UNDER_0_5": {"label": "Over/Under 0.5", "source_key": "over_under", "options": [
        {"key": "over_0_5", "label": "Over 0.5"}, {"key": "under_0_5", "label": "Under 0.5"},
    ]},
    "OVER_UNDER_1_5": {"label": "Over/Under 1.5", "source_key": "over_under", "options": [
        {"key": "over_1_5", "label": "Over 1.5"}, {"key": "under_1_5", "label": "Under 1.5"},
    ]},
    "OVER_UNDER_2_5": {"label": "Over/Under 2.5", "source_key": "over_under", "options": [
        {"key": "over_2_5", "label": "Over 2.5"}, {"key": "under_2_5", "label": "Under 2.5"},
    ]},
    "OVER_UNDER_3_5": {"label": "Over/Under 3.5", "source_key": "over_under", "options": [
        {"key": "over_3_5", "label": "Over 3.5"}, {"key": "under_3_5", "label": "Under 3.5"},
    ]},
    "OVER_UNDER_4_5": {"label": "Over/Under 4.5", "source_key": "over_under", "options": [
        {"key": "over_4_5", "label": "Over 4.5"}, {"key": "under_4_5", "label": "Under 4.5"},
    ]},
    "BTTS": {"label": "Timu Zote Kufunga (BTTS)", "source_key": "btts", "options": [
        {"key": "yes", "label": "Ndiyo"}, {"key": "no", "label": "Hapana"},
    ]},
}

MODEL_VERSION = "bashiri-ml-v4.0"


class UnknownTeamError(Exception):
    pass


def compute_global_top_pick(prediction: dict) -> dict:
    """
    Inatafuta chaguo LENYE UHAKIKA MKUBWA ZAIDI KATI YA MASOKO YOTE 9
    (si 1X2 pekee) — hii ndiyo 'AI Pick ya kweli', tofauti na
    prediction['ai_pick'] (poisson_model.py) ambayo imefungwa 1X2 kwa
    matumizi ya ndani ya model pelee.
    
    NEW LOGIC: Market-Specific Thresholds with Historical Accuracy
    - Kila soko ina threshold yake (kulingana na historical accuracy)
    - Chagua soko lenye highest confidence KATI YA MASOKO YANAYOKIDHI THRESHOLD
    - Kama hakuna soko linakidhi threshold → return NULL (hakuna recommendation)
    - Hii haitumii mock odds - data halisi tu
    """
    # Market-specific thresholds based on historical accuracy
    MARKET_THRESHOLDS = {
        "1X2": 65.0,           # Model accuracy ~70%
        "BTTS": 70.0,          # Model accuracy ~65%  
        "OVER_UNDER_2_5": 72.0, # Model accuracy ~68%
        "DOUBLE_CHANCE": 78.0, # Model accuracy ~75%
        "OVER_UNDER_1_5": 75.0, # Model accuracy ~70%
        "OVER_UNDER_3_5": 68.0, # Model accuracy ~62%
        "DRAW_NO_BET": 73.0,   # Model accuracy ~68%
        "OVER_UNDER_0_5": 80.0, # Model accuracy ~75%
        "OVER_UNDER_4_5": 82.0, # Model accuracy ~70%
    }
    
    # Step 1: Filter qualified markets (those meeting their thresholds)
    qualified_markets = []
    
    for market_key, definition in MARKET_DEFINITIONS.items():
        source_data = prediction[definition["source_key"]]
        threshold = MARKET_THRESHOLDS.get(market_key, 70.0)  # Default 70% if not specified
        
        for opt in definition["options"]:
            confidence = source_data[opt["key"]]
            
            # Check if market meets its threshold
            if confidence >= threshold:
                qualified_markets.append({
                    "market_key": market_key,
                    "market_label": definition["label"],
                    "option_key": opt["key"],
                    "option_label": opt["label"],
                    "confidence": round(confidence, 1),
                    "threshold": threshold,
                })
    
    # Step 2: Select best from qualified markets
    if not qualified_markets:
        # No market meets threshold - return NULL (no recommendation)
        return None
    
    # Find market with highest confidence among qualified
    best = max(qualified_markets, key=lambda m: m["confidence"])
    
    return {
        "market_key": best["market_key"],
        "market_label": best["market_label"],
        "option_key": best["option_key"],
        "option_label": best["option_label"],
        "confidence": best["confidence"],
    }


def build_prediction_dashboard(match, viewer_is_subscriber: bool):
    """
    AI Prediction Dashboard — masoko 9, kila moja likiwa na 'ai_pick'
    YAKE MWENYEWE (per-market, si 1X2 pekee tena), PAMOJA na 'top_pick'
    — recommendation MOJA kuu kati ya masoko YOTE 9 (global-best),
    ambayo ikiwa ndani ya soko lililofungwa kwa non-subscriber,
    inaonyesha TU asilimia yake (curiosity tease) bila kufichua soko
    wala chaguo lenyewe.
    """
    try:
        prediction = predict_fixture(match.league.poisson_key, match.home_team.name, match.away_team.name)
    except ValueError as exc:
        raise UnknownTeamError(str(exc)) from exc

    free_markets = set(settings.BASHIRI["FREE_MARKETS"])
    locked_markets = set(settings.BASHIRI["LOCKED_MARKETS"])
    all_market_keys = list(free_markets) + list(locked_markets)

    markets = []
    for market_key in all_market_keys:
        definition = MARKET_DEFINITIONS[market_key]
        source_data = prediction[definition["source_key"]]
        is_locked = market_key in locked_markets and not viewer_is_subscriber

        options = []
        max_prob = 0.0
        best_option_key = None
        best_option_prob = -1

        for opt in definition["options"]:
            prob_pct = source_data[opt["key"]]
            max_prob = max(max_prob, prob_pct)
            if prob_pct > best_option_prob:
                best_option_prob = prob_pct
                best_option_key = opt["key"]
            options.append({
                "key": opt["key"],
                "label": opt["label"],
                "prob": None if is_locked else round(prob_pct / 100, 4),  # Production returns percentages (0-100), convert to probability (0-1) for frontend
            })

        markets.append({
            "key": market_key,
            "label": definition["label"],
            "is_locked": is_locked,
            "is_free": market_key in free_markets,
            "confidence": None if is_locked else round(max_prob, 1),
            # MUHIMU: ai_pick sasa inahesabiwa kwa KILA soko (si 1X2 pekee),
            # ikiwa imefichwa kwa masoko ya locked (sawa na options zenyewe).
            "ai_pick": best_option_key if not is_locked else None,
            "options": options,
        })

    markets.sort(key=lambda m: (m["confidence"] is None, -(m["confidence"] or 0)))

    # === TOP PICK — Recommendation MOJA kuu kati ya masoko YOTE 9 ===
    global_best = compute_global_top_pick(prediction)
    is_top_pick_locked = global_best["market_key"] in locked_markets

    if is_top_pick_locked and not viewer_is_subscriber:
        top_pick = {
            "is_locked": True,
            "confidence": global_best["confidence"],
            "market_label": None,
            "option_label": None,
        }
    else:
        top_pick = {
            "is_locked": False,
            "confidence": global_best["confidence"],
            "market_label": global_best["market_label"],
            "option_label": global_best["option_label"],
        }

    return {
        "match_id": match.id,
        "model_version": MODEL_VERSION,
        "expected_goals": prediction["expected_goals"],
        "top_pick": top_pick,
        "markets": markets,
    }


def is_prediction_correct(market: str, selection: str, home_score: int, away_score: int) -> bool:
    total_goals = home_score + away_score
    if home_score > away_score:
        actual_1x2 = "home_win"
    elif home_score == away_score:
        actual_1x2 = "draw"
    else:
        actual_1x2 = "away_win"

    if market == "1X2":
        return selection == actual_1x2
    if market == "DOUBLE_CHANCE":
        # Normalize selection to lowercase to match MARKET_DEFINITIONS keys
        normalized_selection = selection.lower()
        allowed = {"1x": {"home_win", "draw"}, "x2": {"draw", "away_win"}, "12": {"home_win", "away_win"}}
        return actual_1x2 in allowed.get(normalized_selection, set())
    if market == "DRAW_NO_BET":
        if actual_1x2 == "draw":
            return False
        if selection == "home_dnb":
            return actual_1x2 == "home_win"
        if selection == "away_dnb":
            return actual_1x2 == "away_win"
        return False
    if market.startswith("OVER_UNDER_"):
        line = float(market.replace("OVER_UNDER_", "").replace("_", "."))
        is_over = total_goals > line
        if selection.startswith("over"):
            return is_over
        if selection.startswith("under"):
            return not is_over
        return False
    if market == "BTTS":
        both_scored = home_score > 0 and away_score > 0
        return both_scored if selection == "yes" else (not both_scored if selection == "no" else False)
    return False


def team_form(team_id, exclude_match_id=None, n=5):
    """Form ya matokeo n ya mwisho (mfano 'WWDLW') + wastani wa magoli — kwa Match Overview na Stat Cards."""
    from django.db.models import Q
    from .models import Match

    qs = Match.objects.filter(status="FINISHED").filter(
        Q(home_team_id=team_id) | Q(away_team_id=team_id)
    ).exclude(pk=exclude_match_id).order_by("-kickoff_at")[:n]

    form, goals_scored, matches = [], [], []
    for m in qs:
        is_home = m.home_team_id == team_id
        team_goals = m.home_score if is_home else m.away_score
        opp_goals = m.away_score if is_home else m.home_score
        goals_scored.append(team_goals)
        result = "W" if team_goals > opp_goals else ("D" if team_goals == opp_goals else "L")
        form.append(result)
        
        opponent = m.away_team if is_home else m.home_team
        matches.append({
            "opponent": opponent.name,
            "opponent_crest": opponent.crest_url,
            "is_home": is_home,
            "team_goals": team_goals,
            "opponent_goals": opp_goals,
            "result": result,
            "date": m.kickoff_at.date().isoformat(),
        })

    return {
        "sequence": "".join(reversed(form)),
        "avg_goals_scored": round(sum(goals_scored) / len(goals_scored), 2) if goals_scored else 0,
        "matches": list(reversed(matches)),
    }


def head_to_head(home_team_id, away_team_id, n=5):
    """Mechi n za mwisho kati ya timu hizi mbili (H2H) — kwa Match Overview."""
    from django.db.models import Q
    from .models import Match

    qs = Match.objects.filter(status="FINISHED").filter(
        Q(home_team_id=home_team_id, away_team_id=away_team_id) |
        Q(home_team_id=away_team_id, away_team_id=home_team_id)
    ).order_by("-kickoff_at")[:n]

    return [
        {
            "date": m.kickoff_at.date().isoformat(),
            "home_team": m.home_team.name,
            "away_team": m.away_team.name,
            "home_score": m.home_score,
            "away_score": m.away_score,
            "result": "H" if m.home_score > m.away_score else ("A" if m.home_score < m.away_score else "D"),
        }
        for m in qs
    ]


def get_enhanced_team_data(team_id: int, league_id: int) -> dict:
    """
    Get enhanced team data including current standings and form.
    Returns comprehensive team data for AI predictions.
    """
    from .models import Team, TeamStanding
    
    try:
        team = Team.objects.get(id=team_id)
        standing = TeamStanding.objects.filter(team_id=team_id, league_id=league_id).first()
        
        return {
            "team_id": team.id,
            "team_name": team.name,
            "crest_url": team.crest_url,
            "standing": {
                "position": standing.position if standing else None,
                "points": standing.points if standing else None,
                "form_rating": standing.form_rating if standing else 50.0,
                "form": standing.form if standing else None,
                "goals_for": standing.goals_for if standing else None,
                "goals_against": standing.goals_against if standing else None,
                "goal_difference": standing.goal_difference if standing else None,
            } if standing else None
        }
    except Team.DoesNotExist:
        return None


def get_enhanced_h2h_data(home_team_id: int, away_team_id: int, league_id: int) -> dict:
    """
    Get enhanced head-to-head data from the HeadToHead model.
    Returns H2H statistics for AI predictions.
    """
    from .models import HeadToHead
    
    try:
        h2h = HeadToHead.objects.filter(
            Q(home_team_id=home_team_id, away_team_id=away_team_id, league_id=league_id) |
            Q(home_team_id=away_team_id, away_team_id=home_team_id, league_id=league_id)
        ).first()
        
        if h2h:
            return {
                "total_matches": h2h.total_matches,
                "home_wins": h2h.home_wins,
                "draws": h2h.draws,
                "away_wins": h2h.away_wins,
                "home_goals": h2h.home_goals,
                "away_goals": h2h.away_goals,
                "last_5_matches": h2h.last_5_matches,
                "home_win_rate": round((h2h.home_wins / h2h.total_matches) * 100, 1) if h2h.total_matches > 0 else 0,
                "draw_rate": round((h2h.draws / h2h.total_matches) * 100, 1) if h2h.total_matches > 0 else 0,
                "away_win_rate": round((h2h.away_wins / h2h.total_matches) * 100, 1) if h2h.total_matches > 0 else 0,
            }
        return None
    except Exception:
        return None


def build_enhanced_prediction_dashboard(match, viewer_is_subscriber: bool):
    """
    Enhanced AI Prediction Dashboard with team standings and H2H data.
    Includes all 9 markets with enriched context.
    """
    # Get base prediction
    dashboard = build_prediction_dashboard(match, viewer_is_subscriber)
    
    # Add enhanced team data
    home_data = get_enhanced_team_data(match.home_team_id, match.league_id)
    away_data = get_enhanced_team_data(match.away_team_id, match.league_id)
    
    # Add H2H data
    h2h_data = get_enhanced_h2h_data(match.home_team_id, match.away_team_id, match.league_id)
    
    # Enhance dashboard with additional context
    dashboard["team_context"] = {
        "home_team": home_data,
        "away_team": away_data,
        "head_to_head": h2h_data,
    }
    
    return dashboard


def get_ai_recommended_option(match, market_key: str):
    """
    Inarudisha 'option key' yenye probability kubwa zaidi ya soko fulani,
    kutoka kwa AI model KAMILI (si dashboard ya locked-view).
    """
    try:
        prediction = predict_fixture(match.league.poisson_key, match.home_team.name, match.away_team.name)
    except ValueError:
        return None

    if market_key not in MARKET_DEFINITIONS:
        return None

    definition = MARKET_DEFINITIONS[market_key]
    source_data = prediction[definition["source_key"]]
    best_option = max(definition["options"], key=lambda opt: source_data[opt["key"]])
    return best_option["key"]


def build_match_analysis(match, viewer_is_subscriber: bool):
    """
    Uchambuzi KAMILI wa baada ya mechi — masoko 9, kila moja likionyesha
    AI ilisema nini, chaguo lipi lilitokea kweli, na AI ilikuwa sahihi
    au la. AI Scorecard (X/9) inaonyeshwa kwa WOTE (hata non-subscriber)
    kama 'teaser' — LAKINI namba za masoko 6 ya locked hazionyeshwi
    (server-side hiding, sawa na Dashboard ya kabla ya mechi).
    """
    try:
        prediction = predict_fixture(match.league.poisson_key, match.home_team.name, match.away_team.name)
    except ValueError as exc:
        raise UnknownTeamError(str(exc)) from exc

    home_score = match.home_score
    away_score = match.away_score

    free_markets = set(settings.BASHIRI["FREE_MARKETS"])
    locked_markets = set(settings.BASHIRI["LOCKED_MARKETS"])
    all_market_keys = list(free_markets) + list(locked_markets)

    markets = []
    correct_count = 0

    for market_key in all_market_keys:
        definition = MARKET_DEFINITIONS[market_key]
        source_data = prediction[definition["source_key"]]
        is_locked = market_key in locked_markets and not viewer_is_subscriber

        best_ai_key = max(definition["options"], key=lambda o: source_data[o["key"]])["key"]
        ai_correct = is_prediction_correct(market_key, best_ai_key, home_score, away_score)
        if ai_correct:
            correct_count += 1

        options = []
        for opt in definition["options"]:
            prob_pct = source_data[opt["key"]]
            was_actual = is_prediction_correct(market_key, opt["key"], home_score, away_score)
            options.append({
                "key": opt["key"],
                "label": opt["label"],
                "prob": None if is_locked else round(prob_pct / 100, 4),
                "was_actual_outcome": None if is_locked else was_actual,
            })

        markets.append({
            "key": market_key,
            "label": definition["label"],
            "is_locked": is_locked,
            "is_free": market_key in free_markets,
            "ai_pick": None if is_locked else best_ai_key,
            "ai_was_correct": None if is_locked else ai_correct,
            "options": options,
        })

    return {
        "model_version": MODEL_VERSION,
        "ai_scorecard": {"correct": correct_count, "total": len(all_market_keys)},
        "expected_goals": prediction["expected_goals"],
        "actual_score": {"home": home_score, "away": away_score},
        "markets": markets,
    }
