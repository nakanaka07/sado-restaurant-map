"""
Advanced Structured Logging System

High-performance, structured logging with contextual information,
performance monitoring, and configurable output formats.
"""

import json
import logging
import logging.handlers
import time
import threading
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional, Union, ContextManager, Iterator, Generator
from dataclasses import dataclass, field

from shared.exceptions import ScraperError


@dataclass
class LoggingConfig:
    """Logging configuration settings."""
    level: str = "INFO"
    format: str = "structured"
    output_file: Optional[str] = None
    console_output: bool = True
    max_file_size_mb: int = 10
    backup_count: int = 5


@dataclass
class LogContext:
    """Logging context with performance and metadata tracking."""

    operation: str
    category: Optional[str] = None
    place_id: Optional[str] = None
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    correlation_id: Optional[str] = None
    start_time: float = field(default_factory=time.time)
    metadata: Dict[str, Any] = field(default_factory=dict)

    def add_metadata(self, key: str, value: Any) -> None:
        """Add metadata to the context."""
        self.metadata[key] = value

    def get_duration(self) -> float:
        """Get duration since context creation."""
        return time.time() - self.start_time


class ContextualFormatter(logging.Formatter):
    """Custom formatter for structured logging with context."""

    def __init__(self, format_type: str = "json"):
        super().__init__()
        self.format_type = format_type

    def format(self, record: logging.LogRecord) -> str:
        """Format log record with context information."""

        # Base log data
        log_data = self._create_base_log_data(record)

        # Add context if available
        self._add_context_data(record, log_data)

        # Add exception information
        self._add_exception_data(record, log_data)

        # Add custom attributes
        self._add_custom_attributes(record, log_data)

        return self._format_output(log_data)

    def _create_base_log_data(self, record: logging.LogRecord) -> Dict[str, Any]:
        """Create base log data structure."""
        return {
            'timestamp': datetime.fromtimestamp(record.created, tz=timezone.utc).isoformat(),
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno,
            'thread_id': record.thread,
            'process_id': record.process
        }

    def _add_context_data(self, record: logging.LogRecord, log_data: Dict[str, Any]) -> None:
        """Add context information to log data."""
        if hasattr(record, 'context') and record.context:
            context: LogContext = record.context
            log_data.update({
                'operation': context.operation,
                'category': context.category,
                'place_id': context.place_id,
                'user_id': context.user_id,
                'session_id': context.session_id,
                'correlation_id': context.correlation_id,
                'duration': context.get_duration(),
                'metadata': context.metadata
            })

    def _add_exception_data(self, record: logging.LogRecord, log_data: Dict[str, Any]) -> None:
        """Add exception information to log data."""
        if record.exc_info:
            log_data['exception'] = {
                'type': record.exc_info[0].__name__ if record.exc_info[0] else None,
                'message': str(record.exc_info[1]) if record.exc_info[1] else None,
                'traceback': self.formatException(record.exc_info)
            }

            # Add ScraperError details
            if isinstance(record.exc_info[1], ScraperError):
                error = record.exc_info[1]
                log_data['exception']['details'] = error.details

    def _add_custom_attributes(self, record: logging.LogRecord, log_data: Dict[str, Any]) -> None:
        """Add custom attributes to log data."""
        excluded_attrs = {
            'name', 'msg', 'args', 'levelname', 'levelno', 'pathname',
            'filename', 'module', 'lineno', 'funcName', 'created',
            'msecs', 'relativeCreated', 'thread', 'threadName',
            'processName', 'process', 'getMessage', 'exc_info',
            'exc_text', 'stack_info', 'context'
        }

        for key, value in record.__dict__.items():
            if key not in log_data and not key.startswith('_') and key not in excluded_attrs:
                log_data[key] = value

    def _format_output(self, log_data: Dict[str, Any]) -> str:
        """Format the final output based on format type."""
        if self.format_type == "json":
            return json.dumps(log_data, default=str, ensure_ascii=False)
        elif self.format_type == "structured":
            return self._format_structured(log_data)
        else:
            return self._format_simple(log_data)

    def _format_structured(self, data: Dict[str, Any]) -> str:
        """Format as human-readable structured text."""
        timestamp = data['timestamp']
        level = data['level']
        operation = data.get('operation', '')
        message = data['message']

        # Base line
        line = f"[{timestamp}] {level:8s} {operation:20s} {message}"

        # Add context details on new lines
        if data.get('category'):
            line += f"\n  └─ Category: {data['category']}"
        if data.get('place_id'):
            line += f"\n  └─ Place ID: {data['place_id']}"
        if data.get('duration'):
            line += f"\n  └─ Duration: {data['duration']:.3f}s"
        if data.get('metadata'):
            for key, value in data['metadata'].items():
                line += f"\n  └─ {key}: {value}"
        if data.get('exception'):
            exc = data['exception']
            line += f"\n  └─ Exception: {exc['type']}: {exc['message']}"

        return line

    def _format_simple(self, data: Dict[str, Any]) -> str:
        """Format as simple text."""
        timestamp = datetime.fromisoformat(data['timestamp'].replace('Z', '+00:00'))
        level = data['level']
        message = data['message']
        operation = data.get('operation', '')

        simple_format = f"{timestamp.strftime('%H:%M:%S')} {level[0]} [{operation}] {message}"

        if data.get('duration'):
            simple_format += f" ({data['duration']:.3f}s)"

        return simple_format


class ContextualLogger:
    """Context-aware logger with performance tracking."""

    def __init__(self, name: str, config: Optional[LoggingConfig] = None):
        self.name = name
        self.config = config or LoggingConfig()
        self._context_local = threading.local()
        self._logger = self._setup_logger()

    def _setup_logger(self) -> logging.Logger:
        """Set up the logging configuration."""
        logger = logging.getLogger(self.name)
        logger.setLevel(getattr(logging, self.config.level.upper()))

        # Clear existing handlers
        logger.handlers.clear()

        formatter = ContextualFormatter(self.config.format)

        # Console handler
        if self.config.console_output:
            console_handler = logging.StreamHandler()
            console_handler.setFormatter(formatter)
            logger.addHandler(console_handler)

        # File handler
        if self.config.output_file:
            log_path = Path(self.config.output_file)
            log_path.parent.mkdir(parents=True, exist_ok=True)

            file_handler = logging.handlers.RotatingFileHandler(
                filename=log_path,
                maxBytes=self.config.max_file_size_mb * 1024 * 1024,
                backupCount=self.config.backup_count,
                encoding='utf-8'
            )
            file_handler.setFormatter(formatter)
            logger.addHandler(file_handler)

        return logger

    @contextmanager
    def context(
        self,
        operation: str,
        category: Optional[str] = None,
        place_id: Optional[str] = None,
        **kwargs
    ) -> Generator[LogContext, None, None]:
        """Create a logging context for an operation."""
        context = LogContext(
            operation=operation,
            category=category,
            place_id=place_id,
            **kwargs
        )

        # Store context in thread-local storage
        old_context = getattr(self._context_local, 'context', None)
        self._context_local.context = context

        try:
            self.info(f"Started operation: {operation}")
            yield context
            self.info(f"Completed operation: {operation}")
        except Exception:
            self.error(f"Failed operation: {operation}", exc_info=True)
            raise
        finally:
            # Restore previous context
            self._context_local.context = old_context

    def _log_with_context(self, level: int, message: str, **kwargs) -> None:
        """Log message with current context."""
        context = getattr(self._context_local, 'context', None)

        # Create log record
        record = self._logger.makeRecord(
            name=self.name,
            level=level,
            fn='',
            lno=0,
            msg=message,
            args=(),
            exc_info=kwargs.get('exc_info'),
            extra={'context': context, **kwargs}
        )

        self._logger.handle(record)

    def debug(self, message: str, **kwargs) -> None:
        """Log debug message."""
        self._log_with_context(logging.DEBUG, message, **kwargs)

    def info(self, message: str, **kwargs) -> None:
        """Log info message."""
        self._log_with_context(logging.INFO, message, **kwargs)

    def warning(self, message: str, **kwargs) -> None:
        """Log warning message."""
        self._log_with_context(logging.WARNING, message, **kwargs)

    def error(self, message: str, **kwargs) -> None:
        """Log error message."""
        self._log_with_context(logging.ERROR, message, **kwargs)

    def critical(self, message: str, **kwargs) -> None:
        """Log critical message."""
        self._log_with_context(logging.CRITICAL, message, **kwargs)

    def log_api_call(
        self,
        endpoint: str,
        duration: float,
        status_code: Optional[int] = None,
        response_size: Optional[int] = None,
        **metadata
    ) -> None:
        """Log API call with performance metrics."""
        self.info(
            f"API call to {endpoint}",
            endpoint=endpoint,
            duration=duration,
            status_code=status_code,
            response_size=response_size,
            **metadata
        )

    def log_processing_stats(
        self,
        operation: str,
        processed_count: int,
        error_count: int,
        duration: float,
        **metadata
    ) -> None:
        """Log processing statistics."""
        total = processed_count + error_count
        success_rate = (processed_count / total * 100) if total > 0 else 0

        self.info(
            f"Processing completed: {operation}",
            processed_count=processed_count,
            error_count=error_count,
            total_count=total,
            success_rate=success_rate,
            duration=duration,
            items_per_second=total / duration if duration > 0 else 0,
            **metadata
        )


# Global logger registry
_loggers: Dict[str, ContextualLogger] = {}


def get_logger(name: str, config: Optional[LoggingConfig] = None) -> ContextualLogger:
    """Get or create a contextual logger."""
    if name not in _loggers:
        _loggers[name] = ContextualLogger(name, config)
    return _loggers[name]


def configure_logging(config: LoggingConfig) -> None:
    """Configure global logging settings."""
    # Clear existing loggers
    _loggers.clear()

    # Set root logger level
    logging.getLogger().setLevel(getattr(logging, config.level.upper()))


# Convenience function for getting the main scraper logger
def get_scraper_logger() -> ContextualLogger:
    """Get the main scraper logger."""
    return get_logger('scraper')
