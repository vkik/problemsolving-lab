/** IndexedDB persistence. All project data stays on this device. */
import { openDB, type IDBPDatabase } from 'idb'
import type { Project } from './types'
import { sanitizeProject } from './migrate'

const DB_NAME = 'problemsolving-lab'
const DB_VERSION = 1
const STORE = 'projects'

let dbPromise: Promise<IDBPDatabase> | null = null

function db() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(database) {
        if (!database.objectStoreNames.contains(STORE)) database.createObjectStore(STORE, { keyPath: 'id' })
      },
    })
  }
  return dbPromise
}

export async function loadAll(): Promise<Project[]> {
  const rows = await (await db()).getAll(STORE)
  const out: Project[] = []
  for (const row of rows) {
    try {
      out.push(sanitizeProject(row))
    } catch (err) {
      console.warn('Skipping unreadable project record', err)
    }
  }
  return out
}

export async function save(project: Project): Promise<void> {
  await (await db()).put(STORE, project)
}

export async function remove(id: string): Promise<void> {
  await (await db()).delete(STORE, id)
}

/** Ask the browser not to evict our data under storage pressure (best effort). */
export async function requestPersistence(): Promise<boolean> {
  try {
    if (navigator.storage?.persist) return await navigator.storage.persist()
  } catch {
    /* not supported */
  }
  return false
}
