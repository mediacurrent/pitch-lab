import { notFound } from 'next/navigation'
import { getSliderBySlug } from '@/lib/sanity'
import SliderAssessment from '@/components/SliderAssessment'
import Image from 'next/image'

interface SliderPageProps {
  params: {
    slug: string
  }
}

export default async function SliderPage({ params }: SliderPageProps) {
  const slider = await getSliderBySlug(params.slug)

  if (!slider) {
    notFound()
  }

  return (
    <div className="container mx-auto py-8">
      {/* Logo and Header */}
      <div className="flex items-center justify-center mb-8">
        <Image 
          src="/logo.svg" 
          alt="PitchLab Logo" 
          width={120} 
          height={40}
          className="mb-4"
        />
      </div>
      
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-center">{slider.title}</h1>
        {slider.description && (
          <p className="text-muted-foreground text-lg text-center">{slider.description}</p>
        )}
      </div>

      <SliderAssessment slider={slider} />
    </div>
  )
}
