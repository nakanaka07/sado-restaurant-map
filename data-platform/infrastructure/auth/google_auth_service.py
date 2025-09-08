#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Google Authentication Service - 新しいアーキテクチャ対応版

Google API認証を管理するサービスクラス
"""

import os
import json
import tempfile
from typing import Optional, Any
from pathlib import Path

import gspread
from google.oauth2.service_account import Credentials

from core.domain.interfaces import AuthenticationService
from shared.exceptions import ConfigurationError
from shared.logger import get_logger


class GoogleAuthService(AuthenticationService):
    """Google API authentication service"""

    def __init__(self, service_account_path: str):
        """
        Initialize Google authentication service.

        Args:
            service_account_path: Path to service account JSON file
        """
        self._service_account_path = service_account_path
        self._credentials: Optional[Credentials] = None
        self._gspread_client: Optional[gspread.Client] = None
        self._logger = get_logger(__name__)
        self._is_authenticated = False

    def authenticate(self) -> bool:
        """
        Perform Google authentication.

        Returns:
            True if authentication successful, False otherwise
        """
        try:
            # Check for GitHub Actions environment variable
            if 'GOOGLE_SERVICE_ACCOUNT_KEY' in os.environ:
                self._logger.info("Using GitHub Actions service account")
                return self._authenticate_from_env()
            else:
                self._logger.info("Using local service account file")
                return self._authenticate_from_file()

        except Exception as e:
            self._logger.error("Authentication failed", error=str(e))
            self._is_authenticated = False
            return False

    def _authenticate_from_env(self) -> bool:
        """Authenticate using environment variable (GitHub Actions)"""
        try:
            service_account_info = json.loads(os.environ['GOOGLE_SERVICE_ACCOUNT_KEY'])

            # Create temporary file
            with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as temp_file:
                json.dump(service_account_info, temp_file)
                temp_file_path = temp_file.name

            try:
                # Create credentials with explicit scopes
                scopes = [
                    'https://www.googleapis.com/auth/spreadsheets',
                    'https://www.googleapis.com/auth/drive.file'
                ]
                self._credentials = Credentials.from_service_account_file(
                    temp_file_path,
                    scopes=scopes
                )
                self._gspread_client = gspread.authorize(self._credentials)
                self._is_authenticated = True

                self._logger.info("GitHub Actions authentication successful")
                return True

            finally:
                # Clean up temporary file
                try:
                    os.unlink(temp_file_path)
                except Exception as e:
                    self._logger.warning("Failed to clean up temp file", error=str(e))

        except (json.JSONDecodeError, KeyError) as e:
            self._logger.error("Invalid service account environment variable", error=str(e))
            return False

    def _authenticate_from_file(self) -> bool:
        """Authenticate using local service account file"""
        try:
            service_account_path = Path(self._service_account_path)

            if not service_account_path.exists():
                raise ConfigurationError(f"Service account file not found: {service_account_path}")

            # Create credentials with explicit scopes
            scopes = [
                'https://www.googleapis.com/auth/spreadsheets',
                'https://www.googleapis.com/auth/drive.file'
            ]
            self._credentials = Credentials.from_service_account_file(
                str(service_account_path),
                scopes=scopes
            )
            self._gspread_client = gspread.authorize(self._credentials)
            self._is_authenticated = True

            self._logger.info("Local file authentication successful", path=str(service_account_path))
            return True

        except Exception as e:
            self._logger.error("File authentication failed", path=self._service_account_path, error=str(e))
            raise ConfigurationError(f"Authentication failed: {e}")

    def get_credentials(self) -> Optional[Credentials]:
        """
        Get Google OAuth2 credentials.

        Returns:
            Credentials object or None if not authenticated
        """
        if not self._is_authenticated:
            self.authenticate()

        return self._credentials

    def get_gspread_client(self) -> Optional[gspread.Client]:
        """
        Get authenticated gspread client.

        Returns:
            gspread Client or None if not authenticated
        """
        if not self._is_authenticated:
            self.authenticate()

        return self._gspread_client

    def is_authenticated(self) -> bool:
        """
        Check if currently authenticated.

        Returns:
            True if authenticated, False otherwise
        """
        return self._is_authenticated

    def refresh_authentication(self) -> bool:
        """
        Refresh authentication.

        Returns:
            True if refresh successful, False otherwise
        """
        self._is_authenticated = False
        self._credentials = None
        self._gspread_client = None

        return self.authenticate()

    def validate_environment(self) -> bool:
        """
        Validate authentication environment.

        Returns:
            True if environment is valid, False otherwise
        """
        # Check for GitHub Actions environment
        if 'GOOGLE_SERVICE_ACCOUNT_KEY' in os.environ:
            try:
                json.loads(os.environ['GOOGLE_SERVICE_ACCOUNT_KEY'])
                return True
            except json.JSONDecodeError:
                return False

        # Check for local file
        return Path(self._service_account_path).exists()


def create_auth_service(service_account_path: str) -> GoogleAuthService:
    """
    Create Google authentication service.

    Args:
        service_account_path: Path to service account JSON file

    Returns:
        GoogleAuthService instance
    """
    return GoogleAuthService(service_account_path)
