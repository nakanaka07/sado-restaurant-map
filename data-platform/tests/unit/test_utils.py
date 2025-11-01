#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test utilities modules: formatters, translators, url_converter

Tests output formatting, translation utilities, and URL conversion functionality.
"""

import pytest
from datetime import datetime
from pathlib import Path
import tempfile
import shutil
from io import StringIO
import sys

from shared.utils.formatters import OutputFormatter, print_header, print_footer, print_section
from shared.utils.translators import (
    translate_business_status,
    translate_price_level,
    translate_types,
    format_opening_hours,
    format_location_data
)
from shared.utils.url_converter import URLConverter


class TestOutputFormatter:
    """Test OutputFormatter class."""

    def test_header_width_constant(self):
        """Test HEADER_WIDTH constant."""
        assert OutputFormatter.HEADER_WIDTH == 60
        assert isinstance(OutputFormatter.HEADER_WIDTH, int)

    def test_app_name_constant(self):
        """Test APP_NAME constant."""
        assert OutputFormatter.APP_NAME == "Sado Restaurant Map"

    def test_version_constant(self):
        """Test VERSION constant."""
        assert OutputFormatter.VERSION == "v2.0"

    def test_icons_dict(self):
        """Test ICONS dictionary."""
        assert isinstance(OutputFormatter.ICONS, dict)
        assert 'rocket' in OutputFormatter.ICONS
        assert 'error' in OutputFormatter.ICONS
        assert 'success' in OutputFormatter.ICONS

    def test_print_header(self, capsys):
        """Test print_header method."""
        OutputFormatter.print_header("Test Script")
        captured = capsys.readouterr()

        assert "Test Script" in captured.out
        assert "Sado Restaurant Map" in captured.out
        assert "=" in captured.out
        assert "Start time" in captured.out

    def test_print_header_with_mode(self, capsys):
        """Test print_header with mode parameter."""
        OutputFormatter.print_header("Test Script", "debug")
        captured = capsys.readouterr()

        assert "Test Script" in captured.out
        assert "(debug)" in captured.out

    def test_print_footer_success(self, capsys):
        """Test print_footer with success=True."""
        OutputFormatter.print_footer(success=True)
        captured = capsys.readouterr()

        assert "completed successfully" in captured.out
        assert "End time" in captured.out

    def test_print_footer_failure(self, capsys):
        """Test print_footer with success=False."""
        OutputFormatter.print_footer(success=False)
        captured = capsys.readouterr()

        assert "Error occurred" in captured.out

    def test_print_footer_with_message(self, capsys):
        """Test print_footer with custom message."""
        OutputFormatter.print_footer(success=True, message="Custom message")
        captured = capsys.readouterr()

        assert "Custom message" in captured.out

    def test_print_section(self, capsys):
        """Test print_section method."""
        OutputFormatter.print_section("Section Title", "info")
        captured = capsys.readouterr()

        assert "Section Title" in captured.out

    def test_print_section_default_icon(self, capsys):
        """Test print_section with default icon."""
        OutputFormatter.print_section("Default Icon")
        captured = capsys.readouterr()

        assert "Default Icon" in captured.out

    def test_print_execution_plan(self, capsys):
        """Test print_execution_plan method."""
        OutputFormatter.print_execution_plan(
            mode="test",
            target="Test Target",
            total_queries=100,
            estimated_cost=1.234,
            estimated_time=5.5
        )
        captured = capsys.readouterr()

        assert "test" in captured.out
        assert "Test Target" in captured.out
        assert "100" in captured.out
        assert "$1.234" in captured.out
        assert "5.5" in captured.out

    def test_print_results_summary(self, capsys):
        """Test print_results_summary method."""
        results = {
            'success': 50,
            'failed': 10,
            'skipped': 5
        }
        OutputFormatter.print_results_summary(results)
        captured = capsys.readouterr()

        assert "50" in captured.out
        assert "10" in captured.out
        assert "5" in captured.out
        assert "65" in captured.out  # Total

    def test_print_environment_status_all_ok(self, capsys):
        """Test print_environment_status with all variables OK."""
        OutputFormatter.print_environment_status(api_key_ok=True, spreadsheet_ok=True)
        captured = capsys.readouterr()

        assert "PLACES_API_KEY" in captured.out
        assert "SPREADSHEET_ID" in captured.out
        assert "properly configured" in captured.out

    def test_print_environment_status_with_errors(self, capsys):
        """Test print_environment_status with errors."""
        OutputFormatter.print_environment_status(api_key_ok=False, spreadsheet_ok=False)
        captured = capsys.readouterr()

        assert "PLACES_API_KEY" in captured.out
        assert "SPREADSHEET_ID" in captured.out
        assert "invalid or missing" in captured.out

    def test_convenience_functions(self, capsys):
        """Test convenience function aliases."""
        print_header("Test")
        print_footer()
        print_section("Test Section")
        captured = capsys.readouterr()

        assert len(captured.out) > 0


class TestTranslators:
    """Test translation utilities."""

    def test_translate_business_status_operational(self):
        """Test translating OPERATIONAL status."""
        result = translate_business_status("OPERATIONAL")
        assert result == "営業中"

    def test_translate_business_status_closed_temporarily(self):
        """Test translating CLOSED_TEMPORARILY status."""
        result = translate_business_status("CLOSED_TEMPORARILY")
        assert result == "一時休業"

    def test_translate_business_status_closed_permanently(self):
        """Test translating CLOSED_PERMANENTLY status."""
        result = translate_business_status("CLOSED_PERMANENTLY")
        assert result == "閉店"

    def test_translate_business_status_none(self):
        """Test translating None status."""
        result = translate_business_status(None)
        assert result == "不明"

    def test_translate_business_status_empty(self):
        """Test translating empty string status."""
        result = translate_business_status("")
        assert result == "不明"

    def test_translate_business_status_unknown(self):
        """Test translating unknown status."""
        result = translate_business_status("UNKNOWN_STATUS")
        assert result == "UNKNOWN_STATUS"

    def test_translate_price_level_0(self):
        """Test translating price level 0 (free)."""
        result = translate_price_level(0)
        assert result == "無料"

    def test_translate_price_level_1(self):
        """Test translating price level 1 (cheap)."""
        result = translate_price_level(1)
        assert result == "安い（¥）"

    def test_translate_price_level_2(self):
        """Test translating price level 2 (moderate)."""
        result = translate_price_level(2)
        assert result == "普通（¥¥）"

    def test_translate_price_level_3(self):
        """Test translating price level 3 (expensive)."""
        result = translate_price_level(3)
        assert result == "高い（¥¥¥）"

    def test_translate_price_level_4(self):
        """Test translating price level 4 (very expensive)."""
        result = translate_price_level(4)
        assert result == "非常に高い（¥¥¥¥）"

    def test_translate_price_level_none(self):
        """Test translating None price level."""
        result = translate_price_level(None)
        assert result == ""

    def test_translate_price_level_unknown(self):
        """Test translating unknown price level."""
        result = translate_price_level(999)
        assert result == "レベル999"

    def test_translate_types_restaurant(self):
        """Test translating restaurant type."""
        result = translate_types(["restaurant"])
        assert "レストラン" in result

    def test_translate_types_multiple(self):
        """Test translating multiple types."""
        result = translate_types(["restaurant", "cafe", "bar"])
        assert "レストラン" in result
        assert "カフェ" in result
        assert "バー" in result

    def test_translate_types_unknown(self):
        """Test translating unknown types (returns first 3)."""
        unknown_types = ["unknown1", "unknown2", "unknown3", "unknown4"]
        result = translate_types(unknown_types)
        assert len(result) <= 3
        assert "unknown1" in result

    def test_translate_types_mixed(self):
        """Test translating mixed known and unknown types."""
        result = translate_types(["restaurant", "unknown", "cafe"])
        assert "レストラン" in result
        assert "カフェ" in result
        # Unknown types are not included when known types exist

    def test_translate_types_empty(self):
        """Test translating empty types list."""
        result = translate_types([])
        assert result == []

    def test_format_opening_hours_with_weekday_text(self):
        """Test formatting opening hours with weekday_text."""
        opening_hours = {
            "weekday_text": [
                "Monday: 9:00 AM – 5:00 PM",
                "Tuesday: 9:00 AM – 5:00 PM"
            ]
        }
        result = format_opening_hours(opening_hours)
        assert "Monday" in result
        assert "Tuesday" in result

    def test_format_opening_hours_none(self):
        """Test formatting None opening hours."""
        result = format_opening_hours(None)
        assert result == ""

    def test_format_opening_hours_empty(self):
        """Test formatting empty opening hours."""
        result = format_opening_hours({})
        assert result == ""

    def test_format_location_data_valid(self):
        """Test formatting valid location data."""
        location = {"lat": 38.0185, "lng": 138.3668}
        lat, lng = format_location_data(location)
        assert lat == "38.0185"
        assert lng == "138.3668"

    def test_format_location_data_none(self):
        """Test formatting None location data."""
        lat, lng = format_location_data(None)
        assert lat == ""
        assert lng == ""

    def test_format_location_data_empty(self):
        """Test formatting empty location data."""
        lat, lng = format_location_data({})
        assert lat == ""
        assert lng == ""


class TestURLConverter:
    """Test URLConverter class."""

    def test_init(self):
        """Test URLConverter initialization."""
        converter = URLConverter()
        assert converter.cid_pattern is not None
        assert converter.maps_url_pattern is not None
        assert converter.place_id_pattern is not None

    def test_extract_cid_from_cid_url(self):
        """Test extracting CID from CID URL."""
        converter = URLConverter()
        url = "https://maps.google.com/place?cid=1234567890123456789"
        cid = converter.extract_cid_from_url(url)
        assert cid == "1234567890123456789"

    def test_extract_cid_from_maps_url(self):
        """Test extracting CID from Google Maps URL with hex Place ID."""
        converter = URLConverter()
        url = "https://www.google.com/maps/place/Test/@38.0,138.0,15z/data=!1s0x1234:0x1f40"
        cid = converter.extract_cid_from_url(url)
        # 0x1f40 = 8000 in decimal
        assert cid == "8000"

    def test_extract_cid_from_invalid_url(self):
        """Test extracting CID from invalid URL."""
        converter = URLConverter()
        url = "https://example.com/invalid"
        cid = converter.extract_cid_from_url(url)
        assert cid is None

    def test_extract_place_name_from_maps_url(self):
        """Test extracting place name from Google Maps URL."""
        converter = URLConverter()
        url = "https://www.google.com/maps/place/Test+Restaurant/@38.0,138.0,15z/"
        name = converter.extract_place_name_from_url(url)
        assert name == "Test Restaurant"

    def test_extract_place_name_with_encoded_chars(self):
        """Test extracting place name with URL-encoded characters."""
        converter = URLConverter()
        url = "https://www.google.com/maps/place/%E3%83%86%E3%82%B9%E3%83%88/@38.0,138.0,15z/"
        name = converter.extract_place_name_from_url(url)
        assert name is not None

    def test_extract_place_name_from_invalid_url(self):
        """Test extracting place name from invalid URL."""
        converter = URLConverter()
        url = "https://example.com/invalid"
        name = converter.extract_place_name_from_url(url)
        assert name is None

    def test_convert_line_already_cid(self):
        """Test converting line that's already in CID format."""
        converter = URLConverter()
        line = "https://maps.google.com/place?cid=1234567890123456789"
        result = converter.convert_line(line)
        assert result == line

    def test_convert_line_comment(self):
        """Test converting comment line (should not change)."""
        converter = URLConverter()
        line = "# This is a comment"
        result = converter.convert_line(line)
        assert result == line

    def test_convert_line_empty(self):
        """Test converting empty line."""
        converter = URLConverter()
        line = ""
        result = converter.convert_line(line)
        assert result == ""

    def test_convert_line_maps_url(self):
        """Test converting Google Maps URL to CID format."""
        converter = URLConverter()
        url = "https://www.google.com/maps/place/Test+Restaurant/@38.0,138.0,15z/data=!1s0x1234:0x1f40"
        result = converter.convert_line(url)
        # Should contain CID format
        assert "maps.google.com/place?cid=" in result or "Test Restaurant" in result

    def test_convert_file_not_found(self):
        """Test converting non-existent file."""
        converter = URLConverter()
        result = converter.convert_file("nonexistent_file.txt", backup=False)
        assert result is False

    def test_convert_file_success(self):
        """Test successful file conversion."""
        converter = URLConverter()

        # Create temporary file
        with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.txt', encoding='utf-8') as f:
            temp_path = f.name
            f.write("# Test file\n")
            f.write("https://maps.google.com/place?cid=1234567890123456789\n")
            f.write("\n")

        try:
            result = converter.convert_file(temp_path, backup=False)
            assert result is True

            # Verify file content
            with open(temp_path, 'r', encoding='utf-8') as f:
                content = f.read()
                assert "# Test file" in content
        finally:
            # Cleanup
            Path(temp_path).unlink(missing_ok=True)

    def test_convert_all_files_no_files(self, tmp_path):
        """Test convert_all_files with no matching files."""
        converter = URLConverter()

        # Use temporary directory
        results = converter.convert_all_files(data_dir=str(tmp_path))
        assert isinstance(results, dict)
        assert len(results) == 0
