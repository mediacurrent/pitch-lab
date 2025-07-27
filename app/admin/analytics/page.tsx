import { getAllInstances } from '@/lib/sanity'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart3, TrendingUp, Clock, Target } from 'lucide-react'

// Force dynamic rendering to avoid build-time Sanity client creation
export const dynamic = 'force-dynamic'

// Function to fetch all voting sessions with image data
async function getAllVotingSessions() {
  const { createClient } = await import('@sanity/client')
  
  const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '',
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    apiVersion: '2025-07-25',
    useCdn: false,
  })

  try {
    const query = `*[_type == "votingSession"] {
      _id,
      userName,
      instanceId,
      instanceTitle,
      sessionDate,
      votes[]{
        imagePairTitle,
        imageUrl1,
        imageUrl2,
        selectedImage,
        timeSpent
      }
    }`

    const sessions = await client.fetch(query)
    return sessions || []
  } catch (error) {
    console.error('Error fetching voting sessions:', error)
    return []
  }
}

export default async function AnalyticsPage() {
  const sessions = await getAllVotingSessions()
  
  // Analyze image voting patterns
  const imageStats = new Map()
  
  sessions.forEach((session: any) => {
    session.votes?.forEach((vote: any) => {
      const image1Key = vote.imageUrl1
      const image2Key = vote.imageUrl2
      
      // Initialize stats for image 1
      if (!imageStats.has(image1Key)) {
        imageStats.set(image1Key, {
          url: vote.imageUrl1,
          title: vote.imagePairTitle,
          wins: 0,
          losses: 0,
          totalAppearances: 0,
          avgTimeSpent: 0,
          timeSpentTotal: 0,
          timeSpentCount: 0
        })
      }
      
      // Initialize stats for image 2
      if (!imageStats.has(image2Key)) {
        imageStats.set(image2Key, {
          url: vote.imageUrl2,
          title: vote.imagePairTitle,
          wins: 0,
          losses: 0,
          totalAppearances: 0,
          avgTimeSpent: 0,
          timeSpentTotal: 0,
          timeSpentCount: 0
        })
      }
      
      const image1Stats = imageStats.get(image1Key)
      const image2Stats = imageStats.get(image2Key)
      
      // Increment appearances
      image1Stats.totalAppearances++
      image2Stats.totalAppearances++
      
      // Track wins/losses
      if (vote.selectedImage === 'left') {
        image1Stats.wins++
        image2Stats.losses++
      } else if (vote.selectedImage === 'right') {
        image2Stats.wins++
        image1Stats.losses++
      }
      
      // Track time spent
      if (vote.timeSpent) {
        image1Stats.timeSpentTotal += vote.timeSpent
        image1Stats.timeSpentCount++
        image2Stats.timeSpentTotal += vote.timeSpent
        image2Stats.timeSpentCount++
      }
    })
  })
  
  // Calculate averages and convert to array
  const imageStatsArray = Array.from(imageStats.values()).map(stats => ({
    ...stats,
    winRate: stats.totalAppearances > 0 ? (stats.wins / stats.totalAppearances * 100).toFixed(1) : 0,
    avgTimeSpent: stats.timeSpentCount > 0 ? (stats.timeSpentTotal / stats.timeSpentCount).toFixed(1) : 0
  }))
  
  // Sort by win rate
  imageStatsArray.sort((a, b) => parseFloat(b.winRate) - parseFloat(a.winRate))
  
  // Overall stats
  const totalVotes = sessions.reduce((sum: number, session: any) => sum + (session.votes?.length || 0), 0)
  const totalSessions = sessions.length
  const uniqueImages = imageStats.size
  const avgWinRate = imageStatsArray.length > 0 
    ? (imageStatsArray.reduce((sum, img) => sum + parseFloat(img.winRate), 0) / imageStatsArray.length).toFixed(1)
    : 0

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Image Analytics</h1>
        <p className="text-muted-foreground">
          Detailed insights into image voting patterns and performance
        </p>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-6">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Votes</p>
              <p className="text-2xl font-bold">{totalVotes}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Unique Images</p>
              <p className="text-2xl font-bold">{uniqueImages}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avg Win Rate</p>
              <p className="text-2xl font-bold">{avgWinRate}%</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-orange-600" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Sessions</p>
              <p className="text-2xl font-bold">{totalSessions}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Image Performance */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Image Performance</h2>
        
        {imageStatsArray.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No image data available yet.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Image analytics will appear here once users complete voting sessions.
            </p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {imageStatsArray.slice(0, 20).map((image, index) => (
              <Card key={image.url} className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <img 
                      src={image.url} 
                      alt={image.title}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-semibold">{image.title}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-sm">
                      <div>
                        <span className="font-medium">Win Rate:</span> {image.winRate}%
                      </div>
                      <div>
                        <span className="font-medium">Wins:</span> {image.wins}/{image.totalAppearances}
                      </div>
                      <div>
                        <span className="font-medium">Appearances:</span> {image.totalAppearances}
                      </div>
                      <div>
                        <span className="font-medium">Avg Time:</span> {image.avgTimeSpent}s
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0">
                    <Badge variant={parseFloat(image.winRate) > 50 ? "default" : "secondary"}>
                      #{index + 1}
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 