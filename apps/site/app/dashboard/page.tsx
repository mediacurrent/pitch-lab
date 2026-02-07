import Link from 'next/link'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { Feature222, type CardData } from '@/components/feature222'
import { LogoutButton } from '@/components/logout-button'

const CMS_URL = process.env.CMS_URL || 'http://localhost:3001'
const IMAGE_CHOICE_URL =
  process.env.NEXT_PUBLIC_IMAGE_CHOICE_URL || 'http://localhost:3002'
const CONTENT_RANK_URL =
  process.env.NEXT_PUBLIC_CONTENT_RANK_URL || 'http://localhost:3003'
const DEFAULT_CARD_BACKGROUND =
  'https://deifkwefumgah.cloudfront.net/shadcnblocks/block/photos/simone-hutsch-5oYbG-sEImY-unsplash.jpg'
const CONTENT_RANK_BACKGROUND =
  'https://deifkwefumgah.cloudfront.net/shadcnblocks/block/photos/simone-hutsch-o9F8dRoSucM-unsplash.jpg'

type AssignedAssessment = {
  id: string
  title?: string | null
  description?: string | null
}

type ContentRankInstance = {
  id: string
  title?: string | null
  accessToken?: string | null
}

function toImageChoiceCard(assessment: AssignedAssessment): CardData {
  const id = typeof assessment === 'string' ? assessment : assessment.id
  const title = typeof assessment === 'string' ? 'Assessment' : (assessment.title || 'Image choice')
  const description =
    typeof assessment === 'string' ? '' : (assessment.description || 'Time-based selection between two images')
  return {
    title,
    link: `${IMAGE_CHOICE_URL}?assessment=${id}`,
    background: DEFAULT_CARD_BACKGROUND,
    stats: [{ number: 'A/B', text: description || 'Time-based selection between two images' }],
  }
}

function toContentRankCard(instance: ContentRankInstance): CardData {
  const id = typeof instance === 'string' ? instance : instance.id
  const title = typeof instance === 'string' ? 'Content rank' : (instance.title || 'Content rank')
  const token = typeof instance === 'object' && instance.accessToken ? instance.accessToken : ''
  const link = token ? `${CONTENT_RANK_URL}?id=${id}&token=${encodeURIComponent(token)}` : `${CONTENT_RANK_URL}?id=${id}`
  return {
    title,
    link,
    background: CONTENT_RANK_BACKGROUND,
    stats: [{ number: 'Rank', text: 'Rank pages from ScreamingFrog + GA4: move, lost, reuse' }],
  }
}

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('payload-token')?.value
  if (!token) {
    redirect('/login')
  }

  const res = await fetch(`${CMS_URL}/api/users/me?depth=1`, {
    headers: { Authorization: `JWT ${token}` },
    next: { revalidate: 0 },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    redirect('/login')
  }

  const user = data.user as { assignedApplications?: (string | AssignedAssessment)[] | null }
  const assigned = user?.assignedApplications ?? []

  const contentRankRes = await fetch(
    `${CMS_URL}/api/content-rank?where[isActive][equals]=true&limit=100&depth=0&select[id]=true&select[title]=true&select[accessToken]=true`,
    { headers: { Authorization: `JWT ${token}` }, next: { revalidate: 0 } },
  )
  const contentRankData = await contentRankRes.json().catch(() => ({ docs: [] }))
  const contentRanks = (contentRankData.docs ?? []) as ContentRankInstance[]

  const imageChoiceCards = assigned
    .filter((a): a is AssignedAssessment => !!a)
    .map(toImageChoiceCard)
  const contentRankCards = contentRanks.map(toContentRankCard)
  const cards: CardData[] = [...imageChoiceCards, ...contentRankCards]

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="text-lg font-semibold text-slate-900">
            Site
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-slate-700 hover:text-slate-900"
            >
              Dashboard
            </Link>
            <LogoutButton />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-slate-600">Choose an application to open.</p>
        {cards.length > 0 ? (
          <Feature222 cards={cards} className="py-10" />
        ) : (
          <p className="mt-8 rounded-lg border border-slate-200 bg-white px-4 py-6 text-slate-600">
            No applications assigned to you yet. Contact your administrator to get access.
          </p>
        )}
      </main>
    </div>
  )
}
