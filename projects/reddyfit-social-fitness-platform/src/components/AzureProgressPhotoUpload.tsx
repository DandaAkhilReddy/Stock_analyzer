import React, { useState } from 'react'
import AzureMediaUpload, { AzureUploadedMedia } from './AzureMediaUpload'

interface AzureProgressPhotoUploadProps {
  onPhotosUploaded: (photos: AzureUploadedMedia[]) => void
  existingPhotos: AzureUploadedMedia[]
  className?: string
}

export const AzureProgressPhotoUpload: React.FC<AzureProgressPhotoUploadProps> = ({
  onPhotosUploaded,
  existingPhotos,
  className = ''
}) => {
  const [error, setError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleUploadComplete = (media: AzureUploadedMedia[]) => {
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
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            {existingPhotos.length}/20 photos
          </span>
          <div className="text-xs bg-blue-100 px-2 py-1 rounded text-blue-700">
            Azure Storage
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="text-sm text-blue-700">
            <p className="font-medium">Azure Blob Storage Benefits:</p>
            <ul className="mt-1 list-disc list-inside space-y-1">
              <li>⚡ Lightning-fast uploads with global CDN</li>
              <li>💰 99% cheaper storage costs than competitors</li>
              <li>🔒 Enterprise-grade security and privacy</li>
              <li>🌍 Instant access worldwide with edge caching</li>
              <li>📱 Perfect for high-resolution progress photos</li>
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

      <AzureMediaUpload
        accept="image/*"
        multiple={true}
        maxFileSize={15 * 1024 * 1024} // 15MB for high-res photos
        maxFiles={20}
        containerType="progressPhotos"
        onUploadComplete={handleUploadComplete}
        onUploadProgress={setUploadProgress}
        onError={handleError}
        uploadedMedia={existingPhotos}
        allowDelete={true}
        showPreview={true}
        uploadButtonText="Add Progress Photos"
        dragDropText="Drag & drop your progress photos here - stored securely in Azure"
      />

      {existingPhotos.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div className="text-sm text-green-700">
              <span className="font-medium">Securely stored in Azure!</span> Your photos are encrypted, globally distributed, and accessible only to you.
            </div>
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500 text-center space-y-1">
        <p>🔒 Your progress photos are private and secure unless you choose to share them</p>
        <p>🌍 Powered by Microsoft Azure's global content delivery network</p>
      </div>
    </div>
  )
}

export default AzureProgressPhotoUpload