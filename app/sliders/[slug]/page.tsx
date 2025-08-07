import { notFound } from 'next/navigation'
import { getSliderBySlug } from '@/lib/sanity'
import SliderAssessment from '@/components/SliderAssessment'

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
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">{slider.title}</h1>
        {slider.description && (
          <p className="text-muted-foreground text-lg">{slider.description}</p>
        )}
      </div>

      <SliderAssessment slider={slider} />
    </div>
  )
}
