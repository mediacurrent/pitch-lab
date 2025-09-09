export default function TestShowcasePage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <h1 className="text-4xl font-bold text-center mb-8">Test Showcase Page</h1>
      <p className="text-center text-xl text-muted-foreground">
        This is a test page to verify the route works without Sanity dependencies.
      </p>
      <div className="mt-8 text-center">
        <a href="/" className="text-blue-500 hover:underline">← Back to Home</a>
      </div>
    </div>
  )
}
