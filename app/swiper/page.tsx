import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Smartphone, ArrowLeft, ArrowRight, Clock, Users, BarChart3 } from 'lucide-react'
import { getAllSwipers } from '@/lib/sanity'

export const dynamic = 'force-dynamic'

export default async function SwiperLandingPage() {
  const swipers = await getAllSwipers()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold text-foreground">Pitch Lab</h1>
            </div>
            <nav className="flex items-center space-x-4">
              <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
                Home
              </Link>
              <Link href="/thisorthat" className="text-sm text-muted-foreground hover:text-foreground">
                This or That
              </Link>
              <Link href="/sliders" className="text-sm text-muted-foreground hover:text-foreground">
                Sliders
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center">
              <Smartphone className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Keep, Kill, Merge
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Tinder-like swiping interface for rapid decision making. Perfect for website evaluation, content curation, and preference testing.
          </p>
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            <Badge variant="secondary" className="px-3 py-1">
              <Smartphone className="w-3 h-3 mr-1" />
              Swipe Interface
            </Badge>
            <Badge variant="secondary" className="px-3 py-1">
              <Clock className="w-3 h-3 mr-1" />
              Rapid Decisions
            </Badge>
            <Badge variant="secondary" className="px-3 py-1">
              <BarChart3 className="w-3 h-3 mr-1" />
              Session Analytics
            </Badge>
            <Badge variant="secondary" className="px-3 py-1">
              <Users className="w-3 h-3 mr-1" />
              User Testing
            </Badge>
          </div>
        </div>
      </section>

      {/* Available Assessments */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Available Assessments</h2>
            <p className="text-muted-foreground">
              Choose from our collection of swiper-based assessments
            </p>
          </div>

          {swipers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {swipers.map((swiper) => (
                <Card key={swiper.id} className="group hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                        <Smartphone className="w-5 h-5 text-white" />
                      </div>
                      <Badge variant="outline">{swiper.websites.length} websites</Badge>
                    </div>
                    <CardTitle className="text-xl">{swiper.title}</CardTitle>
                    <CardDescription>{swiper.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-sm text-muted-foreground">
                        Created by: {swiper.createdBy}
                      </div>
                      <Link href={`/swiper/${swiper.slug}`}>
                        <Button className="w-full group-hover:bg-green-600 transition-colors">
                          Start Assessment
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No Keep, Kill, Merge Assessments Available</h3>
              <p className="text-muted-foreground mb-6">
                Check back later for new swiper-based assessments.
              </p>
              <Link href="/">
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Use Keep, Kill, Merge?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our swiper interface makes decision-making fast, intuitive, and engaging
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Intuitive Interface</h3>
              <p className="text-muted-foreground">
                Familiar swipe gestures make the experience natural and engaging for users of all ages.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Rapid Decisions</h3>
              <p className="text-muted-foreground">
                Quick swipe actions enable fast decision-making and high completion rates.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Rich Analytics</h3>
              <p className="text-muted-foreground">
                Track user preferences, timing, and decision patterns for valuable insights.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t">
        <div className="container mx-auto text-center">
          <p className="text-muted-foreground">
            © 2024 Pitch Lab. Interactive research and assessment tools.
          </p>
        </div>
      </footer>
    </div>
  )
}
