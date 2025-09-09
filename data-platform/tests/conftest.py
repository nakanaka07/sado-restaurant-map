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


# Test constants to avoid duplication
TEST_RESTAURANT_NAME = "テストレストラン"
TEST_RESTAURANT_ADDRESS = "新潟県佐渡市両津湊123"
TEST_PLACE_ID = "ChIJ123test456"


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
        "place_id": TEST_PLACE_ID,
        "name": TEST_RESTAURANT_NAME,
        "formatted_address": TEST_RESTAURANT_ADDRESS,
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
            "place_id": TEST_PLACE_ID,
            "name": TEST_RESTAURANT_NAME,
            "formatted_address": TEST_RESTAURANT_ADDRESS
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


@pytest.fixture
def mock_container():
    """Mock DI container for integration tests."""
    # Simple mock container instead of actual DIContainer
    container = Mock()

    # Mock services
    mock_api_client = Mock()
    mock_storage = Mock()
    mock_logger = Mock()

    # Configure mock responses
    mock_api_client.fetch_place_details.return_value = {
        "status": "OK",
        "result": {
            "place_id": TEST_PLACE_ID,
            "name": TEST_RESTAURANT_NAME,
            "formatted_address": TEST_RESTAURANT_ADDRESS,
            "types": ["restaurant", "food", "establishment"],
            "rating": 4.2
        }
    }

    mock_storage.save.return_value = True
    mock_storage.load.return_value = {}

    # Mock get method to return services
    def mock_get(service_name):
        services = {
            "api_client": mock_api_client,
            "storage": mock_storage,
            "logger": mock_logger
        }
        return services.get(service_name)

    container.get.side_effect = mock_get

    return container


@pytest.fixture
def mock_fast_api_client():
    """Mock fast API client for performance tests."""
    client = Mock()
    client.fetch_place_details = Mock(return_value={
        "status": "OK",
        "result": {
            "place_id": TEST_PLACE_ID,
            "name": TEST_RESTAURANT_NAME,
            "formatted_address": TEST_RESTAURANT_ADDRESS,
            "rating": 4.2
        }
    })
    return client


@pytest.fixture
def sample_data_small():
    """Small sample data for performance tests."""
    return [f"place_id_{i}" for i in range(10)]


@pytest.fixture
def sample_data_medium():
    """Medium sample data for performance tests."""
    return [f"place_id_{i}" for i in range(100)]


# Fixture for cache service tests (not async to avoid pytest issues)
@pytest.fixture
def cache_service():
    """Mock cache service for integration tests."""
    from shared.cache_service import CacheService, CacheConfig

    # Create mock cache service with proper mocking
    cache_config = CacheConfig(redis_nodes=[])

    # Create a mock service that doesn't initialize Redis
    service = Mock(spec=CacheService)
    service.config = cache_config

    # Mock Redis cluster operations
    mock_redis = Mock()
    mock_redis.get = Mock(return_value=None)
    mock_redis.set = Mock(return_value=True)
    mock_redis.ping = Mock(return_value=True)
    mock_redis.mset = Mock(return_value=True)
    mock_redis.scan_iter = Mock(return_value=[])
    mock_redis.info = Mock(return_value={"memory_used": 1024})

    # Attach the mock Redis to the service
    service.redis_cluster = mock_redis

    # Mock the private method that was causing issues
    service._perform_health_check = Mock(return_value={"status": "healthy"})

    # Mock other methods
    service.get_cache_stats = Mock(return_value=Mock(hit_rate=0.8, memory_usage=1024))
    service.get_performance_stats = Mock(return_value={"avg_response_time": 0.001})
    service.get = Mock(return_value=None)
    service.set = Mock(return_value=True)
    service.batch_set = Mock(return_value=True)
    service.invalidate_pattern = Mock(return_value=0)
    service.health_check = Mock(return_value={"status": "healthy"})

    return service
