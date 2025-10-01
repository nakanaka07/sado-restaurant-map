import React from "react";

/**
 * ToiletHistogram - マーカー内部用の軽量ヒストグラム描画
 * 想定: 親が 1:1 正方形。SVG は100x100座標系。
 */
export interface ToiletHistogramProps {
  values: number[]; // 0-1 正規化想定（範囲外は clamp）
  color?: string; // メイン棒色
  glow?: boolean; // さりげない発光グラデ
  maxBars?: number; // バー最大本数 (default 12)
  ariaLabel?: string; // アクセシビリティ用。省略時は aria-hidden
}

export const ToiletHistogram: React.FC<ToiletHistogramProps> = ({
  values,
  color = "#2196F3",
  glow = true,
  maxBars = 12,
  ariaLabel,
}) => {
  const bars = values.slice(0, maxBars);
  if (!bars.length) return null;

  const gap = 1.5; // 単位ギャップ (% of viewBox width) - より密に配置
  const totalGap = gap * (bars.length + 1);
  const barW = (100 - totalGap) / bars.length;
  const maxHeight = 85; // 下基準からの最大高さ(%). 円の淵近くまで拡大
  const baseline = 90; // 下端位置 - より下に配置

  return (
    <svg
      viewBox="0 0 100 100"
      width="100%"
      height="100%"
      role={ariaLabel ? "img" : undefined}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
      focusable="false"
      style={{
        width: "100%",
        height: "100%",
        position: "absolute",
        inset: 0,
      }}
    >
      {glow && (
        <defs>
          <linearGradient id="toiletHistGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity={0.55} />
            <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
          </linearGradient>
        </defs>
      )}
      {bars.map((v, i) => {
        const clamped = Math.max(0, Math.min(1, v));
        const h = clamped * maxHeight;
        const x = gap + i * (barW + gap);
        const y = baseline - h;
        const radius = Math.min(4, barW * 0.4);
        // 安定キー: 位置 + 正規化された値 (小数第3位まで) を結合
        const key = `${i}-${clamped.toFixed(3)}`;
        return (
          <g key={key}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={h}
              rx={radius}
              fill={color}
              opacity={0.95}
            />
            {glow && (
              <rect
                x={x}
                y={y}
                width={barW}
                height={h}
                fill="url(#toiletHistGrad)"
                opacity={0.3}
              />
            )}
          </g>
        );
      })}
    </svg>
  );
};

export default ToiletHistogram;
