import type { Product } from '../../modules/products/products.types.ts'

// Contracts only: helper implementations remain in the shared UI coordinator.
export interface UIHelpers {
  $: (selector: string) => HTMLElement
  input: (selector: string) => HTMLInputElement
  select: (selector: string) => HTMLSelectElement
  dialog: (selector: string) => HTMLDialogElement
  all: <T extends Element>(selector: string, kind: { new (): T }, root?: ParentNode) => T[]
  closest: (target: Element, selector: string) => HTMLElement | null
  icon: (name: string) => string
  escape: (value: unknown) => string
  formatMoney: (cents: number) => string
  productMedia: (product: Product, size?: number) => string
  openContent: (title: string, html: string) => void
  notify: (message: string) => void
}
