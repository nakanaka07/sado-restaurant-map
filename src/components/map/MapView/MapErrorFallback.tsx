/**
 * @fileoverview MapErrorFallback component
 * 地図エラー時のフォールバックコンポーネント
 */

interface MapErrorFallbackProps {
  readonly mapId?: string;
  readonly error?: string | null;
}

export function MapErrorFallback({ mapId, error }: MapErrorFallbackProps) {
  return (
    <div className="map-loading">
      <div>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>🗺️</div>
        <h3 style={{ color: "#dc3545", marginBottom: "8px" }}>
          地図を読み込めません
        </h3>
        {error ? (
          <p style={{ color: "#6c757d", marginBottom: "16px" }}>{error}</p>
        ) : (
          <p style={{ color: "#6c757d", marginBottom: "16px" }}>
            Google Maps API の Map ID を設定してください
          </p>
        )}
        <div style={{ fontSize: "12px", color: "#636e72" }}>
          <p>
            環境変数: <code>VITE_GOOGLE_MAPS_MAP_ID</code>
          </p>
          <p>
            現在の値: <code>{mapId ?? "未設定"}</code>
          </p>
        </div>
      </div>
    </div>
  );
}
