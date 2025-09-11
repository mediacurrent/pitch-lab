"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Image, Sliders, Users, BarChart3, Clock, Palette } from "lucide-react"
import { ThisOrThatInstance, SliderInstance } from "@/lib/sanity"

interface AppVariant {
  id: string
  name: string
  description: string
  category: string
  image: string
  demoUrl: string
  features: string[]
  color: string
  type: 'image-voting' | 'slider-assessment'
  categories: string[]
}

const categoryIcons = {
  "This or That": Image,
  "Sliders": Sliders,
  "Research": BarChart3,
  "User Testing": Users,
  "Quick Poll": Clock,
  "Design": Palette,
}

interface AppShowcaseProps {
  instances: ThisOrThatInstance[]
  sliders: SliderInstance[]
}

export function AppShowcase({ instances, sliders }: AppShowcaseProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All")

  // Transform Pitch Lab data into app showcase format
  const transformToApps = (): AppVariant[] => {
    const apps: AppVariant[] = []

    // Add Image Voting app type (if there are any instances)
    if (instances.length > 0) {
      apps.push({
        id: "image-voting",
        name: "This or That",
        description: "Interactive 'This or That' style voting with timed decisions. Perfect for design preference testing and brand research.",
        category: "This or That",
        image: instances[0].imagePairs.length > 0 ? instances[0].imagePairs[0].imageUrl1 : "/placeholder.jpg",
        demoUrl: "/thisorthat",
        features: [
          `${instances.length} Available Assessments`,
          "Timed Decisions",
          "Real-time Voting",
          "Session Analytics"
        ],
        color: "bg-blue-500",
        type: 'image-voting',
        categories: ["Design", "Strategy"]
      })
    }

    // Add Slider Assessment app type (if there are any sliders)
    if (sliders.length > 0) {
      apps.push({
        id: "slider-assessment",
        name: "Sliders",
        description: "Interactive slider-based preference analysis tool. Perfect for understanding user preferences and market research.",
        category: "Sliders",
        image: "/modern-saas-dashboard.png",
        demoUrl: "/sliders",
        features: [
          `${sliders.length} Available Assessments`,
          "Preference Analysis",
          "Data Collection",
          "Results Tracking"
        ],
        color: "bg-purple-500",
        type: 'slider-assessment',
        categories: ["Strategy", "Technology"]
      })
    }

    return apps
  }

  const apps = transformToApps()
  const allCategories = Array.from(new Set(apps.flatMap((app) => app.categories)))
  const categories = ["All", ...allCategories]

  const filteredApps =
    selectedCategory === "All" ? apps : apps.filter((app) => app.categories.includes(selectedCategory))

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold text-foreground">Pitch Lab</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">

        {/* Category Filter */}
        <div className="flex flex-wrap justify-start gap-2 mb-8">
          {categories.map((category) => (
            <Button
              key={category}
              variant="outline"
              onClick={() => setSelectedCategory(category)}
              className={`transition-all duration-200 rounded-full ${
                selectedCategory === category 
                  ? "bg-black text-white border-black hover:bg-black hover:text-white" 
                  : "hover:bg-gray-100"
              }`}
            >
              {category}
            </Button>
          ))}
        </div>

        {/* App Grid */}
        {filteredApps.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">No Apps Available</h3>
            <p className="text-muted-foreground mb-4">
              {selectedCategory === "All" 
                ? "No research tools are available yet. Create some assessments in the admin panel to get started!" 
                : `No apps found in the "${selectedCategory}" category.`}
            </p>
            <Button variant="outline" onClick={() => setSelectedCategory("All")}>
              View All Categories
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredApps.map((app) => {
            const IconComponent = categoryIcons[app.category as keyof typeof categoryIcons]

            return (
              <Card
                key={app.id}
                className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer border-border/50 hover:border-primary/20"
                onClick={() => window.location.href = app.demoUrl}
              >
                <CardHeader className="p-0">
                  <div className="relative overflow-hidden rounded-t-xl">
                    <div className="overflow-hidden rounded-t-xl">
                      <img
                        src={app.image || "/placeholder.jpg"}
                        alt={app.name}
                        className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute top-4 left-4">
                      <Badge variant="default" className="bg-primary/90 text-primary-foreground backdrop-blur-sm">
                        <IconComponent className="w-3 h-3 mr-1" />
                        {app.category}
                      </Badge>
                    </div>
                    <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Button 
                        size="sm" 
                        className="bg-primary/90 backdrop-blur-sm hover:bg-primary"
                        onClick={(e) => {
                          e.stopPropagation()
                          window.location.href = app.demoUrl
                        }}
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        {app.type === 'image-voting' ? 'Explore Image Voting' : 'Explore Slider Assessment'}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <CardTitle className="text-lg mb-2 text-foreground group-hover:text-primary transition-colors">
                    {app.name}
                  </CardTitle>
                  <CardDescription className="text-muted-foreground mb-4 text-pretty">
                    {app.description}
                  </CardDescription>
                </CardContent>
              </Card>
            )
          })}
          </div>
        )}

      </main>
    </div>
  )
}
