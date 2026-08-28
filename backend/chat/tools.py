"""chat/tools.py — Wrapper functions za Groq function-calling."""

from django.db.models import Q
from predictions.ml.poisson_model import predict_fixture
from predictions.services import team_form, head_to_head
from predictions.models import Team, Match, ActiveDerby, AITrackRecordSnapshot
from difflib import SequenceMatcher


def find_best_team_match(query: str, team_list: list, threshold: float = 0.7):
    """
    Simple fuzzy matching for team names using SequenceMatcher.
    Returns (matched_name, match_score) or (None, 0) if no match found.
    """
    if not query or not team_list:
        return None, 0.0

    query_normalized = query.lower().strip()
    best_match = None
    best_score = 0.0

    for team in team_list:
        team_normalized = team.lower().strip()
        score = SequenceMatcher(None, query_normalized, team_normalized).ratio()

        if score > best_score:
            best_score = score
            best_match = team

    if best_score >= threshold:
        return best_match, best_score

    return None, 0.0


def tool_predict_fixture(league_code: str, home_team: str, away_team: str) -> dict:
    """Wrapper rahisi ya predict_fixture with fuzzy matching."""
    try:
        # predict_fixture already has fuzzy matching built-in
        result = predict_fixture(league_code, home_team, away_team)
        return {
            "success": True,
            "data": result,
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
        }


def tool_team_form(team_name: str) -> dict:
    """Tafuta timu kwa jina na rudisha form yake."""
    try:
        # Try fuzzy matching first
        all_teams = list(Team.objects.values_list("name", flat=True))
        matched_name, match_score = find_best_team_match(team_name, all_teams)
        
        if matched_name:
            team = Team.objects.filter(name=matched_name).first()
        else:
            # Fallback to icontains if fuzzy matching fails
            team = Team.objects.filter(name__icontains=team_name).first()
        
        if not team:
            return {
                "success": False,
                "error": f"Timu '{team_name}' haijulikani",
            }
        
        form_data = team_form(team.id)
        
        # Calculate attack/defense/form stats from recent matches
        matches = form_data.get("matches", [])
        if matches:
            # Calculate attack based on goals scored
            total_goals = sum(m["team_goals"] for m in matches)
            attack = min(100, max(0, (total_goals / len(matches)) * 20))  # Scale to 0-100
            
            # Calculate defense based on goals conceded
            total_conceded = sum(m["opponent_goals"] for m in matches)
            defense = min(100, max(0, 100 - (total_conceded / len(matches)) * 20))  # Scale to 0-100
            
            # Calculate form based on wins/draws/losses
            wins = sum(1 for m in matches if m["result"] == "W")
            draws = sum(1 for m in matches if m["result"] == "D")
            form = min(100, max(0, ((wins * 3 + draws) / (len(matches) * 3)) * 100))
            
            # Calculate momentum direction and intensity
            recent_results = [m["result"] for m in matches]
            points_recent = [3 if r == "W" else 1 if r == "D" else 0 for r in recent_results]
            
            # Determine momentum direction
            if len(points_recent) >= 2:
                first_half = sum(points_recent[:len(points_recent)//2])
                second_half = sum(points_recent[len(points_recent)//2:])
                if second_half > first_half:
                    momentum_direction = "up"
                elif second_half < first_half:
                    momentum_direction = "down"
                else:
                    momentum_direction = "neutral"
            else:
                momentum_direction = "neutral"
            
            # Calculate momentum intensity (1-10) based on point difference
            if len(points_recent) >= 2:
                first_half = sum(points_recent[:len(points_recent)//2])
                second_half = sum(points_recent[len(points_recent)//2:])
                intensity = min(10, max(1, abs(second_half - first_half) + 1))
            else:
                intensity = 5
            
        else:
            attack = 50
            defense = 50
            form = 50
            momentum_direction = "neutral"
            intensity = 5
        
        return {
            "success": True,
            "data": {
                "team_name": team.name,
                "team_crest": team.crest_url,
                "sequence": form_data.get("sequence", ""),
                "attack": round(attack),
                "defense": round(defense),
                "form": round(form),
                "matches": matches,
                "momentum": {
                    "direction": momentum_direction,
                    "intensity": intensity,
                }
            },
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
        }


def tool_head_to_head(team1_name: str, team2_name: str) -> dict:
    """Tafuta timu mbili na rudisha H2H history."""
    try:
        # Try fuzzy matching for both teams
        all_teams = list(Team.objects.values_list("name", flat=True))
        
        matched_team1, score1 = find_best_team_match(team1_name, all_teams)
        matched_team2, score2 = find_best_team_match(team2_name, all_teams)
        
        if matched_team1:
            team1 = Team.objects.filter(name=matched_team1).first()
        else:
            team1 = Team.objects.filter(name__icontains=team1_name).first()
        
        if matched_team2:
            team2 = Team.objects.filter(name=matched_team2).first()
        else:
            team2 = Team.objects.filter(name__icontains=team2_name).first()
        
        if not team1:
            return {
                "success": False,
                "error": f"Timu '{team1_name}' haijulikani",
            }
        if not team2:
            return {
                "success": False,
                "error": f"Timu '{team2_name}' haijulikani",
            }
        
        h2h_data = head_to_head(team1.id, team2.id)
        return {
            "success": True,
            "data": {
                "team1_name": team1.name,
                "team2_name": team2.name,
                "matches": h2h_data,  # h2h_data is a list
            },
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
        }


def tool_ai_track_record(league_code: str = None) -> dict:
    """Rudisha AI track record ya mwisho."""
    try:
        snapshot = AITrackRecordSnapshot.objects.order_by("-created_at").first()
        if not snapshot:
            return {
                "success": False,
                "error": "Hakuna track record iliyohifadhiwa",
            }
        
        data = {
            "created_at": snapshot.created_at.isoformat(),
            "overall_accuracy": snapshot.overall_accuracy,
            "market_accuracies": snapshot.market_accuracies,
        }
        
        if league_code:
            # Filter kwa league specific
            league_acc = snapshot.market_accuracies.get(league_code, {})
            data["league_specific"] = {
                "league_code": league_code,
                "accuracy": league_acc,
            }
        
        return {
            "success": True,
            "data": data,
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
        }


def tool_active_derby() -> dict:
    """Rudisha derby inayoendelea sasa."""
    try:
        from django.utils import timezone
        
        now = timezone.now()
        derbies = ActiveDerby.objects.filter(
            is_active=True,
            starts_at__lte=now,
            ends_at__gte=now
        ).select_related("home_team", "away_team").order_by("starts_at")
        
        if not derbies.exists():
            return {
                "success": True,
                "data": {
                    "active": False,
                    "derbies": [],
                },
            }
        
        derbies_data = []
        for derby in derbies:
            derbies_data.append({
                "id": derby.id,
                "derby_name": derby.derby_name,
                "home_team": derby.home_team.name,
                "home_team_crest": derby.home_team.crest_url,
                "away_team": derby.away_team.name,
                "away_team_crest": derby.away_team.crest_url,
                "starts_at": derby.starts_at.isoformat(),
                "ends_at": derby.ends_at.isoformat(),
                "theme_accent_color": derby.theme_accent_color,
            })
        
        return {
            "success": True,
            "data": {
                "active": True,
                "derbies": derbies_data,
            },
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
        }


def tool_search_matches(query: str, status: str = None) -> dict:
    """Tafuta mechi kwa jina la timu."""
    try:
        from django.utils import timezone
        
        # Try fuzzy matching first with lower threshold for chat bot
        all_teams = list(Team.objects.values_list("name", flat=True))
        matched_name, match_score = find_best_team_match(query, all_teams, threshold=0.5)
        
        if matched_name:
            teams = Team.objects.filter(name=matched_name)
        else:
            # Fallback to icontains if fuzzy matching fails
            teams = Team.objects.filter(name__icontains=query)
        
        if not teams.exists():
            return {
                "success": False,
                "error": f"Hakuna timu yenye jina '{query}'",
            }
        
        # Tafuta mechi za timu hizo
        team_ids = teams.values_list("id", flat=True)
        matches_qs = Match.objects.filter(
            Q(home_team_id__in=team_ids) | Q(away_team_id__in=team_ids)
        ).select_related("home_team", "away_team")
        
        if status:
            matches_qs = matches_qs.filter(status=status.upper())
        
        matches = matches_qs.order_by("-kickoff_at")[:5]
        
        matches_data = []
        for match in matches:
            matches_data.append({
                "id": match.id,
                "home_team": match.home_team.name,
                "home_team_crest": match.home_team.crest_url,
                "away_team": match.away_team.name,
                "away_team_crest": match.away_team.crest_url,
                "kickoff_at": match.kickoff_at.isoformat(),
                "status": match.status,
                "home_score": match.home_score,
                "away_score": match.away_score,
            })
        
        return {
            "success": True,
            "data": {
                "query": query,
                "matches": matches_data,
            },
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
        }
