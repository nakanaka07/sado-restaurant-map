/**
 * 🧪 CircularMarker テストページ（独立版）
 * index.htmlを直接置き換えてテスト
 */

import { createRoot } from "react-dom/client";
import CircularMarkerTest from "./components/map/markers/CircularMarkerTest";

// メインのCSSファイルを読み込み（必要に応じて）
import "./styles/index.css";

function TestApp() {
  return (
    <div>
      <CircularMarkerTest />
    </div>
  );
}

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<TestApp />);
} else {
  console.error("Root element not found");
}

export default TestApp;
