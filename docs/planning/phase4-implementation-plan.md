# 📍 マーカー改善ロードマップ Phase 4 実装計画書

> **実行期間**: 2025年12月
> **目標**: UX最適化・ホバー効果改善
> **優先度**: 🟡 低（基本機能完成済みのため継続改善フェーズ）
> **実装方針**: 既存の高品質基盤を活用した段階的改善

## 🎯 **Phase 4 概要**

佐渡飲食店マップの基本機能は100%完成済みです。Phase 4では、既存のマーカーシステム（CircularMarker + ICOOON MONO統一）をベースに、さらなるUX最適化を実施します。

### 📊 **実装前提条件**

✅ **既存実装済み機能**:

- CircularMarker（257行・完全実装）
- ホバー効果・ツールチップ（基本実装済み）
- SVGアニメーションシステム（高度機能実装済み）
- クラスタリング基盤（useMarkerOptimization）
- A/Bテストシステム（Phase 2運用中）

---

## 📋 **Phase 4 実装項目**

### 1. **マーカーホバー効果改善** ⭐ 高

#### 📊 **現状**

- ✅ 基本ホバー効果実装済み（scale(1.1)・シャドウ強化）
- 🔄 さらなる視覚的フィードバック強化の余地

#### 🎯 **改善内容**

```typescript
// 現在: src/components/map/markers/CircularMarker.tsx
.circular-marker.interactive:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}

// Phase 4改善: よりダイナミックな効果
.circular-marker.interactive:hover {
  transform: scale(1.15) rotate(2deg);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  background: linear-gradient(135deg, {backgroundColor} 0%, {lighterColor} 100%);
  filter: brightness(1.1) saturate(1.1);
}
```

#### 📅 **実装工数**: 1日

---

### 2. **マーカークラスタリング機能実装** ⭐ 中

#### 📊 **現状**

- ✅ useMarkerOptimization基盤実装済み
- ✅ クラスタリング設定（50px距離）
- 🔄 実際のクラスタリング表示未実装

#### 🎯 **実装内容**

```typescript
// 新規: src/components/map/markers/ClusterMarker.tsx
interface ClusterMarkerProps {
  count: number;
  restaurants: Restaurant[];
  position: { lat: number; lng: number };
  onClick: () => void;
}

export const ClusterMarker: React.FC<ClusterMarkerProps> = ({
  count,
  restaurants,
  position,
  onClick
}) => {
  const size = Math.min(64, 32 + Math.log(count) * 8);

  return (
    <AdvancedMarker position={position} onClick={onClick}>
      <div
        className="cluster-marker"
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: 'linear-gradient(45deg, #4CAF50, #2E7D32)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          cursor: 'pointer',
          animation: 'pulse 2s infinite'
        }}
      >
        {count}
      </div>
    </AdvancedMarker>
  );
};
```

#### 📅 **実装工数**: 2-3日

---

### 3. **アニメーション効果拡充** ⭐ 中

#### 📊 **現状**

- ✅ SVGMarkerTemplateで高度なアニメーション実装済み
- ✅ pulse・rotation アニメーション
- 🔄 CircularMarkerでの活用拡大

#### 🎯 **実装内容**

```typescript
// 強化: src/components/map/markers/CircularMarker.tsx
export const MarkerAnimations = {
  subtle: `
    @keyframes marker-breathe {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
  `,
  attention: `
    @keyframes marker-attention {
      0% { transform: scale(1) rotate(0deg); }
      25% { transform: scale(1.1) rotate(-2deg); }
      75% { transform: scale(1.1) rotate(2deg); }
      100% { transform: scale(1) rotate(0deg); }
    }
  `,
  loading: `
    @keyframes marker-loading {
      0% { opacity: 0.5; transform: scale(0.8); }
      50% { opacity: 1; transform: scale(1.2); }
      100% { opacity: 0.5; transform: scale(0.8); }
    }
  `
};

// 使用例：選択されたマーカーに注目アニメーション
.circular-marker.selected {
  animation: marker-attention 2s ease-in-out infinite;
}
```

#### 📅 **実装工数**: 1-2日

---

### 4. **PWAオフライン機能統合** ⭐ 低

#### 📊 **現状**

- ✅ Service Worker実装済み
- ✅ マップAPIキャッシュ戦略実装済み
- 🔄 オフライン時のマーカー表示最適化

#### 🎯 **実装内容**

```typescript
// 強化: src/hooks/useOfflineMarkers.ts
export const useOfflineMarkers = () => {
  const [isOffline, setIsOffline] = useState(false);
  const [cachedMarkers, setCachedMarkers] = useState<Restaurant[]>([]);

  useEffect(() => {
    // オンライン/オフライン状態の監視
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // オフライン時の軽量マーカー表示
  const getOfflineMarkers = useCallback(() => {
    return cachedMarkers.map(restaurant => ({
      ...restaurant,
      // オフライン時は基本情報のみ
      isOfflineMode: true,
    }));
  }, [cachedMarkers]);

  return {
    isOffline,
    markers: isOffline ? getOfflineMarkers() : null,
  };
};
```

#### 📅 **実装工数**: 1日

---

## 📊 **実装スケジュール（2025年12月）**

| 週         | 期間        | 実装項目                   | 工数 | 担当       |
| ---------- | ----------- | -------------------------- | ---- | ---------- |
| **Week 1** | 12/1-12/7   | マーカーホバー効果改善     | 1日  | 開発チーム |
| **Week 2** | 12/8-12/14  | マーカークラスタリング実装 | 3日  | 開発チーム |
| **Week 3** | 12/15-12/21 | アニメーション効果拡充     | 2日  | 開発チーム |
| **Week 4** | 12/22-12/28 | PWA統合・テスト・最適化    | 2日  | 開発チーム |

**総工数**: 8日（1.5週間相当）

---

## 🧪 **A/Bテスト戦略**

### 📊 **Phase 4テスト設計**

```typescript
// A/Bテスト設定追加: src/config/abTestConfig.ts
export const PHASE4_AB_TEST_CONFIG = {
  testName: "phase4-marker-improvements",
  variants: {
    control: {
      name: "現行マーカー",
      description: "現在のCircularMarkerシステム",
    },
    enhanced: {
      name: "改善マーカー",
      description: "Phase 4改善版（ホバー効果強化・クラスタリング）",
    },
  },
  rolloutStrategy: {
    phase1: { percentage: 20, targetSegments: ["early-adopter"] },
    phase2: { percentage: 50, targetSegments: ["early-adopter", "beta-tester"] },
    phase3: { percentage: 100, targetSegments: ["all"] },
  },
} as const;
```

### 📈 **成功指標**

| 指標                   | 現在値 | 目標値 | 測定方法         |
| ---------------------- | ------ | ------ | ---------------- |
| **マーカー操作性**     | 4.2/5  | 4.5/5+ | ユーザー調査     |
| **視認性向上**         | -      | +15%   | アイトラッキング |
| **クリック率向上**     | -      | +10%   | GA4イベント      |
| **パフォーマンス維持** | <100ms | <100ms | Core Web Vitals  |

---

## ⚠️ **リスク管理**

### 🔍 **技術リスク**

| リスク                 | 確率 | 影響度 | 対策                     |
| ---------------------- | ---- | ------ | ------------------------ |
| **パフォーマンス劣化** | 低   | 中     | 段階的実装・継続監視     |
| **既存機能への影響**   | 低   | 高     | 充実したテストカバレッジ |
| **ブラウザ互換性**     | 低   | 中     | クロスブラウザテスト     |

### 📋 **実装前チェックリスト**

#### **開始前確認**

- [ ] 現在のマーカーシステムの動作確認
- [ ] A/Bテストシステムの準備
- [ ] テスト環境の設定
- [ ] バックアップ・ロールバック準備

#### **実装中確認**

- [ ] パフォーマンス監視（各段階）
- [ ] アクセシビリティ維持確認
- [ ] モバイル・デスクトップ動作確認
- [ ] 既存機能への影響確認

#### **完了後確認**

- [ ] 全機能の統合動作確認
- [ ] A/Bテスト開始準備
- [ ] ドキュメント更新
- [ ] ユーザーフィードバック収集準備

---

## 🎯 **Phase 5・Phase 6 への連携**

### 📅 **Phase 5（2026年1月）準備**

- PWA統合の基盤整備
- Service Worker最適化の事前調査
- オフライン機能の技術検証

### 📅 **Phase 6（2026年2月）準備**

- 運用データの蓄積・分析
- ユーザーフィードバックの集約
- 最終調整項目の洗い出し

---

## 📋 **関連ドキュメント**

### 🔗 **技術ドキュメント**

- [CircularMarker実装](../../../src/components/map/markers/CircularMarker.tsx)
- [useMarkerOptimization](../../../src/hooks/map/useMarkerOptimization.ts)
- [A/Bテスト設定](../../../src/config/abTestConfig.ts)

### 📊 **プロジェクト管理**

- [次期計画ロードマップ](../next-phase-roadmap.md)
- [プロジェクト完了状況](../project-completion-status.md)

---

**📝 作成者**: 佐渡飲食店マップ開発チーム
**📅 作成日**: 2025年9月16日
**🎯 実施判断**: 2025年11月末に最終決定

> 💡 **重要**: この計画は現在の高品質システムをベースとした継続改善です。基本機能は完成済みのため、ユーザーからの具体的な要望がない限り実施を急ぐ必要はありません。
