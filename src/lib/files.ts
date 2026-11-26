import { buildBackup } from './migrate'
import { useBackups } from './backup'
import type { Project } from './types'

export const MAX_IMPORT_BYTES = 20 * 1024 * 1024

export function downloadText(filename: string, text: string, mime = 'application/json') {
  const blob = new Blob([text], { type: mime })
  downloadBlob(filename, blob)
}

export function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

export function slug(s: string): string {
  const out = s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50)
  return out || 'project'
}

function backupFile(projects: Project[], name: string): File {
  const stamp = new Date().toISOString().slice(0, 10)
  const text = JSON.stringify(buildBackup(projects), null, 2)
  return new File([text], `${slug(name)}-${stamp}.psl.json`, { type: 'application/json' })
}

/** Download a backup file and record that these projects are backed up. */
export function exportProjects(projects: Project[], name: string) {
  const file = backupFile(projects, name)
  downloadBlob(file.name, file)
  useBackups.getState().markBackedUp(projects)
}

/** True when the device can hand a file to other apps (Drive, WhatsApp, email…). */
export function canShareFiles(): boolean {
  try {
    const probe = new File(['{}'], 'backup.psl.json', { type: 'application/json' })
    return typeof navigator.share === 'function' && !!navigator.canShare?.({ files: [probe] })
  } catch {
    return false
  }
}

export type ShareResult = 'shared' | 'cancelled' | 'failed'

/**
 * Share a backup file through the device's share sheet. Projects are recorded as backed up only
 * when the share completes; cancelling leaves the reminder in place.
 */
export async function shareProjects(projects: Project[], name: string): Promise<ShareResult> {
  const file = backupFile(projects, name)
  try {
    await navigator.share({ files: [file], title: file.name })
    useBackups.getState().markBackedUp(projects)
    return 'shared'
  } catch (err) {
    return err instanceof DOMException && err.name === 'AbortError' ? 'cancelled' : 'failed'
  }
}

export function pickFile(accept: string): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept
    input.style.display = 'none'
    input.onchange = () => {
      resolve(input.files?.[0] ?? null)
      input.remove()
    }
    document.body.appendChild(input)
    input.click()
  })
}
