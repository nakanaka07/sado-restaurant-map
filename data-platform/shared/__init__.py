"""
🔗 Shared Libraries and Utilities

This package contains common utilities, constants, types,
and other shared components used across the application.

Performance optimizations:
- Lazy loading of heavy modules
- Cached imports for frequently used components
- Memory-efficient service initialization
"""

# Performance optimization: Lazy imports to reduce startup time
import os
import sys
from typing import TYPE_CHECKING, Any, Dict, Optional

# Type checking imports (no runtime cost)
if TYPE_CHECKING:
    from .cache_service import CacheService, CacheConfig
    from .ml_engine import MLEngine
    from .smart_orchestrator import SmartOrchestrator
    from .container import DIContainer
    from .performance_monitor import PerformanceMonitor

# Module cache for lazy loading
_module_cache: Dict[str, Any] = {}


def get_cache_service(config: Optional['CacheConfig'] = None) -> 'CacheService':
    """Lazy load cache service to reduce memory footprint."""
    if 'cache_service' not in _module_cache:
        from .cache_service import CacheService, CacheConfig
        if config is None:
            # Create minimal config for basic operation
            config = CacheConfig(redis_nodes=[])
        _module_cache['cache_service'] = CacheService(config)
    return _module_cache['cache_service']


def get_ml_engine() -> 'MLEngine':
    """Lazy load ML engine for memory efficiency."""
    if 'ml_engine' not in _module_cache:
        from .ml_engine import MLEngine
        _module_cache['ml_engine'] = MLEngine()
    return _module_cache['ml_engine']


def get_smart_orchestrator() -> 'SmartOrchestrator':
    """Lazy load smart orchestrator."""
    if 'smart_orchestrator' not in _module_cache:
        from .smart_orchestrator import SmartOrchestrator
        cache_service = get_cache_service()
        performance_monitor = get_performance_monitor()
        _module_cache['smart_orchestrator'] = SmartOrchestrator(
            cache_service=cache_service,
            performance_monitor=performance_monitor
        )
    return _module_cache['smart_orchestrator']


def get_container() -> 'DIContainer':
    """Lazy load DI container."""
    if 'container' not in _module_cache:
        from .container import DIContainer, create_container
        from .config import ScraperConfig, GoogleAPIConfig, ProcessingConfig

        # Create minimal config for basic DI container operation
        google_config = GoogleAPIConfig(
            places_api_key=os.getenv('PLACES_API_KEY', 'dummy_key_for_init'),
            service_account_path=os.getenv('GOOGLE_SERVICE_ACCOUNT_PATH'),
            spreadsheet_id=os.getenv('SPREADSHEET_ID')
        )
        processing_config = ProcessingConfig()
        config = ScraperConfig(google_api=google_config, processing=processing_config)

        _module_cache['container'] = create_container(config)
    return _module_cache['container']


def get_performance_monitor() -> 'PerformanceMonitor':
    """Lazy load performance monitor."""
    if 'performance_monitor' not in _module_cache:
        from .performance_monitor import PerformanceMonitor
        _module_cache['performance_monitor'] = PerformanceMonitor()
    return _module_cache['performance_monitor']


def clear_module_cache() -> None:
    """Clear module cache for testing or memory cleanup."""
    global _module_cache
    _module_cache.clear()


# Export optimized interface
__all__ = [
    'get_cache_service',
    'get_ml_engine',
    'get_smart_orchestrator',
    'get_container',
    'get_performance_monitor',
    'clear_module_cache'
]
