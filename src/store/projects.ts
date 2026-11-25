/**
 * Project store with automatic, failure-tolerant saving.
 *
 * Every edit goes through `update(id, recipe)`. The new snapshot is handed to a SaveQueue
 * (lib/saveQueue.ts), which writes it to IndexedDB immediately, one write at a time, keeps failed
 * snapshots until they are persisted, and retries with back-off. Unsaved snapshots are also
 * copied to a synchronous recovery journal (lib/journal.ts) when a write fails or the tab is
 * hidden/unloading; on the next start, newer journal copies are restored and saved again.
 * The save indicator and the recovery banner read the queue's status from this store.
 */
import { create } from 'zustand'
import * as db from '../lib/db'
import { duplicateProject, emptyProject, nowIso } from '../lib/factory'
import { SaveQueue, type FlushResult, type SaveSnapshot } from '../lib/saveQueue'
import { registerLifecycle } from '../lib/lifecycle'
import { createJournal, type Journal } from '../lib/journal'
import { sanitizeProject } from '../lib/migrate'
import type { Project } from '../lib/types'

export interface RecoveredProject {
  id: string
  title: string
}

export type SaveState = SaveSnapshot['status']

interface State {
  loaded: boolean
  loadError: string | null
  projects: Record<string, Project>
  saveState: SaveState
  save: SaveSnapshot
  /** Projects whose unsaved changes were restored from the recovery journal at start-up. */
  recovered: RecoveredProject[]
  dismissRecovered: () => void
  init: () => Promise<void>
  create: (partial?: Partial<Project>) => Project
  update: (id: string, recipe: (draft: Project) => void, opts?: { touch?: boolean }) => void
  /** Store a whole project (import, sample) and wait until it is persisted or the write fails. */
  put: (project: Project) => Promise<FlushResult>
  duplicate: (id: string, suffix: string) => Project | null
  /** Delete from memory and storage. Rejects if the storage delete fails. */
  remove: (id: string) => Promise<void>
  flush: () => Promise<FlushResult>
  retrySave: () => Promise<FlushResult>
}

export const useProjects = create<State>((set, get) => {
  const journal: Journal<Project> = createJournal<Project>()
  const queue = new SaveQueue<Project>({
    write: (p) => db.save(p),
    journal,
    onChange: (s) => {
      if (s.lastError && (s.status === 'retrying' || s.status === 'failed')) console.warn('Save failed; changes kept for retry:', s.lastError)
      set({ save: s, saveState: s.status })
    },
  })

  if (typeof window !== 'undefined' && typeof document !== 'undefined') registerLifecycle(queue, window, document)

  return {
    loaded: false,
    loadError: null,
    projects: {},
    saveState: 'idle',
    save: queue.snapshot(),
    recovered: [],
    dismissRecovered: () => set({ recovered: [] }),

    async init() {
      if (get().loaded) return
      let stored: Project[] = []
      try {
        stored = await db.loadAll()
      } catch (err) {
        console.error('Could not open storage', err)
        set({ loadError: err instanceof Error ? err.message : String(err) })
      }
      const projects: Record<string, Project> = Object.fromEntries(stored.map((p) => [p.id, p]))
      // Restore recovery copies that are newer than what storage holds.
      const recovered: RecoveredProject[] = []
      for (const raw of journal.entries()) {
        let copy: Project
        try {
          copy = sanitizeProject(raw)
        } catch {
          continue
        }
        const current = projects[copy.id]
        // Restore when the copy is newer — or equally recent but different (edits within the same millisecond).
        const newer = !current || copy.updatedAt > current.updatedAt || (copy.updatedAt === current.updatedAt && JSON.stringify(copy) !== JSON.stringify(current))
        if (newer) {
          projects[copy.id] = copy
          recovered.push({ id: copy.id, title: copy.title })
          queue.hold(copy)
        } else {
          journal.remove(copy.id) // storage already has this version or a newer one
        }
      }
      set({ projects, loaded: true, recovered })
      if (recovered.length > 0) void queue.flush()
      void db.requestPersistence()
    },

    create(partial = {}) {
      const p = emptyProject(partial)
      set((s) => ({ projects: { ...s.projects, [p.id]: p } }))
      queue.enqueue(p)
      return p
    },

    update(id, recipe, opts = {}) {
      const current = get().projects[id]
      if (!current) return
      const draft = structuredClone(current)
      recipe(draft)
      if (opts.touch !== false) draft.updatedAt = nowIso()
      set((s) => ({ projects: { ...s.projects, [id]: draft } }))
      queue.enqueue(draft)
    },

    async put(project) {
      set((s) => ({ projects: { ...s.projects, [project.id]: project } }))
      queue.enqueue(project)
      return queue.flush()
    },

    duplicate(id, suffix) {
      const src = get().projects[id]
      if (!src) return null
      const copy = duplicateProject(src, suffix)
      set((s) => ({ projects: { ...s.projects, [copy.id]: copy } }))
      queue.enqueue(copy)
      return copy
    },

    async remove(id) {
      await queue.discard(id)
      await db.remove(id)
      journal.remove(id)
      set((s) => {
        const next = { ...s.projects }
        delete next[id]
        return { projects: next }
      })
    },

    flush: () => queue.flush(),
    retrySave: () => queue.retryNow(),
  }
})

export function useProject(id: string | undefined): Project | undefined {
  return useProjects((s) => (id ? s.projects[id] : undefined))
}
