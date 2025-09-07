# 品質ゲート設定

## 概要

Phase 3-Full 本格運用環境における包括的な品質保証ゲートの設定です。

## 1. コード品質基準

### ESLint 設定 (強化版)

```javascript
// config/eslint-quality-gate.config.js
export default [
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: "module",
      parser: "@typescript-eslint/parser",
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
    plugins: {
      "@typescript-eslint": require("@typescript-eslint/eslint-plugin"),
      react: require("eslint-plugin-react"),
      "react-hooks": require("eslint-plugin-react-hooks"),
      security: require("eslint-plugin-security"),
      sonarjs: require("eslint-plugin-sonarjs"),
    },
    rules: {
      // TypeScript品質ルール
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/explicit-function-return-type": "warn",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/prefer-nullish-coalescing": "error",
      "@typescript-eslint/prefer-optional-chain": "error",

      // React品質ルール
      "react/jsx-no-leaked-render": "error",
      "react/jsx-key": "error",
      "react/no-unstable-nested-components": "error",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // セキュリティルール
      "security/detect-object-injection": "error",
      "security/detect-non-literal-regexp": "error",
      "security/detect-unsafe-regex": "error",

      // SonarJS品質ルール
      "sonarjs/cognitive-complexity": ["error", 15],
      "sonarjs/no-duplicate-string": ["error", 3],
      "sonarjs/no-identical-functions": "error",
      "sonarjs/prefer-immediate-return": "error",

      // 一般的な品質ルール
      complexity: ["error", { max: 10 }],
      "max-depth": ["error", 4],
      "max-lines-per-function": ["error", { max: 50 }],
      "max-params": ["error", 4],
      "no-console": "warn",
      "no-debugger": "error",
      "prefer-const": "error",
      "no-var": "error",
    },
  },
];
```

### Python 品質設定

```toml
# pyproject.toml
[tool.pylint]
max-line-length = 100
disable = [
    "missing-docstring",
    "too-few-public-methods"
]

[tool.pylint.design]
max-args = 5
max-locals = 15
max-branches = 12
max-statements = 50

[tool.pylint.similarities]
min-similarity-lines = 4
ignore-comments = true
ignore-docstrings = true

[tool.bandit]
exclude_dirs = ["tests", "test_*.py"]
skips = ["B101", "B601"]

[tool.coverage.run]
source = ["tools/scraper"]
omit = [
    "*/tests/*",
    "*/test_*.py",
    "*/__pycache__/*"
]

[tool.coverage.report]
min_coverage = 80
fail_under = 80
show_missing = true
```

## 2. テストカバレッジ基準

### フロントエンド (Vitest)

```typescript
// config/vitest-coverage.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      reportsDirectory: "./coverage",
      thresholds: {
        global: {
          branches: 80,
          functions: 85,
          lines: 85,
          statements: 85,
        },
        perFile: {
          branches: 75,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
      include: ["src/**/*.{js,jsx,ts,tsx}"],
      exclude: [
        "src/**/*.test.{js,jsx,ts,tsx}",
        "src/**/*.spec.{js,jsx,ts,tsx}",
        "src/test/**",
        "src/**/*.d.ts",
        "src/vite-env.d.ts",
      ],
    },
    // 品質ゲート設定
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    testTimeout: 10000,
    hookTimeout: 10000,
  },
});
```

### バックエンド (Pytest)

```ini
# .coveragerc
[run]
source = tools/scraper
omit =
    */tests/*
    */test_*.py
    */__pycache__/*
    */migrations/*

[report]
precision = 2
show_missing = True
fail_under = 80

[html]
directory = htmlcov
```

## 3. セキュリティスキャン設定

### Node.js セキュリティ

```json
{
  "audit-ci": {
    "moderate": true,
    "allowlist": [],
    "report-type": "full",
    "output-format": "json"
  }
}
```

### Python セキュリティ (Bandit)

```yaml
# .bandit
exclude_dirs:
  - /tests
  - /test_*

tests:
  - B101 # assert_used
  - B102 # exec_used
  - B103 # set_bad_file_permissions
  - B104 # hardcoded_bind_all_interfaces
  - B105 # hardcoded_password_string
  - B106 # hardcoded_password_funcarg
  - B107 # hardcoded_password_default
  - B108 # hardcoded_tmp_directory
  - B110 # try_except_pass
  - B112 # try_except_continue
  - B201 # flask_debug_true
  - B301 # pickle_*
  - B302 # pickle_*
  - B303 # pickle_*
  - B304 # pickle_*
  - B305 # cipher_*
  - B306 # mktemp_q
  - B307 # eval
  - B308 # mark_safe
  - B309 # httpsconnection
  - B310 # urllib_urlopen
  - B311 # random
  - B312 # telnetlib
  - B313 # xml_*
  - B314 # xml_*
  - B315 # xml_*
  - B316 # xml_*
  - B317 # xml_*
  - B318 # xml_*
  - B319 # xml_*
  - B320 # xml_*
  - B321 # ftplib
  - B322 # input
  - B323 # unverified_context
  - B324 # hashlib_new_insecure_functions
  - B325 # tempnam
  - B401 # import_telnetlib
  - B402 # import_ftplib
  - B403 # import_pickle
  - B404 # import_subprocess
  - B405 # import_xml_*
  - B406 # import_xml_*
  - B407 # import_xml_*
  - B408 # import_xml_*
  - B409 # import_xml_*
  - B410 # import_xml_*
  - B411 # import_xml_*
  - B412 # import_xml_*
  - B501 # request_with_no_cert_validation
  - B502 # ssl_with_bad_version
  - B503 # ssl_with_bad_defaults
  - B504 # ssl_with_no_version
  - B505 # weak_cryptographic_key
  - B506 # yaml_load
  - B507 # ssh_no_host_key_verification
  - B601 # paramiko_calls
  - B602 # subprocess_popen_with_shell_equals_true
  - B603 # subprocess_without_shell_equals_true
  - B604 # any_other_function_with_shell_equals_true
  - B605 # start_process_with_a_shell
  - B606 # start_process_with_no_shell
  - B607 # start_process_with_partial_path
  - B608 # hardcoded_sql_expressions
  - B609 # linux_commands_wildcard_injection
  - B610 # django_extra_used
  - B611 # django_rawsql_used
  - B701 # jinja2_autoescape_false
  - B702 # use_of_mako_templates
  - B703 # django_mark_safe

skips:
  - B101 # テスト環境でのassert使用を許可
  - B601 # パラメータ化されたshell呼び出しを許可

severity: medium
confidence: medium
```

## 4. Docker セキュリティ

### Dockerfile 品質チェック

```bash
#!/bin/bash
# tools/quality/docker-security-scan.sh

set -euo pipefail

echo "🔍 Docker セキュリティスキャン開始"

# Hadolint による Dockerfile 静的解析
echo "📋 Hadolint スキャン..."
hadolint docker/Dockerfile.app
hadolint docker/Dockerfile.worker
hadolint docker/Dockerfile.test

# Trivy による脆弱性スキャン
echo "🔒 Trivy 脆弱性スキャン..."
trivy image --severity HIGH,CRITICAL --exit-code 1 sado-restaurant-app:latest
trivy image --severity HIGH,CRITICAL --exit-code 1 sado-restaurant-worker:latest

# Docker Bench Security
echo "🛡️ Docker Bench Security スキャン..."
docker run --rm --net host --pid host --userns host --cap-add audit_control \
    -e DOCKER_CONTENT_TRUST=$DOCKER_CONTENT_TRUST \
    -v /etc:/etc:ro \
    -v /usr/bin/containerd:/usr/bin/containerd:ro \
    -v /usr/bin/runc:/usr/bin/runc:ro \
    -v /usr/lib/systemd:/usr/lib/systemd:ro \
    -v /var/lib:/var/lib:ro \
    -v /var/run/docker.sock:/var/run/docker.sock:ro \
    --label docker_bench_security \
    docker/docker-bench-security

echo "✅ Docker セキュリティスキャン完了"
```

## 5. SonarQube 統合設定

### Phase3 品質プロファイル

```properties
# sonar-project-phase3.properties
sonar.projectKey=sado-restaurant-map-phase3
sonar.projectName=Sado Restaurant Map - Phase3 Production
sonar.projectVersion=3.0.0

# ソースコード設定
sonar.sources=src,tools/scraper
sonar.tests=src/test,tools/scraper/tests
sonar.test.inclusions=**/*test*.py,**/*test*.ts,**/*test*.tsx,**/*spec*.ts,**/*spec*.tsx

# 除外設定
sonar.exclusions=**/node_modules/**,**/dist/**,**/coverage/**,**/*.min.js,**/vendor/**,**/.venv/**
sonar.test.exclusions=**/node_modules/**,**/dist/**

# 品質ゲート設定
sonar.qualitygate.wait=true
sonar.qualitygate.timeout=300

# カバレッジ設定
sonar.javascript.lcov.reportPaths=coverage/lcov.info
sonar.python.coverage.reportPaths=coverage.xml
sonar.coverage.exclusions=**/*test*,**/*spec*,**/mock/**,**/fixtures/**

# 品質メトリクス閾値
sonar.quality.gate=Phase3-Production-Gate

# TypeScript/JavaScript設定
sonar.typescript.tsconfigPath=tsconfig.json
sonar.eslint.reportPaths=eslint-report.json

# Python設定
sonar.python.pylint.reportPaths=pylint-report.txt
sonar.python.bandit.reportPaths=bandit-report.json
sonar.python.flake8.reportPaths=flake8-report.txt

# 重複コード検出
sonar.cpd.exclusions=**/*test*,**/*spec*

# セキュリティホットスポット
sonar.security.hotspots.inherit=NONE

# 技術負債評価
sonar.debt.excludes=**/*test*,**/*spec*
```

### カスタム品質ゲート定義

```json
{
  "name": "Phase3-Production-Gate",
  "description": "Phase3本格運用環境向け品質ゲート",
  "conditions": [
    {
      "metric": "new_coverage",
      "operator": "LT",
      "threshold": "80",
      "onLeakPeriod": true
    },
    {
      "metric": "new_duplicated_lines_density",
      "operator": "GT",
      "threshold": "3",
      "onLeakPeriod": true
    },
    {
      "metric": "new_maintainability_rating",
      "operator": "GT",
      "threshold": "1",
      "onLeakPeriod": true
    },
    {
      "metric": "new_reliability_rating",
      "operator": "GT",
      "threshold": "1",
      "onLeakPeriod": true
    },
    {
      "metric": "new_security_rating",
      "operator": "GT",
      "threshold": "1",
      "onLeakPeriod": true
    },
    {
      "metric": "new_security_hotspots_reviewed",
      "operator": "LT",
      "threshold": "100",
      "onLeakPeriod": true
    }
  ]
}
```

## 6. パフォーマンステスト設定

### 負荷テスト設定

```yaml
# tools/testing/load-test-config.yml
load_testing:
  scenarios:
    smoke_test:
      users: 1
      duration: 60s
      requests_per_second: 1

    load_test:
      users: 50
      duration: 300s
      requests_per_second: 10

    stress_test:
      users: 200
      duration: 600s
      requests_per_second: 50

    spike_test:
      users: 500
      duration: 120s
      requests_per_second: 100

  thresholds:
    response_time_p95: 500ms
    response_time_p99: 1000ms
    error_rate: 1%
    availability: 99.9%

  endpoints:
    - path: "/"
      method: GET
      weight: 40

    - path: "/api/restaurants"
      method: GET
      weight: 30

    - path: "/api/search"
      method: POST
      weight: 20

    - path: "/health"
      method: GET
      weight: 10
```

### K6 負荷テストスクリプト

```javascript
// tools/testing/load-test.js
import http from "k6/http";
import { check, sleep } from "k6";
import { Rate } from "k6/metrics";

// カスタムメトリクス
const errorRate = new Rate("errors");

export const options = {
  stages: [
    { duration: "2m", target: 20 }, // 2分でユーザー数を20に増加
    { duration: "5m", target: 20 }, // 5分間20ユーザーを維持
    { duration: "2m", target: 50 }, // 2分で50ユーザーに増加
    { duration: "5m", target: 50 }, // 5分間50ユーザーを維持
    { duration: "2m", target: 0 }, // 2分で0ユーザーに減少
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"], // 95%のリクエストが500ms未満
    http_req_failed: ["rate<0.01"], // エラー率1%未満
    errors: ["rate<0.01"], // カスタムエラー率1%未満
  },
};

export default function () {
  const baseUrl = __ENV.BASE_URL || "http://localhost";

  // メインページアクセス
  let response = http.get(`${baseUrl}/`);
  check(response, {
    メインページ正常応答: (r) => r.status === 200,
    レスポンス時間OK: (r) => r.timings.duration < 500,
  }) || errorRate.add(1);

  sleep(1);

  // レストラン検索API
  response = http.get(`${baseUrl}/api/restaurants`);
  check(response, {
    レストランAPI正常応答: (r) => r.status === 200,
    JSONデータ取得: (r) => r.json() !== undefined,
  }) || errorRate.add(1);

  sleep(1);

  // 検索API
  const searchPayload = JSON.stringify({
    query: "寿司",
    location: "佐渡",
  });

  response = http.post(`${baseUrl}/api/search`, searchPayload, {
    headers: { "Content-Type": "application/json" },
  });

  check(response, {
    検索API正常応答: (r) => r.status === 200,
    検索結果取得: (r) => r.json("results") !== undefined,
  }) || errorRate.add(1);

  sleep(2);
}

export function handleSummary(data) {
  return {
    "load-test-results.json": JSON.stringify(data, null, 2),
    "load-test-results.html": htmlReport(data),
  };
}

function htmlReport(data) {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>負荷テスト結果 - Sado Restaurant Map</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .metric { margin: 10px 0; padding: 10px; border: 1px solid #ddd; }
    .pass { background-color: #d4edda; }
    .fail { background-color: #f8d7da; }
  </style>
</head>
<body>
  <h1>負荷テスト結果</h1>
  <h2>テスト概要</h2>
  <p>実行時間: ${new Date().toISOString()}</p>

  <h2>パフォーマンス指標</h2>
  <div class="metric ${
    data.metrics.http_req_duration.values.p95 < 500 ? "pass" : "fail"
  }">
    <strong>レスポンス時間 P95:</strong> ${data.metrics.http_req_duration.values.p95.toFixed(
      2
    )}ms
  </div>

  <div class="metric ${
    data.metrics.http_req_failed.values.rate < 0.01 ? "pass" : "fail"
  }">
    <strong>エラー率:</strong> ${(
      data.metrics.http_req_failed.values.rate * 100
    ).toFixed(2)}%
  </div>

  <div class="metric">
    <strong>総リクエスト数:</strong> ${data.metrics.http_reqs.values.count}
  </div>

  <div class="metric">
    <strong>平均レスポンス時間:</strong> ${data.metrics.http_req_duration.values.avg.toFixed(
      2
    )}ms
  </div>
</body>
</html>
  `;
}
```

## 7. 統合品質チェックスクリプト

```bash
#!/bin/bash
# tools/quality/quality-gate-check.sh

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$PROJECT_ROOT"

echo "🚀 Phase3 品質ゲートチェック開始"

# 品質チェック結果
QUALITY_REPORT="/tmp/quality-gate-report.json"
echo '{"timestamp":"'$(date -Iseconds)'","checks":{}}' > "$QUALITY_REPORT"

# 1. ESLint品質チェック
echo "📊 ESLint品質チェック実行中..."
if pnpm run lint 2>&1 | tee /tmp/eslint.log; then
    echo '✅ ESLint: PASS'
    jq '.checks.eslint = "PASS"' "$QUALITY_REPORT" > tmp && mv tmp "$QUALITY_REPORT"
else
    echo '❌ ESLint: FAIL'
    jq '.checks.eslint = "FAIL"' "$QUALITY_REPORT" > tmp && mv tmp "$QUALITY_REPORT"
fi

# 2. テストカバレッジチェック
echo "🧪 テストカバレッジチェック実行中..."
if pnpm run test:coverage 2>&1 | tee /tmp/coverage.log; then
    COVERAGE=$(grep -o '[0-9]\+\.[0-9]\+%' /tmp/coverage.log | tail -1 | sed 's/%//')
    if (( $(echo "$COVERAGE >= 80" | bc -l) )); then
        echo "✅ カバレッジ: PASS ($COVERAGE%)"
        jq ".checks.coverage = \"PASS($COVERAGE%)\"" "$QUALITY_REPORT" > tmp && mv tmp "$QUALITY_REPORT"
    else
        echo "❌ カバレッジ: FAIL ($COVERAGE%)"
        jq ".checks.coverage = \"FAIL($COVERAGE%)\"" "$QUALITY_REPORT" > tmp && mv tmp "$QUALITY_REPORT"
    fi
else
    echo '❌ カバレッジ: FAIL'
    jq '.checks.coverage = "FAIL"' "$QUALITY_REPORT" > tmp && mv tmp "$QUALITY_REPORT"
fi

# 3. セキュリティスキャン
echo "🔒 セキュリティスキャン実行中..."
SECURITY_PASS=true

# npm audit
if npm audit --audit-level=moderate; then
    echo '✅ npm audit: PASS'
else
    echo '❌ npm audit: FAIL'
    SECURITY_PASS=false
fi

# Bandit (Python)
if bandit -r tools/scraper -f json -o /tmp/bandit.json; then
    echo '✅ Bandit: PASS'
else
    echo '❌ Bandit: FAIL'
    SECURITY_PASS=false
fi

if $SECURITY_PASS; then
    jq '.checks.security = "PASS"' "$QUALITY_REPORT" > tmp && mv tmp "$QUALITY_REPORT"
else
    jq '.checks.security = "FAIL"' "$QUALITY_REPORT" > tmp && mv tmp "$QUALITY_REPORT"
fi

# 4. パフォーマンステスト
echo "⚡ パフォーマンステスト実行中..."
if k6 run tools/testing/load-test.js; then
    echo '✅ パフォーマンステスト: PASS'
    jq '.checks.performance = "PASS"' "$QUALITY_REPORT" > tmp && mv tmp "$QUALITY_REPORT"
else
    echo '❌ パフォーマンステスト: FAIL'
    jq '.checks.performance = "FAIL"' "$QUALITY_REPORT" > tmp && mv tmp "$QUALITY_REPORT"
fi

# 5. Docker品質チェック
echo "🐳 Docker品質チェック実行中..."
if ./tools/quality/docker-security-scan.sh; then
    echo '✅ Docker品質: PASS'
    jq '.checks.docker = "PASS"' "$QUALITY_REPORT" > tmp && mv tmp "$QUALITY_REPORT"
else
    echo '❌ Docker品質: FAIL'
    jq '.checks.docker = "FAIL"' "$QUALITY_REPORT" > tmp && mv tmp "$QUALITY_REPORT"
fi

# 品質ゲート判定
echo "📋 品質ゲート最終判定..."
FAIL_COUNT=$(jq '.checks | to_entries | map(select(.value | contains("FAIL"))) | length' "$QUALITY_REPORT")

if [ "$FAIL_COUNT" -eq 0 ]; then
    echo "🎉 品質ゲート: 全チェック通過"
    jq '.overall = "PASS"' "$QUALITY_REPORT" > tmp && mv tmp "$QUALITY_REPORT"
    exit 0
else
    echo "❌ 品質ゲート: $FAIL_COUNT 個のチェックが失敗"
    jq '.overall = "FAIL"' "$QUALITY_REPORT" > tmp && mv tmp "$QUALITY_REPORT"

    # 失敗レポート表示
    echo "失敗したチェック:"
    jq -r '.checks | to_entries | map(select(.value | contains("FAIL"))) | .[] | "- \(.key): \(.value)"' "$QUALITY_REPORT"

    exit 1
fi
```

この包括的な品質ゲート設定により、Phase 3-Full 環境での高品質なコードデプロイメントが保証されます。
