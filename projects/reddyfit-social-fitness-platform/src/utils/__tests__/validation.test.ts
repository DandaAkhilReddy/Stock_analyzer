import { describe, it, expect } from 'vitest'
import {
  validateField,
  validateForm,
  MEAL_VALIDATION_RULES,
  PROFILE_VALIDATION_RULES,
  isValidEmail,
  isValidPassword,
  sanitizeInput,
  VALIDATION_PATTERNS
} from '../validation'

describe('validateField', () => {
  it('should validate required fields correctly', () => {
    expect(validateField('', { required: true })).toBe('This field is required')
    expect(validateField(null, { required: true })).toBe('This field is required')
    expect(validateField(undefined, { required: true })).toBe('This field is required')
    expect(validateField('value', { required: true })).toBeNull()
  })

  it('should validate string length correctly', () => {
    expect(validateField('ab', { minLength: 3 })).toBe('Must be at least 3 characters long')
    expect(validateField('abc', { minLength: 3 })).toBeNull()
    expect(validateField('abcde', { maxLength: 4 })).toBe('Must be no more than 4 characters long')
    expect(validateField('abc', { maxLength: 4 })).toBeNull()
  })

  it('should validate number ranges correctly', () => {
    expect(validateField(5, { min: 10 })).toBe('Must be at least 10')
    expect(validateField(15, { min: 10 })).toBeNull()
    expect(validateField(25, { max: 20 })).toBe('Must be no more than 20')
    expect(validateField(15, { max: 20 })).toBeNull()
  })

  it('should validate patterns correctly', () => {
    expect(validateField('abc123', { pattern: /^\d+$/ })).toBe('Invalid format')
    expect(validateField('123', { pattern: /^\d+$/ })).toBeNull()
  })

  it('should run custom validation', () => {
    const customRule = {
      custom: (value: any) => value === 'forbidden' ? 'This value is not allowed' : null
    }
    expect(validateField('forbidden', customRule)).toBe('This value is not allowed')
    expect(validateField('allowed', customRule)).toBeNull()
  })
})

describe('validateForm', () => {
  it('should validate a complete form', () => {
    const data = {
      name: 'John',
      age: 25,
      email: 'john@example.com'
    }

    const rules = {
      name: { required: true, minLength: 2 },
      age: { required: true, min: 18 },
      email: { required: true, pattern: VALIDATION_PATTERNS.email }
    }

    const errors = validateForm(data, rules)
    expect(Object.keys(errors)).toHaveLength(0)
  })

  it('should return errors for invalid form data', () => {
    const data = {
      name: '',
      age: 15,
      email: 'invalid-email'
    }

    const rules = {
      name: { required: true, minLength: 2 },
      age: { required: true, min: 18 },
      email: { required: true, pattern: VALIDATION_PATTERNS.email }
    }

    const errors = validateForm(data, rules)
    expect(Object.keys(errors)).toHaveLength(3)
    expect(errors.name).toBe('This field is required')
    expect(errors.age).toBe('Must be at least 18')
    expect(errors.email).toBe('Invalid format')
  })
})

describe('MEAL_VALIDATION_RULES', () => {
  it('should validate meal data correctly', () => {
    const validMeal = {
      foodName: 'Chicken Breast',
      calories: 200,
      protein: 25,
      carbs: 0,
      fat: 5,
      quantity: 1,
      unit: 'piece'
    }

    const errors = validateForm(validMeal, MEAL_VALIDATION_RULES)
    expect(Object.keys(errors)).toHaveLength(0)
  })

  it('should reject invalid meal data', () => {
    const invalidMeal = {
      foodName: '',
      calories: -10,
      protein: 1500, // too high
      carbs: 0,
      fat: 5,
      quantity: 0, // too low
      unit: ''
    }

    const errors = validateForm(invalidMeal, MEAL_VALIDATION_RULES)
    expect(Object.keys(errors).length).toBeGreaterThan(0)
    expect(errors.foodName).toBeDefined()
    expect(errors.calories).toBeDefined()
    expect(errors.quantity).toBeDefined()
    expect(errors.unit).toBeDefined()
  })
})

describe('PROFILE_VALIDATION_RULES', () => {
  it('should validate profile data correctly', () => {
    const validProfile = {
      displayName: 'John Doe',
      startWeight: 80,
      currentWeight: 75,
      goalWeight: 70,
      height: 175,
      age: 28,
      dailyCalories: 1800,
      dailyProtein: 150
    }

    const errors = validateForm(validProfile, PROFILE_VALIDATION_RULES)
    expect(Object.keys(errors)).toHaveLength(0)
  })

  it('should reject invalid profile data', () => {
    const invalidProfile = {
      displayName: '', // required
      startWeight: 10, // too low
      currentWeight: 600, // too high
      goalWeight: 70,
      height: 300, // too high
      age: 150, // too high
      dailyCalories: 500, // too low
      dailyProtein: 600 // too high
    }

    const errors = validateForm(invalidProfile, PROFILE_VALIDATION_RULES)
    expect(Object.keys(errors).length).toBeGreaterThan(0)
  })
})

describe('Email validation', () => {
  it('should validate emails correctly', () => {
    expect(isValidEmail('test@example.com')).toBe(true)
    expect(isValidEmail('user.name@domain.co.uk')).toBe(true)
    expect(isValidEmail('invalid-email')).toBe(false)
    expect(isValidEmail('test@')).toBe(false)
    expect(isValidEmail('@example.com')).toBe(false)
  })
})

describe('Password validation', () => {
  it('should validate passwords correctly', () => {
    expect(isValidPassword('Password123')).toBe(true)
    expect(isValidPassword('StrongPass1')).toBe(true)
    expect(isValidPassword('weak')).toBe(false) // too short
    expect(isValidPassword('password123')).toBe(false) // no uppercase
    expect(isValidPassword('PASSWORD123')).toBe(false) // no lowercase
    expect(isValidPassword('Password')).toBe(false) // no number
  })
})

describe('Input sanitization', () => {
  it('should sanitize input correctly', () => {
    expect(sanitizeInput('  hello world  ')).toBe('hello world')
    expect(sanitizeInput('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script')
    expect(sanitizeInput('normal text')).toBe('normal text')
  })
})