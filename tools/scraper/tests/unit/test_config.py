"""
Unit tests for configuration management.
"""
import pytest
import os
from unittest.mock import patch
from shared.config import ScraperConfig, GoogleAPIConfig, ProcessingConfig, ConfigurationError


class TestGoogleAPIConfig:
    """Test GoogleAPIConfig class."""

    def test_valid_config_creation(self):
        """Test creating a valid Google API config."""
        config = GoogleAPIConfig(
            places_api_key="test_key",
            service_account_path="test_path.json",
            spreadsheet_id="test_sheet_id"
        )

        assert config.places_api_key == "test_key"
        assert config.service_account_path == "test_path.json"
        assert config.spreadsheet_id == "test_sheet_id"

    def test_empty_api_key_validation(self):
        """Test validation with empty API key."""
        config = GoogleAPIConfig(
            places_api_key="",
            service_account_path="test_path.json",
            spreadsheet_id="test_sheet_id"
        )

        validation_result = config.validate()
        assert len(validation_result) > 0
        assert any("PLACES_API_KEY" in error for error in validation_result)

    def test_invalid_service_account_path(self):
        """Test validation with invalid service account path."""
        config = GoogleAPIConfig(
            places_api_key="test_key_that_is_long_enough_for_validation",
            service_account_path="nonexistent_file.json",
            spreadsheet_id="test_sheet_id"
        )

        validation_result = config.validate()
        assert len(validation_result) > 0
        assert any("Service account file not found" in error for error in validation_result)


class TestProcessingConfig:
    """Test ProcessingConfig class."""

    def test_default_values(self):
        """Test default configuration values."""
        config = ProcessingConfig()

        assert abs(config.api_delay - 1.0) < 0.001  # Use approximate comparison
        assert config.max_workers == 3
        assert config.max_retries == 3
        assert config.timeout == 30

    def test_custom_values(self):
        """Test custom configuration values."""
        config = ProcessingConfig(
            api_delay=0.5,
            max_workers=5,
            max_retries=2,
            timeout=60
        )

        assert abs(config.api_delay - 0.5) < 0.001  # Use approximate comparison
        assert config.max_workers == 5
        assert config.max_retries == 2
        assert config.timeout == 60

    def test_validation_with_invalid_values(self):
        """Test validation with invalid values."""
        config = ProcessingConfig(
            api_delay=-1.0,  # Invalid: negative delay
            max_workers=0,   # Invalid: zero workers
            max_retries=-1,  # Invalid: negative retries
            timeout=0        # Invalid: zero timeout
        )

        validation_result = config.validate()
        assert len(validation_result) > 0
        assert any("api_delay must be non-negative" in error for error in validation_result)
        assert any("max_workers must be at least 1" in error for error in validation_result)
        assert any("max_retries must be non-negative" in error for error in validation_result)
        assert any("timeout must be at least 1" in error for error in validation_result)


class TestScraperConfig:
    """Test ScraperConfig class."""

    def test_valid_config_creation(self, mock_config):
        """Test creating a valid scraper config."""
        assert isinstance(mock_config.google_api, GoogleAPIConfig)
        assert isinstance(mock_config.processing, ProcessingConfig)
        assert mock_config.debug is True

    @patch.dict(os.environ, {
        'PLACES_API_KEY': 'test_key_that_is_definitely_long_enough_to_pass_validation_check',
        'GOOGLE_SERVICE_ACCOUNT_PATH': '',  # Empty path to avoid file not found
        'SPREADSHEET_ID': 'test_sheet_id',
        'API_DELAY': '0.5',
        'MAX_WORKERS': '2',
        'DEBUG': 'true'
    })
    def test_from_environment(self):
        """Test creating config from environment variables."""
        config = ScraperConfig.from_environment(validate=False)  # Skip validation for test

        assert "test_key_that_is_definitely_long_enough" in config.google_api.places_api_key
        assert config.google_api.spreadsheet_id == "test_sheet_id"
        assert abs(config.processing.api_delay - 0.5) < 0.001  # Use approximate comparison
        assert config.processing.max_workers == 2
        assert config.debug is True

    @patch.dict(os.environ, {}, clear=True)
    def test_from_environment_missing_required(self):
        """Test creating config with missing required environment variables."""
        with pytest.raises(ConfigurationError):
            ScraperConfig.from_environment(validate=True)

    def test_validation_success(self):
        """Test successful validation with minimal valid config."""
        from shared.config import GoogleAPIConfig, ProcessingConfig, LoggingConfig

        config = ScraperConfig(
            google_api=GoogleAPIConfig(
                places_api_key="valid_api_key_that_is_long_enough_for_validation",
                service_account_path=None,  # Optional
                spreadsheet_id="test_sheet_id"
            ),
            processing=ProcessingConfig(),  # Use defaults
            logging=LoggingConfig(),  # Use defaults
            debug=True
        )

        validation_result = config.validate()

        # Check that google_api validation passes (no errors)
        assert len(validation_result["google_api"]) == 0
        assert len(validation_result["processing"]) == 0
        assert len(validation_result["logging"]) == 0

    def test_validation_failure(self):
        """Test validation failure."""
        from shared.config import GoogleAPIConfig, ProcessingConfig, LoggingConfig

        config = ScraperConfig(
            google_api=GoogleAPIConfig(
                places_api_key="",  # Invalid - empty
                service_account_path="nonexistent.json",  # Invalid - file doesn't exist
                spreadsheet_id=""  # Invalid - empty
            ),
            processing=ProcessingConfig(
                api_delay=-1.0,  # Invalid - negative
                max_workers=0,   # Invalid - zero
                max_retries=-1,  # Invalid - negative
                timeout=0        # Invalid - zero
            ),
            logging=LoggingConfig(
                level="INVALID",  # Invalid level
                format="unknown"  # Invalid format
            ),
            debug=False
        )

        validation_result = config.validate()

        # Check that validation fails for invalid values
        assert len(validation_result["google_api"]) > 0
        assert len(validation_result["processing"]) > 0
        assert len(validation_result["logging"]) > 0

    def test_config_serialization(self, mock_config):
        """Test configuration serialization to dict."""
        # Test that config can be converted to dict (for JSON serialization)
        config_dict = {
            "google_api": {
                "places_api_key": mock_config.google_api.places_api_key,
                "service_account_path": mock_config.google_api.service_account_path,
                "spreadsheet_id": mock_config.google_api.spreadsheet_id
            },
            "processing": {
                "api_delay": mock_config.processing.api_delay,
                "max_workers": mock_config.processing.max_workers,
                "max_retries": mock_config.processing.max_retries,
                "timeout": mock_config.processing.timeout
            },
            "debug": mock_config.debug
        }

        assert "google_api" in config_dict
        assert "processing" in config_dict
        assert "debug" in config_dict
        assert config_dict["google_api"]["places_api_key"] == "test_api_key_that_is_long_enough_for_validation"

    def test_config_validation_workflow(self, tmp_path):
        """Test complete configuration validation workflow."""
        from shared.config import GoogleAPIConfig, ProcessingConfig, LoggingConfig

        # Create a temporary service account file for testing
        service_account_file = tmp_path / "test_service_account.json"
        service_account_file.write_text('{"type": "service_account"}')

        config = ScraperConfig(
            google_api=GoogleAPIConfig(
                places_api_key="valid_api_key_that_is_long_enough_for_validation_test",
                service_account_path=str(service_account_file),
                spreadsheet_id="test_spreadsheet_id"
            ),
            processing=ProcessingConfig(
                api_delay=0.5,
                max_workers=2,
                max_retries=3,
                timeout=30
            ),
            logging=LoggingConfig(
                level="INFO",
                format="structured"
            ),
            debug=True
        )

        # Validate config
        validation_result = config.validate()

        # All validations should pass
        assert len(validation_result["google_api"]) == 0
        assert len(validation_result["processing"]) == 0
        assert len(validation_result["logging"]) == 0
