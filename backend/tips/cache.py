from django.core.cache import cache
from hashlib import md5
import json
import logging

logger = logging.getLogger(__name__)


class TipsCache:
    """Cache management for tips feature"""

    # Cache timeouts
    TIPS_LIST_TIMEOUT = 60
    TIP_DETAIL_TIMEOUT = 300
    LEADERBOARD_TIMEOUT = 300
    USER_TIPS_TIMEOUT = 120
    TIP_COMMENTS_TIMEOUT = 180

    @staticmethod
    def get_tips_list_key(filters: dict) -> str:
        """Generate cache key for tips list"""
        filters_str = json.dumps(filters, sort_keys=True)
        filters_hash = md5(filters_str.encode()).hexdigest()
        return f"tips:list:{filters_hash}"

    @staticmethod
    def cache_tips_list(filters: dict, data: any) -> None:
        """Cache tips list"""
        key = TipsCache.get_tips_list_key(filters)
        cache.set(key, data, TipsCache.TIPS_LIST_TIMEOUT)
        logger.info(f"Cached tips list: {key}")

    @staticmethod
    def get_cached_tips_list(filters: dict) -> any:
        """Get cached tips list"""
        key = TipsCache.get_tips_list_key(filters)
        return cache.get(key)

    @staticmethod
    def invalidate_tips_lists() -> None:
        """Invalidate all tips list caches"""
        cache.delete_pattern("tips:list:*")
        logger.info("Invalidated all tips lists cache")

    @staticmethod
    def cache_tip_detail(tip_id: int, data: any) -> None:
        """Cache individual tip"""
        key = f"tip:detail:{tip_id}"
        cache.set(key, data, TipsCache.TIP_DETAIL_TIMEOUT)

    @staticmethod
    def get_cached_tip_detail(tip_id: int) -> any:
        """Get cached tip detail"""
        key = f"tip:detail:{tip_id}"
        return cache.get(key)

    @staticmethod
    def invalidate_tip_detail(tip_id: int) -> None:
        """Invalidate specific tip cache"""
        key = f"tip:detail:{tip_id}"
        cache.delete(key)

    @staticmethod
    def cache_leaderboard(data: any) -> None:
        """Cache leaderboard"""
        cache.set("tips:leaderboard", data, TipsCache.LEADERBOARD_TIMEOUT)
        logger.info("Cached leaderboard")

    @staticmethod
    def get_cached_leaderboard() -> any:
        """Get cached leaderboard"""
        return cache.get("tips:leaderboard")

    @staticmethod
    def invalidate_leaderboard() -> None:
        """Invalidate leaderboard cache"""
        cache.delete("tips:leaderboard")
        logger.info("Invalidated leaderboard cache")

    @staticmethod
    def cache_user_tips(username: str, data: any) -> None:
        """Cache user's tips"""
        key = f"tips:user:{username}"
        cache.set(key, data, TipsCache.USER_TIPS_TIMEOUT)

    @staticmethod
    def get_cached_user_tips(username: str) -> any:
        """Get cached user tips"""
        key = f"tips:user:{username}"
        return cache.get(key)

    @staticmethod
    def invalidate_user_tips(username: str) -> None:
        """Invalidate user tips cache"""
        key = f"tips:user:{username}"
        cache.delete(key)

    @staticmethod
    def cache_tip_comments(tip_id: int, data: any) -> None:
        """Cache tip comments"""
        key = f"tip:comments:{tip_id}"
        cache.set(key, data, TipsCache.TIP_COMMENTS_TIMEOUT)

    @staticmethod
    def get_cached_tip_comments(tip_id: int) -> any:
        """Get cached comments"""
        key = f"tip:comments:{tip_id}"
        return cache.get(key)

    @staticmethod
    def invalidate_tip_comments(tip_id: int) -> None:
        """Invalidate tip comments cache"""
        key = f"tip:comments:{tip_id}"
        cache.delete(key)

    @staticmethod
    def invalidate_all() -> None:
        """Emergency: invalidate all tips caches"""
        cache.delete_pattern("tips:*")
        cache.delete_pattern("tip:*")
        logger.warning("Invalidated ALL tips caches")
