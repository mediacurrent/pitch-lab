import type { MigrationRecommendation } from './parseMigrationCSV'

export type { MigrationRecommendation }

export const REC_COLORS: Record<MigrationRecommendation, string> = {
  MIGRATE: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  ADAPT: 'bg-amber-100 text-amber-800 border-amber-200',
  'LEAVE BEHIND': 'bg-rose-100 text-rose-800 border-rose-200',
  'FLAG FOR REVIEW': 'bg-blue-100 text-blue-800 border-blue-200',
  'STALE CONTENT': 'bg-zinc-100 text-zinc-800 border-zinc-300',
}

export const REC_LABELS: Record<MigrationRecommendation, string> = {
  MIGRATE: 'Migrate',
  ADAPT: 'Adapt',
  'LEAVE BEHIND': 'Leave behind',
  'FLAG FOR REVIEW': 'Flag for review',
  'STALE CONTENT': 'Stale content',
}

export const REC_OPTIONS: MigrationRecommendation[] = [
  'MIGRATE',
  'ADAPT',
  'FLAG FOR REVIEW',
  'LEAVE BEHIND',
  'STALE CONTENT',
]
