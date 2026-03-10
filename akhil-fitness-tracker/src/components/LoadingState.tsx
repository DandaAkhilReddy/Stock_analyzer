import { Loader2, AlertCircle, RefreshCw } from 'lucide-react'

interface LoadingStateProps {
  isLoading?: boolean
  error?: string | null
  onRetry?: () => void
  loadingText?: string
  errorTitle?: string
  size?: 'sm' | 'md' | 'lg'
  fullScreen?: boolean
  children?: React.ReactNode
}

export default function LoadingState({
  isLoading = false,
  error = null,
  onRetry,
  loadingText = 'Loading...',
  errorTitle = 'Something went wrong',
  size = 'md',
  fullScreen = false,
  children
}: LoadingStateProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }

  const spinnerSize = sizeClasses[size]
  const textSize = textSizeClasses[size]

  const containerClasses = fullScreen
    ? 'fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center'
    : 'flex items-center justify-center py-8'

  // Error state
  if (error) {
    return (
      <div className={containerClasses}>
        <div className="text-center max-w-md mx-auto p-6">
          <div className="mb-4">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          </div>
          <h3 className={`font-semibold text-gray-800 mb-2 ${textSize}`}>
            {errorTitle}
          </h3>
          <p className="text-gray-600 text-sm mb-4">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="btn-primary flex items-center justify-center mx-auto"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </button>
          )}
        </div>
      </div>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className={containerClasses}>
        <div className="text-center">
          <div className="mb-3">
            <Loader2 className={`${spinnerSize} animate-spin text-primary-500 mx-auto`} />
          </div>
          <p className={`text-gray-600 ${textSize}`}>{loadingText}</p>
        </div>
      </div>
    )
  }

  // Render children when not loading and no error
  return <>{children}</>
}

// Skeleton loader for content placeholders
interface SkeletonProps {
  className?: string
  count?: number
}

export function Skeleton({ className = '', count = 1 }: SkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`animate-pulse bg-gray-200 rounded ${className}`}
          style={{ animationDelay: `${index * 0.1}s` }}
        />
      ))}
    </>
  )
}

// Card skeleton for loading cards
export function CardSkeleton() {
  return (
    <div className="glass-morphism p-6 animate-pulse">
      <div className="flex items-center space-x-3 mb-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <Skeleton className="h-3 w-4/6" />
      </div>
    </div>
  )
}

// List skeleton for loading lists
export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl animate-pulse">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </div>
  )
}

// Button loading state
interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean
  loadingText?: string
  children: React.ReactNode
}

export function LoadingButton({
  isLoading = false,
  loadingText = 'Loading...',
  children,
  disabled,
  className = '',
  ...props
}: LoadingButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      className={`${className} ${isLoading ? 'cursor-not-allowed opacity-75' : ''}`}
    >
      {isLoading ? (
        <div className="flex items-center justify-center">
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          {loadingText}
        </div>
      ) : (
        children
      )}
    </button>
  )
}

// Page loading wrapper
interface PageLoadingProps {
  isLoading: boolean
  error?: string | null
  onRetry?: () => void
  children: React.ReactNode
}

export function PageLoading({ isLoading, error, onRetry, children }: PageLoadingProps) {
  if (isLoading) {
    return (
      <div className="space-y-8">
        {/* Header skeleton */}
        <div className="text-center">
          <Skeleton className="h-8 w-64 mx-auto mb-2" />
          <Skeleton className="h-6 w-96 mx-auto" />
        </div>

        {/* Cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>

        {/* Content skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <CardSkeleton />
          </div>
          <div>
            <CardSkeleton />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <LoadingState
        error={error}
        onRetry={onRetry}
        errorTitle="Failed to load page"
        size="lg"
      />
    )
  }

  return <>{children}</>
}

// Form field loading state
export function FieldLoading() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-10 w-full" />
    </div>
  )
}