import { AppShowcase } from "@/components/AppShowcase"
import { getAllInstances, getAllSliders, getAllSwipers } from '@/lib/sanity'

// Force dynamic rendering to avoid build-time Sanity client creation
export const dynamic = 'force-dynamic'

export default async function Home() {
  const [instances, sliders, swipers] = await Promise.all([
    getAllInstances(),
    getAllSliders(),
    getAllSwipers()
  ])

  return <AppShowcase instances={instances} sliders={sliders} swipers={swipers} />
} 