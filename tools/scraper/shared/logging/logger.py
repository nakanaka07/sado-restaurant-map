"""
Structured Logging Implementation

This module provides structured logging with JSON output, context management,
and performance monitoring for the scraper application.
"""

import logging
import json
import time
from typing import Dict, Any, Optional, Union
from datetime import datetime
from pathlib import Path
from contextlib import contextmanager
import threading

from core.domain.interfaces import Logger as LoggerInterface
from shared.exceptions import get_error_category, get_error_severity


class StructuredLogger(LoggerInterface):
    """
    Structured logger implementation with JSON output and context management.
    """

    def __init__(self, name: str, config: Optional[Dict[str, Any]] = None):
        self.name = name
        self.logger = logging.getLogger(name)
        self.config = config or {}
        self._context = threading.local()

        # Configure logger if not already configured
        if not self.logger.handlers:
            self._configure_logger()

    def _configure_logger(self) -> None:
        """Configure the logger with appropriate handlers and formatters."""
        level = getattr(logging, self.config.get('level', 'INFO').upper())
        self.logger.setLevel(level)

        # Console handler
        if self.config.get('console_enabled', True):
            console_handler = logging.StreamHandler()
            console_handler.setLevel(level)
            console_formatter = StructuredFormatter(include_colors=True)
            console_handler.setFormatter(console_formatter)
            self.logger.addHandler(console_handler)

        # File handler
        if self.config.get('file_enabled', True):
            log_file = Path(self.config.get('file_path', 'logs/scraper.log'))
            log_file.parent.mkdir(parents=True, exist_ok=True)

            file_handler = logging.FileHandler(log_file, encoding='utf-8')
            file_handler.setLevel(level)
            file_formatter = StructuredFormatter(include_colors=False)
            file_handler.setFormatter(file_formatter)
            self.logger.addHandler(file_handler)

        # Prevent propagation to avoid duplicate logs
        self.logger.propagate = False

    def _get_context(self) -> Dict[str, Any]:
        """Get current thread-local context."""
        return getattr(self._context, 'data', {})

    def _set_context(self, context: Dict[str, Any]) -> None:
        """Set thread-local context."""
        self._context.data = context

    def set_context(self, **kwargs) -> None:
        """Set context variables for this thread."""
        current_context = self._get_context()
        current_context.update(kwargs)
        self._set_context(current_context)

    def clear_context(self) -> None:
        """Clear all context variables for this thread."""
        self._set_context({})

    @contextmanager
    def context(self, **kwargs):
        """Context manager for temporary context variables."""
        old_context = self._get_context().copy()
        try:
            self.set_context(**kwargs)
            yield
        finally:
            self._set_context(old_context)

    def _log(self, level: int, message: str, **kwargs) -> None:
        """Internal logging method with structured data."""
        log_data = {
            'timestamp': datetime.utcnow().isoformat(),
            'level': logging.getLevelName(level),
            'logger': self.name,
            'message': message,
            'thread_id': threading.get_ident(),
        }

        # Add context data
        log_data.update(self._get_context())

        # Add additional keyword arguments
        if kwargs:
            log_data['extra'] = kwargs

        # Log the structured data
        self.logger.log(level, json.dumps(log_data, ensure_ascii=False))

    def debug(self, message: str, **kwargs) -> None:
        """Log debug message."""
        self._log(logging.DEBUG, message, **kwargs)

    def info(self, message: str, **kwargs) -> None:
        """Log info message."""
        self._log(logging.INFO, message, **kwargs)

    def warning(self, message: str, **kwargs) -> None:
        """Log warning message."""
        self._log(logging.WARNING, message, **kwargs)

    def error(self, message: str, **kwargs) -> None:
        """Log error message."""
        self._log(logging.ERROR, message, **kwargs)

    def critical(self, message: str, **kwargs) -> None:
        """Log critical message."""
        self._log(logging.CRITICAL, message, **kwargs)

    def exception(self, message: str, exc_info: Exception, **kwargs) -> None:
        """Log exception with structured error information."""
        error_data = {
            'exception_type': type(exc_info).__name__,
            'exception_message': str(exc_info),
            'error_category': get_error_category(exc_info),
            'error_severity': get_error_severity(exc_info),
        }

        if hasattr(exc_info, 'details'):
            error_data['error_details'] = exc_info.details

        kwargs.update(error_data)
        self._log(logging.ERROR, message, **kwargs)


class StructuredFormatter(logging.Formatter):
    """Custom formatter for structured log output."""

    def __init__(self, include_colors: bool = False):
        super().__init__()
        self.include_colors = include_colors

        # ANSI color codes
        self.colors = {
            'DEBUG': '\033[36m',    # Cyan
            'INFO': '\033[32m',     # Green
            'WARNING': '\033[33m',  # Yellow
            'ERROR': '\033[31m',    # Red
            'CRITICAL': '\033[35m', # Magenta
            'RESET': '\033[0m',     # Reset
        }

    def format(self, record: logging.LogRecord) -> str:
        """Format log record."""
        try:
            # Try to parse as JSON
            log_data = json.loads(record.getMessage())

            if self.include_colors:
                return self._format_colored(log_data)
            else:
                return self._format_plain(log_data)

        except (json.JSONDecodeError, ValueError):
            # Fallback to standard formatting
            return super().format(record)

    def _format_colored(self, log_data: Dict[str, Any]) -> str:
        """Format with colors for console output."""
        level = log_data.get('level', 'INFO')
        color = self.colors.get(level, '')
        reset = self.colors['RESET']

        timestamp = log_data.get('timestamp', '')[:19]  # Remove microseconds
        logger_name = log_data.get('logger', '')
        message = log_data.get('message', '')

        base_msg = f"{color}[{level}]{reset} {timestamp} {logger_name}: {message}"

        # Add extra context if available
        extra_parts = []
        for key, value in log_data.items():
            if key not in ['timestamp', 'level', 'logger', 'message', 'thread_id']:
                if key == 'extra' and isinstance(value, dict):
                    for k, v in value.items():
                        extra_parts.append(f"{k}={v}")
                else:
                    extra_parts.append(f"{key}={value}")

        if extra_parts:
            base_msg += f" | {', '.join(extra_parts)}"

        return base_msg

    def _format_plain(self, log_data: Dict[str, Any]) -> str:
        """Format as plain JSON for file output."""
        return json.dumps(log_data, ensure_ascii=False, separators=(',', ':'))


class PerformanceLogger:
    """Context manager for performance monitoring."""

    def __init__(self, logger: StructuredLogger, operation: str, **context):
        self.logger = logger
        self.operation = operation
        self.context = context
        self.start_time = None

    def __enter__(self):
        self.start_time = time.time()
        self.logger.debug(f"Started {self.operation}", operation=self.operation, **self.context)
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        duration = time.time() - self.start_time

        if exc_type is None:
            self.logger.info(
                f"Completed {self.operation}",
                operation=self.operation,
                duration_ms=round(duration * 1000, 2),
                **self.context
            )
        else:
            self.logger.error(
                f"Failed {self.operation}",
                operation=self.operation,
                duration_ms=round(duration * 1000, 2),
                error=str(exc_val),
                **self.context
            )


def get_logger(name: str, config: Optional[Dict[str, Any]] = None) -> StructuredLogger:
    """
    Get a structured logger instance.

    Args:
        name: Logger name (usually __name__)
        config: Optional configuration dictionary

    Returns:
        StructuredLogger instance
    """
    return StructuredLogger(name, config)


def setup_logging(config: Dict[str, Any]) -> None:
    """
    Setup global logging configuration.

    Args:
        config: Logging configuration dictionary
    """
    # Set root logger level
    root_logger = logging.getLogger()
    level = getattr(logging, config.get('level', 'INFO').upper())
    root_logger.setLevel(level)

    # Disable other loggers to reduce noise
    noisy_loggers = [
        'urllib3.connectionpool',
        'googleapiclient.discovery',
        'google.auth.transport.requests',
        'requests.packages.urllib3.connectionpool'
    ]

    for logger_name in noisy_loggers:
        logging.getLogger(logger_name).setLevel(logging.WARNING)
