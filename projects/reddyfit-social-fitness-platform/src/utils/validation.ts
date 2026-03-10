// Comprehensive form validation utilities
import { useState } from 'react'

export type ValidationRule = {
  required?: boolean
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: RegExp
  custom?: (value: any) => string | null
}

export type ValidationRules = Record<string, ValidationRule>
export type ValidationErrors = Record<string, string>

// Common validation patterns
export const VALIDATION_PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\+?[\d\s\-\(\)]+$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/, // At least 8 chars, 1 lowercase, 1 uppercase, 1 number
  url: /^https?:\/\/.+/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  numeric: /^\d+$/,
  decimal: /^\d+(\.\d+)?$/,
}

// Validation functions
export function validateField(value: any, rules: ValidationRule): string | null {
  // Required validation
  if (rules.required && (value === null || value === undefined || value === '')) {
    return 'This field is required'
  }

  // Skip other validations if field is empty and not required
  if (!rules.required && (value === null || value === undefined || value === '')) {
    return null
  }

  // String validations
  if (typeof value === 'string') {
    if (rules.minLength && value.length < rules.minLength) {
      return `Must be at least ${rules.minLength} characters long`
    }
    if (rules.maxLength && value.length > rules.maxLength) {
      return `Must be no more than ${rules.maxLength} characters long`
    }
    if (rules.pattern && !rules.pattern.test(value)) {
      return 'Invalid format'
    }
  }

  // Number validations
  if (typeof value === 'number' || !isNaN(Number(value))) {
    const numValue = Number(value)
    if (rules.min !== undefined && numValue < rules.min) {
      return `Must be at least ${rules.min}`
    }
    if (rules.max !== undefined && numValue > rules.max) {
      return `Must be no more than ${rules.max}`
    }
  }

  // Custom validation
  if (rules.custom) {
    return rules.custom(value)
  }

  return null
}

export function validateForm(data: Record<string, any>, rules: ValidationRules): ValidationErrors {
  const errors: ValidationErrors = {}

  for (const [field, fieldRules] of Object.entries(rules)) {
    const value = data[field]
    const error = validateField(value, fieldRules)
    if (error) {
      errors[field] = error
    }
  }

  return errors
}

// Specific validation rules for our app
export const MEAL_VALIDATION_RULES: ValidationRules = {
  foodName: {
    required: true,
    minLength: 1,
    maxLength: 100,
  },
  calories: {
    required: true,
    min: 1,
    max: 10000,
    custom: (value) => {
      if (!Number.isInteger(Number(value))) {
        return 'Calories must be a whole number'
      }
      return null
    }
  },
  protein: {
    required: true,
    min: 0,
    max: 1000,
  },
  carbs: {
    required: true,
    min: 0,
    max: 1000,
  },
  fat: {
    required: true,
    min: 0,
    max: 1000,
  },
  quantity: {
    required: true,
    min: 0.1,
    max: 100,
  },
  unit: {
    required: true,
    minLength: 1,
    maxLength: 20,
  }
}

export const PROFILE_VALIDATION_RULES: ValidationRules = {
  displayName: {
    required: true,
    minLength: 1,
    maxLength: 50,
    pattern: /^[a-zA-Z\s]+$/,
  },
  startWeight: {
    required: true,
    min: 20,
    max: 500,
  },
  currentWeight: {
    required: true,
    min: 20,
    max: 500,
  },
  goalWeight: {
    required: true,
    min: 20,
    max: 500,
  },
  height: {
    required: true,
    min: 50,
    max: 300,
  },
  age: {
    required: true,
    min: 13,
    max: 120,
    custom: (value) => {
      if (!Number.isInteger(Number(value))) {
        return 'Age must be a whole number'
      }
      return null
    }
  },
  dailyCalories: {
    required: true,
    min: 800,
    max: 5000,
    custom: (value) => {
      if (!Number.isInteger(Number(value))) {
        return 'Daily calories must be a whole number'
      }
      return null
    }
  },
  dailyProtein: {
    required: true,
    min: 30,
    max: 500,
    custom: (value) => {
      if (!Number.isInteger(Number(value))) {
        return 'Daily protein must be a whole number'
      }
      return null
    }
  }
}

export const WORKOUT_VALIDATION_RULES: ValidationRules = {
  workoutType: {
    required: true,
    minLength: 1,
    maxLength: 50,
  },
  duration: {
    required: true,
    min: 1,
    max: 480, // 8 hours max
  },
  caloriesBurned: {
    required: true,
    min: 1,
    max: 2000,
  },
  exercises: {
    required: true,
    custom: (value) => {
      if (!Array.isArray(value) || value.length === 0) {
        return 'At least one exercise is required'
      }
      return null
    }
  }
}

export const PROGRESS_VALIDATION_RULES: ValidationRules = {
  weight: {
    required: true,
    min: 20,
    max: 500,
  },
  bodyFat: {
    min: 3,
    max: 60,
  },
  muscleMan: {
    min: 10,
    max: 100,
  }
}

// Real-time validation hook
export function useFormValidation(initialData: Record<string, any>, rules: ValidationRules) {
  const [data, setData] = useState(initialData)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const validateSingleField = (field: string, value: any) => {
    const fieldRules = rules[field]
    if (!fieldRules) return null

    return validateField(value, fieldRules)
  }

  const updateField = (field: string, value: any) => {
    setData(prev => ({ ...prev, [field]: value }))

    // Validate field if it has been touched
    if (touched[field]) {
      const error = validateSingleField(field, value)
      setErrors(prev => ({
        ...prev,
        [field]: error || ''
      }))
    }
  }

  const touchField = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }))

    // Validate the field when touched
    const error = validateSingleField(field, data[field])
    setErrors(prev => ({
      ...prev,
      [field]: error || ''
    }))
  }

  const validateAllFields = () => {
    const allErrors = validateForm(data, rules)
    setErrors(allErrors)
    setTouched(
      Object.keys(rules).reduce((acc, field) => ({
        ...acc,
        [field]: true
      }), {})
    )
    return Object.keys(allErrors).length === 0
  }

  const reset = (newData?: Record<string, any>) => {
    setData(newData || initialData)
    setErrors({})
    setTouched({})
  }

  return {
    data,
    errors,
    touched,
    updateField,
    touchField,
    validateAllFields,
    reset,
    isValid: Object.keys(errors).length === 0
  }
}

// Utility functions for common validations
export function isValidEmail(email: string): boolean {
  return VALIDATION_PATTERNS.email.test(email)
}

export function isValidPassword(password: string): boolean {
  return VALIDATION_PATTERNS.password.test(password)
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '')
}

export function formatValidationError(error: string): string {
  return error.charAt(0).toUpperCase() + error.slice(1)
}