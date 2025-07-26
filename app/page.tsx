import { getAllInstances } from '@/lib/sanity'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function Home() {
  const instances = await getAllInstances()

  return (
    <div className="container mx-auto py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">This or That</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Vote on image pairs and share your own "This or That" experiences
        </p>
      </div>

      {instances.length === 0 ? (
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center py-8">
              No This or That available yet. Check back soon!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
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
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Image Pairs:</span>
                    <span className="font-medium">{instance.imagePairs.length}</span>
                  </div>
                </div>
                <Link href={`/this-or-that/${instance.slug}`} className="w-full">
                  <Button className="w-full">Start Voting</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 