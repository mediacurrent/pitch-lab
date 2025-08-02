# CMS Setup Guide - Pitch Lab

This guide will help you set up and use the Sanity CMS for managing your Pitch Lab application.

## 🚀 Quick Start

### 1. Environment Setup

First, make sure your `.env.local` file has the correct Sanity configuration:

```bash
# Sanity Configuration
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_SANITY_DATASET=production

# Next.js Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Start the Development Servers

```bash
# Terminal 1: Start Next.js app
npm run dev

# Terminal 2: Start Sanity Studio
npm run studio
```

### 3. Access Your CMS

- **Sanity Studio**: http://localhost:3333
- **Admin Dashboard**: http://localhost:3000/admin
- **Voting App**: http://localhost:3000

## 📊 CMS Features

### Content Types

#### 1. Image Voting (`imageVoting`)
The main content type for voting images.

**Fields:**
- **Title** (required): Image title
- **Description**: Optional description
- **Image** (required): The actual image file
- **Category** (required): Image category
- **Tags**: Array of tags for organization
- **Status**: Active, Draft, or Archived
- **Featured**: Boolean to mark featured images
- **Difficulty**: Easy, Medium, or Hard voting difficulty
- **Metadata**: Alt text, credit, and location information

#### 2. Category (`category`)
Organize images into categories.

**Fields:**
- **Name** (required): Category name
- **Slug** (required): URL-friendly identifier
- **Description**: Category description
- **Icon**: Emoji or icon
- **Color**: Hex color code
- **Active**: Whether category is active
- **Sort Order**: Display order

#### 3. Voting Session (`votingSession`)
Track voting analytics and results.

**Fields:**
- **Session ID**: Unique session identifier
- **Start/End Time**: Session duration
- **Status**: Active, Completed, or Paused
- **Votes**: Array of individual votes with timestamps
- **Metadata**: User agent, IP, referrer info

### Admin Dashboard Features

- **Statistics Cards**: Total images, featured images, categories, active images
- **Image Grid**: Visual display of all images with status badges
- **Quick Actions**: Edit and delete buttons for each image
- **Sanity Studio Link**: Direct access to full CMS

## 🛠️ Content Management

### Adding Images

1. **Via Sanity Studio** (Recommended):
   - Go to http://localhost:3333
   - Click "Create new" → "Image Voting"
   - Fill in all required fields
   - Upload your image
   - Set status to "Active"
   - Save

2. **Via Admin Dashboard**:
   - Go to http://localhost:3000/admin
   - Click "Add Image" button
   - This will redirect you to Sanity Studio

### Managing Categories

1. Go to Sanity Studio
2. Navigate to "Categories" section
3. Create new categories with:
   - Descriptive names
   - Relevant icons (emojis work great)
   - Color coding for visual organization

### Featured Images

- Mark images as "Featured" to prioritize them in the voting app
- Featured images appear first in the image list
- Use this for special content or promotional images

### Image Status Management

- **Active**: Images available for voting
- **Draft**: Images being prepared (not shown in voting app)
- **Archived**: Retired images (not shown in voting app)

## 📈 Analytics & Tracking

### Voting Sessions

The CMS automatically tracks:
- Session duration
- Number of votes cast
- Average time per vote
- Individual vote details
- User metadata (anonymized)

### Accessing Analytics

1. Go to Sanity Studio
2. Navigate to "Voting Sessions"
3. View detailed session data
4. Export data for further analysis

## 🔧 Advanced Configuration

### Custom Categories

To add new categories:

1. Go to Sanity Studio → Categories
2. Create new category with:
   - Unique name
   - Descriptive slug
   - Relevant icon and color
   - Set as active

### Image Difficulty Levels

Configure difficulty levels in the image schema:
- **Easy**: Simple choices, quick decisions
- **Medium**: Balanced difficulty
- **Hard**: Complex or challenging choices

### SEO & Accessibility

Each image supports:
- **Alt Text**: For screen readers
- **Image Credit**: Attribution
- **Location**: Geographic context

## 🚀 Seeding Sample Data

To quickly populate your CMS with sample data:

```bash
# 1. Create a Sanity token (see below)
# 2. Add token to .env.local
# 3. Run the seed script
npm run seed
```

### Creating a Sanity Token

1. Go to https://www.sanity.io/manage
2. Select your project
3. Go to API section
4. Create new token with write permissions
5. Add to `.env.local`:
   ```bash
   SANITY_TOKEN=your_token_here
   ```

## 🔍 Troubleshooting

### Common Issues

**Images not showing in voting app:**
- Check image status is set to "Active"
- Verify image file is properly uploaded
- Check console for API errors

**Sanity Studio not loading:**
- Verify project ID in `.env.local`
- Check if studio is running on port 3333
- Ensure you're logged into Sanity

**Admin dashboard errors:**
- Check Sanity client configuration
- Verify environment variables
- Check network connectivity

### Getting Help

1. Check Sanity documentation: https://www.sanity.io/docs
2. Review Next.js documentation: https://nextjs.org/docs
3. Check the project README.md for general setup

## 📝 Best Practices

### Content Organization

1. **Use consistent naming**: Clear, descriptive titles
2. **Tag everything**: Use relevant tags for easy filtering
3. **Categorize properly**: Assign appropriate categories
4. **Add descriptions**: Helpful context for voters

### Image Management

1. **Optimize images**: Use appropriate file sizes
2. **Add alt text**: For accessibility
3. **Credit sources**: Always attribute photographers
4. **Set difficulty**: Help users know what to expect

### Workflow

1. **Draft first**: Create images as drafts
2. **Review content**: Check all fields before publishing
3. **Test voting**: Verify images work in the app
4. **Monitor analytics**: Track voting patterns

## 🎯 Next Steps

1. **Add your first images** using Sanity Studio
2. **Create categories** to organize content
3. **Test the voting app** with real content
4. **Monitor analytics** to understand user behavior
5. **Iterate and improve** based on feedback

Happy content managing! 🎉 