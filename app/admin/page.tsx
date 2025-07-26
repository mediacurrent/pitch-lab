import { getAllImages, getFeaturedImages, getCategories, type ImageEntry } from '@/lib/sanity'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Trash2, ExternalLink, Star, Filter, BarChart3 } from 'lucide-react'
import Link from 'next/link'

export default async function AdminPage() {
  let images: ImageEntry[] = []
  let featuredImages: ImageEntry[] = []
  let categories: any[] = []
  
  try {
    images = await getAllImages()
    featuredImages = await getFeaturedImages()
    categories = await getCategories()
  } catch (error) {
    console.log('Sanity not configured')
  }

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Image Management</h1>
          <p className="text-muted-foreground">Manage your voting images and content</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/admin/new">
              <Plus className="w-4 h-4 mr-2" />
              Add Image
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
                <p className="text-sm font-medium text-muted-foreground">Total Images</p>
                <p className="text-2xl font-bold">{images.length}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Featured Images</p>
                <p className="text-2xl font-bold">{featuredImages.length}</p>
              </div>
              <Star className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Categories</p>
                <p className="text-2xl font-bold">{categories.length}</p>
              </div>
              <Filter className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Images</p>
                <p className="text-2xl font-bold">{images.filter(img => img.status === 'active').length}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Images Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {images.map((image) => (
          <Card key={image.id} className="overflow-hidden">
            <div className="aspect-square relative">
              <img
                src={image.imageUrl}
                alt={image.title}
                className="w-full h-full object-cover"
              />
              {image.featured && (
                <div className="absolute top-2 right-2">
                  <Badge className="bg-yellow-500 text-white">
                    <Star className="w-3 h-3 mr-1" />
                    Featured
                  </Badge>
                </div>
              )}
              {image.status && (
                <div className="absolute top-2 left-2">
                  <Badge variant={image.status === 'active' ? 'default' : 'secondary'}>
                    {image.status}
                  </Badge>
                </div>
              )}
            </div>
            <CardHeader>
              <CardTitle className="text-lg">{image.title}</CardTitle>
              {image.description && (
                <CardDescription>{image.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                {image.category && (
                  <Badge variant="secondary">{image.category}</Badge>
                )}
                {image.difficulty && (
                  <Badge variant="outline" className={
                    image.difficulty === 'easy' ? 'text-green-600' :
                    image.difficulty === 'hard' ? 'text-red-600' : 'text-yellow-600'
                  }>
                    {image.difficulty}
                  </Badge>
                )}
                {image.tags?.map((tag: string) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {images.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-muted-foreground mb-4">No images found</p>
            <Button asChild>
              <Link href="/admin/new">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Image
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 