import { useState, useEffect } from 'react'
import {
  CalendarDays,
  Flame,
  Scale,
  Plus,
  TrendingUp,
  Target,
  CheckCircle2,
  Coffee,
  Utensils,
  Moon,
  Dumbbell,
  Camera,
  Brain,
  FileText,
  Edit3,
  Trash2
} from 'lucide-react'
import { USER_DATA } from '../App'
import { useUserProfile, useUserMeals } from '../hooks/useUserData'
import { useAuth } from '../contexts/AuthContext'
import MealForm from '../components/MealForm'
import type { MealEntry } from '../services/userService'

interface StatCardProps {
  icon: React.ComponentType<any>
  title: string
  value: string | number
  subtitle: string
  progress?: number
  color: string
  trend?: string
  delay?: number
}

function StatCard({ icon: Icon, title, value, subtitle, progress, color, trend, delay = 0 }: StatCardProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  return (
    <div
      className={`stat-card transition-all duration-500 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl bg-gradient-to-r ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend && (
          <div className="flex items-center text-sm text-primary-400 font-semibold">
            <TrendingUp className="w-4 h-4 mr-1" />
            {trend}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="text-3xl font-black text-gray-800">{value}</div>
        <div className="text-sm font-medium text-gray-700">{title}</div>
        <div className="text-xs text-gray-600">{subtitle}</div>

        {progress !== undefined && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-700 mb-1">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="progress-bar">
              <div
                className={`progress-fill bg-gradient-to-r ${color}`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent animate-pulse-slow"></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function QuickAction({ icon: Icon, label, onClick, color }: {
  icon: React.ComponentType<any>
  label: string
  onClick: () => void
  color: string
}) {
  return (
    <button
      onClick={onClick}
      className={`group relative overflow-hidden rounded-xl bg-gradient-to-r ${color} p-4 text-white font-semibold text-sm hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl`}
    >
      <div className="absolute inset-0 bg-white/0 group-hover:bg-gray-100 transition-colors duration-300"></div>
      <div className="relative flex items-center justify-center space-x-2">
        <Icon className="w-5 h-5" />
        <span>{label}</span>
      </div>
    </button>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [isLoaded, setIsLoaded] = useState(false)
  const [selectedDate] = useState(new Date())
  const [showMealForm, setShowMealForm] = useState(false)
  const [editingMeal, setEditingMeal] = useState<MealEntry | null>(null)
  const [streak] = useState(29)

  // Real data from Firestore
  const { profile, loading: profileLoading } = useUserProfile()
  const { meals, dailyTotals, loading: mealsLoading, addMeal, updateMeal, deleteMeal } = useUserMeals(selectedDate)

  // BMR and TDEE calculations
  function calculateBMR(profile: any) {
    // Mifflin-St Jeor Equation
    const { currentWeight, height, age, gender } = profile
    const baseBMR = 10 * currentWeight + 6.25 * height - 5 * age
    return Math.round(gender === 'male' ? baseBMR + 5 : baseBMR - 161)
  }

  function calculateTDEE(bmr: number, activityLevel: string) {
    const multipliers = {
      sedentary: 1.2,
      lightly_active: 1.375,
      moderately_active: 1.55,
      very_active: 1.725,
      extremely_active: 1.9
    }
    return Math.round(bmr * (multipliers[activityLevel as keyof typeof multipliers] || 1.55))
  }

  // Calculated values based on profile
  const bmr = profile ? calculateBMR(profile) : 1680
  const tdee = profile ? calculateTDEE(bmr, profile.activityLevel) : 2352
  const currentCalories = dailyTotals.calories

  // Handle meal operations
  const handleAddMeal = () => {
    setEditingMeal(null)
    setShowMealForm(true)
  }

  const handleEditMeal = (meal: MealEntry) => {
    setEditingMeal(meal)
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
      setEditingMeal(null)
    } catch (error) {
      console.error('Error saving meal:', error)
    }
  }

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  if (!user) {
    return <div className="text-center py-8">Please log in to view your dashboard.</div>
  }

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent"></div>
        <span className="ml-3 text-gray-600">Loading your data...</span>
      </div>
    )
  }

  const weightLost = profile ? profile.startWeight - profile.currentWeight : USER_DATA.startWeight - USER_DATA.currentWeight
  const startDate = profile?.startDate || USER_DATA.startDate
  const targetDate = profile?.targetDate || USER_DATA.targetDate
  const daysInProgress = Math.ceil((new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  const daysRemaining = Math.ceil((targetDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))

  const currentHour = new Date().getHours()
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className={`space-y-8 transition-all duration-1000 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
      {/* Hero Section */}
      <div className="glass-morphism p-8 text-center">
        <div className="flex items-center justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full blur-xl animate-pulse-slow"></div>
            <div className="relative p-6 rounded-full bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500 shadow-2xl">
              <Target className="w-10 h-10 text-white" />
            </div>
          </div>
        </div>

        <h1 className="text-4xl font-black gradient-text mb-2">
          {greeting}, {profile?.displayName || 'Akhil'}! 💪
        </h1>
        <p className="text-xl font-semibold text-gray-800 mb-4">
          🔥 {streak}-day streak • Day {daysInProgress} of your transformation
        </p>
        <div className="text-lg text-gray-700">
          {weightLost.toFixed(1)}kg lost • {daysRemaining} days to goal
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Utensils}
          title="Calories Today"
          value={`${currentCalories}/${profile?.dailyCalories || USER_DATA.dailyCalories}`}
          subtitle={`${(profile?.dailyCalories || USER_DATA.dailyCalories) - currentCalories} calories remaining`}
          progress={(currentCalories / (profile?.dailyCalories || USER_DATA.dailyCalories)) * 100}
          color="from-primary-500 to-primary-600"
          delay={100}
        />

        <StatCard
          icon={Flame}
          title="Calorie Deficit"
          value={`${tdee - currentCalories}`}
          subtitle={`BMR: ${bmr} | TDEE: ${tdee}`}
          progress={((tdee - currentCalories) / 1000) * 100}
          color="from-secondary-500 to-secondary-600"
          trend="+320 burned"
          delay={200}
        />

        <StatCard
          icon={Dumbbell}
          title="Workout Status"
          value="Completed"
          subtitle="Upper Body • 45 minutes"
          progress={100}
          color="from-accent-500 to-accent-600"
          delay={300}
        />

        <StatCard
          icon={Scale}
          title="Current Weight"
          value={`${profile?.currentWeight || USER_DATA.currentWeight}kg`}
          subtitle={`${weightLost.toFixed(1)}kg lost`}
          color="from-purple-500 to-purple-600"
          trend="-0.7kg"
          delay={400}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calorie Trend Chart */}
        <div className="glass-morphism p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800">7-Day Calorie Trend</h3>
            <select className="bg-gray-100 border border-gray-200 rounded-lg px-3 py-1 text-gray-800 text-sm">
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
            </select>
          </div>

          <div className="h-64 flex items-center justify-center text-gray-600">
            📊 Chart showing last 7 days calorie intake vs target
          </div>
        </div>

        {/* Weight Progress Chart */}
        <div className="glass-morphism p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800">Weight Progress</h3>
            <div className="text-sm text-gray-600">Goal: {profile?.goalWeight || USER_DATA.goalWeight}kg</div>
          </div>

          <div className="h-64 flex items-center justify-center text-gray-600">
            📈 Weight progress chart coming soon
          </div>
        </div>
      </div>

      {/* Today's Summary and Macros */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Meals */}
        <div className="lg:col-span-2 glass-morphism p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
            <CalendarDays className="w-5 h-5 mr-2" />
            Today's Meals
          </h3>

          <div className="space-y-4">
            {mealsLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-500 border-t-transparent mx-auto"></div>
                <p className="text-gray-600 text-sm mt-2">Loading meals...</p>
              </div>
            ) : meals.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-500 mb-4">No meals logged for today</p>
                <button
                  onClick={handleAddMeal}
                  className="btn-primary inline-flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Meal
                </button>
              </div>
            ) : (
              meals.map((meal) => {
                const mealIcons = {
                  breakfast: Coffee,
                  lunch: Utensils,
                  dinner: Moon,
                  snack: Scale
                };
                const Icon = mealIcons[meal.mealType] || Utensils;

                return (
                  <div key={meal.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 group hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-3">
                      <Icon className="w-5 h-5 text-accent-400" />
                      <div>
                        <div className="font-semibold text-gray-800 capitalize">{meal.mealType}</div>
                        <div className="text-sm text-gray-600">
                          {meal.foodName} • {meal.calories} cal • {meal.quantity} {meal.unit}
                        </div>
                        <div className="text-xs text-gray-500">
                          P: {meal.protein}g • C: {meal.carbs}g • F: {meal.fat}g
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-5 h-5 text-primary-400" />
                      <div className="opacity-0 group-hover:opacity-100 flex space-x-1 transition-opacity">
                        <button
                          onClick={() => handleEditMeal(meal)}
                          className="p-1 hover:bg-gray-200 rounded text-gray-600 hover:text-gray-800"
                          title="Edit meal"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteMeal(meal.id!)}
                          className="p-1 hover:bg-red-100 rounded text-gray-600 hover:text-red-600"
                          title="Delete meal"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {meals.length > 0 && (
              <button
                onClick={handleAddMeal}
                className="w-full p-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-gray-400 hover:text-gray-800 transition-colors flex items-center justify-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Another Meal
              </button>
            )}
          </div>
        </div>

        {/* Macro Breakdown */}
        <div className="glass-morphism p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-6">Today's Macros</h3>

          <div className="space-y-4">
            {[
              { name: 'Protein', value: dailyTotals.protein, target: profile?.dailyProtein || 150, color: '#3b82f6' },
              { name: 'Carbs', value: dailyTotals.carbs, target: 180, color: '#f59e0b' },
              { name: 'Fat', value: dailyTotals.fat, target: 50, color: '#8b5cf6' }
            ].map((macro) => (
              <div key={macro.name}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-gray-800">{macro.name}</span>
                  <span className="text-sm text-gray-700">{Math.round(macro.value)}g/{macro.target}g</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${Math.min((macro.value / macro.target) * 100, 100)}%`,
                      backgroundColor: macro.color
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent animate-pulse-slow"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-primary-500/20 rounded-xl border border-primary-500/30">
            <div className="text-sm font-semibold text-primary-300 mb-1">Protein Goal</div>
            <div className="text-xs text-gray-700">
              You need {Math.max(0, (profile?.dailyProtein || 150) - dailyTotals.protein)}g more protein today
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="glass-morphism p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-6">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickAction
            icon={Plus}
            label="Log Meal"
            onClick={handleAddMeal}
            color="from-primary-600 to-primary-700"
          />
          <QuickAction
            icon={Camera}
            label="Body Scan"
            onClick={() => {/* AI body scan */}}
            color="from-secondary-600 to-secondary-700"
          />
          <QuickAction
            icon={Dumbbell}
            label="Start Workout"
            onClick={() => {/* Navigate to workouts */}}
            color="from-accent-600 to-accent-700"
          />
          <QuickAction
            icon={Scale}
            label="Log Weight"
            onClick={() => {/* Navigate to progress */}}
            color="from-purple-600 to-purple-700"
          />
        </div>
      </div>

      {/* AI Body Analysis & Progress Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Body Analysis */}
        <div className="glass-morphism p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
            <Brain className="w-5 h-5 mr-2" />
            AI Body Analysis
          </h3>
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-primary-500/20 to-secondary-500/20 rounded-xl border border-primary-500/30">
              <div className="text-sm font-semibold text-primary-300 mb-2">Last Scan: 2 days ago</div>
              <div className="text-gray-700 text-sm space-y-1">
                <div>• Body Fat: 18.2% (-0.8%)</div>
                <div>• Muscle Mass: 65.3kg (+1.2kg)</div>
                <div>• Visceral Fat: Level 8 (Healthy)</div>
                <div>• Metabolic Age: 26 years</div>
              </div>
            </div>
            <button className="w-full btn-primary flex items-center justify-center">
              <Camera className="w-5 h-5 mr-2" />
              Take New Body Scan
            </button>
          </div>
        </div>

        {/* Progress Notes */}
        <div className="glass-morphism p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Progress Notes
          </h3>
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-600 mb-1">Today</div>
              <div className="text-sm text-gray-700">Feeling strong! Hit new PR on deadlifts. Energy levels high.</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-600 mb-1">Yesterday</div>
              <div className="text-sm text-gray-700">Abs starting to show definition. Stayed under calorie target.</div>
            </div>
            <textarea
              className="w-full input-field text-sm h-20 resize-none"
              placeholder="Add today's progress note..."
            />
          </div>
        </div>
      </div>

      {/* Meal Form Modal */}
      {showMealForm && (
        <MealForm
          onSubmit={handleMealSubmit}
          onClose={() => {
            setShowMealForm(false)
            setEditingMeal(null)
          }}
          initialData={editingMeal || undefined}
          date={selectedDate}
        />
      )}
    </div>
  )
}