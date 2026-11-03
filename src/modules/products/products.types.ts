export type Category =
  'Body Care' | 'Hair Care' | 'Skin Care' | 'Fragrance' | 'Makeup' | 'Face Masks' | 'Gift Sets'

export interface Product {
  id: string
  name: string
  category: Category
  price: number
  size: string
  image: string
  description: string
}

export type SortOrder = 'default' | 'price-asc' | 'price-desc'
