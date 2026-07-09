"""
core/cache_utils.py

Cache rahisi kwa data isiyobadilika mara kwa mara (League/Team list) —
inapunguza load kwenye database kwa maombi yanayorudiwa mara nyingi.
"""
import json

from django.conf import settings
from django.core.cache import cache

DEFAULT_TIMEOUT = 300  # sekunde 5 dakika


def cache_response(key_prefix, timeout=DEFAULT_TIMEOUT):
    def decorator(view_func):
        def wrapped(self, request, *args, **kwargs):
            cache_key = f"{key_prefix}:{request.get_full_path()}"
            cached = cache.get(cache_key)
            if cached is not None:
                from rest_framework.response import Response
                return Response(json.loads(cached))

            response = view_func(self, request, *args, **kwargs)
            if response.status_code == 200:
                cache.set(cache_key, json.dumps(response.data), timeout)
            return response
        return wrapped
    return decorator
