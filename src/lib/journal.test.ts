import { describe, expect, it } from 'vitest'
import { createJournal, memoryStorage } from './journal'

describe('recovery journal storage', () => {
  it('stores, lists and removes copies', () => {
    const s = memoryStorage()
    const j = createJournal<{ id: string; v: number }>(s)
    expect(j.put({ id: 'a', v: 1 })).toBe(true)
    expect(j.put({ id: 'b', v: 2 })).toBe(true)
    expect(j.entries()).toEqual([
      { id: 'a', v: 1 },
      { id: 'b', v: 2 },
    ])
    j.remove('a')
    expect(j.entries()).toEqual([{ id: 'b', v: 2 }])
  })
  it('reports failure when storage is full or missing, without throwing', () => {
    const s = memoryStorage()
    s.fail = true
    expect(createJournal(s).put({ id: 'a' })).toBe(false)
    expect(createJournal(null).put({ id: 'a' })).toBe(false)
    expect(createJournal(null).entries()).toEqual([])
  })
  it('ignores and cleans up unreadable entries', () => {
    const s = memoryStorage()
    s.data.set('psl.recovery.x', '{broken')
    s.data.set('psl.recovery.y', JSON.stringify({ nope: 1 }))
    s.data.set('psl.prefs', '{"lang":"en"}')
    expect(createJournal(s).entries()).toEqual([])
    expect([...s.data.keys()]).toEqual(['psl.prefs'])
  })
})
