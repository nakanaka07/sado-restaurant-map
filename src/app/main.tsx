import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../styles/App.css"; // App.cssを最優先で読み込み
import "../styles/index.css";
import { registerPWA } from "./PWARegister"; // PWA (prod only)
import { autoApplySuppression } from "./suppressLogs"; // log suppression

// 重要: suppress を適用した後で App を動的 import し、
// App モジュール評価時の console.* を抑制する。
async function bootstrap(): Promise<void> {
  autoApplySuppression();
  // Production のみ PWA を登録
  registerPWA();

  const { default: App } = await import("./App");

  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("Root element not found");
  }

  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

// 起動。Promise を void で明示的に無視し、catch で拒否処理
void bootstrap().catch(err => {
  console.error("App bootstrap failed", err);
});
