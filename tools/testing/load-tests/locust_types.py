"""Type stubs for Locust framework.

This module provides type stubs for development environments where Locust is not installed.
In integration test environments, the actual Locust package is used.
"""

from typing import Any, Callable, Optional, Union
import time


class HttpUser:
    """Locust HttpUserのスタブ定義"""
    wait_time: Optional[Callable[[], float]] = None
    weight: int = 1
    host: Optional[str] = None

    def __init__(self) -> None:
        self.client: Any = None

    def on_start(self) -> None:
        """ユーザー開始時の処理"""
        pass

    def on_stop(self) -> None:
        """ユーザー終了時の処理"""
        pass

def task(weight: int = 1) -> Callable[[Callable], Callable]:
    """Locust task デコレータのスタブ"""
    def decorator(func: Callable) -> Callable:
        func._task_weight = weight
        return func
    return decorator

def between(min_wait: float, max_wait: float) -> Callable[[], float]:
    """Locust between 関数のスタブ"""
    def wait_func() -> float:
        import random
        return random.uniform(min_wait, max_wait)
    return wait_func

class Events:
    """Locust events のスタブ定義"""
    class TestStart:
        def add_listener(self, func: Callable) -> Callable:
            return func

    class TestStop:
        def add_listener(self, func: Callable) -> Callable:
            return func

    test_start = TestStart()
    test_stop = TestStop()

events = Events()


if __name__ == "__main__":
    """デバッグ用エントリーポイント"""
    print("Locust型定義スタブが読み込まれました")
