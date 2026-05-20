export type Unit =
  | 'tsp'
  | 'tbsp'
  | 'cup'
  | 'ml'
  | 'l'
  | 'g'
  | 'kg'
  | 'oz'
  | 'lb'
  | 'piece'
  | 'pinch'
  | 'clove'
  | 'slice'

export type SourceType = 'youtube' | 'audio' | 'video' | 'pdf' | 'image' | 'url'

export interface Ingredient {
  name: string
  quantity: string
  unit: Unit
}

export interface RecipeStep {
  step: string
  time: number | null
}

export interface Recipe {
  id: string
  name: string
  cooking_time: number | null
  ingredients: Ingredient[]
  recipe_steps: RecipeStep[]
}

export interface PaginatedRecipes {
  recipes: Recipe[]
  page: number
  limit: number
  offset: number
  total: number
}
