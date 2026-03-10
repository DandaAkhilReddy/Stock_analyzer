# 🤖 ReddyFit Python ML Backend

Complete Machine Learning backend with FastAPI for personalized fitness & nutrition recommendations.

## 🏗️ Architecture

```
backend/
├── main.py                          # FastAPI app entry point
├── requirements.txt                 # Python dependencies
├── .env                            # Environment variables
├── app/
│   ├── __init__.py
│   ├── core/
│   │   ├── config.py               # Settings & configuration
│   │   └── firebase.py             # Firebase admin integration
│   ├── models/
│   │   ├── recipe.py               # Recipe data models
│   │   ├── workout.py              # Workout data models
│   │   └── user.py                 # User profile models
│   ├── routers/
│   │   ├── recipes.py              # Custom recipe CRUD + search
│   │   ├── recommendations.py      # ML recommendations
│   │   ├── workouts.py             # Workout plans
│   │   └── nutrition.py            # Nutrition analysis
│   ├── ml/
│   │   ├── workout_recommender.py  # Sklearn workout ML
│   │   ├── meal_recommender.py     # Sklearn meal ML
│   │   └── collaborative_filter.py # User similarity recommendations
│   └── services/
│       ├── firebase_service.py     # Firestore operations
│       └── azure_service.py        # Azure Blob integration
└── tests/
    └── test_api.py                 # API tests
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure Environment

Create `.env` file:

```env
# Firebase Admin SDK
FIREBASE_PROJECT_ID=reddyfit-dcf41
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@reddyfit-dcf41.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your_client_id
FIREBASE_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40reddyfit-dcf41.iam.gserviceaccount.com

# Azure
AZURE_STORAGE_CONNECTION_STRING=your_connection_string

# Optional: OpenAI for advanced recommendations
OPENAI_API_KEY=sk-xxx

# App Config
ENVIRONMENT=development
API_PORT=8000
```

### 3. Run Backend

```bash
python main.py
# Or with uvicorn:
uvicorn main:app --reload --port 8000
```

API will be available at: `http://localhost:8000`

## 📡 API Endpoints

### Custom Recipes (with user naming!)

```
POST   /api/recipes                    # Create custom recipe
GET    /api/recipes                    # List all recipes
GET    /api/recipes/{id}               # Get recipe by ID
PUT    /api/recipes/{id}               # Update recipe
DELETE /api/recipes/{id}               # Delete recipe
GET    /api/recipes/my-recipes         # Get user's custom recipes
POST   /api/recipes/search             # Search recipes
```

**Example: Create Custom Recipe**
```json
POST /api/recipes
Authorization: Bearer <firebase_token>

{
  "name": "Akhil's Protein Smoothie",  // User can name it!
  "description": "My favorite post-workout smoothie",
  "ingredients": [
    {"name": "Banana", "amount": "1", "unit": "piece"},
    {"name": "Protein Powder", "amount": "30", "unit": "g"},
    {"name": "Almond Milk", "amount": "300", "unit": "ml"},
    {"name": "Peanut Butter", "amount": "15", "unit": "g"}
  ],
  "instructions": [
    "Add all ingredients to blender",
    "Blend until smooth",
    "Enjoy immediately"
  ],
  "nutritionInfo": {
    "calories": 350,
    "protein": 35,
    "carbs": 40,
    "fat": 12
  },
  "prepTime": 5,
  "cookTime": 0,
  "servings": 1,
  "category": "smoothie",
  "tags": ["post-workout", "high-protein", "quick"],
  "isPublic": true  // Share with community or keep private
}
```

### ML Recommendations

```
POST /api/recommendations/workout      # Get personalized workout
POST /api/recommendations/meal         # Get personalized meal plan
POST /api/recommendations/similar-users # Find workout buddies
```

**Example: Get Workout Recommendation**
```json
POST /api/recommendations/workout
Authorization: Bearer <firebase_token>

{
  "fitnessLevel": "intermediate",
  "goals": ["muscle_gain", "strength"],
  "availableEquipment": ["dumbbells", "barbell"],
  "timeAvailable": 60,  // minutes
  "preferredMuscleGroups": ["chest", "back"]
}

Response:
{
  "workout": {
    "name": "Upper Body Strength",
    "exercises": [
      {
        "name": "Bench Press",
        "sets": 4,
        "reps": 8,
        "restTime": 90,
        "notes": "Focus on controlled movement"
      },
      ...
    ],
    "estimatedDuration": 55,
    "difficulty": "intermediate",
    "confidence": 0.92
  },
  "reasoning": "Based on your recent progress and goals..."
}
```

## 🧠 Machine Learning Features

### 1. Workout Recommender (`ml/workout_recommender.py`)

Uses **scikit-learn Random Forest** trained on:
- User fitness level & goals
- Past workout performance
- Equipment availability
- Time constraints
- Muscle recovery patterns

```python
from sklearn.ensemble import RandomForestClassifier
import pandas as pd

class WorkoutRecommender:
    def __init__(self):
        self.model = RandomForestClassifier(n_estimators=100)
        self.load_model()

    def recommend(self, user_profile, constraints):
        features = self.extract_features(user_profile, constraints)
        predictions = self.model.predict_proba(features)
        return self.generate_workout_plan(predictions)
```

### 2. Meal Recommender (`ml/meal_recommender.py`)

Uses **K-Nearest Neighbors** + **Content-Based Filtering**:
- Nutritional requirements
- Dietary restrictions
- Food preferences
- Calorie targets
- Macro ratios

```python
from sklearn.neighbors import NearestNeighbors

class MealRecommender:
    def __init__(self):
        self.knn = NearestNeighbors(n_neighbors=10)
        self.recipe_embeddings = self.load_embeddings()

    def recommend_meals(self, user_profile, date):
        # Calculate daily nutrition needs
        nutrition_target = self.calculate_needs(user_profile)

        # Find similar recipes
        similar_recipes = self.knn.kneighbors(nutrition_target)

        # Generate meal plan
        return self.create_meal_plan(similar_recipes, nutrition_target)
```

### 3. Collaborative Filtering (`ml/collaborative_filter.py`)

Find similar users for:
- Workout buddy matching
- Recipe recommendations
- Progress motivation

```python
from sklearn.metrics.pairwise import cosine_similarity

class CollaborativeFilter:
    def find_similar_users(self, user_id):
        user_features = self.get_user_features(user_id)
        similarities = cosine_similarity(user_features, all_users)
        return top_k_similar_users(similarities, k=10)
```

## 🔥 Firebase Integration

### Custom Recipe Storage

Recipes are stored in Firestore with full CRUD operations:

```python
from firebase_admin import firestore

db = firestore.client()

# Create custom recipe
def create_recipe(user_id, recipe_data):
    recipe_ref = db.collection('recipes').document()
    recipe_data['userId'] = user_id
    recipe_data['createdAt'] = firestore.SERVER_TIMESTAMP
    recipe_ref.set(recipe_data)
    return recipe_ref.id

# Get user's recipes
def get_user_recipes(user_id):
    recipes = db.collection('recipes')\
        .where('userId', '==', user_id)\
        .order_by('createdAt', direction='DESCENDING')\
        .stream()
    return [recipe.to_dict() for recipe in recipes]

# Search recipes
def search_recipes(query, filters):
    recipes = db.collection('recipes')

    if filters.get('category'):
        recipes = recipes.where('category', '==', filters['category'])

    if filters.get('maxCalories'):
        recipes = recipes.where('nutritionInfo.calories', '<=', filters['maxCalories'])

    return recipes.limit(20).stream()
```

## 🎯 Custom Recipe Features

### 1. User Naming & Personalization
- Users can name recipes anything they want
- Add personal notes & modifications
- Mark as public/private
- Share with friends

### 2. Smart Search
- Search by name, ingredients, tags
- Filter by nutrition (calories, protein, etc.)
- Filter by dietary restrictions
- Sort by popularity, date, rating

### 3. Recipe Collections
- Create custom collections (e.g., "Meal Prep Sunday", "Quick Dinners")
- Save favorite recipes
- Rate & review recipes

### 4. Ingredient Substitutions
- ML-powered ingredient suggestions
- Allergen alternatives
- Nutrition-matched swaps

## 🚀 Deployment to Azure

### Option 1: Azure Container Instances

```bash
# Build Docker image
docker build -t reddyfit-backend .

# Push to Azure Container Registry
az acr login --name reddyfitregistry
docker tag reddyfit-backend reddyfitregistry.azurecr.io/backend:latest
docker push reddyfitregistry.azurecr.io/backend:latest

# Deploy
az container create \
  --resource-group reddyfit-rg \
  --name reddyfit-backend \
  --image reddyfitregistry.azurecr.io/backend:latest \
  --ports 8000 \
  --dns-name-label reddyfit-api \
  --environment-variables $(cat .env)
```

### Option 2: Azure App Service

```bash
# Create App Service Plan
az appservice plan create \
  --name reddyfit-plan \
  --resource-group reddyfit-rg \
  --is-linux \
  --sku B1

# Create Web App
az webapp create \
  --resource-group reddyfit-rg \
  --plan reddyfit-plan \
  --name reddyfit-api \
  --runtime "PYTHON|3.11"

# Deploy
az webapp up --name reddyfit-api
```

Backend will be available at: `https://reddyfit-api.azurewebsites.net`

## 🔗 Frontend Integration

Update frontend `.env`:

```env
# Add backend URL
VITE_API_URL=http://localhost:8000
# Or production:
VITE_API_URL=https://reddyfit-api.azurewebsites.net
```

Create API service (`src/services/api.ts`):

```typescript
import { auth } from '../config/firebase'

const API_URL = import.meta.env.VITE_API_URL

async function getAuthHeaders() {
  const token = await auth.currentUser?.getIdToken()
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
}

export const recipeAPI = {
  // Create custom recipe
  async createRecipe(recipe: Recipe) {
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_URL}/api/recipes`, {
      method: 'POST',
      headers,
      body: JSON.stringify(recipe)
    })
    return response.json()
  },

  // Get user's recipes
  async getMyRecipes() {
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_URL}/api/recipes/my-recipes`, {
      headers
    })
    return response.json()
  },

  // Search recipes
  async searchRecipes(query: string, filters?: any) {
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_URL}/api/recipes/search`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, filters })
    })
    return response.json()
  }
}

export const recommendationAPI = {
  // Get workout recommendation
  async getWorkoutRecommendation(preferences: any) {
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_URL}/api/recommendations/workout`, {
      method: 'POST',
      headers,
      body: JSON.stringify(preferences)
    })
    return response.json()
  },

  // Get meal recommendations
  async getMealRecommendations(preferences: any) {
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_URL}/api/recommendations/meal`, {
      method: 'POST',
      headers,
      body: JSON.stringify(preferences)
    })
    return response.json()
  }
}
```

## 📊 Example Use Cases

### 1. Create "Akhil's Special Protein Bowl"

```typescript
const myRecipe = {
  name: "Akhil's High-Protein Buddha Bowl",
  description: "Perfect post-workout meal with 50g protein!",
  ingredients: [
    { name: "Quinoa", amount: "1", unit: "cup" },
    { name: "Grilled Chicken", amount: "200", unit: "g" },
    { name: "Chickpeas", amount: "100", unit: "g" },
    { name: "Avocado", amount: "0.5", unit: "piece" }
  ],
  // ... rest of recipe
}

await recipeAPI.createRecipe(myRecipe)
```

### 2. Get Personalized Workout

```typescript
const workout = await recommendationAPI.getWorkoutRecommendation({
  fitnessLevel: "intermediate",
  goals: ["muscle_gain"],
  timeAvailable: 45
})

console.log(workout)
// Returns personalized workout based on ML model
```

## 🎓 Next Steps

1. **Train ML Models**: Use your user data to train models
2. **Add More Features**: Image recognition for food, exercise form checker
3. **Scale**: Use Azure Kubernetes for production
4. **Monitor**: Set up Application Insights

## 📝 License

MIT - Built with ❤️ for ReddyFit
