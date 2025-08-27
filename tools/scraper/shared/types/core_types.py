"""
Core Type Definitions

This module contains TypedDict definitions, type aliases, and other
type-related utilities for improved type safety across the application.
"""

from typing import TypedDict, Literal, Optional, List, Dict, Any, Union
from dataclasses import dataclass
from datetime import datetime


# Category types
CategoryType = Literal['restaurants', 'parkings', 'toilets']

# Business status types
BusinessStatusType = Literal[
    'OPERATIONAL',
    'CLOSED_TEMPORARILY', 
    'CLOSED_PERMANENTLY',
    'UNKNOWN'
]

# Rating range
RatingType = Union[float, int]  # 1.0 to 5.0


class PlaceData(TypedDict, total=False):
    """
    Type definition for place data from Google Places API.
    Using total=False to make all fields optional for flexibility.
    """
    # Required fields
    place_id: str
    name: str
    
    # Optional core fields
    formatted_address: Optional[str]
    types: List[str]
    rating: Optional[RatingType]
    user_ratings_total: Optional[int]
    business_status: Optional[BusinessStatusType]
    
    # Location data
    geometry: Optional[Dict[str, Any]]
    latitude: Optional[float]
    longitude: Optional[float]
    
    # Contact information
    formatted_phone_number: Optional[str]
    international_phone_number: Optional[str]
    website: Optional[str]
    url: Optional[str]
    
    # Operational data
    opening_hours: Optional[Dict[str, Any]]
    price_level: Optional[int]
    
    # Additional metadata
    plus_code: Optional[Dict[str, str]]
    utc_offset: Optional[int]
    vicinity: Optional[str]
    
    # Photos
    photos: Optional[List[Dict[str, Any]]]
    
    # Reviews
    reviews: Optional[List[Dict[str, Any]]]


class ValidatedPlaceData(TypedDict):
    """Type definition for validated and normalized place data."""
    # Core required fields
    place_id: str
    name: str
    category: CategoryType
    
    # Normalized address fields
    formatted_address: str
    district: Optional[str]  # Sado city district
    is_in_sado: bool
    
    # Location data
    latitude: Optional[float]
    longitude: Optional[float]
    
    # Business information
    types: List[str]
    rating: Optional[RatingType]
    user_ratings_total: Optional[int]
    business_status: BusinessStatusType
    
    # Contact information (cleaned)
    phone_number: Optional[str]
    website: Optional[str]
    google_maps_url: Optional[str]
    
    # Validation metadata
    validation_status: Literal['valid', 'warning', 'error']
    validation_errors: List[str]
    last_validated: datetime


class ProcessingStats(TypedDict):
    """Statistics for data processing operations."""
    total_items: int
    processed_items: int
    failed_items: int
    skipped_items: int
    validation_errors: int
    api_errors: int
    storage_errors: int
    start_time: datetime
    end_time: Optional[datetime]
    duration_seconds: Optional[float]


@dataclass
class BatchProcessingResult:
    """Result of batch processing operation."""
    category: CategoryType
    stats: ProcessingStats
    successful_items: List[ValidatedPlaceData]
    failed_items: List[Dict[str, Any]]
    errors: List[str]
    
    @property
    def success_rate(self) -> float:
        """Calculate success rate as percentage."""
        if self.stats['total_items'] == 0:
            return 0.0
        return (self.stats['processed_items'] / self.stats['total_items']) * 100


class APIResponse(TypedDict, total=False):
    """Type definition for API response structure."""
    status: Literal['OK', 'ZERO_RESULTS', 'OVER_QUERY_LIMIT', 'REQUEST_DENIED', 'INVALID_REQUEST']
    results: List[PlaceData]
    next_page_token: Optional[str]
    error_message: Optional[str]


class ConfigValidationError(TypedDict):
    """Type definition for configuration validation errors."""
    field: str
    value: Any
    error: str
    severity: Literal['error', 'warning']


# Sado City Districts
SADO_DISTRICTS = Literal[
    '両津',      # Ryotsu
    '相川',      # Aikawa
    '佐和田',    # Sawata
    '金井',      # Kanai
    '新穂',      # Niibo
    '畑野',      # Hatano
    '真野',      # Mano
    '小木',      # Ogi
    '羽茂',      # Hamochi
    '赤泊',      # Akadomari
    'その他'     # Other
]

# Common place types for each category
RESTAURANT_TYPES = [
    'restaurant', 'food', 'meal_takeaway', 'meal_delivery',
    'bar', 'cafe', 'bakery', 'establishment'
]

PARKING_TYPES = [
    'parking', 'establishment'
]

TOILET_TYPES = [
    'establishment', 'point_of_interest'
]

# API field masks for different operations
PLACE_DETAILS_FIELDS = [
    'place_id',
    'name', 
    'formatted_address',
    'geometry/location',
    'types',
    'rating',
    'user_ratings_total',
    'business_status',
    'formatted_phone_number',
    'website',
    'url',
    'opening_hours',
    'price_level',
    'photos',
    'reviews'
]

TEXT_SEARCH_FIELDS = [
    'place_id',
    'name',
    'formatted_address', 
    'geometry/location',
    'types',
    'rating',
    'business_status'
]