import { getAllInstances } from '@/lib/sanity'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function InstancesAdminPage() {
  const instances = await getAllInstances()

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">This or That</h1>
        <Link href="/admin/instances/create">
          <Button>Create New</Button>
        </Link>
      </div>

      {instances.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center py-8">
              No This or That found. Create your first one!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {instances.map((instance) => (
            <Card key={instance.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex justify-between items-start">
                  <span className="truncate">{instance.title}</span>
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    {instance.timerLength}s
                  </span>
                </CardTitle>
                {instance.description && (
                  <CardDescription className="line-clamp-2">
                    {instance.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Image Pairs:</span>
                    <span className="font-medium">{instance.imagePairs.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Status:</span>
                    <span className={`font-medium ${instance.isActive ? 'text-green-600' : 'text-red-600'}`}>
                      {instance.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">URL:</span>
                    <span className="font-mono text-xs truncate">
                      /this-or-that/{instance.slug}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Created by:</span>
                    <span className="font-medium">{instance.createdBy}</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Link href={`/this-or-that/${instance.slug}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      View
                    </Button>
                  </Link>
                  <Link href={`/admin/instances/${instance.id}/edit`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      Edit
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 