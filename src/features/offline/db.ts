import { openDB } from 'idb'

const DB_NAME = 'clucktrack-saas'
const DB_VERSION = 2

export function getOfflineDb() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('drafts')) {
        db.createObjectStore('drafts')
      }

      if (db.objectStoreNames.contains('sync-queue')) {
        db.deleteObjectStore('sync-queue')
      }
    },
  })
}
