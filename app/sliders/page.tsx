import { getAllSliders } from '@/lib/sanity'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sliders, Users, BarChart3, ArrowLeft, TrendingUp } from 'lucide-react'
import Link from 'next/link'

// Force dynamic rendering to avoid build-time Sanity client creation
export const dynamic = 'force-dynamic'

export default async function SlidersPage() {
  const sliders = await getAllSliders()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                <Sliders className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-foreground">Sliders</h1>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                Home
              </Link>
              <Link href="/thisorthat" className="text-muted-foreground hover:text-foreground transition-colors">
                This or That
              </Link>
              <Link href="/admin" className="text-muted-foreground hover:text-foreground transition-colors">
                Admin
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Sliders className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-4xl font-bold text-foreground mb-4 text-balance">Sliders</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty mb-8">
            Interactive slider-based preference analysis tool. Perfect for understanding user preferences, 
            product positioning, and market research through intuitive slider interactions.
          </p>
          
          {/* Features */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <div className="flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-lg">
              <TrendingUp className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-medium">Preference Analysis</span>
            </div>
            <div className="flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-lg">
              <Users className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-medium">User Insights</span>
            </div>
            <div className="flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-lg">
              <BarChart3 className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-medium">Data Collection</span>
            </div>
          </div>
        </div>

        {/* Available Assessments */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-foreground mb-6">Available Assessments</h3>
          
          {sliders.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Sliders className="w-8 h-8 text-muted-foreground" />
              </div>
              <h4 className="text-xl font-semibold text-foreground mb-2">No Assessments Available</h4>
              <p className="text-muted-foreground mb-4">
                No slider assessments have been created yet. Check back soon!
        </p>
      </div>
          ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sliders.map((slider) => (
            <Card key={slider.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg mb-2">{slider.title}</CardTitle>
                        {slider.description && (
                          <CardDescription className="line-clamp-2">
                            {slider.description}
                </CardDescription>
                        )}
                      </div>
                      <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                        <Sliders className="w-3 h-3 mr-1" />
                        Slider
                      </Badge>
                    </div>
              </CardHeader>
              <CardContent>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Slider Pairs:</span>
                        <span className="font-medium">{slider.sliderPairs.length}</span>
                  </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Estimated Time:</span>
                        <span className="font-medium">{Math.ceil(slider.sliderPairs.length * 2)} min</span>
                  </div>
                </div>
                <Link href={`/sliders/${slider.slug}`} className="w-full">
                      <Button className="w-full bg-purple-500 hover:bg-purple-600">
                        Start Assessment
                      </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
          )}
        </div>

        {/* How It Works */}
        <div className="bg-muted/30 rounded-lg p-8 mb-8">
          <h3 className="text-2xl font-bold text-foreground mb-6 text-center">How Sliders Work</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold">1</span>
              </div>
              <h4 className="font-semibold mb-2">Choose Your Assessment</h4>
              <p className="text-sm text-muted-foreground">
                Select from available slider assessments designed for your specific research goals.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold">2</span>
              </div>
              <h4 className="font-semibold mb-2">Adjust Sliders</h4>
              <p className="text-sm text-muted-foreground">
                Use intuitive sliders to express preferences between different options or concepts.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold">3</span>
              </div>
              <h4 className="font-semibold mb-2">Analyze Results</h4>
              <p className="text-sm text-muted-foreground">
                Review detailed analytics and preference patterns to inform your decisions.
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center py-12 bg-purple-50 rounded-lg">
          <h3 className="text-2xl font-bold text-foreground mb-4">Ready to Start?</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Choose an assessment above to begin collecting user preferences through slider interactions.
          </p>
          <Link href="/">
            <Button variant="outline" className="bg-white">
              Back to Home
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-4">© 2024 Pitch Lab. Interactive research and assessment tools.</p>
          <div className="flex justify-center space-x-6">
            <Link href="/admin" className="hover:text-accent transition-colors">
              Admin Panel
            </Link>
            <Link href="/" className="hover:text-accent transition-colors">
              Home
            </Link>
            <Link href="/thisorthat" className="hover:text-accent transition-colors">
              This or That
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
