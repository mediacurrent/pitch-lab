import { notFound } from 'next/navigation'
import { getSwiperBySlug } from '@/lib/sanity'
import SwiperAssessment from '@/components/SwiperAssessment'

export const dynamic = 'force-dynamic'

interface SwiperInstancePageProps {
  params: {
    slug: string
  }
}

export default async function SwiperInstancePage({ params }: SwiperInstancePageProps) {
  const swiperInstance = await getSwiperBySlug(params.slug)

  if (!swiperInstance) {
    notFound()
  }

  return <SwiperAssessment swiperInstance={swiperInstance} />
}
