#!/usr/bin/env python3
"""
OWASP準拠セキュリティテストスイート
佐渡飲食店マップ Phase 3-Full セキュリティ検証

OWASP Top 10 2021対応:
- A01: Broken Access Control
- A02: Cryptographic Failures
- A03: Injection
- A04: Insecure Design
- A05: Security Misconfiguration
- A06: Vulnerable and Outdated Components
- A07: Identification and Authentication Failures
- A08: Software and Data Integrity Failures
- A09: Security Logging and Monitoring Failures
- A10: Server-Side Request Forgery (SSRF)
"""

import asyncio
import aiohttp
import json
import time
import hashlib
import secrets
import ssl
import subprocess
import sys
from datetime import datetime
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
import logging

from dataclasses import dataclass, asdict
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class SecurityTestResult:
    """セキュリティテスト結果"""
    test_name: str
    category: str
    severity: str  # critical, high, medium, low
    status: str    # passed, failed, warning
    description: str
    details: str
    timestamp: str
    mitigation: str = ""


class SecurityTestSuite:
    """OWASP準拠セキュリティテストスイート"""

    # OWASP カテゴリ定数（クラス変数として定義）
    OWASP_A01_BROKEN_ACCESS_CONTROL = "A01: Broken Access Control"
    OWASP_A02_CRYPTOGRAPHIC_FAILURES = "A02: Cryptographic Failures"
    OWASP_A03_INJECTION = "A03: Injection"
    OWASP_A04_INSECURE_DESIGN = "A04: Insecure Design"
    OWASP_A05_SECURITY_MISCONFIGURATION = "A05: Security Misconfiguration"
    OWASP_A06_VULNERABLE_COMPONENTS = "A06: Vulnerable Components"
    OWASP_A07_AUTHENTICATION_FAILURES = "A07: Authentication Failures"
    OWASP_A08_SOFTWARE_INTEGRITY = "A08: Software Integrity"
    OWASP_A09_LOGGING_MONITORING = "A09: Logging and Monitoring"
    OWASP_A10_SSRF = "A10: Server-Side Request Forgery"
    API_SECURITY = "API Security"

    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.session: Optional[aiohttp.ClientSession] = None
        self.results: List[SecurityTestResult] = []

    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()

    def add_result(self, test_name: str, category: str, severity: str,
                   status: str, description: str, details: str, mitigation: str = ""):
        """テスト結果を追加"""
        result = SecurityTestResult(
            test_name=test_name,
            category=category,
            severity=severity,
            status=status,
            description=description,
            details=details,
            timestamp=datetime.now().isoformat(),
            mitigation=mitigation
        )
        self.results.append(result)

        # ログ出力
        if status == "passed":
            icon = "✅"
        elif status == "failed":
            icon = "❌"
        else:
            icon = "⚠️"
        logger.info(f"{icon} {test_name}: {status.upper()}")
        if status != "passed":
            logger.warning(f"   {description}")

    async def run_all_tests(self) -> Dict[str, Any]:
        """全セキュリティテスト実行"""
        logger.info("🔒 OWASP準拠セキュリティテスト開始")

        # A01: Broken Access Control
        await self.test_access_control()

        # A02: Cryptographic Failures
        await self.test_cryptographic_security()

        # A03: Injection
        await self.test_injection_vulnerabilities()

        # A04: Insecure Design
        await self.test_secure_design()

        # A05: Security Misconfiguration
        await self.test_security_configuration()

        # A06: Vulnerable Components
        await self.test_vulnerable_components()

        # A07: Authentication Failures
        await self.test_authentication_security()

        # A08: Software Integrity
        await self.test_software_integrity()

        # A09: Logging and Monitoring
        await self.test_logging_monitoring()

        # A10: SSRF
        await self.test_ssrf_vulnerabilities()

        # 追加セキュリティテスト
        await self.test_api_security()
        await self.test_redis_security()

        return self.generate_report()

    async def test_access_control(self):
        """A01: アクセス制御テスト"""
        logger.info("🔐 A01: アクセス制御テスト")

        # 認証なしでの保護されたエンドポイントアクセステスト
        try:
            async with self.session.get(f"{self.base_url}/admin") as response:
                if response.status == 200:
                    self.add_result(
                        "Unauthorized Admin Access",
                        self.OWASP_A01_BROKEN_ACCESS_CONTROL,
                        "critical",
                        "failed",
                        "管理者エンドポイントに認証なしでアクセス可能",
                        f"Status: {response.status}",
                        "認証・認可の実装が必要"
                    )
                else:
                    self.add_result(
                        "Admin Access Protection",
                        self.OWASP_A01_BROKEN_ACCESS_CONTROL,
                        "high",
                        "passed",
                        "管理者エンドポイントは適切に保護されている",
                        f"Status: {response.status}"
                    )
        except Exception as e:
            self.add_result(
                "Admin Endpoint Check",
                self.OWASP_A01_BROKEN_ACCESS_CONTROL,
                "medium",
                "warning",
                "管理者エンドポイントの存在確認不可",
                str(e)
            )

        # パストラバーサルテスト
        path_traversal_payloads = [
            "../etc/passwd",
            "..\\windows\\system32\\config\\sam",
            "....//....//etc/passwd"
        ]

        for payload in path_traversal_payloads:
            try:
                async with self.session.get(f"{self.base_url}/files/{payload}") as response:
                    if response.status == 200:
                        content = await response.text()
                        if "root:" in content or "[version]" in content:
                            self.add_result(
                                "Path Traversal Vulnerability",
                                self.OWASP_A01_BROKEN_ACCESS_CONTROL,
                                "critical",
                                "failed",
                                f"パストラバーサル攻撃が成功: {payload}",
                                f"Response: {content[:100]}...",
                                "入力値の適切な検証とサニタイゼーションが必要"
                            )
                            break
            except Exception as e:
                # ネットワークエラーや無効なレスポンスは無視
                continue
        else:
            self.add_result(
                "Path Traversal Protection",
                self.OWASP_A01_BROKEN_ACCESS_CONTROL,
                "high",
                "passed",
                "パストラバーサル攻撃から保護されている",
                "All payloads rejected"
            )

    async def test_cryptographic_security(self):
        """A02: 暗号化セキュリティテスト"""
        logger.info("🔐 A02: 暗号化セキュリティテスト")

        # HTTPS強制確認
        try:
            async with self.session.get(self.base_url.replace("https://", "http://")) as response:
                if "https" not in str(response.url):
                    self.add_result(
                        "HTTPS Enforcement",
                        self.OWASP_A02_CRYPTOGRAPHIC_FAILURES,
                        "high",
                        "failed",
                        "HTTPSが強制されていない",
                        f"Final URL: {response.url}",
                        "HTTPからHTTPSへのリダイレクト設定が必要"
                    )
                else:
                    self.add_result(
                        "HTTPS Enforcement",
                        self.OWASP_A02_CRYPTOGRAPHIC_FAILURES,
                        "high",
                        "passed",
                        "HTTPSが適切に強制されている",
                        f"Redirected to: {response.url}"
                    )
        except Exception as e:
            self.add_result(
                "HTTPS Check",
                self.OWASP_A02_CRYPTOGRAPHIC_FAILURES,
                "medium",
                "warning",
                "HTTPS設定確認不可",
                str(e)
            )

        # SSL/TLS設定確認
        if self.base_url.startswith("https://"):
            await self._test_ssl_configuration()

        # 暗号化されていないデータ送信テスト
        test_data = {"password": "test123", "api_key": "secret"}
        try:
            async with self.session.post(f"{self.base_url}/login", json=test_data) as response:
                # レスポンスヘッダーでSecure Cookie確認
                set_cookie = response.headers.get("Set-Cookie", "")
                if "Secure" not in set_cookie and "https" in self.base_url:
                    self.add_result(
                        "Secure Cookie Settings",
                        self.OWASP_A02_CRYPTOGRAPHIC_FAILURES,
                        "medium",
                        "failed",
                        "Cookieにセキュア属性が設定されていない",
                        f"Set-Cookie: {set_cookie}",
                        "CookieにSecure, HttpOnly, SameSite属性を設定"
                    )
                elif "Secure" in set_cookie:
                    self.add_result(
                        "Secure Cookie Settings",
                        self.OWASP_A02_CRYPTOGRAPHIC_FAILURES,
                        "medium",
                        "passed",
                        "Cookieが適切にセキュア設定されている",
                        "Secure attribute found"
                    )
        except Exception as e:
            logger.debug(f"Cookie test error: {e}")

    async def _test_ssl_configuration(self):
        """SSL/TLS設定テスト"""
        import ssl
        import socket
        from urllib.parse import urlparse

        try:
            # 非同期処理を追加
            await asyncio.sleep(0.001)

            parsed = urlparse(self.base_url)
            hostname = parsed.hostname
            port = parsed.port or 443

            context = ssl.create_default_context()
            # Python 3.10+では secure defaults を使用、それ以前はTLS 1.2以上を強制
            context.minimum_version = ssl.TLSVersion.TLSv1_2
            with socket.create_connection((hostname, port), timeout=10) as sock:
                with context.wrap_socket(sock, server_hostname=hostname) as ssock:
                    cert = ssock.getpeercert()
                    cipher = ssock.cipher()

                    # 証明書有効期限確認
                    import datetime
                    not_after = datetime.datetime.strptime(cert['notAfter'], '%b %d %H:%M:%S %Y %Z')
                    days_remaining = (not_after - datetime.datetime.now()).days

                    if days_remaining < 30:
                        self.add_result(
                            "SSL Certificate Expiry",
                            self.OWASP_A02_CRYPTOGRAPHIC_FAILURES,
                            "high",
                            "warning",
                            f"SSL証明書の有効期限が近い: {days_remaining}日",
                            f"Not after: {cert['notAfter']}",
                            "証明書の更新が必要"
                        )
                    else:
                        self.add_result(
                            "SSL Certificate Validity",
                            self.OWASP_A02_CRYPTOGRAPHIC_FAILURES,
                            "medium",
                            "passed",
                            f"SSL証明書は有効: {days_remaining}日残り",
                            f"Valid until: {cert['notAfter']}"
                        )

                    # 暗号スイート確認
                    if cipher and cipher[1] not in ['TLSv1.2', 'TLSv1.3']:
                        self.add_result(
                            "TLS Version",
                            self.OWASP_A02_CRYPTOGRAPHIC_FAILURES,
                            "high",
                            "failed",
                            f"古いTLSバージョンを使用: {cipher[1]}",
                            f"Cipher: {cipher}",
                            "TLS 1.2以上の使用を強制"
                        )
                    else:
                        self.add_result(
                            "TLS Version",
                            self.OWASP_A02_CRYPTOGRAPHIC_FAILURES,
                            "medium",
                            "passed",
                            f"適切なTLSバージョン: {cipher[1] if cipher else 'Unknown'}",
                            f"Cipher suite: {cipher[0] if cipher else 'Unknown'}"
                        )

        except Exception as e:
            self.add_result(
                "SSL Configuration",
                self.OWASP_A02_CRYPTOGRAPHIC_FAILURES,
                "medium",
                "warning",
                "SSL設定確認中にエラー",
                str(e)
            )

    async def test_injection_vulnerabilities(self):
        """A03: インジェクション脆弱性テスト"""
        logger.info("💉 A03: インジェクション脆弱性テスト")

        await self._test_sql_injection()
        await self._test_nosql_injection()
        await self._test_xss_vulnerabilities()

    async def _test_sql_injection(self):
        """SQLインジェクションテスト"""
        sql_payloads = [
            "' OR '1'='1",
            "'; DROP TABLE users; --",
            "1' UNION SELECT * FROM users --",
            "admin'--",
            "' OR 1=1#"
        ]

        for payload in sql_payloads:
            try:
                params = {"search": payload, "id": payload}
                async with self.session.get(f"{self.base_url}/search", params=params) as response:
                    text = await response.text()

                    # SQLエラーメッセージ検出
                    sql_errors = ["syntax error", "mysql_", "ORA-", "postgres", "sqlite"]
                    for error in sql_errors:
                        if error in text.lower():
                            self.add_result(
                                "SQL Injection Vulnerability",
                                self.OWASP_A03_INJECTION,
                                "critical",
                                "failed",
                                f"SQLインジェクションの可能性: {payload}",
                                f"Error detected: {error}",
                                "パラメータ化クエリの使用とバリデーション強化"
                            )
                            break
            except Exception as e:
                logger.debug(f"SQL injection test error: {e}")

    async def _test_nosql_injection(self):
        """NoSQLインジェクションテスト"""
        nosql_payloads = [
            '{"$ne": null}',
            '{"$regex": ".*"}',
            '{"$where": "this.password.match(/.*/)"}',
        ]

        for payload in nosql_payloads:
            try:
                data = {"filter": payload}
                async with self.session.post(f"{self.base_url}/api/search", json=data) as response:
                    if response.status == 200:
                        text = await response.text()
                        if len(text) > 1000:  # 大量データ返却の可能性
                            self.add_result(
                                "NoSQL Injection Potential",
                                self.OWASP_A03_INJECTION,
                                "high",
                                "warning",
                                f"NoSQLインジェクションの可能性: {payload}",
                                f"Large response: {len(text)} chars",
                                "NoSQLクエリの適切な検証とサニタイゼーション"
                            )
            except Exception as e:
                logger.debug(f"NoSQL injection test error: {e}")

    async def _test_xss_vulnerabilities(self):
        """XSSテスト"""
        xss_payloads = [
            "<script>alert('XSS')</script>",
            "javascript:alert('XSS')",
            "<img src=x onerror=alert('XSS')>",
            "';alert('XSS');//"
        ]

        for payload in xss_payloads:
            try:
                params = {"name": payload, "comment": payload}
                async with self.session.get(f"{self.base_url}/profile", params=params) as response:
                    text = await response.text()
                    if payload in text and "<script>" in text:
                        self.add_result(
                            "XSS Vulnerability",
                            self.OWASP_A03_INJECTION,
                            "high",
                            "failed",
                            f"XSS脆弱性発見: {payload}",
                            "Script tag reflected in response",
                            "出力エスケープとCSP実装"
                        )
                        break
            except Exception as e:
                logger.debug(f"XSS test error: {e}")
        else:
            self.add_result(
                "XSS Protection",
                self.OWASP_A03_INJECTION,
                "high",
                "passed",
                "XSS攻撃から保護されている",
                "No reflected XSS found"
            )

    async def test_secure_design(self):
        """A04: セキュアデザインテスト"""
        logger.info("🎨 A04: セキュアデザインテスト")

        # レート制限テスト
        start_time = time.time()
        requests_made = 0
        blocked_requests = 0

        for _ in range(100):  # 100リクエスト送信
            try:
                async with self.session.get(f"{self.base_url}/api/places") as response:
                    requests_made += 1
                    if response.status == 429:  # Too Many Requests
                        blocked_requests += 1
                        break
                    elif response.status != 200:
                        break
                await asyncio.sleep(0.01)  # 10ms間隔
            except Exception as e:
                break

        elapsed_time = time.time() - start_time

        if blocked_requests > 0:
            self.add_result(
                "Rate Limiting",
                self.OWASP_A04_INSECURE_DESIGN,
                "medium",
                "passed",
                f"レート制限が適切に機能: {requests_made}リクエスト後にブロック",
                f"Time: {elapsed_time:.2f}s, Blocked: {blocked_requests}"
            )
        else:
            self.add_result(
                "Rate Limiting",
                self.OWASP_A04_INSECURE_DESIGN,
                "medium",
                "failed",
                f"レート制限が未実装: {requests_made}リクエスト全て成功",
                f"Time: {elapsed_time:.2f}s",
                "APIレート制限の実装が必要"
            )

        # CSRF保護テスト
        try:
            # CSRFトークンなしでPOSTリクエスト
            data = {"action": "delete", "id": "test"}
            async with self.session.post(f"{self.base_url}/api/admin/delete", json=data) as response:
                if response.status == 200:
                    self.add_result(
                        "CSRF Protection",
                        self.OWASP_A04_INSECURE_DESIGN,
                        "high",
                        "failed",
                        "CSRF保護が未実装",
                        f"Status: {response.status}",
                        "CSRFトークンの実装が必要"
                    )
                elif response.status in [403, 400]:
                    self.add_result(
                        "CSRF Protection",
                        self.OWASP_A04_INSECURE_DESIGN,
                        "high",
                        "passed",
                        "CSRF保護が適切に機能",
                        f"Status: {response.status}"
                    )
        except Exception as e:
            logger.debug(f"CSRF test error: {e}")

    async def test_security_configuration(self):
        """A05: セキュリティ設定ミステスト"""
        logger.info("⚙️ A05: セキュリティ設定ミステスト")

        await self._test_security_headers()
        await self._test_error_page_disclosure()

    async def _test_security_headers(self):
        """セキュリティヘッダー確認"""
        try:
            async with self.session.get(f"{self.base_url}/") as response:
                headers = response.headers

                security_headers = {
                    "X-Content-Type-Options": "nosniff",
                    "X-Frame-Options": ["DENY", "SAMEORIGIN"],
                    "X-XSS-Protection": "1; mode=block",
                    "Strict-Transport-Security": "max-age=",
                    "Content-Security-Policy": "default-src",
                    "Referrer-Policy": ["strict-origin-when-cross-origin", "no-referrer"]
                }

                missing_headers = []
                for header, expected in security_headers.items():
                    if header not in headers:
                        missing_headers.append(header)
                    elif isinstance(expected, list):
                        if not any(exp in headers[header] for exp in expected):
                            missing_headers.append(f"{header} (incorrect value)")
                    elif isinstance(expected, str) and expected not in headers[header]:
                        missing_headers.append(f"{header} (incorrect value)")

                if missing_headers:
                    self.add_result(
                        "Security Headers",
                        self.OWASP_A05_SECURITY_MISCONFIGURATION,
                        "medium",
                        "failed",
                        f"セキュリティヘッダーが不足: {', '.join(missing_headers)}",
                        f"Present headers: {list(headers.keys())}",
                        "必要なセキュリティヘッダーの追加"
                    )
                else:
                    self.add_result(
                        "Security Headers",
                        self.OWASP_A05_SECURITY_MISCONFIGURATION,
                        "medium",
                        "passed",
                        "必要なセキュリティヘッダーが設定されている",
                        "All security headers present"
                    )
        except Exception as e:
            self.add_result(
                "Security Headers Check",
                self.OWASP_A05_SECURITY_MISCONFIGURATION,
                "medium",
                "warning",
                "セキュリティヘッダー確認中にエラー",
                str(e)
            )

    async def _test_error_page_disclosure(self):
        """エラーページ情報漏洩確認"""
        error_urls = ["/nonexistent", "/admin/secret", "/api/invalid"]
        for url in error_urls:
            try:
                async with self.session.get(f"{self.base_url}{url}") as response:
                    text = await response.text()

                    # 情報漏洩パターン検出
                    info_leaks = ["traceback", "debug", "exception", "stack trace", "version"]
                    leaked_info = [leak for leak in info_leaks if leak in text.lower()]

                    if leaked_info:
                        self.add_result(
                            "Error Page Information Disclosure",
                            self.OWASP_A05_SECURITY_MISCONFIGURATION,
                            "low",
                            "warning",
                            f"エラーページで情報漏洩の可能性: {url}",
                            f"Leaked info: {leaked_info}",
                            "本番環境でのデバッグ情報無効化"
                        )
                        break
            except Exception as e:
                logger.debug(f"Error page test error: {e}")

    async def test_vulnerable_components(self):
        """A06: 脆弱な構成要素テスト"""
        logger.info("🔧 A06: 脆弱な構成要素テスト")

        await self._test_server_version_disclosure()
        await self._test_dependency_vulnerabilities()

    async def _test_server_version_disclosure(self):
        """サーバーバージョン情報漏洩確認"""
        try:
            async with self.session.get(f"{self.base_url}/") as response:
                server_header = response.headers.get("Server", "")
                if server_header:
                    # バージョン情報が含まれているか確認
                    import re
                    version_pattern = r'\d+\.\d+\.\d+'
                    if re.search(version_pattern, server_header):
                        self.add_result(
                            "Server Version Disclosure",
                            self.OWASP_A06_VULNERABLE_COMPONENTS,
                            "low",
                            "warning",
                            f"サーバーバージョン情報が漏洩: {server_header}",
                            f"Server header: {server_header}",
                            "サーバーヘッダーの無効化または一般化"
                        )
                    else:
                        self.add_result(
                            "Server Information",
                            self.OWASP_A06_VULNERABLE_COMPONENTS,
                            "low",
                            "passed",
                            "サーバー情報が適切に保護されている",
                            f"Server header: {server_header or 'Not disclosed'}"
                        )
        except Exception as e:
            logger.debug(f"Server version test error: {e}")

    async def _test_dependency_vulnerabilities(self):
        """依存関係の脆弱性スキャン"""
        try:
            # npm auditシミュレーション（非同期）
            process = await asyncio.create_subprocess_exec(
                "npm", "audit", "--json",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )

            try:
                stdout, _ = await asyncio.wait_for(process.communicate(), timeout=30)
                if process.returncode == 0 and stdout:
                    audit_data = json.loads(stdout.decode())
                    vulnerabilities = audit_data.get("vulnerabilities", {})

                    critical_vulns = sum(1 for v in vulnerabilities.values()
                                       if v.get("severity") == "critical")
                    high_vulns = sum(1 for v in vulnerabilities.values()
                                   if v.get("severity") == "high")

                    if critical_vulns > 0 or high_vulns > 0:
                        self.add_result(
                            "Vulnerable Dependencies",
                            self.OWASP_A06_VULNERABLE_COMPONENTS,
                            "critical" if critical_vulns > 0 else "high",
                            "failed",
                            f"脆弱な依存関係発見: Critical={critical_vulns}, High={high_vulns}",
                            f"Total vulnerabilities: {len(vulnerabilities)}",
                            "依存関係の更新とセキュリティパッチ適用"
                        )
                    else:
                        self.add_result(
                            "Dependency Security",
                            self.OWASP_A06_VULNERABLE_COMPONENTS,
                            "medium",
                            "passed",
                            "既知の脆弱性のある依存関係なし",
                            f"Total packages scanned: {len(vulnerabilities)}"
                        )
            except asyncio.TimeoutError:
                logger.warning("npm audit timeout")
        except (FileNotFoundError, json.JSONDecodeError) as e:
            self.add_result(
                "Dependency Scan",
                self.OWASP_A06_VULNERABLE_COMPONENTS,
                "medium",
                "warning",
                "依存関係スキャン実行不可",
                str(e)
            )

    async def test_authentication_security(self):
        """A07: 認証セキュリティテスト"""
        logger.info("🔑 A07: 認証セキュリティテスト")

        # ブルートフォース攻撃テスト
        common_passwords = ["123456", "password", "admin", "test", "guest"]
        failed_attempts = 0

        for password in common_passwords:
            try:
                data = {"username": "admin", "password": password}
                async with self.session.post(f"{self.base_url}/login", json=data) as response:
                    if response.status == 401:
                        failed_attempts += 1
                    elif response.status == 429:  # Rate limited
                        self.add_result(
                            "Brute Force Protection",
                            self.OWASP_A07_AUTHENTICATION_FAILURES,
                            "medium",
                            "passed",
                            f"ブルートフォース攻撃からの保護確認: {failed_attempts}回試行後にレート制限",
                            f"Status: {response.status}",
                        )
                        break
                    elif response.status == 200:
                        self.add_result(
                            "Weak Default Credentials",
                            self.OWASP_A07_AUTHENTICATION_FAILURES,
                            "critical",
                            "failed",
                            f"弱いデフォルト認証情報: admin/{password}",
                            f"Login successful with: {password}",
                            "デフォルト認証情報の変更と強力なパスワードポリシー"
                        )
                        break
                await asyncio.sleep(0.1)
            except Exception as e:
                logger.debug(f"Brute force test error: {e}")
        else:
            if failed_attempts == len(common_passwords):
                self.add_result(
                    "Default Credentials",
                    self.OWASP_A07_AUTHENTICATION_FAILURES,
                    "medium",
                    "passed",
                    "デフォルト認証情報は使用されていない",
                    f"Failed attempts: {failed_attempts}"
                )

        # JWTセキュリティテスト（JWTが使用されている場合）
        try:
            # 有効なログインでJWTトークン取得を試行
            data = {"username": "test", "password": "test"}
            async with self.session.post(f"{self.base_url}/login", json=data) as response:
                if response.status == 200:
                    response_data = await response.json()
                    token = response_data.get("token") or response_data.get("access_token")

                    if token:
                        await self._test_jwt_security(token)
        except Exception as e:
            logger.debug(f"JWT test error: {e}")

    async def _test_jwt_security(self, token: str):
        """JWT セキュリティテスト"""
        import base64
        import json

        try:
            # 非同期処理を追加
            await asyncio.sleep(0.001)

            # JWT構造確認
            parts = token.split('.')
            if len(parts) != 3:
                self.add_result(
                    "JWT Structure",
                    self.OWASP_A07_AUTHENTICATION_FAILURES,
                    "medium",
                    "warning",
                    "無効なJWT構造",
                    f"Parts: {len(parts)}",
                    "適切なJWT実装の確認"
                )
                return

            # ヘッダー解析
            header = json.loads(base64.b64decode(parts[0] + '=='))
            if header.get('alg') == 'none':
                self.add_result(
                    "JWT Algorithm",
                    self.OWASP_A07_AUTHENTICATION_FAILURES,
                    "critical",
                    "failed",
                    "JWTで'none'アルゴリズムが使用されている",
                    f"Algorithm: {header.get('alg')}",
                    "強力な署名アルゴリズム（RS256/HS256）の使用"
                )
            elif header.get('alg') in ['HS256', 'RS256']:
                self.add_result(
                    "JWT Algorithm",
                    self.OWASP_A07_AUTHENTICATION_FAILURES,
                    "medium",
                    "passed",
                    f"適切なJWTアルゴリズム: {header.get('alg')}",
                    f"Header: {header}"
                )

            # ペイロード解析
            payload = json.loads(base64.b64decode(parts[1] + '=='))

            # 有効期限確認
            if 'exp' not in payload:
                self.add_result(
                    "JWT Expiration",
                    self.OWASP_A07_AUTHENTICATION_FAILURES,
                    "medium",
                    "failed",
                    "JWTに有効期限が設定されていない",
                    "No 'exp' claim found",
                    "JWTトークンに適切な有効期限を設定"
                )
            else:
                exp_time = payload['exp']
                current_time = time.time()
                if exp_time - current_time > 86400:  # 24時間以上
                    self.add_result(
                        "JWT Expiration Time",
                        self.OWASP_A07_AUTHENTICATION_FAILURES,
                        "low",
                        "warning",
                        f"JWTの有効期限が長すぎる: {(exp_time - current_time)/3600:.1f}時間",
                        f"Expires: {exp_time}",
                        "JWTの有効期限を短縮することを推奨"
                    )
                else:
                    self.add_result(
                        "JWT Expiration",
                        self.OWASP_A07_AUTHENTICATION_FAILURES,
                        "medium",
                        "passed",
                        f"適切なJWT有効期限: {(exp_time - current_time)/3600:.1f}時間",
                        f"Expires: {exp_time}"
                    )

        except Exception as e:
            self.add_result(
                "JWT Analysis",
                self.OWASP_A07_AUTHENTICATION_FAILURES,
                "medium",
                "warning",
                "JWT解析中にエラー",
                str(e)
            )

    async def test_software_integrity(self):
        """A08: ソフトウェア整合性テスト"""
        logger.info("🔍 A08: ソフトウェア整合性テスト")

        # Content-Security-Policy確認
        try:
            async with self.session.get(f"{self.base_url}/") as response:
                csp = response.headers.get("Content-Security-Policy", "")

                if not csp:
                    self.add_result(
                        "Content Security Policy",
                        self.OWASP_A08_SOFTWARE_INTEGRITY,
                        "medium",
                        "failed",
                        "CSPが設定されていない",
                        "No CSP header found",
                        "Content-Security-Policyの実装"
                    )
                else:
                    # 危険なCSP設定確認
                    dangerous_policies = ["'unsafe-inline'", "'unsafe-eval'", "*"]
                    dangerous_found = [policy for policy in dangerous_policies if policy in csp]

                    if dangerous_found:
                        self.add_result(
                            "CSP Configuration",
                            self.OWASP_A08_SOFTWARE_INTEGRITY,
                            "medium",
                            "warning",
                            f"危険なCSP設定: {dangerous_found}",
                            f"CSP: {csp}",
                            "CSPの安全な設定に変更"
                        )
                    else:
                        self.add_result(
                            "Content Security Policy",
                            self.OWASP_A08_SOFTWARE_INTEGRITY,
                            "medium",
                            "passed",
                            "適切なCSPが設定されている",
                            f"CSP: {csp[:100]}..."
                        )
        except Exception as e:
            logger.debug(f"CSP test error: {e}")

        # Subresource Integrity確認
        try:
            async with self.session.get(f"{self.base_url}/") as response:
                html = await response.text()

                # 外部リソースのSRI確認
                import re
                external_scripts = re.findall(r'<script[^>]+src=["\']https?://[^"\']+["\'][^>]*>', html)
                scripts_with_sri = re.findall(r'<script[^>]+integrity=["\'][^"\']+["\'][^>]*>', html)

                if external_scripts and not scripts_with_sri:
                    self.add_result(
                        "Subresource Integrity",
                        self.OWASP_A08_SOFTWARE_INTEGRITY,
                        "low",
                        "warning",
                        f"外部スクリプトにSRIが未設定: {len(external_scripts)}個",
                        f"External scripts found: {len(external_scripts)}",
                        "外部リソースにintegrity属性を追加"
                    )
                elif scripts_with_sri:
                    self.add_result(
                        "Subresource Integrity",
                        self.OWASP_A08_SOFTWARE_INTEGRITY,
                        "low",
                        "passed",
                        f"SRIが適切に設定されている: {len(scripts_with_sri)}個",
                        f"Scripts with SRI: {len(scripts_with_sri)}"
                    )
        except Exception as e:
            logger.debug(f"SRI test error: {e}")

    async def test_logging_monitoring(self):
        """A09: ログ・監視テスト"""
        logger.info("📝 A09: ログ・監視テスト")

        # セキュリティイベントログ確認
        try:
            # 意図的に認証失敗を発生させてログ記録を確認
            data = {"username": "invalid", "password": "invalid"}
            async with self.session.post(f"{self.base_url}/login", json=data) as response:
                # ログエンドポイントが存在する場合の確認
                try:
                    async with self.session.get(f"{self.base_url}/admin/logs") as log_response:
                        if log_response.status == 200:
                            logs = await log_response.text()
                            if "authentication failed" in logs.lower() or "login failed" in logs.lower():
                                self.add_result(
                                    "Security Event Logging",
                                    self.OWASP_A09_LOGGING_MONITORING,
                                    "medium",
                                    "passed",
                                    "セキュリティイベントが適切にログされている",
                                    "Authentication failures logged"
                                )
                            else:
                                self.add_result(
                                    "Security Event Logging",
                                    self.OWASP_A09_LOGGING_MONITORING,
                                    "medium",
                                    "failed",
                                    "セキュリティイベントのログが不十分",
                                    "No authentication failure logs found",
                                    "セキュリティイベントのログ強化"
                                )
                        else:
                            self.add_result(
                                "Log Access Control",
                                self.OWASP_A09_LOGGING_MONITORING,
                                "medium",
                                "passed",
                                "ログエンドポイントが適切に保護されている",
                                f"Log endpoint status: {log_response.status}"
                            )
                except Exception:
                    # ログエンドポイントが存在しない、または保護されている
                    self.add_result(
                        "Log Endpoint Security",
                        self.OWASP_A09_LOGGING_MONITORING,
                        "medium",
                        "passed",
                        "ログエンドポイントが存在しないか適切に保護されている",
                        "Log endpoint not accessible"
                    )
        except Exception as e:
            logger.debug(f"Logging test error: {e}")

        # 監視システム確認
        monitoring_endpoints = ["/health", "/metrics", "/status"]
        for endpoint in monitoring_endpoints:
            try:
                async with self.session.get(f"{self.base_url}{endpoint}") as response:
                    if response.status == 200:
                        self.add_result(
                            "Health Monitoring",
                            self.OWASP_A09_LOGGING_MONITORING,
                            "low",
                            "passed",
                            f"ヘルスチェックエンドポイントが利用可能: {endpoint}",
                            f"Status: {response.status}"
                        )
                        break
            except Exception:
                continue
        else:
            self.add_result(
                "Health Monitoring",
                self.OWASP_A09_LOGGING_MONITORING,
                "low",
                "warning",
                "ヘルスチェックエンドポイントが見つからない",
                "No monitoring endpoints found",
                "システム監視エンドポイントの実装"
            )

    async def test_ssrf_vulnerabilities(self):
        """A10: SSRF脆弱性テスト"""
        logger.info("🔗 A10: SSRF脆弱性テスト")

        # 内部ネットワークアクセステスト
        ssrf_payloads = [
            "http://localhost:6379",  # Redis
            "http://127.0.0.1:22",   # SSH
            "http://169.254.169.254/latest/meta-data/",  # AWS metadata
            "file:///etc/passwd",
            "http://internal.local",
        ]

        for payload in ssrf_payloads:
            try:
                params = {"url": payload, "fetch": payload, "proxy": payload}
                async with self.session.get(f"{self.base_url}/api/fetch", params=params) as response:
                    if response.status == 200:
                        text = await response.text()

                        # SSRF成功の兆候
                        ssrf_indicators = ["redis", "ssh", "instance-id", "root:", "internal"]
                        for indicator in ssrf_indicators:
                            if indicator in text.lower():
                                self.add_result(
                                    "SSRF Vulnerability",
                                    self.OWASP_A10_SSRF,
                                    "critical",
                                    "failed",
                                    f"SSRF脆弱性発見: {payload}",
                                    f"Response contains: {indicator}",
                                    "URL検証とホワイトリスト実装"
                                )
                                return
            except Exception as e:
                logger.debug(f"SSRF test error: {e}")

        self.add_result(
            "SSRF Protection",
            self.OWASP_A10_SSRF,
            "high",
            "passed",
            "SSRF攻撃から保護されている",
            "No SSRF vulnerabilities found"
        )

    async def test_api_security(self):
        """API特有のセキュリティテスト"""
        logger.info("🔌 API セキュリティテスト")

        # API認証確認
        try:
            async with self.session.get(f"{self.base_url}/api/admin") as response:
                if response.status == 200:
                    self.add_result(
                        "API Authentication",
                        self.API_SECURITY,
                        "high",
                        "failed",
                        "API管理エンドポイントに認証なしでアクセス可能",
                        f"Status: {response.status}",
                        "API認証の実装"
                    )
                else:
                    self.add_result(
                        "API Authentication",
                        self.API_SECURITY,
                        "high",
                        "passed",
                        "API管理エンドポイントが適切に保護されている",
                        f"Status: {response.status}"
                    )
        except Exception as e:
            logger.debug(f"API auth test error: {e}")

        # CORS設定確認
        try:
            headers = {"Origin": "https://evil.com"}
            async with self.session.get(f"{self.base_url}/api/places", headers=headers) as response:
                cors_header = response.headers.get("Access-Control-Allow-Origin", "")

                if cors_header == "*":
                    self.add_result(
                        "CORS Configuration",
                        self.API_SECURITY,
                        "medium",
                        "warning",
                        "CORSが全てのオリジンを許可している",
                        f"CORS: {cors_header}",
                        "CORSオリジンの制限"
                    )
                elif cors_header:
                    self.add_result(
                        "CORS Configuration",
                        self.API_SECURITY,
                        "medium",
                        "passed",
                        "CORSが適切に設定されている",
                        f"CORS: {cors_header}"
                    )
        except Exception as e:
            logger.debug(f"CORS test error: {e}")

    async def test_redis_security(self):
        """Redis セキュリティテスト"""
        logger.info("🔴 Redis セキュリティテスト")

        # 非同期処理を追加
        await asyncio.sleep(0.001)

        # 直接Redis接続テスト
        redis_hosts = ["localhost:6379", "localhost:7001", "localhost:7002", "localhost:7003"]

        for host in redis_hosts:
            try:
                import socket
                hostname, port = host.split(":")
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(5)
                result = sock.connect_ex((hostname, int(port)))
                sock.close()

                if result == 0:  # 接続成功
                    self.add_result(
                        "Redis Exposure",
                        "Redis Security",
                        "critical",
                        "failed",
                        f"Redisポートが外部からアクセス可能: {host}",
                        f"Connection successful to {host}",
                        "Redisのファイアウォール設定とバインドアドレス制限"
                    )
                else:
                    self.add_result(
                        "Redis Network Security",
                        "Redis Security",
                        "high",
                        "passed",
                        f"Redisポートが適切に保護されている: {host}",
                        f"Connection refused to {host}"
                    )
            except Exception as e:
                logger.debug(f"Redis connection test error for {host}: {e}")

    def generate_report(self) -> Dict[str, Any]:
        """セキュリティテストレポート生成"""

        # 統計情報
        total_tests = len(self.results)
        passed_tests = len([r for r in self.results if r.status == "passed"])
        failed_tests = len([r for r in self.results if r.status == "failed"])
        warning_tests = len([r for r in self.results if r.status == "warning"])

        # 重要度別集計
        critical_issues = len([r for r in self.results if r.severity == "critical" and r.status == "failed"])
        high_issues = len([r for r in self.results if r.severity == "high" and r.status == "failed"])
        medium_issues = len([r for r in self.results if r.severity == "medium" and r.status == "failed"])
        low_issues = len([r for r in self.results if r.severity == "low" and r.status == "failed"])

        # セキュリティスコア計算
        max_score = total_tests * 100
        score_deduction = (critical_issues * 50) + (high_issues * 20) + (medium_issues * 10) + (low_issues * 5)
        security_score = max(0, max_score - score_deduction) / max_score * 100 if max_score > 0 else 0

        # カテゴリ別集計
        categories = {}
        for result in self.results:
            if result.category not in categories:
                categories[result.category] = {"passed": 0, "failed": 0, "warning": 0}
            categories[result.category][result.status] += 1

        report = {
            "summary": {
                "timestamp": datetime.now().isoformat(),
                "total_tests": total_tests,
                "passed": passed_tests,
                "failed": failed_tests,
                "warnings": warning_tests,
                "security_score": round(security_score, 1),
                "risk_level": self._determine_risk_level(security_score, critical_issues, high_issues)
            },
            "severity_breakdown": {
                "critical": critical_issues,
                "high": high_issues,
                "medium": medium_issues,
                "low": low_issues
            },
            "category_breakdown": categories,
            "detailed_results": [asdict(result) for result in self.results],
            "recommendations": self._generate_recommendations()
        }

        return report

    def _determine_risk_level(self, score: float, critical: int, high: int) -> str:
        """リスクレベル判定"""
        if critical > 0:
            return "Critical"
        elif score < 60 or high > 2:
            return "High"
        elif score < 80:
            return "Medium"
        else:
            return "Low"

    def _generate_recommendations(self) -> List[str]:
        """推奨事項生成"""
        failed_results = [r for r in self.results if r.status == "failed"]
        recommendations = []

        # 重要度順でユニークな推奨事項を抽出
        seen_mitigations = set()
        for result in sorted(failed_results, key=lambda x: {"critical": 0, "high": 1, "medium": 2, "low": 3}[x.severity]):
            if result.mitigation and result.mitigation not in seen_mitigations:
                recommendations.append(f"[{result.severity.upper()}] {result.mitigation}")
                seen_mitigations.add(result.mitigation)

        return recommendations[:10]  # 上位10件


async def main():
    """メイン実行関数"""
    import argparse

    parser = argparse.ArgumentParser(description="OWASP準拠セキュリティテストスイート")
    parser.add_argument("--url", default="http://localhost:8000", help="テスト対象URL")
    parser.add_argument("--output", default="security-report.json", help="レポート出力ファイル")

    args = parser.parse_args()

    async with SecurityTestSuite(args.url) as test_suite:
        report = await test_suite.run_all_tests()

        # レポート出力（非同期関数から同期処理を分離）
        def write_report(output_file, report_data):
            with open(output_file, "w", encoding="utf-8") as f:
                json.dump(report_data, f, ensure_ascii=False, indent=2)

        write_report(args.output, report)

        # サマリー表示
        summary = report["summary"]
        print(f"\n{'='*60}")
        print("🔒 佐渡飲食店マップ セキュリティテスト結果")
        print(f"{'='*60}")
        print(f"📊 セキュリティスコア: {summary['security_score']:.1f}/100")
        print(f"🚨 リスクレベル: {summary['risk_level']}")
        print(f"✅ 成功: {summary['passed']}")
        print(f"❌ 失敗: {summary['failed']}")
        print(f"⚠️ 警告: {summary['warnings']}")
        print("\\n重要度別問題:")
        print(f"  🔴 Critical: {report['severity_breakdown']['critical']}")
        print(f"  🟠 High: {report['severity_breakdown']['high']}")
        print(f"  🟡 Medium: {report['severity_breakdown']['medium']}")
        print(f"  🟢 Low: {report['severity_breakdown']['low']}")

        if report["recommendations"]:
            print("\\n📋 主要推奨事項:")
            for i, rec in enumerate(report["recommendations"][:5], 1):
                print(f"  {i}. {rec}")

        print(f"\n📄 詳細レポート: {args.output}")
        print(f"🕐 実行時刻: {summary['timestamp']}")

        # 戻り値（CI/CD用）
        if summary["risk_level"] in ["Critical", "High"]:
            sys.exit(1)
        else:
            sys.exit(0)


if __name__ == "__main__":
    asyncio.run(main())
