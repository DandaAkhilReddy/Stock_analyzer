import React, { useState } from 'react'
import {
  Heart,
  X,
  MapPin,
  Calendar,
  Dumbbell,
  Target,
  Clock,
  Star,
  MessageCircle,
  Filter,
  Sliders,
  Users,
  Flame,
  Trophy,
  Camera,
  ChevronLeft,
  ChevronRight,
  Info
} from 'lucide-react'

interface FitnessProfile {
  id: string
  name: string
  age: number
  photos: string[]
  location: string
  distance: number
  fitnessLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'
  workoutPreferences: string[]
  goals: string[]
  availability: string[]
  bio: string
  lookingFor: string[]
  gymLocation?: string
  workoutStreak: number
  badges: string[]
  isOnline: boolean
  lastActive: string
  compatibility: number
}

const mockProfiles: FitnessProfile[] = [
  {
    id: '1',
    name: 'Emma',
    age: 26,
    photos: [
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400',
      'https://images.unsplash.com/photo-1544427920-c49ccfb85579?w=400'
    ],
    location: 'San Francisco, CA',
    distance: 2.3,
    fitnessLevel: 'Intermediate',
    workoutPreferences: ['Yoga', 'Pilates', 'Running', 'Hiking'],
    goals: ['Flexibility', 'Endurance', 'Mental Health'],
    availability: ['Morning', 'Weekend'],
    bio: 'Yoga enthusiast seeking mindful movement partner! Love outdoor adventures and finding balance in life. Let\'s flow together! 🧘‍♀️',
    lookingFor: ['Workout Partner', 'Fitness Friend'],
    gymLocation: 'CorePower Yoga Studio',
    workoutStreak: 45,
    badges: ['🧘‍♀️ Zen Master', '🌅 Early Bird', '🏃‍♀️ Trail Runner'],
    isOnline: true,
    lastActive: '5 min ago',
    compatibility: 92
  },
  {
    id: '2',
    name: 'Marcus',
    age: 29,
    photos: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
      'https://images.unsplash.com/photo-1583468982228-19f19164aee2?w=400',
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400'
    ],
    location: 'San Francisco, CA',
    distance: 1.8,
    fitnessLevel: 'Advanced',
    workoutPreferences: ['Strength Training', 'CrossFit', 'Boxing', 'Calisthenics'],
    goals: ['Strength Building', 'Muscle Gain', 'Competition Prep'],
    availability: ['Evening', 'Weekend'],
    bio: 'Powerlifter and CrossFit enthusiast! Looking for serious training partners who push limits. Let\'s get swole! 💪',
    lookingFor: ['Workout Partner', 'Training Buddy'],
    gymLocation: 'CrossFit Golden Gate',
    workoutStreak: 78,
    badges: ['💪 Strength Beast', '🏆 Competition Ready', '🔥 Streak Legend'],
    isOnline: false,
    lastActive: '2 hours ago',
    compatibility: 85
  },
  {
    id: '3',
    name: 'Sophia',
    age: 24,
    photos: [
      'https://images.unsplash.com/photo-1494790108755-2616b612b5bc?w=400',
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400',
      'https://images.unsplash.com/photo-1544427920-c49ccfb85579?w=400'
    ],
    location: 'San Francisco, CA',
    distance: 3.1,
    fitnessLevel: 'Beginner',
    workoutPreferences: ['Dance', 'Zumba', 'Swimming', 'Walking'],
    goals: ['Weight Loss', 'Fun Fitness', 'Social Connection'],
    availability: ['Evening', 'Weekend'],
    bio: 'New to fitness but super motivated! Love dancing and making workouts fun. Looking for encouraging friends! 💃',
    lookingFor: ['Fitness Friend', 'Accountability Buddy', 'Dating'],
    gymLocation: '24 Hour Fitness',
    workoutStreak: 12,
    badges: ['🌟 Rising Star', '💃 Dance Lover'],
    isOnline: true,
    lastActive: 'Just now',
    compatibility: 78
  },
  {
    id: '4',
    name: 'Jake',
    age: 31,
    photos: [
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
      'https://images.unsplash.com/photo-1583468982228-19f19164aee2?w=400'
    ],
    location: 'San Francisco, CA',
    distance: 4.2,
    fitnessLevel: 'Expert',
    workoutPreferences: ['Rock Climbing', 'Trail Running', 'Cycling', 'Triathlon'],
    goals: ['Endurance', 'Adventure Sports', 'Competition'],
    availability: ['Morning', 'Weekend'],
    bio: 'Adventure athlete training for Ironman! Love outdoor challenges and exploring new trails. Seek adventure partners! 🏔️',
    lookingFor: ['Adventure Partner', 'Training Buddy'],
    gymLocation: 'Planet Granite Climbing',
    workoutStreak: 156,
    badges: ['🏔️ Adventure King', '🏃‍♂️ Ultra Runner', '🚴‍♂️ Cycling Pro'],
    isOnline: false,
    lastActive: '1 hour ago',
    compatibility: 89
  }
]

export default function FitnessMatch() {
  const [profiles] = useState<FitnessProfile[]>(mockProfiles)
  const [currentProfileIndex, setCurrentProfileIndex] = useState(0)
  const [showFilters, setShowFilters] = useState(false)
  const [matches, setMatches] = useState<FitnessProfile[]>([])
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null)

  const currentProfile = profiles[currentProfileIndex]

  const handleSwipe = (direction: 'left' | 'right') => {
    setSwipeDirection(direction)

    setTimeout(() => {
      if (direction === 'right') {
        setMatches([...matches, currentProfile])
      }

      if (currentProfileIndex < profiles.length - 1) {
        setCurrentProfileIndex(currentProfileIndex + 1)
      } else {
        setCurrentProfileIndex(0)
      }
      setSwipeDirection(null)
    }, 300)
  }

  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)

  const nextPhoto = () => {
    const photoCount = currentProfile.photos.length
    setCurrentPhotoIndex((prev) => (prev + 1) % photoCount)
  }

  const prevPhoto = () => {
    const photoCount = currentProfile.photos.length
    setCurrentPhotoIndex((prev) => (prev - 1 + photoCount) % photoCount)
  }

  const getCompatibilityColor = (score: number) => {
    if (score >= 90) return 'text-green-500'
    if (score >= 80) return 'text-blue-500'
    if (score >= 70) return 'text-yellow-500'
    return 'text-red-500'
  }

  if (!currentProfile) {
    return (
      <div className="max-w-md mx-auto">
        <div className="text-center py-12">
          <Heart className="w-16 h-16 text-pink-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No more profiles!</h2>
          <p className="text-gray-600 mb-6">You've seen all available matches in your area.</p>
          <button
            onClick={() => setCurrentProfileIndex(0)}
            className="btn-primary px-6 py-3"
          >
            Start Over
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold gradient-text">Fitness Match</h1>
        <p className="text-gray-600">Find your perfect workout partner • Connect with fitness enthusiasts • Build lasting relationships</p>
        <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <Users className="w-4 h-4" />
            <span>{profiles.length} Potential Matches</span>
          </div>
          <div className="flex items-center space-x-1">
            <Heart className="w-4 h-4 text-pink-500" />
            <span>{matches.length} Connections</span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Card */}
        <div className="lg:col-span-2">
          <div className="relative max-w-md mx-auto">
            {/* Swipe Card */}
            <div
              className={`relative bg-white rounded-2xl shadow-2xl overflow-hidden transition-transform duration-300 ${
                swipeDirection === 'left' ? 'transform -translate-x-full rotate-12' :
                swipeDirection === 'right' ? 'transform translate-x-full -rotate-12' : ''
              }`}
            >
              {/* Photos */}
              <div className="relative h-96 bg-gray-100">
                <img
                  src={currentProfile.photos[currentPhotoIndex]}
                  alt={currentProfile.name}
                  className="w-full h-full object-cover"
                />

                {/* Photo Navigation */}
                {currentProfile.photos.length > 1 && (
                  <>
                    <button
                      onClick={prevPhoto}
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 p-2 bg-black/30 text-white rounded-full hover:bg-black/50 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={nextPhoto}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-black/30 text-white rounded-full hover:bg-black/50 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    {/* Photo Indicators */}
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex space-x-1">
                      {currentProfile.photos.map((_, index) => (
                        <div
                          key={index}
                          className={`w-2 h-2 rounded-full ${
                            index === currentPhotoIndex ? 'bg-white' : 'bg-white/50'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}

                {/* Online Status */}
                {currentProfile.isOnline && (
                  <div className="absolute top-4 right-4 flex items-center space-x-1 bg-green-500 text-white px-2 py-1 rounded-full text-xs">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span>Online</span>
                  </div>
                )}

                {/* Compatibility Score */}
                <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg">
                  <div className="flex items-center space-x-1">
                    <Star className={`w-4 h-4 ${getCompatibilityColor(currentProfile.compatibility)}`} />
                    <span className={`font-semibold ${getCompatibilityColor(currentProfile.compatibility)}`}>
                      {currentProfile.compatibility}% Match
                    </span>
                  </div>
                </div>
              </div>

              {/* Profile Info */}
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {currentProfile.name}, {currentProfile.age}
                    </h2>
                    <div className="flex items-center space-x-1 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{currentProfile.distance} miles away</span>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    currentProfile.fitnessLevel === 'Beginner' ? 'bg-green-100 text-green-700' :
                    currentProfile.fitnessLevel === 'Intermediate' ? 'bg-blue-100 text-blue-700' :
                    currentProfile.fitnessLevel === 'Advanced' ? 'bg-purple-100 text-purple-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {currentProfile.fitnessLevel}
                  </span>
                </div>

                {/* Bio */}
                <p className="text-gray-700">{currentProfile.bio}</p>

                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                  {currentProfile.badges.map((badge, index) => (
                    <span key={index} className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                      {badge}
                    </span>
                  ))}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 py-4 border-t border-gray-100">
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <Flame className="w-4 h-4 text-orange-500" />
                      <span className="font-semibold text-gray-900">{currentProfile.workoutStreak}</span>
                    </div>
                    <span className="text-xs text-gray-600">Day Streak</span>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <Dumbbell className="w-4 h-4 text-blue-500" />
                      <span className="font-semibold text-gray-900">{currentProfile.workoutPreferences.length}</span>
                    </div>
                    <span className="text-xs text-gray-600">Interests</span>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <Clock className="w-4 h-4 text-green-500" />
                      <span className="font-semibold text-gray-900">{currentProfile.availability.length}</span>
                    </div>
                    <span className="text-xs text-gray-600">Time Slots</span>
                  </div>
                </div>

                {/* Looking For */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Looking For</h4>
                  <div className="flex flex-wrap gap-2">
                    {currentProfile.lookingFor.map((item, index) => (
                      <span key={index} className="bg-pink-50 text-pink-700 px-3 py-1 rounded-full text-sm border border-pink-200">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-center space-x-8 mt-6">
              <button
                onClick={() => handleSwipe('left')}
                className="w-14 h-14 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>

              <button className="w-12 h-12 bg-blue-100 hover:bg-blue-200 rounded-full flex items-center justify-center transition-colors">
                <MessageCircle className="w-5 h-5 text-blue-600" />
              </button>

              <button
                onClick={() => handleSwipe('right')}
                className="w-14 h-14 bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 rounded-full flex items-center justify-center transition-colors"
              >
                <Heart className="w-6 h-6 text-white" />
              </button>

              <button className="w-12 h-12 bg-purple-100 hover:bg-purple-200 rounded-full flex items-center justify-center transition-colors">
                <Star className="w-5 h-5 text-purple-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Profile Details */}
          <div className="glass-card p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Profile Details</h3>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Workout Preferences</h4>
                <div className="flex flex-wrap gap-1">
                  {currentProfile.workoutPreferences.map((pref, index) => (
                    <span key={index} className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">
                      {pref}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Fitness Goals</h4>
                <div className="flex flex-wrap gap-1">
                  {currentProfile.goals.map((goal, index) => (
                    <span key={index} className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs">
                      {goal}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Availability</h4>
                <div className="space-y-1">
                  {currentProfile.availability.map((time, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Clock className="w-3 h-3 text-green-500" />
                      <span className="text-sm text-gray-600">{time}</span>
                    </div>
                  ))}
                </div>
              </div>

              {currentProfile.gymLocation && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Gym Location</h4>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-3 h-3 text-red-500" />
                    <span className="text-sm text-gray-600">{currentProfile.gymLocation}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recent Matches */}
          <div className="glass-card p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Recent Connections ({matches.length})</h3>

            {matches.length > 0 ? (
              <div className="space-y-3">
                {matches.slice(-3).map((match) => (
                  <div key={match.id} className="flex items-center space-x-3">
                    <img
                      src={match.photos[0]}
                      alt={match.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{match.name}</div>
                      <div className="text-sm text-gray-600">{match.distance} miles away</div>
                    </div>
                    <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <MessageCircle className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <Heart className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No connections yet</p>
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Filters</h3>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Sliders className="w-4 h-4" />
              </button>
            </div>

            {showFilters && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Distance</label>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    defaultValue="10"
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1 mile</span>
                    <span>50+ miles</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Age Range</label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      placeholder="Min"
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fitness Level</label>
                  <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                    <option>Any Level</option>
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                    <option>Expert</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}