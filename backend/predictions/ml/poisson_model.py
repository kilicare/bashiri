"""
predictions/ml/poisson_model.py

Muundo uliorekebishwa kikamilifu kulingana na Phase 1 (Google Colab).
Inasoma parameter zote kwa usahihi kutoka bashiri_prediction_models.json
"""
import json
import os
from functools import lru_cache
from scipy.stats import poisson

# Njia ya faili la JSON kulingana na muundo wako
MODEL_DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "bashiri_prediction_models.json")


@lru_cache(maxsize=1)
def load_models():
    """Inapakia model kutoka kwenye JSON mara moja tu ili kuokoa kumbukumbu (memory)"""
    if not os.path.exists(MODEL_DATA_PATH):
        raise FileNotFoundError(f"⚠️ Faili la JSON halipatikani kwenye njia hii: {MODEL_DATA_PATH}")
    with open(MODEL_DATA_PATH, "r") as f:
        return json.load(f)


def get_league_params(league_code: str):
    """Inatafuta vigezo halisi vya ligi kutoka kwenye faili lililosaviwa Colab"""
    models = load_models()
    league_data = models["leagues"].get(league_code)
    if not league_data:
        raise ValueError(
            f"Hakuna trained model kwa ligi '{league_code}'. "
            f"Ligi zilizopo: {list(models['leagues'].keys())}"
        )
    # Tofauti na mwanzo, hapa tunachukua league_avg_goals halisi iliyotoka Colab!
    return (
        league_data["teams"],
        league_data["home_advantage"],
        league_data["league_avg_goals"],
    )


def predict_all_markets(home_team, away_team, team_params, home_advantage, league_avg_goals, max_goals=8):
    """Inapiga hesabu na kutema masoko yote 9 kwa usahihi wa hali ya juu"""
    if home_team not in team_params or away_team not in team_params:
        raise ValueError(f"Timu haijulikani kwenye model hii: {home_team} au {away_team}")

    home = team_params[home_team]
    away = team_params[away_team]

    # Hesabu ya Expected Goals (xG) kulingana na formula yetu ya Colab
    home_xg = league_avg_goals * home["attack"] * away["defense"] * home_advantage
    away_xg = league_avg_goals * away["attack"] * home["defense"]

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

    # Kurekebisha jumla ya uwezekano (Normalisation) ili isizidi wala kupungua 100%
    total_prob = home_win + draw + away_win
    if total_prob > 0:
        home_win /= total_prob
        draw /= total_prob
        away_win /= total_prob

    # Muundo wa matokeo ya mwisho kabisa kwa ajili ya Django API/Views
    result = {
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
            "no": round((1.0 - btts_yes) * 100, 1),
        },
        "expected_goals": {
            "home_xg": round(home_xg, 2),
            "away_xg": round(away_xg, 2),
        },
    }

    # Kuongeza masoko ya Under 0.5 hadi Under 4.5
    for line, prob in over.items():
        result["over_under"][f"under_{line}"] = round((1.0 - prob) * 100, 1)

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
    """Function kuu itakayoitwa na Django views/views.py au api.py"""
    team_params, home_advantage, league_avg_goals = get_league_params(league_code)
    return predict_all_markets(home_team, away_team, team_params, home_advantage, league_avg_goals)