import { collection, doc, updateDoc, arrayUnion, arrayRemove, getDoc, setDoc } from 'firebase/firestore'
import { ref, deleteObject } from 'firebase/storage'
import { db, storage } from '../config/firebase'
import { UploadedMedia } from '../components/MediaUpload'

export interface MediaCollection {
  id: string
  userId: string
  type: 'progress-photos' | 'recipe-media' | 'workout-media' | 'profile-media'
  media: UploadedMedia[]
  createdAt: Date
  updatedAt: Date
  metadata?: {
    workoutId?: string
    recipeId?: string
    isPublic?: boolean
    tags?: string[]
    description?: string
  }
}

class MediaService {
  // Save media collection to Firestore
  async saveMediaCollection(userId: string, collection: Omit<MediaCollection, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<void> {
    try {
      const collectionId = `${collection.type}_${Date.now()}`
      const mediaDoc = doc(db, 'media', collectionId)

      const mediaCollection: MediaCollection = {
        id: collectionId,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...collection
      }

      await setDoc(mediaDoc, mediaCollection)
    } catch (error) {
      console.error('Error saving media collection:', error)
      throw error
    }
  }

  // Update existing media collection
  async updateMediaCollection(collectionId: string, updates: Partial<MediaCollection>): Promise<void> {
    try {
      const mediaDoc = doc(db, 'media', collectionId)
      await updateDoc(mediaDoc, {
        ...updates,
        updatedAt: new Date()
      })
    } catch (error) {
      console.error('Error updating media collection:', error)
      throw error
    }
  }

  // Get media collection
  async getMediaCollection(collectionId: string): Promise<MediaCollection | null> {
    try {
      const mediaDoc = doc(db, 'media', collectionId)
      const docSnap = await getDoc(mediaDoc)

      if (docSnap.exists()) {
        return docSnap.data() as MediaCollection
      }
      return null
    } catch (error) {
      console.error('Error getting media collection:', error)
      throw error
    }
  }

  // Add media to user's progress photos
  async addProgressPhotos(userId: string, photos: UploadedMedia[]): Promise<void> {
    try {
      const userDoc = doc(db, 'users', userId)
      const userSnap = await getDoc(userDoc)

      if (userSnap.exists()) {
        await updateDoc(userDoc, {
          'progress.photos': arrayUnion(...photos),
          'progress.lastUpdated': new Date()
        })
      } else {
        await setDoc(userDoc, {
          progress: {
            photos: photos,
            lastUpdated: new Date()
          }
        }, { merge: true })
      }

      // Also save as a separate collection for better querying
      await this.saveMediaCollection(userId, {
        type: 'progress-photos',
        media: photos,
        metadata: { isPublic: false }
      })
    } catch (error) {
      console.error('Error adding progress photos:', error)
      throw error
    }
  }

  // Add media to recipe
  async addRecipeMedia(userId: string, recipeId: string, media: UploadedMedia[]): Promise<void> {
    try {
      const recipeDoc = doc(db, 'recipes', recipeId)
      await updateDoc(recipeDoc, {
        media: arrayUnion(...media),
        updatedAt: new Date()
      })

      // Also save as a separate collection
      await this.saveMediaCollection(userId, {
        type: 'recipe-media',
        media: media,
        metadata: { recipeId, isPublic: true }
      })
    } catch (error) {
      console.error('Error adding recipe media:', error)
      throw error
    }
  }

  // Add media to workout
  async addWorkoutMedia(userId: string, workoutId: string, media: UploadedMedia[], isPublic: boolean = false): Promise<void> {
    try {
      const workoutDoc = doc(db, 'workouts', workoutId)
      await updateDoc(workoutDoc, {
        media: arrayUnion(...media),
        updatedAt: new Date()
      })

      // Also save as a separate collection
      await this.saveMediaCollection(userId, {
        type: 'workout-media',
        media: media,
        metadata: { workoutId, isPublic }
      })
    } catch (error) {
      console.error('Error adding workout media:', error)
      throw error
    }
  }

  // Remove media from collection
  async removeMedia(collectionId: string, mediaToRemove: UploadedMedia): Promise<void> {
    try {
      // Delete from Firebase Storage
      const storageRef = ref(storage, mediaToRemove.url)
      await deleteObject(storageRef)

      // Update Firestore collection
      const mediaDoc = doc(db, 'media', collectionId)
      await updateDoc(mediaDoc, {
        media: arrayRemove(mediaToRemove),
        updatedAt: new Date()
      })
    } catch (error) {
      console.error('Error removing media:', error)
      throw error
    }
  }

  // Get user's public media for social features
  async getUserPublicMedia(userId: string, type?: MediaCollection['type']): Promise<MediaCollection[]> {
    try {
      const mediaQuery = collection(db, 'media')
      // In a real app, you'd use Firebase queries to filter
      // For now, we'll return mock data structure
      return []
    } catch (error) {
      console.error('Error getting user public media:', error)
      throw error
    }
  }

  // Get community media feed for social features
  async getCommunityMediaFeed(limit: number = 20): Promise<MediaCollection[]> {
    try {
      // In a real app, you'd query public media from all users
      // For now, we'll return mock data structure
      return []
    } catch (error) {
      console.error('Error getting community media feed:', error)
      throw error
    }
  }

  // Search media by tags or content
  async searchMedia(query: string, type?: MediaCollection['type']): Promise<MediaCollection[]> {
    try {
      // In a real app, you'd implement full-text search
      // For now, we'll return mock data structure
      return []
    } catch (error) {
      console.error('Error searching media:', error)
      throw error
    }
  }

  // Get recommended content based on user's fitness interests
  async getRecommendedMedia(userId: string, interests: string[]): Promise<MediaCollection[]> {
    try {
      // In a real app, you'd implement recommendation algorithm
      // For now, we'll return mock data structure
      return []
    } catch (error) {
      console.error('Error getting recommended media:', error)
      throw error
    }
  }

  // Report inappropriate content
  async reportContent(collectionId: string, reason: string, reportedBy: string): Promise<void> {
    try {
      const reportDoc = doc(db, 'reports', `${collectionId}_${Date.now()}`)
      await setDoc(reportDoc, {
        collectionId,
        reason,
        reportedBy,
        reportedAt: new Date(),
        status: 'pending'
      })
    } catch (error) {
      console.error('Error reporting content:', error)
      throw error
    }
  }

  // Like/unlike media
  async toggleLike(collectionId: string, userId: string): Promise<void> {
    try {
      const mediaDoc = doc(db, 'media', collectionId)
      const mediaSnap = await getDoc(mediaDoc)

      if (mediaSnap.exists()) {
        const data = mediaSnap.data() as MediaCollection
        const likes = data.metadata?.tags || []
        const userLiked = likes.includes(`like_${userId}`)

        if (userLiked) {
          await updateDoc(mediaDoc, {
            'metadata.tags': arrayRemove(`like_${userId}`),
            updatedAt: new Date()
          })
        } else {
          await updateDoc(mediaDoc, {
            'metadata.tags': arrayUnion(`like_${userId}`),
            updatedAt: new Date()
          })
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error)
      throw error
    }
  }

  // Add comment to media
  async addComment(collectionId: string, userId: string, comment: string): Promise<void> {
    try {
      const commentDoc = doc(db, 'comments', `${collectionId}_${Date.now()}`)
      await setDoc(commentDoc, {
        mediaCollectionId: collectionId,
        userId,
        comment,
        createdAt: new Date()
      })
    } catch (error) {
      console.error('Error adding comment:', error)
      throw error
    }
  }
}

export const mediaService = new MediaService()
export default mediaService