import { getAllSliders, getSliderSessionsForInstance } from '@/lib/sanity'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart3, TrendingUp, Clock, Users, Filter, Target } from 'lucide-react'

// Force dynamic rendering to avoid build-time Sanity client creation
export const dynamic = 'force-dynamic'

// Function to fetch all slider sessions
async function getAllSliderSessions() {
  const { createClient } = await import('@sanity/client')
  
  const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '',
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    apiVersion: '2025-07-25',
    useCdn: false,
  })

  try {
    const query = `*[_type == "sliderSession"] {
      _id,
      sessionId,
      sliderInstance,
      sliderTitle,
      startTime,
      votes[]{
        pairTitle,
        leftSide,
        rightSide,
        selectedSide,
        timeSpent
      }
    }`

    const sessions = await client.fetch(query)
    return sessions || []
  } catch (error) {
    console.error('Error fetching slider sessions:', error)
    return []
  }
}

export default async function AnalyticsPage() {
  const sessions = await getAllSliderSessions()
  
  // Analyze slider assessment patterns
  const sliderStats = new Map()
  
  sessions.forEach((session: any) => {
    session.votes?.forEach((vote: any) => {
      const pairKey = vote.pairTitle
      
      // Initialize stats for slider pair
      if (!sliderStats.has(pairKey)) {
        sliderStats.set(pairKey, {
          title: vote.pairTitle,
          leftSide: vote.leftSide,
          rightSide: vote.rightSide,
          leftVotes: 0,
          rightVotes: 0,
          totalVotes: 0,
          avgTimeSpent: 0,
          timeSpentTotal: 0,
          timeSpentCount: 0
        })
      }
      
      const pairStats = sliderStats.get(pairKey)
      
      // Increment total votes
      pairStats.totalVotes++
      
      // Track left/right preferences
      if (vote.selectedSide === 'left') {
        pairStats.leftVotes++
      } else if (vote.selectedSide === 'right') {
        pairStats.rightVotes++
      }
      
      // Track time spent
      if (vote.timeSpent) {
        pairStats.timeSpentTotal += vote.timeSpent
        pairStats.timeSpentCount++
      }
    })
  })
  
  // Calculate averages and convert to array
  const sliderStatsArray = Array.from(sliderStats.values()).map(stats => ({
    ...stats,
    leftPreferenceRate: stats.totalVotes > 0 ? (stats.leftVotes / stats.totalVotes * 100).toFixed(1) : 0,
    avgTimeSpent: stats.timeSpentCount > 0 ? (stats.timeSpentTotal / stats.timeSpentCount).toFixed(1) : 0
  }))
  
  // Sort by total votes
  sliderStatsArray.sort((a, b) => b.totalVotes - a.totalVotes)
  
  // Overall stats
  const totalVotes = sessions.reduce((sum: number, session: any) => sum + (session.votes?.length || 0), 0)
  const totalSessions = sessions.length
  const uniquePairs = sliderStats.size
  const avgLeftPreference = sliderStatsArray.length > 0 
    ? (sliderStatsArray.reduce((sum, pair) => sum + parseFloat(pair.leftPreferenceRate), 0) / sliderStatsArray.length).toFixed(1)
    : 0

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Slider Analytics</h1>
        <p className="text-muted-foreground">
          Detailed insights into slider assessment patterns and preferences
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
              <p className="text-sm font-medium text-muted-foreground">Unique Pairs</p>
              <p className="text-2xl font-bold">{uniquePairs}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avg Left Preference</p>
              <p className="text-2xl font-bold">{avgLeftPreference}%</p>
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

      {/* Slider Performance */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Slider Pair Performance</h2>
        
        {sliderStatsArray.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No slider data available yet.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Slider analytics will appear here once users complete assessments.
            </p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {sliderStatsArray.slice(0, 20).map((pair, index) => (
              <Card key={pair.title} className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Filter className="h-8 w-8 text-gray-400" />
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-semibold">{pair.title}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-sm">
                      <div>
                        <span className="font-medium">Left Preference:</span> {pair.leftPreferenceRate}%
                      </div>
                      <div>
                        <span className="font-medium">Left Votes:</span> {pair.leftVotes}/{pair.totalVotes}
                      </div>
                      <div>
                        <span className="font-medium">Total Votes:</span> {pair.totalVotes}
                      </div>
                      <div>
                        <span className="font-medium">Avg Time:</span> {pair.avgTimeSpent}s
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      <span className="font-medium">Left:</span> {pair.leftSide} | <span className="font-medium">Right:</span> {pair.rightSide}
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0">
                    <Badge variant={parseFloat(pair.leftPreferenceRate) > 50 ? "default" : "secondary"}>
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