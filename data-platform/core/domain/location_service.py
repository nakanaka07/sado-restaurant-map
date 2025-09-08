#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Location Service - Domain層の地理判定サービス

佐渡島の地理的判定とディストリクト分類を統一的に処理する
Clean Architecture準拠の専用サービス
"""

from typing import Dict, Tuple, Optional
from dataclasses import dataclass

from shared.logger import get_logger


@dataclass
class SadoBounds:
    """佐渡島の地理的境界定義"""
    north: float = 38.39
    south: float = 37.74
    east: float = 138.62
    west: float = 137.85


@dataclass
class LocationInfo:
    """位置情報の結果データ"""
    is_in_sado: bool
    district: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class LocationService:
    """地理判定・ディストリクト分類の統一サービス"""

    def __init__(self):
        """LocationService初期化"""
        self._logger = get_logger(__name__)
        self._bounds = SadoBounds()

        # 地区キーワード定義
        self._district_keywords = [
            '両津', '相川', '佐渡和田', '金井', '新穂',
            '畑野', '真野', '小木', '羽茂', '赤泊'
        ]

        # 佐渡関連キーワード
        self._sado_keywords = [
            '佐渡', '新潟県佐渡市', '両津', '相川', '佐和田',
            '金井', '新穂', '畑野', '真野', '小木', '羽茂', '赤泊'
        ]

    def analyze_location(
        self,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
        address: Optional[str] = None
    ) -> LocationInfo:
        """
        位置情報を総合的に分析

        Args:
            latitude: 緯度
            longitude: 経度
            address: 住所文字列

        Returns:
            LocationInfo: 分析結果
        """
        try:
            # 座標による判定を優先
            if latitude is not None and longitude is not None:
                return self._analyze_by_coordinates(latitude, longitude, address)

            # 座標がない場合は住所による判定
            if address:
                return self._analyze_by_address(address)

            # どちらもない場合は市外扱い
            self._logger.warning("位置情報が不足しています")
            return LocationInfo(is_in_sado=False, district="市外")

        except Exception as e:
            self._logger.error("位置分析エラー", error=str(e))
            return LocationInfo(is_in_sado=False, district="市外")

    def _analyze_by_coordinates(
        self,
        latitude: float,
        longitude: float,
        address: Optional[str] = None
    ) -> LocationInfo:
        """座標による佐渡島判定"""
        is_in_sado = self._is_coordinates_in_sado(latitude, longitude)

        if is_in_sado:
            # 住所がある場合は住所ベースでディストリクト分類を試行
            if address:
                district = self._classify_district_from_address(address)
                # 住所ベースで具体的な地区が取得できない場合は座標ベースを使用
                if district == "佐渡市内":
                    district = self._classify_district_from_coordinates(latitude, longitude)
            else:
                # 住所がない場合は座標ベースで分類
                district = self._classify_district_from_coordinates(latitude, longitude)
        else:
            district = "市外"

        return LocationInfo(
            is_in_sado=is_in_sado,
            district=district,
            latitude=latitude,
            longitude=longitude
        )

    def _analyze_by_address(self, address: str) -> LocationInfo:
        """住所による佐渡島判定"""
        is_in_sado = self._is_address_in_sado(address)

        if is_in_sado:
            district = self._classify_district_from_address(address)
        else:
            district = "市外"

        return LocationInfo(
            is_in_sado=is_in_sado,
            district=district
        )

    def _is_coordinates_in_sado(self, latitude: float, longitude: float) -> bool:
        """座標が佐渡島内かどうか判定"""
        return (
            self._bounds.south <= latitude <= self._bounds.north and
            self._bounds.west <= longitude <= self._bounds.east
        )

    def _is_address_in_sado(self, address: str) -> bool:
        """住所が佐渡島内かどうか判定"""
        if not address:
            return False

        address_normalized = str(address).strip()
        return any(keyword in address_normalized for keyword in self._sado_keywords)

    def _classify_district_from_address(self, address: str) -> str:
        """住所から地区を分類"""
        if not address:
            return "佐渡市内"

        address_normalized = str(address).strip()

        for district in self._district_keywords:
            if district in address_normalized:
                return district

        return "佐渡市内"

    def _classify_district_from_coordinates(self, latitude: float, longitude: float) -> str:
        """座標から大まかな地区を分類"""
        try:
            lat = float(latitude)
            lng = float(longitude)

            # 北部エリア判定
            if lat >= 38.00:
                return self._classify_north_district(lat, lng)

            # 南部エリア判定
            if lat <= 37.90:
                return self._classify_south_district(lng)

            # 中部エリア判定
            return self._classify_central_district(lat, lng)

        except (ValueError, TypeError):
            return "佐渡市内"

    def _classify_north_district(self, lat: float, lng: float) -> str:
        """北部地区の分類"""
        if lat >= 38.02 and lng >= 138.35:
            return "両津"
        elif lng <= 138.30:
            return "相川"
        else:
            return "両津"  # 北部の中間エリアは両津として分類

    def _classify_south_district(self, lng: float) -> str:
        """南部地区の分類"""
        if lng <= 138.30:
            return "小木"
        else:
            return "羽茂"

    def _classify_central_district(self, _lat: float, lng: float) -> str:
        """中部地区の分類"""
        if 138.25 <= lng <= 138.45:
            if lng >= 138.35:
                return "金井"
            else:
                return "佐和田"
        elif lng >= 138.45:
            return "新穂"
        elif lng <= 138.20:
            return "真野"
        else:
            return "畑野"

    def validate_coordinates(self, latitude: float, longitude: float) -> bool:
        """座標の妥当性を検証"""
        try:
            lat = float(latitude)
            lng = float(longitude)

            # 基本的な範囲チェック
            if lat == 0 and lng == 0:
                return False

            # 日本の大まかな範囲チェック
            if not (24 <= lat <= 46 and 122 <= lng <= 146):
                return False

            return True

        except (ValueError, TypeError):
            return False

    def get_bounds(self) -> SadoBounds:
        """佐渡島の境界情報を取得"""
        return self._bounds

    def get_district_keywords(self) -> list[str]:
        """地区キーワード一覧を取得"""
        return self._district_keywords.copy()


def create_location_service() -> LocationService:
    """LocationService のファクトリ関数"""
    return LocationService()
