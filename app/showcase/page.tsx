import { AppShowcase } from "@/components/AppShowcase"
import { getAllInstances, getAllSliders } from '@/lib/sanity'

// Force dynamic rendering to avoid build-time Sanity client creation
export const dynamic = 'force-dynamic'
// Trigger rebuild - repository updated

export default async function ShowcasePage() {
  const [instances, sliders] = await Promise.all([
    getAllInstances(),
    getAllSliders()
  ])

  return <AppShowcase instances={instances} sliders={sliders} />
}
