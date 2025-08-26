/**
 * @fileoverview Marker Demo Page
 * マーカーデモページ - 改善前後の比較表示
 */

import { MarkerComparisonDemo } from '@/components/map';
import type { MapPoint } from '@/types';

/**
 * マーカーデモページコンポーネント
 * 開発・テスト用のマーカー比較機能
 */
export function MarkerDemoPage() {
  // デモ用のマーカークリックハンドラー
  const handleMarkerClick = (point: MapPoint) => {
    console.log('Marker clicked:', point);
    alert(`マーカーがクリックされました: ${point.name}`);
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      position: 'relative',
      background: '#f5f5f5'
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1001,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '12px 20px',
        fontSize: '18px',
        fontWeight: 'bold',
        textShadow: '0 1px 2px rgba(0,0,0,0.3)'
      }}>
        🗺️ 佐渡レストランマップ - マーカー改善デモ
      </div>

      <div style={{
        marginTop: '50px',
        width: '100%',
        height: 'calc(100vh - 50px)',
        position: 'relative'
      }}>
        <MarkerComparisonDemo
          points={[]} // 空配列でサンプルデータを使用
          onMarkerClick={handleMarkerClick}
        />
      </div>
    </div>
  );
}
