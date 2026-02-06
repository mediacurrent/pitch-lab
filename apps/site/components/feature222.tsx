'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { cn } from '@repo/ui'

export type Stat = {
  number: string
  text: string
}

export interface CardData {
  title: string
  link: string
  background: string
  stats: Stat[]
}

const Card = ({ link, background, title, stats }: CardData) => {
  return (
    <Link
      href={link}
      style={{ backgroundImage: `url(${background})` }}
      className="before:content-[] relative min-h-auto w-full overflow-hidden rounded-[.5rem] bg-black/80 bg-cover bg-center bg-no-repeat p-5 transition-all duration-300 before:absolute before:top-0 before:left-0 before:z-10 before:block before:size-full before:bg-black/50 before:transition-all before:duration-300 hover:before:bg-black/30 sm:aspect-square md:aspect-auto md:min-h-[30rem] md:max-w-[30rem]"
    >
      <div className="relative z-20 flex size-full flex-col justify-between gap-20 md:gap-16">
        <div className="text-2xl leading-[1.2] font-normal text-white md:text-3xl">
          {title}
        </div>
        <div className="flex w-full flex-col gap-8">
          <div className="flex gap-8 text-white">
            {stats.map((item, i) => (
              <div key={`${title}-${i}`} className="flex flex-col gap-1">
                <div className="text-[1.15rem] md:text-xl">{item.number}</div>
                <div className="text-sm opacity-80">{item.text}</div>
              </div>
            ))}
          </div>
          <span className="inline-flex h-9 w-fit items-center justify-center gap-2 rounded-md border border-white px-3 text-sm font-medium text-white transition-colors hover:bg-white/10">
            Open app
            <ArrowRight className="size-3.5" />
          </span>
        </div>
      </div>
    </Link>
  )
}

interface Feature222Props {
  cards: CardData[]
  className?: string
}

const Feature222 = ({ cards, className }: Feature222Props) => {
  return (
    <section className={cn('py-32', className)}>
      <div className="container mx-auto max-w-6xl px-4">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((item, i) => (
            <Card key={`feature-222-${i}`} {...item} />
          ))}
        </div>
      </div>
    </section>
  )
}

export { Feature222 }
