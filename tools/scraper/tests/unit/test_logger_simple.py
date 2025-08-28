"""
Unit tests for logging system.
"""
import pytest
from shared.logger import ContextualLogger, LogContext


class TestLogContext:
    """Test LogContext class."""

    def test_context_creation(self):
        """Test creating a log context."""
        context = LogContext(operation="test_operation")
        context.add_metadata("key", "value")

        assert context.operation == "test_operation"
        assert context.metadata["key"] == "value"
        assert hasattr(context, "start_time")

    def test_context_duration(self):
        """Test context duration calculation."""
        context = LogContext(operation="test_operation")

        # Duration should be close to 0 for new context
        duration = context.get_duration()
        assert duration >= 0
        assert duration < 1.0  # Should be very small for immediate check


class TestContextualLogger:
    """Test ContextualLogger class."""

    def test_logger_creation(self):
        """Test creating a contextual logger."""
        logger = ContextualLogger("test_logger")

        assert logger.name == "test_logger"
        assert hasattr(logger, "_logger")  # Internal logger attribute

    def test_basic_logging(self):
        """Test basic logging functionality."""
        logger = ContextualLogger("test_logger")

        # Test that logging methods exist and can be called
        logger.info("Test message")
        logger.error("Error message")
        logger.warning("Warning message")
        logger.debug("Debug message")

        # If no exception is raised, the test passes

    def test_context_logging(self):
        """Test context-aware logging."""
        logger = ContextualLogger("test_logger")

        # Create a context
        context = LogContext("test_operation")
        context.add_metadata("test_key", "test_value")

        # Test logging with context (should not raise exceptions)
        logger.info("Context message", context=context)

    def test_error_logging_with_exception(self):
        """Test error logging with exception information."""
        logger = ContextualLogger("test_logger")

        try:
            raise ValueError("Test exception")
        except ValueError as e:
            # Test logging exception (should not raise)
            logger.error("Error occurred", exception=e)
