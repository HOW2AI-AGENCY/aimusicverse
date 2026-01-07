/**
 * Performance Benchmark Utilities for Unified Studio
 * Measures FPS, render counts, memory usage, and load times
 */

import { performance } from 'perf_hooks';

export interface BenchmarkResult {
  name: string;
  duration: number;
  samples: number[];
  mean: number;
  median: number;
  min: number;
  max: number;
  stdDev: number;
  passed: boolean;
  threshold: number;
}

export interface MemoryMeasurement {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  timestamp: number;
}

export interface FPSSample {
  fps: number;
  timestamp: number;
}

/**
 * Run a benchmark function multiple times and return statistics
 *
 * @param name - Benchmark name
 * @param fn - Function to benchmark
 * @param options - Benchmark options
 * @returns Benchmark result with statistics
 */
export async function runBenchmark<T>(
  name: string,
  fn: () => T | Promise<T>,
  options: {
    iterations?: number;
    warmupIterations?: number;
    threshold?: number; // Maximum acceptable duration (ms)
  } = {}
): Promise<BenchmarkResult> {
  const {
    iterations = 10,
    warmupIterations = 3,
    threshold = 1000,
  } = options;

  // Warmup runs to allow JIT compilation
  for (let i = 0; i < warmupIterations; i++) {
    await fn();
  }

  const samples: number[] = [];

  // Actual benchmark runs
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await fn();
    const end = performance.now();
    samples.push(end - start);

    // Small delay between iterations to prevent thermal throttling
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  const stats = calculateStatistics(samples);

  return {
    name,
    duration: stats.mean,
    samples,
    ...stats,
    passed: stats.mean <= threshold,
    threshold,
  };
}

/**
 * Calculate statistics from samples
 */
function calculateStatistics(samples: number[]) {
  const sorted = [...samples].sort((a, b) => a - b);
  const sum = samples.reduce((a, b) => a + b, 0);
  const mean = sum / samples.length;
  const median = sorted[Math.floor(samples.length / 2)];
  const min = sorted[0];
  const max = sorted[sorted.length - 1];

  // Standard deviation
  const variance = samples.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / samples.length;
  const stdDev = Math.sqrt(variance);

  return { mean, median, min, max, stdDev };
}

/**
 * Measure FPS during a scroll operation
 *
 * @param scrollElement - Element to scroll
 * @param scrollDuration - Duration of scroll (ms)
 * @returns FPS samples during scroll
 */
export function measureScrollFPS(
  scrollElement: HTMLElement,
  scrollDuration: number = 2000
): FPSSample[] {
  const samples: FPSSample[] = [];
  let frameCount = 0;
  let lastTimestamp = performance.now();
  const startTime = lastTimestamp;

  // Track frames using requestAnimationFrame
  const measureFrame = () => {
    const now = performance.now();
    frameCount++;

    // Calculate FPS every 100ms
    if (now - lastTimestamp >= 100) {
      const fps = Math.round((frameCount * 1000) / (now - lastTimestamp));
      samples.push({ fps, timestamp: now - startTime });
      frameCount = 0;
      lastTimestamp = now;
    }

    if (now - startTime < scrollDuration) {
      requestAnimationFrame(measureFrame);
    }
  };

  requestAnimationFrame(measureFrame);

  // Simulate scroll
  let scrollPosition = 0;
  const scrollStep = 10;
  const scrollInterval = setInterval(() => {
    scrollPosition += scrollStep;
    scrollElement.scrollTop = scrollPosition;

    if (performance.now() - startTime >= scrollDuration) {
      clearInterval(scrollInterval);
    }
  }, 16);

  return samples;
}

/**
 * Get average FPS from samples
 */
export function getAverageFPS(samples: FPSSample[]): number {
  if (samples.length === 0) return 0;
  const sum = samples.reduce((acc, s) => acc + s.fps, 0);
  return Math.round(sum / samples.length);
}

/**
 * Measure memory usage (Chrome/Edge only)
 */
export function measureMemory(): MemoryMeasurement | null {
  if (!(performance as any).memory) {
    return null;
  }

  const memory = (performance as any).memory;
  return {
    usedJSHeapSize: memory.usedJSHeapSize,
    totalJSHeapSize: memory.totalJSHeapSize,
    jsHeapSizeLimit: memory.jsHeapSizeLimit,
    timestamp: performance.now(),
  };
}

/**
 * Calculate memory usage in MB
 */
export function formatMemorySize(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(2)} MB`;
}

/**
 * Track memory changes over time
 */
export class MemoryTracker {
  private measurements: MemoryMeasurement[] = [];
  private intervalId: number | null = null;

  /**
   * Start tracking memory usage
   *
   * @param interval - Measurement interval (ms)
   */
  start(interval: number = 1000) {
    this.measurements = [];
    this.intervalId = window.setInterval(() => {
      const measurement = measureMemory();
      if (measurement) {
        this.measurements.push(measurement);
      }
    }, interval);
  }

  /**
   * Stop tracking and return measurements
   */
  stop(): MemoryMeasurement[] {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    return this.measurements;
  }

  /**
   * Get memory growth (last - first)
   */
  getMemoryGrowth(): number {
    if (this.measurements.length < 2) return 0;
    const first = this.measurements[0].usedJSHeapSize;
    const last = this.measurements[this.measurements.length - 1].usedJSHeapSize;
    return last - first;
  }

  /**
   * Get peak memory usage
   */
  getPeakMemory(): number {
    if (this.measurements.length === 0) return 0;
    return Math.max(...this.measurements.map(m => m.usedJSHeapSize));
  }

  /**
   * Check if memory leaked (growth exceeds threshold)
   */
  hasMemoryLeak(thresholdMB: number = 10): boolean {
    const growthBytes = this.getMemoryGrowth();
    const growthMB = growthBytes / (1024 * 1024);
    return growthMB > thresholdMB;
  }
}

/**
 * Count React component re-renders
 */
export class RenderCounter {
  private renderCounts = new Map<string, number>();

  /**
   * Increment render count for a component
   */
  trackRender(componentName: string): void {
    const current = this.renderCounts.get(componentName) || 0;
    this.renderCounts.set(componentName, current + 1);
  }

  /**
   * Get render count for a component
   */
  getRenderCount(componentName: string): number {
    return this.renderCounts.get(componentName) || 0;
  }

  /**
   * Get all render counts
   */
  getAllRenderCounts(): Record<string, number> {
    return Object.fromEntries(this.renderCounts);
  }

  /**
   * Reset all counters
   */
  reset(): void {
    this.renderCounts.clear();
  }
}

/**
 * Create a React component that counts its own renders
 *
 * @param componentName - Name for tracking
 * @param renderCounter - Render counter instance
 * @returns HOC that wraps component
 */
export function withRenderCount<P extends object>(
  componentName: string,
  renderCounter: RenderCounter
) {
  return function WrappedComponent(props: P) {
    renderCounter.trackRender(componentName);
    // eslint-disable-next-line react/jsx-no-useless-fragment
    return <>{props.children}</>;
  };
}

/**
 * Measure load time for an async operation
 */
export async function measureLoadTime<T>(
  operation: () => Promise<T>,
  label: string
): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await operation();
  const duration = performance.now() - start;

  return { result, duration };
}

/**
 * Format benchmark results for console output
 */
export function formatBenchmarkResult(result: BenchmarkResult): string {
  const status = result.passed ? '✅ PASS' : '❌ FAIL';
  return [
    `${status} ${result.name}`,
    `  Mean: ${result.mean.toFixed(2)}ms`,
    `  Median: ${result.median.toFixed(2)}ms`,
    `  Min: ${result.min.toFixed(2)}ms`,
    `  Max: ${result.max.toFixed(2)}ms`,
    `  Std Dev: ${result.stdDev.toFixed(2)}ms`,
    `  Threshold: ${result.threshold}ms`,
  ].join('\n');
}

/**
 * Run multiple benchmarks and report results
 */
export async function runBenchmarkSuite(
  benchmarks: Array<{
    name: string;
    fn: () => void | Promise<void>;
    threshold?: number;
  }>
): Promise<BenchmarkResult[]> {
  const results: BenchmarkResult[] = [];

  for (const benchmark of benchmarks) {
    const result = await runBenchmark(benchmark.name, benchmark.fn, {
      threshold: benchmark.threshold,
    });
    results.push(result);
  }

  return results;
}

/**
 * Assert performance threshold
 */
export function assertPerformance(
  result: BenchmarkResult,
  customMessage?: string
): void {
  if (!result.passed) {
    throw new Error(
      `Performance threshold exceeded: ${result.name}\n` +
      `Expected: ≤${result.threshold}ms, ` +
      `Actual: ${result.mean.toFixed(2)}ms\n` +
      (customMessage || '')
    );
  }
}
