import { duplicateProject } from './factory'
import { ImportError, parseBackup } from './migrate'
import { MAX_IMPORT_BYTES } from './files'
import type { Project } from './types'

export interface ImportResult {
  projects: Project[]
  copies: number
}

/** Validate a backup file and prepare projects for storage. Existing ids are imported as copies. */
export async function prepareImport(file: File, existingIds: Set<string>): Promise<ImportResult> {
  if (file.size > MAX_IMPORT_BYTES) throw new ImportError('tooLarge')
  const text = await file.text()
  const parsed = parseBackup(text)
  let copies = 0
  const projects = parsed.map((p) => {
    if (existingIds.has(p.id)) {
      copies++
      const copy = duplicateProject(p, '')
      copy.title = p.title
      copy.isSample = p.isSample
      return copy
    }
    return p
  })
  return { projects, copies }
}
