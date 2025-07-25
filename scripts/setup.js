#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

console.log('🚀 Setting up Image Voting App...\n')

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local')
if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env.local file...')
  
  const envContent = `# Sanity Configuration
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_SANITY_DATASET=production

# Next.js Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
`
  
  fs.writeFileSync(envPath, envContent)
  console.log('✅ Created .env.local file')
  console.log('⚠️  Please update the Contentful credentials in .env.local\n')
} else {
  console.log('✅ .env.local file already exists\n')
}

console.log('📋 Next steps:')
console.log('1. Install dependencies: npm install')
console.log('2. Set up Sanity CMS:')
console.log('   - Create account at https://www.sanity.io/')
console.log('   - Create a new project')
console.log('   - Create schema for "imageVoting" with fields:')
console.log('     * title (string, required)')
console.log('     * description (text, optional)')
console.log('     * image (image, required)')
console.log('     * category (string, optional)')
console.log('     * tags (array of strings, optional)')
console.log('3. Update .env.local with your Sanity project ID')
console.log('4. Run the development server: npm run dev')
console.log('5. Visit http://localhost:3000 to see the app')
console.log('6. Visit http://localhost:3000/admin to manage images\n')

console.log('🎉 Setup complete!') 