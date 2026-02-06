import Link from 'next/link'
import { Feature222, type CardData } from '@/components/feature222'

const DASHBOARD_APPS: CardData[] = [
  {
    title: 'Image choice',
    link: 'http://localhost:3002',
    background: 'https://deifkwefumgah.cloudfront.net/shadcnblocks/block/photos/simone-hutsch-5oYbG-sEImY-unsplash.jpg',
    stats: [{ number: 'A/B', text: 'Time-based selection between two images' }],
  },
  {
    title: 'Content rank',
    link: 'http://localhost:3003',
    background: 'https://deifkwefumgah.cloudfront.net/shadcnblocks/block/photos/simone-hutsch-o9F8dRoSucM-unsplash.jpg',
    stats: [{ number: 'Rank', text: 'Rank pages from ScreamingFrog + GA4 (move / lost / reuse)' }],
  },
  {
    title: 'Slider',
    link: 'http://localhost:3004',
    background: 'https://deifkwefumgah.cloudfront.net/shadcnblocks/block/photos/simone-hutsch-K1W9OjEgacI-unsplash.jpg',
    stats: [{ number: 'Compare', text: 'Slider between two ideas; records proximity to each' }],
  },
  {
    title: 'Survey',
    link: 'http://localhost:3005',
    background: 'https://deifkwefumgah.cloudfront.net/shadcnblocks/block/photos/simone-hutsch-gDmVqxZt1hg-unsplash.jpg',
    stats: [{ number: 'Q&A', text: 'Complete questions and see tabulated results' }],
  },
  {
    title: 'Fill in the blank',
    link: 'http://localhost:3006',
    background: 'https://deifkwefumgah.cloudfront.net/shadcnblocks/block/photos/simone-hutsch-sutfgh5DNIU-unsplash.jpg',
    stats: [{ number: 'Complete', text: 'Complete text boxes' }],
  },
]

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="text-lg font-semibold text-slate-900">
            Site
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm font-medium text-slate-700 hover:text-slate-900">
              Dashboard
            </Link>
            <Link href="/login" className="text-sm font-medium text-slate-700 hover:text-slate-900">
              Log out
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-slate-600">Choose an application to open.</p>
        <Feature222 cards={DASHBOARD_APPS} className="py-10" />
      </main>
    </div>
  )
}
