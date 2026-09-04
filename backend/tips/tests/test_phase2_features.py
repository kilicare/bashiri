from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from accounts.models import User
from predictions.models import League, Team
from tips.models import TipPerformance


class OnboardingPersistenceTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            phone_number="+255700000001",
            password="test-password",
            username="phase2-user",
            date_of_birth="1990-01-01",
        )
        self.client.force_authenticate(self.user)

    def test_complete_preserves_existing_favorites_and_saves_preferences(self):
        league = League.objects.create(code="PL", name="Premier League", poisson_key="EPL")
        existing_team = Team.objects.create(league=league, name="Existing FC", external_id=901)
        new_team = Team.objects.create(league=league, name="New FC", external_id=902)
        self.user.favorite_leagues.add(league)
        self.user.favorite_teams.add(existing_team)

        response = self.client.post(reverse("onboarding"), {
            "action": "complete",
            "favorite_leagues": [],
            "favorite_teams": [new_team.id],
            "tip_preferences": ["high_confidence", "top_tipsters"],
        }, format="json")

        self.user.refresh_from_db()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.user.onboarding_status, "completed")
        self.assertIsNotNone(self.user.onboarding_completed_at)
        self.assertEqual(set(self.user.favorite_leagues.values_list("id", flat=True)), {league.id})
        self.assertEqual(set(self.user.favorite_teams.values_list("id", flat=True)), {existing_team.id, new_team.id})
        self.assertEqual(self.user.tip_preferences, ["high_confidence", "top_tipsters"])

    def test_skip_is_valid_with_empty_selections(self):
        response = self.client.post(reverse("onboarding"), {"action": "skip"}, format="json")
        self.user.refresh_from_db()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.user.onboarding_status, "skipped")
        self.assertIsNone(self.user.onboarding_completed_at)


class TipStarsTests(TestCase):
    def test_ranking_requires_sample_and_exposes_public_fields_only(self):
        strong = User.objects.create_user(phone_number="+255700000002", username="strong-star")
        weak_sample = User.objects.create_user(phone_number="+255700000003", username="small-star")
        strong.verified_tipster = True
        strong.save(update_fields=["verified_tipster"])
        TipPerformance.objects.create(user=strong, total_tips=100, correct_tips=80, accuracy_percentage=80, tipster_score=88)
        TipPerformance.objects.create(user=weak_sample, total_tips=2, correct_tips=2, accuracy_percentage=100, tipster_score=95)

        response = APIClient().get(reverse("tips:tip-stars"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual([item["user"]["username"] for item in response.data["results"]], ["strong-star"])
        self.assertNotIn("phone_number", response.data["results"][0]["user"])
        self.assertNotIn("date_of_birth", response.data["results"][0]["user"])

    def test_tip_stars_supports_verified_filter_and_limit(self):
        for index in range(3):
            user = User.objects.create_user(phone_number=f"+25570000001{index}", username=f"star-{index}")
            TipPerformance.objects.create(user=user, total_tips=10 + index, accuracy_percentage=60 + index, tipster_score=60 + index)
        verified = User.objects.get(username="star-2")
        verified.verified_tipster = True
        verified.save(update_fields=["verified_tipster"])

        response = APIClient().get(reverse("tips:tip-stars"), {"verified": "true", "limit": 1})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["user"]["username"], "star-2")

    def test_follow_status_endpoint_matches_existing_follow_relationship(self):
        follower = User.objects.create_user(phone_number="+255700000004", username="follower")
        target = User.objects.create_user(phone_number="+255700000005", username="target")
        client = APIClient()
        client.force_authenticate(follower)

        before = client.get(reverse("check-follow", kwargs={"username": target.username}))
        self.assertFalse(before.data["is_following"])

        follow = client.post(reverse("follow-user", kwargs={"username": target.username}))
        after = client.get(reverse("check-follow", kwargs={"username": target.username}))

        self.assertEqual(follow.status_code, 200)
        self.assertTrue(after.data["is_following"])
