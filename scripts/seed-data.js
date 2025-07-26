#!/usr/bin/env node

/**
 * Seed script for Sanity CMS
 * This script helps you add sample data to your Sanity project
 * Run with: node scripts/seed-data.js
 */

const { createClient } = require('@sanity/client')

// Configuration - update these with your actual values
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'demo-project-id',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_TOKEN, // You'll need to create a token in Sanity
  useCdn: false,
})

const sampleCategories = [
  {
    _type: 'category',
    name: 'Nature',
    slug: { _type: 'slug', current: 'nature' },
    description: 'Beautiful landscapes and natural wonders',
    icon: '🌿',
    color: '#4ade80',
    active: true,
    sortOrder: 1,
  },
  {
    _type: 'category',
    name: 'Architecture',
    slug: { _type: 'slug', current: 'architecture' },
    description: 'Stunning buildings and structures',
    icon: '🏛️',
    color: '#3b82f6',
    active: true,
    sortOrder: 2,
  },
  {
    _type: 'category',
    name: 'Food',
    slug: { _type: 'slug', current: 'food' },
    description: 'Delicious culinary creations',
    icon: '🍕',
    color: '#f59e0b',
    active: true,
    sortOrder: 3,
  },
  {
    _type: 'category',
    name: 'Travel',
    slug: { _type: 'slug', current: 'travel' },
    description: 'Amazing destinations around the world',
    icon: '✈️',
    color: '#8b5cf6',
    active: true,
    sortOrder: 4,
  },
]

const sampleImages = [
  {
    _type: 'imageVoting',
    title: 'Mountain Lake',
    description: 'A serene mountain lake reflecting the sky',
    category: 'nature',
    status: 'active',
    featured: true,
    difficulty: 'easy',
    tags: ['mountains', 'water', 'reflection'],
    metadata: {
      altText: 'A beautiful mountain lake with clear water reflecting the sky',
      credit: 'Nature Photography',
      location: 'Swiss Alps',
    },
  },
  {
    _type: 'imageVoting',
    title: 'Modern Skyscraper',
    description: 'A sleek modern building reaching for the clouds',
    category: 'architecture',
    status: 'active',
    featured: false,
    difficulty: 'medium',
    tags: ['modern', 'urban', 'glass'],
    metadata: {
      altText: 'A tall modern skyscraper with glass facade',
      credit: 'Urban Photography',
      location: 'New York City',
    },
  },
  {
    _type: 'imageVoting',
    title: 'Artisan Pizza',
    description: 'A perfectly crafted pizza with fresh ingredients',
    category: 'food',
    status: 'active',
    featured: true,
    difficulty: 'easy',
    tags: ['pizza', 'fresh', 'artisan'],
    metadata: {
      altText: 'A delicious artisan pizza with fresh toppings',
      credit: 'Food Photography',
      location: 'Italy',
    },
  },
  {
    _type: 'imageVoting',
    title: 'Tropical Beach',
    description: 'Pristine white sand and crystal clear water',
    category: 'travel',
    status: 'active',
    featured: false,
    difficulty: 'medium',
    tags: ['beach', 'tropical', 'paradise'],
    metadata: {
      altText: 'A beautiful tropical beach with white sand and blue water',
      credit: 'Travel Photography',
      location: 'Maldives',
    },
  },
]

async function seedData() {
  console.log('🌱 Starting to seed Sanity with sample data...')
  
  try {
    // Check if we have a token
    if (!process.env.SANITY_TOKEN) {
      console.log('⚠️  No SANITY_TOKEN found. Please create a token in your Sanity project:')
      console.log('   1. Go to https://www.sanity.io/manage')
      console.log('   2. Select your project')
      console.log('   3. Go to API section')
      console.log('   4. Create a new token with write permissions')
      console.log('   5. Add it to your .env.local file as SANITY_TOKEN=your_token_here')
      console.log('')
      console.log('   Then run this script again.')
      return
    }

    // Add categories
    console.log('📁 Adding sample categories...')
    for (const category of sampleCategories) {
      try {
        await client.create(category)
        console.log(`   ✅ Added category: ${category.name}`)
      } catch (error) {
        if (error.message.includes('duplicate')) {
          console.log(`   ⚠️  Category already exists: ${category.name}`)
        } else {
          console.log(`   ❌ Error adding category ${category.name}:`, error.message)
        }
      }
    }

    // Add images (without actual image assets for now)
    console.log('🖼️  Adding sample images...')
    for (const image of sampleImages) {
      try {
        await client.create(image)
        console.log(`   ✅ Added image: ${image.title}`)
      } catch (error) {
        if (error.message.includes('duplicate')) {
          console.log(`   ⚠️  Image already exists: ${image.title}`)
        } else {
          console.log(`   ❌ Error adding image ${image.title}:`, error.message)
        }
      }
    }

    console.log('')
    console.log('🎉 Seeding completed!')
    console.log('')
    console.log('Next steps:')
    console.log('1. Visit http://localhost:3333 to access Sanity Studio')
    console.log('2. Add actual images to your image documents')
    console.log('3. Visit http://localhost:3000/admin to see your admin dashboard')
    console.log('4. Visit http://localhost:3000 to test the voting app')

  } catch (error) {
    console.error('❌ Error during seeding:', error)
  }
}

// Run the seed function
seedData() 