import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Community from './pages/Community'
import FitnessMatch from './pages/FitnessMatch'
import Profile from './pages/Profile'
import MealPlanner from './pages/MealPlanner'
import WorkoutTracker from './pages/WorkoutTracker'
import Progress from './pages/Progress'
import RecipeLibrary from './pages/RecipeLibrary'
import Settings from './pages/Settings'

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
                    <MealPlanner />
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
                    <WorkoutTracker />
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
                    <Progress />
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
                    <RecipeLibrary />
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
                    <Community />
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
                    <FitnessMatch />
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
                    <Profile />
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
                    <Settings />
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
