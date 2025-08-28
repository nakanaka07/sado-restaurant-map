"""
Test configuration and fixtures for scraper tests.
"""
import pytest
import os
import sys
from typing import Dict, Any
from unittest.mock import Mock, MagicMock

# Add the scraper directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import test configurations
from shared.config import ScraperConfig, GoogleAPIConfig, ProcessingConfig


@pytest.fixture
def mock_config():
    """Mock configuration for testing."""
    return ScraperConfig(
        google_api=GoogleAPIConfig(
            places_api_key="test_api_key_that_is_long_enough_for_validation",
            service_account_path=None,  # Use None to avoid file existence check
            spreadsheet_id="test_spreadsheet_id"
        ),
        processing=ProcessingConfig(
            api_delay=0.1,  # Faster for tests
            max_workers=1,  # Single threaded for tests
            max_retries=1,  # Minimal retries for tests
            timeout=10  # Short timeout for tests
        ),
        debug=True
    )


@pytest.fixture
def mock_place_data():
    """Sample place data for testing."""
    return {
        "place_id": "ChIJ123test456",
        "name": "テストレストラン",
        "formatted_address": "新潟県佐渡市両津湊123",
        "types": ["restaurant", "food", "establishment"],
        "rating": 4.2,
        "user_ratings_total": 50,
        "business_status": "OPERATIONAL",
        "geometry": {
            "location": {
                "lat": 38.0333,
                "lng": 138.4333
            }
        },
        "opening_hours": {
            "open_now": True,
            "weekday_text": [
                "月曜日: 11:00～20:00",
                "火曜日: 11:00～20:00",
                "水曜日: 定休日",
                "木曜日: 11:00～20:00",
                "金曜日: 11:00～20:00",
                "土曜日: 11:00～21:00",
                "日曜日: 11:00～21:00"
            ]
        },
        "photos": [
            {"photo_reference": "test_photo_ref_123"}
        ],
        "price_level": 2,
        "website": "https://example-restaurant.com"
    }


@pytest.fixture
def mock_api_client():
    """Mock Google Places API client."""
    client = Mock()
    client.fetch_place_details.return_value = {
        "status": "OK",
        "result": {
            "place_id": "ChIJ123test456",
            "name": "テストレストラン",
            "formatted_address": "新潟県佐渡市両津湊123"
        }
    }
    client.search_places.return_value = {
        "status": "OK",
        "results": []
    }
    return client


@pytest.fixture
def mock_storage():
    """Mock storage service."""
    storage = Mock()
    storage.save.return_value = True
    storage.load.return_value = {}
    return storage


@pytest.fixture
def mock_logger():
    """Mock logger for testing."""
    logger = Mock()
    logger.info = Mock()
    logger.error = Mock()
    logger.warning = Mock()
    logger.debug = Mock()
    logger.context = MagicMock()
    logger.context.return_value.__enter__ = Mock(return_value=logger)
    logger.context.return_value.__exit__ = Mock(return_value=False)
    return logger


@pytest.fixture
def sample_processing_result():
    """Sample processing result for testing."""
    return {
        "success": True,
        "category": "restaurants",
        "processed_count": 10,
        "error_count": 0,
        "duration": 5.5,
        "errors": [],
        "data": []
    }


@pytest.fixture(autouse=True)
def setup_test_environment(monkeypatch):
    """Setup test environment variables."""
    monkeypatch.setenv("PLACES_API_KEY", "test_api_key")
    monkeypatch.setenv("GOOGLE_SERVICE_ACCOUNT_PATH", "test_service_account.json")
    monkeypatch.setenv("SPREADSHEET_ID", "test_spreadsheet_id")
    monkeypatch.setenv("DEBUG", "true")


@pytest.fixture
def temp_data_dir(tmp_path):
    """Temporary directory for test data files."""
    data_dir = tmp_path / "data"
    data_dir.mkdir()

    # Create sample data files
    (data_dir / "restaurants_cid.txt").write_text("sample_cid_1\nsample_cid_2\n")
    (data_dir / "parkings_cid.txt").write_text("parking_cid_1\nparking_cid_2\n")
    (data_dir / "toilets_cid.txt").write_text("toilet_cid_1\ntoilet_cid_2\n")

    return str(data_dir)


# Test categories for parameterized tests
TEST_CATEGORIES = ["restaurants", "parkings", "toilets"]


@pytest.fixture(params=TEST_CATEGORIES)
def category(request):
    """Parameterized category fixture."""
    return request.param
