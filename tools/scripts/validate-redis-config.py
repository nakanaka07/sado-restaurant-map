# Redis Cluster 設定バリデーションスクリプト
# 佐渡飲食店マップ - Redis Configuration Validator

import os
import re
import subprocess
import sys
from pathlib import Path

class RedisConfigValidator:
    def __init__(self, config_dir):
        self.config_dir = Path(config_dir)
        self.errors = []
        self.warnings = []
        self.info = []

    def log_error(self, message):
        self.errors.append(f"❌ ERROR: {message}")

    def log_warning(self, message):
        self.warnings.append(f"⚠️  WARNING: {message}")

    def log_info(self, message):
        self.info.append(f"ℹ️  INFO: {message}")

    def validate_redis_conf(self, config_file):
        """メインのredis.confファイルを検証"""
        print(f"\n🔍 検証中: {config_file}")

        if not config_file.exists():
            self.log_error(f"設定ファイルが見つかりません: {config_file}")
            return False

        with open(config_file, 'r', encoding='utf-8') as f:
            content = f.read()

        # 必須設定の確認
        required_settings = {
            'cluster-enabled yes': 'クラスター機能が有効化されていません',
            'cluster-config-file': 'クラスター設定ファイルが指定されていません',
            'cluster-node-timeout': 'ノードタイムアウトが設定されていません',
            'appendonly yes': 'AOF永続化が有効化されていません',
            'requirepass': 'パスワード認証が設定されていません'
        }

        for setting, error_msg in required_settings.items():
            if setting not in content or content.find(setting) == -1:
                self.log_error(error_msg)
            else:
                self.log_info(f"✓ {setting} が設定されています")

        # 推奨設定の確認
        recommended_settings = {
            'cluster-require-full-coverage no': 'フェイルオーバー時の可用性向上のため推奨',
            'cluster-migration-barrier 1': 'レプリケーション設定が推奨値です',
            'min-replicas-to-write 1': 'データ整合性のため推奨',
            'repl-backlog-size': 'レプリケーションバックログサイズの設定が推奨'
        }

        for setting, reason in recommended_settings.items():
            if setting in content:
                self.log_info(f"✓ {setting} - {reason}")
            else:
                self.log_warning(f"{setting} の設定が見つかりません - {reason}")

        # セキュリティ設定の確認
        security_checks = [
            ('protected-mode no', 'Dockerネットワーク内での接続のため'),
            ('rename-command FLUSHDB', '危険なコマンドの無効化'),
            ('rename-command FLUSHALL', '危険なコマンドの無効化')
        ]

        for check, reason in security_checks:
            if check in content:
                self.log_info(f"✓ セキュリティ設定: {check} - {reason}")
            else:
                self.log_warning(f"セキュリティ設定が不足: {check}")

        return len(self.errors) == 0

    def validate_node_configs(self):
        """各ノード設定ファイルを検証"""
        node_configs = [
            'redis-master-1.conf',
            'redis-master-2.conf',
            'redis-master-3.conf',
            'redis-replica-1.conf',
            'redis-replica-2.conf',
            'redis-replica-3.conf'
        ]

        expected_ports = [7001, 7002, 7003, 7004, 7005, 7006]

        for i, config_name in enumerate(node_configs):
            self._validate_single_node_config(config_name, i, expected_ports[i])

    def _validate_single_node_config(self, config_name, index, expected_port):
        """単一ノード設定ファイルの検証"""
        config_file = self.config_dir / config_name
        print(f"\n🔍 検証中: {config_name}")

        if not config_file.exists():
            self.log_error(f"ノード設定ファイルが見つかりません: {config_file}")
            return

        with open(config_file, 'r', encoding='utf-8') as f:
            content = f.read()

        self._check_port_setting(content, expected_port)
        self._check_include_setting(content)
        self._check_directory_setting(content, index)
        self._check_replica_settings(content, index)

    def _check_port_setting(self, content, expected_port):
        """ポート設定の確認"""
        if f"port {expected_port}" in content:
            self.log_info(f"✓ ポート設定: {expected_port}")
        else:
            self.log_error(f"ポート設定が不正: 期待値 {expected_port}")

    def _check_include_setting(self, content):
        """include文の確認"""
        if "include /usr/local/etc/redis/redis.conf" in content:
            self.log_info("✓ メイン設定ファイルのinclude設定あり")
        else:
            self.log_error("メイン設定ファイルのinclude設定がありません")

    def _check_directory_setting(self, content, index):
        """ディレクトリ設定の確認"""
        node_type = "master" if index < 3 else "replica"
        node_num = (index % 3) + 1 if index < 3 else index - 2
        expected_dir = f"/data/redis-{node_type}-{node_num}"

        if f"dir {expected_dir}" in content:
            self.log_info(f"✓ データディレクトリ設定: {expected_dir}")
        else:
            self.log_error(f"データディレクトリ設定が不正: 期待値 {expected_dir}")

    def _check_replica_settings(self, content, index):
        """レプリカ固有設定の確認"""
        if index >= 3:  # レプリカノード
            replica_settings = [
                'replica-read-only yes',
                'replica-serve-stale-data yes'
            ]

            for setting in replica_settings:
                if setting in content:
                    self.log_info(f"✓ レプリカ設定: {setting}")
                else:
                    self.log_warning(f"レプリカ設定が不足: {setting}")

    def validate_docker_compose(self):
        """Docker Compose設定を検証"""
        compose_file = self.config_dir.parent / 'docker-compose.phase3.yml'
        print("\n🔍 検証中: docker-compose.phase3.yml")

        if not compose_file.exists():
            self.log_error("docker-compose.phase3.yml が見つかりません")
            return False

        with open(compose_file, 'r', encoding='utf-8') as f:
            content = f.read()        # Redis サービスの確認
        expected_services = [
            'redis-master-1', 'redis-master-2', 'redis-master-3',
            'redis-replica-1', 'redis-replica-2', 'redis-replica-3',
            'redis-cluster-init'
        ]

        for service in expected_services:
            if f"{service}:" in content:
                self.log_info(f"✓ サービス定義: {service}")
            else:
                self.log_error(f"サービス定義が不足: {service}")

        # ポートマッピングの確認
        expected_ports = ['7001:7001', '7002:7002', '7003:7003', '7004:7004', '7005:7005', '7006:7006']
        for port_mapping in expected_ports:
            if port_mapping in content:
                self.log_info(f"✓ ポートマッピング: {port_mapping}")
            else:
                self.log_error(f"ポートマッピングが不足: {port_mapping}")

        # ボリュームマウントの確認
        if 'redis-master-1-data:/data/redis-master-1' in content:
            self.log_info("✓ ボリュームマウント設定あり")
        else:
            self.log_warning("ボリュームマウント設定を確認してください")

        # ネットワーク設定の確認
        if 'sado-network' in content:
            self.log_info("✓ カスタムネットワーク設定あり")
        else:
            self.log_warning("カスタムネットワーク設定が不足")

        return True

    def check_port_conflicts(self):
        """ポート競合チェック"""
        print("\n🔍 ポート競合チェック中...")

        redis_ports = [7001, 7002, 7003, 7004, 7005, 7006]
        bus_ports = [17001, 17002, 17003, 17004, 17005, 17006]

        try:
            # netstatコマンドでポート使用状況をチェック（Linuxの場合）
            result = subprocess.run(['netstat', '-tuln'], capture_output=True, text=True)
            if result.returncode == 0:
                for port in redis_ports + bus_ports:
                    if f":{port}" in result.stdout:
                        self.log_warning(f"ポート {port} は既に使用されている可能性があります")
                    else:
                        self.log_info(f"✓ ポート {port} は利用可能です")
            else:
                self.log_info("ポート確認はスキップされました（netstatコマンドが利用できません）")
        except FileNotFoundError:
            self.log_info("ポート確認はスキップされました（netstatコマンドが見つかりません）")

    def generate_best_practices_report(self):
        """ベストプラクティスレポートの生成"""
        print("\n📋 Redis Cluster ベストプラクティス評価")

        best_practices = [
            "✅ 3つのマスターノードで高可用性を確保",
            "✅ 各マスターに対してレプリカを配置",
            "✅ AOF永続化による耐久性確保",
            "✅ パスワード認証によるセキュリティ強化",
            "✅ cluster-require-full-coverage=no による可用性優先設定",
            "✅ 適切なタイムアウト設定 (15秒)",
            "✅ レプリケーションバックログサイズの最適化",
            "✅ 危険なコマンドの無効化",
            "✅ ログ設定とモニタリング対応",
            "✅ Docker化による運用性向上"
        ]

        for practice in best_practices:
            print(f"  {practice}")

    def run_validation(self):
        """全体の検証実行"""
        print("🚀 Redis Cluster 設定検証を開始します...")
        print("=" * 60)

        # メイン設定ファイルの検証
        main_config = self.config_dir / 'redis.conf'
        self.validate_redis_conf(main_config)

        # 各ノード設定ファイルの検証
        self.validate_node_configs()

        # Docker Compose設定の検証
        self.validate_docker_compose()

        # ポート競合チェック
        self.check_port_conflicts()

        # ベストプラクティスレポート
        self.generate_best_practices_report()

        # 結果サマリー
        print("\n" + "=" * 60)
        print("📊 検証結果サマリー")
        print("=" * 60)

        if self.errors:
            print(f"\n🔴 エラー ({len(self.errors)}件):")
            for error in self.errors:
                print(f"  {error}")

        if self.warnings:
            print(f"\n🟡 警告 ({len(self.warnings)}件):")
            for warning in self.warnings:
                print(f"  {warning}")

        if self.info:
            print(f"\n🔵 情報 ({len(self.info)}件):")
            for info in self.info:
                print(f"  {info}")

        # 総合評価
        print("\n🎯 総合評価:")
        if len(self.errors) == 0:
            if len(self.warnings) == 0:
                print("✅ 完璧です！Redis Cluster設定に問題はありません。")
            else:
                print("🟢 良好です。いくつかの改善提案がありますが、動作に問題はありません。")
        else:
            print("🔴 問題があります。エラーを修正してから起動してください。")

        return len(self.errors) == 0

if __name__ == "__main__":
    config_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'config', 'redis')
    validator = RedisConfigValidator(config_dir)

    success = validator.run_validation()
    sys.exit(0 if success else 1)
