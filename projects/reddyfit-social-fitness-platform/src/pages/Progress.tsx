import { useState, useEffect } from 'react'
import {
  Camera,
  Scale,
  TrendingUp,
  TrendingDown,
  Target,
  Award,
  Plus,
  Image as ImageIcon,
  BarChart3,
  LineChart,
  Zap,
  Timer,
  Ruler,
  Activity,
  CheckCircle2,
  Upload,
  X,
  Calendar,
  Edit3,
  Trash2,
  Flame,
  Dumbbell,
  Heart,
  Lightning,
  Eye,
  Clock
} from 'lucide-react'
import { format, subWeeks, subMonths } from 'date-fns'
import { useUserProgress, useUserProfile } from '../hooks/useUserData'
import { useAuth } from '../contexts/AuthContext'
import LoadingState from '../components/LoadingState'
import { AppErrorHandler } from '../utils/errorHandling'
import ProgressPhotoUpload from '../components/ProgressPhotoUpload'
import AzureProgressPhotoUpload from '../components/AzureProgressPhotoUpload'
import { UploadedMedia } from '../components/MediaUpload'
import { AzureUploadedMedia } from '../components/AzureMediaUpload'
import { mediaService } from '../services/mediaService'

interface ProgressEntry {
  id: string
  date: Date
  weight: number
  bodyFat?: number
  muscle?: number
  notes?: string
}

interface ProgressPhoto {
  id: string
  date: Date
  type: 'front' | 'side' | 'back'
  url: string
  weight: number
  notes?: string
}

interface BodyMeasurement {
  id: string
  date: Date
  chest: number
  waist: number
  hips: number
  biceps: number
  thighs: number
  notes?: string
}

// Enhanced Transformation Progress Circle Component
interface TransformationProgressProps {
  percentage: number
  size?: number
  daysPassed: number
  totalDays: number
}

function TransformationProgress({ percentage, size = 200, daysPassed, totalDays }: TransformationProgressProps) {
  const radius = 80
  const circumference = radius * 2 * Math.PI
  const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`

  return (
    <div className="relative inline-flex items-center justify-center">
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary-500/30 via-secondary-500/30 to-primary-600/30 blur-2xl animate-pulse"></div>
      <svg width={size} height={size} className="transform -rotate-90 relative z-10">
        <defs>
          <linearGradient id="transformGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="25%" stopColor="#8B5CF6" />
            <stop offset="50%" stopColor="#EC4899" />
            <stop offset="75%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>
          <filter id="transformGlow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="12"
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#transformGradient)"
          strokeWidth="12"
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeLinecap="round"
          filter="url(#transformGlow)"
          className="transition-all duration-2000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
        <div className="text-center">
          <div className="text-3xl font-black bg-gradient-to-r from-primary-400 via-secondary-400 to-primary-500 bg-clip-text text-transparent mb-1">
            DAY {daysPassed}
          </div>
          <div className="text-lg font-bold text-gray-900 mb-1">
            {Math.round(percentage)}% DONE
          </div>
          <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
            TRANSFORMATION
          </div>
        </div>
      </div>
    </div>
  )
}

// Enhanced Measurement Card Component
interface EnhancedMeasurementCardProps {
  icon: React.ComponentType<any>
  title: string
  current: number
  start: number
  unit: string
  target?: number
  color: string
}

function EnhancedMeasurementCard({ icon: Icon, title, current, start, unit, target, color }: EnhancedMeasurementCardProps) {
  const change = start - current
  const progress = target ? ((start - current) / (start - target)) * 100 : 0

  return (
    <div className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${color} p-1 hover:scale-105 transition-all duration-500`}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl"></div>
      <div className="relative bg-white/80 backdrop-blur-sm rounded-xl p-4 h-full border border-white/20">
        <div className="flex items-center justify-between mb-3">
          <div className="p-2 rounded-lg bg-gradient-to-r from-primary-500/20 to-secondary-500/20 backdrop-blur-sm border border-primary-200">
            <Icon className="w-5 h-5 text-primary-600" />
          </div>
          <div className="text-right">
            <div className="text-lg font-black text-gray-900">{current}{unit}</div>
            <div className={`text-xs font-semibold ${
              change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-600'
            }`}>
              {change > 0 ? '-' : change < 0 ? '+' : ''}{Math.abs(change).toFixed(1)}{unit}
            </div>
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-gray-800">{title}</p>
          {target && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
              ></div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface StatCardProps {
  icon: React.ComponentType<any>
  title: string
  value: string | number
  change: string
  trend: 'up' | 'down' | 'neutral'
  color: string
}

function StatCard({ icon: Icon, title, value, change, trend, color }: StatCardProps) {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4" />
      case 'down': return <TrendingDown className="w-4 h-4" />
      default: return <Activity className="w-4 h-4" />
    }
  }

  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-green-600'
      case 'down': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className="glass-morphism p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl bg-gradient-to-r ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className={`flex items-center space-x-1 ${getTrendColor()}`}>
          {getTrendIcon()}
          <span className="text-sm font-semibold">{change}</span>
        </div>
      </div>
      <div className="text-3xl font-black text-gray-900 mb-2">{value}</div>
      <div className="text-sm text-gray-600">{title}</div>
    </div>
  )
}

interface PhotoGalleryProps {
  photos: ProgressPhoto[]
  onAddPhoto: () => void
  onDeletePhoto: (id: string) => void
}

// Enhanced Photo Progress Section
function PhotoProgressSection({ photos, onAddPhoto, onDeletePhoto }: PhotoGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<ProgressPhoto | null>(null)

  return (
    <>
      <div className="glass-morphism p-6 border border-gray-200 rounded-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <div className="p-2 rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 mr-3">
              <Camera className="w-5 h-5 text-white" />
            </div>
            Transformation Photos
          </h2>
          <button
            onClick={onAddPhoto}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Photo</span>
          </button>
        </div>
        
        {/* Photo Timeline Layout */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="aspect-square rounded-xl bg-gradient-to-br from-gray-200 to-gray-300 border-2 border-dashed border-gray-400 flex flex-col items-center justify-center text-center p-4">
            <Camera className="w-8 h-8 text-gray-600 mb-2" />
            <span className="text-xs font-semibold text-gray-700">DAY 1</span>
            <span className="text-xs text-gray-600">Starting Point</span>
          </div>

          <div className="aspect-square rounded-xl bg-gradient-to-br from-primary-100 to-secondary-100 border-2 border-primary-300 flex flex-col items-center justify-center text-center p-4">
            <Eye className="w-8 h-8 text-primary-600 mb-2" />
            <span className="text-xs font-semibold text-gray-800">DAY {Math.max(1, Math.floor((new Date().getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))}</span>
            <span className="text-xs text-primary-600">Current Progress</span>
          </div>

          <div className="aspect-square rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 border-2 border-dashed border-green-300 flex flex-col items-center justify-center text-center p-4">
            <Target className="w-8 h-8 text-green-600 mb-2" />
            <span className="text-xs font-semibold text-gray-800">GOAL</span>
            <span className="text-xs text-green-600">Target Physique</span>
          </div>
        </div>
        
        <button className="w-full group relative overflow-hidden rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 p-3 text-white font-bold text-sm hover:scale-105 transition-all duration-300 shadow-lg">
          <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300"></div>
          <div className="relative flex items-center justify-center space-x-2">
            <Camera className="w-4 h-4" />
            <span>Take Today's Progress Photo</span>
          </div>
        </button>

        
        {/* Existing Photos Grid (if any) */}
        {photos.length > 0 && (
          <div className="mt-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Photo History</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="relative group cursor-pointer rounded-2xl overflow-hidden bg-gray-100 hover:bg-gray-200 transition-all duration-300 border border-gray-200"
                >
                  <div
                    onClick={() => setSelectedPhoto(photo)}
                    className="aspect-[3/4] bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center"
                  >
                    <ImageIcon className="w-16 h-16 text-gray-400" />
                  </div>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeletePhoto(photo.id)
                      }}
                      className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <div className="text-white">
                      <div className="text-sm font-semibold">{format(photo.date, 'MMM d, yyyy')}</div>
                      <div className="text-xs text-white/80">{photo.weight}kg</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Progress Photo</h3>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="aspect-[3/4] bg-gradient-to-br from-primary-100 to-secondary-100 rounded-2xl mb-6 flex items-center justify-center">
                <ImageIcon className="w-24 h-24 text-gray-400" />
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500">Date</label>
                    <div className="text-gray-900 font-semibold">{format(selectedPhoto.date, 'MMMM d, yyyy')}</div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Weight</label>
                    <div className="text-gray-900 font-semibold">{selectedPhoto.weight}kg</div>
                  </div>
                </div>

                {selectedPhoto.notes && (
                  <div>
                    <label className="text-sm text-gray-500">Notes</label>
                    <div className="text-gray-900">{selectedPhoto.notes}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default function Progress() {
  const { user } = useAuth()
  const { profile, loading: profileLoading } = useUserProfile()
  const { progress, loading, addProgress, deleteProgress, updateProgress } = useUserProgress()
  const [activeTab, setActiveTab] = useState<'overview' | 'weight' | 'photos' | 'measurements'>('overview')
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month')
  const [isAddingWeight, setIsAddingWeight] = useState(false)
  const [isAddingPhoto, setIsAddingPhoto] = useState(false)
  const [isAddingMeasurement, setIsAddingMeasurement] = useState(false)
  const [editingEntry, setEditingEntry] = useState<ProgressEntry | null>(null)
  const [newWeight, setNewWeight] = useState('')
  const [newBodyFat, setNewBodyFat] = useState('')
  const [newMuscle, setNewMuscle] = useState('')
  const [newNotes, setNewNotes] = useState('')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [newMeasurements, setNewMeasurements] = useState({
    chest: '',
    waist: '',
    hips: '',
    biceps: '',
    thighs: ''
  })
  const [measurementNotes, setMeasurementNotes] = useState('')
  const [uploadedPhotos, setUploadedPhotos] = useState<UploadedMedia[]>([])
  const [azureUploadedPhotos, setAzureUploadedPhotos] = useState<AzureUploadedMedia[]>([])
  const [photoUploadError, setPhotoUploadError] = useState<string | null>(null)
  const errorHandler = AppErrorHandler.getInstance()

  const currentWeight = profile?.currentWeight || 0
  const startWeight = profile?.startWeight || 0
  const goalWeight = profile?.goalWeight || 0
  const weightLost = startWeight - currentWeight
  const weightToGo = currentWeight - goalWeight
  const progressPercentage = startWeight !== goalWeight ? ((startWeight - currentWeight) / (startWeight - goalWeight)) * 100 : 0

  // Process progress data
  const weightEntries = progress?.weightEntries || []
  const photos = progress?.photos || []
  const measurements = progress?.measurements || []

  const getTimeRangeData = () => {
    const now = new Date()
    switch (timeRange) {
      case 'week':
        return weightEntries.filter(entry => new Date(entry.date) >= subWeeks(now, 1))
      case 'month':
        return weightEntries.filter(entry => new Date(entry.date) >= subMonths(now, 1))
      case 'quarter':
        return weightEntries.filter(entry => new Date(entry.date) >= subMonths(now, 3))
      default:
        return weightEntries
    }
  }

  const recentData = getTimeRangeData()
  const weightChange = recentData.length > 1
    ? recentData[recentData.length - 1].weight - recentData[0].weight
    : 0

  const bodyFatChange = recentData.length > 1 && recentData[0].bodyFat && recentData[recentData.length - 1].bodyFat
    ? recentData[recentData.length - 1].bodyFat! - recentData[0].bodyFat!
    : 0

  const handleAddWeight = async () => {
    if (!newWeight || !user) return

    try {
      setSaveStatus('saving')
      await addProgress({
        type: 'weight',
        data: {
          weight: parseFloat(newWeight),
          bodyFat: newBodyFat ? parseFloat(newBodyFat) : undefined,
          muscle: newMuscle ? parseFloat(newMuscle) : undefined,
          notes: newNotes || undefined
        }
      })
      setSaveStatus('saved')
      setIsAddingWeight(false)
      setNewWeight('')
      setNewBodyFat('')
      setNewMuscle('')
      setNewNotes('')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (error) {
      setSaveStatus('error')
      errorHandler.handleError(error, 'Adding weight entry')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }

  const handleUpdateWeight = async () => {
    if (!editingEntry || !newWeight || !user) return

    try {
      setSaveStatus('saving')
      await updateProgress(editingEntry.id, {
        weight: parseFloat(newWeight),
        bodyFat: newBodyFat ? parseFloat(newBodyFat) : undefined,
        muscle: newMuscle ? parseFloat(newMuscle) : undefined,
        notes: newNotes || undefined
      })
      setSaveStatus('saved')
      setEditingEntry(null)
      setNewWeight('')
      setNewBodyFat('')
      setNewMuscle('')
      setNewNotes('')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (error) {
      setSaveStatus('error')
      errorHandler.handleError(error, 'Updating weight entry')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }

  const handleDeleteWeight = async (id: string) => {
    if (!user) return
    try {
      await deleteProgress(id)
    } catch (error) {
      errorHandler.handleError(error, 'Deleting weight entry')
    }
  }

  const handleDeletePhoto = async (id: string) => {
    if (!user) return
    try {
      await deleteProgress(id)
    } catch (error) {
      errorHandler.handleError(error, 'Deleting progress photo')
    }
  }

  const handleAddMeasurement = async () => {
    if (!user || !Object.values(newMeasurements).some(v => v)) return

    try {
      setSaveStatus('saving')
      await addProgress({
        type: 'measurement',
        data: {
          chest: newMeasurements.chest ? parseFloat(newMeasurements.chest) : undefined,
          waist: newMeasurements.waist ? parseFloat(newMeasurements.waist) : undefined,
          hips: newMeasurements.hips ? parseFloat(newMeasurements.hips) : undefined,
          biceps: newMeasurements.biceps ? parseFloat(newMeasurements.biceps) : undefined,
          thighs: newMeasurements.thighs ? parseFloat(newMeasurements.thighs) : undefined,
          notes: measurementNotes || undefined
        }
      })
      setSaveStatus('saved')
      setIsAddingMeasurement(false)
      setNewMeasurements({ chest: '', waist: '', hips: '', biceps: '', thighs: '' })
      setMeasurementNotes('')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (error) {
      setSaveStatus('error')
      errorHandler.handleError(error, 'Adding body measurements')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }

  const handlePhotosUploaded = async (photos: UploadedMedia[]) => {
    try {
      setUploadedPhotos(photos)
      if (user) {
        await mediaService.addProgressPhotos(user.uid, photos)
      }
      setPhotoUploadError(null)
    } catch (error) {
      const appError = errorHandler.handleError(error, 'Uploading progress photos')
      setPhotoUploadError(appError.message)
    }
  }

  const handleAzurePhotosUploaded = async (photos: AzureUploadedMedia[]) => {
    try {
      setAzureUploadedPhotos(photos)
      setPhotoUploadError(null)
      // Here you would save the Azure URLs to your database
      console.log('Azure photos uploaded:', photos)
    } catch (error) {
      const appError = errorHandler.handleError(error, 'Uploading Azure progress photos')
      setPhotoUploadError(appError.message)
    }
  }

  const startEdit = (entry: ProgressEntry) => {
    setEditingEntry(entry)
    setNewWeight(entry.weight.toString())
    setNewBodyFat(entry.bodyFat?.toString() || '')
    setNewMuscle(entry.muscle?.toString() || '')
    setNewNotes(entry.notes || '')
    setIsAddingWeight(true)
  }

  const estimatedCaloriesBurned = Math.round(weightLost * 7700) // Rough estimate: 1kg = 7700 calories
  const daysActive = Math.floor((new Date().getTime() - new Date(profile?.startDate || Date.now()).getTime()) / (1000 * 60 * 60 * 24))
  const [streak, setStreak] = useState(daysActive > 0 ? Math.min(daysActive, 30) : 0)
  const [todayCalories, setTodayCalories] = useState(1200)
  const [todayProtein, setTodayProtein] = useState(80)
  const dailyCalorieGoal = 1500
  const dailyProteinGoal = 120

  if (loading || profileLoading) {
    return (
      <div className="space-y-6">
        <LoadingState.Card />
        <LoadingState.List rows={3} />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Please sign in to view your progress.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-morphism p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-black gradient-text mb-2">Progress Tracking</h1>
            <p className="text-xl text-gray-700">Monitor your transformation journey</p>
          </div>
          <div className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-gray-600" />
            <span className="text-gray-700 font-medium">{weightToGo > 0 ? `${weightToGo.toFixed(1)}kg to goal` : 'Goal achieved!'}</span>
          </div>
        </div>

        {/* Enhanced Transformation Progress */}
        <div className="mb-8">
          <div className="text-center mb-6">
            <TransformationProgress 
              percentage={Math.min(progressPercentage, 100)}
              daysPassed={daysActive}
              totalDays={Math.max(daysActive, 90)}
            />
          </div>
          
          <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-2xl p-6 border border-primary-200">
            <h2 className="text-2xl font-black text-center text-gray-900 mb-4">
              {weightLost.toFixed(1)}kg LOST • {daysActive} DAYS IN
            </h2>
            <p className="text-center text-gray-700 font-semibold mb-6">
              {weightToGo > 0 ? `${weightToGo.toFixed(1)}kg to reach your goal weight` : 'Goal achieved! 🎉'}
            </p>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-xl bg-white/70 backdrop-blur-sm border border-white/50">
                <p className="text-xl font-black bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">{startWeight}kg</p>
                <p className="text-xs font-semibold text-gray-600 uppercase">Start</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-white/70 backdrop-blur-sm border border-white/50">
                <p className="text-xl font-black text-gray-900">{currentWeight}kg</p>
                <p className="text-xs font-semibold text-gray-600 uppercase">Current</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-white/70 backdrop-blur-sm border border-white/50">
                <p className="text-xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{goalWeight}kg</p>
                <p className="text-xs font-semibold text-gray-600 uppercase">Goal</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Enhanced Daily Tracking */}
        <div className="mb-6">
          <div className="glass-morphism p-6 border border-gray-200 rounded-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <div className="p-2 rounded-lg bg-gradient-to-r from-primary-500 to-secondary-500 mr-3">
                <Clock className="w-5 h-5 text-white" />
              </div>
              Today's Nutrition
            </h3>

            <div className="space-y-4 mb-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-gray-800">Calories ({todayCalories}/{dailyCalorieGoal})</span>
                  <span className="text-sm font-bold text-primary-600">{Math.round((todayCalories/dailyCalorieGoal)*100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-primary-500 to-secondary-500 h-3 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min((todayCalories/dailyCalorieGoal)*100, 100)}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-gray-800">Protein ({todayProtein}g/{dailyProteinGoal}g)</span>
                  <span className="text-sm font-bold text-primary-600">{Math.round((todayProtein/dailyProteinGoal)*100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min((todayProtein/dailyProteinGoal)*100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setTodayCalories(prev => Math.min(prev + 200, dailyCalorieGoal))}
                className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-primary-600 to-secondary-500 p-3 text-white font-bold text-sm hover:scale-105 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300"></div>
                <span className="relative">+200 Cal</span>
              </button>
              <button
                onClick={() => setTodayProtein(prev => Math.min(prev + 25, dailyProteinGoal))}
                className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 p-3 text-white font-bold text-sm hover:scale-105 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300"></div>
                <span className="relative">+25g Protein</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Streak Achievement */}
        {streak > 7 && (
          <div className="mb-6">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500/30 via-red-500/30 to-pink-500/30 p-1">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 rounded-2xl blur-xl opacity-50 animate-pulse"></div>
              <div className="relative bg-white/90 backdrop-blur-sm rounded-xl p-6 border border-orange-200">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-400 rounded-full blur-lg animate-pulse"></div>
                    <div className="relative p-3 rounded-full bg-gradient-to-r from-orange-500 to-red-500 shadow-lg">
                      <Flame className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xl font-black bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                      🔥 {streak} DAY STREAK!
                    </h4>
                    <p className="text-sm font-semibold text-gray-800">Your transformation is unstoppable!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Body Measurements */}
        {measurements.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <Ruler className="w-5 h-5 mr-2 text-primary-600" />
              Body Measurements
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {measurements.length > 0 && [
                { key: 'waist', icon: Scale, title: 'Waist', target: 75, color: 'from-red-600 via-orange-500 to-yellow-500' },
                { key: 'chest', icon: Dumbbell, title: 'Chest', target: 110, color: 'from-blue-600 via-purple-500 to-pink-500' },
                { key: 'biceps', icon: Zap, title: 'Biceps', target: 40, color: 'from-green-600 via-teal-500 to-blue-500' },
                { key: 'hips', icon: Heart, title: 'Hips', target: 95, color: 'from-purple-600 via-pink-500 to-red-500' }
              ].map(({ key, icon, title, target, color }) => {
                const latest = measurements[measurements.length - 1]
                const start = measurements[0]
                const current = latest?.[key as keyof BodyMeasurement] as number
                const startValue = start?.[key as keyof BodyMeasurement] as number
                
                return current ? (
                  <EnhancedMeasurementCard
                    key={key}
                    icon={icon}
                    title={title}
                    current={current}
                    start={startValue || current}
                    unit="cm"
                    target={target}
                    color={color}
                  />
                ) : null
              })}
            </div>
          </div>
        )}
        
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={Scale}
            title="Weight Lost"
            value={`${weightLost.toFixed(1)}kg`}
            change={`${weightChange >= 0 ? '+' : ''}${weightChange.toFixed(1)}kg`}
            trend={weightChange < 0 ? 'down' : weightChange > 0 ? 'up' : 'neutral'}
            color="from-blue-500 to-blue-600"
          />
          <StatCard
            icon={Zap}
            title="Body Fat Change"
            value={`${Math.abs(bodyFatChange).toFixed(1)}%`}
            change={`${bodyFatChange >= 0 ? '+' : ''}${bodyFatChange.toFixed(1)}%`}
            trend={bodyFatChange < 0 ? 'down' : bodyFatChange > 0 ? 'up' : 'neutral'}
            color="from-orange-500 to-orange-600"
          />
          <StatCard
            icon={Timer}
            title="Days Active"
            value={daysActive.toString()}
            change="+1 day"
            trend="up"
            color="from-green-500 to-green-600"
          />
          <StatCard
            icon={Award}
            title="Est. Calories Burned"
            value={estimatedCaloriesBurned > 1000 ? `${Math.round(estimatedCaloriesBurned / 1000)}k` : estimatedCaloriesBurned.toString()}
            change="+500"
            trend="up"
            color="from-purple-500 to-purple-600"
          />
        </div>

        {/* Save Status */}
        {saveStatus !== 'idle' && (
          <div className={`mt-4 p-3 rounded-lg flex items-center space-x-2 ${
            saveStatus === 'saving' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
            saveStatus === 'saved' ? 'bg-green-50 text-green-700 border border-green-200' :
            'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {saveStatus === 'saving' && <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-700 border-t-transparent" />}
            {saveStatus === 'saved' && <CheckCircle2 className="w-4 h-4" />}
            {saveStatus === 'error' && <X className="w-4 h-4" />}
            <span className="text-sm font-medium">
              {saveStatus === 'saving' && 'Saving...'}
              {saveStatus === 'saved' && 'Saved successfully!'}
              {saveStatus === 'error' && 'Error saving. Please try again.'}
            </span>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-2 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'weight', label: 'Weight Tracking', icon: Scale },
          { id: 'photos', label: 'Progress Photos', icon: Camera },
          { id: 'measurements', label: 'Body Measurements', icon: Ruler }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 whitespace-nowrap ${
              activeTab === id
                ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weight Chart */}
          <div className="glass-morphism p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Weight Trend</h2>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="input-field text-sm"
              >
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="quarter">Last 3 Months</option>
              </select>
            </div>

            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <LineChart className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="font-medium">Weight progression chart</p>
                <p className="text-sm">Trending {weightChange < 0 ? 'downward ↓' : weightChange > 0 ? 'upward ↑' : 'stable →'}</p>
                {recentData.length > 0 && (
                  <p className="text-xs mt-2">{recentData.length} entries in selected period</p>
                )}
              </div>
            </div>
          </div>

          {/* Body Composition */}
          <div className="glass-morphism p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Body Composition</h2>

            <div className="space-y-6">
              {recentData.length > 0 && recentData[recentData.length - 1].bodyFat && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-700">Body Fat</span>
                    <span className="text-orange-600 font-semibold">{recentData[recentData.length - 1].bodyFat}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
                      style={{ width: `${Math.min(recentData[recentData.length - 1].bodyFat || 0, 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {recentData.length > 0 && recentData[recentData.length - 1].muscle && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-700">Muscle Mass</span>
                    <span className="text-blue-600 font-semibold">{recentData[recentData.length - 1].muscle}kg</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" style={{ width: '85%' }} />
                  </div>
                </div>
              )}

              {(!recentData.length || (!recentData[recentData.length - 1].bodyFat && !recentData[recentData.length - 1].muscle)) && (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No body composition data yet</p>
                  <p className="text-sm">Add body fat and muscle data when logging weight</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Achievements */}
          <div className="glass-morphism p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <Award className="w-6 h-6 mr-2" />
              Recent Milestones
            </h2>

            <div className="space-y-4">
              {weightLost > 0 && (
                <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-xl border border-green-200">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                  <div>
                    <div className="text-gray-900 font-semibold">Lost {weightLost.toFixed(1)}kg total!</div>
                    <div className="text-green-600 text-sm">Great progress towards your goal</div>
                  </div>
                </div>
              )}

              {daysActive >= 7 && (
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-xl border border-blue-200">
                  <CheckCircle2 className="w-6 h-6 text-blue-600" />
                  <div>
                    <div className="text-gray-900 font-semibold">{daysActive} days on your journey</div>
                    <div className="text-blue-600 text-sm">Consistency is key!</div>
                  </div>
                </div>
              )}

              {progressPercentage >= 25 && (
                <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-xl border border-purple-200">
                  <CheckCircle2 className="w-6 h-6 text-purple-600" />
                  <div>
                    <div className="text-gray-900 font-semibold">{Math.round(progressPercentage)}% to your goal</div>
                    <div className="text-purple-600 text-sm">You're making excellent progress!</div>
                  </div>
                </div>
              )}

              {weightEntries.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Your achievements will appear here</p>
                  <p className="text-sm">Start logging your progress to see milestones</p>
                </div>
              )}
            </div>
          </div>

          {/* Goals */}
          <div className="glass-morphism p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <Target className="w-6 h-6 mr-2" />
              Goals
            </h2>

            <div className="space-y-4">
              {weightToGo > 0 && (
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-900 font-semibold">Reach {goalWeight}kg</span>
                    <span className="text-primary-600">{weightToGo.toFixed(1)}kg to go</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full"
                      style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Keep up the great work!</div>
                </div>
              )}

              {weightToGo <= 0 && goalWeight > 0 && (
                <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                  <div className="flex items-center space-x-3">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                    <div>
                      <div className="text-gray-900 font-semibold">Goal Achieved! 🎉</div>
                      <div className="text-green-600 text-sm">You've reached your target weight of {goalWeight}kg</div>
                    </div>
                  </div>
                </div>
              )}

              {goalWeight === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Set your goals in your profile</p>
                  <p className="text-sm">Define your target weight to track progress</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'weight' && (
        <div className="space-y-6">
          {/* Add Weight Entry */}
          <div className="glass-morphism p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Weight Entries</h2>
              <button onClick={() => setIsAddingWeight(true)} className="btn-primary flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Log Weight</span>
              </button>
            </div>

            {/* Weight History Table */}
            {weightEntries.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Scale className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="mb-4">No weight entries yet</p>
                <button onClick={() => setIsAddingWeight(true)} className="btn-primary">
                  Log Your First Weight
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left text-gray-600 py-3 font-medium">Date</th>
                      <th className="text-left text-gray-600 py-3 font-medium">Weight</th>
                      <th className="text-left text-gray-600 py-3 font-medium">Body Fat</th>
                      <th className="text-left text-gray-600 py-3 font-medium">Change</th>
                      <th className="text-left text-gray-600 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {weightEntries
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .slice(0, 10)
                      .map((entry, index) => {
                        const allEntries = [...weightEntries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                        const entryIndex = allEntries.findIndex(e => e.id === entry.id)
                        const previousEntry = entryIndex > 0 ? allEntries[entryIndex - 1] : null
                        const change = previousEntry ? entry.weight - previousEntry.weight : 0

                        return (
                          <tr key={entry.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="text-gray-900 py-3">{format(new Date(entry.date), 'MMM d, yyyy')}</td>
                            <td className="text-gray-900 py-3 font-semibold">{entry.weight}kg</td>
                            <td className="text-gray-900 py-3">{entry.bodyFat ? `${entry.bodyFat}%` : '-'}</td>
                            <td className="py-3">
                              {change !== 0 && (
                                <div className={`flex items-center space-x-1 ${change < 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {change < 0 ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                                  <span className="text-sm font-semibold">
                                    {change > 0 ? '+' : ''}{change.toFixed(1)}kg
                                  </span>
                                </div>
                              )}
                            </td>
                            <td className="py-3">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => startEdit(entry)}
                                  className="text-primary-600 hover:text-primary-700 p-1"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteWeight(entry.id)}
                                  className="text-red-600 hover:text-red-700 p-1"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'photos' && (
        <div className="space-y-6">
          {/* Azure Blob Storage Upload - RECOMMENDED */}
          <AzureProgressPhotoUpload
            onPhotosUploaded={handleAzurePhotosUploaded}
            existingPhotos={azureUploadedPhotos}
          />

          {/* Firebase Storage Upload - Legacy */}
          <div className="border-t border-gray-200 pt-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium text-yellow-800">Legacy Firebase Storage (Higher Costs)</span>
              </div>
            </div>

            <ProgressPhotoUpload
              onPhotosUploaded={handlePhotosUploaded}
              existingPhotos={uploadedPhotos}
            />
          </div>

          {photoUploadError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-red-700">{photoUploadError}</p>
              </div>
            </div>
          )}

          {/* Enhanced Photo Progress Section */}
          <PhotoProgressSection
            photos={photos}
            onAddPhoto={() => setIsAddingPhoto(true)}
            onDeletePhoto={handleDeletePhoto}
          />
        </div>
      )}

      {activeTab === 'measurements' && (
        <div className="glass-morphism p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Body Measurements</h2>
            <button onClick={() => setIsAddingMeasurement(true)} className="btn-primary flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Add Measurement</span>
            </button>
          </div>

          {measurements.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Ruler className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="mb-4">No body measurements yet</p>
              <button onClick={() => setIsAddingMeasurement(true)} className="btn-primary">
                Record Your First Measurements
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {['chest', 'waist', 'hips', 'biceps', 'thighs'].map((measurement) => {
                const latest = measurements[measurements.length - 1]
                const previous = measurements[measurements.length - 2]
                const current = latest?.[measurement as keyof BodyMeasurement] as number
                const change = previous && current ? current - (previous[measurement as keyof BodyMeasurement] as number) : 0

                return (
                  <div key={measurement} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-gray-900 font-semibold capitalize">{measurement}</h3>
                      {change !== 0 && (
                        <div className={`flex items-center space-x-1 ${change < 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {change < 0 ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                          <span className="text-xs">{change > 0 ? '+' : ''}{change}cm</span>
                        </div>
                      )}
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-2">{current || '-'}cm</div>
                    <div className="text-xs text-gray-500">
                      {latest ? `Last updated: ${format(new Date(latest.date), 'MMM d')}` : 'No data'}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Weight Modal */}
      {isAddingWeight && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                {editingEntry ? 'Edit Weight Entry' : 'Log Weight'}
              </h3>
              <button
                onClick={() => {
                  setIsAddingWeight(false)
                  setEditingEntry(null)
                  setNewWeight('')
                  setNewBodyFat('')
                  setNewMuscle('')
                  setNewNotes('')
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Weight (kg) *</label>
                <input
                  type="number"
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  step="0.1"
                  className="input-field"
                  placeholder="Enter your weight"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Body Fat % (optional)</label>
                <input
                  type="number"
                  value={newBodyFat}
                  onChange={(e) => setNewBodyFat(e.target.value)}
                  step="0.1"
                  className="input-field"
                  placeholder="Enter body fat percentage"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Muscle Mass (kg) (optional)</label>
                <input
                  type="number"
                  value={newMuscle}
                  onChange={(e) => setNewMuscle(e.target.value)}
                  step="0.1"
                  className="input-field"
                  placeholder="Enter muscle mass"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Notes (optional)</label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="input-field"
                  rows={3}
                  placeholder="Add any notes about this entry..."
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setIsAddingWeight(false)
                  setEditingEntry(null)
                  setNewWeight('')
                  setNewBodyFat('')
                  setNewMuscle('')
                  setNewNotes('')
                }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={editingEntry ? handleUpdateWeight : handleAddWeight}
                disabled={!newWeight || saveStatus === 'saving'}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saveStatus === 'saving' ? 'Saving...' : editingEntry ? 'Update' : 'Save Entry'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Photo Modal */}
      {isAddingPhoto && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Add Progress Photo</h3>
              <button
                onClick={() => setIsAddingPhoto(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-primary-400 transition-colors">
                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 mb-2">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
                <p className="text-xs text-blue-600 mt-2">Photo upload feature coming soon!</p>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Photo Type</label>
                <select className="input-field">
                  <option value="front">Front View</option>
                  <option value="side">Side View</option>
                  <option value="back">Back View</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Notes (optional)</label>
                <textarea
                  className="input-field"
                  rows={3}
                  placeholder="Add any notes about this photo..."
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button onClick={() => setIsAddingPhoto(false)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button onClick={() => setIsAddingPhoto(false)} className="btn-primary flex-1">
                Save Photo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Measurements Modal */}
      {isAddingMeasurement && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Add Body Measurements</h3>
              <button
                onClick={() => setIsAddingMeasurement(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {Object.entries(newMeasurements).map(([key, value]) => (
                <div key={key}>
                  <label className="block text-gray-700 font-medium mb-2 capitalize">
                    {key} (cm)
                  </label>
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => setNewMeasurements(prev => ({ ...prev, [key]: e.target.value }))}
                    step="0.1"
                    className="input-field"
                    placeholder={`Enter ${key} measurement`}
                  />
                </div>
              ))}

              <div>
                <label className="block text-gray-700 font-medium mb-2">Notes (optional)</label>
                <textarea
                  value={measurementNotes}
                  onChange={(e) => setMeasurementNotes(e.target.value)}
                  className="input-field"
                  rows={3}
                  placeholder="Add any notes about these measurements..."
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setIsAddingMeasurement(false)
                  setNewMeasurements({ chest: '', waist: '', hips: '', biceps: '', thighs: '' })
                  setMeasurementNotes('')
                }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMeasurement}
                disabled={!Object.values(newMeasurements).some(v => v) || saveStatus === 'saving'}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saveStatus === 'saving' ? 'Saving...' : 'Save Measurements'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}