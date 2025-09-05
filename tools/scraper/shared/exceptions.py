"""
Custom Exception Classes

This module defines custom exception classes for the scraper application,
providing specific error types for different failure scenarios.
"""

from typing import Optional, Any, Dict, List


class ScraperError(Exception):
    """Base exception class for all scraper-related errors."""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message)
        self.message = message
        self.details = details or {}

    def __str__(self) -> str:
        if self.details:
            return f"{self.message} (Details: {self.details})"
        return self.message


class ConfigurationError(ScraperError):
    """Exception raised for configuration-related errors."""

    def __init__(self, message: str, field: Optional[str] = None, value: Optional[Any] = None):
        super().__init__(message)
        self.field = field
        self.value = value
        if field:
            self.details['field'] = field
        if value is not None:
            self.details['value'] = value


class APIError(ScraperError):
    """Exception raised for API communication errors."""

    def __init__(
        self,
        message: str,
        status_code: Optional[int] = None,
        api_response: Optional[Dict[str, Any]] = None,
        retry_after: Optional[int] = None
    ):
        super().__init__(message)
        self.status_code = status_code
        self.api_response = api_response
        self.retry_after = retry_after

        if status_code:
            self.details['status_code'] = status_code
        if api_response:
            self.details['api_response'] = api_response
        if retry_after:
            self.details['retry_after'] = retry_after


class APIQuotaExceededError(APIError):
    """Exception raised when API quota is exceeded."""

    def __init__(self, message: str = "API quota exceeded", retry_after: Optional[int] = None):
        super().__init__(message, status_code=429, retry_after=retry_after)


class APIAuthenticationError(APIError):
    """Exception raised for API authentication failures."""

    def __init__(self, message: str = "API authentication failed"):
        super().__init__(message, status_code=401)


class ValidationError(ScraperError):
    """Exception raised for data validation errors."""

    def __init__(
        self,
        message: str,
        field: Optional[str] = None,
        value: Optional[Any] = None,
        validation_errors: Optional[List[str]] = None
    ):
        super().__init__(message)
        self.field = field
        self.value = value
        self.validation_errors = validation_errors or []

        if field:
            self.details['field'] = field
        if value is not None:
            self.details['value'] = value
        if validation_errors:
            self.details['validation_errors'] = validation_errors


class DataIntegrityError(ScraperError):
    """Exception raised for data integrity violations."""

    def __init__(
        self,
        message: str,
        data_id: Optional[str] = None,
        duplicate_ids: Optional[List[str]] = None
    ):
        super().__init__(message)
        self.data_id = data_id
        self.duplicate_ids = duplicate_ids or []

        if data_id:
            self.details['data_id'] = data_id
        if duplicate_ids:
            self.details['duplicate_ids'] = duplicate_ids


class StorageError(ScraperError):
    """Exception raised for storage operation errors."""

    def __init__(
        self,
        message: str,
        operation: Optional[str] = None,
        storage_type: Optional[str] = None
    ):
        super().__init__(message)
        self.operation = operation
        self.storage_type = storage_type

        if operation:
            self.details['operation'] = operation
        if storage_type:
            self.details['storage_type'] = storage_type


class NetworkError(ScraperError):
    """Exception raised for network-related errors."""

    def __init__(
        self,
        message: str,
        url: Optional[str] = None,
        timeout: Optional[int] = None
    ):
        super().__init__(message)
        self.url = url
        self.timeout = timeout

        if url:
            self.details['url'] = url
        if timeout:
            self.details['timeout'] = timeout


class ProcessingError(ScraperError):
    """Exception raised for data processing errors."""

    def __init__(
        self,
        message: str,
        category: Optional[str] = None,
        item_count: Optional[int] = None,
        failed_items: Optional[List[str]] = None
    ):
        super().__init__(message)
        self.category = category
        self.item_count = item_count
        self.failed_items = failed_items or []

        if category:
            self.details['category'] = category
        if item_count is not None:
            self.details['item_count'] = item_count
        if failed_items:
            self.details['failed_items'] = failed_items


class RateLimitError(ScraperError):
    """Exception raised when rate limits are exceeded."""

    def __init__(
        self,
        message: str = "Rate limit exceeded",
        retry_after: Optional[int] = None,
        limit_type: Optional[str] = None
    ):
        super().__init__(message)
        self.retry_after = retry_after
        self.limit_type = limit_type

        if retry_after:
            self.details['retry_after'] = retry_after
        if limit_type:
            self.details['limit_type'] = limit_type


class DependencyError(ScraperError):
    """Exception raised for dependency injection or resolution errors."""

    def __init__(
        self,
        message: str,
        service_type: Optional[str] = None,
        dependency_chain: Optional[List[str]] = None
    ):
        super().__init__(message)
        self.service_type = service_type
        self.dependency_chain = dependency_chain or []

        if service_type:
            self.details['service_type'] = service_type
        if dependency_chain:
            self.details['dependency_chain'] = dependency_chain


class CacheError(ScraperError):
    """Exception raised for cache operation errors."""

    def __init__(
        self,
        message: str,
        operation: Optional[str] = None,
        cache_key: Optional[str] = None,
        cache_type: Optional[str] = None
    ):
        super().__init__(message)
        self.operation = operation
        self.cache_key = cache_key
        self.cache_type = cache_type

        if operation:
            self.details['operation'] = operation
        if cache_key:
            self.details['cache_key'] = cache_key
        if cache_type:
            self.details['cache_type'] = cache_type


class CacheConnectionError(CacheError):
    """Exception raised for cache connection errors."""

    def __init__(
        self,
        message: str = "Cache connection failed",
        connection_string: Optional[str] = None,
        retry_count: Optional[int] = None
    ):
        super().__init__(message, operation="connection")
        self.connection_string = connection_string
        self.retry_count = retry_count

        if connection_string:
            self.details['connection_string'] = connection_string
        if retry_count is not None:
            self.details['retry_count'] = retry_count


class CacheTimeoutError(CacheError):
    """Exception raised for cache operation timeouts."""

    def __init__(
        self,
        message: str = "Cache operation timeout",
        timeout_seconds: Optional[float] = None
    ):
        super().__init__(message, operation="timeout")
        self.timeout_seconds = timeout_seconds

        if timeout_seconds:
            self.details['timeout_seconds'] = timeout_seconds


class OrchestrationError(ScraperError):
    """Exception raised for orchestration system errors."""

    def __init__(
        self,
        message: str,
        component: Optional[str] = None,
        operation: Optional[str] = None,
        worker_id: Optional[str] = None
    ):
        super().__init__(message)
        self.component = component
        self.operation = operation
        self.worker_id = worker_id

        if component:
            self.details['component'] = component
        if operation:
            self.details['operation'] = operation
        if worker_id:
            self.details['worker_id'] = worker_id


class HealthCheckError(OrchestrationError):
    """Exception raised for health check failures."""

    def __init__(
        self,
        message: str = "Health check failed",
        component: Optional[str] = None,
        health_score: Optional[float] = None
    ):
        super().__init__(message, component=component, operation="health_check")
        self.health_score = health_score

        if health_score is not None:
            self.details['health_score'] = health_score


class WorkerFailureError(OrchestrationError):
    """Exception raised for worker failure scenarios."""

    def __init__(
        self,
        message: str,
        worker_id: str,
        failure_count: Optional[int] = None,
        last_error: Optional[str] = None
    ):
        super().__init__(message, component="worker", operation="failure", worker_id=worker_id)
        self.failure_count = failure_count
        self.last_error = last_error

        if failure_count is not None:
            self.details['failure_count'] = failure_count
        if last_error:
            self.details['last_error'] = last_error


class LoadBalancingError(OrchestrationError):
    """Exception raised for load balancing errors."""

    def __init__(
        self,
        message: str,
        algorithm: Optional[str] = None,
        available_workers: Optional[int] = None
    ):
        super().__init__(message, component="load_balancer", operation="worker_selection")
        self.algorithm = algorithm
        self.available_workers = available_workers

        if algorithm:
            self.details['algorithm'] = algorithm
        if available_workers is not None:
            self.details['available_workers'] = available_workers


# Error severity levels
class ErrorSeverity:
    """Constants for error severity levels."""
    CRITICAL = "critical"
    ERROR = "error"
    WARNING = "warning"
    INFO = "info"


# Error categories for monitoring and alerting
class ErrorCategory:
    """Constants for error categories."""
    CONFIGURATION = "configuration"
    API = "api"
    VALIDATION = "validation"
    STORAGE = "storage"
    NETWORK = "network"
    PROCESSING = "processing"
    DEPENDENCY = "dependency"
    RATE_LIMIT = "rate_limit"


def get_error_category(exception: Exception) -> str:
    """Get the error category for an exception."""
    error_mapping = {
        ConfigurationError: ErrorCategory.CONFIGURATION,
        APIError: ErrorCategory.API,
        APIQuotaExceededError: ErrorCategory.RATE_LIMIT,
        APIAuthenticationError: ErrorCategory.API,
        ValidationError: ErrorCategory.VALIDATION,
        DataIntegrityError: ErrorCategory.VALIDATION,
        StorageError: ErrorCategory.STORAGE,
        NetworkError: ErrorCategory.NETWORK,
        ProcessingError: ErrorCategory.PROCESSING,
        RateLimitError: ErrorCategory.RATE_LIMIT,
        DependencyError: ErrorCategory.DEPENDENCY,
        CacheError: "cache",
        CacheConnectionError: "cache",
        CacheTimeoutError: "cache",
        OrchestrationError: "orchestration",
        HealthCheckError: "orchestration",
        WorkerFailureError: "orchestration",
        LoadBalancingError: "orchestration",
    }

    return error_mapping.get(type(exception), "unknown")


def get_error_severity(exception: Exception) -> str:
    """Get the error severity for an exception."""
    critical_errors = (
        ConfigurationError,
        APIAuthenticationError,
        DependencyError,
        HealthCheckError,
        WorkerFailureError,
    )

    warning_errors = (
        ValidationError,
        RateLimitError,
        APIQuotaExceededError,
        LoadBalancingError,
    )

    if isinstance(exception, critical_errors):
        return ErrorSeverity.CRITICAL
    elif isinstance(exception, warning_errors):
        return ErrorSeverity.WARNING
    else:
        return ErrorSeverity.ERROR
