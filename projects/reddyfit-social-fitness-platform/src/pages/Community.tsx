import React, { useState, useEffect } from 'react'
import {
  Heart,
  MessageCircle,
  Share2,
  Dumbbell,
  Trophy,
  Target,
  Calendar,
  MapPin,
  Users,
  Plus,
  Camera,
  Video,
  Smile,
  ChevronDown,
  Filter,
  Search,
  Flame
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import AzureMediaUpload, { AzureUploadedMedia } from '../components/AzureMediaUpload'

interface Post {
  id: string
  userId: string
  userName: string
  userAvatar: string
  userBadge?: string
  content: string
  media?: AzureUploadedMedia[]
  type: 'workout' | 'progress' | 'nutrition' | 'motivation' | 'achievement'
  likes: number
  comments: number
  shares: number
  timestamp: Date
  location?: string
  workoutType?: string
  isLiked?: boolean
  tags?: string[]
}

const mockPosts: Post[] = [
  {
    id: '1',
    userId: 'user1',
    userName: 'Sarah Chen',
    userAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b5bc?w=150',
    userBadge: '🔥 Streak Queen',
    content: 'Just finished my morning HIIT session! 💪 Who else is crushing their Monday workout? The endorphins are real! #MondayMotivation #HIITWorkout',
    type: 'workout',
    likes: 24,
    comments: 8,
    shares: 3,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    location: 'Gold\'s Gym, Downtown',
    workoutType: 'HIIT Training',
    isLiked: false,
    tags: ['HIIT', 'Cardio', 'MondayMotivation']
  },
  {
    id: '2',
    userId: 'user2',
    userName: 'Mike Rodriguez',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    userBadge: '💎 Transformation King',
    content: 'Progress update! Down 15 lbs in 2 months with consistent training and meal prep. The journey is tough but so worth it! Anyone else on a weight loss journey? Let\'s support each other! 🙌',
    type: 'progress',
    likes: 89,
    comments: 23,
    shares: 12,
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
    isLiked: true,
    tags: ['WeightLoss', 'Transformation', 'Consistency']
  },
  {
    id: '3',
    userId: 'user3',
    userName: 'Emma Thompson',
    userAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
    userBadge: '🥗 Nutrition Expert',
    content: 'Meal prep Sunday is done! ✅ Prepped 20 high-protein meals for the week. Grilled chicken, quinoa, and roasted veggies never looked so good! Recipe in comments 👇',
    type: 'nutrition',
    likes: 156,
    comments: 34,
    shares: 28,
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
    isLiked: false,
    tags: ['MealPrep', 'HighProtein', 'HealthyEating']
  },
  {
    id: '4',
    userId: 'user4',
    userName: 'Alex Kim',
    userAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    userBadge: '🏆 Goal Crusher',
    content: 'ACHIEVEMENT UNLOCKED! 🎉 Just hit my goal of deadlifting 2x my body weight! 315 lbs PR today! The grind never stops. Special thanks to my gym buddy @mike_rodriguez for the spotting! 💪',
    type: 'achievement',
    likes: 203,
    comments: 45,
    shares: 18,
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
    location: 'Iron Paradise Gym',
    workoutType: 'Strength Training',
    isLiked: true,
    tags: ['PersonalRecord', 'Deadlift', 'Strength']
  }
]

export default function Community() {
  const { user } = useAuth()
  const [posts, setPosts] = useState<Post[]>(mockPosts)
  const [newPostContent, setNewPostContent] = useState('')
  const [newPostType, setNewPostType] = useState<Post['type']>('workout')
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [filter, setFilter] = useState<'all' | Post['type']>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [uploadedMedia, setUploadedMedia] = useState<AzureUploadedMedia[]>([])

  const handleLike = (postId: string) => {
    setPosts(posts.map(post =>
      post.id === postId
        ? {
            ...post,
            likes: post.isLiked ? post.likes - 1 : post.likes + 1,
            isLiked: !post.isLiked
          }
        : post
    ))
  }

  const handleCreatePost = () => {
    if (!newPostContent.trim()) return

    const newPost: Post = {
      id: Date.now().toString(),
      userId: user?.uid || 'current-user',
      userName: user?.displayName || 'You',
      userAvatar: user?.photoURL || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
      userBadge: '🚀 Rising Star',
      content: newPostContent,
      media: uploadedMedia.length > 0 ? uploadedMedia : undefined,
      type: newPostType,
      likes: 0,
      comments: 0,
      shares: 0,
      timestamp: new Date(),
      isLiked: false,
      tags: []
    }

    setPosts([newPost, ...posts])
    setNewPostContent('')
    setUploadedMedia([])
    setShowCreatePost(false)
  }

  const filteredPosts = posts.filter(post => {
    const matchesFilter = filter === 'all' || post.type === filter
    const matchesSearch = searchQuery === '' ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))

    return matchesFilter && matchesSearch
  })

  const getPostTypeIcon = (type: Post['type']) => {
    switch (type) {
      case 'workout': return <Dumbbell className="w-4 h-4" />
      case 'progress': return <Target className="w-4 h-4" />
      case 'nutrition': return <Smile className="w-4 h-4" />
      case 'achievement': return <Trophy className="w-4 h-4" />
      case 'motivation': return <Flame className="w-4 h-4" />
      default: return <Users className="w-4 h-4" />
    }
  }

  const getPostTypeColor = (type: Post['type']) => {
    switch (type) {
      case 'workout': return 'bg-blue-100 text-blue-700'
      case 'progress': return 'bg-green-100 text-green-700'
      case 'nutrition': return 'bg-orange-100 text-orange-700'
      case 'achievement': return 'bg-purple-100 text-purple-700'
      case 'motivation': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold gradient-text">ReddyFit Community</h1>
        <p className="text-gray-600">Connect with like-minded fitness enthusiasts • Share your journey • Find your workout partner</p>
        <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <Users className="w-4 h-4" />
            <span>2,847 Active Members</span>
          </div>
          <div className="flex items-center space-x-1">
            <Flame className="w-4 h-4" />
            <span>156 Posts Today</span>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="glass-card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search posts, users, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Posts</option>
              <option value="workout">Workouts</option>
              <option value="progress">Progress</option>
              <option value="nutrition">Nutrition</option>
              <option value="achievement">Achievements</option>
              <option value="motivation">Motivation</option>
            </select>
          </div>
        </div>
      </div>

      {/* Create Post */}
      <div className="glass-card p-6">
        <div className="flex items-center space-x-4 mb-4">
          <img
            src={user?.photoURL || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'}
            alt="Your avatar"
            className="w-12 h-12 rounded-full object-cover"
          />
          <button
            onClick={() => setShowCreatePost(!showCreatePost)}
            className="flex-1 text-left px-4 py-3 rounded-lg border border-gray-200 text-gray-500 hover:border-primary-300 transition-colors"
          >
            Share your fitness journey, achievements, or motivation...
          </button>
          <button
            onClick={() => setShowCreatePost(!showCreatePost)}
            className="btn-primary p-3"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {showCreatePost && (
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Post Type:</label>
              <select
                value={newPostType}
                onChange={(e) => setNewPostType(e.target.value as Post['type'])}
                className="px-3 py-1 rounded-lg border border-gray-200 text-sm"
              >
                <option value="workout">💪 Workout</option>
                <option value="progress">📈 Progress</option>
                <option value="nutrition">🥗 Nutrition</option>
                <option value="achievement">🏆 Achievement</option>
                <option value="motivation">🔥 Motivation</option>
              </select>
            </div>

            <textarea
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="What's on your fitness mind? Share your workout, progress, or motivate others..."
              className="w-full p-4 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={4}
            />

            <AzureMediaUpload
              accept="image/*,video/*"
              multiple={true}
              maxFileSize={50 * 1024 * 1024} // 50MB
              maxFiles={5}
              containerType="communityPosts"
              onUploadComplete={setUploadedMedia}
              uploadedMedia={uploadedMedia}
              allowDelete={true}
              showPreview={true}
              uploadButtonText="Add Photos/Videos"
              dragDropText="Add photos or videos to your post"
              className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg"
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Camera className="w-4 h-4" />
                  <span>Photo</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Video className="w-4 h-4" />
                  <span>Video</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4" />
                  <span>Location</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setShowCreatePost(false)
                    setNewPostContent('')
                    setUploadedMedia([])
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePost}
                  disabled={!newPostContent.trim()}
                  className="btn-primary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Share Post
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Posts Feed */}
      <div className="space-y-6">
        {filteredPosts.map((post) => (
          <div key={post.id} className="glass-card p-6 hover:shadow-lg transition-shadow">
            {/* Post Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <img
                  src={post.userAvatar}
                  alt={post.userName}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-gray-900">{post.userName}</h3>
                    {post.userBadge && (
                      <span className="text-xs bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-2 py-1 rounded-full">
                        {post.userBadge}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span>{formatTimeAgo(post.timestamp)}</span>
                    {post.location && (
                      <>
                        <span>•</span>
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3" />
                          <span>{post.location}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${getPostTypeColor(post.type)}`}>
                {getPostTypeIcon(post.type)}
                <span className="capitalize">{post.type}</span>
              </div>
            </div>

            {/* Post Content */}
            <div className="mb-4">
              <p className="text-gray-800 leading-relaxed">{post.content}</p>

              {post.workoutType && (
                <div className="mt-2 inline-block bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                  {post.workoutType}
                </div>
              )}

              {post.tags && post.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {post.tags.map((tag, index) => (
                    <span key={index} className="text-primary-600 text-sm hover:underline cursor-pointer">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Post Media */}
            {post.media && post.media.length > 0 && (
              <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-lg overflow-hidden">
                {post.media.slice(0, 4).map((media, index) => (
                  <div key={media.id} className="relative aspect-square bg-gray-100">
                    {media.fileType.startsWith('image/') ? (
                      <img
                        src={media.url}
                        alt="Post media"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <video
                        src={media.url}
                        className="w-full h-full object-cover"
                        controls
                      />
                    )}
                    {index === 3 && post.media!.length > 4 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white font-semibold">+{post.media!.length - 4} more</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Post Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex items-center space-x-6">
                <button
                  onClick={() => handleLike(post.id)}
                  className={`flex items-center space-x-2 transition-colors ${
                    post.isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
                  <span className="text-sm font-medium">{post.likes}</span>
                </button>

                <button className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors">
                  <MessageCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">{post.comments}</span>
                </button>

                <button className="flex items-center space-x-2 text-gray-500 hover:text-green-500 transition-colors">
                  <Share2 className="w-5 h-5" />
                  <span className="text-sm font-medium">{post.shares}</span>
                </button>
              </div>

              <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Load More */}
      <div className="text-center">
        <button className="btn-secondary px-8 py-3">
          Load More Posts
        </button>
      </div>
    </div>
  )
}