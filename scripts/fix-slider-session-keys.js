const { createClient } = require('@sanity/client')

// Create a client with write permissions
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'z4rfh7pa',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2025-07-25',
  token: process.env.SANITY_API_TOKEN, // Make sure this has write permissions
  useCdn: false,
})

async function fixSliderSessionKeys() {
  try {
    console.log('🔍 Fetching all slider sessions...')
    
    // Fetch all slider sessions
    const sessions = await client.fetch(`
      *[_type == "sliderSession"] {
        _id,
        sessionId,
        votes
      }
    `)
    
    console.log(`📊 Found ${sessions.length} slider sessions`)
    
    for (const session of sessions) {
      console.log(`\n🔧 Processing session: "${session.sessionId}"`)
      
      if (!session.votes || session.votes.length === 0) {
        console.log('  ⏭️  No votes to fix')
        continue
      }
      
      let needsUpdate = false
      const updatedVotes = session.votes.map((vote, index) => {
        if (!vote._key) {
          console.log(`  🔑 Adding key to vote ${index + 1}: "${vote.pairTitle}"`)
          needsUpdate = true
          return {
            ...vote,
            _key: `vote_${index}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          }
        }
        return vote
      })
      
      if (needsUpdate) {
        console.log(`  💾 Updating session with ${updatedVotes.length} votes`)
        await client
          .patch(session._id)
          .set({ votes: updatedVotes })
          .commit()
        console.log('  ✅ Updated successfully')
      } else {
        console.log('  ✅ All votes already have keys')
      }
    }
    
    console.log('\n🎉 Finished fixing slider session keys!')
    
  } catch (error) {
    console.error('❌ Error fixing slider session keys:', error)
  }
}

// Run the script
fixSliderSessionKeys()
