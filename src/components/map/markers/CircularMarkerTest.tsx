/**
 * 🧪 CircularMarker テストコンポーネント
 *
 * 全10カテゴリのCircularMarkerを表示してテスト
 */

import React, { useState } from "react";
import type { IcooonMarkerCategory } from "../../../types/icooonMarker.types";
import CircularMarker from "./CircularMarker";

const categories: IcooonMarkerCategory[] = [
  "japanese",
  "noodles",
  "yakiniku",
  "international",
  "cafe",
  "izakaya",
  "fastfood",
  "general",
  "parking",
  "toilet",
];

const categoryNames = {
  japanese: "和食",
  noodles: "麺類",
  yakiniku: "焼肉・グリル",
  international: "多国籍料理",
  cafe: "カフェ・軽食",
  izakaya: "居酒屋・バー",
  fastfood: "ファストフード",
  general: "一般レストラン",
  parking: "駐車場",
  toilet: "トイレ",
};

export const CircularMarkerTest: React.FC = () => {
  const [selectedCategory, setSelectedCategory] =
    useState<IcooonMarkerCategory>("japanese");
  const [currentSize, setCurrentSize] = useState<
    "small" | "medium" | "large" | "xlarge"
  >("medium");

  return (
    <div
      style={{
        padding: "20px",
        backgroundColor: "#f5f5f5",
        minHeight: "100vh",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1 style={{ textAlign: "center", marginBottom: "30px", color: "#333" }}>
        🎯 CircularMarker テスト
      </h1>

      {/* サイズ選択 */}
      <div
        style={{
          textAlign: "center",
          marginBottom: "30px",
          padding: "15px",
          backgroundColor: "white",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        <h3 style={{ marginBottom: "15px", color: "#555" }}>マーカーサイズ</h3>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          {(["small", "medium", "large", "xlarge"] as const).map(size => (
            <button
              key={size}
              onClick={() => setCurrentSize(size)}
              style={{
                padding: "8px 16px",
                borderRadius: "20px",
                border:
                  currentSize === size ? "2px solid #4A90E2" : "1px solid #ddd",
                backgroundColor: currentSize === size ? "#4A90E2" : "white",
                color: currentSize === size ? "white" : "#333",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: currentSize === size ? "bold" : "normal",
              }}
            >
              {size.charAt(0).toUpperCase() + size.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* 全カテゴリ表示 */}
      <div
        style={{
          marginBottom: "30px",
          padding: "20px",
          backgroundColor: "white",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        <h3
          style={{ marginBottom: "20px", textAlign: "center", color: "#555" }}
        >
          全10カテゴリ ({currentSize} サイズ)
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "20px",
            justifyItems: "center",
          }}
        >
          {categories.map(category => (
            <button
              key={category}
              type="button"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px",
                padding: "15px",
                borderRadius: "8px",
                backgroundColor:
                  selectedCategory === category ? "#e3f2fd" : "#f9f9f9",
                border:
                  selectedCategory === category
                    ? "2px solid #4A90E2"
                    : "1px solid #eee",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onClick={() => setSelectedCategory(category)}
            >
              <CircularMarker
                category={category}
                size={currentSize}
                onClick={() =>
                  console.log(`${categoryNames[category]} clicked!`)
                }
              />
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: "bold",
                    color: "#333",
                  }}
                >
                  {categoryNames[category]}
                </div>
                <div style={{ fontSize: "12px", color: "#666" }}>
                  {category}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 選択されたカテゴリの詳細 */}
      <div
        style={{
          padding: "20px",
          backgroundColor: "white",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        <h3
          style={{ marginBottom: "20px", textAlign: "center", color: "#555" }}
        >
          選択中: {categoryNames[selectedCategory]}
        </h3>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "30px",
            flexWrap: "wrap",
          }}
        >
          {(["small", "medium", "large", "xlarge"] as const).map(size => (
            <div key={size} style={{ textAlign: "center" }}>
              <div style={{ marginBottom: "10px" }}>
                <CircularMarker
                  category={selectedCategory}
                  size={size}
                  onClick={() =>
                    console.log(
                      `${categoryNames[selectedCategory]} (${size}) clicked!`
                    )
                  }
                />
              </div>
              <div style={{ fontSize: "12px", color: "#666" }}>{size}</div>
            </div>
          ))}
        </div>
      </div>

      {/* アクセシビリティテスト */}
      <div
        style={{
          marginTop: "30px",
          padding: "20px",
          backgroundColor: "#fff3cd",
          borderRadius: "8px",
          border: "1px solid #ffeaa7",
        }}
      >
        <h3 style={{ marginBottom: "15px", color: "#856404" }}>
          🧪 アクセシビリティテスト
        </h3>
        <div
          style={{
            display: "flex",
            gap: "20px",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{
                marginBottom: "5px",
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              キーボードナビゲーション対応
            </div>
            <CircularMarker category="japanese" size="large" />
          </div>
          <div>
            <div
              style={{
                marginBottom: "5px",
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              非インタラクティブ
            </div>
            <CircularMarker
              category="noodles"
              size="large"
              interactive={false}
            />
          </div>
          <div>
            <div
              style={{
                marginBottom: "5px",
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              カスタムアリアラベル
            </div>
            <CircularMarker
              category="cafe"
              size="large"
              ariaLabel="特別なカフェマーカー"
            />
          </div>
        </div>
        <p style={{ marginTop: "15px", fontSize: "14px", color: "#856404" }}>
          ℹ️ Tab キーでフォーカス、Enter/Space
          キーで選択、マウスクリックでも操作可能
        </p>
      </div>

      {/* トイレアイコンサイズ比較 */}
      <div
        style={{
          marginTop: "30px",
          padding: "20px",
          backgroundColor: "white",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        <h3
          style={{ marginBottom: "20px", textAlign: "center", color: "#555" }}
        >
          🚻 トイレアイコン拡大表示 (円の淵近くまで)
        </h3>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "40px",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                marginBottom: "10px",
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              トイレ (Medium)
            </div>
            <CircularMarker category="toilet" size="medium" />
          </div>
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                marginBottom: "10px",
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              トイレ (Large)
            </div>
            <CircularMarker category="toilet" size="large" />
          </div>
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                marginBottom: "10px",
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              トイレ (XLarge)
            </div>
            <CircularMarker category="toilet" size="xlarge" />
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "40px",
            flexWrap: "wrap",
            alignItems: "center",
            marginTop: "30px",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                marginBottom: "10px",
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              カフェ (XLarge)
            </div>
            <CircularMarker category="cafe" size="xlarge" />
          </div>
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                marginBottom: "10px",
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              トイレ (XLarge)
            </div>
            <CircularMarker category="toilet" size="xlarge" />
          </div>
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                marginBottom: "10px",
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              駐車場 (XLarge)
            </div>
            <CircularMarker category="parking" size="xlarge" />
          </div>
        </div>
        <p
          style={{
            marginTop: "20px",
            fontSize: "14px",
            color: "#666",
            textAlign: "center",
          }}
        >
          ℹ️ トイレアイコンが他のカテゴリより約1.4倍大きく表示されます
        </p>
      </div>
    </div>
  );
};

export default CircularMarkerTest;
