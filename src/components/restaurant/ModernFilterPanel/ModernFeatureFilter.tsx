/**
 * @fileoverview Modern feature filter component
 * モダンな特徴フィルターコンポーネント
 */

interface ModernFeatureFilterProps {
  selectedFeatures: string[];
  onToggle: (feature: string) => void;
  isExpanded: boolean;
  onToggleExpanded: () => void;
}

const AVAILABLE_FEATURES = [
  "駐車場あり",
  "テラス席",
  "海が見える",
  "山が見える",
  "個室あり",
  "カウンター席",
  "座敷",
  "禁煙",
  "分煙",
  "Wi-Fi",
  "電源コンセント",
  "クレジットカード対応",
  "PayPay対応",
  "テイクアウト可能",
  "デリバリー対応",
  "予約可能",
  "24時間営業",
  "深夜営業",
  "朝食営業",
  "ランチ営業",
  "ディナー営業",
  "バリアフリー",
  "子供連れ歓迎",
  "ペット同伴可",
  "団体対応",
  "貸切可能",
  "ライブ・イベント",
  "カラオケ",
  "ビアガーデン",
  "BBQ可能",
];

export function ModernFeatureFilter({
  selectedFeatures,
  onToggle,
  isExpanded,
  onToggleExpanded,
}: ModernFeatureFilterProps) {
  return (
    <div className="filter-section">
      <button
        type="button"
        onClick={onToggleExpanded}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          padding: "10px 12px",
          border: "2px solid #e5e7eb",
          borderRadius: "8px",
          backgroundColor: "#f9fafb",
          fontSize: "14px",
          fontWeight: "600",
          color: "var(--color-text-primary)",
          cursor: "pointer",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#f3f4f6";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "#f9fafb";
        }}
        aria-expanded={isExpanded}
        aria-controls="feature-options"
      >
        <span>
          ⭐ 特徴{" "}
          {selectedFeatures.length > 0 && `(${selectedFeatures.length})`}
        </span>
        <span
          style={{
            transform: isExpanded ? "rotate(180deg)" : "rotate(0)",
            transition: "transform 0.2s",
          }}
        >
          ▼
        </span>
      </button>

      {isExpanded && (
        <div
          id="feature-options"
          style={{
            marginTop: "8px",
            padding: "12px",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            backgroundColor: "#fff",
            maxHeight: "200px",
            overflowY: "auto",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "6px",
          }}
        >
          {AVAILABLE_FEATURES.map((feature) => (
            <label
              key={feature}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                cursor: "pointer",
                fontSize: "12px",
                color: "var(--color-text-primary)",
                padding: "2px 0",
              }}
            >
              <input
                type="checkbox"
                checked={selectedFeatures.includes(feature)}
                onChange={() => onToggle(feature)}
                style={{
                  width: "14px",
                  height: "14px",
                  accentColor: "#3b82f6",
                }}
              />
              <span>{feature}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
