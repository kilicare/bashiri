"""
tips/verification/__init__.py

Centralized tip verification engine.

This module provides market-specific resolution logic for tips.
All verification logic must go through this engine.
"""

from .engine import VerificationEngine, verify_tip, VerificationResult

__all__ = ['VerificationEngine', 'verify_tip', 'VerificationResult']
