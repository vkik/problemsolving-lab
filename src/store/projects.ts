/**
 * Project store with automatic saving.
 * Every edit goes through `update(id, recipe)`; changes are written to IndexedDB after a short
 * debounce and flushed immediately when the tab is hidden or closed.
 */
import { create } from 'zustand'
import * as db from '../lib/db'
import { duplicateProject, emptyProject, nowIso } from '../lib/factory'
import type { Project } from '../lib/types'

export type SaveState = 'idle' | 'saving' | 'saved' | 'error'

interface State {
  loaded: boolean
  projects: Record<string, Project>
  saveState: SaveState
  lastSavedAt: string | null
  init: () => Promise<void>
  create: (partial?: Partial<Project>) => Project
  update: (id: string, recipe: (draft: Project) => void, opts?: { touch?: boolean }) => void
  put: (project: Project) => Promise<void>
  duplicate: (id: string, suffix: string) => Project | null
  remove: (id: string) => Promise<void>
  flush: () => Promise<void>
}

const pending = new Map<string, Project>()
let writing: Promise<void> | null = null

export const useProjects = create<State>((set, get) => {
  /**
   * Writes start immediately (no timer), so an edit is already in an IndexedDB transaction
   * before the user can reload or close the tab. While one write is in flight, further edits
   * are coalesced and the latest version of each project is written next.
   */
  const drain = async () => {
    set({ saveState: 'saving' })
    try {
      while (pending.size > 0) {
        const batch = [...pending.values()]
        pending.clear()
        await Promise.all(batch.map((p) => db.save(p)))
      }
      set({ saveState: 'saved', lastSavedAt: nowIso() })
    } catch (err) {
      console.error('Save failed', err)
      set({ saveState: 'error' })
    } finally {
      writing = null
    }
  }

  const writePending = async () => {
    if (!writing && pending.size > 0) writing = drain()
    await writing
    // A write may have been queued while the previous drain was finishing.
    if (pending.size > 0) await writePending()
  }

  const schedule = (p: Project) => {
    pending.set(p.id, p)
    void writePending()
  }

  return {
    loaded: false,
    projects: {},
    saveState: 'idle',
    lastSavedAt: null,

    async init() {
      if (get().loaded) return
      const all = await db.loadAll()
      set({ projects: Object.fromEntries(all.map((p) => [p.id, p])), loaded: true })
      void db.requestPersistence()
    },

    create(partial = {}) {
      const p = emptyProject(partial)
      set((s) => ({ projects: { ...s.projects, [p.id]: p } }))
      schedule(p)
      return p
    },

    update(id, recipe, opts = {}) {
      const current = get().projects[id]
      if (!current) return
      const draft = structuredClone(current)
      recipe(draft)
      if (opts.touch !== false) draft.updatedAt = nowIso()
      set((s) => ({ projects: { ...s.projects, [id]: draft } }))
      schedule(draft)
    },

    async put(project) {
      set((s) => ({ projects: { ...s.projects, [project.id]: project } }))
      pending.set(project.id, project)
      await writePending()
    },

    duplicate(id, suffix) {
      const src = get().projects[id]
      if (!src) return null
      const copy = duplicateProject(src, suffix)
      set((s) => ({ projects: { ...s.projects, [copy.id]: copy } }))
      schedule(copy)
      return copy
    },

    async remove(id) {
      pending.delete(id)
      await db.remove(id)
      set((s) => {
        const next = { ...s.projects }
        delete next[id]
        return { projects: next }
      })
    },

    flush: writePending,
  }
})

if (typeof window !== 'undefined') {
  const flush = () => void useProjects.getState().flush()
  window.addEventListener('pagehide', flush)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush()
  })
}

export function useProject(id: string | undefined): Project | undefined {
  return useProjects((s) => (id ? s.projects[id] : undefined))
}
