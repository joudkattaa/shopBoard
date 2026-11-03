import type { createState } from '../../state.ts'
export type Theme = 'light' | 'dark'
export interface Profile {
  name: string
}
export interface StorageAdapter {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}
export type AppState = ReturnType<typeof createState>
