"""feed/ranking.py — Smart Ranking Engine."""
from django.conf import settings

BIG_MATCH_BONUS = 15


def calculate_card_score(card, user) -> int:
    base_scores = settings.BASHIRI["FEED_CARD_SCORES"]
    score = base_scores.get(card.type, 0)

    if card.match_id and getattr(card.match, "is_big_match", False):
        score += BIG_MATCH_BONUS

    if user and user.is_authenticated and card.match_id:
        favorite_team_ids = set(user.favorite_teams.values_list("id", flat=True))
        if favorite_team_ids and (
            card.match.home_team_id in favorite_team_ids or card.match.away_team_id in favorite_team_ids
        ):
            score += 30

    if card.type == "POLL":
        vote_count = card.data.get("vote_count", 0)
        threshold = card.data.get("engagement_threshold", 50)
        if vote_count > threshold:
            score += 20

    return score


def rank_cards(cards, user):
    scored = [(calculate_card_score(card, user), card) for card in cards]
    scored.sort(key=lambda pair: pair[0], reverse=True)
    return [card for _score, card in scored]