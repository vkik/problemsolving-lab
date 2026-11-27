import { describe, expect, it } from 'vitest'
import { backupStatus, REMIND_AFTER_DAYS, SNOOZE_DAYS, withBackup, withSnooze, type BackupRecord } from './backup'
import type { Project } from './types'

const DAY = 24 * 60 * 60 * 1000
const now = new Date('2026-11-26T12:00:00.000Z')
const ago = (days: number) => new Date(now.getTime() - days * DAY).toISOString()
const proj = (id: string, createdDaysAgo: number, updatedDaysAgo: number) =>
  ({ id, createdAt: ago(createdDaysAgo), updatedAt: ago(updatedDaysAgo) }) as Project
const empty: BackupRecord = { byId: {}, snoozeUntil: '' }

describe('backup reminder', () => {
  it('does not nag about a project created today', () => {
    const s = backupStatus([proj('a', 0, 0)], empty, now)
    expect(s.notBackedUp.map((p) => p.id)).toEqual(['a'])
    expect(s.remind).toBe(false)
    expect(s.lastAt).toBe('')
  })

  it(`reminds when a never-backed-up project is ${REMIND_AFTER_DAYS} days old`, () => {
    expect(backupStatus([proj('a', REMIND_AFTER_DAYS, 1)], empty, now).remind).toBe(true)
  })

  it('a backup covers a project until it changes again', () => {
    const r = withBackup(empty, [{ id: 'a' }], ago(10))
    expect(backupStatus([proj('a', 30, 11)], r, now)).toMatchObject({ remind: false, notBackedUp: [] })
    // Edited after the backup, and the backup is over a week old → remind.
    const s = backupStatus([proj('a', 30, 1)], r, now)
    expect(s.notBackedUp).toHaveLength(1)
    expect(s.remind).toBe(true)
    expect(s.lastAt).toBe(ago(10))
  })

  it('a recent backup does not remind even with newer edits', () => {
    const r = withBackup(empty, [{ id: 'a' }], ago(2))
    const s = backupStatus([proj('a', 30, 0)], r, now)
    expect(s.notBackedUp).toHaveLength(1)
    expect(s.remind).toBe(false)
  })

  it(`“Later” hides the reminder for ${SNOOZE_DAYS} days`, () => {
    const p = [proj('a', 30, 1)]
    const snoozed = withSnooze(empty, now)
    expect(backupStatus(p, snoozed, now).remind).toBe(false)
    expect(backupStatus(p, snoozed, new Date(now.getTime() + (SNOOZE_DAYS + 0.1) * DAY)).remind).toBe(true)
  })

  it('records only the exported projects', () => {
    const r = withBackup(empty, [{ id: 'a' }], ago(0))
    const s = backupStatus([proj('a', 30, 1), proj('b', 30, 1)], r, now)
    expect(s.notBackedUp.map((p) => p.id)).toEqual(['b'])
    expect(s.remind).toBe(true)
  })
})
