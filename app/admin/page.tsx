import { getAllInstances, type ThisOrThatInstance } from '@/lib/sanity'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Trash2, ExternalLink, Star, Filter, BarChart3, Clock, Users } from 'lucide-react'
import Link from 'next/link'

export default async function AdminPage() {
  let instances: ThisOrThatInstance[] = []

  try {
    instances = await getAllInstances()
  } catch (error) {
    console.log('Sanity not configured')
  }

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">This or That Management</h1>
          <p className="text-muted-foreground">Manage your voting instances and content</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/admin/instances/create">
              <Plus className="w-4 h-4 mr-2" />
              Create New
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
                <p className="text-sm font-medium text-muted-foreground">Total Instances</p>
                <p className="text-2xl font-bold">{instances.length}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Image Pairs</p>
                <p className="text-2xl font-bold">
                  {instances.reduce((total, instance) => total + instance.imagePairs.length, 0)}
                </p>
              </div>
              <Filter className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Instances</p>
                <p className="text-2xl font-bold">{instances.filter(instance => instance.isActive).length}</p>
              </div>
              <Star className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Timer Length</p>
                <p className="text-2xl font-bold">
                  {instances.length > 0 
                    ? Math.round(instances.reduce((total, instance) => total + instance.timerLength, 0) / instances.length)
                    : 0}s
                </p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instances Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {instances.map((instance) => (
          <Card key={instance.id} className="overflow-hidden">
            <div className="aspect-video relative bg-gray-100 flex items-center justify-center">
              {instance.imagePairs.length > 0 ? (
                <div className="flex gap-2 p-4">
                  <img
                    src={instance.imagePairs[0].imageUrl1}
                    alt={`${instance.title} - Image 1`}
                    className="w-1/2 h-20 object-cover rounded"
                  />
                  <img
                    src={instance.imagePairs[0].imageUrl2}
                    alt={`${instance.title} - Image 2`}
                    className="w-1/2 h-20 object-cover rounded"
                  />
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
                  <Users className="w-3 h-3 mr-1" />
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

      {instances.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-muted-foreground mb-4">No This or That instances found</p>
            <Button asChild>
              <Link href="/admin/instances/create">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Instance
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 