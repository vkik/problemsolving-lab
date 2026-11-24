import { buildBackup } from './migrate'
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

export function exportProjects(projects: Project[], name: string) {
  const stamp = new Date().toISOString().slice(0, 10)
  downloadText(`${slug(name)}-${stamp}.psl.json`, JSON.stringify(buildBackup(projects), null, 2))
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
