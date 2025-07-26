import { createClient } from 'next-sanity'
import imageUrlBuilder from '@sanity/image-url'
import { apiVersion, dataset, projectId } from '../sanity/env'

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false, // Set to false for fresh data
  perspective: 'published', // Only get published content
})

const builder = imageUrlBuilder(client)

export function urlFor(source: any) {
  return builder.image(source)
}

export interface ImageEntry {
  id: string
  title: string
  imageUrl1: string
  imageUrl2: string
  category?: {
    id: string
    name: string
    slug: string
  }
  status?: string
  metadata?: {
    altText1?: string
    altText2?: string
    credit?: string
    location?: string
  }
}

export async function getAllImages(): Promise<ImageEntry[]> {
  try {
    const query = `*[_type == "imageOption"] {
      _id,
      title,
      "imageUrl1": image1.asset->url,
      "imageUrl2": image2.asset->url,
      "category": category->{
        _id,
        name,
        slug
      },
      status,
      metadata
    } | order(_createdAt desc)`

    const images = await client.fetch(query)
    
    return images.map((image: any) => ({
      id: image._id,
      title: image.title || '',
      imageUrl1: image.imageUrl1 || '',
      imageUrl2: image.imageUrl2 || '',
      category: image.category ? {
        id: image.category._id,
        name: image.category.name,
        slug: image.category.slug
      } : undefined,
      status: image.status || 'active',
      metadata: image.metadata || {},
    }))
  } catch (error) {
    console.error('Error fetching images from Sanity:', error)
    return []
  }
}

export async function getImagesByCategory(categorySlug: string): Promise<ImageEntry[]> {
  try {
    const query = `*[_type == "imageOption" && category->slug.current == $categorySlug] {
      _id,
      title,
      "imageUrl1": image1.asset->url,
      "imageUrl2": image2.asset->url,
      "category": category->{
        _id,
        name,
        slug
      },
      status
    } | order(_createdAt desc)`

    const images = await client.fetch(query, { categorySlug })
    
    return images.map((image: any) => ({
      id: image._id,
      title: image.title || '',
      imageUrl1: image.imageUrl1 || '',
      imageUrl2: image.imageUrl2 || '',
      category: image.category ? {
        id: image.category._id,
        name: image.category.name,
        slug: image.category.slug
      } : undefined,
      status: image.status || 'active',
    }))
  } catch (error) {
    console.error('Error fetching images by category from Sanity:', error)
    return []
  }
}

export async function getImageById(id: string): Promise<ImageEntry | null> {
  try {
    const query = `*[_type == "imageOption" && _id == $id][0] {
      _id,
      title,
      "imageUrl1": image1.asset->url,
      "imageUrl2": image2.asset->url,
      "category": category->{
        _id,
        name,
        slug
      },
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
      category: image.category ? {
        id: image.category._id,
        name: image.category.name,
        slug: image.category.slug
      } : undefined,
      status: image.status || 'active',
      metadata: image.metadata || {},
    }
  } catch (error) {
    console.error('Error fetching image by ID from Sanity:', error)
    return null
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