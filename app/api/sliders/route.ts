import { NextRequest, NextResponse } from 'next/server'
import { getAllSliders, getSliderBySlug } from '@/lib/sanity'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')

    if (slug) {
      // Get specific slider by slug
      const slider = await getSliderBySlug(slug)
      if (!slider) {
        return NextResponse.json({ error: 'Slider not found' }, { status: 404 })
      }
      return NextResponse.json(slider)
    } else {
      // Get all sliders
      const sliders = await getAllSliders()
      return NextResponse.json(sliders)
    }
  } catch (error) {
    console.error('Error in sliders API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
