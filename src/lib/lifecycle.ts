/**
 * Tab lifecycle handling for the save queue.
 *
 * Continuous persistence (every edit written at once) is the primary mechanism; these handlers
 * only cover the moments when the page may stop running:
 * - Hidden tab (switching apps, locking a phone): take a synchronous recovery copy of anything
 *   unsaved, then flush. The page is still alive here, so this is the most reliable moment.
 * - pagehide: recovery copy (synchronous, so it completes) plus a best-effort flush; the browser may
 *   stop the page before the asynchronous IndexedDB write completes.
 * - beforeunload: if anything is unsaved, take a recovery copy and ask the browser to confirm leaving.
 */
export interface Flushable {
  flush: () => Promise<unknown>
  hasUnsaved: () => boolean
  /** Synchronous recovery copy of unsaved snapshots (optional). */
  journalPending?: () => unknown
}

export function registerLifecycle(queue: Flushable, win: EventTarget, doc: EventTarget & { visibilityState: string }): () => void {
  const onBeforeUnload = (e: Event) => {
    if (!queue.hasUnsaved()) return
    queue.journalPending?.()
    e.preventDefault()
    // Legacy browsers need returnValue set to show the prompt.
    ;(e as unknown as { returnValue: unknown }).returnValue = ''
  }
  const onPageHide = () => {
    if (queue.hasUnsaved()) queue.journalPending?.()
    void queue.flush()
  }
  const onVisibility = () => {
    if (doc.visibilityState !== 'hidden') return
    if (queue.hasUnsaved()) queue.journalPending?.()
    void queue.flush()
  }
  win.addEventListener('beforeunload', onBeforeUnload)
  win.addEventListener('pagehide', onPageHide)
  doc.addEventListener('visibilitychange', onVisibility)
  return () => {
    win.removeEventListener('beforeunload', onBeforeUnload)
    win.removeEventListener('pagehide', onPageHide)
    doc.removeEventListener('visibilitychange', onVisibility)
  }
}
