#!/usr/bin/env pwsh
# 🚀 即実行可能クイックスタート
# 優先度P0/P1の改善を自動化

Write-Host "🎯 自動優先順位付けレポート - クイックアクション" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

$projectRoot = Split-Path -Parent $PSScriptRoot

# 1️⃣ PWA Offline Fallback (P1 - 30分)
Write-Host "1️⃣  PWA Offline Fallbackページ作成中..." -ForegroundColor Yellow
$offlineHtml = @"
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>オフライン - 佐渡グルメマップ</title>
  <style>
    body {
      font-family: system-ui, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .container {
      text-align: center;
      padding: 2rem;
      max-width: 400px;
    }
    .icon { font-size: 4rem; margin-bottom: 1rem; }
    h1 { font-size: 1.5rem; margin: 1rem 0; }
    p { opacity: 0.9; line-height: 1.6; }
    .retry-btn {
      margin-top: 2rem;
      padding: 0.75rem 2rem;
      background: white;
      color: #667eea;
      border: none;
      border-radius: 8px;
      font-weight: bold;
      cursor: pointer;
      font-size: 1rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">📡</div>
    <h1>オフラインモード</h1>
    <p>
      インターネット接続が検出できません。<br>
      接続を確認後、再読み込みしてください。
    </p>
    <button class="retry-btn" onclick="location.reload()">
      🔄 再読み込み
    </button>
  </div>
  <script>
    window.addEventListener('online', () => location.reload());
  </script>
</body>
</html>
"@

$offlineHtml | Out-File -FilePath "$projectRoot/public/offline.html" -Encoding UTF8
Write-Host "   ✅ public/offline.html 作成完了`n" -ForegroundColor Green

# 2️⃣ テストスケルトン作成 (P1 - 15分)
Write-Host "2️⃣  テストスケルトンファイル作成中..." -ForegroundColor Yellow

$testTemplate = @"
/**
 * @fileoverview useMarkerOptimization Hook Tests
 * カバレッジ目標: 0% → 60%
 */

import { renderHook } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { useMarkerOptimization } from '../useMarkerOptimization';

describe('useMarkerOptimization', () => {
  describe('基本動作', () => {
    test('初期化時に空配列を返す', () => {
      // TODO: 実装
    });

    test('レストランリストを受け取り最適化する', () => {
      // TODO: 実装
    });
  });

  describe('ビューポート最適化', () => {
    test('ビューポート外のマーカーを非表示化', () => {
      // TODO: 実装 (優先度: 高)
    });

    test('ビューポート移動時に表示マーカーを更新', () => {
      // TODO: 実装
    });
  });

  describe('クラスタリング', () => {
    test('密集マーカーをクラスタ化', () => {
      // TODO: 実装 (優先度: 高)
    });

    test('ズームレベルに応じてクラスタ閾値を調整', () => {
      // TODO: 実装
    });
  });

  describe('パフォーマンス', () => {
    test('1000件のマーカーを100ms以内で処理', () => {
      // TODO: 実装
    });
  });
});
"@

$testDir = "$projectRoot/src/hooks/map"
if (-not (Test-Path $testDir)) {
  New-Item -ItemType Directory -Path $testDir -Force | Out-Null
}
$testTemplate | Out-File -FilePath "$testDir/useMarkerOptimization.test.ts" -Encoding UTF8
Write-Host "   ✅ useMarkerOptimization.test.ts スケルトン作成完了`n" -ForegroundColor Green

# 3️⃣ UnifiedMarker設計ドキュメント
Write-Host "3️⃣  UnifiedMarker設計ドキュメント作成中..." -ForegroundColor Yellow

$designDoc = @"
# UnifiedMarker 統合設計

## 目的

9種類のマーカー実装を3種類に集約し、保守性とパフォーマンスを向上

## アーキテクチャ

\`\`\`
UnifiedMarker (Strategy Pattern)
├── PinMarker (シンプル版)
├── IconMarker (ICOOON版)
└── SVGMarker (スケーラブル版)
\`\`\`

## インターフェース

\`\`\`typescript
interface UnifiedMarkerProps {
  point: MapPoint;
  onClick: (point: MapPoint) => void;
  variant?: 'pin' | 'icon' | 'svg'; // A/Bテストで切替
  size?: 'small' | 'medium' | 'large';
}

export function UnifiedMarker({
  point,
  onClick,
  variant = 'icon', // デフォルト
  size = 'medium',
}: UnifiedMarkerProps) {
  const MarkerComponent = useMemo(() => {
    switch (variant) {
      case 'pin': return PinMarker;
      case 'icon': return IconMarker;
      case 'svg': return SVGMarker;
      default: return IconMarker;
    }
  }, [variant]);

  return <MarkerComponent point={point} onClick={onClick} size={size} />;
}
\`\`\`

## 移行計画

### Phase 1: 実装 (3日)
- [ ] UnifiedMarker インターフェース作成
- [ ] 3つの実装クラス作成
- [ ] テスト追加

### Phase 2: 統合 (2日)
- [ ] RestaurantMap.tsx を UnifiedMarker に置換
- [ ] A/Bテスト設定を variant prop に接続
- [ ] E2Eテスト追加

### Phase 3: クリーンアップ (1日)
- [ ] 旧実装を legacy/ に移動
- [ ] deprecation warning 追加
- [ ] ドキュメント更新

## 成功指標

- マーカー実装数: 9 → 3 (-67%)
- import文: 25 → 8 (-68%)
- バンドルサイズ: -14%
- 理解時間: 60分 → 20分

## 参考リンク

- [Strategy Pattern](https://refactoring.guru/design-patterns/strategy)
- [React Component Patterns](https://kentcdodds.com/blog/compound-components-with-react-hooks)
"@

$designDoc | Out-File -FilePath "$projectRoot/docs/design/unified-marker-design.md" -Encoding UTF8
Write-Host "   ✅ unified-marker-design.md 作成完了`n" -ForegroundColor Green

# サマリー
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "✨ クイックアクション完了！`n" -ForegroundColor Green

Write-Host "📝 作成されたファイル:" -ForegroundColor White
Write-Host "   1. public/offline.html" -ForegroundColor Gray
Write-Host "   2. src/hooks/map/useMarkerOptimization.test.ts" -ForegroundColor Gray
Write-Host "   3. docs/design/unified-marker-design.md" -ForegroundColor Gray
Write-Host "   4. docs/reports/analysis/AUTO_PRIORITY_REPORT.md`n" -ForegroundColor Gray

Write-Host "🎯 次のステップ:" -ForegroundColor White
Write-Host "   1. vite.config.ts に navigateFallback 追加" -ForegroundColor Yellow
Write-Host "   2. useMarkerOptimization.test.ts のTODOを実装" -ForegroundColor Yellow
Write-Host "   3. unified-marker-design.md をレビュー`n" -ForegroundColor Yellow

Write-Host "📊 詳細レポート: docs/AUTO_PRIORITY_REPORT.md を参照" -ForegroundColor Cyan
