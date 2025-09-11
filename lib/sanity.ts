import { createClient } from 'next-sanity'
import imageUrlBuilder from '@sanity/image-url'
import { apiVersion, dataset, projectId } from '../sanity/env'

// Create read-only client for fetching data
export const client = typeof projectId === 'string' && projectId.length > 0 
  ? createClient({
      projectId,
      dataset,
      apiVersion,
      useCdn: false, // Set to false for fresh data
      perspective: 'published', // Only get published content
    })
  : null

// Create write client for creating/updating data
export const writeClient = typeof projectId === 'string' && projectId.length > 0 
  ? createClient({
      projectId,
      dataset,
      apiVersion,
      useCdn: false,
      token: process.env.SANITY_API_TOKEN, // Token with write permissions
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





// New interfaces for Pitch Lab instances
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

// New interfaces for Slider instances
export interface SliderPairEntry {
  title: string
  leftSide: string
  rightSide: string
}

export interface SliderInstance {
  id: string
  title: string
  description?: string
  slug: string
  isActive: boolean
  createdBy: string
  sliderPairs: SliderPairEntry[]
}

// New interfaces for Swiper instances
export interface WebsiteEntry {
  id: number
  name: string
  description: string
  cms: string
  dept: string
  category: string
  order: number
}

export interface SwiperInstance {
  id: string
  title: string
  description?: string
  slug: string
  isActive: boolean
  createdBy: string
  websites: WebsiteEntry[]
}

// Fetch all active Pitch Lab
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

// Fetch a specific Pitch Lab by slug
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
  if (!writeClient) {
    console.error('Sanity write client not configured')
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

    const result = await writeClient.create(doc)
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

// Fetch all active Sliders
export async function getAllSliders(): Promise<SliderInstance[]> {
  if (!client) {
    console.error('Sanity client not configured')
    return []
  }
  
  try {
    const query = `*[_type == "sliderInstance" && isActive == true] {
      _id,
      title,
      description,
      "slug": slug.current,
      isActive,
      createdBy,
      sliderPairs[]{
        title,
        leftSide,
        rightSide
      }
    } | order(_createdAt desc)`

    const sliders = await client.fetch(query)
    
    return sliders.map((slider: any) => ({
      id: slider._id,
      title: slider.title || '',
      description: slider.description || '',
      slug: slider.slug || '',
      isActive: slider.isActive || false,
      createdBy: slider.createdBy || 'Unknown',
      sliderPairs: (slider.sliderPairs || []).map((pair: any) => ({
        title: pair.title || '',
        leftSide: pair.leftSide || '',
        rightSide: pair.rightSide || '',
      })),
    }))
  } catch (error) {
    console.error('Error fetching sliders from Sanity:', error)
    return []
  }
}

// Fetch a specific Slider by slug
export async function getSliderBySlug(slug: string): Promise<SliderInstance | null> {
  if (!client) {
    console.error('Sanity client not configured')
    return null
  }
  
  try {
    const query = `*[_type == "sliderInstance" && slug.current == $slug && isActive == true][0] {
      _id,
      title,
      description,
      "slug": slug.current,
      isActive,
      createdBy,
      sliderPairs[]{
        title,
        leftSide,
        rightSide
      }
    }`

    const slider = await client.fetch(query, { slug })

    if (!slider) return null

    return {
      id: slider._id,
      title: slider.title || '',
      description: slider.description || '',
      slug: slider.slug || '',
      isActive: slider.isActive || false,
      createdBy: slider.createdBy || 'Unknown',
      sliderPairs: (slider.sliderPairs || []).map((pair: any) => ({
        title: pair.title || '',
        leftSide: pair.leftSide || '',
        rightSide: pair.rightSide || '',
      })),
    }
  } catch (error) {
    console.error('Error fetching slider by slug from Sanity:', error)
    return null
  }
}

// Interface for slider session data
export interface SliderSessionData {
  sessionId: string
  sliderId: string
  sliderTitle: string
  votes: {
    pairTitle: string
    leftSide: string
    rightSide: string
    selectedSide: 'left' | 'right'
    timeSpent: number
  }[]
  summary: {
    totalVotes: number
    leftVotes: number
    rightVotes: number
    averageTimePerVote: number
  }
}

// Save a slider session to Sanity
export async function saveSliderSession(sessionData: SliderSessionData): Promise<string | null> {
  console.log('🔍 saveSliderSession called')
  console.log('🔍 writeClient exists:', !!writeClient)
  console.log('🔍 SANITY_API_TOKEN exists:', !!process.env.SANITY_API_TOKEN)
  console.log('🔍 Token length:', process.env.SANITY_API_TOKEN?.length || 0)
  
  if (!writeClient) {
    console.error('❌ Sanity write client not configured')
    console.error('❌ writeClient is null')
    return null
  }
  
  try {
    const doc = {
      _type: 'sliderSession',
      sessionId: sessionData.sessionId,
      sliderInstance: {
        _type: 'reference',
        _ref: sessionData.sliderId,
      },
      startTime: new Date().toISOString(),
      status: 'completed',
      votes: sessionData.votes.map((vote, index) => ({
        _key: `vote_${index}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        pairTitle: vote.pairTitle,
        leftSide: vote.leftSide,
        rightSide: vote.rightSide,
        selectedSide: vote.selectedSide,
        timestamp: new Date().toISOString(),
        timeSpent: vote.timeSpent,
      })),
      metadata: {
        totalPairs: sessionData.votes.length,
        completedPairs: sessionData.votes.length,
      },
    }

    console.log('🔍 Attempting to create document with writeClient')
    const result = await writeClient.create(doc)
    console.log('✅ Document created successfully:', result._id)
    return result._id
  } catch (error) {
    console.error('❌ Error saving slider session to Sanity:', error)
    return null
  }
}

// Fetch slider sessions for a specific slider
export async function getSliderSessionsForInstance(sliderId: string): Promise<any[]> {
  if (!client) {
    console.error('Sanity client not configured')
    return []
  }
  
  try {
    const query = `*[_type == "sliderSession" && sliderInstance._ref == $sliderId] | order(startTime desc) {
      _id,
      sessionId,
      startTime,
      status,
      votes[]{
        pairTitle,
        selectedSide,
        timeSpent
      },
      metadata
    }`

    const sessions = await client.fetch(query, { sliderId })
    return sessions || []
  } catch (error) {
    console.error('Error fetching slider sessions from Sanity:', error)
    return []
  }
}

// Fetch all active Swipers
export async function getAllSwipers(): Promise<SwiperInstance[]> {
  if (!client) {
    console.error('Sanity client not configured')
    return []
  }
  
  try {
    const query = `*[_type == "swiperInstance" && isActive == true] {
      _id,
      title,
      description,
      "slug": slug.current,
      isActive,
      createdBy,
      websites[]{
        id,
        name,
        description,
        cms,
        dept,
        category,
        order
      }
    } | order(_createdAt desc)`

    const swipers = await client.fetch(query)
    
    return swipers.map((swiper: any) => ({
      id: swiper._id,
      title: swiper.title || '',
      description: swiper.description || '',
      slug: swiper.slug || '',
      isActive: swiper.isActive || false,
      createdBy: swiper.createdBy || 'Unknown',
      websites: (swiper.websites || []).map((website: any) => ({
        id: website.id || 0,
        name: website.name || '',
        description: website.description || '',
        cms: website.cms || '',
        dept: website.dept || '',
        category: website.category || '',
        order: website.order || 0,
      })).sort((a: any, b: any) => a.order - b.order),
    }))
  } catch (error) {
    console.error('Error fetching swipers from Sanity:', error)
    return []
  }
}

// Fetch a specific Swiper by slug
export async function getSwiperBySlug(slug: string): Promise<SwiperInstance | null> {
  if (!client) {
    console.error('Sanity client not configured')
    return null
  }
  
  try {
    const query = `*[_type == "swiperInstance" && slug.current == $slug && isActive == true][0] {
      _id,
      title,
      description,
      "slug": slug.current,
      isActive,
      createdBy,
      websites[]{
        id,
        name,
        description,
        cms,
        dept,
        category,
        order
      }
    }`

    const swiper = await client.fetch(query, { slug })

    if (!swiper) return null

    return {
      id: swiper._id,
      title: swiper.title || '',
      description: swiper.description || '',
      slug: swiper.slug || '',
      isActive: swiper.isActive || false,
      createdBy: swiper.createdBy || 'Unknown',
      websites: (swiper.websites || []).map((website: any) => ({
        id: website.id || 0,
        name: website.name || '',
        description: website.description || '',
        cms: website.cms || '',
        dept: website.dept || '',
        category: website.category || '',
        order: website.order || 0,
      })).sort((a: any, b: any) => a.order - b.order),
    }
  } catch (error) {
    console.error('Error fetching swiper by slug from Sanity:', error)
    return null
  }
}

// Interface for swiper session data
export interface SwiperSessionData {
  sessionId: string
  swiperId: string
  swiperTitle: string
  keptWebsites: string[]
  killedWebsites: string[]
  skippedWebsites: string[]
  totalTime: number
  userAgent: string
}

// Save a swiper session to Sanity
export async function saveSwiperSession(sessionData: SwiperSessionData): Promise<string | null> {
  if (!writeClient) {
    console.error('Sanity write client not configured')
    return null
  }
  
  try {
    const doc = {
      _type: 'swiperSession',
      sessionId: sessionData.sessionId,
      swiperInstance: {
        _type: 'reference',
        _ref: sessionData.swiperId,
      },
      keptWebsites: sessionData.keptWebsites,
      killedWebsites: sessionData.killedWebsites,
      skippedWebsites: sessionData.skippedWebsites,
      totalTime: sessionData.totalTime,
      userAgent: sessionData.userAgent,
      timestamp: new Date().toISOString(),
    }

    const result = await writeClient.create(doc)
    return result._id
  } catch (error) {
    console.error('Error saving swiper session to Sanity:', error)
    return null
  }
}

// Fetch swiper sessions for a specific swiper
export async function getSwiperSessionsForInstance(swiperId: string): Promise<any[]> {
  if (!client) {
    console.error('Sanity client not configured')
    return []
  }
  
  try {
    const query = `*[_type == "swiperSession" && swiperInstance._ref == $swiperId] | order(timestamp desc) {
      _id,
      sessionId,
      timestamp,
      keptWebsites,
      killedWebsites,
      skippedWebsites,
      totalTime,
      userAgent
    }`

    const sessions = await client.fetch(query, { swiperId })
    return sessions || []
  } catch (error) {
    console.error('Error fetching swiper sessions from Sanity:', error)
    return []
  }
} 