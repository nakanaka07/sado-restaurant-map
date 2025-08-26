/**
 * @fileoverview Enhanced MapContainer with Marker Type Selection
 * マーカータイプ選択機能付きMapContainer
 */

import type { MapPoint } from "@/types";
import { InfoWindow, Map } from "@vis.gl/react-google-maps";
import { useCallback, useState } from "react";
import { EnhancedPNGMarker } from "./EnhancedPNGMarker";
import { MapInfoWindow } from "./MapInfoWindow";
import { MapMarker } from "./MapMarker";
import { SVGMarkerSystem } from "./SVGMarkerSystem";

interface EnhancedMapContainerProps {
  readonly mapPoints: readonly MapPoint[];
  readonly center: { lat: number; lng: number };
  readonly mapId: string;
  readonly selectedPoint: MapPoint | null;
  readonly onMarkerClick: (point: MapPoint) => void;
  readonly onCloseInfoWindow: () => void;
}

type MarkerType = 'original' | 'enhanced-png' | 'svg';

export function EnhancedMapContainer({
  mapPoints,
  center,
  mapId,
  selectedPoint,
  onMarkerClick,
  onCloseInfoWindow,
}: EnhancedMapContainerProps) {
  const [selectedMarkerType, setSelectedMarkerType] = useState<MarkerType>('enhanced-png');

  // エラー防止のためのクリックハンドラーをメモ化
  const handleMarkerClick = useCallback((point: MapPoint) => {
    try {
      onMarkerClick(point);
    } catch (error) {
      console.error("マーカークリック時エラー:", error);
    }
  }, [onMarkerClick]);

  const handleInfoWindowClose = useCallback(() => {
    try {
      onCloseInfoWindow();
    } catch (error) {
      console.error("InfoWindow閉じる時エラー:", error);
    }
  }, [onCloseInfoWindow]);

  // マーカーコンポーネントを選択
  const renderMarker = useCallback((point: MapPoint, index: number) => {
    const key = `${selectedMarkerType}-${point.id}-${index}`;

    switch (selectedMarkerType) {
      case 'original':
        return <MapMarker key={key} point={point} onClick={handleMarkerClick} />;
      case 'enhanced-png':
        return <EnhancedPNGMarker key={key} point={point} onClick={handleMarkerClick} />;
      case 'svg':
        return <SVGMarkerSystem key={key} point={point} onClick={handleMarkerClick} />;
      default:
        return <EnhancedPNGMarker key={key} point={point} onClick={handleMarkerClick} />;
    }
  }, [selectedMarkerType, handleMarkerClick]);

  return (
    <div className="map-container" style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* マーカータイプ選択パネル */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          zIndex: 1000,
          background: 'white',
          borderRadius: '12px',
          padding: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          border: '1px solid #e0e0e0',
          minWidth: '280px',
        }}
      >
        <h3 style={{
          margin: '0 0 16px',
          fontSize: '16px',
          fontWeight: 'bold',
          color: '#333',
          borderBottom: '2px solid #f0f0f0',
          paddingBottom: '8px'
        }}>
          🗺️ マーカータイプ選択
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <label
            htmlFor="marker-type-original"
            style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            padding: '8px 12px',
            borderRadius: '8px',
            backgroundColor: selectedMarkerType === 'original' ? '#f0f7ff' : 'transparent',
            border: selectedMarkerType === 'original' ? '2px solid #2196f3' : '2px solid transparent',
            transition: 'all 0.2s ease'
          }}
            aria-label="オリジナルマーカー (35px) を選択">
            <input
              id="marker-type-original"
              type="radio"
              name="markerType"
              value="original"
              checked={selectedMarkerType === 'original'}
              onChange={(e) => setSelectedMarkerType(e.target.value as MarkerType)}
              style={{ margin: 0 }}
            />
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '14px' }}>オリジナル (35px)</div>
              <div style={{ fontSize: '12px', color: '#666' }}>現在のピンマーカー、絵文字使用</div>
            </div>
          </label>

          <label
            htmlFor="marker-type-enhanced-png"
            style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            padding: '8px 12px',
            borderRadius: '8px',
            backgroundColor: selectedMarkerType === 'enhanced-png' ? '#fff3e0' : 'transparent',
            border: selectedMarkerType === 'enhanced-png' ? '2px solid #ff9800' : '2px solid transparent',
            transition: 'all 0.2s ease'
          }}
            aria-label="改良PNGマーカー (48px) を選択">
            <input
              id="marker-type-enhanced-png"
              type="radio"
              name="markerType"
              value="enhanced-png"
              checked={selectedMarkerType === 'enhanced-png'}
              onChange={(e) => setSelectedMarkerType(e.target.value as MarkerType)}
              style={{ margin: 0 }}
            />
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '14px' }}>改良PNG (48px) ⭐</div>
              <div style={{ fontSize: '12px', color: '#666' }}>37%大型化、グラデーション背景</div>
            </div>
          </label>

          <label
            htmlFor="marker-type-svg"
            style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            padding: '8px 12px',
            borderRadius: '8px',
            backgroundColor: selectedMarkerType === 'svg' ? '#e8f5e8' : 'transparent',
            border: selectedMarkerType === 'svg' ? '2px solid #4caf50' : '2px solid transparent',
            transition: 'all 0.2s ease'
          }}
            aria-label="SVGマーカー (60px) を選択">
            <input
              id="marker-type-svg"
              type="radio"
              name="markerType"
              value="svg"
              checked={selectedMarkerType === 'svg'}
              onChange={(e) => setSelectedMarkerType(e.target.value as MarkerType)}
              style={{ margin: 0 }}
            />
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '14px' }}>SVG (60px) 🚀</div>
              <div style={{ fontSize: '12px', color: '#666' }}>71%大型化、無限スケーラブル</div>
            </div>
          </label>
        </div>

        {/* 現在の選択の説明 */}
        <div style={{
          marginTop: '16px',
          padding: '12px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #e9ecef'
        }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#495057' }}>
            現在の表示:
          </div>
          <div style={{ fontSize: '11px', color: '#6c757d' }}>
            {selectedMarkerType === 'original' && '従来のピンマーカー (35px、絵文字使用)'}
            {selectedMarkerType === 'enhanced-png' && 'Phase 1: 37%大型化、グラデーション背景、既存PNG活用'}
            {selectedMarkerType === 'svg' && 'Phase 2: 71%大型化、無限スケーラブル、軽量SVG'}
          </div>
        </div>
      </div>

      {/* 統計情報パネル */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          zIndex: 1000,
          background: 'white',
          borderRadius: '12px',
          padding: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          border: '1px solid #e0e0e0',
          minWidth: '220px',
        }}
      >
        <h4 style={{ margin: '0 0 12px', fontSize: '14px', color: '#333' }}>
          📊 表示中のマーカー
        </h4>
        <div style={{ fontSize: '12px', color: '#666', lineHeight: '1.4' }}>
          <div>🍽️ レストラン: {mapPoints.filter(p => p.type === 'restaurant').length}件</div>
          <div>🅿️ 駐車場: {mapPoints.filter(p => p.type === 'parking').length}件</div>
          <div>🚻 トイレ: {mapPoints.filter(p => p.type === 'toilet').length}件</div>
          <div style={{ marginTop: '8px', fontWeight: 'bold', color: '#333' }}>
            合計: {mapPoints.length}件
          </div>
        </div>
      </div>

      {/* 地図本体 */}
      <Map
        defaultCenter={center}
        defaultZoom={11}
        mapTypeId="terrain"
        mapId={mapId}
        style={{ width: "100%", height: "100%" }}
        gestureHandling="greedy"
        disableDefaultUI={false}
        mapTypeControl={true}
        fullscreenControl={true}
        streetViewControl={true}
        zoomControl={true}
        mapTypeControlOptions={{
          position: window.google?.maps?.ControlPosition?.TOP_RIGHT || 1,
          style: window.google?.maps?.MapTypeControlStyle?.DROPDOWN_MENU || 1
        }}
        zoomControlOptions={{
          position: window.google?.maps?.ControlPosition?.RIGHT_CENTER || 6
        }}
        fullscreenControlOptions={{
          position: window.google?.maps?.ControlPosition?.TOP_RIGHT || 1
        }}
        streetViewControlOptions={{
          position: window.google?.maps?.ControlPosition?.RIGHT_CENTER || 6
        }}
      >
        {/* マーカー表示 */}
        {mapPoints.map((point, index) => renderMarker(point, index))}

        {/* 選択されたポイントのInfoWindow */}
        {selectedPoint && (
          <InfoWindow
            position={selectedPoint.coordinates}
            onCloseClick={handleInfoWindowClose}
            maxWidth={400}
          >
            <MapInfoWindow point={selectedPoint} />
          </InfoWindow>
        )}
      </Map>
    </div>
  );
}
