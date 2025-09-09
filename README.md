mp# Pitch Lab

A modern multi-tenant slider assessment application built with Next.js 14 and Sanity CMS. Users can create slider-based assessments with custom criteria and preferences.

## Features

- 🎯 **Multi-Tenant Assessments**: Create multiple slider-based assessments
- 📊 **Slider Preferences**: Drag sliders to indicate preferences between two options
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices
- 🎨 **Modern UI**: Built with Tailwind CSS and Radix UI components
- 🔄 **Reset Functionality**: Reset all sliders to neutral position
- 📊 **Data Collection**: Track user preferences and responses
- 🔗 **URL Sharing**: Each assessment has a unique shareable URL
- 📝 **Optional Feedback**: Users can provide their name with submissions

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
3. The schema is configured in `sanity/schemaTypes/sliderInstance.ts` with:
   - `title` (string, required) - Assessment name
   - `slug` (string, required) - URL identifier
   - `description` (text, optional) - Assessment description
   - `sliderPairs` (array) - Slider criteria with:
     - `title` (string, required) - Criteria name
     - `leftSide` (string, required) - Left option label
     - `rightSide` (string, required) - Right option label
   - `isActive` (boolean) - Assessment availability
   - `createdBy` (string) - CMS user who created the assessment

4. Add slider pairs to your Sanity project

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
│   ├── admin/                    # Admin pages for assessment management
│   ├── sliders/                  # Slider assessment pages
│   ├── studio/                   # Sanity Studio interface
│   ├── api/                      # API routes
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page with assessment gallery
├── components/                   # React components
│   ├── ui/                      # shadcn/ui components
│   ├── SliderAssessment.tsx     # Main assessment component
│   ├── SliderCard.tsx           # Individual slider component
│   ├── SubmissionForm.tsx       # Form submission component
│   └── Navigation.tsx           # Navigation component
├── lib/                         # Utility functions
│   └── sanity.ts                # CMS integration
├── sanity/                      # Sanity configuration
│   ├── schemaTypes/             # Content schemas
│   └── studio/                  # Sanity Studio setup
└── public/                      # Static assets
```

## Usage

### Creating Assessments

1. Navigate to `/admin` to manage assessments
2. Click "Sanity Studio" to create new assessments
3. Add slider pairs with left and right options
4. Set assessment title and description
5. Publish the assessment

### Assessment Interface

1. Browse assessments on the home page
2. Click "Start Sliding" on any assessment
3. View slider criteria with left and right options
4. Drag sliders to indicate preferences
5. Use reset controls as needed
6. Submit assessment when complete

### Admin Interface

1. Navigate to `/admin` to view all assessments
2. See assessment details: title, description, pair count, status
3. Access Sanity Studio for content management
4. View and edit assessment configurations

## Key Features

### Multi-Tenant Architecture
- Each assessment is independent
- Unique URLs: `/sliders/{slug}`
- Separate slider criteria and preferences per assessment

### Interactive Slider Assessment
- Draggable sliders for preference indication
- Smooth animations and visual feedback
- Real-time value updates
- Neutral position (50%) as default

### Data Collection
- Track user preferences and responses
- Optional name collection
- Session data stored in Sanity CMS
- Analytics and reporting capabilities

### Modern UI Design
- Clean, modern interface
- Responsive design for all devices
- Smooth animations and transitions
- Accessible form controls

## Customization

### Adding Slider Criteria
1. Create slider pairs in Sanity Studio
2. Set left and right option labels
3. Configure assessment title and description
4. Set display order for proper sequencing

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