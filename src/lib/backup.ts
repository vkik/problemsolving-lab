/**
 * Backup tracking and storage protection.
 *
 * Project data lives only in this browser, so a backup file is the user's protection against
 * cleared browser data, a lost phone or storage eviction. This module records when each project
 * was last exported (LocalStorage, separate from project data), decides when to remind the user,
 * and asks the browser to keep our storage persistent.
 */
import { create } from 'zustand'
import type { Project } from './types'

export const BACKUP_KEY = 'psl.backups'
/** Remind when a project has had changes not in any backup for this long. */
export const REMIND_AFTER_DAYS = 7
/** “Later” hides the reminder for this long. */
export const SNOOZE_DAYS = 3
const DAY = 24 * 60 * 60 * 1000

export interface BackupRecord {
  /** Project id → ISO time of the last export that included it. */
  byId: Record<string, string>
  /** ISO time until which the reminder is hidden. */
  snoozeUntil: string
}

export interface BackupStatus {
  /** Most recent backup of any current project, or '' if none. */
  lastAt: string
  /** Projects with changes not included in any backup. */
  notBackedUp: Project[]
  /** True when the reminder should be shown (respects snooze). */
  remind: boolean
}

const emptyRecord = (): BackupRecord => ({ byId: {}, snoozeUntil: '' })

export function backupStatus(projects: Project[], record: BackupRecord, now = new Date()): BackupStatus {
  let lastAt = ''
  const notBackedUp: Project[] = []
  let overdue = false
  for (const p of projects) {
    const at = record.byId[p.id] ?? ''
    if (at > lastAt) lastAt = at
    if (p.updatedAt > at) {
      notBackedUp.push(p)
      // Count from the last backup, or from creation if never backed up.
      const since = new Date(at || p.createdAt).getTime()
      if (now.getTime() - since >= REMIND_AFTER_DAYS * DAY) overdue = true
    }
  }
  const snoozed = record.snoozeUntil !== '' && record.snoozeUntil > now.toISOString()
  return { lastAt, notBackedUp, remind: overdue && !snoozed }
}

export function withBackup(record: BackupRecord, projects: Pick<Project, 'id'>[], at: string): BackupRecord {
  const byId = { ...record.byId }
  for (const p of projects) byId[p.id] = at
  return { ...record, byId }
}

export function withSnooze(record: BackupRecord, now = new Date()): BackupRecord {
  return { ...record, snoozeUntil: new Date(now.getTime() + SNOOZE_DAYS * DAY).toISOString() }
}

function readRecord(): BackupRecord {
  try {
    const raw = JSON.parse(localStorage.getItem(BACKUP_KEY) ?? '{}')
    const byId: Record<string, string> = {}
    if (raw && typeof raw.byId === 'object' && raw.byId) {
      for (const [k, v] of Object.entries(raw.byId)) if (typeof v === 'string') byId[k] = v
    }
    return { byId, snoozeUntil: typeof raw?.snoozeUntil === 'string' ? raw.snoozeUntil : '' }
  } catch {
    return emptyRecord()
  }
}

function writeRecord(r: BackupRecord) {
  try {
    localStorage.setItem(BACKUP_KEY, JSON.stringify(r))
  } catch {
    /* storage unavailable: the reminder simply keeps showing */
  }
}

interface BackupState {
  record: BackupRecord
  /** null = unknown / not supported. */
  persisted: boolean | null
  markBackedUp: (projects: Pick<Project, 'id'>[]) => void
  snooze: () => void
  checkPersisted: () => Promise<void>
  requestPersist: () => Promise<boolean>
}

export const useBackups = create<BackupState>((set, get) => ({
  record: typeof localStorage !== 'undefined' ? readRecord() : emptyRecord(),
  persisted: null,
  markBackedUp(projects) {
    const record = withBackup(get().record, projects, new Date().toISOString())
    writeRecord(record)
    set({ record })
  },
  snooze() {
    const record = withSnooze(get().record)
    writeRecord(record)
    set({ record })
  },
  async checkPersisted() {
    try {
      if (navigator.storage?.persisted) set({ persisted: await navigator.storage.persisted() })
    } catch {
      set({ persisted: null })
    }
  },
  async requestPersist() {
    try {
      if (navigator.storage?.persist) {
        const ok = await navigator.storage.persist()
        set({ persisted: ok })
        return ok
      }
    } catch {
      /* not supported */
    }
    return false
  },
}))
