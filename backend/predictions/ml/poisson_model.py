"""
predictions/ml/poisson_model.py

Muundo uliorekebishwa kikamilifu kulingana na Phase 1 (Google Colab).
Inasoma parameter zote kwa usahihi kutoka bashiri_prediction_models.json
"""
import json
import os
from functools import lru_cache
from scipy.stats import poisson
from difflib import SequenceMatcher

# Njia ya faili la JSON kulingana na muundo wako
MODEL_DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "bashiri_prediction_models.json")


@lru_cache(maxsize=1)
def load_models():
    """Inapakia model kutoka kwenye JSON mara moja tu ili kuokoa kumbukumbu (memory)"""
    if not os.path.exists(MODEL_DATA_PATH):
        raise FileNotFoundError(f"⚠️ Faili la JSON halipatikani kwenye njia hii: {MODEL_DATA_PATH}")
    with open(MODEL_DATA_PATH, "r") as f:
        return json.load(f)


def sanitize_parameter(value: float, min_val: float = 0.05, max_val: float = 6.0) -> float:
    """Inahakikisha parameter ziko ndani ya mipaka salama - kwa ajili ya Eredivisie na ligi nyingine"""
    return max(min_val, min(max_val, value))


def find_best_team_match(search_name: str, available_teams: list, threshold: float = 0.7) -> tuple:
    """
    Tafuta timu inayofana zaidi kwa kutumia fuzzy string matching.
    Returns (matched_team_name, similarity_score) tuple.
    """
    search_name_lower = search_name.lower().strip()
    
    # Common team name abbreviations
    abbreviations = {
        'man city': 'manchester city',
        'man utd': 'manchester united',
        'manchester utd': 'manchester united',
        'man united': 'manchester united',
        'spurs': 'tottenham',
        'real madrid': 'real madrid',
        'barca': 'barcelona',
        'fc barcelona': 'barcelona',
        'inter': 'inter milan',
        'ac milan': 'milan',
        'bayern': 'bayern munich',
        'dortmund': 'borussia dortmund',
        'juve': 'juventus',
        'ajax': 'ajax',
        'psg': 'paris saint-germain',
        'psg': 'paris',
        'west ham': 'west ham united',
        'newcastle': 'newcastle united',
        'wolves': 'wolverhampton',
        'brighton': 'brighton & hove albion',
        'hove': 'brighton & hove albion',
    }
    
    # Check if search name is an abbreviation
    if search_name_lower in abbreviations:
        search_name_lower = abbreviations[search_name_lower]
    
    best_match = None
    best_score = 0.0
    
    for team_name in available_teams:
        team_name_lower = team_name.lower().strip()
        
        # Check for exact match first
        if search_name_lower == team_name_lower:
            return team_name, 1.0
        
        # Calculate similarity using SequenceMatcher
        similarity = SequenceMatcher(None, search_name_lower, team_name_lower).ratio()
        
        # Bonus for containing the search term
        if search_name_lower in team_name_lower or team_name_lower in search_name_lower:
            similarity += 0.15
        
        # Bonus for matching key words (city, united, etc)
        search_words = set(search_name_lower.split())
        team_words = set(team_name_lower.split())
        common_words = search_words & team_words
        if common_words:
            similarity += 0.1 * len(common_words)
        
        if similarity > best_score:
            best_score = similarity
            best_match = team_name
    
    if best_score >= threshold:
        return best_match, best_score
    else:
        return None, best_score

def get_available_leagues():
    """Inarudisha orodha ya ligi zote zilizopo kwenye model JSON kwa ajili ya dynamic loading"""
    models = load_models()
    return list(models["team_parameters"]["per_league"].keys())

def get_league_params(league_code: str):
    """Inatafuta vigezo halisi vya ligi kutoka kwenye faili lililosaviwa Colab (v2.0 structure)"""
    models = load_models()
    league_data = models["team_parameters"]["per_league"].get(league_code)
    if not league_data:
        raise ValueError(
            f"Hakuna trained model kwa ligi '{league_code}'. "
            f"Ligi zilizopo: {list(models['team_parameters']['per_league'].keys())}"
        )
    # Tofauti na mwanzo, hapa tunachukua league_avg_goals halisi iliyotoka Colab!
    # Tumia muundo sahihi wa JSON v2.0: baseline["home_advantage"] na baseline["avg_goals"]
    home_advantage = league_data["baseline"]["home_advantage"]
    league_avg_goals = league_data["baseline"]["avg_goals"]
    
    # Sanitize parameters kuhakikisha ziko ndani ya mipaka salama
    home_advantage = sanitize_parameter(home_advantage, 0.5, 2.0)  # Home advantage kawaida 1.0-1.5
    league_avg_goals = sanitize_parameter(league_avg_goals, 0.8, 2.5)  # Average goals kawaida 1.0-1.8
    
    return (
        league_data["teams"],
        home_advantage,
        league_avg_goals,
    )


def predict_all_markets(home_team, away_team, team_params, home_advantage, league_avg_goals, max_goals=8):
    """Inapiga hesabu na kutema masoko yote 9 kwa usahihi wa hali ya juu"""
    if home_team not in team_params or away_team not in team_params:
        raise ValueError(f"Timu haijulikani kwenye model hii: {home_team} au {away_team}")

    home = team_params[home_team]
    away = team_params[away_team]

    # Sanitize attack/defense parameters kwa ajili ya Eredivisie na ligi nyingine
    home_attack = sanitize_parameter(home["attack"], 0.5, 3.0)
    home_defense = sanitize_parameter(home["defense"], 0.5, 3.0)
    away_attack = sanitize_parameter(away["attack"], 0.5, 3.0)
    away_defense = sanitize_parameter(away["defense"], 0.5, 3.0)

    # Hesabu ya Expected Goals (xG) kulingana na formula yetu ya Colab
    home_xg = league_avg_goals * home_attack * away_defense * home_advantage
    away_xg = league_avg_goals * away_attack * home_defense
    
    # Sanitize xG values kuhakikisha ziko ndani ya mipima salama (0.05 - 6.0)
    home_xg = sanitize_parameter(home_xg, 0.05, 6.0)
    away_xg = sanitize_parameter(away_xg, 0.05, 6.0)

    # Kupata usambazaji wa magoli (Poisson Probability Distribution)
    home_probs = [poisson.pmf(i, home_xg) for i in range(max_goals)]
    away_probs = [poisson.pmf(i, away_xg) for i in range(max_goals)]

    home_win = draw = away_win = 0.0
    over = {0.5: 0.0, 1.5: 0.0, 2.5: 0.0, 3.5: 0.0, 4.5: 0.0}
    btts_yes = 0.0

    # Matrix multiplication ya magoli yote yanayoweza kufungwa
    for h in range(max_goals):
        for a in range(max_goals):
            p = home_probs[h] * away_probs[a]
            if h > a:
                home_win += p
            elif h == a:
                draw += p
            else:
                away_win += p
                
            total_goals = h + a
            for line in over:
                if total_goals > line:
                    over[line] += p
            if h > 0 and a > 0:
                btts_yes += p

    # Apply calibration tweaks from v2.0 (BTTS ×0.88, Over ×0.85)
    btts_yes *= 0.88  # BTTS adjustment - reduced by 12%
    for line in over:
        over[line] *= 0.85  # Over/Under adjustment - reduced by 15%

    # Kurekebisha jumla ya uwezekano (Normalisation) ili isizidi wala kupungua 100%
    total_prob = home_win + draw + away_win
    if total_prob > 0:
        home_win /= total_prob
        draw /= total_prob
        away_win /= total_prob

    # Muundo wa matokeo ya mwisho kabisa kwa ajili ya Django API/Views (Umeratibiwa vizuri)
    result = {
        "expected_goals": {
            "home_xg": round(home_xg, 2),
            "away_xg": round(away_xg, 2),
        },
        "match_result": {
            "home_win": round(home_win * 100, 1),
            "draw": round(draw * 100, 1),
            "away_win": round(away_win * 100, 1),
        },
        "double_chance": {
            "1X": round(min((home_win + draw) * 100, 100.0), 1),
            "X2": round(min((draw + away_win) * 100, 100.0), 1),
            "12": round(min((home_win + away_win) * 100, 100.0), 1),
        },
        "draw_no_bet": {
            "home_dnb": round((home_win / (home_win + away_win)) * 100, 1) if (home_win + away_win) > 0 else 50.0,
            "away_dnb": round((away_win / (home_win + away_win)) * 100, 1) if (home_win + away_win) > 0 else 50.0,
        },
        "over_under": {f"over_{line}": round(prob * 100, 1) for line, prob in over.items()},
        "btts": {
            "yes": round(btts_yes * 100, 1),
            "no": round(max(0.0, 1.0 - btts_yes) * 100, 1), # Ulinzi wa namba hasi
        },
    }

    # Kuongeza masoko ya Under 0.5 hadi Under 4.5
    for line, prob in over.items():
        result["over_under"][f"under_{line}"] = round(max(0.0, 1.0 - prob) * 100, 1)

    # Kupata chaguo bora zaidi la AI (AI Pick) la kuonyesha kwenye skrini
    picks = {"Home Win": home_win, "Draw": draw, "Away Win": away_win}
    best_pick = max(picks, key=picks.get)
    result["ai_pick"] = {
        "market": "1X2",
        "selection": best_pick,
        "confidence": round(picks[best_pick] * 100, 1),
    }

    return result


def predict_fixture(league_code: str, home_team: str, away_team: str):
    """
    Function kuu itakayoitwa na Django views/views.py au api.py
    Sasa inatum fuzzy matching kwa majina ya timu ili kuhimili spelling errors.
    """
    try:
        team_params, home_advantage, league_avg_goals = get_league_params(league_code)
    except ValueError as e:
        raise
    
    # Check if teams exist in the model with exact match
    if home_team not in team_params or away_team not in team_params:
        # Try fuzzy matching for missing teams
        available_teams = list(team_params.keys())
        
        if home_team not in team_params:
            matched_home, home_score = find_best_team_match(home_team, available_teams)
            if matched_home:
                home_team = matched_home
            else:
                raise ValueError(f"Timu '{home_team}' haipatikani kwenye model hii. Karibu zaidi spelling au check ligi.")
        
        if away_team not in team_params:
            matched_away, away_score = find_best_team_match(away_team, available_teams)
            if matched_away:
                away_team = matched_away
            else:
                raise ValueError(f"Timu '{away_team}' haipatikani kwenye model hii. Karibu zaidi spelling au check ligi.")
    
    return predict_all_markets(home_team, away_team, team_params, home_advantage, league_avg_goals)