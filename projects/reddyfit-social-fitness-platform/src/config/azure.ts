import { BlobServiceClient, ContainerClient } from '@azure/storage-blob'

// Azure Storage configuration
const AZURE_STORAGE_CONFIG = {
  // Use your Azure Storage account name
  accountName: process.env.VITE_AZURE_STORAGE_ACCOUNT_NAME || 'reddyfitstorage',

  // For development, you can use the connection string approach
  // For production, use Azure AD authentication
  connectionString: process.env.VITE_AZURE_STORAGE_CONNECTION_STRING ||
    'DefaultEndpointsProtocol=https;AccountName=reddyfitstorage;AccountKey=your-key-here;EndpointSuffix=core.windows.net',

  // Container names for different types of content
  containers: {
    progressPhotos: 'progress-photos',
    recipeMedia: 'recipe-media',
    workoutVideos: 'workout-videos',
    userAvatars: 'user-avatars',
    thumbnails: 'thumbnails',
    communityPosts: 'community-posts'
  },

  // CDN endpoint for faster delivery
  cdnEndpoint: process.env.VITE_AZURE_CDN_ENDPOINT || 'https://reddyfit.azureedge.net'
}

class AzureBlobService {
  private blobServiceClient: BlobServiceClient
  private containers: Map<string, ContainerClient> = new Map()

  constructor() {
    // Initialize Azure Blob Service Client
    if (AZURE_STORAGE_CONFIG.connectionString.includes('your-key-here')) {
      // For demo purposes, we'll use a mock service
      console.warn('Azure Storage: Using mock service - configure real connection string for production')
      this.blobServiceClient = {} as BlobServiceClient
    } else {
      this.blobServiceClient = BlobServiceClient.fromConnectionString(
        AZURE_STORAGE_CONFIG.connectionString
      )
      this.initializeContainers()
    }
  }

  private async initializeContainers() {
    try {
      // Create containers if they don't exist
      for (const [key, containerName] of Object.entries(AZURE_STORAGE_CONFIG.containers)) {
        const containerClient = this.blobServiceClient.getContainerClient(containerName)

        // Create container with public read access for blobs
        await containerClient.createIfNotExists({
          access: 'blob' // Public read access for individual blobs
        })

        this.containers.set(key, containerClient)
        console.log(`✅ Azure container '${containerName}' ready`)
      }
    } catch (error) {
      console.error('Failed to initialize Azure containers:', error)
    }
  }

  // Generate a unique blob name
  private generateBlobName(originalName: string, userId: string, prefix: string = ''): string {
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 15)
    const fileExtension = originalName.split('.').pop()
    return `${prefix}${userId}/${timestamp}_${randomId}.${fileExtension}`
  }

  // Upload file to Azure Blob Storage
  async uploadFile(
    file: File,
    containerType: keyof typeof AZURE_STORAGE_CONFIG.containers,
    userId: string,
    onProgress?: (progress: number) => void
  ): Promise<{ url: string; blobName: string }> {

    // Mock implementation for demo
    if (!this.containers.size) {
      return this.mockUpload(file, containerType, userId, onProgress)
    }

    try {
      const containerClient = this.containers.get(containerType)
      if (!containerClient) {
        throw new Error(`Container ${containerType} not found`)
      }

      const blobName = this.generateBlobName(file.name, userId)
      const blockBlobClient = containerClient.getBlockBlobClient(blobName)

      // Set content type based on file type
      const contentType = file.type || 'application/octet-stream'

      // Upload with progress tracking
      await blockBlobClient.uploadData(file, {
        blobHTTPHeaders: {
          blobContentType: contentType,
          blobCacheControl: 'public, max-age=31536000' // 1 year cache
        },
        onProgress: (progress) => {
          const percentage = (progress.loadedBytes / file.size) * 100
          onProgress?.(percentage)
        }
      })

      // Return the public URL (or CDN URL if configured)
      const url = AZURE_STORAGE_CONFIG.cdnEndpoint
        ? `${AZURE_STORAGE_CONFIG.cdnEndpoint}/${AZURE_STORAGE_CONFIG.containers[containerType]}/${blobName}`
        : blockBlobClient.url

      return { url, blobName }

    } catch (error) {
      console.error('Azure upload error:', error)
      throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Mock upload for demo purposes
  private async mockUpload(
    file: File,
    containerType: string,
    userId: string,
    onProgress?: (progress: number) => void
  ): Promise<{ url: string; blobName: string }> {

    // Simulate upload progress
    return new Promise((resolve) => {
      let progress = 0
      const interval = setInterval(() => {
        progress += Math.random() * 30
        if (progress > 100) progress = 100

        onProgress?.(progress)

        if (progress >= 100) {
          clearInterval(interval)

          // Generate mock URL
          const blobName = this.generateBlobName(file.name, userId)
          const mockUrl = `https://reddyfit.blob.core.windows.net/${containerType}/${blobName}`

          resolve({ url: mockUrl, blobName })
        }
      }, 100)
    })
  }

  // Delete file from Azure Blob Storage
  async deleteFile(
    containerType: keyof typeof AZURE_STORAGE_CONFIG.containers,
    blobName: string
  ): Promise<void> {
    if (!this.containers.size) {
      console.log('Mock delete:', blobName)
      return
    }

    try {
      const containerClient = this.containers.get(containerType)
      if (!containerClient) {
        throw new Error(`Container ${containerType} not found`)
      }

      const blockBlobClient = containerClient.getBlockBlobClient(blobName)
      await blockBlobClient.deleteIfExists()

    } catch (error) {
      console.error('Azure delete error:', error)
      throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Generate thumbnail for video files
  async generateThumbnail(videoFile: File): Promise<string> {
    return new Promise((resolve) => {
      const video = document.createElement('video')
      video.src = URL.createObjectURL(videoFile)
      video.currentTime = 1 // Seek to 1 second

      video.onloadeddata = () => {
        const canvas = document.createElement('canvas')
        canvas.width = 320
        canvas.height = 240

        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8)
          resolve(thumbnailUrl)
        }

        URL.revokeObjectURL(video.src)
      }
    })
  }

  // Get container URL for direct access
  getContainerUrl(containerType: keyof typeof AZURE_STORAGE_CONFIG.containers): string {
    const containerName = AZURE_STORAGE_CONFIG.containers[containerType]
    return AZURE_STORAGE_CONFIG.cdnEndpoint
      ? `${AZURE_STORAGE_CONFIG.cdnEndpoint}/${containerName}`
      : `https://${AZURE_STORAGE_CONFIG.accountName}.blob.core.windows.net/${containerName}`
  }

  // Batch upload multiple files
  async uploadFiles(
    files: File[],
    containerType: keyof typeof AZURE_STORAGE_CONFIG.containers,
    userId: string,
    onProgress?: (fileIndex: number, progress: number) => void
  ): Promise<Array<{ url: string; blobName: string; fileName: string }>> {
    const results = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const result = await this.uploadFile(
        file,
        containerType,
        userId,
        (progress) => onProgress?.(i, progress)
      )

      results.push({
        ...result,
        fileName: file.name
      })
    }

    return results
  }
}

// Export singleton instance
export const azureBlobService = new AzureBlobService()
export default azureBlobService

// Export configuration for reference
export { AZURE_STORAGE_CONFIG }

// Types for TypeScript
export interface AzureUploadResult {
  url: string
  blobName: string
  fileName?: string
}

export type AzureContainerType = keyof typeof AZURE_STORAGE_CONFIG.containers