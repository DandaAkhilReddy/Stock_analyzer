import { useState, useEffect } from 'react'
import {
  Search,
  Plus,
  Utensils,
  Coffee,
  Moon,
  Apple,
  Flame,
  Scale,
  ChefHat,
  Star,
  Filter,
  Calendar,
  CheckCircle2,
  X,
  Edit3,
  Trash2,
  Clock
} from 'lucide-react'
import { useUserMeals } from '../hooks/useUserData'
import { useAuth } from '../contexts/AuthContext'
import MealForm from '../components/MealForm'
import LoadingState from '../components/LoadingState'
import type { MealEntry } from '../services/userService'

// Enhanced Indian Vegetarian Food Database
const VEGETARIAN_FOODS = [
  // High Protein Breakfast
  { id: 1, name: 'Protein Oats Bowl', category: 'breakfast', calories: 320, protein: 22, carbs: 45, fat: 8, fiber: 10, serving: '1 bowl', tags: ['high-protein', 'fiber-rich'], rating: 4.8, image: '🥣' },
  { id: 2, name: 'Moong Dal Cheela', category: 'breakfast', calories: 180, protein: 12, carbs: 20, fat: 5, fiber: 6, serving: '2 pieces', tags: ['protein', 'traditional'], rating: 4.5, image: '🥞' },
  { id: 3, name: 'Paneer Scramble', category: 'breakfast', calories: 250, protein: 18, carbs: 8, fat: 16, fiber: 2, serving: '1 plate', tags: ['high-protein', 'keto-friendly'], rating: 4.6, image: '🍳' },
  { id: 4, name: 'Quinoa Upma', category: 'breakfast', calories: 220, protein: 9, carbs: 35, fat: 5, fiber: 4, serving: '1 bowl', tags: ['superfood', 'protein'], rating: 4.4, image: '🍚' },
  { id: 5, name: 'Greek Yogurt Parfait', category: 'breakfast', calories: 200, protein: 20, carbs: 18, fat: 6, fiber: 4, serving: '1 cup', tags: ['probiotics', 'protein'], rating: 4.7, image: '🥛' },

  // High Protein Lunch
  { id: 6, name: 'Dal Makhani', category: 'lunch', calories: 280, protein: 18, carbs: 22, fat: 12, fiber: 10, serving: '1 bowl', tags: ['protein-rich', 'comfort'], rating: 4.9, image: '🍲' },
  { id: 7, name: 'Rajma Masala', category: 'lunch', calories: 260, protein: 16, carbs: 28, fat: 8, fiber: 12, serving: '1 bowl', tags: ['protein', 'fiber'], rating: 4.6, image: '🫘' },
  { id: 8, name: 'Chole Bhature (1 piece)', category: 'lunch', calories: 220, protein: 12, carbs: 30, fat: 6, fiber: 8, serving: '1 serving', tags: ['protein', 'traditional'], rating: 4.5, image: '🫓' },
  { id: 9, name: 'Paneer Tikka Masala', category: 'lunch', calories: 320, protein: 22, carbs: 15, fat: 20, fiber: 3, serving: '1 bowl', tags: ['high-protein', 'rich'], rating: 4.8, image: '🧀' },
  { id: 10, name: 'Tofu Vegetable Curry', category: 'lunch', calories: 200, protein: 15, carbs: 18, fat: 8, fiber: 5, serving: '1 bowl', tags: ['vegan', 'protein'], rating: 4.3, image: '🥘' },
  { id: 11, name: 'Sprouted Moong Curry', category: 'lunch', calories: 180, protein: 14, carbs: 22, fat: 4, fiber: 8, serving: '1 bowl', tags: ['protein', 'digestive'], rating: 4.4, image: '🌱' },

  // High Protein Dinner
  { id: 12, name: 'Quinoa Protein Bowl', category: 'dinner', calories: 300, protein: 16, carbs: 40, fat: 8, fiber: 6, serving: '1 bowl', tags: ['complete-protein', 'superfood'], rating: 4.5, image: '🥗' },
  { id: 13, name: 'Palak Paneer', category: 'dinner', calories: 250, protein: 18, carbs: 12, fat: 16, fiber: 4, serving: '1 bowl', tags: ['iron', 'protein'], rating: 4.7, image: '🥬' },
  { id: 14, name: 'Chana Masala', category: 'dinner', calories: 220, protein: 12, carbs: 32, fat: 5, fiber: 10, serving: '1 bowl', tags: ['protein', 'fiber'], rating: 4.4, image: '🫛' },
  { id: 15, name: 'Soy Chunk Curry', category: 'dinner', calories: 240, protein: 20, carbs: 15, fat: 10, fiber: 6, serving: '1 bowl', tags: ['high-protein', 'meat-substitute'], rating: 4.3, image: '🍖' },

  // High Protein Snacks
  { id: 16, name: 'Roasted Chickpeas', category: 'snack', calories: 120, protein: 8, carbs: 18, fat: 3, fiber: 6, serving: '30g', tags: ['crunchy', 'protein'], rating: 4.2, image: '🫛' },
  { id: 17, name: 'Protein Smoothie', category: 'snack', calories: 180, protein: 25, carbs: 15, fat: 4, fiber: 3, serving: '1 glass', tags: ['high-protein', 'quick'], rating: 4.6, image: '🥤' },
  { id: 18, name: 'Peanut Butter Toast', category: 'snack', calories: 220, protein: 12, carbs: 20, fat: 12, fiber: 4, serving: '2 slices', tags: ['protein', 'satisfying'], rating: 4.4, image: '🥪' },
  { id: 19, name: 'Mixed Nuts Bowl', category: 'snack', calories: 200, protein: 8, carbs: 8, fat: 16, fiber: 4, serving: '30g', tags: ['healthy-fats', 'protein'], rating: 4.5, image: '🥜' },
  { id: 20, name: 'Cottage Cheese Salad', category: 'snack', calories: 150, protein: 15, carbs: 8, fat: 6, fiber: 3, serving: '1 bowl', tags: ['fresh', 'protein'], rating: 4.3, image: '🥗' }
]

const MEAL_CATEGORIES = [
  { id: 'all', name: 'All Meals', icon: Utensils, color: 'bg-gray-500' },
  { id: 'breakfast', name: 'Breakfast', icon: Coffee, color: 'bg-orange-500' },
  { id: 'lunch', name: 'Lunch', icon: Utensils, color: 'bg-green-500' },
  { id: 'dinner', name: 'Dinner', icon: Moon, color: 'bg-purple-500' },
  { id: 'snack', name: 'Snacks', icon: Apple, color: 'bg-red-500' }
]

export default function MealPlanner() {
  const { user } = useAuth()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showMealForm, setShowMealForm] = useState(false)
  const [selectedFood, setSelectedFood] = useState<typeof VEGETARIAN_FOODS[0] | null>(null)
  const [editingMeal, setEditingMeal] = useState<MealEntry | null>(null)

  // Real data from Firestore
  const { meals, dailyTotals, loading, addMeal, updateMeal, deleteMeal } = useUserMeals(selectedDate)

  // Filter foods based on category and search
  const filteredFoods = VEGETARIAN_FOODS.filter(food => {
    const matchesCategory = selectedCategory === 'all' || food.category === selectedCategory
    const matchesSearch = food.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         food.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  // Group meals by type
  const mealsByType = meals.reduce((acc, meal) => {
    if (!acc[meal.mealType]) acc[meal.mealType] = []
    acc[meal.mealType].push(meal)
    return acc
  }, {} as Record<string, MealEntry[]>)

  const handleAddFood = (food: typeof VEGETARIAN_FOODS[0]) => {
    setSelectedFood(food)
    setEditingMeal(null)
    setShowMealForm(true)
  }

  const handleEditMeal = (meal: MealEntry) => {
    setEditingMeal(meal)
    setSelectedFood(null)
    setShowMealForm(true)
  }

  const handleDeleteMeal = async (mealId: string) => {
    if (window.confirm('Are you sure you want to delete this meal?')) {
      try {
        await deleteMeal(mealId)
      } catch (error) {
        console.error('Error deleting meal:', error)
      }
    }
  }

  const handleMealSubmit = async (mealData: Omit<MealEntry, 'id' | 'userId' | 'createdAt'>) => {
    try {
      if (editingMeal) {
        await updateMeal(editingMeal.id!, mealData)
      } else {
        await addMeal(mealData)
      }
      setShowMealForm(false)
      setSelectedFood(null)
      setEditingMeal(null)
    } catch (error) {
      console.error('Error saving meal:', error)
    }
  }

  const getInitialMealData = () => {
    if (selectedFood) {
      return {
        date: selectedDate,
        mealType: selectedFood.category as any,
        foodName: selectedFood.name,
        calories: selectedFood.calories,
        protein: selectedFood.protein,
        carbs: selectedFood.carbs,
        fat: selectedFood.fat,
        quantity: 1,
        unit: selectedFood.serving
      }
    }
    return undefined
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Please sign in to access Meal Planner</h2>
        <p className="text-gray-600">Sign in to track your meals and nutrition goals.</p>
      </div>
    )
  }

  return (
    <LoadingState isLoading={loading} error={null}>
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-black gradient-text mb-2">Meal Planner</h1>
          <p className="text-xl text-gray-700">Plan your vegetarian protein-rich meals</p>
        </div>

        {/* Date Selection & Daily Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Date Picker */}
          <div className="glass-morphism p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Calendar className="w-5 h-5 text-primary-500" />
              <h3 className="text-lg font-bold text-gray-800">Select Date</h3>
            </div>
            <input
              type="date"
              value={selectedDate.toISOString().split('T')[0]}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              className="w-full input-field"
            />
          </div>

          {/* Daily Nutrition Summary */}
          <div className="lg:col-span-2 glass-morphism p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Today's Nutrition</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-500">{dailyTotals.calories}</div>
                <div className="text-sm text-gray-600">Calories</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500">{Math.round(dailyTotals.protein)}g</div>
                <div className="text-sm text-gray-600">Protein</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">{Math.round(dailyTotals.carbs)}g</div>
                <div className="text-sm text-gray-600">Carbs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-500">{Math.round(dailyTotals.fat)}g</div>
                <div className="text-sm text-gray-600">Fat</div>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Meals */}
        <div className="glass-morphism p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-6">Today's Meals</h3>

          {meals.length === 0 ? (
            <div className="text-center py-8">
              <Utensils className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No meals logged for today</p>
              <button
                onClick={() => setShowMealForm(true)}
                className="btn-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Meal
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {MEAL_CATEGORIES.slice(1).map(category => {
                const categoryMeals = mealsByType[category.id] || []
                return (
                  <div key={category.id} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${category.color}`}>
                          <category.icon className="w-5 h-5 text-white" />
                        </div>
                        <h4 className="text-lg font-semibold text-gray-800 capitalize">{category.name}</h4>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedFood({ ...VEGETARIAN_FOODS[0], category: category.id as any })
                          setShowMealForm(true)
                        }}
                        className="btn-secondary text-sm"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add {category.name}
                      </button>
                    </div>

                    {categoryMeals.length === 0 ? (
                      <div className="bg-gray-50 rounded-xl p-4 text-center">
                        <p className="text-gray-500 text-sm">No {category.name.toLowerCase()} logged</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {categoryMeals.map(meal => (
                          <div key={meal.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl group hover:bg-gray-100 transition-colors">
                            <div className="flex items-center space-x-3">
                              <div className="text-2xl">🍽️</div>
                              <div>
                                <div className="font-semibold text-gray-800">{meal.foodName}</div>
                                <div className="text-sm text-gray-600">
                                  {meal.calories} cal • {meal.protein}g protein • {meal.quantity} {meal.unit}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="text-sm text-gray-500">
                                <Clock className="w-4 h-4 inline mr-1" />
                                {meal.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                              <div className="opacity-0 group-hover:opacity-100 flex space-x-1 transition-opacity">
                                <button
                                  onClick={() => handleEditMeal(meal)}
                                  className="p-2 hover:bg-gray-200 rounded-lg text-gray-600 hover:text-gray-800"
                                  title="Edit meal"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteMeal(meal.id!)}
                                  className="p-2 hover:bg-red-100 rounded-lg text-gray-600 hover:text-red-600"
                                  title="Delete meal"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Food Database */}
        <div className="glass-morphism p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800">Vegetarian Food Database</h3>
            <div className="text-sm text-gray-600">
              {filteredFoods.length} foods available
            </div>
          </div>

          {/* Search and Filter */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search foods, ingredients, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 input-field"
              />
            </div>

            <div className="flex space-x-2 overflow-x-auto">
              {MEAL_CATEGORIES.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <category.icon className="w-4 h-4" />
                  <span>{category.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Food Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFoods.map(food => (
              <div key={food.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-shadow group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="text-3xl">{food.image}</div>
                    <div>
                      <h4 className="font-semibold text-gray-800">{food.name}</h4>
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i < Math.floor(food.rating)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                        <span className="text-xs text-gray-500 ml-1">({food.rating})</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddFood(food)}
                    className="opacity-0 group-hover:opacity-100 btn-primary text-sm px-3 py-1 transition-opacity"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                  <div className="flex items-center space-x-1">
                    <Flame className="w-3 h-3 text-orange-500" />
                    <span>{food.calories} cal</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <ChefHat className="w-3 h-3 text-blue-500" />
                    <span>{food.protein}g protein</span>
                  </div>
                  <div className="text-gray-600">Carbs: {food.carbs}g</div>
                  <div className="text-gray-600">Fat: {food.fat}g</div>
                </div>

                <div className="flex flex-wrap gap-1 mb-3">
                  {food.tags.slice(0, 2).map(tag => (
                    <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="text-xs text-gray-500">
                  Serving: {food.serving}
                </div>
              </div>
            ))}
          </div>

          {filteredFoods.length === 0 && (
            <div className="text-center py-8">
              <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No foods found matching your search.</p>
            </div>
          )}
        </div>

        {/* Meal Form Modal */}
        {showMealForm && (
          <MealForm
            onSubmit={handleMealSubmit}
            onClose={() => {
              setShowMealForm(false)
              setSelectedFood(null)
              setEditingMeal(null)
            }}
            initialData={editingMeal || getInitialMealData()}
            date={selectedDate}
          />
        )}
      </div>
    </LoadingState>
  )
}