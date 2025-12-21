import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ErrorBoundary } from "../components/common/ErrorBoundary";
import "../styles/App.css"; // App.cssを最優先で読み込み
import "../styles/CompactModalFilter.css"; // @import削除でViteバンドル最適化
import "../styles/index.css";
import { autoApplySuppression } from "./suppressLogs"; // log suppression

// 重要: suppress を適用した後で App を動的 import し、
// App モジュール評価時の console.* を抑制する。
async function bootstrap(): Promise<void> {
  autoApplySuppression();

  // PWA登録（本番環境またはENABLE_PWA_DEV=trueの場合のみ）
  const isPWAEnabled =
    import.meta.env.PROD || import.meta.env.ENABLE_PWA_DEV === "true";
  if (isPWAEnabled) {
    try {
      const { registerPWA } = await import("./PWARegister");
      await registerPWA();
    } catch (error) {
      console.warn("PWA registration failed:", error);
    }
  }

  const { default: App } = await import("./App");

  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("Root element not found");
  }

  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary boundaryName="RootBoundary">
        <App />
      </ErrorBoundary>
    </StrictMode>
  );
}

// 起動。Promise を void で明示的に無視し、catch で拒否処理
void bootstrap().catch(err => {
  console.error("App bootstrap failed", err);
});
