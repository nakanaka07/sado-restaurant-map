# モニタリング・アラート設定

## 概要

Phase 3-Full 本格運用環境における包括的な監視・アラートシステムの設定です。

## 1. Prometheus 設定

### Phase3 本格運用向け設定

```yaml
# config/prometheus/phase3-prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    cluster: "sado-restaurant-phase3"
    environment: "production"

rule_files:
  - "alert_rules.yml"
  - "recording_rules.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
            - alertmanager:9093

scrape_configs:
  # Application Servers
  - job_name: "sado-app-servers"
    static_configs:
      - targets:
          - "app-server-1:9090"
          - "app-server-2:9090"
    metrics_path: "/metrics"
    scrape_interval: 30s
    scrape_timeout: 10s

  # Redis Cluster Monitoring
  - job_name: "redis-cluster"
    static_configs:
      - targets:
          - "redis-exporter-master-1:9121"
          - "redis-exporter-master-2:9122"
          - "redis-exporter-master-3:9123"
    scrape_interval: 30s

  # Nginx Load Balancer
  - job_name: "nginx-exporter"
    static_configs:
      - targets:
          - "nginx-exporter:9113"
    scrape_interval: 30s

  # Node Exporter (System Metrics)
  - job_name: "node-exporter"
    static_configs:
      - targets:
          - "node-exporter:9100"
    scrape_interval: 30s

  # Celery Worker Monitoring
  - job_name: "celery-workers"
    static_configs:
      - targets:
          - "celery-worker:9540"
    scrape_interval: 30s

  # Docker Containers
  - job_name: "cadvisor"
    static_configs:
      - targets:
          - "cadvisor:8080"
    scrape_interval: 30s

  # Blackbox Exporter (External Monitoring)
  - job_name: "blackbox"
    metrics_path: /probe
    params:
      module: [http_2xx]
    static_configs:
      - targets:
          - "https://nakanaka07.github.io/sado-restaurant-map"
          - "http://sado-restaurant.local"
    relabel_configs:
      - source_labels: [__address__]
        target_label: __param_target
      - source_labels: [__param_target]
        target_label: instance
      - target_label: __address__
        replacement: blackbox-exporter:9115

  # Self Monitoring
  - job_name: "prometheus"
    static_configs:
      - targets:
          - "localhost:9090"
```

### アラートルール設定

```yaml
# config/prometheus/alert_rules.yml
groups:
  - name: sado-restaurant.rules
    rules:
      # Application Availability
      - alert: ApplicationDown
        expr: up{job="sado-app-servers"} == 0
        for: 1m
        labels:
          severity: critical
          service: application
        annotations:
          summary: "Application server is down"
          description: "Application server {{ $labels.instance }} has been down for more than 1 minute."

      # High Error Rate
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 2m
        labels:
          severity: critical
          service: application
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value | humanizePercentage }} on {{ $labels.instance }}"

      # High Response Time
      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 3m
        labels:
          severity: warning
          service: application
        annotations:
          summary: "High response time detected"
          description: "95th percentile response time is {{ $value }}s on {{ $labels.instance }}"

      # Redis Cluster Issues
      - alert: RedisClusterDown
        expr: up{job="redis-cluster"} == 0
        for: 1m
        labels:
          severity: critical
          service: redis
        annotations:
          summary: "Redis cluster node is down"
          description: "Redis cluster node {{ $labels.instance }} is down"

      - alert: RedisHighMemoryUsage
        expr: redis_memory_used_bytes / redis_memory_max_bytes > 0.8
        for: 5m
        labels:
          severity: warning
          service: redis
        annotations:
          summary: "Redis high memory usage"
          description: "Redis memory usage is {{ $value | humanizePercentage }} on {{ $labels.instance }}"

      # System Resources
      - alert: HighCPUUsage
        expr: 100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 5m
        labels:
          severity: warning
          service: system
        annotations:
          summary: "High CPU usage"
          description: "CPU usage is {{ $value }}% on {{ $labels.instance }}"

      - alert: HighMemoryUsage
        expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes > 0.85
        for: 5m
        labels:
          severity: warning
          service: system
        annotations:
          summary: "High memory usage"
          description: "Memory usage is {{ $value | humanizePercentage }} on {{ $labels.instance }}"

      - alert: HighDiskUsage
        expr: (node_filesystem_size_bytes - node_filesystem_avail_bytes) / node_filesystem_size_bytes > 0.9
        for: 5m
        labels:
          severity: critical
          service: system
        annotations:
          summary: "High disk usage"
          description: "Disk usage is {{ $value | humanizePercentage }} on {{ $labels.instance }}"

      # Docker Container Issues
      - alert: ContainerHighCPU
        expr: rate(container_cpu_usage_seconds_total[5m]) > 0.8
        for: 5m
        labels:
          severity: warning
          service: docker
        annotations:
          summary: "Container high CPU usage"
          description: "Container {{ $labels.name }} CPU usage is {{ $value | humanizePercentage }}"

      - alert: ContainerHighMemory
        expr: container_memory_usage_bytes / container_spec_memory_limit_bytes > 0.8
        for: 5m
        labels:
          severity: warning
          service: docker
        annotations:
          summary: "Container high memory usage"
          description: "Container {{ $labels.name }} memory usage is {{ $value | humanizePercentage }}"

      # Business Logic Alerts
      - alert: LowUserActivity
        expr: rate(http_requests_total[1h]) < 10
        for: 30m
        labels:
          severity: info
          service: business
        annotations:
          summary: "Low user activity detected"
          description: "User activity is below normal levels"

      - alert: SearchAPIFailure
        expr: rate(http_requests_total{endpoint="/api/search",status=~"5.."}[5m]) > 0.1
        for: 2m
        labels:
          severity: critical
          service: business
        annotations:
          summary: "Search API failure rate is high"
          description: "Search API failure rate is {{ $value | humanizePercentage }}"
```

### 記録ルール設定

```yaml
# config/prometheus/recording_rules.yml
groups:
  - name: sado-restaurant.aggregations
    interval: 30s
    rules:
      # Application Metrics
      - record: sado:http_requests:rate5m
        expr: rate(http_requests_total[5m])

      - record: sado:http_request_duration:p95
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

      - record: sado:http_request_duration:p99
        expr: histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))

      # Error Rates
      - record: sado:http_error_rate:5m
        expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m])

      - record: sado:http_error_rate:1h
        expr: rate(http_requests_total{status=~"5.."}[1h]) / rate(http_requests_total[1h])

      # System Metrics
      - record: sado:cpu_usage
        expr: 100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

      - record: sado:memory_usage
        expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes

      - record: sado:disk_usage
        expr: (node_filesystem_size_bytes - node_filesystem_avail_bytes) / node_filesystem_size_bytes

      # Redis Metrics
      - record: sado:redis_memory_usage
        expr: redis_memory_used_bytes / redis_memory_max_bytes

      - record: sado:redis_commands_rate
        expr: rate(redis_commands_processed_total[5m])
```

## 2. Grafana ダッシュボード設定

### メインダッシュボード

```json
{
  "dashboard": {
    "title": "Sado Restaurant Map - Phase3 Production Overview",
    "tags": ["sado-restaurant", "phase3", "production"],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "refresh": "30s",
    "panels": [
      {
        "title": "Application Health",
        "type": "stat",
        "targets": [
          {
            "expr": "up{job=\"sado-app-servers\"}",
            "legendFormat": "{{instance}}"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "color": {
              "mode": "thresholds"
            },
            "thresholds": {
              "steps": [
                { "color": "red", "value": 0 },
                { "color": "green", "value": 1 }
              ]
            }
          }
        }
      },
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "sum(sado:http_requests:rate5m)",
            "legendFormat": "Requests/sec"
          }
        ]
      },
      {
        "title": "Response Time (P95)",
        "type": "graph",
        "targets": [
          {
            "expr": "sado:http_request_duration:p95",
            "legendFormat": "P95 Response Time"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "sado:http_error_rate:5m * 100",
            "legendFormat": "Error Rate %"
          }
        ]
      },
      {
        "title": "Redis Cluster Status",
        "type": "table",
        "targets": [
          {
            "expr": "up{job=\"redis-cluster\"}",
            "legendFormat": "{{instance}}"
          }
        ]
      },
      {
        "title": "System Resources",
        "type": "graph",
        "targets": [
          {
            "expr": "sado:cpu_usage",
            "legendFormat": "CPU Usage %"
          },
          {
            "expr": "sado:memory_usage * 100",
            "legendFormat": "Memory Usage %"
          }
        ]
      }
    ]
  }
}
```

## 3. Alertmanager 設定

```yaml
# config/alertmanager/alertmanager.yml
global:
  smtp_smarthost: "localhost:587"
  smtp_from: "alerts@sado-restaurant.local"

route:
  group_by: ["alertname", "service"]
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: "default-receiver"
  routes:
    - match:
        severity: critical
      receiver: "critical-alerts"
      group_wait: 0s
      repeat_interval: 5m
    - match:
        service: business
      receiver: "business-alerts"

receivers:
  - name: "default-receiver"
    slack_configs:
      - api_url: "YOUR_SLACK_WEBHOOK_URL"
        channel: "#monitoring"
        title: "Sado Restaurant Map Alert"
        text: '{{ range .Alerts }}{{ .Annotations.summary }}\n{{ .Annotations.description }}{{ end }}'

  - name: "critical-alerts"
    slack_configs:
      - api_url: "YOUR_SLACK_WEBHOOK_URL"
        channel: "#critical-alerts"
        title: "🚨 CRITICAL ALERT - Sado Restaurant Map"
        text: '{{ range .Alerts }}{{ .Annotations.summary }}\n{{ .Annotations.description }}{{ end }}'
    email_configs:
      - to: "ops@sado-restaurant.com"
        subject: "🚨 CRITICAL ALERT - Sado Restaurant Map"
        body: |
          {{ range .Alerts }}
          Alert: {{ .Annotations.summary }}
          Description: {{ .Annotations.description }}
          Severity: {{ .Labels.severity }}
          Service: {{ .Labels.service }}
          {{ end }}

  - name: "business-alerts"
    slack_configs:
      - api_url: "YOUR_SLACK_WEBHOOK_URL"
        channel: "#business-metrics"
        title: "Business Alert - Sado Restaurant Map"
        text: '{{ range .Alerts }}{{ .Annotations.summary }}\n{{ .Annotations.description }}{{ end }}'

inhibit_rules:
  - source_match:
      severity: "critical"
    target_match:
      severity: "warning"
    equal: ["alertname", "service"]
```

## 4. 自動監視スクリプト

```bash
#!/bin/bash
# tools/monitoring/health-monitor.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# 設定読み込み
source "$SCRIPT_DIR/monitoring-config.sh"

# ログ設定
LOG_FILE="${MONITORING_LOG_DIR}/health-monitor-$(date +%Y%m%d).log"
mkdir -p "$(dirname "$LOG_FILE")"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

check_application_health() {
    log "🏥 アプリケーションヘルスチェック実行中"

    local endpoints=(
        "$APP_BASE_URL/"
        "$APP_BASE_URL/health"
        "$APP_BASE_URL/api/restaurants"
    )

    local failed_endpoints=()

    for endpoint in "${endpoints[@]}"; do
        if ! curl -f --max-time 10 "$endpoint" >/dev/null 2>&1; then
            failed_endpoints+=("$endpoint")
            log "❌ ヘルスチェック失敗: $endpoint"
        else
            log "✅ ヘルスチェック成功: $endpoint"
        fi
    done

    if [[ ${#failed_endpoints[@]} -gt 0 ]]; then
        send_alert "application_health_failure" "Failed endpoints: ${failed_endpoints[*]}"
        return 1
    fi

    return 0
}

check_redis_cluster() {
    log "🔍 Redisクラスターヘルスチェック実行中"

    local failed_nodes=()

    for i in {1..3}; do
        local container_name="sado-redis-master-$i"
        if docker ps --format "table {{.Names}}" | grep -q "$container_name"; then
            if ! docker exec "$container_name" redis-cli ping | grep -q PONG; then
                failed_nodes+=("$container_name")
                log "❌ Redisノード不正常: $container_name"
            else
                log "✅ Redisノード正常: $container_name"
            fi
        else
            failed_nodes+=("$container_name (not running)")
            log "❌ Redisコンテナ未実行: $container_name"
        fi
    done

    if [[ ${#failed_nodes[@]} -gt 0 ]]; then
        send_alert "redis_cluster_failure" "Failed nodes: ${failed_nodes[*]}"
        return 1
    fi

    return 0
}

check_docker_containers() {
    log "🐳 Dockerコンテナヘルスチェック実行中"

    local required_containers=(
        "sado-app-1"
        "sado-app-2"
        "sado-nginx"
        "sado-prometheus"
        "sado-grafana"
    )

    local failed_containers=()

    for container in "${required_containers[@]}"; do
        if ! docker ps --format "table {{.Names}}" | grep -q "$container"; then
            failed_containers+=("$container")
            log "❌ コンテナ未実行: $container"
        else
            # ヘルスチェック状態確認
            local health_status
            health_status=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "no_healthcheck")

            if [[ "$health_status" == "unhealthy" ]]; then
                failed_containers+=("$container (unhealthy)")
                log "❌ コンテナ不正常: $container"
            else
                log "✅ コンテナ正常: $container"
            fi
        fi
    done

    if [[ ${#failed_containers[@]} -gt 0 ]]; then
        send_alert "docker_container_failure" "Failed containers: ${failed_containers[*]}"
        return 1
    fi

    return 0
}

check_system_resources() {
    log "📊 システムリソースチェック実行中"

    local alerts=()

    # CPU使用率チェック
    local cpu_usage
    cpu_usage=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}')

    if (( $(echo "$cpu_usage > 80" | bc -l) )); then
        alerts+=("High CPU usage: ${cpu_usage}%")
        log "⚠️ CPU使用率高: ${cpu_usage}%"
    else
        log "✅ CPU使用率正常: ${cpu_usage}%"
    fi

    # メモリ使用率チェック
    local memory_info
    memory_info=$(free | grep Mem)
    local total_mem=$(echo "$memory_info" | awk '{print $2}')
    local used_mem=$(echo "$memory_info" | awk '{print $3}')
    local memory_usage=$(echo "scale=2; $used_mem * 100 / $total_mem" | bc)

    if (( $(echo "$memory_usage > 85" | bc -l) )); then
        alerts+=("High memory usage: ${memory_usage}%")
        log "⚠️ メモリ使用率高: ${memory_usage}%"
    else
        log "✅ メモリ使用率正常: ${memory_usage}%"
    fi

    # ディスク使用率チェック
    local disk_usage
    disk_usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')

    if [[ $disk_usage -gt 90 ]]; then
        alerts+=("High disk usage: ${disk_usage}%")
        log "⚠️ ディスク使用率高: ${disk_usage}%"
    else
        log "✅ ディスク使用率正常: ${disk_usage}%"
    fi

    if [[ ${#alerts[@]} -gt 0 ]]; then
        send_alert "system_resource_warning" "${alerts[*]}"
        return 1
    fi

    return 0
}

check_external_dependencies() {
    log "🌐 外部依存関係チェック実行中"

    local external_services=(
        "https://maps.googleapis.com"
        "https://sheets.googleapis.com"
    )

    local failed_services=()

    for service in "${external_services[@]}"; do
        if ! curl -f --max-time 10 "$service" >/dev/null 2>&1; then
            failed_services+=("$service")
            log "❌ 外部サービス接続失敗: $service"
        else
            log "✅ 外部サービス接続成功: $service"
        fi
    done

    if [[ ${#failed_services[@]} -gt 0 ]]; then
        send_alert "external_dependency_failure" "Failed services: ${failed_services[*]}"
        return 1
    fi

    return 0
}

send_alert() {
    local alert_type="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    local full_message="🚨 MONITORING ALERT 🚨
Project: Sado Restaurant Map
Environment: Phase3 Production
Alert Type: $alert_type
Time: $timestamp
Details: $message"

    log "🚨 アラート送信: $alert_type"

    # Slack通知
    if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"$full_message\"}" \
            "$SLACK_WEBHOOK_URL" || log "⚠️ Slack通知失敗"
    fi

    # メール通知
    if command -v mail >/dev/null 2>&1 && [[ -n "${ALERT_EMAIL:-}" ]]; then
        echo "$full_message" | mail -s "SADO RESTAURANT MAP - MONITORING ALERT" "$ALERT_EMAIL" || log "⚠️ メール通知失敗"
    fi

    # Prometheusアラート（webhook）
    if [[ -n "${ALERTMANAGER_WEBHOOK:-}" ]]; then
        local alert_payload=$(cat <<EOF
[{
  "labels": {
    "alertname": "$alert_type",
    "service": "sado-restaurant-map",
    "severity": "warning",
    "environment": "production"
  },
  "annotations": {
    "summary": "$alert_type detected",
    "description": "$message"
  },
  "generatorURL": "http://health-monitor/alert"
}]
EOF
)
        curl -X POST -H 'Content-Type: application/json' \
            --data "$alert_payload" \
            "$ALERTMANAGER_WEBHOOK" || log "⚠️ Alertmanager通知失敗"
    fi
}

generate_health_report() {
    log "📋 ヘルスレポート生成中"

    local report_file="${MONITORING_LOG_DIR}/health-report-$(date +%Y%m%d_%H%M%S).json"

    cat > "$report_file" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "environment": "phase3-production",
  "checks": {
    "application_health": $(check_application_health && echo "true" || echo "false"),
    "redis_cluster": $(check_redis_cluster && echo "true" || echo "false"),
    "docker_containers": $(check_docker_containers && echo "true" || echo "false"),
    "system_resources": $(check_system_resources && echo "true" || echo "false"),
    "external_dependencies": $(check_external_dependencies && echo "true" || echo "false")
  }
}
EOF

    log "📄 ヘルスレポート保存: $report_file"
}

main() {
    log "🚀 Phase3本格運用ヘルスモニタリング開始"

    local exit_code=0

    # 各チェック実行
    check_application_health || exit_code=1
    check_redis_cluster || exit_code=1
    check_docker_containers || exit_code=1
    check_system_resources || exit_code=1
    check_external_dependencies || exit_code=1

    # レポート生成
    generate_health_report

    if [[ $exit_code -eq 0 ]]; then
        log "✅ 全ヘルスチェック成功"
    else
        log "❌ 一部ヘルスチェック失敗"
    fi

    exit $exit_code
}

# スクリプト実行
main "$@"
```

## 5. 設定ファイル

```bash
# tools/monitoring/monitoring-config.sh

# 基本設定
export MONITORING_LOG_DIR="${MONITORING_LOG_DIR:-/var/log/sado-restaurant/monitoring}"
export APP_BASE_URL="${APP_BASE_URL:-http://localhost}"

# 通知設定
export SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}"
export ALERT_EMAIL="${ALERT_EMAIL:-}"
export ALERTMANAGER_WEBHOOK="${ALERTMANAGER_WEBHOOK:-http://localhost:9093/api/v1/alerts}"

# 閾値設定
export CPU_THRESHOLD="${CPU_THRESHOLD:-80}"
export MEMORY_THRESHOLD="${MEMORY_THRESHOLD:-85}"
export DISK_THRESHOLD="${DISK_THRESHOLD:-90}"

# 監視間隔
export HEALTH_CHECK_INTERVAL="${HEALTH_CHECK_INTERVAL:-300}"  # 5分
```

この包括的な監視・アラート設定により、Phase 3-Full 環境での 24/7 運用監視が実現されます。
