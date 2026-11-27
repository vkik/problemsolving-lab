/**
 * Recovery journal: a synchronous safety copy of project snapshots that are not yet persisted.
 *
 * IndexedDB is the primary store and every edit is written to it immediately. The journal only
 * holds a copy when that has not (yet) worked:
 *   - when an IndexedDB write fails, and
 *   - when the tab is hidden or being unloaded while writes are still pending.
 * localStorage is synchronous, so a copy taken during `pagehide` completes before the page goes.
 *
 * On the next start, a journal entry that is newer than the stored project is restored and saved
 * again (see store/projects.ts). Entries are removed once the same or a newer version is persisted.
 *
 * Limits: localStorage holds roughly 5 MB per site and can be disabled. A journal write can
 * therefore fail; `put()` reports that, and the app keeps warning the user instead of assuming
 * the data is safe.
 */

export interface Journal<T> {
  /** Store a recovery copy. Returns false if it could not be stored. */
  put(item: T): boolean
  remove(id: string): void
  entries(): unknown[]
}

export const JOURNAL_PREFIX = 'psl.recovery.'

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem' | 'key' | 'length'>

function defaultStorage(): StorageLike | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null
  } catch {
    return null // access can throw when storage is blocked
  }
}

export function createJournal<T extends { id: string }>(storage: StorageLike | null = defaultStorage(), prefix = JOURNAL_PREFIX): Journal<T> {
  return {
    put(item) {
      if (!storage) return false
      try {
        storage.setItem(prefix + item.id, JSON.stringify({ savedAt: new Date().toISOString(), project: item }))
        return true
      } catch {
        return false // quota exceeded or storage disabled
      }
    },
    remove(id) {
      try {
        storage?.removeItem(prefix + id)
      } catch {
        /* ignore */
      }
    },
    entries() {
      if (!storage) return []
      const out: unknown[] = []
      try {
        const keys: string[] = []
        for (let i = 0; i < storage.length; i++) {
          const k = storage.key(i)
          if (k?.startsWith(prefix)) keys.push(k)
        }
        for (const k of keys) {
          try {
            const raw = JSON.parse(storage.getItem(k) ?? 'null')
            if (raw && typeof raw === 'object' && 'project' in raw) out.push(raw.project)
            else storage.removeItem(k)
          } catch {
            storage.removeItem(k) // unreadable entry
          }
        }
      } catch {
        return out
      }
      return out
    },
  }
}

/** In-memory storage with an optional failure switch — for tests. */
export function memoryStorage(): StorageLike & { fail: boolean; data: Map<string, string> } {
  const data = new Map<string, string>()
  const s = {
    fail: false,
    data,
    get length() {
      return data.size
    },
    key: (i: number) => [...data.keys()][i] ?? null,
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => {
      if (s.fail) throw new DOMException('quota', 'QuotaExceededError')
      data.set(k, v)
    },
    removeItem: (k: string) => void data.delete(k),
  }
  return s
}
