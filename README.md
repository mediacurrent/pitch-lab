# Image Voting App

A modern image voting application built with Next.js 14 and Contentful CMS for managing images.

## Features

- 🖼️ **Image Voting System**: Vote on images with a timer
- 📱 **Responsive Design**: Works on desktop and mobile devices
- ⏱️ **Timer Functionality**: Configurable voting time limits
- 🎯 **CMS Integration**: Manage images through Sanity
- 🎨 **Modern UI**: Built with Tailwind CSS and Radix UI components
- 📊 **Vote Tracking**: Track yes/no votes and timeouts
- ⏸️ **Pause/Resume**: Pause voting sessions
- 🔄 **Reset Functionality**: Start over with the same images

## Tech Stack

- **Frontend**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + shadcn/ui
- **CMS**: Sanity
- **Language**: TypeScript
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Sanity account

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd image-voting-app
npm install
```

### 2. Set up Sanity

1. Create a [Sanity account](https://www.sanity.io/)
2. Create a new project
3. The schema is already configured in `sanity/schemas/imageVoting.ts` with the following fields:
   - `title` (string, required)
   - `description` (text, optional)
   - `image` (image, required)
   - `category` (string, optional)
   - `tags` (array of strings, optional)

4. Add some sample images to your Sanity project

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Sanity Configuration
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_SANITY_DATASET=production

# Next.js Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

To find your Sanity project ID:
1. Go to your Sanity project dashboard
2. Copy the Project ID from the project settings
3. The dataset is typically "production" by default

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Project Structure

```
├── app/                    # Next.js App Router
│   ├── admin/             # Admin pages for CMS management
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── CircularTimer.tsx # Timer component
│   ├── ImageVoting.tsx   # Main voting component
│   └── figma/            # Image components
├── lib/                  # Utility functions
│   └── sanity.ts         # CMS integration
├── styles/               # Additional styles
└── public/               # Static assets
```

## Usage

### Voting Interface

1. Navigate to the home page
2. Images will be displayed one at a time
3. Vote "Yes" or "No" within the time limit
4. View results at the end

### Admin Interface

1. Navigate to `/admin` to manage images
2. View all images in your CMS
3. Click "Sanity Studio" to edit directly in Sanity
4. Add new images through the CMS interface

### Customization

#### Changing Timer Duration

Edit the `TIME_LIMIT` constant in `components/ImageVoting.tsx`:

```typescript
const TIME_LIMIT = 10; // seconds
```

#### Adding New Image Categories

1. Add categories in Sanity (update the schema in `sanity/schemas/imageVoting.ts`)
2. Filter images by category using the `getImagesByCategory` function
3. Create category-specific voting sessions

#### Styling

The app uses Tailwind CSS with a custom design system. Modify `app/globals.css` to change colors and styling.

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Your Sanity project ID | Yes |
| `NEXT_PUBLIC_SANITY_DATASET` | Your Sanity dataset (default: production) | No |
| `NEXT_PUBLIC_APP_URL` | Your app's URL | No |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, please open an issue in the GitHub repository or contact the development team. 