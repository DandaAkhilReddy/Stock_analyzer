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
  X
} from 'lucide-react'
import { useUserWorkouts } from '../hooks/useUserData'
import { useAuth } from '../contexts/AuthContext'
import LoadingState from '../components/LoadingState'
import type { WorkoutEntry, Exercise } from '../services/userService'

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
  const [_exerciseTimer, setExerciseTimer] = useState(0) // in seconds
  const [restTimer, setRestTimer] = useState(0) // rest between sets

  // Form state
  const [showWorkoutForm, setShowWorkoutForm] = useState(false)
  const [_selectedTemplate, setSelectedTemplate] = useState<typeof WORKOUT_TEMPLATES[0] | null>(null)
  const [_customWorkout, setCustomWorkout] = useState({
    workoutType: '',
    exercises: [] as Exercise[],
    notes: ''
  })

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
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-black gradient-text mb-2">Workout Tracker</h1>
          <p className="text-xl text-gray-700">Track your fitness journey and build strength</p>
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

        {/* Workout Templates */}
        {!activeWorkout && (
          <div className="glass-morphism p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">Quick Start Workouts</h3>
              <button
                onClick={() => setShowWorkoutForm(true)}
                className="btn-secondary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Custom Workout
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {WORKOUT_TEMPLATES.map(template => (
                <div key={template.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-800 mb-2">{template.name}</h4>
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
                    <button
                      onClick={() => startWorkout(template)}
                      className="btn-primary"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start
                    </button>
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
              ))}
            </div>
          </div>
        )}

        {/* Recent Workouts */}
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