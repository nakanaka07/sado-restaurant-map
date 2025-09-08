#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Data Validator - 新しいアーキテクチャ対応版

データ検証とクリーニングを行うサービス
"""

from typing import Dict, Any, List, Optional
from datetime import datetime

from core.domain.interfaces import DataValidator, ProcessingResult
from shared.types.core_types import PlaceData, ValidatedPlaceData, CategoryType
from shared.exceptions import ValidationError
from shared.logger import get_logger


class PlaceDataValidator(DataValidator):
    """Place data validator implementation"""

    def __init__(self):
        """Initialize the validator"""
        self._logger = get_logger(__name__)

        # Sado bounds for location validation
        self._sado_bounds = {
            'north': 38.39,
            'south': 37.74,
            'east': 138.62,
            'west': 137.85
        }

        # District mapping
        self._district_keywords = [
            '両津', '相川', '佐和田', '金井', '新穂',
            '畑野', '真野', '小木', '羽茂', '赤泊'
        ]

    def validate(self, data: PlaceData) -> ProcessingResult:
        """
        Validate and normalize a single place data item.

        Args:
            data: The place data to validate

        Returns:
            ProcessingResult with validation outcome
        """
        errors = []
        warnings = []

        try:
            # Required field validation
            place_id = self._validate_place_id(data, errors)
            name = self._validate_name(data, errors)
            location = self._validate_location(data, warnings)

            # Optional field validation
            address = self._clean_address(data)
            types = self._clean_types(data)
            rating = self._validate_rating(data, warnings)
            business_status = self._clean_business_status(data)

            # Location analysis
            is_in_sado, district = self._analyze_location(location, address)

            # Create validated data
            validated_data: ValidatedPlaceData = {
                'place_id': place_id,
                'name': name,
                'category': 'restaurants',  # Default, will be overridden
                'formatted_address': address,
                'district': district,
                'is_in_sado': is_in_sado,
                'latitude': location.get('latitude') if location else None,
                'longitude': location.get('longitude') if location else None,
                'types': types,
                'rating': rating,
                'user_ratings_total': data.get('userRatingCount') or data.get('user_ratings_total'),
                'business_status': business_status,
                'phone_number': self._clean_phone_number(data),
                'website': self._clean_website(data),
                'google_maps_url': self._generate_maps_url(place_id),
                'validation_status': 'valid' if not errors else 'error',
                'validation_errors': errors + warnings,
                'last_validated': datetime.now()
            }

            return ProcessingResult(
                success=len(errors) == 0,
                processed_count=1 if len(errors) == 0 else 0,
                error_count=1 if len(errors) > 0 else 0,
                errors=errors,
                data=validated_data
            )

        except Exception as e:
            self._logger.error("Validation failed", error=str(e), data_preview=str(data)[:100])
            return ProcessingResult(
                success=False,
                processed_count=0,
                error_count=1,
                errors=[f"Validation exception: {e}"]
            )

    def validate_batch(self, data_list: List[PlaceData]) -> ProcessingResult:
        """
        Validate a batch of place data items.

        Args:
            data_list: List of place data items to validate

        Returns:
            ProcessingResult with batch validation outcome
        """
        total_processed = 0
        total_errors = 0
        all_errors = []
        validated_items = []

        for i, data in enumerate(data_list):
            try:
                result = self.validate(data)
                if result.success:
                    total_processed += 1
                    if result.data:
                        validated_items.append(result.data)
                else:
                    total_errors += 1
                    all_errors.extend(result.errors)

            except Exception as e:
                total_errors += 1
                error_msg = f"Item {i}: {e}"
                all_errors.append(error_msg)
                self._logger.error("Batch validation item failed", index=i, error=str(e))

        return ProcessingResult(
            success=total_processed > 0,
            processed_count=total_processed,
            error_count=total_errors,
            errors=all_errors,
            data=validated_items
        )

    def _validate_place_id(self, data: PlaceData, errors: List[str]) -> str:
        """Validate place ID"""
        place_id = data.get('id') or data.get('place_id') or ''
        if not place_id:
            errors.append("Place ID is required")
            return ''
        return str(place_id).strip()

    def _validate_name(self, data: PlaceData, errors: List[str]) -> str:
        """Validate place name"""
        # Try different name fields
        name = ''
        display_name = data.get('displayName')
        if isinstance(display_name, dict):
            name = display_name.get('text', '')
        elif isinstance(display_name, str):
            name = display_name

        if not name:
            name = data.get('name', '')

        if not name:
            errors.append("Place name is required")
            return ''

        return str(name).strip()

    def _validate_location(self, data: PlaceData, warnings: List[str]) -> Optional[Dict[str, float]]:
        """Validate location data"""
        location = data.get('location')
        if not location:
            # Try alternative location formats
            geometry = data.get('geometry')
            if geometry and 'location' in geometry:
                location = geometry['location']
            elif data.get('latitude') and data.get('longitude'):
                location = {
                    'latitude': data['latitude'],
                    'longitude': data['longitude']
                }

        if not location:
            warnings.append("Location data is missing")
            return None

        try:
            lat = float(location.get('latitude') or location.get('lat', 0))
            lng = float(location.get('longitude') or location.get('lng', 0))

            if lat == 0 and lng == 0:
                warnings.append("Location coordinates are zero")
                return None

            return {'latitude': lat, 'longitude': lng}

        except (ValueError, TypeError):
            warnings.append("Invalid location coordinates")
            return None

    def _validate_rating(self, data: PlaceData, warnings: List[str]) -> Optional[float]:
        """Validate rating"""
        rating = data.get('rating')
        if rating is None:
            return None

        try:
            rating_val = float(rating)
            if not (0 <= rating_val <= 5):
                warnings.append("Rating out of valid range (0-5)")
                return None
            return rating_val
        except (ValueError, TypeError):
            warnings.append("Invalid rating format")
            return None

    def _clean_address(self, data: PlaceData) -> str:
        """Clean and normalize address"""
        address = (data.get('formattedAddress') or
                  data.get('formatted_address') or
                  data.get('shortFormattedAddress') or '')
        return str(address).strip()

    def _clean_types(self, data: PlaceData) -> List[str]:
        """Clean and normalize types"""
        types = data.get('types', [])
        if not isinstance(types, list):
            return []
        return [str(t).strip() for t in types if t]

    def _clean_business_status(self, data: PlaceData) -> str:
        """Clean business status"""
        status = data.get('businessStatus') or data.get('business_status') or ''
        status_map = {
            'OPERATIONAL': 'OPERATIONAL',
            'CLOSED_TEMPORARILY': 'CLOSED_TEMPORARILY',
            'CLOSED_PERMANENTLY': 'CLOSED_PERMANENTLY'
        }
        return status_map.get(str(status).upper(), 'UNKNOWN')

    def _clean_phone_number(self, data: PlaceData) -> Optional[str]:
        """Clean phone number"""
        phone = (data.get('nationalPhoneNumber') or
                data.get('formatted_phone_number') or
                data.get('international_phone_number') or '')
        return str(phone).strip() if phone else None

    def _clean_website(self, data: PlaceData) -> Optional[str]:
        """Clean website URL"""
        website = (data.get('websiteUri') or
                  data.get('website') or
                  data.get('url') or '')
        return str(website).strip() if website else None

    def _generate_maps_url(self, place_id: str) -> Optional[str]:
        """Generate Google Maps URL"""
        if place_id:
            return f"https://maps.google.com/?cid={place_id}"
        return None

    def _analyze_location(self, location: Optional[Dict[str, float]], address: str) -> tuple[bool, str]:
        """Analyze if location is in Sado and determine district"""
        if not location:
            # Try to determine from address
            if '佐渡' in address:
                district = self._classify_district_from_address(address)
                return True, district
            return False, '市外'

        try:
            lat = location['latitude']
            lng = location['longitude']

            # Check if within Sado bounds
            is_in_sado = (self._sado_bounds['south'] <= lat <= self._sado_bounds['north'] and
                         self._sado_bounds['west'] <= lng <= self._sado_bounds['east'])

            if is_in_sado:
                district = self._classify_district_from_address(address)
                return True, district
            else:
                return False, '市外'

        except (KeyError, TypeError):
            return False, '市外'

    def _classify_district_from_address(self, address: str) -> str:
        """Classify district from address string"""
        for district in self._district_keywords:
            if district in address:
                return district
        return '佐渡市内'


def create_place_validator() -> PlaceDataValidator:
    """Create place data validator"""
    return PlaceDataValidator()
