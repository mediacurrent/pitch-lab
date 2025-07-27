import { getAllInstances } from '@/lib/sanity'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, Users, BarChart3, Calendar } from 'lucide-react'
import Link from 'next/link'

// Function to fetch all voting sessions
async function getAllVotingSessions() {
  const { createClient } = await import('@sanity/client')
  
  const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
    apiVersion: '2025-07-25',
    useCdn: false,
  })

  try {
    const query = `*[_type == "votingSession"] | order(sessionDate desc) {
      _id,
      userName,
      instanceId,
      instanceTitle,
      sessionDate,
      summary,
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

export default async function SessionsPage() {
  const instances = await getAllInstances()
  const sessions = await getAllVotingSessions()

  // Calculate stats
  const totalSessions = sessions.length
  const totalVotes = sessions.reduce((sum: number, session: any) => sum + (session.summary?.totalVotes || 0), 0)
  const uniqueUsers = new Set(sessions.map(s => s.userName)).size
  const averageVotesPerSession = totalSessions > 0 ? Math.round(totalVotes / totalSessions) : 0

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Voting Sessions</h1>
        <p className="text-muted-foreground">
          View and analyze voting session data from all instances
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-6">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Sessions</p>
              <p className="text-2xl font-bold">{totalSessions}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Unique Users</p>
              <p className="text-2xl font-bold">{uniqueUsers}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-purple-600" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Votes</p>
              <p className="text-2xl font-bold">{totalVotes}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-orange-600" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avg Votes/Session</p>
              <p className="text-2xl font-bold">{averageVotesPerSession}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Sessions List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Recent Sessions</h2>
        
        {sessions.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No voting sessions found yet.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Sessions will appear here once users complete voting and save their results.
            </p>
          </Card>
        ) : (
          sessions.map((session: any) => {
            // Find the instance slug for the link
            const instance = instances.find(inst => inst.id === session.instanceId)
            const instanceSlug = instance?.slug || 'unknown'
            
            return (
              <Card key={session._id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold">{session.userName}</h3>
                      <Badge variant="secondary">{session.instanceTitle}</Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium">Total Votes:</span> {session.summary?.totalVotes || 0}
                      </div>
                      <div>
                        <span className="font-medium">This Votes:</span> {session.summary?.leftVotes || 0}
                      </div>
                      <div>
                        <span className="font-medium">That Votes:</span> {session.summary?.rightVotes || 0}
                      </div>
                      <div>
                        <span className="font-medium">Timeouts:</span> {session.summary?.timeoutVotes || 0}
                      </div>
                    </div>
                    
                    {/* Individual Vote Details */}
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Vote Details:</h4>
                      <div className="space-y-2">
                        {session.votes?.map((vote: any, index: number) => (
                          <div key={vote._key || index} className="flex items-center space-x-4 p-2 bg-gray-50 rounded">
                            <div className="flex-1">
                              <span className="font-medium text-sm">{vote.imagePairTitle}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <img 
                                src={vote.imageUrl1} 
                                alt="Image 1" 
                                className="w-8 h-8 object-cover rounded"
                              />
                              <span className="text-xs">vs</span>
                              <img 
                                src={vote.imageUrl2} 
                                alt="Image 2" 
                                className="w-8 h-8 object-cover rounded"
                              />
                            </div>
                            <div className="text-xs">
                              <span className={`px-2 py-1 rounded ${
                                vote.selectedImage === 'left' ? 'bg-blue-100 text-blue-800' :
                                vote.selectedImage === 'right' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {vote.selectedImage === 'left' ? 'This' : 
                                 vote.selectedImage === 'right' ? 'That' : 'Timeout'}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {vote.timeSpent}s
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="mt-2 text-xs text-muted-foreground">
                      {new Date(session.sessionDate).toLocaleDateString()} at{' '}
                      {new Date(session.sessionDate).toLocaleTimeString()}
                    </div>
                  </div>
                  

                </div>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
} 