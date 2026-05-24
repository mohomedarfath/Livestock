import { getOfflineDb } from './db'

export async function saveDraft(key, value) {
  const db = await getOfflineDb()
  await db.put('drafts', value, key)
}

export async function loadDraft(key) {
  const db = await getOfflineDb()
  return db.get('drafts', key)
}

export async function clearDraft(key) {
  const db = await getOfflineDb()
  await db.delete('drafts', key)
}
