import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { getAllSliders } from '@/lib/sanity'

export default async function SlidersPage() {
  const sliders = await getAllSliders()

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Sliders</h1>
        <p className="text-muted-foreground">
          Choose from our collection of slider voting experiences
        </p>
      </div>

      {sliders.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sliders.map((slider) => (
            <Card key={slider.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-xl">{slider.title}</CardTitle>
                <CardDescription>
                  {slider.description || 'No description available'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <div className="text-sm text-muted-foreground">
                    {slider.sliderPairs.length} pair{slider.sliderPairs.length !== 1 ? 's' : ''}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Created by {slider.createdBy}
                  </div>
                </div>
                <Link href={`/sliders/${slider.slug}`} className="w-full">
                  <Button className="w-full">Start Sliding</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center py-8">
              No sliders available yet. Check back soon!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
