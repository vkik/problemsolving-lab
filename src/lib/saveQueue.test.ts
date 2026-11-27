import { describe, expect, it, vi } from 'vitest'
import { SaveQueue, type SaveSnapshot } from './saveQueue'
import { registerLifecycle } from './lifecycle'

type Item = { id: string; v: number }

/** A write function whose calls can be resolved or failed individually, plus a manual timer. */
function harness(opts: { delays?: number[] } = {}) {
  const calls: { item: Item; resolve: () => void; reject: (e: Error) => void }[] = []
  const stored = new Map<string, number>()
  let inFlight = 0
  let maxInFlight = 0
  const timers: { fn: () => void; ms: number; cleared: boolean }[] = []
  const states: SaveSnapshot[] = []
  const q = new SaveQueue<Item>({
    write: (item) =>
      new Promise<void>((resolve, reject) => {
        inFlight++
        maxInFlight = Math.max(maxInFlight, inFlight)
        calls.push({
          item,
          resolve: () => {
            inFlight--
            stored.set(item.id, item.v)
            resolve()
          },
          reject: (e) => {
            inFlight--
            reject(e)
          },
        })
      }),
    onChange: (s) => states.push(s),
    retryDelays: opts.delays ?? [10, 20],
    now: () => 1000,
    setTimer: (fn, ms) => {
      const t = { fn, ms, cleared: false }
      timers.push(t)
      return t
    },
    clearTimer: (h) => void ((h as { cleared: boolean }).cleared = true),
  })
  const tick = () => new Promise((r) => setTimeout(r, 0))
  const fireTimer = async () => {
    const t = timers.filter((x) => !x.cleared).pop()
    if (!t) throw new Error('no timer')
    t.cleared = true
    t.fn()
    await tick()
  }
  return { q, calls, stored, timers, states, tick, fireTimer, maxInFlight: () => maxInFlight }
}

describe('SaveQueue — failures are never discarded', () => {
  it('keeps a failed snapshot and persists it on retry', async () => {
    const h = harness()
    h.q.enqueue({ id: 'a', v: 1 })
    await h.tick()
    h.calls[0].reject(new Error('QuotaExceededError'))
    await h.tick()
    expect(h.q.snapshot().status).toBe('retrying')
    expect(h.q.snapshot().unsaved).toBe(1)
    expect(h.q.isPending('a')).toBe(true)
    expect(h.timers.at(-1)!.ms).toBe(10)
    await h.fireTimer()
    expect(h.calls).toHaveLength(2)
    expect(h.calls[1].item).toEqual({ id: 'a', v: 1 })
    h.calls[1].resolve()
    await h.tick()
    expect(h.stored.get('a')).toBe(1)
    expect(h.q.snapshot()).toMatchObject({ status: 'saved', unsaved: 0, failures: 0, lastError: null })
  })

  it('follows the back-off schedule, then reports failed and waits for a manual retry', async () => {
    const h = harness({ delays: [10, 20] })
    h.q.enqueue({ id: 'a', v: 1 })
    await h.tick()
    h.calls[0].reject(new Error('boom'))
    await h.tick()
    expect(h.timers.at(-1)!.ms).toBe(10)
    await h.fireTimer()
    h.calls[1].reject(new Error('boom'))
    await h.tick()
    expect(h.timers.at(-1)!.ms).toBe(20)
    await h.fireTimer()
    h.calls[2].reject(new Error('boom'))
    await h.tick()
    expect(h.q.snapshot().status).toBe('failed')
    expect(h.q.snapshot().nextRetryAt).toBeNull()
    expect(h.timers.filter((t) => !t.cleared)).toHaveLength(0)
    expect(h.q.isPending('a')).toBe(true)
    // manual retry
    const r = h.q.retryNow()
    await h.tick()
    h.calls[3].resolve()
    expect(await r).toEqual({ ok: true, unsaved: [], error: null })
    expect(h.q.snapshot().status).toBe('saved')
  })

  it('flush resolves with a failure report instead of pretending success', async () => {
    const h = harness()
    h.q.enqueue({ id: 'a', v: 1 })
    await h.tick()
    const f = h.q.flush()
    h.calls[0].reject(new Error('disk full'))
    const r = await f
    expect(r.ok).toBe(false)
    expect(r.unsaved).toEqual(['a'])
    expect(r.error).toContain('disk full')
    // flush during a back-off wait tries immediately
    const f2 = h.q.flush()
    await h.tick()
    h.calls[1].resolve()
    expect((await f2).ok).toBe(true)
  })
})

describe('SaveQueue — concurrency and ordering', () => {
  it('runs one write at a time and coalesces edits made during a write', async () => {
    const h = harness()
    h.q.enqueue({ id: 'a', v: 1 })
    await h.tick()
    h.q.enqueue({ id: 'a', v: 2 })
    h.q.enqueue({ id: 'a', v: 3 })
    h.q.enqueue({ id: 'b', v: 1 })
    expect(h.calls).toHaveLength(1)
    h.calls[0].resolve()
    await h.tick()
    h.calls[1].resolve()
    await h.tick()
    h.calls[2].resolve()
    await h.tick()
    expect(h.calls.map((c) => `${c.item.id}${c.item.v}`)).toEqual(['a1', 'a3', 'b1'])
    expect(h.maxInFlight()).toBe(1)
    expect(h.stored.get('a')).toBe(3)
    expect(h.q.snapshot().status).toBe('saved')
  })

  it('never writes an older snapshot over a newer one after a failure', async () => {
    const h = harness()
    h.q.enqueue({ id: 'a', v: 1 })
    await h.tick()
    h.q.enqueue({ id: 'a', v: 2 }) // newer edit while v1 is in flight
    h.calls[0].reject(new Error('boom'))
    await h.tick()
    h.q.enqueue({ id: 'a', v: 3 }) // edit during back-off: kept, no immediate write
    expect(h.calls).toHaveLength(1)
    await h.fireTimer()
    expect(h.calls[1].item.v).toBe(3)
    h.calls[1].resolve()
    await h.tick()
    expect(h.stored.get('a')).toBe(3)
  })

  it('discard waits for the in-flight write so a deleted project is not recreated', async () => {
    const h = harness()
    h.q.enqueue({ id: 'a', v: 1 })
    await h.tick()
    h.q.enqueue({ id: 'a', v: 2 })
    let discarded = false
    const d = h.q.discard('a').then(() => (discarded = true))
    await h.tick()
    expect(discarded).toBe(false) // still waiting for the in-flight write
    h.calls[0].resolve()
    await d
    await h.tick()
    expect(h.calls).toHaveLength(1) // v2 was dropped, never written
    expect(h.q.hasUnsaved()).toBe(false)
  })

  it('reports unsaved work while a write is in flight', async () => {
    const h = harness()
    expect(h.q.hasUnsaved()).toBe(false)
    h.q.enqueue({ id: 'a', v: 1 })
    expect(h.q.hasUnsaved()).toBe(true)
    await h.tick()
    h.calls[0].resolve()
    await h.tick()
    expect(h.q.hasUnsaved()).toBe(false)
  })

  it('starts writing immediately — no debounce timer (regression: v1.0 lost edits made just before reload)', () => {
    const h = harness()
    h.q.enqueue({ id: 'a', v: 1 })
    expect(h.timers).toHaveLength(0)
    expect(h.states[0].status).toBe('saving')
  })
})

describe('tab lifecycle', () => {
  function setup(unsaved: boolean) {
    const win = new EventTarget()
    const doc = Object.assign(new EventTarget(), { visibilityState: 'visible' })
    const queue = { flush: vi.fn(async () => ({})), hasUnsaved: vi.fn(() => unsaved) }
    const off = registerLifecycle(queue, win, doc)
    return { win, doc, queue, off }
  }
  it('flushes when the tab becomes hidden, not when it becomes visible', () => {
    const { doc, queue } = setup(false)
    doc.dispatchEvent(new Event('visibilitychange'))
    expect(queue.flush).not.toHaveBeenCalled()
    doc.visibilityState = 'hidden'
    doc.dispatchEvent(new Event('visibilitychange'))
    expect(queue.flush).toHaveBeenCalledTimes(1)
  })
  it('flushes (best effort) on pagehide', () => {
    const { win, queue } = setup(false)
    win.dispatchEvent(new Event('pagehide'))
    expect(queue.flush).toHaveBeenCalledTimes(1)
  })
  it('asks the browser to confirm leaving only while changes are unsaved', () => {
    const dirty = setup(true)
    const e1 = new Event('beforeunload', { cancelable: true })
    dirty.win.dispatchEvent(e1)
    expect(e1.defaultPrevented).toBe(true)
    const clean = setup(false)
    const e2 = new Event('beforeunload', { cancelable: true })
    clean.win.dispatchEvent(e2)
    expect(e2.defaultPrevented).toBe(false)
  })
  it('can be unregistered', () => {
    const { win, queue, off } = setup(true)
    off()
    win.dispatchEvent(new Event('pagehide'))
    expect(queue.flush).not.toHaveBeenCalled()
  })
})

describe('SaveQueue — flush semantics (brief 2C)', () => {
  it('concurrent flush calls both wait for every write, including edits that arrive mid-flush', async () => {
    const h = harness()
    h.q.enqueue({ id: 'a', v: 1 })
    await h.tick()
    const f1 = h.q.flush()
    const f2 = h.q.flush()
    h.q.enqueue({ id: 'a', v: 2 }) // new change while the first write is active
    h.q.enqueue({ id: 'b', v: 1 })
    let settled = 0
    void f1.then(() => settled++)
    void f2.then(() => settled++)
    h.calls[0].resolve()
    await h.tick()
    expect(settled).toBe(0) // a2 and b1 are still pending
    h.calls[1].resolve()
    await h.tick()
    expect(settled).toBe(0)
    h.calls[2].resolve()
    const [r1, r2] = await Promise.all([f1, f2])
    expect(r1).toEqual({ ok: true, unsaved: [], error: null })
    expect(r2.ok).toBe(true)
    expect(h.stored.get('a')).toBe(2)
    expect(h.stored.get('b')).toBe(1)
  })

  it('flush during an active write does not resolve before the write commits', async () => {
    const h = harness()
    h.q.enqueue({ id: 'a', v: 1 })
    await h.tick()
    let done = false
    const f = h.q.flush().then((r) => ((done = true), r))
    await h.tick()
    expect(done).toBe(false)
    h.calls[0].resolve()
    expect((await f).ok).toBe(true)
  })

  it('flush reports failure for an edit that arrived during the flush and then failed', async () => {
    const h = harness()
    h.q.enqueue({ id: 'a', v: 1 })
    await h.tick()
    const f = h.q.flush()
    h.q.enqueue({ id: 'b', v: 1 })
    h.calls[0].resolve()
    await h.tick()
    h.calls[1].reject(new Error('disk full'))
    const r = await f
    expect(r).toMatchObject({ ok: false, unsaved: ['b'] })
  })

  it('multiple rapid edits: only the latest snapshot is written after the in-flight one', async () => {
    const h = harness()
    for (let v = 1; v <= 50; v++) h.q.enqueue({ id: 'a', v })
    await h.tick()
    h.calls[0].resolve()
    await h.tick()
    h.calls[1].resolve()
    await h.tick()
    expect(h.calls.map((c) => c.item.v)).toEqual([1, 50])
    expect(h.stored.get('a')).toBe(50)
  })
})

describe('SaveQueue — recovery journal', () => {
  function withJournal(fail = false) {
    const store = new Map<string, number>()
    const removed: string[] = []
    const journal = {
      put: (i: Item) => {
        if (fail) return false
        store.set(i.id, i.v)
        return true
      },
      remove: (id: string) => {
        removed.push(id)
        store.delete(id)
      },
    }
    const calls: { resolve: () => void; reject: (e: Error) => void }[] = []
    const q = new SaveQueue<Item>({
      write: () => new Promise<void>((resolve, reject) => calls.push({ resolve, reject })),
      journal,
      retryDelays: [10],
      setTimer: () => ({}),
      clearTimer: () => {},
    })
    return { q, store, removed, calls, tick: () => new Promise((r) => setTimeout(r, 0)) }
  }

  it('copies unsaved snapshots to the journal when a write fails, and removes them once persisted', async () => {
    const h = withJournal()
    h.q.enqueue({ id: 'a', v: 1 })
    await h.tick()
    h.calls[0].reject(new Error('quota'))
    await h.tick()
    expect(h.store.get('a')).toBe(1)
    expect(h.q.snapshot().journalOk).toBe(true)
    h.q.enqueue({ id: 'a', v: 2 }) // edit while failing: journal updated immediately
    expect(h.store.get('a')).toBe(2)
    const f = h.q.flush()
    await h.tick()
    h.calls[1].resolve()
    expect((await f).ok).toBe(true)
    expect(h.store.has('a')).toBe(false)
    expect(h.q.snapshot().journalOk).toBeNull()
  })

  it('does not journal on healthy saves, but journalPending() copies in-flight work on demand', async () => {
    const h = withJournal()
    h.q.enqueue({ id: 'a', v: 1 })
    expect(h.store.size).toBe(0)
    expect(h.q.journalPending()).toBe(true) // e.g. tab hidden while the write is running
    expect(h.store.get('a')).toBe(1)
    await h.tick()
    h.calls[0].resolve()
    await h.tick()
    expect(h.store.size).toBe(0)
  })

  it('reports when the journal itself cannot store a copy', async () => {
    const h = withJournal(true)
    h.q.enqueue({ id: 'a', v: 1 })
    await h.tick()
    h.calls[0].reject(new Error('quota'))
    await h.tick()
    expect(h.q.snapshot().journalOk).toBe(false)
    expect(h.q.isPending('a')).toBe(true) // still kept in memory
  })

  it('hold() queues a restored snapshot as "unsaved" without writing', () => {
    const h = withJournal()
    h.q.hold({ id: 'a', v: 7 })
    expect(h.q.snapshot()).toMatchObject({ status: 'unsaved', unsaved: 1 })
    expect(h.calls).toHaveLength(0)
  })
})

describe('tab lifecycle — recovery copies', () => {
  it('takes a journal copy before flushing when hidden, on pagehide and on beforeunload', () => {
    const win = new EventTarget()
    const doc = Object.assign(new EventTarget(), { visibilityState: 'hidden' })
    const order: string[] = []
    const queue = {
      flush: vi.fn(async () => void order.push('flush')),
      hasUnsaved: () => true,
      journalPending: vi.fn(() => void order.push('journal')),
    }
    registerLifecycle(queue, win, doc)
    doc.dispatchEvent(new Event('visibilitychange'))
    win.dispatchEvent(new Event('pagehide'))
    win.dispatchEvent(new Event('beforeunload', { cancelable: true }))
    expect(order).toEqual(['journal', 'flush', 'journal', 'flush', 'journal'])
  })
})
