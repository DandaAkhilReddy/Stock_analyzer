import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useState, useEffect, lazy, Suspense } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'

// Lazy load heavy pages for better performance
const Community = lazy(() => import('./pages/Community'))
const FitnessMatch = lazy(() => import('./pages/FitnessMatch'))
const Profile = lazy(() => import('./pages/Profile'))
const MealPlanner = lazy(() => import('./pages/MealPlanner'))
const WorkoutTracker = lazy(() => import('./pages/WorkoutTracker'))
const Progress = lazy(() => import('./pages/Progress'))
const RecipeLibrary = lazy(() => import('./pages/RecipeLibrary'))
const Settings = lazy(() => import('./pages/Settings'))

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
)

// Your personal data (starting point)
export const USER_DATA = {
  startWeight: 85.5,
  currentWeight: 84.8, // Your current progress
  goalWeight: 69.9,
  targetDate: new Date('2026-01-01'),
  height: 175, // cm - update with your actual height
  age: 28, // update with your actual age
  dailyCalories: 1350,
  dailyProtein: 150,
  startDate: new Date('2024-09-01'), // When you started
} as const

function App() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  return (
    <AuthProvider>
      <Router>
        <div className={`min-h-screen transition-all duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />

            {/* Protected Routes */}
            <Route path="/" element={
              <ProtectedRoute>
                {/* Background Effects */}
                <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-500/20 via-transparent to-transparent"></div>
                <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
                <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-secondary-500/10 rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '1s'}}></div>

                {/* Main App */}
                <div className="relative z-10">
                  <Navbar />

                  <main className="container mx-auto px-4 py-8 max-w-7xl">
                    <Dashboard />
                  </main>
                </div>
              </ProtectedRoute>
            } />

            <Route path="/dashboard" element={
              <ProtectedRoute>
                <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-500/20 via-transparent to-transparent"></div>
                <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
                <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-secondary-500/10 rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '1s'}}></div>
                <div className="relative z-10">
                  <Navbar />
                  <main className="container mx-auto px-4 py-8 max-w-7xl">
                    <Dashboard />
                  </main>
                </div>
              </ProtectedRoute>
            } />

            <Route path="/meals" element={
              <ProtectedRoute>
                <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-500/20 via-transparent to-transparent"></div>
                <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
                <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-secondary-500/10 rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '1s'}}></div>
                <div className="relative z-10">
                  <Navbar />
                  <main className="container mx-auto px-4 py-8 max-w-7xl">
                    <Suspense fallback={<PageLoader />}>
                      <MealPlanner />
                    </Suspense>
                  </main>
                </div>
              </ProtectedRoute>
            } />

            <Route path="/workouts" element={
              <ProtectedRoute>
                <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-500/20 via-transparent to-transparent"></div>
                <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
                <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-secondary-500/10 rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '1s'}}></div>
                <div className="relative z-10">
                  <Navbar />
                  <main className="container mx-auto px-4 py-8 max-w-7xl">
                    <Suspense fallback={<PageLoader />}>
                      <WorkoutTracker />
                    </Suspense>
                  </main>
                </div>
              </ProtectedRoute>
            } />

            <Route path="/progress" element={
              <ProtectedRoute>
                <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-500/20 via-transparent to-transparent"></div>
                <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
                <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-secondary-500/10 rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '1s'}}></div>
                <div className="relative z-10">
                  <Navbar />
                  <main className="container mx-auto px-4 py-8 max-w-7xl">
                    <Suspense fallback={<PageLoader />}>
                      <Progress />
                    </Suspense>
                  </main>
                </div>
              </ProtectedRoute>
            } />

            <Route path="/recipes" element={
              <ProtectedRoute>
                <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-500/20 via-transparent to-transparent"></div>
                <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
                <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-secondary-500/10 rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '1s'}}></div>
                <div className="relative z-10">
                  <Navbar />
                  <main className="container mx-auto px-4 py-8 max-w-7xl">
                    <Suspense fallback={<PageLoader />}>
                      <RecipeLibrary />
                    </Suspense>
                  </main>
                </div>
              </ProtectedRoute>
            } />

            <Route path="/community" element={
              <ProtectedRoute>
                <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-500/20 via-transparent to-transparent"></div>
                <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
                <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-secondary-500/10 rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '1s'}}></div>
                <div className="relative z-10">
                  <Navbar />
                  <main className="container mx-auto px-4 py-8 max-w-7xl">
                    <Suspense fallback={<PageLoader />}>
                      <Community />
                    </Suspense>
                  </main>
                </div>
              </ProtectedRoute>
            } />

            <Route path="/fitness-match" element={
              <ProtectedRoute>
                <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-pink-500/20 via-transparent to-transparent"></div>
                <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
                <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '1s'}}></div>
                <div className="relative z-10">
                  <Navbar />
                  <main className="container mx-auto px-4 py-8 max-w-7xl">
                    <Suspense fallback={<PageLoader />}>
                      <FitnessMatch />
                    </Suspense>
                  </main>
                </div>
              </ProtectedRoute>
            } />

            <Route path="/profile" element={
              <ProtectedRoute>
                <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-500/20 via-transparent to-transparent"></div>
                <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
                <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '1s'}}></div>
                <div className="relative z-10">
                  <Navbar />
                  <main className="container mx-auto px-4 py-8 max-w-7xl">
                    <Suspense fallback={<PageLoader />}>
                      <Profile />
                    </Suspense>
                  </main>
                </div>
              </ProtectedRoute>
            } />

            <Route path="/settings" element={
              <ProtectedRoute>
                <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-500/20 via-transparent to-transparent"></div>
                <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
                <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-secondary-500/10 rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '1s'}}></div>
                <div className="relative z-10">
                  <Navbar />
                  <main className="container mx-auto px-4 py-8 max-w-7xl">
                    <Suspense fallback={<PageLoader />}>
                      <Settings />
                    </Suspense>
                  </main>
                </div>
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
