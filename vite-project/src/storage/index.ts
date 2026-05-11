import { STORAGE_BACKEND } from '../config'
import type { StorageAdapter } from './adapter'

let _adapter: StorageAdapter | null = null

export function getAdapter(): StorageAdapter {
  if (!_adapter) throw new Error('Storage not initialized. Call initStorage() first.')
  return _adapter
}

export async function initStorage(): Promise<void> {
  if (STORAGE_BACKEND === 'firestore') {
    const { FirestoreAdapter } = await import('./firestore')
    _adapter = new FirestoreAdapter()
  } else {
    const { LocalStorageAdapter } = await import('./localstorage')
    _adapter = new LocalStorageAdapter()
  }
}
