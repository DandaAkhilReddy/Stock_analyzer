import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  UtensilsCrossed,
  Dumbbell,
  TrendingUp,
  BookOpen,
  Settings,
  User,
  Bell,
  LogOut,
  Users,
  Heart
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/community', icon: Users, label: 'Community' },
  { path: '/fitness-match', icon: Heart, label: 'Match', isNew: true },
  { path: '/meals', icon: UtensilsCrossed, label: 'Meals' },
  { path: '/workouts', icon: Dumbbell, label: 'Workouts' },
  { path: '/progress', icon: TrendingUp, label: 'Progress' },
  { path: '/recipes', icon: BookOpen, label: 'Recipes' },
  { path: '/profile', icon: User, label: 'Profile' },
  { path: '/settings', icon: Settings, label: 'Settings' },
]

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <>
      {/* Desktop Navbar */}
      <nav className="hidden lg:block glass-morphism sticky top-0 z-50 border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-gradient-to-r from-primary-500 to-secondary-500">
                <Dumbbell className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold gradient-text">ReddyFit</h1>
                <p className="text-xs text-gray-600">AI-Powered Transformation</p>
              </div>
            </Link>

            {/* Navigation Links */}
            <div className="flex items-center space-x-2">
              {navItems.map(({ path, icon: Icon, label, isNew }) => {
                const isActive = location.pathname === path || (path === '/dashboard' && location.pathname === '/')
                return (
                  <Link
                    key={path}
                    to={path}
                    className={`nav-link ${isActive ? 'active' : ''} relative`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="hidden xl:block">{label}</span>
                    {isNew && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-pink-500 rounded-full"></span>
                    )}
                  </Link>
                )
              })}
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <button className="p-2 rounded-lg text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-all duration-200 relative">
                <Bell className="w-5 h-5" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent-500 rounded-full border-2 border-white"></div>
              </button>

              <div className="flex items-center space-x-3 glass-card px-4 py-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center">
                  {user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <User className="w-4 h-4 text-white" />
                  )}
                </div>
                <div className="hidden xl:block">
                  <p className="text-sm font-semibold text-gray-800">
                    {user?.displayName || 'User'}
                  </p>
                  <p className="text-xs text-gray-600">84.8kg • Day 29</p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-1 rounded-md text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-all duration-200"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 glass-morphism border-t border-gray-200 z-50">
        <div className="grid grid-cols-5 py-2">
          {navItems.slice(0, 5).map(({ path, icon: Icon, label, isNew }) => {
            const isActive = location.pathname === path || (path === '/dashboard' && location.pathname === '/')
            return (
              <Link
                key={path}
                to={path}
                className={`flex flex-col items-center py-2 px-1 transition-all duration-200 relative ${
                  isActive
                    ? 'text-primary-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">{label}</span>
                {isNew && (
                  <span className="absolute top-1 right-2 w-2 h-2 bg-pink-500 rounded-full"></span>
                )}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Mobile spacer */}
      <div className="lg:hidden h-20"></div>
    </>
  )
}