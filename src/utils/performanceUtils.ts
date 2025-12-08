/**
 * パフォーマンス最適化ユーティリティ
 * Phase 9: Long Tasks分割、メインスレッド負荷軽減
 */

/**
 * scheduler.yield() または setTimeout() でメインスレッドに制御を返す
 *
 * @returns Promise that resolves after yielding to main thread
 *
 * @example
 * ```typescript
 * for (let i = 0; i < largeArray.length; i++) {
 *   processItem(largeArray[i]);
 *   if (i % 50 === 0) {
 *     await yieldToMain();
 *   }
 * }
 * ```
 */
// Scheduler API型定義（将来的にはlib.dom.d.tsに追加される予定）
interface SchedulerYield {
  yield: () => Promise<void>;
}

export async function yieldToMain(): Promise<void> {
  // Scheduler API (Chrome 94+) を優先的に使用
  if (
    "scheduler" in window &&
    window.scheduler &&
    "yield" in (window.scheduler as unknown as SchedulerYield)
  ) {
    return (window.scheduler as unknown as SchedulerYield).yield();
  }
  // フォールバック: setTimeout(0)
  return new Promise(resolve => setTimeout(resolve, 0));
}

/**
 * 大量データを chunk に分けて処理し、メインスレッドをブロックしない
 *
 * 各チャンク処理後に yieldToMain() を呼び出し、ブラウザの描画やユーザー操作に
 * 応答する機会を提供します。
 *
 * @template T - アイテムの型
 * @param items - 処理対象のアイテム配列
 * @param chunkSize - 1チャンクあたりのアイテム数（推奨: 50-100）
 * @param processor - 各アイテムを処理する関数
 * @returns すべてのアイテムの処理が完了した後に resolve される Promise
 *
 * @example
 * ```typescript
 * const results: ProcessedItem[] = [];
 *
 * await processInChunks(
 *   largeArray,
 *   50,
 *   async (item, index) => {
 *     const processed = await processItem(item);
 *     results.push(processed);
 *   }
 * );
 * ```
 */
export async function processInChunks<T>(
  items: T[],
  chunkSize: number,
  processor: (item: T, index: number) => void | Promise<void>
): Promise<void> {
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);

    // チャンク内のアイテムを並列処理
    await Promise.all(
      chunk.map((item, chunkIndex) => processor(item, i + chunkIndex))
    );

    // メインスレッドに制御を返す
    await yieldToMain();
  }
}

/**
 * requestIdleCallback を使った遅延処理
 *
 * ブラウザがアイドル状態になるまで待機してからコールバックを実行します。
 * 非クリティカルな処理（統計計算、ログ出力など）に適しています。
 *
 * @template T - コールバックの戻り値の型
 * @param callback - アイドル時に実行するコールバック
 * @param options - オプション（timeout: 最大待機時間[ms]）
 * @returns コールバックの戻り値を resolve する Promise
 *
 * @example
 * ```typescript
 * // 統計情報の計算（非クリティカル）
 * const stats = await processWhenIdle(() => {
 *   return calculateStatistics(data);
 * }, { timeout: 2000 });
 * ```
 */
export function processWhenIdle<T>(
  callback: () => T,
  options: { timeout?: number } = {}
): Promise<T> {
  return new Promise(resolve => {
    if (
      "requestIdleCallback" in window &&
      typeof window.requestIdleCallback === "function"
    ) {
      window.requestIdleCallback(() => resolve(callback()), {
        timeout: options.timeout ?? 2000,
      });
    } else {
      // フォールバック: setTimeout(0)
      setTimeout(() => resolve(callback()), 0);
    }
  });
}

/**
 * 同期版のチャンク処理（useMemo内で使用可能）
 *
 * yieldToMain() を呼び出さない同期版です。useMemo や useCallback 内で使用できますが、
 * 1チャンクの処理時間が長い場合はメインスレッドをブロックする可能性があります。
 *
 * **推奨**: chunkSize を調整して1チャンクの処理時間を <50ms に保つこと
 *
 * @template T - 入力アイテムの型
 * @template R - 出力アイテムの型
 * @param items - 処理対象のアイテム配列
 * @param chunkSize - 1チャンクあたりのアイテム数（推奨: 50-100）
 * @param processor - 各アイテムを処理する関数
 * @returns 処理結果の配列
 *
 * @example
 * ```typescript
 * const filteredItems = useMemo(() => {
 *   if (!data) return [];
 *
 *   return processInChunksSync(
 *     data,
 *     50,
 *     item => isItemValid(item) ? item : null
 *   ).filter((item): item is Item => item !== null);
 * }, [data]);
 * ```
 */
export function processInChunksSync<T, R>(
  items: T[],
  chunkSize: number,
  processor: (item: T, index: number) => R
): R[] {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    results.push(
      ...chunk.map((item, chunkIndex) => processor(item, i + chunkIndex))
    );
  }

  return results;
}
