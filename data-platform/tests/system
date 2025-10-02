#!/usr/bin/env python3
"""
佐渡飲食店マップ - システムテストスクリプト
React 19 + TypeScript 5.7 + Vite 7 環境での基本テスト
"""

import time
import sys
import os
import subprocess
import json
# 定数定義
PACKAGE_JSON = "package.json"

# パッケージ利用可能性チェック
try:
    import psutil
    HAS_PSUTIL = True
except ImportError:
    HAS_PSUTIL = False
    print("⚠️  psutilが見つかりません。pip install psutilで追加できます")

try:
    import requests
    HAS_REQUESTS = True
except ImportError:
    HAS_REQUESTS = False
    print("⚠️  requestsが見つかりません。pip install requestsで追加できます")


def test_system_health():
    """システムヘルスチェックテスト"""
    print("\n🔍 システムヘルスチェックテスト開始...")

    if not HAS_PSUTIL:
        print("📄 基本システムチェックを実行中...")

        # Pythonバージョン
        python_version = sys.version.split()[0]
        print(f"  🐍 Python: {python_version}")

        # 現在の作業ディレクトリ
        cwd = os.getcwd()
        print(f"  📁 作業ディレクトリ: {cwd}")

        # ディスク容量（簡易版）
        if os.name == 'nt':  # Windows
            import shutil
            _, _, free = shutil.disk_usage(cwd)
            print(f"  💽 ディスク空き容量: {free // (1024**3)}GB")

        print("✅ 基本システムチェック完了")
        return True

    try:
        # CPU使用率
        cpu_percent = psutil.cpu_percent(interval=1)
        print(f"  💻 CPU使用率: {cpu_percent}%")

        # メモリ使用率
        memory = psutil.virtual_memory()
        print(f"  💾 メモリ使用率: {memory.percent}% ({memory.used // (1024**2)}MB / {memory.total // (1024**2)}MB)")

        # ディスク使用率
        disk = psutil.disk_usage('.')
        print(f"  💽 ディスク使用率: {disk.percent}% ({disk.free // (1024**3)}GB 空き)")

        # プロセス数
        process_count = len(psutil.pids())
        print(f"  ⚙️  実行中プロセス数: {process_count}")

        print("✅ システムヘルスチェック完了")
        return True

    except Exception as e:
        print(f"❌ システムヘルスチェック失敗: {e}")
        return False


def test_development_environment():
    """開発環境テスト"""
    print("\n🔍 開発環境テスト開始...")

    test_results = {}

    # Node.js確認
    try:
        result = subprocess.run(['node', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            node_version = result.stdout.strip()
            print(f"  ✅ Node.js: {node_version}")
            test_results['node'] = True
        else:
            print("  ❌ Node.js: 実行エラー")
            test_results['node'] = False
    except FileNotFoundError:
        print("  ❌ Node.js: 見つかりません")
        test_results['node'] = False

    # pnpm確認
    try:
        result = subprocess.run(['pnpm', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            pnpm_version = result.stdout.strip()
            print(f"  ✅ pnpm: v{pnpm_version}")
            test_results['pnpm'] = True
        else:
            print("  ❌ pnpm: 実行エラー")
            test_results['pnpm'] = False
    except FileNotFoundError:
        print("  ❌ pnpm: 見つかりません")
        test_results['pnpm'] = False

    # TypeScript確認
    try:
        result = subprocess.run(['npx', 'tsc', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            tsc_version = result.stdout.strip()
            print(f"  ✅ TypeScript: {tsc_version}")
            test_results['typescript'] = True
        else:
            print("  ❌ TypeScript: 実行エラー")
            test_results['typescript'] = False
    except FileNotFoundError:
        print("  ❌ TypeScript: 見つかりません")
        test_results['typescript'] = False

    # Git確認
    try:
        result = subprocess.run(['git', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            git_version = result.stdout.strip()
            print(f"  ✅ Git: {git_version}")
            test_results['git'] = True
        else:
            print("  ❌ Git: 実行エラー")
            test_results['git'] = False
    except FileNotFoundError:
        print("  ❌ Git: 見つかりません")
        test_results['git'] = False

    success_count = sum(test_results.values())
    total_count = len(test_results)

    print(f"開発環境テスト結果: {success_count}/{total_count} 成功")
    return success_count == total_count


def test_project_structure():
    """プロジェクト構造テスト"""
    print("\n🔍 プロジェクト構造テスト開始...")

    required_files = [
        PACKAGE_JSON,
        "tsconfig.json",
        "vite.config.ts",
        "index.html",
        "src/main.tsx",  # React 19の想定エントリーポイント
    ]

    optional_files = [
        ".env.local",
        "public/manifest.json",
        "public/favicon.ico",
        "src/vite-env.d.ts"
    ]

    missing_required = []
    missing_optional = []

    # 必須ファイル確認
    for file in required_files:
        if os.path.exists(file):
            print(f"  ✅ {file}")
        else:
            print(f"  ❌ {file} (必須)")
            missing_required.append(file)

    # オプションファイル確認
    for file in optional_files:
        if os.path.exists(file):
            print(f"  ✅ {file}")
        else:
            print(f"  ⚠️  {file} (推奨)")
            missing_optional.append(file)

    # ディレクトリ構造確認
    required_dirs = ["src", "public"]
    for dir_name in required_dirs:
        if os.path.isdir(dir_name):
            print(f"  ✅ {dir_name}/")
        else:
            print(f"  ❌ {dir_name}/ (必須)")
            missing_required.append(f"{dir_name}/")

    if missing_required:
        print(f"❌ 不足している必須ファイル: {missing_required}")
        return False

    if missing_optional:
        print(f"⚠️  不足している推奨ファイル: {missing_optional}")

    print("✅ プロジェクト構造テスト完了")
    return True


def test_package_json():
    """package.json設定テスト"""
    print("\n🔍 package.json設定テスト開始...")

    if not os.path.exists(PACKAGE_JSON):
        print("❌ package.jsonが見つかりません")
        return False

    try:
        with open(PACKAGE_JSON, "r", encoding="utf-8") as f:
            package_data = json.load(f)

        # 基本情報確認
        print(f"  📦 プロジェクト名: {package_data.get('name', 'N/A')}")
        print(f"  📄 バージョン: {package_data.get('version', 'N/A')}")
        print(f"  🔧 タイプ: {package_data.get('type', 'commonjs')}")

        # 必須スクリプト確認
        scripts = package_data.get('scripts', {})
        required_scripts = ['dev', 'build', 'preview']

        for script in required_scripts:
            if script in scripts:
                print(f"  ✅ スクリプト: {script}")
            else:
                print(f"  ❌ スクリプト: {script} (必須)")

        # 依存関係確認
        dependencies = package_data.get('dependencies', {})
        dev_dependencies = package_data.get('devDependencies', {})

        # React 19確認
        react_version = dependencies.get('react', 'N/A')
        if react_version.startswith('^19') or react_version.startswith('19'):
            print(f"  ✅ React: {react_version}")
        else:
            print(f"  ⚠️  React: {react_version} (19.x推奨)")

        # Vite確認
        vite_version = dev_dependencies.get('vite', dependencies.get('vite', 'N/A'))
        if '7.' in vite_version:
            print(f"  ✅ Vite: {vite_version}")
        else:
            print(f"  ⚠️  Vite: {vite_version} (7.x推奨)")

        # TypeScript確認
        ts_version = dev_dependencies.get('typescript', 'N/A')
        if '5.7' in ts_version:
            print(f"  ✅ TypeScript: {ts_version}")
        else:
            print(f"  ⚠️  TypeScript: {ts_version} (5.7.x推奨)")

        print("✅ package.json設定テスト完了")
        return True

    except json.JSONDecodeError as e:
        print(f"❌ package.json解析エラー: {e}")
        return False
    except Exception as e:
        print(f"❌ package.jsonテストエラー: {e}")
        return False


def test_build_process():
    """ビルドプロセステスト"""
    print("\n🔍 ビルドプロセステスト開始...")

    # TypeScriptチェック（型のみ）
    print("  📝 TypeScript型チェック...")
    try:
        result = subprocess.run(['npx', 'tsc', '--noEmit'],
                              capture_output=True, text=True, timeout=60)
        if result.returncode == 0:
            print("  ✅ TypeScript型チェック: OK")
        else:
            print("  ❌ TypeScript型チェック: エラーあり")
            if result.stderr:
                print(f"    エラー詳細: {result.stderr[:200]}...")
            return False
    except subprocess.TimeoutExpired:
        print("  ❌ TypeScript型チェック: タイムアウト")
        return False
    except FileNotFoundError:
        print("  ⚠️  TypeScript型チェック: スキップ（tsc未発見）")

    # ビルドテスト（実際のビルドは行わない、設定チェックのみ）
    print("  🔨 ビルド設定チェック...")
    if os.path.exists("vite.config.ts"):
        print("  ✅ Vite設定ファイル: 存在")
    else:
        print("  ❌ Vite設定ファイル: 見つかりません")
        return False

    print("✅ ビルドプロセステスト完了")
    return True


def test_mock_api_integration():
    """モックAPIテスト"""
    print("\n🔍 モックAPIテスト開始...")

    # Google Maps API設定確認
    print("  🗺️  Google Maps API設定確認...")

    # 環境変数確認
    api_key = os.getenv('VITE_GOOGLE_MAPS_API_KEY')
    if api_key and api_key != 'your_google_maps_api_key_here':
        print("  ✅ Google Maps API Key: 設定済み")
    else:
        print("  ⚠️  Google Maps API Key: 未設定または初期値")

    # .env.local確認
    if os.path.exists('.env.local'):
        print("  ✅ .env.local: 存在")
        try:
            with open('.env.local', 'r', encoding='utf-8') as f:
                content = f.read()
                if 'VITE_GOOGLE_MAPS_API_KEY' in content:
                    print("  ✅ .env.local: API Key設定あり")
                else:
                    print("  ⚠️  .env.local: API Key設定なし")
        except Exception as e:
            print(f"  ❌ .env.local読み込みエラー: {e}")
    else:
        print("  ⚠️  .env.local: 見つかりません")

    # モック地域データテスト
    print("  📍 佐渡地域データモック生成...")

    mock_restaurants = [
        {"id": "mock_001", "name": "テスト寿司店", "lat": 38.0, "lng": 138.4},
        {"id": "mock_002", "name": "テストラーメン店", "lat": 38.1, "lng": 138.5},
        {"id": "mock_003", "name": "テスト居酒屋", "lat": 38.05, "lng": 138.45},
    ]

    print(f"  ✅ モック飲食店データ: {len(mock_restaurants)}件生成")

    # 座標範囲確認（佐渡島の緯度経度範囲）
    sado_lat_range = (37.8, 38.3)
    sado_lng_range = (138.2, 138.6)

    valid_coords = 0
    for restaurant in mock_restaurants:
        lat, lng = restaurant['lat'], restaurant['lng']
        if (sado_lat_range[0] <= lat <= sado_lat_range[1] and
            sado_lng_range[0] <= lng <= sado_lng_range[1]):
            valid_coords += 1

    print(f"  ✅ 佐渡島座標範囲内: {valid_coords}/{len(mock_restaurants)}件")

    print("✅ モックAPIテスト完了")
    return True


def main():
    """メイン実行関数"""
    print("🎉 佐渡飲食店マップ - システムテスト開始")
    print("=" * 50)
    print("React 19 + TypeScript 5.7 + Vite 7 環境")
    print("=" * 50)

    test_results = []

    # 1. システムヘルスチェック
    test_results.append(("システムヘルス", test_system_health()))

    # 2. 開発環境確認
    test_results.append(("開発環境", test_development_environment()))

    # 3. プロジェクト構造確認
    test_results.append(("プロジェクト構造", test_project_structure()))

    # 4. package.json設定確認
    test_results.append(("package.json設定", test_package_json()))

    # 5. ビルドプロセス確認
    test_results.append(("ビルドプロセス", test_build_process()))

    # 6. モックAPI確認
    test_results.append(("モックAPI", test_mock_api_integration()))

    # 結果サマリー
    print("\n" + "=" * 50)
    print("🏁 システムテスト結果サマリー")
    print("=" * 50)

    success_count = 0
    for test_name, success in test_results:
        status = "✅ 成功" if success else "❌ 失敗"
        print(f"{test_name}: {status}")
        if success:
            success_count += 1

    total_tests = len(test_results)
    success_rate = (success_count / total_tests) * 100

    print(f"\n総合結果: {success_count}/{total_tests} 成功 ({success_rate:.1f}%)")

    if success_count == total_tests:
        print("🎉 すべてのテストが成功しました！")
        print("佐渡飲食店マップの開発環境が正常に動作しています。")
        print("\n📋 次のステップ:")
        print("  1. pnpm run dev で開発サーバー起動")
        print("  2. .env.localでGoogle Maps API設定")
        print("  3. src/で実装開始")
    else:
        print("⚠️  一部のテストが失敗しました。")
        print("上記の結果を確認して問題を解決してください。")
        print("\n🔧 推奨アクション:")
        print("  1. 失敗したテストの詳細確認")
        print("  2. 不足している依存関係のインストール")
        print("  3. 設定ファイルの確認・修正")

    return success_count == total_tests


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
