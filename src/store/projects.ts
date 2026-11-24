/**
 * Project store with automatic, failure-tolerant saving.
 *
 * Every edit goes through `update(id, recipe)`. The new snapshot is handed to a SaveQueue
 * (lib/saveQueue.ts), which writes it to IndexedDB immediately, one write at a time, keeps failed
 * snapshots until they are persisted, and retries with back-off. The save indicator and the
 * recovery banner read the queue's status from this store.
 */
import { create } from 'zustand'
import * as db from '../lib/db'
import { duplicateProject, emptyProject, nowIso } from '../lib/factory'
import { SaveQueue, type FlushResult, type SaveSnapshot } from '../lib/saveQueue'
import { registerLifecycle } from '../lib/lifecycle'
import type { Project } from '../lib/types'

export type SaveState = SaveSnapshot['status']

interface State {
  loaded: boolean
  loadError: string | null
  projects: Record<string, Project>
  saveState: SaveState
  save: SaveSnapshot
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
  const queue = new SaveQueue<Project>({
    write: (p) => db.save(p),
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

    async init() {
      if (get().loaded) return
      try {
        const all = await db.loadAll()
        set({ projects: Object.fromEntries(all.map((p) => [p.id, p])), loaded: true })
      } catch (err) {
        console.error('Could not open storage', err)
        set({ loaded: true, loadError: err instanceof Error ? err.message : String(err) })
      }
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
