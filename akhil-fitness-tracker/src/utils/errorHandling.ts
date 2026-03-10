// Centralized error handling utilities

import { FirebaseError } from 'firebase/app'

export type AppError = {
  code: string
  message: string
  details?: any
  timestamp: Date
}

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'

// Firebase error code mappings
const FIREBASE_ERROR_MESSAGES: Record<string, string> = {
  'auth/user-not-found': 'No account found with this email address.',
  'auth/wrong-password': 'Incorrect password. Please try again.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
  'auth/weak-password': 'Password should be at least 6 characters long.',
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/popup-closed-by-user': 'Sign-in was cancelled. Please try again.',
  'auth/popup-blocked': 'Pop-up was blocked. Please enable pop-ups and try again.',
  'permission-denied': 'You don\'t have permission to perform this action.',
  'not-found': 'The requested data was not found.',
  'already-exists': 'The data already exists.',
  'failed-precondition': 'Operation failed due to system requirements.',
  'unavailable': 'Service is temporarily unavailable. Please try again.',
  'internal': 'An internal error occurred. Please try again.',
  'invalid-argument': 'Invalid data provided. Please check your input.',
  'deadline-exceeded': 'Request timed out. Please try again.',
  'cancelled': 'Operation was cancelled.',
  'unauthenticated': 'Please sign in to continue.',
  'resource-exhausted': 'Service limit exceeded. Please try again later.'
}


export class AppErrorHandler {
  private static instance: AppErrorHandler
  private errorQueue: AppError[] = []
  private maxQueueSize = 100

  static getInstance(): AppErrorHandler {
    if (!AppErrorHandler.instance) {
      AppErrorHandler.instance = new AppErrorHandler()
    }
    return AppErrorHandler.instance
  }

  // Process and format different types of errors
  handleError(error: any, context?: string): AppError {
    const appError = this.createAppError(error, context)
    this.logError(appError)
    this.addToQueue(appError)
    return appError
  }

  private createAppError(error: any, context?: string): AppError {
    let code = 'unknown-error'
    let message = 'An unexpected error occurred. Please try again.'
    let details = {}

    // Firebase errors
    if (error instanceof FirebaseError) {
      code = error.code
      message = FIREBASE_ERROR_MESSAGES[error.code] || error.message
      details = { originalCode: error.code, context }
    }
    // Network errors
    else if (error instanceof TypeError && error.message.includes('fetch')) {
      code = 'network-error'
      message = 'Network connection failed. Please check your internet connection.'
    }
    // Validation errors
    else if (error.name === 'ValidationError') {
      code = 'validation-error'
      message = error.message
      details = error.details
    }
    // Standard JavaScript errors
    else if (error instanceof Error) {
      code = error.name.toLowerCase()
      message = error.message || 'An error occurred while processing your request.'
      details = { stack: error.stack, context }
    }
    // String errors
    else if (typeof error === 'string') {
      message = error
      code = 'string-error'
    }
    // Unknown error format
    else {
      details = error
      code = 'unknown-error'
    }

    return {
      code,
      message,
      details,
      timestamp: new Date()
    }
  }

  private logError(error: AppError): void {
    const severity = this.getErrorSeverity(error)

    // In development, log to console
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 ${severity.toUpperCase()} ERROR`)
      console.error('Code:', error.code)
      console.error('Message:', error.message)
      console.error('Timestamp:', error.timestamp.toISOString())
      if (error.details) {
        console.error('Details:', error.details)
      }
      console.groupEnd()
    }

    // In production, send to error reporting service
    if (process.env.NODE_ENV === 'production' && severity !== 'low') {
      this.reportToService(error, severity)
    }
  }

  private getErrorSeverity(error: AppError): ErrorSeverity {
    const criticalCodes = ['internal', 'permission-denied', 'unauthenticated']
    const highCodes = ['unavailable', 'deadline-exceeded', 'resource-exhausted']
    const mediumCodes = ['invalid-argument', 'failed-precondition', 'not-found']

    if (criticalCodes.includes(error.code)) return 'critical'
    if (highCodes.includes(error.code)) return 'high'
    if (mediumCodes.includes(error.code)) return 'medium'
    return 'low'
  }

  private reportToService(error: AppError, severity: ErrorSeverity): void {
    // In a real app, this would send to services like Sentry, LogRocket, etc.
    // For now, we'll just prepare the data structure
    const errorReport = {
      level: severity,
      message: error.message,
      extra: {
        code: error.code,
        timestamp: error.timestamp.toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        details: error.details
      }
    }

    // TODO: Implement actual error reporting
    console.log('Error report prepared:', errorReport)
  }

  private addToQueue(error: AppError): void {
    this.errorQueue.push(error)
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift() // Remove oldest error
    }
  }

  // Get recent errors for debugging
  getRecentErrors(count = 10): AppError[] {
    return this.errorQueue.slice(-count)
  }

  // Clear error queue
  clearErrors(): void {
    this.errorQueue = []
  }
}

// Utility functions for common error scenarios
export function handleAsyncError<T>(
  asyncFn: () => Promise<T>,
  context?: string
): Promise<T | null> {
  return asyncFn().catch((error) => {
    const errorHandler = AppErrorHandler.getInstance()
    errorHandler.handleError(error, context)
    return null
  })
}

export function createRetryWrapper<T>(
  asyncFn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000,
  context?: string
): Promise<T> {
  return new Promise(async (resolve, reject) => {

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await asyncFn()
        resolve(result)
        return
      } catch (error) {

        if (attempt === maxRetries) {
          const errorHandler = AppErrorHandler.getInstance()
          const appError = errorHandler.handleError(error, `${context} (after ${maxRetries} retries)`)
          reject(appError)
          return
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay * attempt))
      }
    }
  })
}

// Custom error classes
export class ValidationError extends Error {
  public details?: any
  constructor(message: string, details?: any) {
    super(message)
    this.name = 'ValidationError'
    this.details = details
  }
}

export class NetworkError extends Error {
  constructor(message: string = 'Network connection failed') {
    super(message)
    this.name = 'NetworkError'
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication required') {
    super(message)
    this.name = 'AuthenticationError'
  }
}

export class PermissionError extends Error {
  constructor(message: string = 'Permission denied') {
    super(message)
    this.name = 'PermissionError'
  }
}

// User-friendly error messages for UI
export function getUserFriendlyMessage(error: AppError | Error | string): string {
  if (typeof error === 'string') {
    return error
  }

  if ('code' in error) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message || 'An unexpected error occurred'
  }

  return 'An unexpected error occurred'
}

// Error boundary helper
export function logErrorBoundaryError(error: Error, errorInfo: any): void {
  const errorHandler = AppErrorHandler.getInstance()
  errorHandler.handleError(error, 'React Error Boundary')

  // Additional logging for React errors
  console.group('🔴 React Error Boundary')
  console.error('Component Stack:', errorInfo.componentStack)
  console.groupEnd()
}

// Performance monitoring
export function measurePerformance<T>(
  fn: () => Promise<T>,
  operationName: string
): Promise<T> {
  const startTime = performance.now()

  return fn().then(
    (result) => {
      const duration = performance.now() - startTime
      console.log(`⚡ ${operationName} completed in ${duration.toFixed(2)}ms`)
      return result
    },
    (error) => {
      const duration = performance.now() - startTime
      console.warn(`⚠️ ${operationName} failed after ${duration.toFixed(2)}ms`)
      throw error
    }
  )
}

// Export the singleton instance
export const errorHandler = AppErrorHandler.getInstance()