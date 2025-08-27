"""
Configuration Settings for Sado Restaurant Map Scraper

This module provides configuration classes for managing environment variables,
API keys, and application settings in a type-safe manner.
"""

from dataclasses import dataclass, field
from typing import Optional, List
import os
from pathlib import Path


@dataclass
class GoogleAPIConfig:
    """Google API configuration settings."""

    places_api_key: str
    service_account_path: str
    spreadsheet_id: str

    def __post_init__(self):
        """Validate configuration after initialization."""
        if not self.places_api_key:
            raise ValueError("PLACES_API_KEY is required")
        if not self.spreadsheet_id:
            raise ValueError("SPREADSHEET_ID is required")
        if not Path(self.service_account_path).exists():
            raise ValueError(f"Service account file not found: {self.service_account_path}")


@dataclass
class ProcessingConfig:
    """Data processing configuration settings."""

    api_delay: float = 1.0
    max_workers: int = 3
    max_retries: int = 3
    timeout: int = 30
    batch_size: int = 50

    def __post_init__(self):
        """Validate processing configuration."""
        if self.api_delay < 0:
            raise ValueError("API delay must be non-negative")
        if self.max_workers < 1:
            raise ValueError("Max workers must be at least 1")
        if self.max_retries < 0:
            raise ValueError("Max retries must be non-negative")


@dataclass
class LoggingConfig:
    """Logging configuration settings."""

    level: str = "INFO"
    format: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    file_enabled: bool = True
    file_path: str = "logs/scraper.log"
    console_enabled: bool = True

    def __post_init__(self):
        """Validate logging configuration."""
        valid_levels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
        if self.level.upper() not in valid_levels:
            raise ValueError(f"Invalid log level: {self.level}")


@dataclass
class ScraperConfig:
    """Main scraper configuration class."""

    google_api: GoogleAPIConfig
    processing: ProcessingConfig
    logging: LoggingConfig
    debug: bool = False
    dry_run: bool = False
    supported_categories: List[str] = field(default_factory=lambda: ['restaurants', 'parkings', 'toilets'])

    @classmethod
    def from_environment(cls) -> 'ScraperConfig':
        """Create configuration from environment variables."""

        # Get environment variables with defaults
        places_api_key = os.getenv('PLACES_API_KEY', '')
        service_account_path = os.getenv(
            'GOOGLE_SERVICE_ACCOUNT_PATH',
            'config/service-account.json'
        )
        spreadsheet_id = os.getenv('SPREADSHEET_ID', '')

        # Processing settings
        api_delay = float(os.getenv('API_DELAY', '1.0'))
        max_workers = int(os.getenv('MAX_WORKERS', '3'))
        max_retries = int(os.getenv('MAX_RETRIES', '3'))
        timeout = int(os.getenv('TIMEOUT', '30'))
        batch_size = int(os.getenv('BATCH_SIZE', '50'))

        # Application settings
        debug = os.getenv('DEBUG', 'false').lower() == 'true'
        dry_run = os.getenv('DRY_RUN', 'false').lower() == 'true'

        # Logging settings
        log_level = os.getenv('LOG_LEVEL', 'INFO')
        log_file_path = os.getenv('LOG_FILE_PATH', 'logs/scraper.log')

        return cls(
            google_api=GoogleAPIConfig(
                places_api_key=places_api_key,
                service_account_path=service_account_path,
                spreadsheet_id=spreadsheet_id
            ),
            processing=ProcessingConfig(
                api_delay=api_delay,
                max_workers=max_workers,
                max_retries=max_retries,
                timeout=timeout,
                batch_size=batch_size
            ),
            logging=LoggingConfig(
                level=log_level,
                file_path=log_file_path
            ),
            debug=debug,
            dry_run=dry_run
        )

    def validate(self) -> None:
        """Validate the entire configuration."""
        # Individual configs validate themselves in __post_init__
        # Additional cross-validation can be added here
        if self.debug and not self.dry_run:
            # In debug mode, suggest using dry run
            pass

    def to_dict(self) -> dict:
        """Convert configuration to dictionary for logging/debugging."""
        return {
            'google_api': {
                'places_api_key': '***MASKED***' if self.google_api.places_api_key else None,
                'service_account_path': self.google_api.service_account_path,
                'spreadsheet_id': self.google_api.spreadsheet_id
            },
            'processing': {
                'api_delay': self.processing.api_delay,
                'max_workers': self.processing.max_workers,
                'max_retries': self.processing.max_retries,
                'timeout': self.processing.timeout,
                'batch_size': self.processing.batch_size
            },
            'logging': {
                'level': self.logging.level,
                'file_enabled': self.logging.file_enabled,
                'console_enabled': self.logging.console_enabled
            },
            'debug': self.debug,
            'dry_run': self.dry_run,
            'supported_categories': self.supported_categories
        }
