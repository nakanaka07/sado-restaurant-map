import { useEffect, useState } from "react";
import "../../styles/PWABadge.css";

/**
 * WHY: vite-plugin-pwa の仮想モジュールは ビルド時に static analysis される前提。
 * 過去実装では `['virtual', 'pwa-register', 'react'].join(':')` のような
 * 動的文字列結合により `virtual:/pwa-register/react` (コロン後にスラッシュ挿入) という
 * 存在しないパスをブラウザがフェッチ → 404 → コンソールにノイズ、という問題が発生した。
 * さらに hook 版 (virtual:pwa-register/react) を使う必要性は薄く、
 * 基本的な registerSW API で十分だったため、hook 依存を排除し以下の方針に統一:
 *   1. runtime では `import("virtual:pwa-register")` をそのまま静的リテラルで記述 (Vite が置換)。
 *   2. DEV 環境では service worker 未登録でも問題ないよう try/catch で吸収。
 *   3. UI state (offlineReady / needRefresh) はフック経由ではなくローカルで保持。
 * このコメントは将来誰かが再び動的パス生成へ戻さないためのガード目的。
 */

// 🔧 PWA関連の型定義
// 型は `src/types/pwa-register.d.ts` の宣言に依存するため、ここでは追加定義しない。

// 有効時のみ SW 状態を監視するバッジコンポーネント
function PWABadge() {
  const [offlineReady, setOfflineReady] = useState(false);
  const [needRefresh, setNeedRefresh] = useState(false);
  const [registration, setRegistration] = useState<
    ServiceWorkerRegistration | undefined
  >(undefined);
  // loaded フラグは不要（UIは常時レンダリングし、トーストのみ状態で切替）

  // PWARegister が発火するカスタムイベントを購読し、UI 状態のみを管理
  useEffect(() => {
    // フォールバック取得はバックグラウンドで実施
    const onRegistered = (e: Event) => {
      const ce = e as CustomEvent<{ registration?: ServiceWorkerRegistration }>;
      if (ce.detail?.registration) {
        setRegistration(ce.detail.registration);
      }
    };
    const onNeedRefresh = (e: Event) => {
      const ce = e as CustomEvent<{ registration?: ServiceWorkerRegistration }>;
      if (ce.detail?.registration) setRegistration(ce.detail.registration);
      setNeedRefresh(true);
    };
    const onOfflineReady = () => setOfflineReady(true);
    const onRegisterError = (e: Event) => {
      const ce = e as CustomEvent<{ error?: unknown }>;
      console.warn("[PWA] register error", ce.detail?.error);
    };

    window.addEventListener("pwa:registered", onRegistered as EventListener);
    window.addEventListener("pwa:needRefresh", onNeedRefresh as EventListener);
    window.addEventListener(
      "pwa:offlineReady",
      onOfflineReady as EventListener
    );
    window.addEventListener(
      "pwa:registerError",
      onRegisterError as EventListener
    );
    // jsdom では window/document どちらに紐付くかがケースで揺れるため両方購読
    document.addEventListener("pwa:registered", onRegistered as EventListener);
    document.addEventListener(
      "pwa:needRefresh",
      onNeedRefresh as EventListener
    );
    document.addEventListener(
      "pwa:offlineReady",
      onOfflineReady as EventListener
    );
    document.addEventListener(
      "pwa:registerError",
      onRegisterError as EventListener
    );

    // フォールバック: すでに登録済みの SW があれば取得
    void (async () => {
      try {
        if ("serviceWorker" in navigator) {
          const reg = await navigator.serviceWorker.getRegistration();
          if (reg) setRegistration(reg);
        }
      } catch (err) {
        // 取得失敗は致命ではないが、デバッグのために記録
        console.debug("[PWA] getRegistration failed", err);
      }
    })();

    return () => {
      window.removeEventListener(
        "pwa:registered",
        onRegistered as EventListener
      );
      window.removeEventListener(
        "pwa:needRefresh",
        onNeedRefresh as EventListener
      );
      window.removeEventListener(
        "pwa:offlineReady",
        onOfflineReady as EventListener
      );
      window.removeEventListener(
        "pwa:registerError",
        onRegisterError as EventListener
      );
      document.removeEventListener(
        "pwa:registered",
        onRegistered as EventListener
      );
      document.removeEventListener(
        "pwa:needRefresh",
        onNeedRefresh as EventListener
      );
      document.removeEventListener(
        "pwa:offlineReady",
        onOfflineReady as EventListener
      );
      document.removeEventListener(
        "pwa:registerError",
        onRegisterError as EventListener
      );
    };
  }, []);
  // check for updates every hour（interval の二重登録を防ぐため useEffect で管理）
  useEffect(() => {
    if (!registration) return;
    if (registration.active?.state !== "activated") return;
    const period = 60 * 60 * 1000;
    const id = registerPeriodicSync(
      period,
      registration.active.scriptURL,
      registration
    );
    return () => {
      if (id !== undefined) clearInterval(id);
    };
  }, [registration]);

  function close() {
    setOfflineReady(false);
    setNeedRefresh(false);
  }

  return (
    <div className="PWABadge-container">
      {(offlineReady || needRefresh) && (
        <div
          className="PWABadge-toast"
          role="alert"
          aria-labelledby="toast-message"
        >
          <div className="PWABadge-toast-message">
            {offlineReady ? (
              <span id="toast-message">App ready to work offline</span>
            ) : (
              <span id="toast-message">
                New content available, click on reload button to update.
              </span>
            )}
          </div>
          <div className="PWABadge-buttons">
            {needRefresh && registration && (
              <button
                className="PWABadge-toast-button"
                onClick={() => {
                  registration
                    .update()
                    .then(() => location.reload())
                    .catch(console.error);
                }}
                type="button"
              >
                Reload
              </button>
            )}
            <button
              className="PWABadge-toast-button"
              onClick={() => close()}
              type="button"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PWABadge;

/**
 * This function will register a periodic sync check every hour, you can modify the interval as needed.
 */
function registerPeriodicSync(
  period: number,
  swUrl: string,
  r: ServiceWorkerRegistration
): number | undefined {
  if (period <= 0) return undefined;

  const id = setInterval(() => {
    void (async () => {
      if ("onLine" in navigator && !navigator.onLine) return;

      const resp = await fetch(swUrl, {
        cache: "no-store",
        headers: {
          cache: "no-store",
          "cache-control": "no-cache",
        },
      });

      if (resp?.status === 200) await r.update();
    })();
  }, period) as unknown as number; // DOM タイプに合わせて number に統一

  return id;
}
