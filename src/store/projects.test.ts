/**
 * Store-level integration tests with IndexedDB replaced by an in-memory fake.
 * The first test is the reproduction of defect D1 that failed on main (v1.0.0).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { memoryStorage, JOURNAL_PREFIX } from '../lib/journal'
import { buildSampleProject } from '../lib/sample'
import type { Project } from '../lib/types'

const db = new Map<string, Project>()
const fault = { failNext: 0 }
let local: ReturnType<typeof memoryStorage>

vi.mock('../lib/db', () => ({
  loadAll: async () => [...db.values()].map((p) => structuredClone(p)),
  save: async (p: Project) => {
    if (fault.failNext > 0) {
      fault.failNext--
      throw new DOMException('Simulated quota error', 'QuotaExceededError')
    }
    db.set(p.id, structuredClone(p))
  },
  remove: async (id: string) => void db.delete(id),
  requestPersistence: async () => false,
}))

async function freshStore() {
  vi.resetModules()
  ;(globalThis as { localStorage?: unknown }).localStorage = local
  const mod = await import('./projects')
  return mod.useProjects
}

beforeEach(() => {
  db.clear()
  fault.failNext = 0
  local = memoryStorage()
})

describe('store persistence', () => {
  it('D1 regression: a change whose write fails is kept and persisted on retry (failed on main v1.0.0)', async () => {
    const useProjects = await freshStore()
    const s = useProjects.getState()
    const p = s.create({ title: 'Original' })
    expect((await s.flush()).ok).toBe(true)

    fault.failNext = 1
    s.update(p.id, (d) => void (d.title = 'Edited while storage failed'))
    const failed = await s.flush()
    expect(failed.ok).toBe(false)
    expect(failed.unsaved).toEqual([p.id])
    expect(useProjects.getState().saveState).toBe('retrying')
    // A recovery copy exists while the write is outstanding
    expect(local.data.has(JOURNAL_PREFIX + p.id)).toBe(true)

    const retried = await s.flush()
    expect(retried.ok).toBe(true)
    expect(db.get(p.id)!.title).toBe('Edited while storage failed')
    expect(useProjects.getState().saveState).toBe('saved')
    expect(local.data.has(JOURNAL_PREFIX + p.id)).toBe(false)
  })

  it('successful persistence and reload: data comes back from storage', async () => {
    let useProjects = await freshStore()
    const p = useProjects.getState().create({ title: 'Persist me' })
    await useProjects.getState().flush()
    useProjects = await freshStore() // simulated reload
    await useProjects.getState().init()
    expect(useProjects.getState().projects[p.id].title).toBe('Persist me')
    expect(useProjects.getState().recovered).toEqual([])
  })

  it('reload after a failed write: the journal copy is restored and saved (D7)', async () => {
    let useProjects = await freshStore()
    const s = useProjects.getState()
    const p = s.create({ title: 'Before' })
    await s.flush()
    fault.failNext = 1000 // storage keeps failing until the "tab" is closed
    s.update(p.id, (d) => void (d.title = 'Unsaved edit'))
    await s.flush()
    expect(db.get(p.id)!.title).toBe('Before')

    fault.failNext = 0 // next session: storage healthy again
    useProjects = await freshStore()
    await useProjects.getState().init()
    expect(useProjects.getState().projects[p.id].title).toBe('Unsaved edit')
    expect(useProjects.getState().recovered).toEqual([{ id: p.id, title: 'Unsaved edit' }])
    await useProjects.getState().flush()
    expect(db.get(p.id)!.title).toBe('Unsaved edit')
    expect(local.data.size).toBe(0)
  })

  it('restores a same-timestamp copy only if its content differs', async () => {
    const sample = buildSampleProject()
    db.set(sample.id, sample)
    local.data.set(JOURNAL_PREFIX + sample.id, JSON.stringify({ project: sample })) // identical
    let useProjects = await freshStore()
    await useProjects.getState().init()
    expect(useProjects.getState().recovered).toEqual([])
    local.data.set(JOURNAL_PREFIX + sample.id, JSON.stringify({ project: { ...sample, title: 'Same ms, different' } }))
    useProjects = await freshStore()
    await useProjects.getState().init()
    expect(useProjects.getState().projects[sample.id].title).toBe('Same ms, different')
  })

  it('ignores and removes a stale journal copy that is older than storage', async () => {
    const sample = buildSampleProject()
    db.set(sample.id, { ...sample, title: 'Newer in storage', updatedAt: '2030-01-02T00:00:00.000Z' })
    local.data.set(JOURNAL_PREFIX + sample.id, JSON.stringify({ project: { ...sample, title: 'Old copy', updatedAt: '2030-01-01T00:00:00.000Z' } }))
    const useProjects = await freshStore()
    await useProjects.getState().init()
    expect(useProjects.getState().projects[sample.id].title).toBe('Newer in storage')
    expect(useProjects.getState().recovered).toEqual([])
    expect(local.data.size).toBe(0)
  })

  it('restores a project that never reached storage at all', async () => {
    const sample = buildSampleProject()
    local.data.set(JOURNAL_PREFIX + sample.id, JSON.stringify({ project: sample }))
    const useProjects = await freshStore()
    await useProjects.getState().init()
    expect(useProjects.getState().recovered.map((r) => r.id)).toEqual([sample.id])
    expect((await useProjects.getState().flush()).ok).toBe(true)
    expect(db.has(sample.id)).toBe(true)
  })

  it('deleting a project removes its recovery copy and does not resurrect it', async () => {
    const useProjects = await freshStore()
    const s = useProjects.getState()
    const p = s.create({ title: 'Doomed' })
    await s.flush()
    fault.failNext = 1
    s.update(p.id, (d) => void (d.title = 'Doomed 2'))
    await s.flush()
    expect(local.data.size).toBe(1)
    await s.remove(p.id)
    await s.flush()
    expect(db.has(p.id)).toBe(false)
    expect(local.data.size).toBe(0)
  })

  it('save indicator: saving → saved; failure → retrying with unsaved count', async () => {
    const useProjects = await freshStore()
    const s = useProjects.getState()
    const p = s.create({ title: 'x' })
    expect(useProjects.getState().saveState).toBe('saving')
    expect(useProjects.getState().save.unsaved).toBe(1) // queued, not yet confirmed
    await s.flush()
    expect(useProjects.getState().saveState).toBe('saved')
    expect(useProjects.getState().save.unsaved).toBe(0)
    fault.failNext = 1
    s.update(p.id, (d) => void (d.title = 'y'))
    await s.flush()
    expect(useProjects.getState().save).toMatchObject({ status: 'retrying', unsaved: 1, journalOk: true })
  })
})
