/**
 * Run `fn` over `items` with at most `concurrency` promises in flight at once,
 * in sequential batches, returning results in input order.
 *
 * Used to parallelize per-recipient broadcast sending: a fully serial loop
 * timed out past ~40-50 recipients, while unbounded Promise.all would hammer
 * the notification providers and Postgres. Bounded batching gets ~concurrency×
 * the throughput with a predictable load ceiling.
 */
export async function runBatched<T, R>(
  items: readonly T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const size = Math.max(1, Math.floor(concurrency));
  const results: R[] = [];
  for (let i = 0; i < items.length; i += size) {
    const batch = items.slice(i, i + size);
    const batchResults = await Promise.all(batch.map((item, j) => fn(item, i + j)));
    results.push(...batchResults);
  }
  return results;
}
