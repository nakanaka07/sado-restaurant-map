# 🔒 セキュリティガイドライン

> **対象**: 佐渡飲食店マップ プロジェクト  
> **最終更新**: 2025年7月14日  
> **重要度**: 本番環境での機密情報保護

## 🎯 **セキュリティ原則**

### **1. 機密情報の保護**

#### **❌ 避けるべき実装**

```typescript
// NG: APIキーや測定IDを本番環境でログ出力
console.log("Google Analytics ID:", GA_MEASUREMENT_ID);
console.log("API Key:", GOOGLE_MAPS_API_KEY);
```

#### **✅ 推奨実装**

```typescript
// OK: 開発環境でのみ詳細ログ、本番環境では最小限
if (import.meta.env.DEV) {
  console.log("Google Analytics初期化:", GA_MEASUREMENT_ID);
} else {
  console.log("Google Analytics初期化完了");
}
```

### **2. 環境変数の適切な管理**

#### **開発環境 (.env.local)**

```bash
# 開発用設定 - リポジトリには含めない
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_GOOGLE_MAPS_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXX
```

#### **本番環境 (GitHub Secrets)**

```bash
# GitHub Actions Secrets
GA_MEASUREMENT_ID=G-XXXXXXXXXX
GOOGLE_MAPS_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### **3. ログ出力のベストプラクティス**

#### **レベル別ログ戦略**

```typescript
// 開発環境: 詳細なデバッグ情報
if (import.meta.env.DEV) {
  console.log("詳細デバッグ:", data);
  console.warn("警告:", warning);
  console.error("エラー:", error);
}

// 本番環境: 最小限の情報のみ
if (import.meta.env.PROD) {
  console.log("アプリ初期化完了");
  // 機密情報は含めない
}
```

#### **Analytics イベントログ**

```typescript
// 開発環境: 全パラメータ表示
if (import.meta.env.DEV) {
  console.log("GA Event:", eventName, parameters);
}

// 本番環境: イベント名のみ（重要なもののみ）
if (import.meta.env.PROD && isImportantEvent(eventName)) {
  console.log("GA Event:", eventName);
}
```

## 🛡️ **実装済みセキュリティ対策**

### **1. Google Analytics 4**

- ✅ **測定ID保護**: 本番環境でコンソールログに測定IDを出力しない
- ✅ **環境分離**: 開発環境と本番環境で異なるログレベル
- ✅ **GitHub Secrets**: 本番環境の測定IDはGitHub Secretsで管理

### **2. Google Maps API**

- ✅ **APIキー制限**: HTTPリファラー制限設定
- ✅ **API制限**: 必要なAPIのみ有効化
- ✅ **環境変数管理**: GitHub Secretsで保護

### **3. PWA設定**

- ✅ **マニフェスト設定**: スコープ内URLのみ許可
- ✅ **Service Worker**: セキュアな通信のみ

## 🔍 **セキュリティチェックリスト**

### **コード レビュー時の確認項目**

- [ ] **APIキー漏洩チェック**: コードにハードコードされたAPIキーがないか
- [ ] **ログ出力チェック**: 本番環境で機密情報がログに出力されないか
- [ ] **環境変数チェック**: .env.localがリポジトリに含まれていないか
- [ ] **HTTPS通信**: 全ての外部API通信がHTTPSか
- [ ] **CSP設定**: Content Security Policy が適切に設定されているか

### **デプロイ前チェック**

- [ ] **GitHub Secrets確認**: 本番環境の環境変数が正しく設定されているか
- [ ] **API制限確認**: Google Maps API, Analytics APIの制限が適切か
- [ ] **ドメイン制限**: 本番ドメインのみAPIアクセス許可されているか
- [ ] **ビルド確認**: 本番ビルドに機密情報が含まれていないか

### **運用時監視**

- [ ] **アクセスログ監視**: 異常なAPIアクセスがないか
- [ ] **エラーログ監視**: セキュリティ関連のエラーがないか
- [ ] **利用量監視**: API使用量の異常増加がないか

## 🚨 **インシデント対応**

### **APIキー漏洩時の対応**

1. **即座対応** (5分以内):
   - 漏洩したAPIキーを無効化
   - 新しいAPIキーを生成
   - GitHub Secretsを更新

2. **影響調査** (30分以内):
   - 漏洩期間の特定
   - 不正利用の有無確認
   - 影響範囲の特定

3. **復旧作業** (1時間以内):
   - 新APIキーでのデプロイ
   - 動作確認
   - 監視強化

### **不正アクセス検知時の対応**

1. **緊急対応**:
   - 該当IPアドレスのブロック
   - API制限の強化
   - ログの詳細調査

2. **恒久対策**:
   - セキュリティ設定の見直し
   - 監視アラートの強化
   - アクセスパターンの分析

## 📚 **参考リソース**

### **Google Cloud セキュリティ**

- [API キーのベスト プラクティス](https://cloud.google.com/docs/authentication/api-keys)
- [Maps JavaScript API セキュリティ](https://developers.google.com/maps/documentation/javascript/get-api-key)

### **React セキュリティ**

- [React セキュリティベストプラクティス](https://cheatsheetseries.owasp.org/cheatsheets/React_Security_Cheat_Sheet.html)
- [環境変数の安全な管理](https://vitejs.dev/guide/env-and-mode.html)

### **PWA セキュリティ**

- [PWA セキュリティベストプラクティス](https://web.dev/pwa-security/)
- [Service Worker セキュリティ](https://web.dev/service-worker-security/)

---

**🔒 重要**: このガイドラインは定期的に更新し、最新のセキュリティ脅威に対応する必要があります。
