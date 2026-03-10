import React, { useState } from 'react'
import MediaUpload, { type UploadedMedia } from './MediaUpload'

interface RecipeMediaUploadProps {
  onMediaUploaded: (media: UploadedMedia[]) => void
  existingMedia: UploadedMedia[]
  className?: string
  recipeId?: string
}

export const RecipeMediaUpload: React.FC<RecipeMediaUploadProps> = ({
  onMediaUploaded,
  existingMedia,
  className = '',
  recipeId = 'new-recipe'
}) => {
  const [error, setError] = useState<string | null>(null)
  const [_uploadProgress, setUploadProgress] = useState(0)

  const handleUploadComplete = (media: UploadedMedia[]) => {
    onMediaUploaded(media)
    setError(null)
  }

  const handleError = (errorMessage: string) => {
    setError(errorMessage)
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Recipe Media</h3>
        <span className="text-sm text-gray-500">
          {existingMedia.length}/15 files
        </span>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <svg className="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="text-sm text-green-700">
            <p className="font-medium">Create engaging recipe content:</p>
            <ul className="mt-1 list-disc list-inside space-y-1">
              <li>Add step-by-step cooking videos to help others follow along</li>
              <li>Include photos of ingredients, cooking process, and final dish</li>
              <li>Show different angles and presentation styles</li>
              <li>Your content will inspire the fitness community!</li>
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
        maxFileSize={50 * 1024 * 1024} // 50MB for recipe videos
        maxFiles={15}
        folder={`recipes/${recipeId}`}
        onUploadComplete={handleUploadComplete}
        onUploadProgress={setUploadProgress}
        onError={handleError}
        uploadedMedia={existingMedia}
        allowDelete={true}
        showPreview={true}
        uploadButtonText="Add Recipe Media"
        dragDropText="Drag & drop recipe photos and videos here or click to browse"
      />

      {/* Media type breakdown */}
      {existingMedia.length > 0 && (
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-blue-700">
                {existingMedia.filter(m => m.fileType.startsWith('image/')).length} Photos
              </span>
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
              </svg>
              <span className="text-sm font-medium text-purple-700">
                {existingMedia.filter(m => m.fileType.startsWith('video/')).length} Videos
              </span>
            </div>
          </div>
        </div>
      )}

      {existingMedia.length > 0 && (
        <div className="text-xs text-gray-500 text-center">
          Your recipe media will be shared with the community to help others learn and get inspired!
        </div>
      )}
    </div>
  )
}

export default RecipeMediaUpload