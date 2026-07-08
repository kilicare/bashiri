"""
feed/insights.py

Team-level "facts" zinazotokana na Match records tulizonazo. HAKUNA
player-level stats (mfano "Haaland amefunga magoli 9") kwa sababu
hatuna data ya wachezaji binafsi — facts zote ni za timu.
"""
from django.db.models import Q

from predictions.models import Match, Team


def unbeaten_home_streak(team: Team) -> int:
    """Idadi ya mechi za mfululizo za nyumbani bila kushindwa (streak ya sasa)."""
    matches = Match.objects.filter(
        home_team=team, status="FINISHED"
    ).order_by("-kickoff_at")

    streak = 0
    for m in matches:
        if m.home_score is None or m.away_score is None:
            continue
        if m.home_score >= m.away_score:
            streak += 1
        else:
            break
    return streak


def avg_goals_last_n(team: Team, n: int = 5) -> float:
    matches = Match.objects.filter(
        Q(home_team=team) | Q(away_team=team), status="FINISHED"
    ).order_by("-kickoff_at")[:n]

    total_goals = 0
    count = 0
    for m in matches:
        if m.home_score is None or m.away_score is None:
            continue
        total_goals += m.home_score if m.home_team_id == team.id else m.away_score
        count += 1

    return round(total_goals / count, 1) if count else 0.0


def clean_sheets_last_n(team: Team, n: int = 10) -> int:
    matches = Match.objects.filter(
        Q(home_team=team) | Q(away_team=team), status="FINISHED"
    ).order_by("-kickoff_at")[:n]

    count = 0
    for m in matches:
        conceded = m.away_score if m.home_team_id == team.id else m.home_score
        if conceded == 0:
            count += 1
    return count


def biggest_win_this_season(team: Team):
    matches = Match.objects.filter(
        Q(home_team=team) | Q(away_team=team), status="FINISHED"
    )

    biggest = None
    biggest_margin = 0
    for m in matches:
        if m.home_score is None or m.away_score is None:
            continue
        is_home = m.home_team_id == team.id
        team_goals = m.home_score if is_home else m.away_score
        opp_goals = m.away_score if is_home else m.home_score
        margin = team_goals - opp_goals
        if margin > biggest_margin:
            biggest_margin = margin
            biggest = m

    return biggest, biggest_margin


def generate_facts_for_team(team: Team) -> list:
    """Inarudisha orodha ya facts zenye thamani (zisizo za kawaida/za kuchosha)."""
    facts = []

    streak = unbeaten_home_streak(team)
    if streak >= 5:
        facts.append(f"{team.name} hawajashindwa nyumbani katika mechi {streak} mfululizo.")

    avg_goals = avg_goals_last_n(team, 5)
    if avg_goals >= 2.0:
        facts.append(f"{team.name} wamefunga wastani wa magoli {avg_goals} kwa mechi 5 za mwisho.")

    clean_sheets = clean_sheets_last_n(team, 10)
    if clean_sheets >= 4:
        facts.append(f"{team.name} wameweka clean sheet mara {clean_sheets} kati ya mechi 10 za mwisho.")

    biggest_match, margin = biggest_win_this_season(team)
    if biggest_match and margin >= 3:
        facts.append(
            f"Ushindi mkubwa zaidi wa {team.name} msimu huu ulikuwa kwa tofauti ya magoli {margin}."
        )

    return facts