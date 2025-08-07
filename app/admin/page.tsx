import { getAllSliders, getAllInstances, type SliderInstance, type ThisOrThatInstance } from '@/lib/sanity'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Trash2, ExternalLink, Star, Filter, BarChart3, Clock, Users, TrendingUp } from 'lucide-react'
import Link from 'next/link'

// Force dynamic rendering to avoid build-time Sanity client creation
export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  let sliders: SliderInstance[] = []
  let instances: ThisOrThatInstance[] = []

  try {
    [sliders, instances] = await Promise.all([
      getAllSliders(),
      getAllInstances()
    ])
  } catch (error) {
    console.log('Sanity not configured')
  }

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Pitch Lab Management</h1>
          <p className="text-muted-foreground">Manage your voting instances and slider assessments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/sessions">
              <BarChart3 className="w-4 h-4 mr-2" />
              View Sessions
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/analytics">
              <TrendingUp className="w-4 h-4 mr-2" />
              Analytics
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <a href="http://localhost:3333" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              Sanity Studio
            </a>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Content</p>
                <p className="text-2xl font-bold">{sliders.length + instances.length}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Image Voting</p>
                <p className="text-2xl font-bold">{instances.length}</p>
              </div>
              <Filter className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Slider Assessments</p>
                <p className="text-2xl font-bold">{sliders.length}</p>
              </div>
              <Star className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Content</p>
                <p className="text-2xl font-bold">
                  {sliders.filter(s => s.isActive).length + instances.filter(i => i.isActive).length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Grid */}
      <div className="space-y-8">
        {/* Image Voting Instances */}
        {instances.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Image Voting Instances</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {instances.map((instance) => (
                <Card key={instance.id} className="overflow-hidden">
                  <div className="aspect-video relative bg-gray-100 flex items-center justify-center">
                    {instance.imagePairs.length > 0 ? (
                      <div className="flex gap-2 p-4">
                        <div className="w-1/2 h-20 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                          Image 1
                        </div>
                        <div className="w-1/2 h-20 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                          Image 2
                        </div>
                      </div>
                    ) : (
                      <div className="text-muted-foreground text-sm">No images</div>
                    )}

                    {instance.isActive && (
                      <div className="absolute top-2 left-2">
                        <Badge variant="default">Active</Badge>
                      </div>
                    )}
                  </div>
                  <CardHeader>
                    <CardTitle className="text-lg">{instance.title}</CardTitle>
                    {instance.description && (
                      <CardDescription>{instance.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge variant="secondary">
                        <Clock className="w-3 h-3 mr-1" />
                        {instance.timerLength}s
                      </Badge>
                      <Badge variant="outline">
                        {instance.imagePairs.length} pairs
                      </Badge>
                      {instance.createdBy && (
                        <Badge variant="outline">
                          By {instance.createdBy}
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1" asChild>
                        <Link href={`/this-or-that/${instance.slug}`}>
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1" asChild>
                        <Link href={`/admin/instances/${instance.id}/edit`}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Slider Assessments */}
        {sliders.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Slider Assessments</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {sliders.map((slider) => (
                <Card key={slider.id} className="overflow-hidden">
                  <div className="aspect-video relative bg-gray-100 flex items-center justify-center">
                    {slider.sliderPairs.length > 0 ? (
                      <div className="flex flex-col gap-2 p-4 w-full">
                        <div className="text-center text-sm font-medium text-gray-700">
                          {slider.sliderPairs[0].title}
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>{slider.sliderPairs[0].leftSide}</span>
                          <span>{slider.sliderPairs[0].rightSide}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-muted-foreground text-sm">No slider pairs</div>
                    )}

                    {slider.isActive && (
                      <div className="absolute top-2 left-2">
                        <Badge variant="default">Active</Badge>
                      </div>
                    )}
                  </div>
                  <CardHeader>
                    <CardTitle className="text-lg">{slider.title}</CardTitle>
                    {slider.description && (
                      <CardDescription>{slider.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge variant="secondary">
                        <Filter className="w-3 h-3 mr-1" />
                        {slider.sliderPairs.length} pairs
                      </Badge>
                      {slider.createdBy && (
                        <Badge variant="outline">
                          By {slider.createdBy}
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1" asChild>
                        <Link href={`/sliders/${slider.slug}`}>
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1" asChild>
                        <Link href={`/admin/instances/${slider.id}/edit`}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {instances.length === 0 && sliders.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-muted-foreground mb-4">No content found</p>
            <Button asChild>
              <Link href="/admin/instances/create">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Content
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 