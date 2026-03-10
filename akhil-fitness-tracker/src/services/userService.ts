import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  type Unsubscribe
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { User } from 'firebase/auth';

// User Profile Interface
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  startWeight: number;
  currentWeight: number;
  goalWeight: number;
  height: number;
  age: number;
  gender: 'male' | 'female';
  activityLevel: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active';
  dailyCalories: number;
  dailyProtein: number;
  startDate: Date;
  targetDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Meal Entry Interface
export interface MealEntry {
  id?: string;
  userId: string;
  date: Date;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  quantity: number;
  unit: string;
  createdAt: Date;
}

// Workout Entry Interface
export interface WorkoutEntry {
  id?: string;
  userId: string;
  date: Date;
  workoutType: string;
  duration: number; // minutes
  caloriesBurned: number;
  exercises: Exercise[];
  notes?: string;
  createdAt: Date;
}

export interface Exercise {
  name: string;
  sets: number;
  reps?: number;
  weight?: number;
  duration?: number; // for cardio
  distance?: number; // for running/cycling
}

// Progress Entry Interface
export interface ProgressEntry {
  id?: string;
  userId: string;
  date: Date;
  weight: number;
  bodyFat?: number;
  muscleMan?: number;
  measurements?: {
    chest?: number;
    waist?: number;
    hips?: number;
    biceps?: number;
    thighs?: number;
  };
  photos?: string[]; // URLs to uploaded photos
  notes?: string;
  createdAt: Date;
}

class UserService {
  // User Profile Operations
  async createUserProfile(user: User, additionalData: Partial<UserProfile>): Promise<void> {
    const userRef = doc(db, 'users', user.uid);
    const defaultProfile: UserProfile = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || '',
      photoURL: user.photoURL || undefined,
      startWeight: 85,
      currentWeight: 85,
      goalWeight: 70,
      height: 175,
      age: 28,
      gender: 'male',
      activityLevel: 'moderately_active',
      dailyCalories: 1800,
      dailyProtein: 150,
      startDate: new Date(),
      targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      createdAt: new Date(),
      updatedAt: new Date(),
      ...additionalData
    };

    await setDoc(userRef, defaultProfile);
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const data = userSnap.data();
      return {
        ...data,
        startDate: data.startDate.toDate(),
        targetDate: data.targetDate.toDate(),
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      } as UserProfile;
    }

    return null;
  }

  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: new Date()
    });
  }

  // Meal Operations
  async addMeal(meal: Omit<MealEntry, 'id' | 'createdAt'>): Promise<string> {
    const mealsRef = collection(db, 'meals');
    const mealData = {
      ...meal,
      createdAt: new Date()
    };
    const docRef = await addDoc(mealsRef, mealData);
    return docRef.id;
  }

  async getUserMeals(userId: string, date?: Date): Promise<MealEntry[]> {
    const mealsRef = collection(db, 'meals');
    let q = query(
      mealsRef,
      where('userId', '==', userId),
      orderBy('date', 'desc')
    );

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      q = query(
        mealsRef,
        where('userId', '==', userId),
        where('date', '>=', startOfDay),
        where('date', '<=', endOfDay),
        orderBy('date', 'asc')
      );
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date.toDate(),
      createdAt: doc.data().createdAt.toDate(),
    })) as MealEntry[];
  }

  async updateMeal(mealId: string, updates: Partial<MealEntry>): Promise<void> {
    const mealRef = doc(db, 'meals', mealId);
    await updateDoc(mealRef, updates);
  }

  async deleteMeal(mealId: string): Promise<void> {
    const mealRef = doc(db, 'meals', mealId);
    await deleteDoc(mealRef);
  }

  // Workout Operations
  async addWorkout(workout: Omit<WorkoutEntry, 'id' | 'createdAt'>): Promise<string> {
    const workoutsRef = collection(db, 'workouts');
    const workoutData = {
      ...workout,
      createdAt: new Date()
    };
    const docRef = await addDoc(workoutsRef, workoutData);
    return docRef.id;
  }

  async getUserWorkouts(userId: string, limit?: number): Promise<WorkoutEntry[]> {
    const workoutsRef = collection(db, 'workouts');
    let q = query(
      workoutsRef,
      where('userId', '==', userId),
      orderBy('date', 'desc')
    );

    const querySnapshot = await getDocs(q);
    let workouts = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date.toDate(),
      createdAt: doc.data().createdAt.toDate(),
    })) as WorkoutEntry[];

    if (limit) {
      workouts = workouts.slice(0, limit);
    }

    return workouts;
  }

  async updateWorkout(workoutId: string, updates: Partial<WorkoutEntry>): Promise<void> {
    const workoutRef = doc(db, 'workouts', workoutId);
    await updateDoc(workoutRef, updates);
  }

  async deleteWorkout(workoutId: string): Promise<void> {
    const workoutRef = doc(db, 'workouts', workoutId);
    await deleteDoc(workoutRef);
  }

  // Progress Operations
  async addProgress(progress: Omit<ProgressEntry, 'id' | 'createdAt'>): Promise<string> {
    const progressRef = collection(db, 'progress');
    const progressData = {
      ...progress,
      createdAt: new Date()
    };
    const docRef = await addDoc(progressRef, progressData);
    return docRef.id;
  }

  async getUserProgress(userId: string): Promise<ProgressEntry[]> {
    const progressRef = collection(db, 'progress');
    const q = query(
      progressRef,
      where('userId', '==', userId),
      orderBy('date', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date.toDate(),
      createdAt: doc.data().createdAt.toDate(),
    })) as ProgressEntry[];
  }

  async updateProgress(progressId: string, updates: Partial<ProgressEntry>): Promise<void> {
    const progressRef = doc(db, 'progress', progressId);
    await updateDoc(progressRef, updates);
  }

  async deleteProgress(progressId: string): Promise<void> {
    const progressRef = doc(db, 'progress', progressId);
    await deleteDoc(progressRef);
  }

  // Real-time subscriptions
  subscribeToUserMeals(userId: string, date: Date, callback: (meals: MealEntry[]) => void): Unsubscribe {
    const mealsRef = collection(db, 'meals');
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const q = query(
      mealsRef,
      where('userId', '==', userId),
      where('date', '>=', startOfDay),
      where('date', '<=', endOfDay),
      orderBy('date', 'asc')
    );

    return onSnapshot(q, (querySnapshot) => {
      const meals = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate(),
        createdAt: doc.data().createdAt.toDate(),
      })) as MealEntry[];
      callback(meals);
    });
  }

  subscribeToUserProgress(userId: string, callback: (progress: ProgressEntry[]) => void): Unsubscribe {
    const progressRef = collection(db, 'progress');
    const q = query(
      progressRef,
      where('userId', '==', userId),
      orderBy('date', 'desc')
    );

    return onSnapshot(q, (querySnapshot) => {
      const progress = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate(),
        createdAt: doc.data().createdAt.toDate(),
      })) as ProgressEntry[];
      callback(progress);
    });
  }
}

export const userService = new UserService();