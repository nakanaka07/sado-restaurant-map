# deployment-config.sh
# デプロイメント設定ファイル

# 基本設定
export DEPLOYMENT_ENV="${DEPLOYMENT_ENV:-production}"
export PROJECT_NAME="sado-restaurant-map"

# ログ設定
export LOG_DIR="${LOG_DIR:-/var/log/sado-restaurant}"
export BACKUP_BASE_DIR="${BACKUP_BASE_DIR:-/var/backups/sado-restaurant}"

# タイムアウト設定
export STARTUP_WAIT_TIME="${STARTUP_WAIT_TIME:-60}"
export HEALTH_CHECK_MAX_ATTEMPTS="${HEALTH_CHECK_MAX_ATTEMPTS:-30}"
export HEALTH_CHECK_WAIT_TIME="${HEALTH_CHECK_WAIT_TIME:-10}"
export MONITORING_DURATION="${MONITORING_DURATION:-300}"

# Green環境エンドポイント
export GREEN_APP_BASE_URL="${GREEN_APP_BASE_URL:-http://green.sado-restaurant.local}"
export GREEN_APP_HEALTH_URL="${GREEN_APP_HEALTH_URL:-http://green.sado-restaurant.local/health}"
export GREEN_APP_SERVER_1="${GREEN_APP_SERVER_1:-green.sado-restaurant.local}"
export GREEN_APP_SERVER_2="${GREEN_APP_SERVER_2:-green.sado-restaurant.local}"

# ロードバランサー設定
export LOAD_BALANCER_URL="${LOAD_BALANCER_URL:-http://sado-restaurant.local}"

# 監視設定
export PROMETHEUS_URL="${PROMETHEUS_URL:-http://localhost:9090}"
export ERROR_RATE_THRESHOLD="${ERROR_RATE_THRESHOLD:-5.0}"
export RESPONSE_TIME_THRESHOLD="${RESPONSE_TIME_THRESHOLD:-1000}"
export MAX_MONITORING_ERRORS="${MAX_MONITORING_ERRORS:-3}"

# 通知設定
export SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}"
export ALERT_EMAIL="${ALERT_EMAIL:-}"

# Docker設定
export DOCKER_REGISTRY="${DOCKER_REGISTRY:-ghcr.io}"
export DOCKER_NAMESPACE="${DOCKER_NAMESPACE:-nakanaka07/sado-restaurant-map}"

# セキュリティ設定
export REDIS_PASSWORD="${REDIS_PASSWORD:-sado_redis_2025}"

# 環境固有設定読み込み
if [[ -f "${PROJECT_ROOT}/.env.${DEPLOYMENT_ENV}" ]]; then
    source "${PROJECT_ROOT}/.env.${DEPLOYMENT_ENV}"
fi
