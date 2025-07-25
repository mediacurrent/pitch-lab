import { getAllImages, type ImageEntry } from '@/lib/sanity'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Trash2, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export default async function AdminPage() {
  let images: ImageEntry[] = []
  try {
    images = await getAllImages()
  } catch (error) {
    console.log('Sanity not configured')
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Image Management</h1>
          <p className="text-muted-foreground">Manage your voting images</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/admin/new">
              <Plus className="w-4 h-4 mr-2" />
              Add Image
            </Link>
          </Button>
                      <Button variant="outline" asChild>
              <a href={`https://${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}.sanity.studio`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Sanity Studio
              </a>
            </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {images.map((image) => (
          <Card key={image.id} className="overflow-hidden">
            <div className="aspect-square relative">
              <img
                src={image.imageUrl}
                alt={image.title}
                className="w-full h-full object-cover"
              />
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