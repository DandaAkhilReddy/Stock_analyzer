import React, { useState, useRef, useCallback } from 'react'
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from '../config/firebase'
import { useAuth } from '../contexts/AuthContext'
import { errorHandler } from '../utils/errorHandling'

export interface UploadedMedia {
  id: string
  url: string
  fileName: string
  fileSize: number
  fileType: string
  uploadedAt: Date
  thumbnailUrl?: string
}

interface MediaUploadProps {
  accept?: string
  multiple?: boolean
  maxFileSize?: number
  maxFiles?: number
  folder?: string
  onUploadComplete: (media: UploadedMedia[]) => void
  onUploadProgress?: (progress: number) => void
  onError?: (error: string) => void
  className?: string
  children?: React.ReactNode
  uploadedMedia?: UploadedMedia[]
  allowDelete?: boolean
  showPreview?: boolean
  uploadButtonText?: string
  dragDropText?: string
}

export const MediaUpload: React.FC<MediaUploadProps> = ({
  accept = 'image/*,video/*',
  multiple = true,
  maxFileSize = 100 * 1024 * 1024, // 100MB
  maxFiles = 10,
  folder = 'media',
  onUploadComplete,
  onUploadProgress,
  onError,
  className = '',
  children,
  uploadedMedia = [],
  allowDelete = true,
  showPreview = true,
  uploadButtonText = 'Upload Media',
  dragDropText = 'Drag & drop files here or click to browse'
}) => {
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  const generateThumbnail = useCallback((file: File): Promise<string> => {
    return new Promise((resolve) => {
      if (file.type.startsWith('video/')) {
        const video = document.createElement('video')
        video.src = URL.createObjectURL(file)
        video.currentTime = 1
        video.onloadeddata = () => {
          const canvas = document.createElement('canvas')
          canvas.width = 320
          canvas.height = 240
          const ctx = canvas.getContext('2d')
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
            resolve(canvas.toDataURL('image/jpeg', 0.8))
          }
          URL.revokeObjectURL(video.src)
        }
      } else if (file.type.startsWith('image/')) {
        const img = new Image()
        img.src = URL.createObjectURL(file)
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const maxSize = 320
          const ratio = Math.min(maxSize / img.width, maxSize / img.height)
          canvas.width = img.width * ratio
          canvas.height = img.height * ratio

          const ctx = canvas.getContext('2d')
          if (ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
            resolve(canvas.toDataURL('image/jpeg', 0.8))
          }
          URL.revokeObjectURL(img.src)
        }
      } else {
        resolve('')
      }
    })
  }, [])

  const uploadFile = useCallback(async (file: File): Promise<UploadedMedia> => {
    if (!user) throw new Error('User must be authenticated')

    const fileName = `${Date.now()}_${file.name}`
    const filePath = `${folder}/${user.uid}/${fileName}`
    const storageRef = ref(storage, filePath)

    const uploadTask = uploadBytesResumable(storageRef, file)

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          setUploadProgress(progress)
          onUploadProgress?.(progress)
        },
        (error) => {
          console.error('Upload error:', error)
          reject(error)
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
            const thumbnailUrl = await generateThumbnail(file)

            const uploadedMedia: UploadedMedia = {
              id: fileName,
              url: downloadURL,
              fileName: file.name,
              fileSize: file.size,
              fileType: file.type,
              uploadedAt: new Date(),
              thumbnailUrl: thumbnailUrl || undefined
            }

            resolve(uploadedMedia)
          } catch (error) {
            reject(error)
          }
        }
      )
    })
  }, [user, folder, onUploadProgress, generateThumbnail])

  const validateFiles = useCallback((files: File[]): { valid: File[], errors: string[] } => {
    const errors: string[] = []
    const valid: File[] = []

    if (files.length + uploadedMedia.length > maxFiles) {
      errors.push(`Maximum ${maxFiles} files allowed`)
      return { valid: [], errors }
    }

    files.forEach(file => {
      if (file.size > maxFileSize) {
        errors.push(`${file.name} is too large (max ${Math.round(maxFileSize / 1024 / 1024)}MB)`)
      } else if (!file.type.match(accept.replace(/\*/g, '.*'))) {
        errors.push(`${file.name} has unsupported file type`)
      } else {
        valid.push(file)
      }
    })

    return { valid, errors }
  }, [maxFileSize, maxFiles, uploadedMedia.length, accept])

  const handleFileSelection = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const fileArray = Array.from(files)
    const { valid, errors } = validateFiles(fileArray)

    if (errors.length > 0) {
      onError?.(errors.join(', '))
      return
    }

    setSelectedFiles(valid)
    setUploading(true)

    try {
      const uploadPromises = valid.map(uploadFile)
      const uploadedFiles = await Promise.all(uploadPromises)

      onUploadComplete([...uploadedMedia, ...uploadedFiles])
      setSelectedFiles([])

    } catch (error) {
      const appError = errorHandler.handleError(error, 'File upload')
      onError?.(appError.message)
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }, [validateFiles, uploadFile, uploadedMedia, onUploadComplete, onError])

  const handleDelete = useCallback(async (media: UploadedMedia) => {
    if (!user || !allowDelete) return

    try {
      const filePath = `${folder}/${user.uid}/${media.id}`
      const storageRef = ref(storage, filePath)
      await deleteObject(storageRef)

      const updatedMedia = uploadedMedia.filter(m => m.id !== media.id)
      onUploadComplete(updatedMedia)

    } catch (error) {
      const appError = errorHandler.handleError(error, 'File deletion')
      onError?.(appError.message)
    }
  }, [user, allowDelete, folder, uploadedMedia, onUploadComplete, onError])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files)
    }
  }, [handleFileSelection])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {children}

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : uploading
            ? 'border-gray-300 bg-gray-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => handleFileSelection(e.target.files)}
          className="hidden"
          disabled={uploading}
        />

        {uploading ? (
          <div className="space-y-2">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-sm text-gray-600">Uploading... {Math.round(uploadProgress)}%</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <svg
              className="w-12 h-12 text-gray-400 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-sm text-gray-600">{dragDropText}</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {uploadButtonText}
            </button>
            <p className="text-xs text-gray-500">
              Max {formatFileSize(maxFileSize)} per file, up to {maxFiles} files
            </p>
          </div>
        )}
      </div>

      {/* Preview/List of uploaded media */}
      {showPreview && uploadedMedia.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Uploaded Media ({uploadedMedia.length}/{maxFiles})</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {uploadedMedia.map((media) => (
              <div key={media.id} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                  {media.fileType.startsWith('image/') ? (
                    <img
                      src={media.url}
                      alt={media.fileName}
                      className="w-full h-full object-cover"
                    />
                  ) : media.fileType.startsWith('video/') ? (
                    <div className="relative w-full h-full">
                      {media.thumbnailUrl ? (
                        <img
                          src={media.thumbnailUrl}
                          alt={media.fileName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <video
                          src={media.url}
                          className="w-full h-full object-cover"
                          muted
                        />
                      )}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-black/50 rounded-full p-2">
                          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                      </svg>
                    </div>
                  )}
                </div>

                {allowDelete && (
                  <button
                    onClick={() => handleDelete(media)}
                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}

                <div className="mt-1 text-xs text-gray-600 truncate">
                  {media.fileName}
                </div>
                <div className="text-xs text-gray-400">
                  {formatFileSize(media.fileSize)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default MediaUpload