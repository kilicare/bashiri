"""
tips/tests/test_market_registry.py

Tests for the centralized market registry functionality.
"""

from django.test import TestCase
from tips.market_registry import (
    get_market_definition,
    get_available_markets,
    get_markets_by_category,
    get_selection_label,
    is_valid_selection,
    parse_goal_line,
    normalize_selection_key,
    validate_market_key,
    get_available_market_keys,
    MarketCategory,
)


class TestMarketRegistryBasics(TestCase):
    """Test basic market registry functionality"""

    def test_get_market_definition_valid(self):
        """Test getting valid market definition"""
        market = get_market_definition("1X2")
        self.assertIsNotNone(market)
        self.assertEqual(market["key"], "1X2")
        self.assertEqual(market["label"], "Win/Draw/Loss")
        self.assertEqual(market["category"], MarketCategory.RESULT)
        self.assertTrue(market["available"])

    def test_get_market_definition_invalid(self):
        """Test getting invalid market definition"""
        market = get_market_definition("INVALID_MARKET")
        self.assertIsNone(market)

    def test_get_available_markets(self):
        """Test getting all available markets"""
        markets = get_available_markets()
        self.assertGreater(len(markets), 0)
        
        # Verify Correct Score is not available
        market_keys = [m["key"] for m in markets]
        self.assertNotIn("CORRECT_SCORE", market_keys)
        
        # Verify expected markets are available
        self.assertIn("1X2", market_keys)
        self.assertIn("BTTS", market_keys)
        self.assertIn("OVER_UNDER_2_5", market_keys)

    def test_get_markets_by_category(self):
        """Test getting markets by category"""
        result_markets = get_markets_by_category(MarketCategory.RESULT)
        self.assertGreater(len(result_markets), 0)
        
        for market in result_markets:
            self.assertEqual(market["category"], MarketCategory.RESULT)
            self.assertTrue(market["available"])

    def test_get_selection_label(self):
        """Test getting selection label"""
        label = get_selection_label("1X2", "home_win")
        self.assertEqual(label, "Home Win")
        
        label = get_selection_label("BTTS", "btts_yes")
        self.assertEqual(label, "Yes (Both Score)")

    def test_is_valid_selection(self):
        """Test selection validation"""
        self.assertTrue(is_valid_selection("1X2", "home_win"))
        self.assertTrue(is_valid_selection("BTTS", "btts_yes"))
        self.assertFalse(is_valid_selection("1X2", "invalid_selection"))
        self.assertFalse(is_valid_selection("INVALID_MARKET", "home_win"))

    def test_validate_market_key(self):
        """Test market key validation"""
        self.assertTrue(validate_market_key("1X2"))
        self.assertTrue(validate_market_key("BTTS"))
        self.assertFalse(validate_market_key("CORRECT_SCORE"))  # Not available
        self.assertFalse(validate_market_key("INVALID"))

    def test_get_available_market_keys(self):
        """Test getting available market keys"""
        keys = get_available_market_keys()
        self.assertIn("1X2", keys)
        self.assertIn("BTTS", keys)
        self.assertNotIn("CORRECT_SCORE", keys)


class TestMarketRegistryIntegration(TestCase):
    """Test market registry integration with serializers"""

    def test_all_available_markets_have_selections(self):
        """Test that all available markets have valid selections"""
        markets = get_available_markets()
        
        for market in markets:
            self.assertGreater(len(market["selections"]), 0)
            
            # Verify each selection has required fields
            for selection in market["selections"]:
                self.assertIn("key", selection)
                self.assertIn("label", selection)
                self.assertIsInstance(selection["key"], str)
                self.assertIsInstance(selection["label"], str)

    def test_selection_keys_are_unique_per_market(self):
        """Test that selection keys are unique within each market"""
        markets = get_available_markets()
        
        for market in markets:
            selection_keys = [s["key"] for s in market["selections"]]
            self.assertEqual(len(selection_keys), len(set(selection_keys)),
                           f"Duplicate selection keys in market {market['key']}")

    def test_market_keys_are_canonical(self):
        """Test that market keys follow canonical naming convention"""
        markets = get_available_markets()
        
        for market in markets:
            key = market["key"]
            # Verify key uses underscores and uppercase
            self.assertTrue(key.replace("_", "").isupper() or key == "BTTS",
                           f"Market key {key} doesn't follow canonical naming")


class TestMarketRegistryEdgeCases(TestCase):
    """Test edge cases and error handling"""

    def test_get_selection_label_invalid_market(self):
        """Test getting selection label for invalid market"""
        label = get_selection_label("INVALID", "home_win")
        self.assertIsNone(label)

    def test_get_selection_label_invalid_selection(self):
        """Test getting selection label for invalid selection"""
        label = get_selection_label("1X2", "invalid_selection")
        self.assertIsNone(label)

    def test_normalize_selection_key_unknown_market(self):
        """Test normalization for unknown market returns as-is"""
        normalized = normalize_selection_key("UNKNOWN_MARKET", "some_selection")
        self.assertEqual(normalized, "some_selection")

    def test_parse_goal_line_non_over_under(self):
        """Test parsing goal line for non-Over/Under market"""
        result = parse_goal_line("1X2")
        self.assertIsNone(result)