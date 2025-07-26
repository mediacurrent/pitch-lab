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
  status?: string
  featured?: boolean
  difficulty?: string
  metadata?: {
    altText?: string
    credit?: string
    location?: string
  }
}

export async function getAllImages(): Promise<ImageEntry[]> {
  try {
    const query = `*[_type == "imageVoting" && status == "active"] {
      _id,
      title,
      description,
      "imageUrl": image.asset->url,
      category,
      tags,
      status,
      featured,
      difficulty,
      metadata
    } | order(featured desc, _createdAt desc)`

    const images = await client.fetch(query)
    
    return images.map((image: any) => ({
      id: image._id,
      title: image.title || '',
      description: image.description || '',
      imageUrl: image.imageUrl || '',
      category: image.category || '',
      tags: image.tags || [],
      status: image.status || 'active',
      featured: image.featured || false,
      difficulty: image.difficulty || 'medium',
      metadata: image.metadata || {},
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
      tags,
      status,
      featured,
      difficulty,
      metadata
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
      status: image.status || 'active',
      featured: image.featured || false,
      difficulty: image.difficulty || 'medium',
      metadata: image.metadata || {},
    }
  } catch (error) {
    console.error('Error fetching image by ID from Sanity:', error)
    return null
  }
}

export async function getFeaturedImages(): Promise<ImageEntry[]> {
  try {
    const query = `*[_type == "imageVoting" && status == "active" && featured == true] {
      _id,
      title,
      description,
      "imageUrl": image.asset->url,
      category,
      tags,
      status,
      featured,
      difficulty,
      metadata
    } | order(_createdAt desc)`

    const images = await client.fetch(query)
    
    return images.map((image: any) => ({
      id: image._id,
      title: image.title || '',
      description: image.description || '',
      imageUrl: image.imageUrl || '',
      category: image.category || '',
      tags: image.tags || [],
      status: image.status || 'active',
      featured: image.featured || false,
      difficulty: image.difficulty || 'medium',
      metadata: image.metadata || {},
    }))
  } catch (error) {
    console.error('Error fetching featured images from Sanity:', error)
    return []
  }
}

export async function getImagesByDifficulty(difficulty: string): Promise<ImageEntry[]> {
  try {
    const query = `*[_type == "imageVoting" && status == "active" && difficulty == $difficulty] {
      _id,
      title,
      description,
      "imageUrl": image.asset->url,
      category,
      tags,
      status,
      featured,
      difficulty,
      metadata
    } | order(_createdAt desc)`

    const images = await client.fetch(query, { difficulty })
    
    return images.map((image: any) => ({
      id: image._id,
      title: image.title || '',
      description: image.description || '',
      imageUrl: image.imageUrl || '',
      category: image.category || '',
      tags: image.tags || [],
      status: image.status || 'active',
      featured: image.featured || false,
      difficulty: image.difficulty || 'medium',
      metadata: image.metadata || {},
    }))
  } catch (error) {
    console.error('Error fetching images by difficulty from Sanity:', error)
    return []
  }
}

export async function getCategories(): Promise<{ name: string; slug: string; description?: string; icon?: string; color?: string }[]> {
  try {
    const query = `*[_type == "category" && active == true] {
      name,
      "slug": slug.current,
      description,
      icon,
      color
    } | order(sortOrder asc, name asc)`

    const categories = await client.fetch(query)
    
    return categories.map((category: any) => ({
      name: category.name || '',
      slug: category.slug || '',
      description: category.description || '',
      icon: category.icon || '',
      color: category.color || '',
    }))
  } catch (error) {
    console.error('Error fetching categories from Sanity:', error)
    return []
  }
} 