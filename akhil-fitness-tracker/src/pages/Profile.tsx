import React, { useState } from 'react'
import {
  User,
  MapPin,
  Calendar,
  Target,
  Trophy,
  Dumbbell,
  Heart,
  MessageCircle,
  UserPlus,
  Camera,
  Edit,
  Settings,
  Share2,
  Award,
  TrendingUp,
  Clock,
  Flame,
  Star,
  Crown,
  Medal
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import AzureProgressPhotoUpload from '../components/AzureProgressPhotoUpload'
import { type AzureUploadedMedia } from '../components/AzureMediaUpload'

interface UserProfile {
  id: string
  name: string
  avatar: string
  coverPhoto?: string
  bio: string
  location: string
  age: number
  fitnessLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'
  fitnessGoals: string[]
  joinDate: Date
  stats: {
    workoutStreak: number
    totalWorkouts: number
    weightLost: number
    strengthGains: number
    followers: number
    following: number
    posts: number
  }
  badges: Badge[]
  achievements: Achievement[]
  interests: string[]
  availability: string[]
  lookingFor: string[]
  progressPhotos: AzureUploadedMedia[]
  recentWorkouts: Workout[]
}

interface Badge {
  id: string
  name: string
  icon: string
  description: string
  earnedDate: Date
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

interface Achievement {
  id: string
  title: string
  description: string
  progress: number
  target: number
  icon: string
  completedDate?: Date
}

interface Workout {
  id: string
  name: string
  type: string
  duration: number
  date: Date
  calories: number
}

const mockProfile: UserProfile = {
  id: 'user1',
  name: 'Sarah Chen',
  avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b5bc?w=400',
  coverPhoto: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200',
  bio: 'Fitness enthusiast on a journey to become the strongest version of myself! 💪 Love HIIT workouts, rock climbing, and helping others reach their goals. Always up for a workout buddy!',
  location: 'San Francisco, CA',
  age: 28,
  fitnessLevel: 'Intermediate',
  fitnessGoals: ['Weight Loss', 'Strength Building', 'Endurance', 'Flexibility'],
  joinDate: new Date('2024-01-15'),
  stats: {
    workoutStreak: 23,
    totalWorkouts: 156,
    weightLost: 15,
    strengthGains: 45,
    followers: 342,
    following: 198,
    posts: 89
  },
  badges: [
    {
      id: '1',
      name: 'Streak Master',
      icon: '🔥',
      description: '30-day workout streak',
      earnedDate: new Date('2024-08-15'),
      rarity: 'epic'
    },
    {
      id: '2',
      name: 'Weight Crusher',
      icon: '💪',
      description: 'Lost 10+ lbs',
      earnedDate: new Date('2024-07-20'),
      rarity: 'rare'
    },
    {
      id: '3',
      name: 'Social Butterfly',
      icon: '🦋',
      description: '100+ connections',
      earnedDate: new Date('2024-09-01'),
      rarity: 'common'
    },
    {
      id: '4',
      name: 'Progress Pioneer',
      icon: '📈',
      description: 'Shared 50+ progress updates',
      earnedDate: new Date('2024-09-10'),
      rarity: 'rare'
    }
  ],
  achievements: [
    {
      id: '1',
      title: 'Workout Warrior',
      description: 'Complete 200 workouts',
      progress: 156,
      target: 200,
      icon: '⚔️'
    },
    {
      id: '2',
      title: 'Transformation Master',
      description: 'Lose 20 lbs',
      progress: 15,
      target: 20,
      icon: '🦋'
    },
    {
      id: '3',
      title: 'Strength Beast',
      description: 'Increase total strength by 50%',
      progress: 45,
      target: 50,
      icon: '🦁'
    }
  ],
  interests: ['HIIT Training', 'Rock Climbing', 'Yoga', 'Meal Prep', 'Running', 'CrossFit'],
  availability: ['Morning (6-9 AM)', 'Evening (6-8 PM)', 'Weekends'],
  lookingFor: ['Workout Partner', 'Accountability Buddy', 'Fitness Friend', 'Dating'],
  progressPhotos: [],
  recentWorkouts: [
    {
      id: '1',
      name: 'Morning HIIT Blast',
      type: 'HIIT',
      duration: 45,
      date: new Date(),
      calories: 380
    },
    {
      id: '2',
      name: 'Upper Body Strength',
      type: 'Strength',
      duration: 60,
      date: new Date(Date.now() - 24 * 60 * 60 * 1000),
      calories: 290
    },
    {
      id: '3',
      name: 'Rock Climbing Session',
      type: 'Climbing',
      duration: 90,
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      calories: 520
    }
  ]
}

export default function Profile() {
  const { user } = useAuth()
  const [profile] = useState<UserProfile>(mockProfile)
  const [_isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'progress' | 'achievements' | 'activity'>('overview')
  const [progressPhotos, setProgressPhotos] = useState<AzureUploadedMedia[]>([])

  const getBadgeColor = (rarity: Badge['rarity']) => {
    switch (rarity) {
      case 'common': return 'bg-gray-100 border-gray-300'
      case 'rare': return 'bg-blue-100 border-blue-300'
      case 'epic': return 'bg-purple-100 border-purple-300'
      case 'legendary': return 'bg-gradient-to-r from-yellow-100 to-orange-100 border-yellow-300'
      default: return 'bg-gray-100 border-gray-300'
    }
  }

  const formatJoinDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      year: 'numeric'
    }).format(date)
  }

  const calculateAchievementProgress = (progress: number, target: number) => {
    return Math.min((progress / target) * 100, 100)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Cover Photo & Avatar */}
      <div className="relative">
        <div
          className="h-48 sm:h-64 rounded-2xl bg-gradient-to-r from-primary-400 to-secondary-400 bg-cover bg-center relative overflow-hidden"
          style={profile.coverPhoto ? { backgroundImage: `url(${profile.coverPhoto})` } : {}}
        >
          <div className="absolute inset-0 bg-black/20"></div>
          <button className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-lg hover:bg-black/70 transition-colors">
            <Camera className="w-4 h-4" />
          </button>
        </div>

        <div className="absolute -bottom-16 left-6 flex items-end space-x-4">
          <div className="relative">
            <img
              src={profile.avatar}
              alt={profile.name}
              className="w-32 h-32 rounded-2xl border-4 border-white shadow-lg object-cover"
            />
            <button className="absolute bottom-2 right-2 p-2 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow">
              <Camera className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          <div className="pb-4 text-white">
            <h1 className="text-2xl font-bold">{profile.name}</h1>
            <p className="flex items-center space-x-1 text-white/90">
              <MapPin className="w-4 h-4" />
              <span>{profile.location}</span>
            </p>
          </div>
        </div>

        <div className="absolute bottom-4 right-4 flex items-center space-x-2">
          <button className="btn-secondary text-sm px-4 py-2">
            <MessageCircle className="w-4 h-4 mr-2" />
            Message
          </button>
          <button className="btn-primary text-sm px-4 py-2">
            <UserPlus className="w-4 h-4 mr-2" />
            Connect
          </button>
        </div>
      </div>

      {/* Profile Info */}
      <div className="mt-20 glass-card p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-4 lg:space-y-0">
          <div className="space-y-4">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <h2 className="text-xl font-bold text-gray-900">{profile.name}</h2>
                <span className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  {profile.fitnessLevel}
                </span>
                {profile.badges.find(b => b.rarity === 'legendary') && (
                  <Crown className="w-5 h-5 text-yellow-500" />
                )}
              </div>
              <p className="text-gray-600 max-w-2xl">{profile.bio}</p>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>Joined {formatJoinDate(profile.joinDate)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <User className="w-4 h-4" />
                <span>{profile.age} years old</span>
              </div>
              <div className="flex items-center space-x-1">
                <Flame className="w-4 h-4 text-orange-500" />
                <span>{profile.stats.workoutStreak} day streak</span>
              </div>
            </div>

            {/* Fitness Goals */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Fitness Goals</h3>
              <div className="flex flex-wrap gap-2">
                {profile.fitnessGoals.map((goal, index) => (
                  <span key={index} className="bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-sm">
                    {goal}
                  </span>
                ))}
              </div>
            </div>

            {/* Looking For */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Looking For</h3>
              <div className="flex flex-wrap gap-2">
                {profile.lookingFor.map((item, index) => (
                  <span key={index} className="bg-pink-50 text-pink-700 px-3 py-1 rounded-full text-sm border border-pink-200">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-4 lg:min-w-[200px]">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{profile.stats.followers}</div>
              <div className="text-sm text-gray-600">Followers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{profile.stats.following}</div>
              <div className="text-sm text-gray-600">Following</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{profile.stats.posts}</div>
              <div className="text-sm text-gray-600">Posts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{profile.stats.totalWorkouts}</div>
              <div className="text-sm text-gray-600">Workouts</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="glass-card">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: User },
              { id: 'progress', label: 'Progress', icon: TrendingUp },
              { id: 'achievements', label: 'Achievements', icon: Trophy },
              { id: 'activity', label: 'Activity', icon: Clock }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center space-x-2 py-4 border-b-2 transition-colors ${
                  activeTab === id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <Flame className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Streak</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-900">{profile.stats.workoutStreak}</div>
                  <div className="text-xs text-blue-700">days</div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <Target className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Weight Lost</span>
                  </div>
                  <div className="text-2xl font-bold text-green-900">{profile.stats.weightLost}</div>
                  <div className="text-xs text-green-700">lbs</div>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <Dumbbell className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-medium text-purple-800">Strength</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-900">+{profile.stats.strengthGains}</div>
                  <div className="text-xs text-purple-700">% gained</div>
                </div>

                <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <Trophy className="w-5 h-5 text-orange-600" />
                    <span className="text-sm font-medium text-orange-800">Workouts</span>
                  </div>
                  <div className="text-2xl font-bold text-orange-900">{profile.stats.totalWorkouts}</div>
                  <div className="text-xs text-orange-700">completed</div>
                </div>
              </div>

              {/* Interests & Availability */}
              <div className="grid lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Interests</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.interests.map((interest, index) => (
                      <span key={index} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Availability</h3>
                  <div className="space-y-2">
                    {profile.availability.map((time, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-gray-700">{time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Workouts */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Recent Workouts</h3>
                <div className="space-y-3">
                  {profile.recentWorkouts.map((workout) => (
                    <div key={workout.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                          <Dumbbell className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{workout.name}</div>
                          <div className="text-sm text-gray-600">{workout.type} • {workout.duration} min</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-gray-900">{workout.calories} cal</div>
                        <div className="text-sm text-gray-600">
                          {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(workout.date)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'progress' && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Progress Photos</h3>
                <p className="text-gray-600">Track your transformation journey</p>
              </div>

              <AzureProgressPhotoUpload
                onPhotosUploaded={setProgressPhotos}
                existingPhotos={progressPhotos}
              />

              {progressPhotos.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No progress photos yet</h3>
                  <p className="text-gray-600">Start documenting your fitness journey!</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'achievements' && (
            <div className="space-y-6">
              {/* Badges */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Badges Earned</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {profile.badges.map((badge) => (
                    <div key={badge.id} className={`p-4 rounded-lg border-2 ${getBadgeColor(badge.rarity)}`}>
                      <div className="text-center">
                        <div className="text-3xl mb-2">{badge.icon}</div>
                        <div className="font-medium text-gray-900">{badge.name}</div>
                        <div className="text-xs text-gray-600 mt-1">{badge.description}</div>
                        <div className="text-xs text-gray-500 mt-2">
                          {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(badge.earnedDate)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Achievements in Progress */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Achievements in Progress</h3>
                <div className="space-y-4">
                  {profile.achievements.map((achievement) => (
                    <div key={achievement.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{achievement.icon}</span>
                          <div>
                            <div className="font-medium text-gray-900">{achievement.title}</div>
                            <div className="text-sm text-gray-600">{achievement.description}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-gray-900">{achievement.progress}/{achievement.target}</div>
                          <div className="text-sm text-gray-600">{Math.round(calculateAchievementProgress(achievement.progress, achievement.target))}%</div>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${calculateAchievementProgress(achievement.progress, achievement.target)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-6">
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Activity Feed</h3>
                <p className="text-gray-600">Recent activities will appear here</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}