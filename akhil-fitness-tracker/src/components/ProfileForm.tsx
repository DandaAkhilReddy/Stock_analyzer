import { useState, useEffect } from 'react'
import { X, User, Save, Calculator } from 'lucide-react'
import type { UserProfile } from '../services/userService'

interface ProfileFormProps {
  profile: UserProfile | null
  onSubmit: (updates: Partial<UserProfile>) => Promise<void>
  onClose: () => void
}

export default function ProfileForm({ profile, onSubmit, onClose }: ProfileFormProps) {
  const [formData, setFormData] = useState({
    displayName: profile?.displayName || '',
    startWeight: profile?.startWeight || 85,
    currentWeight: profile?.currentWeight || 85,
    goalWeight: profile?.goalWeight || 70,
    height: profile?.height || 175,
    age: profile?.age || 28,
    gender: profile?.gender || 'male' as const,
    activityLevel: profile?.activityLevel || 'moderately_active' as const,
    dailyCalories: profile?.dailyCalories || 1800,
    dailyProtein: profile?.dailyProtein || 150,
    targetDate: profile?.targetDate ? profile.targetDate.toISOString().split('T')[0] : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  })

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [calculatedBMR, setCalculatedBMR] = useState(0)
  const [calculatedTDEE, setCalculatedTDEE] = useState(0)

  // Calculate BMR and TDEE when relevant fields change
  useEffect(() => {
    const { currentWeight, height, age, gender, activityLevel } = formData

    // Mifflin-St Jeor Equation
    const baseBMR = 10 * currentWeight + 6.25 * height - 5 * age
    const bmr = gender === 'male' ? baseBMR + 5 : baseBMR - 161

    const multipliers = {
      sedentary: 1.2,
      lightly_active: 1.375,
      moderately_active: 1.55,
      very_active: 1.725,
      extremely_active: 1.9
    }

    const tdee = bmr * (multipliers[activityLevel] || 1.55)

    setCalculatedBMR(Math.round(bmr))
    setCalculatedTDEE(Math.round(tdee))
  }, [formData.currentWeight, formData.height, formData.age, formData.gender, formData.activityLevel])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Display name is required'
    }
    if (formData.startWeight <= 0) {
      newErrors.startWeight = 'Start weight must be greater than 0'
    }
    if (formData.currentWeight <= 0) {
      newErrors.currentWeight = 'Current weight must be greater than 0'
    }
    if (formData.goalWeight <= 0) {
      newErrors.goalWeight = 'Goal weight must be greater than 0'
    }
    if (formData.height <= 0) {
      newErrors.height = 'Height must be greater than 0'
    }
    if (formData.age <= 0 || formData.age > 120) {
      newErrors.age = 'Age must be between 1 and 120'
    }
    if (formData.dailyCalories <= 0) {
      newErrors.dailyCalories = 'Daily calories must be greater than 0'
    }
    if (formData.dailyProtein <= 0) {
      newErrors.dailyProtein = 'Daily protein must be greater than 0'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      setLoading(true)
      await onSubmit({
        ...formData,
        targetDate: new Date(formData.targetDate),
        updatedAt: new Date()
      })
      onClose()
    } catch (error) {
      console.error('Error updating profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const useCalculatedCalories = () => {
    // For weight loss, subtract 500-750 calories from TDEE
    const deficitCalories = Math.round(calculatedTDEE - 600)
    setFormData(prev => ({ ...prev, dailyCalories: deficitCalories }))
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <User className="w-5 h-5 mr-2" />
            Edit Profile
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Personal Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                  className={`w-full input-field ${errors.displayName ? 'border-red-500' : ''}`}
                  placeholder="Your name"
                />
                {errors.displayName && (
                  <p className="text-red-500 text-sm mt-1">{errors.displayName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Age
                </label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={formData.age}
                  onChange={(e) => setFormData(prev => ({ ...prev, age: parseInt(e.target.value) || 0 }))}
                  className={`w-full input-field ${errors.age ? 'border-red-500' : ''}`}
                />
                {errors.age && (
                  <p className="text-red-500 text-sm mt-1">{errors.age}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Gender
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value as 'male' | 'female' }))}
                  className="w-full input-field"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Height (cm)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.height}
                  onChange={(e) => setFormData(prev => ({ ...prev, height: parseInt(e.target.value) || 0 }))}
                  className={`w-full input-field ${errors.height ? 'border-red-500' : ''}`}
                />
                {errors.height && (
                  <p className="text-red-500 text-sm mt-1">{errors.height}</p>
                )}
              </div>
            </div>
          </div>

          {/* Weight Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Weight Goals</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Start Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.startWeight}
                  onChange={(e) => setFormData(prev => ({ ...prev, startWeight: parseFloat(e.target.value) || 0 }))}
                  className={`w-full input-field ${errors.startWeight ? 'border-red-500' : ''}`}
                />
                {errors.startWeight && (
                  <p className="text-red-500 text-sm mt-1">{errors.startWeight}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Current Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.currentWeight}
                  onChange={(e) => setFormData(prev => ({ ...prev, currentWeight: parseFloat(e.target.value) || 0 }))}
                  className={`w-full input-field ${errors.currentWeight ? 'border-red-500' : ''}`}
                />
                {errors.currentWeight && (
                  <p className="text-red-500 text-sm mt-1">{errors.currentWeight}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Goal Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.goalWeight}
                  onChange={(e) => setFormData(prev => ({ ...prev, goalWeight: parseFloat(e.target.value) || 0 }))}
                  className={`w-full input-field ${errors.goalWeight ? 'border-red-500' : ''}`}
                />
                {errors.goalWeight && (
                  <p className="text-red-500 text-sm mt-1">{errors.goalWeight}</p>
                )}
              </div>
            </div>
          </div>

          {/* Activity Level */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Activity Level</h3>
            <select
              value={formData.activityLevel}
              onChange={(e) => setFormData(prev => ({ ...prev, activityLevel: e.target.value as any }))}
              className="w-full input-field"
            >
              <option value="sedentary">Sedentary (little or no exercise)</option>
              <option value="lightly_active">Lightly Active (light exercise 1-3 days/week)</option>
              <option value="moderately_active">Moderately Active (moderate exercise 3-5 days/week)</option>
              <option value="very_active">Very Active (hard exercise 6-7 days/week)</option>
              <option value="extremely_active">Extremely Active (very hard exercise & physical job)</option>
            </select>
          </div>

          {/* Calculated Metrics */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
              <Calculator className="w-5 h-5 mr-2" />
              Calculated Metrics
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-600">BMR (Basal Metabolic Rate)</div>
                <div className="font-semibold text-gray-800">{calculatedBMR} calories/day</div>
              </div>
              <div>
                <div className="text-gray-600">TDEE (Total Daily Energy)</div>
                <div className="font-semibold text-gray-800">{calculatedTDEE} calories/day</div>
              </div>
            </div>
          </div>

          {/* Nutrition Goals */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Nutrition Goals</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Daily Calories
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    min="0"
                    value={formData.dailyCalories}
                    onChange={(e) => setFormData(prev => ({ ...prev, dailyCalories: parseInt(e.target.value) || 0 }))}
                    className={`flex-1 input-field ${errors.dailyCalories ? 'border-red-500' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={useCalculatedCalories}
                    className="btn-secondary text-xs px-3"
                    title="Use calculated calories for weight loss"
                  >
                    Auto
                  </button>
                </div>
                {errors.dailyCalories && (
                  <p className="text-red-500 text-sm mt-1">{errors.dailyCalories}</p>
                )}
                <p className="text-xs text-gray-600 mt-1">
                  Recommended for weight loss: {Math.round(calculatedTDEE - 600)} cal/day
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Daily Protein (g)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.dailyProtein}
                  onChange={(e) => setFormData(prev => ({ ...prev, dailyProtein: parseInt(e.target.value) || 0 }))}
                  className={`w-full input-field ${errors.dailyProtein ? 'border-red-500' : ''}`}
                />
                {errors.dailyProtein && (
                  <p className="text-red-500 text-sm mt-1">{errors.dailyProtein}</p>
                )}
                <p className="text-xs text-gray-600 mt-1">
                  Recommended: {Math.round(formData.currentWeight * 2.2)}g (2.2g per kg body weight)
                </p>
              </div>
            </div>
          </div>

          {/* Target Date */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Target Date</h3>
            <input
              type="date"
              value={formData.targetDate}
              onChange={(e) => setFormData(prev => ({ ...prev, targetDate: e.target.value }))}
              className="w-full input-field"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-primary disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Profile
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}