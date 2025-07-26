import { ImageVoting } from '@/components/ImageVoting'
import { getAllImages, type ImageEntry } from '@/lib/sanity'

export default async function Home() {
  // Fetch images from CMS
  let images: ImageEntry[] = []
  try {
    images = await getAllImages()
    console.log('Fetched images from Sanity:', images.length)
    console.log('Image titles:', images.map(img => img.title))
  } catch (error) {
    console.log('Sanity not configured, using sample images')
  }
  
  return (
    <div className="size-full">
      <ImageVoting images={images} />
    </div>
  )
} 