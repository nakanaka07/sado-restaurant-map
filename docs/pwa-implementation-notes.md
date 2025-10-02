# PWA Implementation Notes

## 背景

vite-plugin-pwa 導入時、開発中に `virtual:/pwa-register/react` をフェッチし 404 になる
ノイズが発生。原因は仮想モジュール名を **動的文字列結合** で生成したため Vite の静的
解析が効かず、結果として存在しない URL への HTTP リクエストが発生したこと。

## 採用方針

1. 仮想モジュールは必ず **静的リテラル文字列** で import する。
2. hook 版 (`virtual:pwa-register/react`) は必須機能差がなく冗長なので利用しない。
3. `registerSW` コールバックで offline / refresh 状態をローカル state に保持。
4. DEV 環境で Service Worker 未登録でも致命的にならないよう try/catch で安全化。
5. 定期更新 (現状 1h) は `registerPeriodicSync` による簡易ポーリング。高度要件で再検討。

## よくある落とし穴

| 誤りパターン                           | 問題                                                 | 回避策                                             |
| -------------------------------------- | ---------------------------------------------------- | -------------------------------------------------- |
| `['virtual','pwa-register'].join(':')` | `virtual:/pwa-register` という存在しないパスを fetch | 文字列リテラル `"virtual:pwa-register"` を直接書く |
| 条件分岐で文字列組み立て               | ツリーシェイク & 置換失敗                            | import 文 / dynamic import の文字列は改変しない    |
| hook 版へ再置換                        | 差異検証コスト再発                                   | 機能差が必要になるまで保留 (本書に方針明記)        |

## 将来拡張のメモ

- Precache エントリ増加で初回ロードサイズ肥大化時は `workbox` runtimeCaching 分離。
- オフライン fallback を作る場合、manifest と sw へ `/offline.html` を追加。
- グローバル更新 UI が必要なら `needRefresh` を Context 化。

## 関連ファイル

- `src/components/layout/PWABadge.tsx` : PWA 状態バッジ UI 本体
- `src/app/PWARegister.ts` : 追加登録ラッパ (必要なら)
- `src/types/pwa-register.d.ts` : 仮想モジュール型宣言
- `vite.config.ts` : PWA plugin 設定

---

Last Updated: 2025-09-29
