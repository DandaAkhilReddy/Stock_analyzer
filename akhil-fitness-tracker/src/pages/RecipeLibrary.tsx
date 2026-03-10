import { useState } from 'react'
import {
  Search,
  Clock,
  Users,
  ChefHat,
  Star,
  Bookmark,
  BookmarkCheck,
  Play,
  Heart,
  X,
  Share2,
  PrinterIcon,
  Video,
  Image as ImageIcon,
  Plus,
  Award,
  Zap,
  Target
} from 'lucide-react'
import RecipeMediaUpload from '../components/RecipeMediaUpload'
import { type UploadedMedia } from '../components/MediaUpload'

// Enhanced Recipe Interface with Videos and Professional Features
interface Recipe {
  id: number
  name: string
  category: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  cookTime: number
  prepTime: number
  servings: number
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  rating: number
  reviews: number
  tags: string[]
  image: string
  videoUrl?: string
  videoThumbnail?: string
  description: string
  shortDescription: string
  nutritionBenefits: string[]
  ingredients: string[]
  instructions: string[]
  tips: string[]
  variations: string[]
  chef: {
    name: string
    specialization: string
    avatar: string
  }
  isProteinRich: boolean
  isFeatured: boolean
  createdAt: string
}

// Professional Vegetarian Protein Recipe Database
const RECIPES: Recipe[] = [
  // High-Protein Breakfast Recipes
  {
    id: 1,
    name: 'Protein Power Quinoa Bowl',
    category: 'breakfast',
    difficulty: 'Easy',
    cookTime: 20,
    prepTime: 10,
    servings: 2,
    calories: 420,
    protein: 18,
    carbs: 52,
    fat: 12,
    fiber: 8,
    rating: 4.8,
    reviews: 127,
    tags: ['high-protein', 'quinoa', 'superfood', 'energy-boost', 'complete-protein'],
    image: '/api/placeholder/400/300',
    videoUrl: 'https://example.com/quinoa-bowl-tutorial',
    videoThumbnail: '/api/placeholder/400/225',
    description: 'A complete protein breakfast bowl featuring quinoa, hemp seeds, and Greek yogurt for sustained energy and muscle building.',
    shortDescription: 'Complete protein breakfast bowl with quinoa and Greek yogurt',
    nutritionBenefits: [
      'Complete amino acid profile from quinoa',
      'High in plant-based protein',
      'Rich in fiber for digestive health',
      'Provides sustained energy for workouts'
    ],
    ingredients: [
      '1 cup cooked quinoa',
      '1/2 cup Greek yogurt (plain)',
      '2 tbsp hemp seeds',
      '1 tbsp chia seeds',
      '1/4 cup fresh berries',
      '1 small banana, sliced',
      '2 tbsp almond butter',
      '1 tsp honey or maple syrup',
      '1/4 cup chopped almonds',
      '1/2 tsp cinnamon powder'
    ],
    instructions: [
      'Cook quinoa according to package instructions and let it cool',
      'In a bowl, layer the cooked quinoa as the base',
      'Add a dollop of Greek yogurt on top',
      'Sprinkle hemp seeds and chia seeds evenly',
      'Arrange fresh berries and banana slices',
      'Drizzle almond butter and honey on top',
      'Garnish with chopped almonds and cinnamon',
      'Serve immediately for best texture'
    ],
    tips: [
      'Cook quinoa in advance and store in refrigerator',
      'Use frozen berries if fresh ones are not available',
      'Add a scoop of protein powder for extra protein boost',
      'Vary toppings based on seasonal fruits'
    ],
    variations: [
      'Chocolate version: Add cacao powder and dark chocolate chips',
      'Tropical version: Use mango, coconut flakes, and cashews',
      'Savory version: Add avocado, tomatoes, and tahini'
    ],
    chef: {
      name: 'Chef Priya Sharma',
      specialization: 'Plant-Based Nutrition',
      avatar: '/api/placeholder/60/60'
    },
    isProteinRich: true,
    isFeatured: true,
    createdAt: '2024-01-15'
  },

  {
    id: 2,
    name: 'Lentil Power Pancakes',
    category: 'breakfast',
    difficulty: 'Medium',
    cookTime: 15,
    prepTime: 5,
    servings: 3,
    calories: 380,
    protein: 22,
    carbs: 45,
    fat: 10,
    fiber: 12,
    rating: 4.7,
    reviews: 89,
    tags: ['high-protein', 'lentils', 'pancakes', 'muscle-building', 'fiber-rich'],
    image: '/api/placeholder/400/300',
    videoUrl: 'https://example.com/lentil-pancakes-tutorial',
    videoThumbnail: '/api/placeholder/400/225',
    description: 'Fluffy protein-packed pancakes made with red lentils and oats, perfect for post-workout nutrition.',
    shortDescription: 'High-protein pancakes made with red lentils and oats',
    nutritionBenefits: [
      '22g plant-based protein per serving',
      'Rich in iron and folate from lentils',
      'High fiber content for satiety',
      'Complex carbs for sustained energy'
    ],
    ingredients: [
      '1 cup red lentils (soaked for 2 hours)',
      '1/2 cup rolled oats',
      '1/4 cup Greek yogurt',
      '1 small banana',
      '1 tsp baking powder',
      '1/2 tsp vanilla extract',
      '1/4 tsp salt',
      '1/2 tsp cinnamon',
      '2-3 tbsp water (as needed)',
      '1 tsp coconut oil for cooking'
    ],
    instructions: [
      'Drain and rinse the soaked red lentils',
      'In a blender, combine lentils, oats, and banana',
      'Add Greek yogurt, baking powder, vanilla, salt, and cinnamon',
      'Blend until smooth, adding water if needed for consistency',
      'Let batter rest for 5 minutes to thicken',
      'Heat a non-stick pan with coconut oil over medium heat',
      'Pour 1/4 cup batter per pancake',
      'Cook for 2-3 minutes until bubbles form, then flip',
      'Cook for another 2 minutes until golden brown',
      'Serve hot with fresh fruits and maple syrup'
    ],
    tips: [
      'Soak lentils overnight for easier blending',
      "Don't over-mix the batter to keep pancakes fluffy",
      'Cook on medium heat to ensure even cooking',
      'Store leftover batter in refrigerator for up to 2 days'
    ],
    variations: [
      'Chocolate version: Add 2 tbsp cocoa powder',
      'Protein boost: Add 1 scoop vanilla protein powder',
      'Spiced version: Add cardamom and nutmeg'
    ],
    chef: {
      name: 'Chef Arjun Mehta',
      specialization: 'Fitness Nutrition',
      avatar: '/api/placeholder/60/60'
    },
    isProteinRich: true,
    isFeatured: false,
    createdAt: '2024-01-20'
  },

  // High-Protein Lunch Recipes
  {
    id: 3,
    name: 'Triple Bean Power Salad',
    category: 'lunch',
    difficulty: 'Easy',
    cookTime: 0,
    prepTime: 15,
    servings: 2,
    calories: 450,
    protein: 24,
    carbs: 38,
    fat: 18,
    fiber: 16,
    rating: 4.9,
    reviews: 156,
    tags: ['high-protein', 'beans', 'salad', 'raw', 'antioxidants', 'complete-meal'],
    image: '/api/placeholder/400/300',
    videoUrl: 'https://example.com/bean-salad-tutorial',
    videoThumbnail: '/api/placeholder/400/225',
    description: 'A nutrient-dense salad combining three types of beans for complete protein and maximum nutrition.',
    shortDescription: 'Protein-packed salad with chickpeas, kidney beans, and black beans',
    nutritionBenefits: [
      'Complete protein from bean combination',
      'High in folate and iron',
      'Rich in antioxidants and phytonutrients',
      'Excellent source of dietary fiber'
    ],
    ingredients: [
      '1/2 cup cooked chickpeas',
      '1/2 cup cooked kidney beans',
      '1/2 cup cooked black beans',
      '1/4 cup sunflower seeds',
      '2 tbsp pumpkin seeds',
      '1 cup mixed greens (spinach, arugula)',
      '1/2 cucumber, diced',
      '1 small red onion, finely chopped',
      '1/4 cup fresh parsley, chopped',
      'For dressing: 3 tbsp olive oil, 2 tbsp lemon juice, 1 tsp Dijon mustard, 1 clove garlic minced, salt and pepper'
    ],
    instructions: [
      'If using canned beans, drain and rinse thoroughly',
      'In a large bowl, combine all three types of beans',
      'Add diced cucumber, red onion, and fresh parsley',
      'Toast sunflower and pumpkin seeds lightly in a dry pan',
      'Add toasted seeds to the bean mixture',
      'For dressing, whisk together olive oil, lemon juice, Dijon mustard, and minced garlic',
      'Season dressing with salt and pepper to taste',
      'Pour dressing over bean mixture and toss well',
      'Let marinate for 10 minutes for flavors to meld',
      'Serve over a bed of mixed greens'
    ],
    tips: [
      'Use a mix of canned and freshly cooked beans for best texture',
      'Make ahead and let flavors develop in the refrigerator',
      'Add avocado just before serving to prevent browning',
      'Customize with your favorite vegetables and herbs'
    ],
    variations: [
      'Mediterranean: Add feta cheese, olives, and oregano',
      'Mexican: Add corn, tomatoes, and cilantro with lime dressing',
      'Indian: Add curry powder, mint, and yogurt dressing'
    ],
    chef: {
      name: 'Chef Kavya Patel',
      specialization: 'Raw Food Nutrition',
      avatar: '/api/placeholder/60/60'
    },
    isProteinRich: true,
    isFeatured: true,
    createdAt: '2024-01-25'
  },

  {
    id: 4,
    name: 'Tofu Tikka Masala Bowl',
    category: 'lunch',
    difficulty: 'Medium',
    cookTime: 25,
    prepTime: 15,
    servings: 3,
    calories: 520,
    protein: 28,
    carbs: 42,
    fat: 22,
    fiber: 8,
    rating: 4.6,
    reviews: 203,
    tags: ['high-protein', 'tofu', 'indian', 'tikka-masala', 'comfort-food'],
    image: '/api/placeholder/400/300',
    videoUrl: 'https://example.com/tofu-tikka-tutorial',
    videoThumbnail: '/api/placeholder/400/225',
    description: 'A protein-rich Indian classic reimagined with marinated tofu in a creamy, spiced tomato sauce.',
    shortDescription: 'Marinated tofu in creamy spiced tomato sauce',
    nutritionBenefits: [
      'Complete protein from tofu (28g per serving)',
      'Rich in isoflavones for heart health',
      'Lycopene from tomatoes for antioxidants',
      'Probiotics from yogurt for gut health'
    ],
    ingredients: [
      '400g firm tofu, cubed',
      '1/2 cup Greek yogurt',
      '2 tbsp lemon juice',
      '2 tsp garam masala',
      '1 tsp turmeric',
      '1 tsp red chili powder',
      '1 tbsp ginger-garlic paste',
      '2 tbsp olive oil',
      'For sauce: 1 large onion, 3 tomatoes, 1/2 cup cashews, 1 tsp cumin, 1 bay leaf, 1/4 cup coconut milk',
      'Salt to taste, fresh cilantro for garnish'
    ],
    instructions: [
      'Press tofu to remove excess water, then cut into cubes',
      'Marinate tofu with yogurt, lemon juice, garam masala, turmeric, chili powder, and ginger-garlic paste for 30 minutes',
      'Heat oil in a pan and sear marinated tofu until golden, set aside',
      'For sauce, soak cashews in hot water for 15 minutes',
      'Sauté onions until golden, add cumin and bay leaf',
      'Add tomatoes and cook until soft and mushy',
      'Blend the mixture with soaked cashews until smooth',
      'Return sauce to pan, add coconut milk and seasonings',
      'Add seared tofu and simmer for 10 minutes',
      'Garnish with fresh cilantro and serve with quinoa or brown rice'
    ],
    tips: [
      'Press tofu well to ensure it absorbs marinade',
      "Don't skip the marination time for best flavor",
      "Cashews make the sauce creamy - don't substitute",
      'Adjust spice levels according to preference'
    ],
    variations: [
      'Vegan version: Use coconut yogurt instead of Greek yogurt',
      'Spicier version: Add green chilies and extra red chili powder',
      'Lighter version: Use less coconut milk and more tomatoes'
    ],
    chef: {
      name: 'Chef Rajesh Kumar',
      specialization: 'Indian Fusion Cuisine',
      avatar: '/api/placeholder/60/60'
    },
    isProteinRich: true,
    isFeatured: false,
    createdAt: '2024-02-01'
  },

  // High-Protein Dinner Recipes
  {
    id: 5,
    name: 'Paneer Spinach Power Bowl',
    category: 'dinner',
    difficulty: 'Medium',
    cookTime: 20,
    prepTime: 10,
    servings: 2,
    calories: 480,
    protein: 32,
    carbs: 28,
    fat: 24,
    fiber: 12,
    rating: 4.8,
    reviews: 174,
    tags: ['high-protein', 'paneer', 'spinach', 'iron-rich', 'muscle-building'],
    image: '/api/placeholder/400/300',
    videoUrl: 'https://example.com/paneer-spinach-tutorial',
    videoThumbnail: '/api/placeholder/400/225',
    description: 'Protein-rich paneer combined with iron-packed spinach in a flavorful, nutritious dinner bowl.',
    shortDescription: 'High-protein paneer and spinach combination',
    nutritionBenefits: [
      'Exceptional protein content (32g per serving)',
      'High in calcium from paneer',
      'Iron and folate from spinach',
      'Complete amino acid profile'
    ],
    ingredients: [
      '200g paneer, cubed',
      '4 cups fresh spinach',
      '1/2 cup Greek yogurt',
      '2 tbsp cashews',
      '1 large onion, chopped',
      '3 garlic cloves',
      '1-inch ginger piece',
      '1 green chili',
      '1 tsp cumin seeds',
      '1 tsp garam masala',
      '1/2 tsp turmeric',
      '2 tbsp olive oil',
      'Salt to taste'
    ],
    instructions: [
      'Blanch spinach in boiling water for 2 minutes, then drain',
      'Blend blanched spinach with garlic, ginger, green chili, and cashews',
      'Heat oil in a pan, add cumin seeds',
      'Sauté onions until golden brown',
      'Add spinach puree and cook for 5 minutes',
      'Add turmeric, garam masala, and salt',
      'Gently fold in paneer cubes',
      'Add Greek yogurt and simmer for 5 minutes',
      'Adjust seasoning and consistency',
      'Serve hot with quinoa or cauliflower rice'
    ],
    tips: [
      "Don't overcook spinach to retain nutrients",
      'Use fresh paneer for best texture',
      'Add yogurt at the end to prevent curdling',
      'Blanching spinach helps retain color'
    ],
    variations: [
      'Vegan version: Use firm tofu instead of paneer',
      'Extra protein: Add hemp seeds as garnish',
      'Spicier version: Add more green chilies'
    ],
    chef: {
      name: 'Chef Meera Singh',
      specialization: 'Ayurvedic Nutrition',
      avatar: '/api/placeholder/60/60'
    },
    isProteinRich: true,
    isFeatured: true,
    createdAt: '2024-02-05'
  },

  // High-Protein Snacks
  {
    id: 6,
    name: 'Protein-Packed Energy Balls',
    category: 'snacks',
    difficulty: 'Easy',
    cookTime: 0,
    prepTime: 15,
    servings: 4,
    calories: 280,
    protein: 14,
    carbs: 22,
    fat: 16,
    fiber: 6,
    rating: 4.9,
    reviews: 89,
    tags: ['high-protein', 'no-bake', 'energy-balls', 'post-workout', 'dates'],
    image: '/api/placeholder/400/300',
    videoUrl: 'https://example.com/energy-balls-tutorial',
    videoThumbnail: '/api/placeholder/400/225',
    description: 'No-bake protein energy balls perfect for post-workout nutrition and sustained energy.',
    shortDescription: 'No-bake protein balls with dates and nuts',
    nutritionBenefits: [
      'Quick energy from natural sugars',
      'Complete protein from nuts and seeds',
      'Healthy fats for hormone production',
      'Fiber for digestive health'
    ],
    ingredients: [
      '1 cup dates, pitted',
      '1/2 cup almonds',
      '1/4 cup cashews',
      '2 tbsp chia seeds',
      '2 tbsp hemp seeds',
      '1 scoop vanilla protein powder',
      '2 tbsp almond butter',
      '1 tsp vanilla extract',
      '1/4 tsp cinnamon',
      'Coconut flakes for rolling'
    ],
    instructions: [
      "Soak dates in warm water for 10 minutes if they're hard",
      'In a food processor, pulse almonds and cashews until coarsely chopped',
      'Add dates and process until a paste forms',
      'Add chia seeds, hemp seeds, and protein powder',
      'Add almond butter, vanilla, and cinnamon',
      'Process until mixture holds together when pressed',
      'Scoop mixture and roll into balls',
      'Roll balls in coconut flakes if desired',
      'Refrigerate for 30 minutes to firm up',
      'Store in refrigerator for up to 1 week'
    ],
    tips: [
      'Use Medjool dates for best sweetness and texture',
      "Don't over-process nuts - some texture is good",
      'Wet hands when rolling to prevent sticking',
      'Experiment with different coatings like cocoa powder'
    ],
    variations: [
      'Chocolate version: Add cocoa powder and dark chocolate chips',
      'Tropical version: Add dried coconut and macadamia nuts',
      'Spiced version: Add cardamom, ginger, and nutmeg'
    ],
    chef: {
      name: 'Chef Anita Gupta',
      specialization: 'Healthy Snacks',
      avatar: '/api/placeholder/60/60'
    },
    isProteinRich: true,
    isFeatured: false,
    createdAt: '2024-02-10'
  },

  // Protein-Rich Smoothies
  {
    id: 7,
    name: 'Green Goddess Protein Smoothie',
    category: 'smoothies',
    difficulty: 'Easy',
    cookTime: 0,
    prepTime: 5,
    servings: 1,
    calories: 320,
    protein: 25,
    carbs: 28,
    fat: 12,
    fiber: 8,
    rating: 4.7,
    reviews: 156,
    tags: ['high-protein', 'green-smoothie', 'spinach', 'superfood', 'post-workout'],
    image: '/api/placeholder/400/300',
    videoUrl: 'https://example.com/green-smoothie-tutorial',
    videoThumbnail: '/api/placeholder/400/225',
    description: 'A nutrient-dense green smoothie packed with plant protein and superfoods for optimal nutrition.',
    shortDescription: 'Protein-rich green smoothie with spinach and superfoods',
    nutritionBenefits: [
      'High in plant-based protein (25g)',
      'Rich in iron and vitamins from spinach',
      'Antioxidants from berries',
      'Omega-3 fatty acids from chia seeds'
    ],
    ingredients: [
      '2 cups fresh spinach',
      '1 frozen banana',
      '1/2 cup frozen mango chunks',
      '1 scoop vanilla protein powder',
      '1 tbsp chia seeds',
      '1 tbsp almond butter',
      '1 cup coconut water',
      '1/2 avocado',
      '1 tsp spirulina powder (optional)',
      'Ice cubes as needed'
    ],
    instructions: [
      'Add coconut water to blender first',
      'Add spinach and blend until smooth',
      'Add frozen banana and mango',
      'Add protein powder, chia seeds, and almond butter',
      'Add avocado and spirulina if using',
      'Blend until completely smooth and creamy',
      'Add ice cubes if needed for desired consistency',
      'Taste and adjust sweetness if needed',
      'Pour into a glass and serve immediately',
      'Garnish with chia seeds or coconut flakes'
    ],
    tips: [
      'Use frozen fruits for a thicker smoothie',
      'Add liquid gradually to control consistency',
      'Blend spinach first for smoothest texture',
      'Pre-portion ingredients in freezer bags for quick smoothies'
    ],
    variations: [
      'Chocolate version: Add cocoa powder and chocolate protein powder',
      'Tropical version: Use pineapple and coconut instead of berries',
      'Berry version: Add mixed berries and decrease mango'
    ],
    chef: {
      name: 'Chef Pooja Reddy',
      specialization: 'Superfood Nutrition',
      avatar: '/api/placeholder/60/60'
    },
    isProteinRich: true,
    isFeatured: true,
    createdAt: '2024-02-15'
  },

  {
    id: 8,
    name: 'Chickpea Flour Pancakes (Besan Chilla)',
    category: 'breakfast',
    difficulty: 'Easy',
    cookTime: 15,
    prepTime: 10,
    servings: 2,
    calories: 350,
    protein: 20,
    carbs: 32,
    fat: 14,
    fiber: 10,
    rating: 4.5,
    reviews: 134,
    tags: ['high-protein', 'chickpea-flour', 'indian', 'gluten-free', 'savory'],
    image: '/api/placeholder/400/300',
    videoUrl: 'https://example.com/besan-chilla-tutorial',
    videoThumbnail: '/api/placeholder/400/225',
    description: 'Traditional Indian savory pancakes made with protein-rich chickpea flour and vegetables.',
    shortDescription: 'Savory chickpea flour pancakes with vegetables',
    nutritionBenefits: [
      'High protein from chickpea flour',
      'Gluten-free and suitable for celiac',
      'Rich in folate and iron',
      'Low glycemic index for steady energy'
    ],
    ingredients: [
      '1 cup chickpea flour (besan)',
      '1 1/4 cups water',
      '1 small onion, finely chopped',
      '1 tomato, finely chopped',
      '1 green chili, minced',
      '2 tbsp fresh coriander, chopped',
      '1 tsp ginger, minced',
      '1/2 tsp turmeric powder',
      '1/2 tsp cumin powder',
      '1/4 tsp red chili powder',
      'Salt to taste',
      '2 tbsp oil for cooking'
    ],
    instructions: [
      'In a bowl, whisk chickpea flour with water to make a smooth batter',
      'Let batter rest for 10 minutes to hydrate',
      'Add chopped onion, tomato, green chili, and coriander',
      'Add ginger, turmeric, cumin powder, chili powder, and salt',
      'Mix well to combine all ingredients',
      'Heat a non-stick pan over medium heat',
      'Pour 1/4 cup batter and spread in a thin circle',
      'Drizzle oil around edges and cook for 2-3 minutes',
      'Flip and cook the other side for 2 minutes',
      'Serve hot with mint chutney or Greek yogurt'
    ],
    tips: [
      'Batter should be pourable but not too thin',
      'Cook on medium heat to ensure even cooking',
      'Add vegetables of your choice for variety',
      'Serve immediately for best taste and texture'
    ],
    variations: [
      'Spinach version: Add finely chopped spinach',
      'Spicy version: Add more green chilies and black pepper',
      'Cheese version: Sprinkle grated cheese before flipping'
    ],
    chef: {
      name: 'Chef Sunita Joshi',
      specialization: 'Traditional Indian Cuisine',
      avatar: '/api/placeholder/60/60'
    },
    isProteinRich: true,
    isFeatured: false,
    createdAt: '2024-02-20'
  }
]

const CATEGORIES = [
  { id: 'all', name: 'All Recipes', icon: '🍽️' },
  { id: 'breakfast', name: 'Breakfast', icon: '🌅' },
  { id: 'lunch', name: 'Lunch', icon: '🥗' },
  { id: 'dinner', name: 'Dinner', icon: '🍛' },
  { id: 'snacks', name: 'Snacks', icon: '🥜' },
  { id: 'smoothies', name: 'Smoothies', icon: '🥤' }
]

interface RecipeCardProps {
  recipe: Recipe
  onView: (recipe: Recipe) => void
  onToggleFavorite: (id: number) => void
  isFavorite: boolean
}

function RecipeCard({ recipe, onView, onToggleFavorite, isFavorite }: RecipeCardProps) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 group border border-gray-200">
      {/* Image and Video Section */}
      <div className="relative">
        <div className="aspect-[4/3] bg-gradient-to-br from-primary-100 to-secondary-100 relative overflow-hidden">
          <ImageIcon className="w-16 h-16 text-gray-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />

          {/* Overlay badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {recipe.isFeatured && (
              <span className="bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center">
                <Award className="w-3 h-3 mr-1" />
                Featured
              </span>
            )}
            {recipe.isProteinRich && (
              <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center">
                <Zap className="w-3 h-3 mr-1" />
                High Protein
              </span>
            )}
          </div>

          {/* Video Play Button */}
          {recipe.videoUrl && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
              <button className="bg-white/90 p-3 rounded-full shadow-lg hover:bg-white transition-colors">
                <Video className="w-6 h-6 text-primary-600" />
              </button>
            </div>
          )}

          {/* Favorite Button */}
          <button
            onClick={() => onToggleFavorite(recipe.id)}
            className="absolute top-3 right-3 p-2 bg-white/90 rounded-full shadow-lg hover:bg-white transition-colors"
          >
            {isFavorite ? (
              <BookmarkCheck className="w-5 h-5 text-primary-600" />
            ) : (
              <Bookmark className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Header */}
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900 mb-2">{recipe.name}</h3>
          <p className="text-gray-600 text-sm line-clamp-2">{recipe.shortDescription}</p>
        </div>

        {/* Chef Info */}
        <div className="flex items-center mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
            <ChefHat className="w-4 h-4 text-white" />
          </div>
          <div className="ml-3">
            <div className="text-sm font-medium text-gray-900">{recipe.chef.name}</div>
            <div className="text-xs text-gray-500">{recipe.chef.specialization}</div>
          </div>
        </div>

        {/* Meta Info */}
        <div className="flex items-center justify-between mb-4 text-sm text-gray-600">
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            <span>{recipe.cookTime + recipe.prepTime}min</span>
          </div>
          <div className="flex items-center">
            <Users className="w-4 h-4 mr-1" />
            <span>{recipe.servings} servings</span>
          </div>
          <div className="flex items-center">
            <Star className="w-4 h-4 mr-1 text-yellow-500" />
            <span>{recipe.rating}</span>
          </div>
        </div>

        {/* Nutrition Info */}
        <div className="grid grid-cols-4 gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-lg font-bold text-primary-600">{recipe.protein}g</div>
            <div className="text-xs text-gray-600">protein</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-orange-600">{recipe.calories}</div>
            <div className="text-xs text-gray-600">calories</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">{recipe.carbs}g</div>
            <div className="text-xs text-gray-600">carbs</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-600">{recipe.fat}g</div>
            <div className="text-xs text-gray-600">fat</div>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-4">
          {recipe.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full border border-primary-200"
            >
              {tag}
            </span>
          ))}
          {recipe.tags.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
              +{recipe.tags.length - 3} more
            </span>
          )}
        </div>

        {/* Action Button */}
        <button
          onClick={() => onView(recipe)}
          className="w-full btn-primary flex items-center justify-center space-x-2"
        >
          <Play className="w-4 h-4" />
          <span>View Recipe</span>
        </button>
      </div>
    </div>
  )
}

// Recipe Detail Modal Component
interface RecipeModalProps {
  recipe: Recipe
  onClose: () => void
}

function RecipeModal({ recipe, onClose }: RecipeModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'ingredients' | 'instructions' | 'nutrition'>('overview')

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="relative">
          <div className="aspect-[16/9] bg-gradient-to-br from-primary-100 to-secondary-100 relative">
            <ImageIcon className="w-24 h-24 text-gray-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />

            {recipe.videoUrl && (
              <div className="absolute inset-0 flex items-center justify-center">
                <button className="bg-white/90 p-4 rounded-full shadow-lg hover:bg-white transition-colors">
                  <Video className="w-8 h-8 text-primary-600" />
                </button>
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/90 rounded-full shadow-lg hover:bg-white transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Title and Chef */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{recipe.name}</h1>
            <p className="text-gray-600 mb-4">{recipe.description}</p>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mr-3">
                  <ChefHat className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{recipe.chef.name}</div>
                  <div className="text-sm text-gray-600">{recipe.chef.specialization}</div>
                </div>
              </div>

              <div className="flex space-x-2">
                <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Share2 className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <PrinterIcon className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">{recipe.prepTime + recipe.cookTime}</div>
              <div className="text-sm text-gray-600">Total Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{recipe.servings}</div>
              <div className="text-sm text-gray-600">Servings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{recipe.difficulty}</div>
              <div className="text-sm text-gray-600">Difficulty</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{recipe.rating}</div>
              <div className="text-sm text-gray-600">Rating</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex space-x-8">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'ingredients', label: 'Ingredients' },
                { id: 'instructions', label: 'Instructions' },
                { id: 'nutrition', label: 'Nutrition' }
              ].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Nutrition Benefits</h3>
                <ul className="space-y-2">
                  {recipe.nutritionBenefits.map((benefit, index) => (
                    <li key={index} className="flex items-start">
                      <Target className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Chef's Tips</h3>
                <ul className="space-y-2">
                  {recipe.tips.map((tip, index) => (
                    <li key={index} className="flex items-start">
                      <ChefHat className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Recipe Variations</h3>
                <ul className="space-y-2">
                  {recipe.variations.map((variation, index) => (
                    <li key={index} className="flex items-start">
                      <Star className="w-5 h-5 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{variation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'ingredients' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Ingredients ({recipe.servings} servings)</h3>
              <ul className="space-y-3">
                {recipe.ingredients.map((ingredient, index) => (
                  <li key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <input type="checkbox" className="mr-3 h-4 w-4 text-primary-600 rounded" />
                    <span className="text-gray-800">{ingredient}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {activeTab === 'instructions' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Instructions</h3>
              <ol className="space-y-4">
                {recipe.instructions.map((instruction, index) => (
                  <li key={index} className="flex">
                    <span className="flex-shrink-0 w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-semibold mr-4">
                      {index + 1}
                    </span>
                    <span className="text-gray-800 pt-1">{instruction}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {activeTab === 'nutrition' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-primary-50 p-4 rounded-xl text-center border border-primary-200">
                  <div className="text-3xl font-bold text-primary-600 mb-1">{recipe.calories}</div>
                  <div className="text-sm text-primary-700">Calories</div>
                </div>
                <div className="bg-green-50 p-4 rounded-xl text-center border border-green-200">
                  <div className="text-3xl font-bold text-green-600 mb-1">{recipe.protein}g</div>
                  <div className="text-sm text-green-700">Protein</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-xl text-center border border-orange-200">
                  <div className="text-3xl font-bold text-orange-600 mb-1">{recipe.carbs}g</div>
                  <div className="text-sm text-orange-700">Carbs</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-xl text-center border border-purple-200">
                  <div className="text-3xl font-bold text-purple-600 mb-1">{recipe.fat}g</div>
                  <div className="text-sm text-purple-700">Fat</div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-1">{recipe.fiber}g</div>
                  <div className="text-sm text-blue-700">Fiber</div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl">
                <h4 className="font-semibold text-gray-900 mb-2">Nutrition Highlights</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• High in plant-based protein for muscle building</li>
                  <li>• Rich in fiber for digestive health</li>
                  <li>• Contains essential amino acids</li>
                  <li>• Provides sustained energy for workouts</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function RecipeLibrary() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [favorites, setFavorites] = useState<number[]>([])
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false)
  const [showOnlyProtein, setShowOnlyProtein] = useState(false)
  const [showOnlyFeatured, setShowOnlyFeatured] = useState(false)
  const [showAddRecipe, setShowAddRecipe] = useState(false)
  const [recipeMedia, setRecipeMedia] = useState<UploadedMedia[]>([])

  const handleRecipeMediaUploaded = (media: UploadedMedia[]) => {
    setRecipeMedia(media)
    // Here you would typically save the recipe with media to your backend
    console.log('Recipe media uploaded:', media)
  }

  const filteredRecipes = RECIPES.filter(recipe => {
    const matchesCategory = selectedCategory === 'all' || recipe.category === selectedCategory
    const matchesSearch = recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         recipe.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         recipe.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFavorites = !showOnlyFavorites || favorites.includes(recipe.id)
    const matchesProtein = !showOnlyProtein || recipe.isProteinRich
    const matchesFeatured = !showOnlyFeatured || recipe.isFeatured

    return matchesCategory && matchesSearch && matchesFavorites && matchesProtein && matchesFeatured
  })

  const toggleFavorite = (recipeId: number) => {
    setFavorites(prev =>
      prev.includes(recipeId)
        ? prev.filter(id => id !== recipeId)
        : [...prev, recipeId]
    )
  }

  const getCategoryStats = () => {
    return CATEGORIES.map(category => ({
      ...category,
      count: category.id === 'all'
        ? RECIPES.length
        : RECIPES.filter(recipe => recipe.category === category.id).length
    }))
  }

  const proteinRecipeCount = RECIPES.filter(r => r.isProteinRich).length
  const featuredRecipeCount = RECIPES.filter(r => r.isFeatured).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-morphism p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-black gradient-text mb-2">Recipe Library</h1>
            <p className="text-xl text-gray-700">Professional vegetarian protein recipes for your fitness journey</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">{RECIPES.length}</div>
              <div className="text-sm text-gray-600">Total Recipes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{proteinRecipeCount}</div>
              <div className="text-sm text-gray-600">High Protein</div>
            </div>
            <button
              onClick={() => setShowAddRecipe(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Recipe</span>
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search recipes, ingredients, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                showOnlyFavorites
                  ? 'bg-primary-500 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Heart className="w-4 h-4" />
              <span>Favorites ({favorites.length})</span>
            </button>

            <button
              onClick={() => setShowOnlyProtein(!showOnlyProtein)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                showOnlyProtein
                  ? 'bg-green-500 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>High Protein</span>
            </button>

            <button
              onClick={() => setShowOnlyFeatured(!showOnlyFeatured)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                showOnlyFeatured
                  ? 'bg-yellow-500 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Featured</span>
            </button>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2">
          {getCategoryStats().map(({ id, name, icon, count }) => (
            <button
              key={id}
              onClick={() => setSelectedCategory(id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                selectedCategory === id
                  ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>{icon}</span>
              <span>{name}</span>
              <span className={`text-xs px-2 py-1 rounded-full ${
                selectedCategory === id
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Recipe Grid */}
      {filteredRecipes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
          <ChefHat className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No recipes found</h3>
          <p className="text-gray-600 mb-4">Try adjusting your filters or search terms</p>
          <button
            onClick={() => {
              setSearchQuery('')
              setSelectedCategory('all')
              setShowOnlyFavorites(false)
              setShowOnlyProtein(false)
              setShowOnlyFeatured(false)
            }}
            className="btn-primary"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onView={setSelectedRecipe}
              onToggleFavorite={toggleFavorite}
              isFavorite={favorites.includes(recipe.id)}
            />
          ))}
        </div>
      )}

      {/* Recipe Detail Modal */}
      {selectedRecipe && (
        <RecipeModal
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
        />
      )}

      {/* Upload Recipe Feature Placeholder */}
      <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-2xl p-6 border border-primary-200">
        <div className="text-center">
          <Plus className="w-12 h-12 mx-auto mb-4 text-primary-600" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Share Your Recipe</h3>
          <p className="text-gray-600 mb-4">
            Upload your own vegetarian protein recipes with photos and videos to help others on their fitness journey
          </p>
          <button className="btn-primary">
            Upload Recipe (Coming Soon)
          </button>
        </div>
      </div>

      {/* Add Recipe Modal */}
      {showAddRecipe && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Add New Recipe</h2>
                <button
                  onClick={() => setShowAddRecipe(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-6">
                {/* Recipe Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Recipe Name</label>
                    <input
                      type="text"
                      placeholder="e.g., High-Protein Quinoa Bowl"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select className="input-field">
                      <option value="breakfast">Breakfast</option>
                      <option value="lunch">Lunch</option>
                      <option value="dinner">Dinner</option>
                      <option value="snack">Snack</option>
                      <option value="smoothie">Smoothie</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Prep Time (min)</label>
                    <input type="number" placeholder="15" className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cook Time (min)</label>
                    <input type="number" placeholder="20" className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Servings</label>
                    <input type="number" placeholder="4" className="input-field" />
                  </div>
                </div>

                {/* Recipe Media Upload */}
                <RecipeMediaUpload
                  onMediaUploaded={handleRecipeMediaUploaded}
                  existingMedia={recipeMedia}
                />

                {/* Recipe Details */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    rows={3}
                    placeholder="Describe your recipe and what makes it special..."
                    className="input-field"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Ingredients */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ingredients</label>
                    <textarea
                      rows={6}
                      placeholder="1 cup quinoa&#10;2 cups vegetable broth&#10;1 can black beans..."
                      className="input-field"
                    />
                  </div>

                  {/* Instructions */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Instructions</label>
                    <textarea
                      rows={6}
                      placeholder="1. Rinse quinoa in cold water&#10;2. Heat broth in a saucepan&#10;3. Add quinoa and bring to boil..."
                      className="input-field"
                    />
                  </div>
                </div>

                {/* Nutrition Info */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Nutrition Information (per serving)</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Calories</label>
                      <input type="number" placeholder="450" className="input-field" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Protein (g)</label>
                      <input type="number" placeholder="25" className="input-field" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Carbs (g)</label>
                      <input type="number" placeholder="45" className="input-field" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Fat (g)</label>
                      <input type="number" placeholder="15" className="input-field" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Fiber (g)</label>
                      <input type="number" placeholder="8" className="input-field" />
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                  <input
                    type="text"
                    placeholder="high-protein, vegetarian, quinoa, healthy (comma separated)"
                    className="input-field"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowAddRecipe(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Here you would save the recipe
                    setShowAddRecipe(false)
                    setRecipeMedia([])
                  }}
                  className="btn-primary px-6 py-2"
                >
                  Save Recipe
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}