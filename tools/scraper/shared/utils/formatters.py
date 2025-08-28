"""
Common Output Formatting Utilities

Provides unified formatting for headers, messages, and output across
the scraper system with modern Python practices.
"""

from datetime import datetime
from typing import Optional, Dict, Any

class OutputFormatter:
    """Unified output formatter for consistent messaging."""

    # Configuration constants
    HEADER_WIDTH = 60
    APP_NAME = "Sado Restaurant Map"
    VERSION = "v2.0"

    # Icon constants (modern emoji usage)
    ICONS = {
        'rocket': '🚀',
        'gear': '⚙️',
        'chart': '📊',
        'check': '✅',
        'error': '❌',
        'warning': '⚠️',
        'info': 'ℹ️',
        'map': '🗺️',
        'restaurant': '🍽️',
        'parking': '🅿️',
        'toilet': '🚻',
        'debug': '🔍',
        'time': '⏱️',
        'money': '💰',
        'success': '🎉'
    }

    @classmethod
    def print_header(cls, script_name: str, mode: Optional[str] = None) -> None:
        """Print unified header."""
        title = f"{cls.ICONS['rocket']} {cls.APP_NAME} - {script_name}"
        if mode:
            title += f" ({mode})"

        print(title)
        print("=" * cls.HEADER_WIDTH)
        print(f"🕐 Start time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"📦 Version: {cls.VERSION}")
        print("-" * cls.HEADER_WIDTH)

    @classmethod
    def print_footer(cls, success: bool = True, message: Optional[str] = None) -> None:
        """Print unified footer."""
        print("\n" + "=" * cls.HEADER_WIDTH)

        if success:
            print(f"{cls.ICONS['success']} Processing completed successfully!")
        else:
            print(f"{cls.ICONS['error']} Error occurred during processing.")

        if message:
            print(f"📝 {message}")

        print(f"🕐 End time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    @classmethod
    def print_section(cls, title: str, icon_key: str = 'info') -> None:
        """Print section header."""
        icon = cls.ICONS.get(icon_key, cls.ICONS['info'])
        print(f"\n{icon} {title}")

    @classmethod
    def print_execution_plan(
        cls,
        mode: str,
        target: str,
        total_queries: int,
        estimated_cost: float,
        estimated_time: float
    ) -> None:
        """Print execution plan in unified format."""
        cls.print_section("Execution Plan", "chart")
        print(f"   Mode: {mode}")
        print(f"   Target Data: {target}")
        print(f"   Total Queries: {total_queries} items")
        print(f"   Estimated Cost: ${estimated_cost:.3f} USD")
        print(f"   Estimated Time: {estimated_time:.1f} minutes")

    @classmethod
    def print_results_summary(cls, results: Dict[str, int]) -> None:
        """Print results summary in unified format."""
        cls.print_section("Processing Results", "chart")
        total_processed = 0

        for category, count in results.items():
            icon = cls.ICONS.get(category, cls.ICONS['info'])
            print(f"   {icon} {category}: {count} items")
            total_processed += count

        print(f"\n🎯 Total Processed: {total_processed} items")

    @classmethod
    def print_environment_status(cls, api_key_ok: bool, spreadsheet_ok: bool) -> None:
        """Print environment variable status."""
        cls.print_section("Environment Check", "gear")

        api_status = cls.ICONS['check'] if api_key_ok else cls.ICONS['error']
        sheet_status = cls.ICONS['check'] if spreadsheet_ok else cls.ICONS['error']

        print(f"   {api_status} PLACES_API_KEY")
        print(f"   {sheet_status} SPREADSHEET_ID")

        if api_key_ok and spreadsheet_ok:
            print(f"   {cls.ICONS['check']} All environment variables properly configured")
        else:
            print(f"   {cls.ICONS['error']} Some environment variables are invalid or missing")

# Convenience function aliases
def print_header(script_name: str, mode: Optional[str] = None) -> None:
    """Header output alias."""
    OutputFormatter.print_header(script_name, mode)


def print_footer(success: bool = True, message: Optional[str] = None) -> None:
    """Footer output alias."""
    OutputFormatter.print_footer(success, message)


def print_section(title: str, icon_key: str = 'info') -> None:
    """Section output alias."""
    OutputFormatter.print_section(title, icon_key)
