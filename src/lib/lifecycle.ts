/**
 * Tab lifecycle handling for the save queue.
 *
 * - Hidden tab (switching apps, locking a phone): flush immediately. This is the most reliable
 *   moment, because the page is still alive.
 * - pagehide: best-effort flush. The browser may stop the page before the write completes.
 * - beforeunload: if anything is unsaved, ask the browser to confirm leaving, so the user can stay
 *   and let the save finish (or export a backup).
 */
export interface Flushable {
  flush: () => Promise<unknown>
  hasUnsaved: () => boolean
}

export function registerLifecycle(queue: Flushable, win: EventTarget, doc: EventTarget & { visibilityState: string }): () => void {
  const onBeforeUnload = (e: Event) => {
    if (!queue.hasUnsaved()) return
    e.preventDefault()
    // Legacy browsers need returnValue set to show the prompt.
    ;(e as unknown as { returnValue: unknown }).returnValue = ''
  }
  const onPageHide = () => void queue.flush()
  const onVisibility = () => {
    if (doc.visibilityState === 'hidden') void queue.flush()
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
