"""
Domain Interfaces and Contracts

This module defines the interfaces and contracts for the core domain services.
These abstractions enable dependency inversion and make the system more testable.
"""

from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass


@dataclass
class ProcessingResult:
    """Result of a data processing operation."""
    success: bool
    processed_count: int = 0
    error_count: int = 0
    errors: List[str] = None
    data: Optional[Dict[str, Any]] = None

    def __post_init__(self):
        if self.errors is None:
            self.errors = []


class DataStorage(ABC):
    """Abstract interface for data storage operations."""

    @abstractmethod
    def save(self, data: Dict[str, Any], category: str) -> bool:
        """
        Save data to storage.

        Args:
            data: The data to save
            category: The category/type of data

        Returns:
            True if successful, False otherwise
        """
        pass

    @abstractmethod
    def load(self, identifier: str, category: str) -> Optional[Dict[str, Any]]:
        """
        Load data from storage.

        Args:
            identifier: Unique identifier for the data
            category: The category/type of data

        Returns:
            The loaded data or None if not found
        """
        pass

    @abstractmethod
    def exists(self, identifier: str, category: str) -> bool:
        """
        Check if data exists in storage.

        Args:
            identifier: Unique identifier for the data
            category: The category/type of data

        Returns:
            True if data exists, False otherwise
        """
        pass

    @abstractmethod
    def delete(self, identifier: str, category: str) -> bool:
        """
        Delete data from storage.

        Args:
            identifier: Unique identifier for the data
            category: The category/type of data

        Returns:
            True if successful, False otherwise
        """
        pass


class APIClient(ABC):
    """Abstract interface for external API client operations."""

    @abstractmethod
    def fetch_place_details(self, place_id: str) -> Optional[Dict[str, Any]]:
        """
        Fetch detailed information for a specific place.

        Args:
            place_id: The unique place identifier

        Returns:
            Place details or None if not found
        """
        pass

    @abstractmethod
    def search_places(self, query: str, location: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Search for places matching a query.

        Args:
            query: The search query
            location: Optional location constraint

        Returns:
            List of matching places
        """
        pass

    @abstractmethod
    def is_healthy(self) -> bool:
        """
        Check if the API client is healthy and can make requests.

        Returns:
            True if healthy, False otherwise
        """
        pass


class DataValidator(ABC):
    """Abstract interface for data validation operations."""

    @abstractmethod
    def validate(self, data: Dict[str, Any]) -> ProcessingResult:
        """
        Validate and normalize data.

        Args:
            data: The data to validate

        Returns:
            ProcessingResult with validation outcome
        """
        pass

    @abstractmethod
    def validate_batch(self, data_list: List[Dict[str, Any]]) -> ProcessingResult:
        """
        Validate a batch of data items.

        Args:
            data_list: List of data items to validate

        Returns:
            ProcessingResult with validation outcome
        """
        pass


class DataProcessor(ABC):
    """Abstract interface for data processing operations."""

    @abstractmethod
    def process_single(self, item: Dict[str, Any], category: str) -> ProcessingResult:
        """
        Process a single data item.

        Args:
            item: The data item to process
            category: The category of the item

        Returns:
            ProcessingResult with processing outcome
        """
        pass

    @abstractmethod
    def process_batch(self, items: List[Dict[str, Any]], category: str) -> ProcessingResult:
        """
        Process a batch of data items.

        Args:
            items: List of data items to process
            category: The category of the items

        Returns:
            ProcessingResult with processing outcome
        """
        pass


class AuthenticationService(ABC):
    """Abstract interface for authentication services."""

    @abstractmethod
    def authenticate(self) -> bool:
        """
        Perform authentication.

        Returns:
            True if authentication successful, False otherwise
        """
        pass

    @abstractmethod
    def get_credentials(self) -> Optional[Any]:
        """
        Get authentication credentials.

        Returns:
            Credentials object or None if not authenticated
        """
        pass

    @abstractmethod
    def is_authenticated(self) -> bool:
        """
        Check if currently authenticated.

        Returns:
            True if authenticated, False otherwise
        """
        pass


class Logger(ABC):
    """Abstract interface for logging operations."""

    @abstractmethod
    def debug(self, message: str, **kwargs) -> None:
        """Log debug message."""
        pass

    @abstractmethod
    def info(self, message: str, **kwargs) -> None:
        """Log info message."""
        pass

    @abstractmethod
    def warning(self, message: str, **kwargs) -> None:
        """Log warning message."""
        pass

    @abstractmethod
    def error(self, message: str, **kwargs) -> None:
        """Log error message."""
        pass

    @abstractmethod
    def critical(self, message: str, **kwargs) -> None:
        """Log critical message."""
        pass


class EventBus(ABC):
    """Abstract interface for event publishing and subscription."""

    @abstractmethod
    def publish(self, event_type: str, data: Dict[str, Any]) -> None:
        """
        Publish an event.

        Args:
            event_type: Type of the event
            data: Event data
        """
        pass

    @abstractmethod
    def subscribe(self, event_type: str, handler: callable) -> None:
        """
        Subscribe to an event type.

        Args:
            event_type: Type of event to subscribe to
            handler: Function to handle the event
        """
        pass

    @abstractmethod
    def unsubscribe(self, event_type: str, handler: callable) -> None:
        """
        Unsubscribe from an event type.

        Args:
            event_type: Type of event to unsubscribe from
            handler: Function to remove from handlers
        """
        pass
