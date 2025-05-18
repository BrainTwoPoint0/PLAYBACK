# Playback Website Blog Implementation Guide

This guide provides step-by-step instructions for implementing a blog feature on the Playback website, focusing on press releases, announcements, partnerships, and launches.

## Table of Contents

1. [Overview](#overview)
2. [Schema Enhancement](#schema-enhancement)
3. [Creating Reusable Components](#creating-reusable-components)
4. [Homepage Integration](#homepage-integration)
5. [Press Page Implementation](#press-page-implementation)
6. [Individual Blog Post Pages](#individual-blog-post-pages)
7. [Sanity Client Setup](#sanity-client-setup)
8. [Styling and UI Considerations](#styling-and-ui-considerations)

## Overview

The blog implementation will consist of:

- Enhanced Sanity schema for press releases
- A reusable card component for blog post previews
- Homepage integration showing the latest 4 posts
- A dedicated press page showing all posts
- Individual blog post pages with full content

## Schema Enhancement

The existing `pressRelease.ts` schema needs to be enhanced to support more blog-like features:

1. Update `src/sanity/schemaTypes/pressRelease.ts`:

   - Add a `slug` field for URL generation
   - Change `date` to `publishedAt` with datetime type
   - Rename `imgurl` to `coverImage` for clarity
   - Add an `excerpt` field for preview cards
   - Enhance the content field with better block content support
   - Add categories for organization

2. Create a new `category.ts` schema for categorizing posts:

   - Include fields for title and description
   - Set up references between categories and press releases

3. Update `src/sanity/schemaTypes/index.ts` to include the new schema

## Creating Reusable Components

Create a reusable blog post card component:

1. Create `src/components/ui/blog-card.tsx`:

   - Design a card that displays post title, date, image, and excerpt
   - Make it responsive and visually appealing
   - Use shadcn/ui components for consistent styling
   - Include hover effects for better user interaction

2. Add utility functions for formatting dates and handling images:
   - Create a `formatDate` function in `src/lib/utils.ts`
   - Set up image URL builder for Sanity images and refer to `src/app/press/page.tsx`

## Homepage Integration

Integrate the blog feature into the homepage:

1. Update `src/app/page.tsx`:
   - Fetch the latest 4 press releases
   - Add a "Latest News" section
   - Display blog post cards in a responsive grid
   - Include a "View all news" link to the press page

## Press Page Implementation

Enhance the press page to display all blog posts:

1. Update `src/app/press/page.tsx`:
   - Fetch all press releases ordered by publish date
   - Display them in a responsive grid using the blog card component
   - Add proper metadata for SEO
   - Include a header and description

## Individual Blog Post Pages

Create dynamic routes for individual blog posts:

1. Create `src/app/press/[slug]/page.tsx`:
   - Set up dynamic routing based on post slugs
   - Fetch the full post content by slug
   - Display the post with proper formatting
   - Include metadata for SEO
   - Add navigation back to the press page
   - Support rich content with images and formatting

## Sanity Client Setup

Set up the necessary Sanity client functions:

1. Create `src/lib/sanity.client.ts`:

   - Add functions to fetch latest posts
   - Add functions to fetch all posts
   - Add functions to fetch posts by slug
   - Add functions to fetch all slugs for static generation

2. Create `src/lib/sanity.image.ts`:

   - Set up image URL builder for Sanity images

3. Create `src/lib/sanity.api.ts`:
   - Configure Sanity API settings

## Styling and UI Considerations

1. Use shadcn/ui components for consistent styling
2. Ensure responsive design for all screen sizes
3. Optimize images with Next.js Image component
4. Add hover effects for better user interaction
5. Use proper typography and spacing
6. Ensure accessibility with proper contrast and alt text

## Implementation Steps

1. **Enhance the Schema**:

   - Update the existing press release schema
   - Create the category schema
   - Update the schema index

2. **Create Components**:

   - Build the blog card component
   - Add utility functions

3. **Update Pages**:

   - Integrate with the homepage
   - Enhance the press page
   - Create individual blog post pages

4. **Set Up Sanity Client**:

   - Create client functions
   - Set up image handling
   - Configure API settings

5. **Test and Refine**:
   - Create test content in Sanity
   - Test all pages and components
   - Refine styling and functionality

By following these steps, you'll have a fully functional blog feature on the Playback website, allowing you to publish and showcase press releases, announcements, partnerships, and launches.
