import React, { useState } from 'react'
import MediaUpload, { type UploadedMedia } from './MediaUpload'

interface ProgressPhotoUploadProps {
  onPhotosUploaded: (photos: UploadedMedia[]) => void
  existingPhotos: UploadedMedia[]
  className?: string
}

export const ProgressPhotoUpload: React.FC<ProgressPhotoUploadProps> = ({
  onPhotosUploaded,
  existingPhotos,
  className = ''
}) => {
  const [error, setError] = useState<string | null>(null)
  const [_uploadProgress, setUploadProgress] = useState(0)

  const handleUploadComplete = (media: UploadedMedia[]) => {
    onPhotosUploaded(media)
    setError(null)
  }

  const handleError = (errorMessage: string) => {
    setError(errorMessage)
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Progress Photos</h3>
        <span className="text-sm text-gray-500">
          {existingPhotos.length}/20 photos
        </span>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="text-sm text-blue-700">
            <p className="font-medium">Tips for great progress photos:</p>
            <ul className="mt-1 list-disc list-inside space-y-1">
              <li>Take photos in consistent lighting and location</li>
              <li>Wear the same or similar clothing for comparison</li>
              <li>Take front, side, and back views</li>
              <li>Photos will be private unless you choose to share them</li>
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
        accept="image/*"
        multiple={true}
        maxFileSize={10 * 1024 * 1024} // 10MB
        maxFiles={20}
        folder="progress-photos"
        onUploadComplete={handleUploadComplete}
        onUploadProgress={setUploadProgress}
        onError={handleError}
        uploadedMedia={existingPhotos}
        allowDelete={true}
        showPreview={true}
        uploadButtonText="Add Progress Photos"
        dragDropText="Drag & drop your progress photos here or click to browse"
      />

      {existingPhotos.length > 0 && (
        <div className="text-xs text-gray-500 text-center">
          Your progress photos are private and secure. Only you can see them unless you choose to share them with the community.
        </div>
      )}
    </div>
  )
}

export default ProgressPhotoUpload