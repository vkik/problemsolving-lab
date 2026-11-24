/**
 * Reliable save queue for project snapshots.
 *
 * Guarantees (within a running tab):
 * - A snapshot leaves the queue only after its write has succeeded. A failed write is never
 *   discarded: the snapshot stays queued (or is replaced by a newer snapshot of the same project).
 * - Writes run one at a time, in order. Two writes can never race, and an older snapshot can
 *   never overwrite a newer one.
 * - After a failure, retries follow a controlled back-off schedule. When automatic retries are
 *   exhausted the queue reports `failed` and waits for a manual retry, a new edit or a flush.
 * - `flush()` always resolves, and reports whether everything was persisted.
 *
 * What it cannot guarantee: a write started while the tab is being closed may be aborted by the
 * browser. The lifecycle handlers (see lifecycle.ts) flush on hide and warn before unload, but
 * nothing can make an asynchronous IndexedDB write finish after the page is gone.
 */

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'retrying' | 'failed'

export interface SaveSnapshot {
  status: SaveStatus
  /** Number of projects with changes not yet persisted. */
  unsaved: number
  /** Consecutive failed attempts since the last successful write. */
  failures: number
  /** Epoch ms of the next automatic retry, when one is scheduled. */
  nextRetryAt: number | null
  lastError: string | null
  lastSavedAt: number | null
}

export interface FlushResult {
  ok: boolean
  /** Ids still waiting to be persisted. */
  unsaved: string[]
  error: string | null
}

export interface SaveQueueOptions<T> {
  write: (item: T) => Promise<void>
  onChange?: (s: SaveSnapshot) => void
  /** Delays (ms) before each automatic retry. Default: 1 s, 3 s, 10 s, 30 s. */
  retryDelays?: number[]
  now?: () => number
  setTimer?: (fn: () => void, ms: number) => unknown
  clearTimer?: (handle: unknown) => void
}

export const DEFAULT_RETRY_DELAYS = [1000, 3000, 10000, 30000]

export class SaveQueue<T extends { id: string }> {
  private pending = new Map<string, T>()
  private running: Promise<void> | null = null
  private timer: unknown = null
  private status: SaveStatus = 'idle'
  private failures = 0
  private nextRetryAt: number | null = null
  private lastError: string | null = null
  private lastSavedAt: number | null = null
  private readonly delays: number[]
  private readonly now: () => number
  private readonly setTimer: (fn: () => void, ms: number) => unknown
  private readonly clearTimer: (h: unknown) => void

  private readonly opts: SaveQueueOptions<T>

  constructor(opts: SaveQueueOptions<T>) {
    this.opts = opts
    this.delays = opts.retryDelays ?? DEFAULT_RETRY_DELAYS
    this.now = opts.now ?? (() => Date.now())
    this.setTimer = opts.setTimer ?? ((fn, ms) => setTimeout(fn, ms))
    this.clearTimer = opts.clearTimer ?? ((h) => clearTimeout(h as ReturnType<typeof setTimeout>))
  }

  /** Queue the latest snapshot of a project. Writing starts at once unless a retry is pending. */
  enqueue(item: T): void {
    this.pending.set(item.id, item)
    if (this.timer) {
      // Waiting for a scheduled retry: keep the newest snapshot and let the back-off run.
      this.emit()
      return
    }
    this.kick()
  }

  /** Persist everything now (cancels any back-off wait). Always resolves. */
  async flush(): Promise<FlushResult> {
    this.cancelTimer()
    this.kick()
    while (this.running) await this.running
    return this.result()
  }

  /** Manual retry after failures — same as flush, but also resets the back-off schedule. */
  retryNow(): Promise<FlushResult> {
    this.failures = 0
    return this.flush()
  }

  /**
   * Drop a project from the queue (e.g. it is being deleted) and wait for any in-flight write
   * to finish, so the caller can delete it from storage without the write recreating it.
   */
  async discard(id: string): Promise<void> {
    this.pending.delete(id)
    while (this.running) await this.running
    this.pending.delete(id)
    if (this.pending.size === 0 && (this.status === 'retrying' || this.status === 'failed')) {
      this.cancelTimer()
      this.failures = 0
      this.lastError = null
      this.status = this.lastSavedAt ? 'saved' : 'idle'
    }
    this.emit()
  }

  hasUnsaved(): boolean {
    return this.pending.size > 0 || this.running !== null
  }

  isPending(id: string): boolean {
    return this.pending.has(id)
  }

  snapshot(): SaveSnapshot {
    return {
      status: this.status,
      unsaved: this.pending.size,
      failures: this.failures,
      nextRetryAt: this.nextRetryAt,
      lastError: this.lastError,
      lastSavedAt: this.lastSavedAt,
    }
  }

  private result(): FlushResult {
    return { ok: this.pending.size === 0, unsaved: [...this.pending.keys()], error: this.pending.size ? this.lastError : null }
  }

  private emit() {
    this.opts.onChange?.(this.snapshot())
  }

  private cancelTimer() {
    if (this.timer) {
      this.clearTimer(this.timer)
      this.timer = null
      this.nextRetryAt = null
    }
  }

  private kick() {
    if (this.running || this.pending.size === 0) return
    this.running = this.run().finally(() => {
      this.running = null
      // An edit may have arrived after the loop's last check.
      if (this.pending.size > 0 && !this.timer && this.status !== 'retrying' && this.status !== 'failed') this.kick()
    })
  }

  private async run(): Promise<void> {
    this.status = 'saving'
    this.emit()
    while (this.pending.size > 0) {
      const [id, item] = this.pending.entries().next().value as [string, T]
      try {
        await this.opts.write(item)
      } catch (err) {
        this.failures++
        this.lastError = err instanceof Error ? `${err.name}: ${err.message}` : String(err)
        this.scheduleRetry()
        return
      }
      // Only remove the snapshot that was written. A newer one queued meanwhile stays and is written next.
      if (this.pending.get(id) === item) this.pending.delete(id)
      this.failures = 0
      this.lastError = null
      this.lastSavedAt = this.now()
    }
    this.status = 'saved'
    this.emit()
  }

  private scheduleRetry() {
    if (this.failures > this.delays.length) {
      this.status = 'failed'
      this.nextRetryAt = null
      this.emit()
      return
    }
    const delay = this.delays[this.failures - 1]
    this.status = 'retrying'
    this.nextRetryAt = this.now() + delay
    this.timer = this.setTimer(() => {
      this.timer = null
      this.nextRetryAt = null
      this.status = 'saving'
      this.kick()
    }, delay)
    this.emit()
  }
}
