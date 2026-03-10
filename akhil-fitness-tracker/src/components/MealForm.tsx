import { useState } from 'react';
import { X, Plus, Search } from 'lucide-react';
import type { MealEntry } from '../services/userService';

interface MealFormProps {
  onSubmit: (meal: Omit<MealEntry, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  onClose: () => void;
  initialData?: Partial<MealEntry>;
  date: Date;
}

const COMMON_FOODS = [
  { name: 'Chapati', calories: 104, protein: 3.1, carbs: 15.6, fat: 3.7, unit: 'piece' },
  { name: 'Rice (cooked)', calories: 130, protein: 2.7, carbs: 28, fat: 0.3, unit: 'cup' },
  { name: 'Dal Tadka', calories: 180, protein: 9, carbs: 25, fat: 6, unit: 'cup' },
  { name: 'Paneer', calories: 321, protein: 25, carbs: 1.2, fat: 25, unit: '100g' },
  { name: 'Banana', calories: 89, protein: 1.1, carbs: 23, fat: 0.3, unit: 'medium' },
  { name: 'Apple', calories: 52, protein: 0.3, carbs: 14, fat: 0.2, unit: 'medium' },
  { name: 'Almonds', calories: 579, protein: 21, carbs: 22, fat: 50, unit: '100g' },
  { name: 'Greek Yogurt', calories: 59, protein: 10, carbs: 3.6, fat: 0.4, unit: '100g' },
];

export default function MealForm({ onSubmit, onClose, initialData, date }: MealFormProps) {
  const [formData, setFormData] = useState({
    date: date,
    mealType: initialData?.mealType || 'breakfast' as const,
    foodName: initialData?.foodName || '',
    calories: initialData?.calories || 0,
    protein: initialData?.protein || 0,
    carbs: initialData?.carbs || 0,
    fat: initialData?.fat || 0,
    quantity: initialData?.quantity || 1,
    unit: initialData?.unit || 'serving'
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filteredFoods = COMMON_FOODS.filter(food =>
    food.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectFood = (food: typeof COMMON_FOODS[0]) => {
    setFormData(prev => ({
      ...prev,
      foodName: food.name,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      unit: food.unit
    }));
    setSearchTerm('');
    setShowSuggestions(false);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.foodName.trim()) {
      newErrors.foodName = 'Food name is required';
    }
    if (formData.calories <= 0) {
      newErrors.calories = 'Calories must be greater than 0';
    }
    if (formData.quantity <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Error submitting meal:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">
            {initialData ? 'Edit Meal' : 'Add Meal'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Meal Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Meal Type
            </label>
            <select
              value={formData.mealType}
              onChange={(e) => setFormData(prev => ({ ...prev, mealType: e.target.value as any }))}
              className="w-full input-field"
            >
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snack">Snack</option>
            </select>
          </div>

          {/* Food Name with Search */}
          <div className="relative">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Food Name
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.foodName}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, foodName: e.target.value }));
                  setSearchTerm(e.target.value);
                  setShowSuggestions(e.target.value.length > 0);
                }}
                className={`w-full input-field pr-10 ${errors.foodName ? 'border-red-500' : ''}`}
                placeholder="Enter food name or search..."
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
            {errors.foodName && (
              <p className="text-red-500 text-sm mt-1">{errors.foodName}</p>
            )}

            {/* Food Suggestions */}
            {showSuggestions && filteredFoods.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {filteredFoods.map((food, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => selectFood(food)}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 flex justify-between items-center"
                  >
                    <div>
                      <div className="font-medium text-gray-800">{food.name}</div>
                      <div className="text-sm text-gray-500">
                        {food.calories} cal per {food.unit}
                      </div>
                    </div>
                    <Plus className="w-4 h-4 text-gray-400" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quantity and Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Quantity
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                className={`w-full input-field ${errors.quantity ? 'border-red-500' : ''}`}
              />
              {errors.quantity && (
                <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Unit
              </label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                className="w-full input-field"
                placeholder="e.g., cup, piece, gram"
              />
            </div>
          </div>

          {/* Nutrition Information */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-700">Nutrition per serving</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Calories
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.calories}
                  onChange={(e) => setFormData(prev => ({ ...prev, calories: parseInt(e.target.value) || 0 }))}
                  className={`w-full input-field ${errors.calories ? 'border-red-500' : ''}`}
                />
                {errors.calories && (
                  <p className="text-red-500 text-sm mt-1">{errors.calories}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Protein (g)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.protein}
                  onChange={(e) => setFormData(prev => ({ ...prev, protein: parseFloat(e.target.value) || 0 }))}
                  className="w-full input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Carbs (g)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.carbs}
                  onChange={(e) => setFormData(prev => ({ ...prev, carbs: parseFloat(e.target.value) || 0 }))}
                  className="w-full input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Fat (g)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.fat}
                  onChange={(e) => setFormData(prev => ({ ...prev, fat: parseFloat(e.target.value) || 0 }))}
                  className="w-full input-field"
                />
              </div>
            </div>
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
              className="flex-1 btn-primary disabled:opacity-50"
            >
              {loading ? 'Saving...' : initialData ? 'Update Meal' : 'Add Meal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}