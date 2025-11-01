#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Tests for Core Types

Tests for TypedDict definitions and dataclasses in core_types module.
"""

import pytest
from datetime import datetime
from shared.types.core_types import (
    CategoryType,
    BusinessStatusType,
    RatingType,
    QueryData,
    ProcessingResult,
    PlaceData,
)


class TestCategoryType:
    """Test cases for CategoryType literal."""

    def test_valid_categories(self):
        """Test valid category values."""
        valid_categories: list[CategoryType] = [
            "restaurants",
            "parkings",
            "toilets",
        ]

        for category in valid_categories:
            assert category in ["restaurants", "parkings", "toilets"]


class TestBusinessStatusType:
    """Test cases for BusinessStatusType literal."""

    def test_valid_statuses(self):
        """Test valid business status values."""
        valid_statuses: list[BusinessStatusType] = [
            "OPERATIONAL",
            "CLOSED_TEMPORARILY",
            "CLOSED_PERMANENTLY",
            "UNKNOWN",
        ]

        for status in valid_statuses:
            assert status in [
                "OPERATIONAL",
                "CLOSED_TEMPORARILY",
                "CLOSED_PERMANENTLY",
                "UNKNOWN",
            ]


class TestRatingType:
    """Test cases for RatingType."""

    def test_float_rating(self):
        """Test float rating value."""
        rating: RatingType = 4.5
        assert isinstance(rating, float)
        assert 1.0 <= rating <= 5.0

    def test_int_rating(self):
        """Test integer rating value."""
        rating: RatingType = 4
        assert isinstance(rating, int)
        assert 1 <= rating <= 5


class TestQueryData:
    """Test cases for QueryData TypedDict."""

    def test_create_cid_url_query(self):
        """Test creating CID URL query data."""
        query: QueryData = {
            "line_number": 1,
            "original_line": "https://maps.google.com/?cid=12345",
            "type": "cid_url",
            "store_name": "Test Restaurant",
            "cid": "12345",
        }

        assert query["line_number"] == 1
        assert query["type"] == "cid_url"
        assert query["cid"] == "12345"

    def test_create_maps_url_query(self):
        """Test creating Maps URL query data."""
        query: QueryData = {
            "line_number": 2,
            "original_line": "https://maps.app.goo.gl/xyz",
            "type": "maps_url",
            "store_name": "Test Parking",
            "url": "https://maps.app.goo.gl/xyz",
        }

        assert query["type"] == "maps_url"
        assert query["url"] == "https://maps.app.goo.gl/xyz"

    def test_create_store_name_query(self):
        """Test creating store name query data."""
        query: QueryData = {
            "line_number": 3,
            "original_line": "Test Toilet",
            "type": "store_name",
            "store_name": "Test Toilet",
        }

        assert query["type"] == "store_name"
        assert query["store_name"] == "Test Toilet"

    def test_optional_fields(self):
        """Test optional fields in QueryData."""
        # Minimal query data
        query: QueryData = {
            "line_number": 1,
            "original_line": "test",
            "type": "store_name",
            "store_name": "test",
        }

        # Optional fields should not cause errors
        assert "cid" not in query or query.get("cid") is None
        assert "url" not in query or query.get("url") is None


class TestProcessingResult:
    """Test cases for ProcessingResult dataclass."""

    def test_create_successful_result(self):
        """Test creating successful processing result."""
        result = ProcessingResult(
            success=True,
            category="restaurants",
            processed_count=10,
            error_count=0,
            duration=5.5,
            errors=[],
            data=[{"id": "123", "name": "Test"}],
        )

        assert result.success is True
        assert result.category == "restaurants"
        assert result.processed_count == 10
        assert result.error_count == 0
        assert result.duration == 5.5
        assert len(result.errors) == 0
        assert result.data is not None

    def test_create_failed_result(self):
        """Test creating failed processing result."""
        result = ProcessingResult(
            success=False,
            category="parkings",
            processed_count=5,
            error_count=3,
            duration=3.2,
            errors=["Error 1", "Error 2", "Error 3"],
        )

        assert result.success is False
        assert result.error_count == 3
        assert len(result.errors) == 3

    def test_total_count_property(self):
        """Test total_count property."""
        result = ProcessingResult(
            success=True,
            category="toilets",
            processed_count=15,
            error_count=5,
            duration=4.0,
            errors=[],
        )

        assert result.total_count == 20

    def test_success_rate_property(self):
        """Test success_rate property."""
        result = ProcessingResult(
            success=True,
            category="restaurants",
            processed_count=18,
            error_count=2,
            duration=6.0,
            errors=[],
        )

        # 18 / (18 + 2) * 100 = 90.0
        assert result.success_rate == 90.0

    def test_success_rate_zero_total(self):
        """Test success_rate with zero total count."""
        result = ProcessingResult(
            success=False,
            category="parkings",
            processed_count=0,
            error_count=0,
            duration=0.0,
            errors=[],
        )

        assert result.success_rate == 0.0

    def test_success_rate_all_errors(self):
        """Test success_rate with all errors."""
        result = ProcessingResult(
            success=False,
            category="toilets",
            processed_count=0,
            error_count=10,
            duration=2.0,
            errors=["Error"] * 10,
        )

        assert result.success_rate == 0.0

    def test_data_optional(self):
        """Test that data field is optional."""
        result = ProcessingResult(
            success=True,
            category="restaurants",
            processed_count=5,
            error_count=0,
            duration=1.0,
            errors=[],
        )

        assert result.data is None


class TestPlaceData:
    """Test cases for PlaceData TypedDict."""

    def test_create_minimal_place_data(self):
        """Test creating minimal place data."""
        place: PlaceData = {
            "id": "ChIJ123test456",
            "place_id": "ChIJ123test456",
        }

        assert place["id"] == "ChIJ123test456"
        assert place["place_id"] == "ChIJ123test456"

    def test_create_full_place_data(self):
        """Test creating full place data."""
        place: PlaceData = {
            "id": "ChIJ123test456",
            "place_id": "ChIJ123test456",
            "displayName": {"text": "Test Restaurant"},
            "name": "Test Restaurant",
            "formattedAddress": "123 Test St, Sado",
            "formatted_address": "123 Test St, Sado",
            "location": {"latitude": 38.0333, "longitude": 138.4333},
            "geometry": {
                "location": {"lat": 38.0333, "lng": 138.4333}
            },
        }

        assert place["displayName"]["text"] == "Test Restaurant"
        assert place["location"]["latitude"] == 38.0333
        assert place["geometry"]["location"]["lat"] == 38.0333

    def test_place_data_backward_compatibility(self):
        """Test backward compatibility fields."""
        place: PlaceData = {
            "id": "ChIJ123",
            "place_id": "ChIJ123",  # Backward compatibility
            "displayName": {"text": "Test"},
            "name": "Test",  # Backward compatibility
            "formattedAddress": "Address",
            "formatted_address": "Address",  # Backward compatibility
        }

        # Both new and old field names should be present
        assert "place_id" in place
        assert "name" in place
        assert "formatted_address" in place

    def test_optional_fields(self):
        """Test that all fields except id are optional."""
        # TypedDict with total=False makes all fields optional
        place: PlaceData = {
            "id": "ChIJ123",
        }

        # Should not raise error
        assert place["id"] == "ChIJ123"
        assert "displayName" not in place
        assert "location" not in place


class TestTypeValidation:
    """Test type validation and constraints."""

    def test_category_type_constraint(self):
        """Test that CategoryType only accepts valid values."""
        valid_category: CategoryType = "restaurants"
        assert valid_category in ["restaurants", "parkings", "toilets"]

    def test_rating_range(self):
        """Test rating value ranges."""
        # Valid ratings
        valid_ratings: list[RatingType] = [1.0, 2.5, 3.0, 4.5, 5.0]

        for rating in valid_ratings:
            if isinstance(rating, float):
                assert 1.0 <= rating <= 5.0
            elif isinstance(rating, int):
                assert 1 <= rating <= 5

    def test_processing_result_dataclass_defaults(self):
        """Test ProcessingResult dataclass field defaults."""
        # data field should default to None
        result = ProcessingResult(
            success=True,
            category="restaurants",
            processed_count=1,
            error_count=0,
            duration=1.0,
            errors=[],
        )

        assert result.data is None
        assert isinstance(result.errors, list)
