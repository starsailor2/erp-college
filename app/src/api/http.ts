// Wraps a value in a Promise with artificial latency, so demo-data reads
// and writes are shaped like a real network call (and are a drop-in swap
// point for an actual backend later) without needing a live server.
export function simulateRequest<T>(data: T, delayMs = 250): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), delayMs);
  });
}
