import { API_BASE_URL } from '../constants/config'
import { PaginatedRecipes, Recipe, SourceType } from '../types/recipe'

async function request<T>(path: string, token: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })

  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText)
    throw new Error(`API error ${response.status}: ${text}`)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json()
}

export function getRecipes(token: string): Promise<PaginatedRecipes> {
  return request<PaginatedRecipes>('/api/recipe', token)
}

export function getRecipe(id: string, token: string): Promise<Recipe> {
  return request<Recipe>(`/api/recipe/${id}`, token)
}

export function createRecipeFromText(
  body: { recipe_text: string; source_type: SourceType },
  token: string,
): Promise<Recipe> {
  return request<Recipe>('/api/recipe', token, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function createRecipeFromUrl(url: string, token: string): Promise<Recipe> {
  return request<Recipe>('/api/recipe', token, {
    method: 'POST',
    body: JSON.stringify({ recipe_url: url }),
  })
}

export async function createRecipeFromPdf(
  fileUri: string,
  fileName: string | undefined,
  token: string,
): Promise<Recipe> {
  const formData = new FormData()
  formData.append('file', {
    uri: fileUri,
    name: fileName ?? 'recipe.pdf',
    type: 'application/pdf',
  } as unknown as Blob)

  const response = await fetch(`${API_BASE_URL}/api/recipe/pdf`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })

  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText)
    throw new Error(`API error ${response.status}: ${text}`)
  }

  return response.json()
}

export function deleteRecipe(id: string, token: string): Promise<void> {
  return request<void>(`/api/recipe/${id}`, token, { method: 'DELETE' })
}
