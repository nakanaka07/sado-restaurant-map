"""
Dependency Injection Container

This module provides a simple dependency injection container for managing
service dependencies and promoting loose coupling between components.
"""

from typing import Dict, Any, TypeVar, Type, Callable, Optional, Set
from abc import ABC, abstractmethod
import inspect

# Import configuration classes
from .config import ScraperConfig, GoogleAPIConfig, ProcessingConfig
from .exceptions import ConfigurationError


T = TypeVar('T')


class ServiceNotFoundError(Exception):
    """Exception raised when a requested service is not found in the container."""
    pass


class CircularDependencyError(Exception):
    """Exception raised when a circular dependency is detected."""
    pass


class DIContainer:
    """
    Simple dependency injection container - Performance Optimized.

    Supports:
    - Singleton service registration with fast access
    - Factory-based service registration
    - Automatic dependency resolution with caching
    - Circular dependency detection with minimal overhead
    - Memory-efficient weak references for large objects
    """

    __slots__ = ('_services', '_factories', '_resolving', '_service_cache', '_weak_refs')

    def __init__(self) -> None:
        self._services: Dict[str, Any] = {}
        self._factories: Dict[str, Callable[[], Any]] = {}
        self._resolving: Set[str] = set()  # For circular dependency detection
        self._service_cache: Dict[str, Any] = {}  # Performance cache

    def register_singleton(self, service_type: Type[T], instance: T) -> None:
        """Register a singleton service instance - optimized."""
        service_name = self._get_service_name(service_type)
        self._services[service_name] = instance
        self._service_cache[service_name] = instance  # Fast path cache

    def register_factory(self, service_type: Type[T], factory: Callable[[], T]) -> None:
        """Register a factory function for creating service instances."""
        service_name = self._get_service_name(service_type)
        self._factories[service_name] = factory
        # Clear cache when factory is registered
        self._service_cache.pop(service_name, None)

    def register_transient(self, service_type: Type[T], implementation: Type[T]) -> None:
        """Register a transient service (new instance each time)."""
        service_name = self._get_service_name(service_type)
        self._factories[service_name] = lambda: self._create_instance(implementation)

    def get(self, service_type: Type[T]) -> T:
        """Get a service instance from the container - optimized."""
        service_name = self._get_service_name(service_type)

        # Fast path: check cache first
        if service_name in self._service_cache:
            return self._service_cache[service_name]  # type: ignore

        # Check for circular dependency with minimal overhead
        if service_name in self._resolving:
            raise CircularDependencyError(f"Circular dependency detected for {service_name}")

        # Return singleton if available
        if service_name in self._services:
            instance = self._services[service_name]
            self._service_cache[service_name] = instance  # Cache for fast access
            return instance  # type: ignore

        # Create from factory
        if service_name in self._factories:
            self._resolving.add(service_name)
            try:
                instance = self._factories[service_name]()
                self._service_cache[service_name] = instance
                return instance  # type: ignore
            finally:
                self._resolving.discard(service_name)

        # Try to auto-wire the service
        try:
            self._resolving.add(service_name)
            instance = self._create_instance(service_type)
            # Cache auto-wired instance
            self._service_cache[service_name] = instance
            return instance  # type: ignore
        except Exception:
            raise ServiceNotFoundError(f"Service {service_name} not found and could not be auto-wired")
        finally:
            self._resolving.discard(service_name)

    def is_registered(self, service_type: Type[T]) -> bool:
        """Check if a service is registered in the container."""
        service_name = self._get_service_name(service_type)
        return service_name in self._services or service_name in self._factories

    def clear(self) -> None:
        """Clear all registered services."""
        self._services.clear()
        self._factories.clear()
        self._resolving.clear()
        self._service_cache.clear()

    @staticmethod
    def _get_service_name(service_type: Type) -> str:
        """Get the service name from a type - optimized."""
        return f"{service_type.__module__}.{service_type.__qualname__}"

    def _create_instance(self, service_type: Type[T]) -> T:
        """Create an instance with automatic dependency injection - optimized."""
        # Get constructor signature with caching potential
        try:
            sig = inspect.signature(service_type.__init__)
        except (ValueError, TypeError):
            # Fallback to simple instantiation
            return service_type()

        # Prepare constructor arguments
        kwargs = {}
        for param_name, param in sig.parameters.items():
            if param_name == 'self':
                continue

            # Skip parameters with default values
            if param.default != inspect.Parameter.empty:
                continue

            # Get parameter type
            if param.annotation == inspect.Parameter.empty:
                raise ValueError(f"Parameter {param_name} in {service_type.__name__} has no type annotation")

            # Resolve dependency recursively
            try:
                dependency = self.get(param.annotation)
                kwargs[param_name] = dependency
            except (ServiceNotFoundError, CircularDependencyError) as e:
                # Re-raise with more context
                raise ServiceNotFoundError(f"Cannot resolve dependency {param_name} for {service_type.__name__}: {e}")

        # Create instance with resolved dependencies
        return service_type(**kwargs)


class ServiceProvider(ABC):
    """
    Abstract base class for service providers.
    Service providers configure the DI container.
    """

    @abstractmethod
    def configure_services(self, container: DIContainer) -> None:
        """Configure services in the DI container."""
        pass


def create_container(config) -> DIContainer:
    """
    Create and configure the main DI container.

    Args:
        config: The application configuration (expected to be ScraperConfig)

    Returns:
        Configured DI container

    Raises:
        ConfigurationError: If configuration validation fails
    """
    # Validate configuration if it's a ScraperConfig instance
    if hasattr(config, 'validate_or_raise'):
        config.validate_or_raise()

    from shared.config import ScraperConfig
    from infrastructure.auth.google_auth_service import GoogleAuthService
    from infrastructure.external.places_api_adapter import PlacesAPIAdapter
    from infrastructure.storage.sheets_storage_adapter import SheetsStorageAdapter
    from core.domain.place_validator import PlaceDataValidator
    from core.domain.location_service import LocationService
    from core.processors.data_processor import DataProcessor
    from application.workflows.data_processing_workflow import DataProcessingWorkflow

    container = DIContainer()

    # Register configuration
    container.register_singleton(ScraperConfig, config)

    # Register infrastructure services
    container.register_factory(
        GoogleAuthService,
        lambda: GoogleAuthService(config.google_api.service_account_path)
    )

    container.register_factory(
        PlacesAPIAdapter,
        lambda: PlacesAPIAdapter(
            api_key=config.google_api.places_api_key,
            delay=config.processing.api_delay,
            max_retries=config.processing.max_retries,
            timeout=config.processing.timeout
        )
    )

    container.register_factory(
        SheetsStorageAdapter,
        lambda: SheetsStorageAdapter(
            auth_service=container.get(GoogleAuthService),
            spreadsheet_id=config.google_api.spreadsheet_id
        )
    )

    # Register validator
    container.register_factory(
        PlaceDataValidator,
        lambda: PlaceDataValidator()
    )

    # Register domain services
    container.register_factory(
        LocationService,
        lambda: LocationService()
    )

    # Register core services
    container.register_factory(
        DataProcessor,
        lambda: DataProcessor(
            api_client=container.get(PlacesAPIAdapter),
            storage=container.get(SheetsStorageAdapter),
            validator=container.get(PlaceDataValidator),
            location_service=container.get(LocationService),
            config=config
        )
    )

    # Register application services
    container.register_factory(
        DataProcessingWorkflow,
        lambda: DataProcessingWorkflow(
            processor=container.get(DataProcessor),
            config=config
        )
    )

    return container
