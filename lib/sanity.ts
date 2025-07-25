import { createClient } from 'next-sanity'
import imageUrlBuilder from '@sanity/image-url'
import { apiVersion, dataset, projectId } from '../sanity/env'

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false, // Set to false for fresh data
})

const builder = imageUrlBuilder(client)

export function urlFor(source: any) {
  return builder.image(source)
}

export interface ImageEntry {
  id: string
  title: string
  description?: string
  imageUrl: string
  category?: string
  tags?: string[]
}

export async function getAllImages(): Promise<ImageEntry[]> {
  try {
    const query = `*[_type == "imageVoting"] {
      _id,
      title,
      description,
      "imageUrl": image.asset->url,
      category,
      tags
    } | order(_createdAt desc)`

    const images = await client.fetch(query)
    
    return images.map((image: any) => ({
      id: image._id,
      title: image.title || '',
      description: image.description || '',
      imageUrl: image.imageUrl || '',
      category: image.category || '',
      tags: image.tags || [],
    }))
  } catch (error) {
    console.error('Error fetching images from Sanity:', error)
    return []
  }
}

export async function getImagesByCategory(category: string): Promise<ImageEntry[]> {
  try {
    const query = `*[_type == "imageVoting" && category == $category] {
      _id,
      title,
      description,
      "imageUrl": image.asset->url,
      category,
      tags
    } | order(_createdAt desc)`

    const images = await client.fetch(query, { category })
    
    return images.map((image: any) => ({
      id: image._id,
      title: image.title || '',
      description: image.description || '',
      imageUrl: image.imageUrl || '',
      category: image.category || '',
      tags: image.tags || [],
    }))
  } catch (error) {
    console.error('Error fetching images by category from Sanity:', error)
    return []
  }
}

export async function getImageById(id: string): Promise<ImageEntry | null> {
  try {
    const query = `*[_type == "imageVoting" && _id == $id][0] {
      _id,
      title,
      description,
      "imageUrl": image.asset->url,
      category,
      tags
    }`

    const image = await client.fetch(query, { id })
    
    if (!image) return null

    return {
      id: image._id,
      title: image.title || '',
      description: image.description || '',
      imageUrl: image.imageUrl || '',
      category: image.category || '',
      tags: image.tags || [],
    }
  } catch (error) {
    console.error('Error fetching image by ID from Sanity:', error)
    return null
  }
} 