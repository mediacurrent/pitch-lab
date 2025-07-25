import { NextResponse } from 'next/server'
import { getAllImages } from '@/lib/sanity'

export async function GET() {
  try {
    const images = await getAllImages()
    return NextResponse.json({ images })
  } catch (error) {
    console.error('Error fetching images:', error)
    return NextResponse.json(
      { error: 'Failed to fetch images from Sanity' },
      { status: 500 }
    )
  }
} 