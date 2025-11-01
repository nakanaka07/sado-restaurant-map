#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Tests for Domain Interfaces

Tests for abstract interfaces defined in core.domain.interfaces module.
"""

import pytest
from abc import ABC
from typing import Dict, List, Optional, Any
from unittest.mock import Mock

from core.domain.interfaces import (
    ProcessingResult,
    DataStorage,
    APIClient,
    DataValidator,
    DataProcessor,
    AuthenticationService,
    Logger,
    EventBus,
)


class TestProcessingResult:
    """Test cases for ProcessingResult dataclass."""

    def test_create_successful_result(self):
        """Test creating successful result."""
        result = ProcessingResult(
            success=True,
            processed_count=10,
            error_count=0,
        )

        assert result.success is True
        assert result.processed_count == 10
        assert result.error_count == 0
        assert result.errors == []
        assert result.data is None

    def test_create_failed_result(self):
        """Test creating failed result with errors."""
        errors = ["Error 1", "Error 2"]
        result = ProcessingResult(
            success=False,
            processed_count=5,
            error_count=2,
            errors=errors,
        )

        assert result.success is False
        assert result.error_count == 2
        assert len(result.errors) == 2

    def test_post_init_default_errors(self):
        """Test that errors list is initialized if None."""
        result = ProcessingResult(
            success=True,
            processed_count=1,
        )

        assert result.errors == []


class TestDataStorageInterface:
    """Test cases for DataStorage interface."""

    def test_is_abstract(self):
        """Test that DataStorage is abstract."""
        assert issubclass(DataStorage, ABC)

    def test_cannot_instantiate(self):
        """Test that DataStorage cannot be instantiated."""
        with pytest.raises(TypeError):
            DataStorage()  # type: ignore[abstract]

    def test_save_method_signature(self):
        """Test save method is defined."""
        assert hasattr(DataStorage, "save")

    def test_load_method_signature(self):
        """Test load method is defined."""
        assert hasattr(DataStorage, "load")

    def test_exists_method_signature(self):
        """Test exists method is defined."""
        assert hasattr(DataStorage, "exists")

    def test_delete_method_signature(self):
        """Test delete method is defined."""
        assert hasattr(DataStorage, "delete")

    def test_concrete_implementation(self):
        """Test that concrete implementation works."""

        class ConcreteStorage(DataStorage):
            def save(self, data: List[Dict[str, Any]], category: str) -> bool:
                return True

            def load(self, identifier: str, category: str) -> Optional[Dict[str, Any]]:
                return {"id": identifier}

            def exists(self, identifier: str, category: str) -> bool:
                return True

            def delete(self, identifier: str, category: str) -> bool:
                return True

        storage = ConcreteStorage()
        assert storage.save([], "test") is True
        assert storage.load("123", "test") == {"id": "123"}
        assert storage.exists("123", "test") is True
        assert storage.delete("123", "test") is True


class TestAPIClientInterface:
    """Test cases for APIClient interface."""

    def test_is_abstract(self):
        """Test that APIClient is abstract."""
        assert issubclass(APIClient, ABC)

    def test_cannot_instantiate(self):
        """Test that APIClient cannot be instantiated."""
        with pytest.raises(TypeError):
            APIClient()  # type: ignore[abstract]

    def test_fetch_place_details_method(self):
        """Test fetch_place_details method is defined."""
        assert hasattr(APIClient, "fetch_place_details")

    def test_search_places_method(self):
        """Test search_places method is defined."""
        assert hasattr(APIClient, "search_places")

    def test_is_healthy_method(self):
        """Test is_healthy method is defined."""
        assert hasattr(APIClient, "is_healthy")

    def test_concrete_implementation(self):
        """Test concrete implementation of APIClient."""

        class ConcreteAPIClient(APIClient):
            def fetch_place_details(self, place_id: str) -> Optional[Dict[str, Any]]:
                return {"id": place_id, "name": "Test Place"}

            def search_places(
                self, query: str, location: Optional[str] = None
            ) -> List[Dict[str, Any]]:
                return [{"id": "1", "name": query}]

            def is_healthy(self) -> bool:
                return True

        client = ConcreteAPIClient()
        assert client.fetch_place_details("123") == {"id": "123", "name": "Test Place"}
        assert len(client.search_places("test")) == 1
        assert client.is_healthy() is True


class TestDataValidatorInterface:
    """Test cases for DataValidator interface."""

    def test_is_abstract(self):
        """Test that DataValidator is abstract."""
        assert issubclass(DataValidator, ABC)

    def test_validate_method(self):
        """Test validate method is defined."""
        assert hasattr(DataValidator, "validate")

    def test_validate_batch_method(self):
        """Test validate_batch method is defined."""
        assert hasattr(DataValidator, "validate_batch")

    def test_concrete_implementation(self):
        """Test concrete implementation."""

        class ConcreteValidator(DataValidator):
            def validate(self, data: Dict[str, Any]) -> ProcessingResult:
                return ProcessingResult(success=True, processed_count=1)

            def validate_batch(
                self, data_list: List[Dict[str, Any]]
            ) -> ProcessingResult:
                return ProcessingResult(success=True, processed_count=len(data_list))

        validator = ConcreteValidator()
        result = validator.validate({"test": "data"})
        assert result.success is True

        batch_result = validator.validate_batch([{}, {}, {}])
        assert batch_result.processed_count == 3


class TestDataProcessorInterface:
    """Test cases for DataProcessor interface."""

    def test_is_abstract(self):
        """Test that DataProcessor is abstract."""
        assert issubclass(DataProcessor, ABC)

    def test_process_single_method(self):
        """Test process_single method is defined."""
        assert hasattr(DataProcessor, "process_single")

    def test_process_batch_method(self):
        """Test process_batch method is defined."""
        assert hasattr(DataProcessor, "process_batch")


class TestAuthenticationServiceInterface:
    """Test cases for AuthenticationService interface."""

    def test_is_abstract(self):
        """Test that AuthenticationService is abstract."""
        assert issubclass(AuthenticationService, ABC)

    def test_authenticate_method(self):
        """Test authenticate method is defined."""
        assert hasattr(AuthenticationService, "authenticate")

    def test_get_credentials_method(self):
        """Test get_credentials method is defined."""
        assert hasattr(AuthenticationService, "get_credentials")

    def test_is_authenticated_method(self):
        """Test is_authenticated method is defined."""
        assert hasattr(AuthenticationService, "is_authenticated")


class TestLoggerInterface:
    """Test cases for Logger interface."""

    def test_is_abstract(self):
        """Test that Logger is abstract."""
        assert issubclass(Logger, ABC)

    def test_has_logging_methods(self):
        """Test that Logger has all logging methods."""
        assert hasattr(Logger, "debug")
        assert hasattr(Logger, "info")
        assert hasattr(Logger, "warning")
        assert hasattr(Logger, "error")
        assert hasattr(Logger, "critical")

    def test_concrete_logger_implementation(self):
        """Test concrete logger implementation."""

        class ConcreteLogger(Logger):
            def __init__(self):
                self.logs = []

            def debug(self, message: str, **kwargs) -> None:
                self.logs.append(("DEBUG", message, kwargs))

            def info(self, message: str, **kwargs) -> None:
                self.logs.append(("INFO", message, kwargs))

            def warning(self, message: str, **kwargs) -> None:
                self.logs.append(("WARNING", message, kwargs))

            def error(self, message: str, **kwargs) -> None:
                self.logs.append(("ERROR", message, kwargs))

            def critical(self, message: str, **kwargs) -> None:
                self.logs.append(("CRITICAL", message, kwargs))

        logger = ConcreteLogger()
        logger.info("Test message", key="value")

        assert len(logger.logs) == 1
        assert logger.logs[0][0] == "INFO"
        assert logger.logs[0][1] == "Test message"
        assert logger.logs[0][2]["key"] == "value"


class TestEventBusInterface:
    """Test cases for EventBus interface."""

    def test_is_abstract(self):
        """Test that EventBus is abstract."""
        assert issubclass(EventBus, ABC)

    def test_publish_method(self):
        """Test publish method is defined."""
        assert hasattr(EventBus, "publish")

    def test_subscribe_method(self):
        """Test subscribe method is defined."""
        assert hasattr(EventBus, "subscribe")

    def test_unsubscribe_method(self):
        """Test unsubscribe method is defined."""
        assert hasattr(EventBus, "unsubscribe")

    def test_concrete_event_bus_implementation(self):
        """Test concrete EventBus implementation."""

        class ConcreteEventBus(EventBus):
            def __init__(self):
                self.handlers = {}

            def publish(self, event_type: str, data: Dict[str, Any]) -> None:
                if event_type in self.handlers:
                    for handler in self.handlers[event_type]:
                        handler(data)

            def subscribe(self, event_type: str, handler) -> None:
                if event_type not in self.handlers:
                    self.handlers[event_type] = []
                self.handlers[event_type].append(handler)

            def unsubscribe(self, event_type: str, handler) -> None:
                if event_type in self.handlers:
                    self.handlers[event_type].remove(handler)

        event_bus = ConcreteEventBus()
        called = []

        def handler(data):
            called.append(data)

        event_bus.subscribe("test_event", handler)
        event_bus.publish("test_event", {"message": "Hello"})

        assert len(called) == 1
        assert called[0]["message"] == "Hello"


class TestInterfaceIntegration:
    """Test integration between interfaces."""

    def test_all_interfaces_are_abstract(self):
        """Test that all interfaces are abstract base classes."""
        interfaces = [
            DataStorage,
            APIClient,
            DataValidator,
            DataProcessor,
            AuthenticationService,
            Logger,
            EventBus,
        ]

        for interface in interfaces:
            assert issubclass(interface, ABC)

    def test_interfaces_have_correct_methods(self):
        """Test that interfaces define expected methods."""
        # DataStorage
        assert hasattr(DataStorage, "save")
        assert hasattr(DataStorage, "load")

        # APIClient
        assert hasattr(APIClient, "fetch_place_details")
        assert hasattr(APIClient, "is_healthy")

        # Logger
        assert hasattr(Logger, "info")
        assert hasattr(Logger, "error")
