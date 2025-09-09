"""
Interface Layer

This package contains all external interfaces including CLI,
web adapters, and other integration points.
"""

from .cli.main import main

__all__ = [
    'main',
]
