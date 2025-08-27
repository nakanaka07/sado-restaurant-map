"""
Dependency Injection Container

This module provides a simple dependency injection container for managing
service dependencies and promoting loose coupling between components.
"""

from typing import Dict, Any, TypeVar, Type, Callable, Optional
from abc import ABC, abstractmethod
import inspect


T = TypeVar('T')


class ServiceNotFoundError(Exception):
    """Exception raised when a requested service is not found in the container."""
    pass


class CircularDependencyError(Exception):
    """Exception raised when a circular dependency is detected."""
    pass


class DIContainer:
    """
    Simple dependency injection container.
    
    Supports:
    - Singleton service registration
    - Factory-based service registration
    - Automatic dependency resolution
    - Circular dependency detection
    """
    
    def __init__(self):
        self._services: Dict[str, Any] = {}
        self._factories: Dict[str, Callable] = {}
        self._resolving: set = set()  # For circular dependency detection
    
    def register_singleton(self, service_type: Type[T], instance: T) -> None:
        """Register a singleton service instance."""
        service_name = self._get_service_name(service_type)
        self._services[service_name] = instance
    
    def register_factory(self, service_type: Type[T], factory: Callable[[], T]) -> None:
        """Register a factory function for creating service instances."""
        service_name = self._get_service_name(service_type)
        self._factories[service_name] = factory
    
    def register_transient(self, service_type: Type[T], implementation: Type[T]) -> None:
        """Register a transient service (new instance each time)."""
        service_name = self._get_service_name(service_type)
        self._factories[service_name] = lambda: self._create_instance(implementation)
    
    def get(self, service_type: Type[T]) -> T:
        """Get a service instance from the container."""
        service_name = self._get_service_name(service_type)
        
        # Check for circular dependency
        if service_name in self._resolving:
            raise CircularDependencyError(f"Circular dependency detected for {service_name}")
        
        # Return singleton if available
        if service_name in self._services:
            return self._services[service_name]
        
        # Create from factory
        if service_name in self._factories:
            self._resolving.add(service_name)
            try:
                instance = self._factories[service_name]()
                return instance
            finally:
                self._resolving.discard(service_name)
        
        # Try to auto-wire the service
        try:
            self._resolving.add(service_name)
            instance = self._create_instance(service_type)
            return instance
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
    
    def _get_service_name(self, service_type: Type) -> str:
        """Get the service name from a type."""
        return f"{service_type.__module__}.{service_type.__name__}"
    
    def _create_instance(self, service_type: Type[T]) -> T:
        """Create an instance with automatic dependency injection."""
        # Get constructor signature
        sig = inspect.signature(service_type.__init__)
        
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
            
            # Resolve dependency
            dependency = self.get(param.annotation)
            kwargs[param_name] = dependency
        
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
        config: The application configuration
        
    Returns:
        Configured DI container
    """
    from shared.config.settings import ScraperConfig
    from infrastructure.auth.google_auth import GoogleAuthService
    from infrastructure.external.places_client import PlacesAPIClient
    from infrastructure.storage.sheets_manager import SheetsManager
    
    container = DIContainer()
    
    # Register configuration
    container.register_singleton(ScraperConfig, config)
    
    # Register infrastructure services
    container.register_factory(
        GoogleAuthService,
        lambda: GoogleAuthService(config.google_api.service_account_path)
    )
    
    container.register_factory(
        PlacesAPIClient,
        lambda: PlacesAPIClient(
            api_key=config.google_api.places_api_key,
            delay=config.processing.api_delay,
            max_retries=config.processing.max_retries,
            timeout=config.processing.timeout
        )
    )
    
    container.register_factory(
        SheetsManager,
        lambda: SheetsManager(
            auth_service=container.get(GoogleAuthService),
            spreadsheet_id=config.google_api.spreadsheet_id
        )
    )
    
    return container