import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { userService, type UserProfile, type MealEntry, type WorkoutEntry, type ProgressEntry } from '../services/userService';

export const useUserProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const userProfile = await userService.getUserProfile(user.uid);

        if (!userProfile) {
          // Create default profile for new user
          await userService.createUserProfile(user, {});
          const newProfile = await userService.getUserProfile(user.uid);
          setProfile(newProfile);
        } else {
          setProfile(userProfile);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !profile) return;

    try {
      setError(null);
      await userService.updateUserProfile(user.uid, updates);
      setProfile(prev => prev ? { ...prev, ...updates } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      throw err;
    }
  };

  return { profile, loading, error, updateProfile };
};

export const useUserMeals = (date: Date = new Date()) => {
  const { user } = useAuth();
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setMeals([]);
      setLoading(false);
      return;
    }

    // Set up real-time subscription
    const unsubscribe = userService.subscribeToUserMeals(
      user.uid,
      date,
      (updatedMeals) => {
        setMeals(updatedMeals);
        setLoading(false);
        setError(null);
      }
    );

    return () => unsubscribe();
  }, [user, date]);

  const addMeal = async (meal: Omit<MealEntry, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setError(null);
      await userService.addMeal({
        ...meal,
        userId: user.uid
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add meal');
      throw err;
    }
  };

  const updateMeal = async (mealId: string, updates: Partial<MealEntry>) => {
    try {
      setError(null);
      await userService.updateMeal(mealId, updates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update meal');
      throw err;
    }
  };

  const deleteMeal = async (mealId: string) => {
    try {
      setError(null);
      await userService.deleteMeal(mealId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete meal');
      throw err;
    }
  };

  // Calculate daily totals
  const dailyTotals = meals.reduce((totals, meal) => ({
    calories: totals.calories + meal.calories,
    protein: totals.protein + meal.protein,
    carbs: totals.carbs + meal.carbs,
    fat: totals.fat + meal.fat
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  return {
    meals,
    loading,
    error,
    addMeal,
    updateMeal,
    deleteMeal,
    dailyTotals
  };
};

export const useUserWorkouts = () => {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<WorkoutEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setWorkouts([]);
      setLoading(false);
      return;
    }

    const fetchWorkouts = async () => {
      try {
        setLoading(true);
        const userWorkouts = await userService.getUserWorkouts(user.uid);
        setWorkouts(userWorkouts);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load workouts');
      } finally {
        setLoading(false);
      }
    };

    fetchWorkouts();
  }, [user]);

  const addWorkout = async (workout: Omit<WorkoutEntry, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setError(null);
      const workoutId = await userService.addWorkout({
        ...workout,
        userId: user.uid
      });

      // Add to local state
      const newWorkout = { ...workout, id: workoutId, userId: user.uid, createdAt: new Date() };
      setWorkouts(prev => [newWorkout, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add workout');
      throw err;
    }
  };

  const updateWorkout = async (workoutId: string, updates: Partial<WorkoutEntry>) => {
    try {
      setError(null);
      await userService.updateWorkout(workoutId, updates);

      // Update local state
      setWorkouts(prev => prev.map(workout =>
        workout.id === workoutId ? { ...workout, ...updates } : workout
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update workout');
      throw err;
    }
  };

  const deleteWorkout = async (workoutId: string) => {
    try {
      setError(null);
      await userService.deleteWorkout(workoutId);

      // Remove from local state
      setWorkouts(prev => prev.filter(workout => workout.id !== workoutId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete workout');
      throw err;
    }
  };

  return {
    workouts,
    loading,
    error,
    addWorkout,
    updateWorkout,
    deleteWorkout
  };
};

export const useUserProgress = () => {
  const { user } = useAuth();
  const [progress, setProgress] = useState<ProgressEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setProgress([]);
      setLoading(false);
      return;
    }

    // Set up real-time subscription
    const unsubscribe = userService.subscribeToUserProgress(
      user.uid,
      (updatedProgress) => {
        setProgress(updatedProgress);
        setLoading(false);
        setError(null);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const addProgress = async (progressEntry: Omit<ProgressEntry, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setError(null);
      await userService.addProgress({
        ...progressEntry,
        userId: user.uid
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add progress entry');
      throw err;
    }
  };

  const updateProgress = async (progressId: string, updates: Partial<ProgressEntry>) => {
    try {
      setError(null);
      await userService.updateProgress(progressId, updates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update progress entry');
      throw err;
    }
  };

  const deleteProgress = async (progressId: string) => {
    try {
      setError(null);
      await userService.deleteProgress(progressId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete progress entry');
      throw err;
    }
  };

  return {
    progress,
    loading,
    error,
    addProgress,
    updateProgress,
    deleteProgress
  };
};