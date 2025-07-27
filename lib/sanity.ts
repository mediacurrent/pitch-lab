import { createClient } from 'next-sanity'
import imageUrlBuilder from '@sanity/image-url'
import { apiVersion, dataset, projectId } from '../sanity/env'

// Create client only if environment variables are available
export const client = typeof projectId === 'string' && projectId.length > 0 
  ? createClient({
      projectId,
      dataset,
      apiVersion,
      useCdn: false, // Set to false for fresh data
      perspective: 'published', // Only get published content
    })
  : null

const builder = client ? imageUrlBuilder(client) : null

export function urlFor(source: any) {
  if (!builder) return null
  return builder.image(source)
}

export interface ImageEntry {
  id: string
  title: string
  imageUrl1: string
  imageUrl2: string
  status?: string
  metadata?: {
    altText1?: string
    altText2?: string
    credit?: string
    location?: string
  }
}

export async function getAllImages(): Promise<ImageEntry[]> {
  if (!client) {
    console.error('Sanity client not configured')
    return []
  }
  
  try {
    const query = `*[_type == "imagePair"] {
      _id,
      title,
      "imageUrl1": image1.asset->url,
      "imageUrl2": image2.asset->url,
      status,
      metadata
    } | order(order asc)`

    const images = await client.fetch(query)
    
    return images.map((image: any) => ({
      id: image._id,
      title: image.title || '',
      imageUrl1: image.imageUrl1 || '',
      imageUrl2: image.imageUrl2 || '',
      status: image.status || 'active',
      metadata: image.metadata || {},
    }))
  } catch (error) {
    console.error('Error fetching images from Sanity:', error)
    return []
  }
}



export async function getImageById(id: string): Promise<ImageEntry | null> {
  if (!client) {
    console.error('Sanity client not configured')
    return null
  }
  
  try {
    const query = `*[_type == "imagePair" && _id == $id][0] {
      _id,
      title,
      "imageUrl1": image1.asset->url,
      "imageUrl2": image2.asset->url,
      status,
      metadata
    }`

    const image = await client.fetch(query, { id })

    if (!image) return null

    return {
      id: image._id,
      title: image.title || '',
      imageUrl1: image.imageUrl1 || '',
      imageUrl2: image.imageUrl2 || '',
      status: image.status || 'active',
      metadata: image.metadata || {},
    }
  } catch (error) {
    console.error('Error fetching image by ID from Sanity:', error)
    return null
  }
}





// New interfaces for This or That instances
export interface ImagePairEntry {
  title: string
  imageUrl1: string
  imageUrl2: string
  altText1?: string
  altText2?: string
  order: number
}

export interface ThisOrThatInstance {
  id: string
  title: string
  description?: string
  timerLength: number
  slug: string
  isActive: boolean
  createdBy: string
  imagePairs: ImagePairEntry[]
}

// Fetch all active This or That
export async function getAllInstances(): Promise<ThisOrThatInstance[]> {
  if (!client) {
    console.error('Sanity client not configured')
    return []
  }
  
  try {
    const query = `*[_type == "thisOrThatInstance" && isActive == true] {
      _id,
      title,
      description,
      timerLength,
      "slug": slug.current,
      isActive,
      createdBy,
      imagePairs[]{
        title,
        "imageUrl1": coalesce(image1.asset.asset->url, image1.externalUrl),
        "imageUrl2": coalesce(image2.asset.asset->url, image2.externalUrl),
        "altText1": image1.altText,
        "altText2": image2.altText,
        order
      }
    } | order(_createdAt desc)`

    const instances = await client.fetch(query)
    
    return instances.map((instance: any) => ({
      id: instance._id,
      title: instance.title || '',
      description: instance.description || '',
      timerLength: instance.timerLength || 10,
      slug: instance.slug || '',
      isActive: instance.isActive || false,
      imagePairs: (instance.imagePairs || []).map((pair: any) => ({
        title: pair.title || '',
        imageUrl1: pair.imageUrl1 || '',
        imageUrl2: pair.imageUrl2 || '',
        altText1: pair.altText1 || '',
        altText2: pair.altText2 || '',
        order: pair.order || 0,
      })).sort((a: any, b: any) => a.order - b.order),
    }))
  } catch (error) {
    console.error('Error fetching instances from Sanity:', error)
    return []
  }
}

// Fetch a specific This or That by slug
export async function getInstanceBySlug(slug: string): Promise<ThisOrThatInstance | null> {
  if (!client) {
    console.error('Sanity client not configured')
    return null
  }
  
  try {
    const query = `*[_type == "thisOrThatInstance" && slug.current == $slug && isActive == true][0] {
      _id,
      title,
      description,
      timerLength,
      "slug": slug.current,
      isActive,
      createdBy,
      imagePairs[]{
        title,
        "imageUrl1": coalesce(image1.asset.asset->url, image1.externalUrl),
        "imageUrl2": coalesce(image2.asset.asset->url, image2.externalUrl),
        "altText1": image1.altText,
        "altText2": image2.altText,
        order
      }
    }`

    const instance = await client.fetch(query, { slug })

    if (!instance) return null

    return {
      id: instance._id,
      title: instance.title || '',
      description: instance.description || '',
      timerLength: instance.timerLength || 10,
      slug: instance.slug || '',
      isActive: instance.isActive || false,
      createdBy: instance.createdBy || 'Unknown',
      imagePairs: (instance.imagePairs || []).map((pair: any) => ({
        title: pair.title || '',
        imageUrl1: pair.imageUrl1 || '',
        imageUrl2: pair.imageUrl2 || '',
        altText1: pair.altText1 || '',
        altText2: pair.altText2 || '',
        order: pair.order || 0,
      })).sort((a: any, b: any) => a.order - b.order),
    }
  } catch (error) {
    console.error('Error fetching instance by slug from Sanity:', error)
    return null
  }
}

// Interface for voting session data
export interface VotingSessionData {
  userName: string
  instanceId: string
  instanceTitle: string
  votes: {
    imagePairTitle: string
    imageUrl1: string
    imageUrl2: string
    selectedImage: 'left' | 'right' | 'timeout'
    timeSpent: number
  }[]
  summary: {
    totalVotes: number
    leftVotes: number
    rightVotes: number
    timeoutVotes: number
    averageTimePerVote: number
  }
}

// Save a voting session to Sanity
export async function saveVotingSession(sessionData: VotingSessionData): Promise<string | null> {
  if (!client) {
    console.error('Sanity client not configured')
    return null
  }
  
  try {
    const doc = {
      _type: 'votingSession',
      userName: sessionData.userName,
      instanceId: sessionData.instanceId,
      instanceTitle: sessionData.instanceTitle,
      sessionDate: new Date().toISOString(),
      votes: sessionData.votes,
      summary: sessionData.summary,
    }

    const result = await client.create(doc)
    return result._id
  } catch (error) {
    console.error('Error saving voting session to Sanity:', error)
    return null
  }
}

// Fetch voting sessions for a specific instance
export async function getVotingSessionsForInstance(instanceId: string): Promise<any[]> {
  if (!client) {
    console.error('Sanity client not configured')
    return []
  }
  
  try {
    const query = `*[_type == "votingSession" && instanceId == $instanceId] | order(sessionDate desc) {
      _id,
      userName,
      sessionDate,
      summary,
      votes[]{
        imagePairTitle,
        selectedImage,
        timeSpent
      }
    }`

    const sessions = await client.fetch(query, { instanceId })
    return sessions || []
  } catch (error) {
    console.error('Error fetching voting sessions from Sanity:', error)
    return []
  }
} 