"""
Translation Utilities for Google Places API

Provides Japanese translations for Google Places API response fields
including business status, price levels, and place types.
"""

from typing import List, Optional, Dict, Any


def translate_business_status(status: Optional[str]) -> str:
    """Translate business status to Japanese."""
    if not status:
        return '不明'

    status_map = {
        'OPERATIONAL': '営業中',
        'CLOSED_TEMPORARILY': '一時休業',
        'CLOSED_PERMANENTLY': '閉店',
        '': '不明'
    }
    return status_map.get(status, status)


def translate_price_level(level: Optional[int]) -> str:
    """Translate price level to Japanese."""
    if level is None:
        return ''
    price_map = {
        0: '無料',
        1: '安い（¥）',
        2: '普通（¥¥）',
        3: '高い（¥¥¥）',
        4: '非常に高い（¥¥¥¥）'
    }
    return price_map.get(level, f'レベル{level}')


def translate_types(types: List[str]) -> List[str]:
    """Translate place types to Japanese."""
    type_map = {
        'restaurant': 'レストラン',
        'food': '飲食店',
        'meal_takeaway': 'テイクアウト',
        'cafe': 'カフェ',
        'bar': 'バー',
        'bakery': 'パン・洋菓子店',
        'meal_delivery': 'デリバリー',
        'store': '店舗',
        'establishment': '施設',
        'lodging': '宿泊施設',
        'tourist_attraction': '観光地',
        'parking': '駐車場',
        'gas_station': 'ガソリンスタンド',
        'convenience_store': 'コンビニエンスストア',
        'supermarket': 'スーパーマーケット',
        'shopping_mall': 'ショッピングモール',
        'clothing_store': '衣料品店',
        'electronics_store': '電器店',
        'pharmacy': '薬局',
        'bank': '銀行',
        'atm': 'ATM',
        'hospital': '病院',
        'dentist': '歯科医院',
        'veterinary_care': '動物病院',
        'school': '学校',
        'library': '図書館',
        'museum': '博物館',
        'church': '教会',
        'temple': '寺院',
        'shrine': '神社',
        'cemetery': '墓地',
        'park': '公園',
        'amusement_park': '遊園地',
        'zoo': '動物園',
        'aquarium': '水族館',
        'stadium': 'スタジアム',
        'gym': 'ジム',
        'spa': 'スパ',
        'beauty_salon': '美容院',
        'hair_care': 'ヘアサロン',
        'laundry': 'ランドリー',
        'post_office': '郵便局',
        'fire_station': '消防署',
        'police': '警察署',
        'city_hall': '市役所',
        'courthouse': '裁判所',
        'embassy': '大使館',
        # Places API (New) v1 support
        'japanese_restaurant': '和食レストラン',
        'chinese_restaurant': '中華料理店',
        'italian_restaurant': 'イタリアンレストラン',
        'fast_food_restaurant': 'ファーストフード',
        'pizza_restaurant': 'ピザ店',
        'seafood_restaurant': 'シーフードレストラン',
        'steak_house': 'ステーキハウス',
        'sushi_restaurant': '寿司店',
        'ramen_restaurant': 'ラーメン店',
        'ice_cream_shop': 'アイスクリーム店',
        'sandwich_shop': 'サンドイッチ店',
        'public_bathroom': '公衆トイレ',
        'point_of_interest': '観光スポット'
    }

    translated = []
    for type_name in types:
        if type_name in type_map:
            translated.append(type_map[type_name])

    # Return translated types or first 3 original types if no translation
    return translated if translated else types[:3]


def format_opening_hours(opening_hours: Optional[Dict[str, Any]]) -> str:
    """Format opening hours data."""
    if not opening_hours:
        return ''

    weekday_text = opening_hours.get('weekday_text', [])
    if weekday_text:
        return '\n'.join(weekday_text)

    return ''


def format_location_data(location: Optional[Dict[str, float]]) -> tuple[str, str]:
    """Format location data."""
    if not location:
        return '', ''

    lat = location.get('lat', '')
    lng = location.get('lng', '')

    return str(lat), str(lng)
