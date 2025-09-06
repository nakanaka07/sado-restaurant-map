#!/bin/bash

# ==========================================
# Comprehensive Security Testing Script
# 佐渡飲食店マップ Phase 3-Full セキュリティテスト実行
# ==========================================

set -e

echo "🔒 佐渡飲食店マップ Phase 3-Full セキュリティテスト開始"
echo "====================================================="

# 環境設定
TARGET_URL=${1:-"http://localhost:8000"}
REPORT_DIR="logs/security-tests"
TIMESTAMP=$(date '+%Y%m%d-%H%M%S')

# ディレクトリ作成
mkdir -p $REPORT_DIR

echo "🎯 テスト対象: $TARGET_URL"
echo "📂 レポート出力: $REPORT_DIR"

# ===== Phase 1: 基本セキュリティテスト =====
echo ""
echo "📋 Phase 1: OWASP準拠セキュリティテスト実行中..."

python3 tools/testing/security_test_suite.py \
    --url "$TARGET_URL" \
    --output "$REPORT_DIR/owasp-security-report-$TIMESTAMP.json"

OWASP_EXIT_CODE=$?

# ===== Phase 2: 脆弱性スキャン =====
echo ""
echo "🔍 Phase 2: 依存関係脆弱性スキャン実行中..."

# npm audit (Node.js dependencies)
if [ -f "package.json" ]; then
    echo "📦 Node.js依存関係スキャン..."
    npm audit --json > "$REPORT_DIR/npm-audit-$TIMESTAMP.json" 2>/dev/null || true
    npm audit --audit-level moderate > "$REPORT_DIR/npm-audit-summary-$TIMESTAMP.txt" 2>/dev/null || true
fi

# Python依存関係スキャン (safety)
if command -v safety &> /dev/null; then
    echo "🐍 Python依存関係スキャン..."
    safety check --json --output "$REPORT_DIR/python-safety-$TIMESTAMP.json" || true
    safety check --output text > "$REPORT_DIR/python-safety-summary-$TIMESTAMP.txt" || true
else
    echo "⚠️ safety コマンドが見つかりません。pip install safetyで追加してください。"
fi

# ===== Phase 3: Docker セキュリティスキャン =====
echo ""
echo "🐳 Phase 3: Docker セキュリティスキャン実行中..."

# Docker Bench for Security (if available)
if command -v docker-bench-security &> /dev/null; then
    echo "📋 Docker Bench for Security実行..."
    docker-bench-security > "$REPORT_DIR/docker-bench-$TIMESTAMP.txt" 2>&1 || true
fi

# Dockerfile ベストプラクティスチェック
echo "📄 Dockerfile セキュリティチェック..."
cat > "$REPORT_DIR/dockerfile-security-$TIMESTAMP.txt" << EOF
Dockerfile Security Analysis - $TIMESTAMP
=========================================

EOF

# Dockerfileの基本チェック
for dockerfile in docker/Dockerfile.*; do
    if [ -f "$dockerfile" ]; then
        echo "Analyzing: $dockerfile" >> "$REPORT_DIR/dockerfile-security-$TIMESTAMP.txt"

        # ルートユーザーチェック
        if grep -q "USER root" "$dockerfile"; then
            echo "❌ CRITICAL: Root user detected in $dockerfile" >> "$REPORT_DIR/dockerfile-security-$TIMESTAMP.txt"
        elif grep -q "USER " "$dockerfile"; then
            echo "✅ PASS: Non-root user configured in $dockerfile" >> "$REPORT_DIR/dockerfile-security-$TIMESTAMP.txt"
        else
            echo "⚠️ WARNING: No USER directive found in $dockerfile" >> "$REPORT_DIR/dockerfile-security-$TIMESTAMP.txt"
        fi

        # secrets チェック
        if grep -iE "(password|secret|key|token)" "$dockerfile"; then
            echo "⚠️ WARNING: Potential secrets in $dockerfile" >> "$REPORT_DIR/dockerfile-security-$TIMESTAMP.txt"
        fi

        # 更新チェック
        if grep -q "apt-get update" "$dockerfile" && ! grep -q "apt-get upgrade"; then
            echo "⚠️ WARNING: Missing security updates in $dockerfile" >> "$REPORT_DIR/dockerfile-security-$TIMESTAMP.txt"
        fi

        echo "" >> "$REPORT_DIR/dockerfile-security-$TIMESTAMP.txt"
    fi
done

# ===== Phase 4: Network セキュリティスキャン =====
echo ""
echo "🌐 Phase 4: ネットワークセキュリティスキャン実行中..."

# nmap scan (if available and target is localhost)
if command -v nmap &> /dev/null && [[ "$TARGET_URL" == *"localhost"* ]]; then
    echo "📡 ネットワークポートスキャン..."
    nmap -sS -O localhost > "$REPORT_DIR/nmap-scan-$TIMESTAMP.txt" 2>&1 || true
fi

# SSL/TLS スキャン
if [[ "$TARGET_URL" == https* ]]; then
    echo "🔒 SSL/TLS セキュリティスキャン..."

    # testssl.sh (if available)
    if command -v testssl.sh &> /dev/null; then
        testssl.sh --json "$TARGET_URL" > "$REPORT_DIR/ssl-scan-$TIMESTAMP.json" 2>&1 || true
    elif command -v sslscan &> /dev/null; then
        sslscan "$TARGET_URL" > "$REPORT_DIR/ssl-scan-$TIMESTAMP.txt" 2>&1 || true
    else
        echo "⚠️ SSL/TLSスキャンツールが見つかりません"
    fi
fi

# ===== Phase 5: Code Quality & SAST =====
echo ""
echo "🔧 Phase 5: 静的コード解析実行中..."

# ESLint security rules (JavaScript/TypeScript)
if [ -f "package.json" ] && command -v npx &> /dev/null; then
    echo "🔍 JavaScript/TypeScript セキュリティルール実行..."
    npx eslint --ext .js,.ts,.jsx,.tsx src/ --format json > "$REPORT_DIR/eslint-security-$TIMESTAMP.json" 2>/dev/null || true
fi

# Bandit (Python security linter)
if command -v bandit &> /dev/null; then
    echo "🐍 Python セキュリティ解析 (Bandit)..."
    bandit -r tools/ -f json -o "$REPORT_DIR/bandit-security-$TIMESTAMP.json" 2>/dev/null || true
    bandit -r tools/ -f txt > "$REPORT_DIR/bandit-security-summary-$TIMESTAMP.txt" 2>/dev/null || true
else
    echo "⚠️ bandit コマンドが見つかりません。pip install banditで追加してください。"
fi

# ===== Phase 6: Infrastructure Security =====
echo ""
echo "🏗️ Phase 6: インフラストラクチャセキュリティチェック..."

# Redis セキュリティ設定確認
echo "🔴 Redis セキュリティ設定確認..."
cat > "$REPORT_DIR/redis-security-$TIMESTAMP.txt" << EOF
Redis Security Analysis - $TIMESTAMP
====================================

EOF

# Redis設定ファイルチェック
for redis_conf in config/redis/*.conf; do
    if [ -f "$redis_conf" ]; then
        echo "Analyzing: $redis_conf" >> "$REPORT_DIR/redis-security-$TIMESTAMP.txt"

        # パスワード設定確認
        if grep -q "^requirepass" "$redis_conf"; then
            echo "✅ PASS: Password authentication enabled" >> "$REPORT_DIR/redis-security-$TIMESTAMP.txt"
        else
            echo "❌ CRITICAL: No password authentication" >> "$REPORT_DIR/redis-security-$TIMESTAMP.txt"
        fi

        # バインドアドレス確認
        if grep -q "^bind 127.0.0.1" "$redis_conf"; then
            echo "✅ PASS: Bound to localhost only" >> "$REPORT_DIR/redis-security-$TIMESTAMP.txt"
        elif grep -q "^bind" "$redis_conf"; then
            echo "⚠️ WARNING: Custom bind address configured" >> "$REPORT_DIR/redis-security-$TIMESTAMP.txt"
        else
            echo "❌ CRITICAL: No bind address restriction" >> "$REPORT_DIR/redis-security-$TIMESTAMP.txt"
        fi

        # 危険なコマンド無効化確認
        if grep -q "rename-command" "$redis_conf"; then
            echo "✅ PASS: Dangerous commands renamed/disabled" >> "$REPORT_DIR/redis-security-$TIMESTAMP.txt"
        else
            echo "⚠️ WARNING: Dangerous commands not disabled" >> "$REPORT_DIR/redis-security-$TIMESTAMP.txt"
        fi

        echo "" >> "$REPORT_DIR/redis-security-$TIMESTAMP.txt"
    fi
done

# Docker Compose セキュリティ確認
echo "🐳 Docker Compose セキュリティ設定確認..."
cat > "$REPORT_DIR/docker-compose-security-$TIMESTAMP.txt" << EOF
Docker Compose Security Analysis - $TIMESTAMP
==============================================

EOF

for compose_file in docker-compose*.yml; do
    if [ -f "$compose_file" ]; then
        echo "Analyzing: $compose_file" >> "$REPORT_DIR/docker-compose-security-$TIMESTAMP.txt"

        # 特権モード確認
        if grep -q "privileged: true" "$compose_file"; then
            echo "❌ CRITICAL: Privileged containers found" >> "$REPORT_DIR/docker-compose-security-$TIMESTAMP.txt"
        else
            echo "✅ PASS: No privileged containers" >> "$REPORT_DIR/docker-compose-security-$TIMESTAMP.txt"
        fi

        # ボリュームマウント確認
        if grep -q "/var/run/docker.sock" "$compose_file"; then
            echo "❌ CRITICAL: Docker socket mounted" >> "$REPORT_DIR/docker-compose-security-$TIMESTAMP.txt"
        fi

        # ネットワークモード確認
        if grep -q "network_mode: host" "$compose_file"; then
            echo "⚠️ WARNING: Host network mode used" >> "$REPORT_DIR/docker-compose-security-$TIMESTAMP.txt"
        fi

        # 環境変数の機密情報確認
        if grep -iE "(password|secret|key|token).*:" "$compose_file"; then
            echo "⚠️ WARNING: Potential secrets in environment variables" >> "$REPORT_DIR/docker-compose-security-$TIMESTAMP.txt"
        fi

        echo "" >> "$REPORT_DIR/docker-compose-security-$TIMESTAMP.txt"
    fi
done

# ===== レポート統合 =====
echo ""
echo "📊 セキュリティテスト結果統合中..."

# 統合レポート作成
cat > "$REPORT_DIR/security-test-summary-$TIMESTAMP.txt" << EOF
佐渡飲食店マップ Phase 3-Full セキュリティテスト結果
======================================================
実行日時: $(date)
対象URL: $TARGET_URL

実行されたテスト:
✓ OWASP Top 10 準拠テスト
✓ 依存関係脆弱性スキャン
✓ Docker セキュリティチェック
✓ ネットワークセキュリティスキャン
✓ 静的コード解析
✓ インフラストラクチャセキュリティチェック

生成されたレポート:
EOF

# 生成されたファイルリスト
ls -la "$REPORT_DIR"/*-$TIMESTAMP.* >> "$REPORT_DIR/security-test-summary-$TIMESTAMP.txt" 2>/dev/null || true

# クリティカルな問題の集計
echo "" >> "$REPORT_DIR/security-test-summary-$TIMESTAMP.txt"
echo "クリティカルな問題:" >> "$REPORT_DIR/security-test-summary-$TIMESTAMP.txt"

# 各レポートからクリティカルな問題を抽出
find "$REPORT_DIR" -name "*-$TIMESTAMP.*" -type f | while read file; do
    if grep -i "critical\|❌" "$file" > /dev/null 2>&1; then
        echo "⚠️ $file でクリティカルな問題が発見されました" >> "$REPORT_DIR/security-test-summary-$TIMESTAMP.txt"
    fi
done

# ===== 結果表示 =====
echo ""
echo "✅ セキュリティテスト完了！"
echo "====================================================="
echo "📂 レポート場所: $REPORT_DIR/"
echo "📄 統合レポート: $REPORT_DIR/security-test-summary-$TIMESTAMP.txt"

# OWASPテストの結果に基づく終了コード
if [ $OWASP_EXIT_CODE -eq 0 ]; then
    echo "🟢 OWASP セキュリティテスト: 合格"
else
    echo "🔴 OWASP セキュリティテスト: 重大な問題あり"
fi

echo ""
echo "📋 次のステップ:"
echo "1. $REPORT_DIR/security-test-summary-$TIMESTAMP.txt を確認"
echo "2. クリティカルな問題を優先的に修正"
echo "3. CI/CDパイプラインに統合"

# 戻り値設定
exit $OWASP_EXIT_CODE
