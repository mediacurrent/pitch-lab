import { ImageVoting } from '@/components/ImageVoting'
import { getInstanceBySlug } from '@/lib/sanity'
import { notFound } from 'next/navigation'

// Force dynamic rendering to avoid build-time Sanity client creation
export const dynamic = 'force-dynamic'

interface InstancePageProps {
  params: {
    slug: string
  }
}

export default async function InstancePage({ params }: InstancePageProps) {
  try {
    const instance = await getInstanceBySlug(params.slug)

    if (!instance) {
      notFound()
    }

    // Convert ImagePairEntry[] to the format expected by ImageVoting
    const images = instance.imagePairs.map((pair, index) => ({
      id: `pair-${index}`,
      title: pair.title,
      imageUrl1: pair.imageUrl1,
      imageUrl2: pair.imageUrl2,
      status: 'active',
      metadata: {
        altText1: pair.altText1,
        altText2: pair.altText2,
      }
    }))

    return (
      <div className="size-full">
        <ImageVoting 
          images={images} 
          timerLength={instance.timerLength}
          instanceTitle={instance.title}
          instanceDescription={instance.description}
          instanceId={instance.id}
        />
      </div>
    )
  } catch (error) {
    console.error('Error loading instance:', error)
    throw error
  }
}
