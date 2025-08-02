# Pitch Lab

A modern multi-tenant image voting application built with Next.js 14 and Sanity CMS. Users can create voting instances with custom images and timer settings.

## Features

- 🎯 **Multi-Tenant Instances**: Create multiple voting sessions
- 🖼️ **Image Pair Voting**: Vote between two images with clickable interface
- ⏱️ **Configurable Timers**: Set timer length from 5-30 seconds per instance
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices
- 🎨 **Modern UI**: Built with Tailwind CSS and Radix UI components
- ⏸️ **Pause/Resume**: Pause voting sessions at any time
- 🔄 **Reset Functionality**: Start over with the same image pairs
- 🚀 **Manual Start**: Users control when to start the timer
- 📊 **Vote Tracking**: Track selections and timeouts
- 🔗 **URL Sharing**: Each instance has a unique shareable URL

## Tech Stack

- **Frontend**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + shadcn/ui
- **CMS**: Sanity Studio
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
cd pitch-lab
npm install
```

### 2. Set up Sanity

1. Create a [Sanity account](https://www.sanity.io/)
2. Create a new project
3. The schema is configured in `sanity/schemaTypes/thisOrThatInstance.ts` with:
   - `title` (string, required) - Instance name
   - `slug` (string, required) - URL identifier
   - `description` (text, optional) - Instance description
   - `timerLength` (number, 5-30s, default 10) - Voting timer duration
   - `imagePairs` (array) - Embedded image pairs with:
     - `title` (string, required) - Pair name
     - `image1` & `image2` (objects) - Image assets or external URLs
     - `order` (number) - Display order
   - `isActive` (boolean) - Instance availability
   - `createdBy` (string) - CMS user who created the instance

4. Add image pairs to your Sanity project

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Sanity Configuration
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_SANITY_DATASET=production

# Next.js Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Project Structure

```
├── app/                           # Next.js App Router
│   ├── admin/                    # Admin pages for instance management
│   ├── pitch-lab/[slug]/      # Dynamic instance pages
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page with instance gallery
├── components/                   # React components
│   ├── ui/                      # shadcn/ui components
│   ├── CircularTimer.tsx        # Timer component
│   ├── ImageVoting.tsx          # Main voting component
│   └── figma/                   # Image components
├── lib/                         # Utility functions
│   └── sanity.ts                # CMS integration
├── sanity/                      # Sanity configuration
│   ├── schemaTypes/             # Content schemas
│   └── studio/                  # Sanity Studio setup
└── public/                      # Static assets
```

## Usage

### Creating Instances

1. Navigate to `/admin` to manage instances
2. Click "Sanity Studio" to create new instances
3. Add image pairs with uploaded images or external URLs
4. Set timer length and instance details
5. Publish the instance

### Voting Interface

1. Browse instances on the home page
2. Click "Start Voting" on any instance
3. View image pairs with "This" and "That" labels
4. Click on images to vote (blue border appears on hover)
5. Timer starts manually on first slide, auto-starts on subsequent slides
6. Use pause/reset controls as needed

### Admin Interface

1. Navigate to `/admin` to view all instances
2. See instance details: title, timer length, pair count, status
3. Access Sanity Studio for content management
4. View and edit instance configurations

## Key Features

### Multi-Tenant Architecture
- Each voting instance is independent
- Unique URLs: `/pitch-lab/{slug}`
- Separate timer settings and image pairs per instance

### Interactive Image Voting
- Clickable images instead of buttons
- Blue border appears on hover
- 20% opacity dimming on hover
- Visual feedback for selected images

### Timer Control
- Manual start on first slide
- Auto-start on subsequent slides
- Pause/resume functionality
- Configurable duration (5-30 seconds)

### Modern UI Design
- Light grey background (`bg-gray-200`)
- Rounded corners (`rounded-[0.25rem]`)
- Generous padding and spacing
- Hover states for all interactive elements

## Customization

### Changing Timer Duration
Set the `timerLength` field in Sanity for each instance (5-30 seconds).

### Adding Image Pairs
1. Upload images to Sanity or use external URLs
2. Add alt text for accessibility
3. Set display order for proper sequencing

### Styling
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