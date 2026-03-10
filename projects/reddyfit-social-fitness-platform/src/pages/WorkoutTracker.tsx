import { useState, useEffect } from 'react'
import {
  Play,
  Pause,
  Square,
  Timer,
  Dumbbell,
  Plus,
  Target,
  Flame,
  Trophy,
  Calendar,
  Clock,
  RotateCcw,
  Edit3,
  Trash2,
  Save,
  X,
  CalendarDays,
  Bell,
  Repeat,
  TrendingUp,
  Brain,
  Moon,
  Sun,
  Zap,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Star,
  Settings
} from 'lucide-react'
import { useUserWorkouts } from '../hooks/useUserData'
import { useAuth } from '../contexts/AuthContext'
import LoadingState from '../components/LoadingState'
import type { WorkoutEntry, Exercise } from '../services/userService'

// Advanced Workout Scheduling Types
interface ScheduledWorkout {
  id: string
  templateId: number
  date: Date
  time: string
  status: 'scheduled' | 'completed' | 'missed' | 'skipped'
  difficulty: 'easy' | 'normal' | 'hard'
  adaptations?: string[]
}

interface WorkoutSchedule {
  id: string
  name: string
  workouts: {
    monday?: number[]
    tuesday?: number[]
    wednesday?: number[]
    thursday?: number[]
    friday?: number[]
    saturday?: number[]
    sunday?: number[]
  }
  startDate: Date
  endDate?: Date
  isActive: boolean
}

// Smart Recommendations
const SMART_RECOMMENDATIONS = {
  beginner: {
    frequency: 3,
    restDays: 1,
    progression: 'slow',
    focus: ['form', 'consistency']
  },
  intermediate: {
    frequency: 4,
    restDays: 1,
    progression: 'moderate',
    focus: ['strength', 'endurance']
  },
  advanced: {
    frequency: 5,
    restDays: 2,
    progression: 'fast',
    focus: ['power', 'specialization']
  }
}

// Workout Templates
const WORKOUT_TEMPLATES = [
  {
    id: 1,
    name: 'Upper Body Strength',
    duration: 45,
    difficulty: 'Intermediate',
    calories: 250,
    exercises: [
      { name: 'Push-ups', sets: 3, reps: 12, weight: 0, type: 'bodyweight' },
      { name: 'Pull-ups', sets: 3, reps: 8, weight: 0, type: 'bodyweight' },
      { name: 'Dumbbell Press', sets: 3, reps: 10, weight: 20, type: 'weights' },
      { name: 'Rows', sets: 3, reps: 12, weight: 15, type: 'weights' },
      { name: 'Plank', sets: 3, duration: 30, type: 'hold' }
    ]
  },
  {
    id: 2,
    name: 'Lower Body Power',
    duration: 40,
    difficulty: 'Advanced',
    calories: 300,
    exercises: [
      { name: 'Squats', sets: 4, reps: 15, weight: 0, type: 'bodyweight' },
      { name: 'Lunges', sets: 3, reps: 12, weight: 0, type: 'bodyweight' },
      { name: 'Deadlifts', sets: 3, reps: 8, weight: 40, type: 'weights' },
      { name: 'Calf Raises', sets: 3, reps: 20, weight: 0, type: 'bodyweight' },
      { name: 'Wall Sit', sets: 3, duration: 45, type: 'hold' }
    ]
  },
  {
    id: 3,
    name: 'HIIT Cardio',
    duration: 30,
    difficulty: 'Beginner',
    calories: 350,
    exercises: [
      { name: 'Jumping Jacks', sets: 4, duration: 30, type: 'cardio' },
      { name: 'Burpees', sets: 3, reps: 10, weight: 0, type: 'bodyweight' },
      { name: 'Mountain Climbers', sets: 4, duration: 30, type: 'cardio' },
      { name: 'High Knees', sets: 3, duration: 30, type: 'cardio' },
      { name: 'Rest', sets: 1, duration: 60, type: 'rest' }
    ]
  },
  {
    id: 4,
    name: 'Core & Flexibility',
    duration: 25,
    difficulty: 'Beginner',
    calories: 150,
    exercises: [
      { name: 'Crunches', sets: 3, reps: 20, weight: 0, type: 'bodyweight' },
      { name: 'Bicycle Crunches', sets: 3, reps: 15, weight: 0, type: 'bodyweight' },
      { name: 'Russian Twists', sets: 3, reps: 20, weight: 0, type: 'bodyweight' },
      { name: 'Child\'s Pose', sets: 1, duration: 60, type: 'stretch' },
      { name: 'Cat-Cow Stretch', sets: 2, duration: 30, type: 'stretch' }
    ]
  }
]

export default function WorkoutTracker() {
  const { user } = useAuth()
  const { workouts, loading, addWorkout, updateWorkout, deleteWorkout } = useUserWorkouts()

  // Workout state
  const [activeWorkout, setActiveWorkout] = useState<WorkoutEntry | null>(null)
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [currentSet, setCurrentSet] = useState(1)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [workoutTimer, setWorkoutTimer] = useState(0) // in seconds
  const [exerciseTimer, setExerciseTimer] = useState(0) // in seconds
  const [restTimer, setRestTimer] = useState(0) // rest between sets

  // Form state
  const [showWorkoutForm, setShowWorkoutForm] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<typeof WORKOUT_TEMPLATES[0] | null>(null)
  const [customWorkout, setCustomWorkout] = useState({
    workoutType: '',
    exercises: [] as Exercise[],
    notes: ''
  })

  // Advanced Scheduling State
  const [activeTab, setActiveTab] = useState<'tracker' | 'schedule' | 'calendar' | 'analytics'>('tracker')
  const [scheduledWorkouts, setScheduledWorkouts] = useState<ScheduledWorkout[]>([])
  const [workoutSchedules, setWorkoutSchedules] = useState<WorkoutSchedule[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [showScheduleForm, setShowScheduleForm] = useState(false)
  const [fitnessLevel, setFitnessLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate')
  const [weeklyGoal, setWeeklyGoal] = useState(4)
  const [preferredTime, setPreferredTime] = useState('08:00')
  const [restDayPreference, setRestDayPreference] = useState<string[]>(['sunday'])

  // Timer effects
  useEffect(() => {
    let interval: number
    if (isTimerRunning && activeWorkout) {
      interval = setInterval(() => {
        setWorkoutTimer(prev => prev + 1)
      }, 1000) as unknown as number
    }
    return () => clearInterval(interval)
  }, [isTimerRunning, activeWorkout])

  useEffect(() => {
    let interval: number
    if (restTimer > 0) {
      interval = setInterval(() => {
        setRestTimer(prev => {
          if (prev <= 1) {
            // Rest finished, move to next set
            return 0
          }
          return prev - 1
        })
      }, 1000) as unknown as number
    }
    return () => clearInterval(interval)
  }, [restTimer])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const startWorkout = (template: typeof WORKOUT_TEMPLATES[0]) => {
    const workout: WorkoutEntry = {
      userId: user!.uid,
      date: new Date(),
      workoutType: template.name,
      duration: 0,
      caloriesBurned: 0,
      exercises: template.exercises.map(ex => ({
        name: ex.name,
        sets: ex.sets,
        reps: ex.reps,
        weight: ex.weight,
        duration: ex.duration
      })),
      notes: '',
      createdAt: new Date()
    }

    setActiveWorkout(workout)
    setCurrentExerciseIndex(0)
    setCurrentSet(1)
    setWorkoutTimer(0)
    setIsTimerRunning(true)
  }

  const pauseWorkout = () => {
    setIsTimerRunning(false)
  }

  const resumeWorkout = () => {
    setIsTimerRunning(true)
  }

  const finishWorkout = async () => {
    if (!activeWorkout) return

    const finalWorkout = {
      ...activeWorkout,
      duration: Math.round(workoutTimer / 60), // convert to minutes
      caloriesBurned: Math.round((workoutTimer / 60) * 5) // rough estimate
    }

    try {
      await addWorkout(finalWorkout)
      setActiveWorkout(null)
      setIsTimerRunning(false)
      setWorkoutTimer(0)
      setCurrentExerciseIndex(0)
      setCurrentSet(1)
    } catch (error) {
      console.error('Error saving workout:', error)
    }
  }

  const nextExercise = () => {
    if (!activeWorkout) return

    if (currentExerciseIndex < activeWorkout.exercises.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1)
      setCurrentSet(1)
    } else {
      // Workout complete
      finishWorkout()
    }
  }

  const nextSet = () => {
    if (!activeWorkout) return

    const currentExercise = activeWorkout.exercises[currentExerciseIndex]

    if (currentSet < currentExercise.sets) {
      setCurrentSet(prev => prev + 1)
      // Start 30-second rest timer
      setRestTimer(30)
    } else {
      nextExercise()
    }
  }

  const deleteWorkoutHandler = async (workoutId: string) => {
    if (window.confirm('Are you sure you want to delete this workout?')) {
      try {
        await deleteWorkout(workoutId)
      } catch (error) {
        console.error('Error deleting workout:', error)
      }
    }
  }

  // Advanced Scheduling Functions
  const generateSmartSchedule = () => {
    const recommendations = SMART_RECOMMENDATIONS[fitnessLevel]
    const schedule: WorkoutSchedule = {
      id: Date.now().toString(),
      name: `${fitnessLevel.charAt(0).toUpperCase() + fitnessLevel.slice(1)} Program`,
      workouts: {},
      startDate: new Date(),
      isActive: true
    }

    // Distribute workouts across the week based on fitness level
    const workoutDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    const selectedDays = workoutDays.filter(day => !restDayPreference.includes(day))
    
    for (let i = 0; i < Math.min(recommendations.frequency, selectedDays.length); i++) {
      const day = selectedDays[i] as keyof typeof schedule.workouts
      schedule.workouts[day] = [i % WORKOUT_TEMPLATES.length + 1]
    }

    setWorkoutSchedules(prev => [...prev, schedule])
    return schedule
  }

  const scheduleWorkout = (templateId: number, date: Date, time: string) => {
    const scheduled: ScheduledWorkout = {
      id: Date.now().toString(),
      templateId,
      date,
      time,
      status: 'scheduled',
      difficulty: 'normal'
    }
    setScheduledWorkouts(prev => [...prev, scheduled])
  }

  const getWeekDays = (date: Date) => {
    const week = []
    const startOfWeek = new Date(date)
    const diff = startOfWeek.getDate() - startOfWeek.getDay() + (startOfWeek.getDay() === 0 ? -6 : 1)
    startOfWeek.setDate(diff)

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek)
      day.setDate(startOfWeek.getDate() + i)
      week.push(day)
    }
    return week
  }

  const getWorkoutsForDate = (date: Date) => {
    return scheduledWorkouts.filter(workout => 
      workout.date.toDateString() === date.toDateString()
    )
  }

  const getWeeklyProgress = () => {
    const weekDays = getWeekDays(currentWeek)
    const completed = weekDays.reduce((count, day) => {
      const dayWorkouts = getWorkoutsForDate(day)
      return count + dayWorkouts.filter(w => w.status === 'completed').length
    }, 0)
    return { completed, total: weeklyGoal, percentage: (completed / weeklyGoal) * 100 }
  }

  const markWorkoutComplete = (workoutId: string) => {
    setScheduledWorkouts(prev => prev.map(workout => 
      workout.id === workoutId 
        ? { ...workout, status: 'completed' }
        : workout
    ))
  }

  const getAdaptiveRecommendation = (lastWorkouts: WorkoutEntry[]) => {
    if (lastWorkouts.length === 0) {
      return { type: 'beginner', message: 'Start with a beginner-friendly workout' }
    }
    
    const recentPerformance = lastWorkouts.slice(-3)
    const avgDuration = recentPerformance.reduce((sum, w) => sum + w.duration, 0) / recentPerformance.length
    
    if (avgDuration > 45) {
      return { type: 'increase', message: 'Great stamina! Try a more challenging workout' }
    } else if (avgDuration < 20) {
      return { type: 'recovery', message: 'Consider a lighter recovery workout' }
    }
    return { type: 'maintain', message: 'Keep up the consistent effort!' }
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Please sign in to access Workout Tracker</h2>
        <p className="text-gray-600">Sign in to track your workouts and fitness progress.</p>
      </div>
    )
  }

  return (
    <LoadingState isLoading={loading} error={null}>
      <div className="space-y-8">
        {/* Header with Navigation */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black gradient-text mb-2">Workout Tracker</h1>
          <p className="text-xl text-gray-700 mb-6">Track your fitness journey and build strength</p>
          
          {/* Tab Navigation */}
          <div className="flex justify-center space-x-2">
            {[
              { id: 'tracker', label: 'Workout', icon: Dumbbell },
              { id: 'schedule', label: 'Schedule', icon: CalendarDays },
              { id: 'calendar', label: 'Calendar', icon: Calendar },
              { id: 'analytics', label: 'Analytics', icon: TrendingUp }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
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
        </div>

        {/* Active Workout */}
        {activeWorkout && (
          <div className="glass-morphism p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-800">{activeWorkout.workoutType}</h3>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Timer className="w-4 h-4" />
                    <span>{formatTime(workoutTimer)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Flame className="w-4 h-4" />
                    <span>{Math.round((workoutTimer / 60) * 5)} cal</span>
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                {isTimerRunning ? (
                  <button onClick={pauseWorkout} className="btn-secondary">
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </button>
                ) : (
                  <button onClick={resumeWorkout} className="btn-primary">
                    <Play className="w-4 h-4 mr-2" />
                    Resume
                  </button>
                )}
                <button onClick={finishWorkout} className="btn-danger">
                  <Square className="w-4 h-4 mr-2" />
                  Finish
                </button>
              </div>
            </div>

            {/* Rest Timer */}
            {restTimer > 0 && (
              <div className="bg-blue-100 border border-blue-300 rounded-lg p-4 mb-6 text-center">
                <div className="text-2xl font-bold text-blue-600 mb-2">{formatTime(restTimer)}</div>
                <div className="text-blue-800">Rest between sets</div>
              </div>
            )}

            {/* Current Exercise */}
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xl font-semibold text-gray-800">
                  Exercise {currentExerciseIndex + 1} of {activeWorkout.exercises.length}
                </h4>
                <div className="text-sm text-gray-600">
                  Set {currentSet} of {activeWorkout.exercises[currentExerciseIndex]?.sets}
                </div>
              </div>

              {activeWorkout.exercises[currentExerciseIndex] && (
                <div className="space-y-4">
                  <div className="text-2xl font-bold text-gray-800">
                    {activeWorkout.exercises[currentExerciseIndex].name}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-800">
                        {activeWorkout.exercises[currentExerciseIndex].reps || '-'}
                      </div>
                      <div className="text-sm text-gray-600">Reps</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-800">
                        {activeWorkout.exercises[currentExerciseIndex].weight || '-'}
                      </div>
                      <div className="text-sm text-gray-600">Weight (kg)</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-800">
                        {activeWorkout.exercises[currentExerciseIndex].duration ? formatTime(activeWorkout.exercises[currentExerciseIndex].duration!) : '-'}
                      </div>
                      <div className="text-sm text-gray-600">Duration</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-800">
                        {activeWorkout.exercises[currentExerciseIndex].sets}
                      </div>
                      <div className="text-sm text-gray-600">Sets</div>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <button
                      onClick={nextSet}
                      className="btn-primary px-8 py-3 text-lg"
                    >
                      {currentSet < activeWorkout.exercises[currentExerciseIndex].sets ? 'Complete Set' : 'Next Exercise'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Exercise Progress */}
            <div className="mt-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Workout Progress</span>
                <span>{currentExerciseIndex + 1} / {activeWorkout.exercises.length}</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill bg-gradient-to-r from-primary-500 to-secondary-500"
                  style={{ width: `${((currentExerciseIndex + 1) / activeWorkout.exercises.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Schedule Tab */}
        {activeTab === 'schedule' && (
          <div className="space-y-6">
            {/* Weekly Progress */}
            <div className="glass-morphism p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">Weekly Progress</h3>
                <button
                  onClick={generateSmartSchedule}
                  className="btn-primary"
                >
                  <Brain className="w-4 h-4 mr-2" />
                  Smart Schedule
                </button>
              </div>
              
              <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl p-6 border border-primary-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800">This Week's Goal</h4>
                    <p className="text-gray-600">{getWeeklyProgress().completed} of {weeklyGoal} workouts completed</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary-600">{Math.round(getWeeklyProgress().percentage)}%</div>
                    <div className="text-sm text-gray-600">Complete</div>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-primary-500 to-secondary-500 h-3 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min(getWeeklyProgress().percentage, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            {/* Quick Schedule */}
            <div className="glass-morphism p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-6">Quick Schedule</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {WORKOUT_TEMPLATES.map(template => (
                  <div key={template.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-shadow">
                    <h4 className="font-semibold text-gray-800 mb-2">{template.name}</h4>
                    <div className="flex items-center space-x-2 text-sm text-gray-600 mb-3">
                      <Clock className="w-4 h-4" />
                      <span>{template.duration}min</span>
                      <Flame className="w-4 h-4" />
                      <span>{template.calories}cal</span>
                    </div>
                    <button
                      onClick={() => scheduleWorkout(template.id, new Date(), preferredTime)}
                      className="w-full btn-secondary text-sm"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Schedule Today
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Calendar Tab */}
        {activeTab === 'calendar' && (
          <div className="space-y-6">
            <div className="glass-morphism p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">Workout Calendar</h3>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setCurrentWeek(new Date(currentWeek.getTime() - 7 * 24 * 60 * 60 * 1000))}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <span className="text-gray-700 font-medium">
                    Week of {currentWeek.toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => setCurrentWeek(new Date(currentWeek.getTime() + 7 * 24 * 60 * 60 * 1000))}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {/* Weekly Calendar */}
              <div className="grid grid-cols-7 gap-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                  <div key={day} className="text-center text-sm font-medium text-gray-600 p-2">
                    {day}
                  </div>
                ))}
                {getWeekDays(currentWeek).map((day, index) => {
                  const dayWorkouts = getWorkoutsForDate(day)
                  const isToday = day.toDateString() === new Date().toDateString()
                  
                  return (
                    <div
                      key={index}
                      className={`min-h-24 p-2 rounded-lg border transition-all cursor-pointer hover:shadow-md ${
                        isToday 
                          ? 'border-primary-300 bg-primary-50' 
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedDate(day)}
                    >
                      <div className={`text-sm font-medium mb-1 ${
                        isToday ? 'text-primary-700' : 'text-gray-800'
                      }`}>
                        {day.getDate()}
                      </div>
                      <div className="space-y-1">
                        {dayWorkouts.map(workout => {
                          const template = WORKOUT_TEMPLATES.find(t => t.id === workout.templateId)
                          return (
                            <div
                              key={workout.id}
                              className={`text-xs p-1 rounded text-center ${
                                workout.status === 'completed' 
                                  ? 'bg-green-100 text-green-800' 
                                  : workout.status === 'missed'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {template?.name.slice(0, 8)}...
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
        
        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="glass-morphism p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-6">Workout Analytics</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                  <div className="flex items-center space-x-3">
                    <Trophy className="w-8 h-8 text-blue-600" />
                    <div>
                      <div className="text-2xl font-bold text-blue-800">{workouts.length}</div>
                      <div className="text-sm text-blue-600">Total Workouts</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                  <div className="flex items-center space-x-3">
                    <Flame className="w-8 h-8 text-green-600" />
                    <div>
                      <div className="text-2xl font-bold text-green-800">
                        {workouts.reduce((sum, w) => sum + w.caloriesBurned, 0)}
                      </div>
                      <div className="text-sm text-green-600">Calories Burned</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                  <div className="flex items-center space-x-3">
                    <Timer className="w-8 h-8 text-purple-600" />
                    <div>
                      <div className="text-2xl font-bold text-purple-800">
                        {Math.round(workouts.reduce((sum, w) => sum + w.duration, 0) / 60)}h
                      </div>
                      <div className="text-sm text-purple-600">Total Time</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Workout Frequency Chart */}
              <div className="mt-8 p-6 bg-gray-50 rounded-xl">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Weekly Frequency</h4>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">Advanced analytics coming soon</p>
                    <p className="text-sm">Track your progress with detailed charts and insights</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'tracker' && (
          <div className="space-y-8">
            {/* Workout Templates */}
            {!activeWorkout && (
              <div className="glass-morphism p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-800">Quick Start Workouts</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowScheduleForm(true)}
                      className="btn-secondary"
                    >
                      <CalendarDays className="w-4 h-4 mr-2" />
                      Schedule
                    </button>
                    <button
                      onClick={() => setShowWorkoutForm(true)}
                      className="btn-secondary"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Custom
                    </button>
                  </div>
                </div>
                
                {/* Smart Recommendation */}
                {workouts.length > 0 && (
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 mb-6 border border-blue-200">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500">
                        <Brain className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">Smart Recommendation</h4>
                        <p className="text-sm text-gray-700">{getAdaptiveRecommendation(workouts).message}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {WORKOUT_TEMPLATES.map(template => {
                    const todaysScheduled = getWorkoutsForDate(new Date()).find(w => w.templateId === template.id)
                    const isScheduledToday = !!todaysScheduled
                    
                    return (
                      <div key={template.id} className={`bg-white rounded-xl border p-6 hover:shadow-lg transition-all duration-300 ${
                        isScheduledToday ? 'border-primary-300 bg-primary-50' : 'border-gray-200'
                      }`}>
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="text-lg font-semibold text-gray-800">{template.name}</h4>
                              {isScheduledToday && (
                                <div className="px-2 py-1 rounded-full bg-primary-100 text-primary-700 text-xs font-medium flex items-center space-x-1">
                                  <Bell className="w-3 h-3" />
                                  <span>Scheduled</span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <div className="flex items-center space-x-1">
                                <Clock className="w-4 h-4" />
                                <span>{template.duration} min</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Flame className="w-4 h-4" />
                                <span>{template.calories} cal</span>
                              </div>
                              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                template.difficulty === 'Beginner' ? 'bg-green-100 text-green-800' :
                                template.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {template.difficulty}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col space-y-2">
                            <button
                              onClick={() => startWorkout(template)}
                              className="btn-primary text-sm px-4 py-2"
                            >
                              <Play className="w-4 h-4 mr-2" />
                              Start
                            </button>
                            <button
                              onClick={() => scheduleWorkout(template.id, new Date(), preferredTime)}
                              className="btn-secondary text-sm px-4 py-2"
                              disabled={isScheduledToday}
                            >
                              <CalendarDays className="w-4 h-4 mr-2" />
                              Schedule
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="text-sm font-medium text-gray-700">Exercises:</div>
                          <div className="grid grid-cols-1 gap-1">
                            {template.exercises.slice(0, 3).map((exercise, index) => (
                              <div key={index} className="text-sm text-gray-600">
                                • {exercise.name} {exercise.reps && `(${exercise.reps} reps)`} {exercise.duration && `(${exercise.duration}s)`}
                              </div>
                            ))}
                            {template.exercises.length > 3 && (
                              <div className="text-sm text-gray-500">
                                + {template.exercises.length - 3} more exercises
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recent Workouts - Only show in tracker tab */}
        {activeTab === 'tracker' && (
          <div className="glass-morphism p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Recent Workouts</h3>

            {workouts.length === 0 ? (
              <div className="text-center py-8">
                <Dumbbell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No workouts recorded yet</p>
                <p className="text-gray-600 text-sm">Start your first workout to begin tracking your fitness journey!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {workouts.slice(0, 5).map(workout => (
                  <div key={workout.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl group hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-primary-500 rounded-lg">
                        <Dumbbell className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800">{workout.workoutType}</div>
                        <div className="text-sm text-gray-600">
                          {workout.duration} min • {workout.caloriesBurned} cal • {workout.exercises.length} exercises
                        </div>
                        <div className="text-xs text-gray-500">
                          {workout.date.toLocaleDateString()} at {workout.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 flex space-x-2 transition-opacity">
                      <button
                        onClick={() => deleteWorkoutHandler(workout.id!)}
                        className="p-2 hover:bg-red-100 rounded-lg text-gray-600 hover:text-red-600"
                        title="Delete workout"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Schedule Form */}
        {showScheduleForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800">Workout Preferences</h2>
                <button
                  onClick={() => setShowScheduleForm(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fitness Level</label>
                  <select
                    value={fitnessLevel}
                    onChange={(e) => setFitnessLevel(e.target.value as any)}
                    className="w-full input-field"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Weekly Goal (workouts)</label>
                  <input
                    type="number"
                    value={weeklyGoal}
                    onChange={(e) => setWeeklyGoal(parseInt(e.target.value))}
                    min="1"
                    max="7"
                    className="w-full input-field"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Time</label>
                  <input
                    type="time"
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    className="w-full input-field"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rest Days</label>
                  <div className="grid grid-cols-7 gap-2">
                    {['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].map(day => (
                      <button
                        key={day}
                        onClick={() => {
                          setRestDayPreference(prev => 
                            prev.includes(day) 
                              ? prev.filter(d => d !== day)
                              : [...prev, day]
                          )
                        }}
                        className={`p-2 text-xs rounded-lg font-medium transition-colors ${
                          restDayPreference.includes(day)
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {day.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowScheduleForm(false)}
                    className="flex-1 btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      generateSmartSchedule()
                      setShowScheduleForm(false)
                    }}
                    className="flex-1 btn-primary"
                  >
                    Generate Schedule
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Custom Workout Form */}
        {showWorkoutForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800">Create Custom Workout</h2>
                <button
                  onClick={() => setShowWorkoutForm(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="p-6">
                <p className="text-gray-600 text-center">Custom workout builder coming soon!</p>
                <p className="text-sm text-gray-500 text-center mt-2">
                  For now, use our pre-built workout templates to get started.
                </p>
                <button
                  onClick={() => setShowWorkoutForm(false)}
                  className="w-full btn-primary mt-4"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </LoadingState>
  )
}