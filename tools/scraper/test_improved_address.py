#!/usr/bin/env python3
"""改善された所在地抽出メソッドのテスト"""

import re

def extract_short_address(full_address: str) -> str:
    """完全住所から簡潔な所在地を抽出"""
    if not full_address:
        return ''

    # 佐渡市パターンを試行
    result = _try_sado_patterns(full_address)
    if result:
        return result

    # 一般的なパターンを試行
    result = _try_general_patterns(full_address)
    if result:
        return result

    # フォールバック処理
    return _fallback_address_extraction(full_address)

def _try_sado_patterns(full_address: str) -> str:
    """佐渡市専用パターンで住所抽出を試行"""
    sado_patterns = [
        # パターン1: 日本、〒郵便番号 新潟県佐渡市[地域名+番地] の形式
        r'日本、〒\d+\s+新潟県(佐渡市.+)',
        # パターン2: 新潟県佐渡市[地域名+番地] の形式
        r'新潟県(佐渡市.+)',
        # パターン3: 佐渡市[地域名+番地] の形式
        r'(佐渡市.+)',
    ]

    for pattern in sado_patterns:
        match = re.search(pattern, full_address)
        if match:
            result = match.group(1).strip()
            cleaned_result = _clean_area_name(result)
            if cleaned_result and cleaned_result.startswith('佐渡市'):
                return cleaned_result
    return ''

def _try_general_patterns(full_address: str) -> str:
    """一般的なパターンで住所抽出を試行"""
    general_pattern = r'[都道府県]([^都道府県\s,、]+[市区町村])([^\d〒\s,、]+)(?:\s*\d+.*)?'
    match = re.search(general_pattern, full_address)

    if match and len(match.groups()) == 2:
        city = match.group(1).strip()
        area = match.group(2).strip()
        cleaned_area = _clean_area_name(area)
        return f"{city}{cleaned_area}" if cleaned_area else city
    return ''

def _clean_area_name(area_name: str) -> str:
    """地域名から不要な文字を除去（郵便番号・国名のみ、番地は保持）"""
    # 郵便番号パターンを除去
    result = re.sub(r'〒\d+\s*', '', area_name)
    # 行末の不要な記号・空白を除去（ただし数字・ハイフンは保持）
    result = re.sub(r'[,、]\s*$', '', result)
    return result.strip()

def _fallback_address_extraction(full_address: str) -> str:
    """フォールバック処理で住所抽出"""
    if re.search(r'佐渡市', full_address):
        return "佐渡市"
    return full_address

if __name__ == "__main__":
    test_cases = [
        '日本、〒952-3205 新潟県佐渡市鷲崎',
        '日本、〒952-3203 新潟県佐渡市願',
        '日本、〒952-2201 新潟県佐渡市岩谷口',
        '日本、〒952-1511 新潟県佐渡市相川栄町 １９',
        '日本、〒952-0011 新潟県佐渡市両津夷９５２ 0011',
        '佐渡市原黒６６２−２',
        '佐渡市加茂歌代４５４',
        '佐渡市徳和６１５４',
        '佐渡市両津大川',
        '佐渡市達者',
        '日本、〒952-1552 新潟県佐渡市相川江戸沢町２３−２',
        '佐渡市羽茂本郷４８６−５',
        '佐渡市小木強清水１９８'
    ]

    print("=== 改善された所在地抽出テスト ===")
    for test_case in test_cases:
        result = extract_short_address(test_case)
        print(f"元の住所: {test_case}")
        print(f"所在地: {result}")
        print("-" * 50)
