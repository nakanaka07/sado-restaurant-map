"""
URL to CID Converter

Converts Google Maps URLs to CID format for standardized processing.
Provides functionality for individual URL conversion and batch file processing.
"""

import re
import shutil
import urllib.parse
from pathlib import Path
from datetime import datetime
from typing import List, Tuple, Optional, Dict, Any


class URLConverter:
    """URL to CID converter for Google Maps URLs."""

    def __init__(self):
        # CID pattern (15-25 digits)
        self.cid_pattern = re.compile(r'cid=(\d{15,25})')

        # Google Maps URL pattern
        self.maps_url_pattern = re.compile(r'https://www\.google\.com/maps/place/([^/@]+)/@([^/]+)/.*')

        # Place ID pattern (in Google Maps URLs)
        self.place_id_pattern = re.compile(r'!1s0x[a-f0-9]+:0x([a-f0-9]+)')

    def extract_cid_from_url(self, url: str) -> Optional[str]:
        """Extract CID from URL."""
        # Already in CID format
        cid_match = self.cid_pattern.search(url)
        if cid_match:
            return cid_match.group(1)

        # Extract Place ID from Google Maps URL and convert to CID
        place_id_match = self.place_id_pattern.search(url)
        if place_id_match:
            hex_id = place_id_match.group(1)
            try:
                # Convert hexadecimal to decimal (CID)
                cid = str(int(hex_id, 16))
                return cid
            except ValueError:
                pass

        return None

    def extract_place_name_from_url(self, url: str) -> Optional[str]:
        """Extract place name from URL."""
        maps_match = self.maps_url_pattern.search(url)
        if maps_match:
            encoded_name = maps_match.group(1)
            try:
                # URL decode
                decoded_name = urllib.parse.unquote(encoded_name, encoding='utf-8')
                # Remove extra characters
                decoded_name = re.sub(r'[+\-_]', ' ', decoded_name)
                return decoded_name.strip()
            except Exception:
                pass

        return None

    def convert_line(self, line: str) -> str:
        """Convert a single line to CID format."""
        line = line.strip()

        # Keep comment lines and empty lines as-is
        if not line or line.startswith('#'):
            return line

        # Already in CID format
        if 'maps.google.com/place?cid=' in line:
            return line

        # Detect Google Maps URL
        if 'google.com/maps/place/' in line:
            cid = self.extract_cid_from_url(line)
            place_name = self.extract_place_name_from_url(line)

            if cid and place_name:
                # Convert to CID format
                return f"https://maps.google.com/place?cid={cid}    # {place_name}"
            elif place_name:
                # Return place name only if CID cannot be obtained
                return place_name

        # Return as-is for other cases
        return line

    def convert_file(self, file_path: str, backup: bool = True) -> bool:
        """Convert entire file to CID format."""
        path = Path(file_path)

        if not path.exists():
            print(f"❌ File not found: {file_path}")
            return False

        # Create backup
        if backup:
            backup_path = path.with_suffix(f'.backup_{datetime.now().strftime("%Y%m%d_%H%M%S")}.txt')
            shutil.copy2(path, backup_path)
            print(f"📄 Backup created: {backup_path.name}")

        try:
            # Read file
            with open(path, 'r', encoding='utf-8') as f:
                lines = f.readlines()

            # Convert each line
            converted_lines = []
            conversion_count = 0

            for line_num, line in enumerate(lines, 1):
                original_line = line.rstrip()
                converted_line = self.convert_line(original_line)

                if converted_line != original_line:
                    conversion_count += 1
                    print(f"🔄 {line_num:3d}: {original_line[:50]}... → CID format")

                converted_lines.append(converted_line + '\n')

            # Write file
            with open(path, 'w', encoding='utf-8') as f:
                f.writelines(converted_lines)

            print(f"✅ Conversion complete: {conversion_count} URLs converted to CID format")
            return True

        except Exception as e:
            print(f"❌ Conversion error: {e}")
            return False

    def convert_all_files(self, data_dir: str = "data/urls") -> Dict[str, Any]:
        """Convert all files in specified directory."""
        script_dir = Path(__file__).parent.parent
        data_path = script_dir / data_dir

        results: Dict[str, Any] = {}

        # Search for merged files
        merged_files = list(data_path.glob("*_merged.txt"))

        if not merged_files:
            print(f"⚠️ No merged files found: {data_path}")
            return results

        print(f"🔄 URL to CID conversion started: {len(merged_files)} files")
        print("=" * 50)

        for file_path in merged_files:
            print(f"\n📁 Processing: {file_path.name}")
            success = self.convert_file(str(file_path))
            results[file_path.name] = success

        # Results summary
        successful = sum(results.values())
        total = len(results)

        print("\n" + "=" * 50)
        print(f"🎯 Conversion results: {successful}/{total} files successful")

        for filename, success in results.items():
            status = "✅" if success else "❌"
            print(f"   {status} {filename}")

        return results


def main() -> None:
    """Main processing."""
    converter = URLConverter()

    # Convert all merged files
    results = converter.convert_all_files()

    if all(results.values()):
        print("\n🎉 All file conversions completed!")
    else:
        print("\n⚠️ Some files failed to convert.")


if __name__ == '__main__':
    main()
