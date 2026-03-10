import React, { useState } from 'react'
import MediaUpload, { type UploadedMedia } from './MediaUpload'

interface WorkoutVideoUploadProps {
  onVideosUploaded: (videos: UploadedMedia[]) => void
  existingVideos: UploadedMedia[]
  className?: string
  workoutId?: string
}

export const WorkoutVideoUpload: React.FC<WorkoutVideoUploadProps> = ({
  onVideosUploaded,
  existingVideos,
  className = '',
  workoutId = 'new-workout'
}) => {
  const [error, setError] = useState<string | null>(null)
  const [_uploadProgress, setUploadProgress] = useState(0)

  const handleUploadComplete = (media: UploadedMedia[]) => {
    onVideosUploaded(media)
    setError(null)
  }

  const handleError = (errorMessage: string) => {
    setError(errorMessage)
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Workout Videos & Photos</h3>
        <span className="text-sm text-gray-500">
          {existingVideos.length}/10 files
        </span>
      </div>

      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <svg className="w-5 h-5 text-orange-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="text-sm text-orange-700">
            <p className="font-medium">Share your workout expertise:</p>
            <ul className="mt-1 list-disc list-inside space-y-1">
              <li>Record exercise demonstrations with proper form</li>
              <li>Show different angles and variations</li>
              <li>Include before/after transformation photos</li>
              <li>Help others learn from your fitness journey and techniques</li>
              <li>Connect with workout partners who share your interests</li>
            </ul>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      <MediaUpload
        accept="image/*,video/*"
        multiple={true}
        maxFileSize={100 * 1024 * 1024} // 100MB for workout videos
        maxFiles={10}
        folder={`workouts/${workoutId}`}
        onUploadComplete={handleUploadComplete}
        onUploadProgress={setUploadProgress}
        onError={handleError}
        uploadedMedia={existingVideos}
        allowDelete={true}
        showPreview={true}
        uploadButtonText="Add Workout Media"
        dragDropText="Drag & drop workout videos and photos here or click to browse"
      />

      {/* Media type breakdown */}
      {existingVideos.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-red-50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
              </svg>
              <span className="text-sm font-medium text-red-700">
                {existingVideos.filter(m => m.fileType.startsWith('video/')).length} Videos
              </span>
            </div>
          </div>
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-blue-700">
                {existingVideos.filter(m => m.fileType.startsWith('image/')).length} Photos
              </span>
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-green-700">
                {existingVideos.length} Total
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Privacy settings */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">Sharing Settings</h4>
        <div className="space-y-2">
          <label className="flex items-center space-x-3">
            <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
            <span className="text-sm text-gray-700">Share with fitness community for feedback and inspiration</span>
          </label>
          <label className="flex items-center space-x-3">
            <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            <span className="text-sm text-gray-700">Allow others to use my workouts as templates</span>
          </label>
          <label className="flex items-center space-x-3">
            <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            <span className="text-sm text-gray-700">Show in my public profile for potential workout partners</span>
          </label>
        </div>
      </div>

      {existingVideos.length > 0 && (
        <div className="text-xs text-gray-500 text-center">
          Your workout content helps inspire others and can attract like-minded fitness partners to connect with you!
        </div>
      )}
    </div>
  )
}

export default WorkoutVideoUpload