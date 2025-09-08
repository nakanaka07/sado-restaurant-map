"""
Unit tests for exception handling.
"""
import pytest
from shared.exceptions import (
    ScraperError,
    APIError,
    ValidationError,
    ConfigurationError,
    ProcessingError,
    APIAuthenticationError
)


class TestScraperError:
    """Test base ScraperError class."""

    def test_basic_creation(self):
        """Test creating a basic scraper error."""
        error = ScraperError("Test error message")

        assert str(error) == "Test error message"
        assert error.message == "Test error message"
        assert isinstance(error.details, dict)

    def test_with_details(self):
        """Test creating error with details."""
        details = {"component": "test", "operation": "validate"}
        error = ScraperError("Test error", details=details)

        assert error.details["component"] == "test"
        assert error.details["operation"] == "validate"


class TestAPIError:
    """Test APIError class."""

    def test_basic_creation(self):
        """Test creating an API error."""
        error = APIError("API request failed")

        assert str(error) == "API request failed"
        assert error.status_code is None

    def test_with_status_code(self):
        """Test creating API error with status code."""
        error = APIError("API request failed", status_code=404)

        assert error.status_code == 404

    def test_with_response_data(self):
        """Test creating API error with response data."""
        response_data = {"error": "INVALID_REQUEST", "error_message": "Missing place_id"}
        error = APIError("API request failed", api_response=response_data)

        assert error.api_response == response_data


class TestValidationError:
    """Test ValidationError class."""

    def test_basic_creation(self):
        """Test creating a validation error."""
        error = ValidationError("Invalid data")

        assert str(error) == "Invalid data"

    def test_with_field_and_value(self):
        """Test creating validation error with field and value."""
        error = ValidationError("Invalid phone number", field="phone", value="invalid")

        assert error.field == "phone"
        assert error.value == "invalid"


class TestConfigurationError:
    """Test ConfigurationError class."""

    def test_basic_creation(self):
        """Test creating a configuration error."""
        error = ConfigurationError("Missing configuration")

        assert str(error) == "Missing configuration"

    def test_with_field(self):
        """Test creating configuration error with field."""
        error = ConfigurationError("Missing API key", field="PLACES_API_KEY")

        assert error.field == "PLACES_API_KEY"


class TestProcessingError:
    """Test ProcessingError class."""

    def test_basic_creation(self):
        """Test creating a processing error."""
        error = ProcessingError("Failed to process data")

        assert str(error) == "Failed to process data"

    def test_with_operation(self):
        """Test creating error with category info."""
        error = ProcessingError("Processing failed", category="data_validation")

        assert error.category == "data_validation"


class TestAPIAuthenticationError:
    """Test APIAuthenticationError class."""

    def test_basic_creation(self):
        """Test creating an authentication error."""
        error = APIAuthenticationError("Authentication failed")

        # APIAuthenticationError includes status_code in details by default
        assert "Authentication failed" in str(error)
        assert isinstance(error, APIError)  # Should inherit from APIError
        assert error.status_code == 401  # Default status code


class TestExceptionHierarchy:
    """Test exception hierarchy and inheritance."""

    def test_inheritance(self):
        """Test that all custom exceptions inherit from ScraperError."""
        api_error = APIError("API error")
        validation_error = ValidationError("Validation error")
        config_error = ConfigurationError("Config error")
        processing_error = ProcessingError("Processing error")
        auth_error = APIAuthenticationError("Auth error")

        assert isinstance(api_error, ScraperError)
        assert isinstance(validation_error, ScraperError)
        assert isinstance(config_error, ScraperError)
        assert isinstance(processing_error, ScraperError)
        assert isinstance(auth_error, ScraperError)
        assert isinstance(auth_error, APIError)  # Should also inherit from APIError

    def test_exception_catching(self):
        """Test catching exceptions in hierarchy."""
        def raise_api_error():
            raise APIError("API failed")

        def raise_validation_error():
            raise ValidationError("Validation failed")

        # Should be able to catch specific exceptions
        with pytest.raises(APIError):
            raise_api_error()

        with pytest.raises(ValidationError):
            raise_validation_error()

        # Should be able to catch base exception
        with pytest.raises(ScraperError):
            raise_api_error()

        with pytest.raises(ScraperError):
            raise_validation_error()
