/**
 * ReddyFit API Service
 * Handles all communication with Python ML Backend
 */

import { auth } from '../config/firebase'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

/**
 * Get authentication headers with Firebase token
 */
async function getAuthHeaders(): Promise<HeadersInit> {
  const token = await auth.currentUser?.getIdToken()
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
}

/**
 * Handle API errors
 */
function handleApiError(error: any): never {
  console.error('API Error:', error)
  throw new Error(error.message || 'An error occurred while communicating with the server')
}

// ============================================================================
// RECIPE API
// ============================================================================

export interface Recipe {
  id?: string
  name: string
  description: string
  ingredients: Array<{
    name: string
    amount: string
    unit: string
  }>
  instructions: string[]
  nutritionInfo: {
    calories: number
    protein: number
    carbs: number
    fat: number
    fiber?: number
  }
  prepTime: number
  cookTime: number
  servings: number
  category: string
  tags: string[]
  isPublic: boolean
  userId?: string
  createdAt?: Date
  imageUrl?: string
}

export const recipeAPI = {
  /**
   * Create a new custom recipe
   */
  async createRecipe(recipe: Recipe): Promise<Recipe> {
    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_URL}/api/recipes`, {
        method: 'POST',
        headers,
        body: JSON.stringify(recipe)
      })

      if (!response.ok) {
        throw new Error(`Failed to create recipe: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      return handleApiError(error)
    }
  },

  /**
   * Get all recipes (paginated)
   */
  async getRecipes(page: number = 1, limit: number = 20): Promise<Recipe[]> {
    try {
      const headers = await getAuthHeaders()
      const response = await fetch(
        `${API_URL}/api/recipes?page=${page}&limit=${limit}`,
        { headers }
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch recipes: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      return handleApiError(error)
    }
  },

  /**
   * Get user's custom recipes
   */
  async getMyRecipes(): Promise<Recipe[]> {
    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_URL}/api/recipes/my-recipes`, {
        headers
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch your recipes: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      return handleApiError(error)
    }
  },

  /**
   * Get a specific recipe by ID
   */
  async getRecipe(id: string): Promise<Recipe> {
    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_URL}/api/recipes/${id}`, {
        headers
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch recipe: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      return handleApiError(error)
    }
  },

  /**
   * Update an existing recipe
   */
  async updateRecipe(id: string, recipe: Partial<Recipe>): Promise<Recipe> {
    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_URL}/api/recipes/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(recipe)
      })

      if (!response.ok) {
        throw new Error(`Failed to update recipe: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      return handleApiError(error)
    }
  },

  /**
   * Delete a recipe
   */
  async deleteRecipe(id: string): Promise<void> {
    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_URL}/api/recipes/${id}`, {
        method: 'DELETE',
        headers
      })

      if (!response.ok) {
        throw new Error(`Failed to delete recipe: ${response.statusText}`)
      }
    } catch (error) {
      return handleApiError(error)
    }
  },

  /**
   * Search recipes
   */
  async searchRecipes(
    query: string,
    filters?: {
      category?: string
      maxCalories?: number
      minProtein?: number
      tags?: string[]
    }
  ): Promise<Recipe[]> {
    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_URL}/api/recipes/search`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query, filters })
      })

      if (!response.ok) {
        throw new Error(`Failed to search recipes: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      return handleApiError(error)
    }
  }
}

// ============================================================================
// ML RECOMMENDATIONS API
// ============================================================================

export interface WorkoutRecommendation {
  workout: {
    name: string
    exercises: Array<{
      name: string
      sets: number
      reps: number
      restTime: number
      notes?: string
    }>
    estimatedDuration: number
    difficulty: string
    confidence: number
  }
  reasoning: string
}

export interface MealRecommendation {
  meals: Array<{
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
    recipe: Recipe
    nutritionInfo: {
      calories: number
      protein: number
      carbs: number
      fat: number
    }
  }>
  dailyTotals: {
    calories: number
    protein: number
    carbs: number
    fat: number
  }
  confidence: number
}

export const recommendationAPI = {
  /**
   * Get personalized workout recommendation
   */
  async getWorkoutRecommendation(preferences: {
    fitnessLevel: 'beginner' | 'intermediate' | 'advanced'
    goals: string[]
    availableEquipment: string[]
    timeAvailable: number
    preferredMuscleGroups?: string[]
  }): Promise<WorkoutRecommendation> {
    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_URL}/api/recommendations/workout`, {
        method: 'POST',
        headers,
        body: JSON.stringify(preferences)
      })

      if (!response.ok) {
        throw new Error(`Failed to get workout recommendation: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      return handleApiError(error)
    }
  },

  /**
   * Get personalized meal recommendations
   */
  async getMealRecommendations(preferences: {
    calorieTarget: number
    dietaryRestrictions?: string[]
    preferredCuisines?: string[]
    macroRatios?: {
      protein: number
      carbs: number
      fat: number
    }
    mealsPerDay?: number
  }): Promise<MealRecommendation> {
    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_URL}/api/recommendations/meal`, {
        method: 'POST',
        headers,
        body: JSON.stringify(preferences)
      })

      if (!response.ok) {
        throw new Error(`Failed to get meal recommendations: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      return handleApiError(error)
    }
  },

  /**
   * Find similar users for workout buddy matching
   */
  async findSimilarUsers(limit: number = 10): Promise<Array<{
    userId: string
    name: string
    similarity: number
    commonGoals: string[]
    fitnessLevel: string
  }>> {
    try {
      const headers = await getAuthHeaders()
      const response = await fetch(
        `${API_URL}/api/recommendations/similar-users?limit=${limit}`,
        { headers }
      )

      if (!response.ok) {
        throw new Error(`Failed to find similar users: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      return handleApiError(error)
    }
  }
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

export const healthAPI = {
  /**
   * Check if backend is available
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}/health`)
      return response.ok
    } catch (error) {
      console.warn('Backend health check failed:', error)
      return false
    }
  },

  /**
   * Get backend status
   */
  async getStatus(): Promise<{
    status: string
    service: string
    version: string
    environment: string
  }> {
    try {
      const response = await fetch(`${API_URL}/`)
      if (!response.ok) {
        throw new Error('Backend is not available')
      }
      return await response.json()
    } catch (error) {
      return handleApiError(error)
    }
  }
}

export default {
  recipe: recipeAPI,
  recommendations: recommendationAPI,
  health: healthAPI
}
