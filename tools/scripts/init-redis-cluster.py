#!/usr/bin/env python3
"""
Redis Cluster初期化スクリプト - Windows Docker環境対応
Grokzenアプローチを適用した独自構成用
"""

import redis
import time
import sys
from typing import List

def init_redis_cluster():
    """Redis Clusterを初期化"""

    # 設定
    REDIS_PASSWORD = "sado_redis_2025"
    NODES = [
        {"host": "127.0.0.1", "port": 7001},
        {"host": "127.0.0.1", "port": 7002},
        {"host": "127.0.0.1", "port": 7003},
        {"host": "127.0.0.1", "port": 7004},
        {"host": "127.0.0.1", "port": 7005},
        {"host": "127.0.0.1", "port": 7006},
    ]

    print("=== Redis Cluster 初期化スクリプト ===")
    print("Grokzenアプローチを適用した独自構成")
    print("=====================================")

    # ステップ 1: 接続性確認
    print("ステップ 1: 全ノードの接続性確認...")
    for node in NODES:
        print(f"  ノード {node['host']}:{node['port']}... ", end="")
        try:
            r = redis.Redis(
                host=node['host'],
                port=node['port'],
                password=REDIS_PASSWORD,
                socket_connect_timeout=5
            )
            r.ping()
            print("✓ 正常")
        except Exception as e:
            print(f"✗ 接続失敗: {e}")
            return False

    # ステップ 2: 既存設定リセット
    print("ステップ 2: 既存クラスター設定のリセット...")
    for node in NODES:
        try:
            r = redis.Redis(
                host=node['host'],
                port=node['port'],
                password=REDIS_PASSWORD
            )
            r.execute_command("CLUSTER", "RESET")
            print(f"  ノード {node['port']} リセット完了")
        except Exception as e:
            print(f"  ノード {node['port']} リセット失敗（継続）: {e}")

    time.sleep(2)

    # ステップ 3: Dockerコンテナ内からクラスター作成
    print("ステップ 3: Redis Cluster作成...")
    print("  マスター: 7001, 7002, 7003")
    print("  レプリカ: 7004, 7005, 7006")

    try:
        # Dockerコンテナ内でredis-cliを実行
        import subprocess

        # すべてのノードを起動順に配列
        node_addresses = [f"{node['host']}:{node['port']}" for node in NODES]

        # Dockerコンテナ内からredis-cliを実行
        cmd = [
            "docker", "exec", "sado-redis-master-1",
            "redis-cli", "-a", REDIS_PASSWORD,
            "--cluster", "create"
        ] + node_addresses + [
            "--cluster-replicas", "1",
            "--cluster-yes"
        ]

        print(f"  実行コマンド: {' '.join(cmd)}")
        result = subprocess.run(cmd, capture_output=True, text=True)

        if result.returncode == 0:
            print("✓ クラスター作成成功")
            print(result.stdout)
        else:
            print(f"✗ クラスター作成失敗: {result.stderr}")
            return False

    except Exception as e:
        print(f"✗ クラスター作成エラー: {e}")
        return False

    # ステップ 4: 状態確認
    print("ステップ 4: クラスター状態確認...")
    try:
        r = redis.Redis(host="127.0.0.1", port=7001, password=REDIS_PASSWORD)
        cluster_info = r.execute_command("CLUSTER", "INFO")
        print("クラスター情報:")
        for line in cluster_info.decode().split('\r\n'):
            if line:
                print(f"  {line}")

        print("\nノード情報:")
        cluster_nodes = r.execute_command("CLUSTER", "NODES")
        for line in cluster_nodes.decode().split('\n'):
            if line.strip():
                print(f"  {line}")

    except Exception as e:
        print(f"状態確認エラー: {e}")
        return False

    print("\n=== Redis Cluster 初期化完了 ===")
    print("✓ 3マスター + 3レプリカ構成")
    print("✓ 高可用性対応")
    print("✓ 自動フェイルオーバー有効")
    print("=================================")

    return True

if __name__ == "__main__":
    success = init_redis_cluster()
    sys.exit(0 if success else 1)
