/**
 * @fileoverview Modern map legend component
 * モダンなマップ凡例コンポーネント
 */

import type { CuisineType } from "@/types";

interface CuisineColor {
  cuisine: CuisineType;
  color: string;
}

const CUISINE_COLORS: CuisineColor[] = [
  { cuisine: "日本料理", color: "#ef4444" },
  { cuisine: "寿司", color: "#f97316" },
  { cuisine: "海鮮", color: "#06b6d4" },
  { cuisine: "焼肉・焼鳥", color: "#dc2626" },
  { cuisine: "ラーメン", color: "#eab308" },
  { cuisine: "そば・うどん", color: "#84cc16" },
  { cuisine: "中華", color: "#f59e0b" },
  { cuisine: "イタリアン", color: "#10b981" },
  { cuisine: "フレンチ", color: "#8b5cf6" },
  { cuisine: "カフェ・喫茶店", color: "#14b8a6" },
  { cuisine: "バー・居酒屋", color: "#f59e0b" },
  { cuisine: "ファストフード", color: "#ef4444" },
  { cuisine: "デザート・スイーツ", color: "#ec4899" },
  { cuisine: "カレー・エスニック", color: "#f97316" },
  { cuisine: "ステーキ・洋食", color: "#6366f1" },
  { cuisine: "弁当・テイクアウト", color: "#8b5cf6" },
  { cuisine: "レストラン", color: "#06b6d4" },
  { cuisine: "その他", color: "#6b7280" },
];

export function ModernMapLegend() {
  return (
    <div className="filter-section">
      <details style={{ fontSize: "13px" }}>
        <summary
          style={{
            cursor: "pointer",
            fontWeight: "600",
            marginBottom: "8px",
            color: "var(--color-text-primary)",
          }}
        >
          🗺️ マップの見方
        </summary>
        <div
          style={{
            paddingLeft: "16px",
            color: "var(--color-text-secondary)",
          }}
        >
          <h5
            style={{
              fontSize: "13px",
              marginBottom: "6px",
              color: "var(--color-text-primary)",
            }}
          >
            🎨 色 = 料理ジャンル
          </h5>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "4px",
              marginBottom: "12px",
            }}
          >
            {CUISINE_COLORS.map(({ cuisine, color }) => (
              <div
                key={cuisine}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <div
                  style={{
                    width: "12px",
                    height: "12px",
                    backgroundColor: color,
                    borderRadius: "50%",
                    border: "1px solid #fff",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
                  }}
                />
                <span style={{ fontSize: "11px" }}>{cuisine}</span>
              </div>
            ))}
          </div>

          <div>
            <h5
              style={{
                fontSize: "13px",
                marginBottom: "6px",
                color: "var(--color-text-primary)",
              }}
            >
              💰 サイズ = 価格帯
            </h5>
            <div style={{ fontSize: "11px" }}>
              小 = ～1000円 | 中 = 1000-2000円 | 大 = 2000-3000円 | 特大 =
              3000円～
            </div>
          </div>
        </div>
      </details>
    </div>
  );
}
