"""
Configuration Management System

Centralized configuration with environment variable support,
validation, and secure defaults for the scraper system.
"""

import os
import json
from pathlib import Path
from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any, Union
from shared.exceptions import ConfigurationError


@dataclass
class GoogleAPIConfig:
    """Google API configuration settings."""
    places_api_key: str
    service_account_path: Optional[str] = None
    spreadsheet_id: Optional[str] = None

    def validate(self) -> List[str]:
        """Validate Google API configuration."""
        errors = []

        if not self.places_api_key:
            errors.append("PLACES_API_KEY is required")
        elif not self.places_api_key.strip():
            errors.append("PLACES_API_KEY cannot be empty")
        elif len(self.places_api_key) < 30:
            errors.append("PLACES_API_KEY appears to be invalid (too short)")

        if self.service_account_path:
            service_path = Path(self.service_account_path)
            if not service_path.exists():
                errors.append(f"Service account file not found: {self.service_account_path}")
            elif not service_path.is_file():
                errors.append(f"Service account path is not a file: {self.service_account_path}")
            elif service_path.suffix != '.json':
                errors.append(f"Service account file must be JSON: {self.service_account_path}")

        return errors


@dataclass
class ProcessingConfig:
    """Data processing configuration settings."""
    api_delay: float = 1.0
    max_workers: int = 3
    max_retries: int = 3
    timeout: int = 30
    batch_size: int = 50
    rate_limit_per_second: float = 10.0

    def validate(self) -> List[str]:
        """Validate processing configuration."""
        errors = []

        if self.api_delay < 0:
            errors.append("api_delay must be non-negative")
        if self.max_workers < 1:
            errors.append("max_workers must be at least 1")
        if self.max_workers > 10:
            errors.append("max_workers should not exceed 10 (API rate limits)")
        if self.max_retries < 0:
            errors.append("max_retries must be non-negative")
        if self.timeout < 1:
            errors.append("timeout must be at least 1 second")
        if self.batch_size < 1:
            errors.append("batch_size must be at least 1")
        if self.rate_limit_per_second <= 0:
            errors.append("rate_limit_per_second must be positive")

        return errors


@dataclass
class LoggingConfig:
    """Logging configuration settings."""
    level: str = "INFO"
    format: str = "structured"
    output_file: Optional[str] = None
    console_output: bool = True
    max_file_size_mb: int = 10
    backup_count: int = 5

    def validate(self) -> List[str]:
        """Validate logging configuration."""
        errors = []

        valid_levels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
        if self.level.upper() not in valid_levels:
            errors.append(f"log_level must be one of: {valid_levels}")

        valid_formats = ["structured", "json", "simple"]
        if self.format not in valid_formats:
            errors.append(f"log_format must be one of: {valid_formats}")

        if self.max_file_size_mb < 1:
            errors.append("max_file_size_mb must be at least 1")
        if self.backup_count < 0:
            errors.append("backup_count must be non-negative")

        return errors


@dataclass
class ScraperConfig:
    """Main scraper configuration class."""
    google_api: GoogleAPIConfig
    processing: ProcessingConfig
    logging: LoggingConfig = field(default_factory=LoggingConfig)
    debug: bool = False
    dry_run: bool = False

    @classmethod
    def from_environment(cls, validate: bool = True) -> 'ScraperConfig':
        """Create configuration from environment variables."""

        # Google API configuration
        google_config = GoogleAPIConfig(
            places_api_key=os.getenv('PLACES_API_KEY', ''),
            service_account_path=os.getenv('GOOGLE_SERVICE_ACCOUNT_PATH'),
            spreadsheet_id=os.getenv('SPREADSHEET_ID')
        )

        # Processing configuration with safe defaults
        processing_config = ProcessingConfig(
            api_delay=float(os.getenv('API_DELAY', '1.0')),
            max_workers=int(os.getenv('MAX_WORKERS', '3')),
            max_retries=int(os.getenv('MAX_RETRIES', '3')),
            timeout=int(os.getenv('TIMEOUT', '30')),
            batch_size=int(os.getenv('BATCH_SIZE', '50')),
            rate_limit_per_second=float(os.getenv('RATE_LIMIT_PER_SECOND', '10.0'))
        )

        # Logging configuration
        logging_config = LoggingConfig(
            level=os.getenv('LOG_LEVEL', 'INFO').upper(),
            format=os.getenv('LOG_FORMAT', 'structured'),
            output_file=os.getenv('LOG_FILE'),
            console_output=os.getenv('LOG_CONSOLE', 'true').lower() in ('true', '1', 'yes'),
            max_file_size_mb=int(os.getenv('LOG_MAX_SIZE_MB', '10')),
            backup_count=int(os.getenv('LOG_BACKUP_COUNT', '5'))
        )

        # Global settings
        debug = os.getenv('DEBUG', 'false').lower() in ('true', '1', 'yes', 'on')
        dry_run = os.getenv('DRY_RUN', 'false').lower() in ('true', '1', 'yes', 'on')

        config = cls(
            google_api=google_config,
            processing=processing_config,
            logging=logging_config,
            debug=debug,
            dry_run=dry_run
        )

        if validate:
            config.validate_or_raise()

        return config

    @classmethod
    def from_file(cls, config_path: Union[str, Path], validate: bool = True) -> 'ScraperConfig':
        """Create configuration from JSON file."""
        config_file = Path(config_path)

        if not config_file.exists():
            raise ConfigurationError(f"Configuration file not found: {config_path}")

        try:
            with open(config_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except json.JSONDecodeError as e:
            raise ConfigurationError(f"Invalid JSON in configuration file: {e}")
        except Exception as e:
            raise ConfigurationError(f"Error reading configuration file: {e}")

        # Extract sections
        google_data = data.get('google_api', {})
        processing_data = data.get('processing', {})
        logging_data = data.get('logging', {})

        config = cls(
            google_api=GoogleAPIConfig(**google_data),
            processing=ProcessingConfig(**processing_data),
            logging=LoggingConfig(**logging_data),
            debug=data.get('debug', False),
            dry_run=data.get('dry_run', False)
        )

        if validate:
            config.validate_or_raise()

        return config

    def validate(self) -> Dict[str, List[str]]:
        """Validate all configuration sections."""
        return {
            'google_api': self.google_api.validate(),
            'processing': self.processing.validate(),
            'logging': self.logging.validate()
        }

    def validate_or_raise(self) -> None:
        """Validate configuration and raise exception if errors found."""
        validation_results = self.validate()
        all_errors = []

        for category, errors in validation_results.items():
            if errors:
                all_errors.extend([f"{category}: {error}" for error in errors])

        if all_errors:
            missing_keys = [
                error.split(":")[1].strip().split()[0]
                for error in all_errors
                if "is required" in error
            ]

            raise ConfigurationError(
                "Configuration validation failed:\n" + "\n".join(f"- {error}" for error in all_errors),
                field="configuration",
                value=missing_keys
            )

    def to_dict(self) -> Dict[str, Any]:
        """Convert configuration to dictionary."""
        return {
            'google_api': {
                'places_api_key': self.google_api.places_api_key,
                'service_account_path': self.google_api.service_account_path,
                'spreadsheet_id': self.google_api.spreadsheet_id
            },
            'processing': {
                'api_delay': self.processing.api_delay,
                'max_workers': self.processing.max_workers,
                'max_retries': self.processing.max_retries,
                'timeout': self.processing.timeout,
                'batch_size': self.processing.batch_size,
                'rate_limit_per_second': self.processing.rate_limit_per_second
            },
            'logging': {
                'level': self.logging.level,
                'format': self.logging.format,
                'output_file': self.logging.output_file,
                'console_output': self.logging.console_output,
                'max_file_size_mb': self.logging.max_file_size_mb,
                'backup_count': self.logging.backup_count
            },
            'debug': self.debug,
            'dry_run': self.dry_run
        }

    def get_summary(self) -> Dict[str, Any]:
        """Get configuration summary with sensitive data masked."""
        return {
            'google_api': {
                'places_api_key': "***" if self.google_api.places_api_key else None,
                'service_account_configured': bool(self.google_api.service_account_path),
                'spreadsheet_id': self.google_api.spreadsheet_id[:8] + "..." if self.google_api.spreadsheet_id else None
            },
            'processing': {
                'api_delay': self.processing.api_delay,
                'max_workers': self.processing.max_workers,
                'max_retries': self.processing.max_retries,
                'timeout': self.processing.timeout,
                'batch_size': self.processing.batch_size,
                'rate_limit_per_second': self.processing.rate_limit_per_second
            },
            'logging': {
                'level': self.logging.level,
                'format': self.logging.format,
                'console_output': self.logging.console_output
            },
            'debug': self.debug,
            'dry_run': self.dry_run
        }

    def save_to_file(self, config_path: Union[str, Path]) -> None:
        """Save configuration to JSON file."""
        config_file = Path(config_path)

        # Create directory if needed
        config_file.parent.mkdir(parents=True, exist_ok=True)

        try:
            with open(config_file, 'w', encoding='utf-8') as f:
                json.dump(self.to_dict(), f, indent=2, ensure_ascii=False)
        except Exception as e:
            raise ConfigurationError(f"Error saving configuration file: {e}")


# Global configuration instance
_config: Optional[ScraperConfig] = None


def get_config() -> ScraperConfig:
    """Get the global configuration instance."""
    global _config
    if _config is None:
        _config = ScraperConfig.from_environment()
    return _config


def set_config(config: ScraperConfig) -> None:
    """Set the global configuration instance."""
    global _config
    _config = config


def reset_config() -> None:
    """Reset the global configuration instance."""
    global _config
    _config = None


# Environment variable validation helpers
def validate_environment_variables() -> List[str]:
    """Validate required environment variables."""
    errors = []

    required_vars = [
        'PLACES_API_KEY'
    ]

    for var in required_vars:
        if not os.getenv(var):
            errors.append(f"Required environment variable {var} is not set")

    return errors


def validate_environment_setup(env_file_path: Optional[str] = None) -> bool:
    """
    環境設定の検証を実行 (統合版)

    Args:
        env_file_path: 環境ファイルのパス（指定時はファイルから環境変数を読み込み）

    Returns:
        検証成功の可否
    """
    from shared.logger import get_logger
    logger = get_logger(__name__)

    try:
        # 環境ファイルが指定されている場合は読み込み
        if env_file_path:
            load_env_to_os(env_file_path)
            logger.info(f"Loaded environment from: {env_file_path}")

        # ScraperConfig の作成テストで検証
        config = ScraperConfig.from_environment(validate=True)
        logger.info("Environment validation passed successfully")
        logger.info(f"  - API Key Present: {'✅' if config.google_api.places_api_key else '❌'}")
        logger.info(f"  - Service Account: {'✅' if config.google_api.service_account_path else '❌'}")
        logger.info(f"  - Spreadsheet ID: {'✅' if config.google_api.spreadsheet_id else '❌'}")
        return True
    except ConfigurationError as e:
        logger.error(f"Environment validation failed: {e}")
        return False
    except Exception as e:
        logger.error(f"Unexpected validation error: {e}")
        return False
def check_config_creation() -> bool:
    """
    ScraperConfig の作成テスト (統合版)

    Returns:
        作成成功の可否
    """
    from shared.logger import get_logger
    logger = get_logger(__name__)

    try:
        config = ScraperConfig.from_environment()
        logger.info("ScraperConfig created successfully")
        logger.info(f"  - Debug Mode: {config.debug}")
        logger.info(f"  - Processing Batch Size: {config.processing.batch_size}")
        logger.info(f"  - API Delay: {config.processing.api_delay}s")
        return True
    except Exception as e:
        logger.error(f"Failed to create ScraperConfig: {e}")
        return False


def load_env_to_os(env_file_path: Optional[str] = None) -> None:
    """
    環境ファイルをOSの環境変数に読み込み (統合版)

    Args:
        env_file_path: 環境ファイルのパス
    """
    if not env_file_path:
        return

    from shared.logger import get_logger
    logger = get_logger(__name__)

    env_path = Path(env_file_path)
    if not env_path.exists():
        logger.warning(f"Environment file not found: {env_file_path}")
        return

    try:
        env_vars = {}
        with open(env_path, 'r', encoding='utf-8') as f:
            for line_num, line in enumerate(f, 1):
                line = line.strip()
                if not line or line.startswith('#'):
                    continue
                if '=' in line:
                    key, value = line.split('=', 1)
                    env_vars[key.strip()] = value.strip()

        for key, value in env_vars.items():
            os.environ[key] = value

        logger.info(f"Loaded {len(env_vars)} environment variables from {env_file_path}")

    except Exception as e:
        logger.warning(f"Failed to load environment file: {e}")
