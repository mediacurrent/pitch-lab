const { createClient } = require('@sanity/client')

// Create a client with write permissions
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'z4rfh7pa',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2025-07-25',
  token: process.env.SANITY_API_TOKEN, // Make sure this has write permissions
  useCdn: false,
})

async function fixSliderKeys() {
  try {
    console.log('🔍 Fetching all slider instances...')
    
    // Fetch all slider instances
    const sliders = await client.fetch(`
      *[_type == "sliderInstance"] {
        _id,
        title,
        sliderPairs
      }
    `)
    
    console.log(`📊 Found ${sliders.length} slider instances`)
    
    for (const slider of sliders) {
      console.log(`\n🔧 Processing slider: "${slider.title}"`)
      
      if (!slider.sliderPairs || slider.sliderPairs.length === 0) {
        console.log('  ⏭️  No slider pairs to fix')
        continue
      }
      
      let needsUpdate = false
      const updatedPairs = slider.sliderPairs.map((pair, index) => {
        if (!pair._key) {
          console.log(`  🔑 Adding key to pair ${index + 1}: "${pair.title}"`)
          needsUpdate = true
          return {
            ...pair,
            _key: `pair-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`
          }
        }
        return pair
      })
      
      if (needsUpdate) {
        console.log(`  💾 Updating slider with ${updatedPairs.length} pairs`)
        await client
          .patch(slider._id)
          .set({ sliderPairs: updatedPairs })
          .commit()
        console.log('  ✅ Updated successfully')
      } else {
        console.log('  ✅ All pairs already have keys')
      }
    }
    
    console.log('\n🎉 Finished fixing slider keys!')
    
  } catch (error) {
    console.error('❌ Error fixing slider keys:', error)
  }
}

// Run the script
fixSliderKeys()
