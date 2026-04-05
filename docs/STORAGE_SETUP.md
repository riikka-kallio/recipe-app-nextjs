# Storage Bucket Configuration

This guide explains the storage bucket setup for the Recipe App.

## Bucket Structure

The app uses two public storage buckets:

### 1. recipe-images
- **Purpose**: Store recipe featured images
- **Access**: Public read, authenticated write
- **Max file size**: 5MB
- **Formats**: JPEG, PNG, WebP
- **URL pattern**: `https://<project>.supabase.co/storage/v1/object/public/recipe-images/<filename>`

### 2. blog-media
- **Purpose**: Store blog post featured images, inline images, and audio files
- **Access**: Public read, authenticated write
- **Max file size**: 10MB for audio, 5MB for images
- **Formats**: JPEG, PNG, WebP for images; WebM, MP3 for audio
- **URL pattern**: `https://<project>.supabase.co/storage/v1/object/public/blog-media/<filename>`

## Bucket Policies

Both buckets are configured as **public buckets**, which means:

- **Public Read**: Anyone with the URL can view files
- **Authenticated Write**: Only logged-in users can upload files
- **Unauthenticated Delete**: Not allowed

For Phase 7 (Authentication), we'll implement Row Level Security (RLS) policies so that:
- Users can only delete their own files
- Files are organized by user_id subdirectories

## File Organization (Future)

Once authentication is implemented, files will be organized as:

```
recipe-images/
  └── user-{userId}/
      ├── featured-image-{recipeId}.jpg
      └── featured-image-{recipeId}.png

blog-media/
  └── user-{userId}/
      ├── featured-image-{blogPostId}.jpg
      ├── inline-image-{uuid}.png
      └── audio-recording-{uuid}.webm
```

## Upload Endpoints (Phase 3)

The Next.js API routes will handle uploads:

```typescript
POST /api/upload/recipe-image
POST /api/upload/blog-media
POST /api/upload/audio
```

These endpoints will:
1. Validate file type and size
2. Generate unique filenames
3. Upload to Supabase Storage
4. Return the public URL
5. (Phase 7) Store file metadata in database

## Testing Uploads

To test storage buckets after setup:

1. Go to Supabase Storage in your project dashboard
2. Click on `recipe-images` bucket
3. Click **Upload file** (blue button)
4. Select any JPG or PNG image from your computer
5. Click **Upload**
6. Right-click the uploaded file and select **Copy URL**
7. Paste the URL in your browser - you should see the image

Repeat for `blog-media` bucket to confirm it's working.

## Deleting Files

To delete a file via the API (Phase 7 with authentication):

```typescript
const supabase = createClient()
await supabase.storage
  .from('recipe-images')
  .remove([`${userId}/featured-image-${recipeId}.jpg`])
```

## Troubleshooting

**Files uploaded but can't view them**
- Make sure the bucket is marked as "public"
- Check that the URL is correct (project name, bucket name)
- Verify browser isn't blocking mixed content (HTTP vs HTTPS)

**Upload fails with "Access Denied"**
- User must be authenticated (Phase 7)
- Check that the user has a valid session
- Verify the bucket name is spelled correctly

**Files appear then disappear**
- Check if there's a TTL (time-to-live) policy on the bucket
- Verify the storage quota hasn't been exceeded

## Storage Limits

**Free Tier Limits:**
- 1GB total storage (all buckets combined)
- Suitable for ~200 recipe images + 100 blog post images + audio

**Pro Tier** (if you exceed free limits):
- 100GB storage
- Cost: $25/month base + $0.025 per GB over 100GB
- Can upgrade anytime from Supabase project settings

To check current storage usage:
1. Go to Supabase project
2. Click **Project Settings** > **Billing** > **Storage**
3. View current usage in real-time
