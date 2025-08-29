# Profile Picture Setup Guide

## Issue Identified

The profile picture upload functionality is not working because the required Supabase Storage bucket `trainer-bucket` doesn't exist.

## Required Setup

### 1. Create Supabase Storage Bucket

**In your Supabase Dashboard:**

1. Go to **Storage** in the left sidebar
2. Click **"Create a new bucket"**
3. Set bucket name: `trainer-bucket`
4. Set bucket as **Public** (so images can be accessed)
5. Click **"Create bucket"**

### 2. Configure Storage Policies

**After creating the bucket, set up RLS policies:**

```sql
-- Allow authenticated users to upload profile pictures
CREATE POLICY "Allow authenticated users to upload profile pictures" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'trainer-bucket' AND 
  auth.role() = 'authenticated'
);

-- Allow public read access to profile pictures
CREATE POLICY "Allow public read access to profile pictures" ON storage.objects
FOR SELECT USING (
  bucket_id = 'trainer-bucket'
);

-- Allow users to update their own profile pictures
CREATE POLICY "Allow users to update their own profile pictures" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'trainer-bucket' AND 
  auth.role() = 'authenticated'
);

-- Allow users to delete their own profile pictures
CREATE POLICY "Allow users to delete their own profile pictures" ON storage.objects
FOR DELETE USING (
  bucket_id = 'trainer-bucket' AND 
  auth.role() = 'authenticated'
);
```

### 3. Database Schema Verification

Ensure your `trainer` table has both columns:
- `avatar_url` (from original migration)
- `profile_picture_url` (from trainer signup migration)

```sql
-- Check if both columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'trainer' 
AND column_name IN ('avatar_url', 'profile_picture_url');
```

## Implementation Details

### Profile Picture Upload Flow

1. **During Registration:**
   - User selects profile picture in Step 1
   - Picture is uploaded to `trainer-bucket/trainer-profiles/{trainerId}.{ext}`
   - URL is saved to `profile_picture_url` column

2. **During Profile Updates:**
   - User uploads new picture via TrainerProfilePage
   - Picture replaces existing file in storage
   - URL is updated in `profile_picture_url` column

3. **Display Logic:**
   - Components check `profile_picture_url` first
   - Fall back to `avatar_url` for backward compatibility
   - Show default avatar if neither exists

### File Structure in Storage

```
trainer-bucket/
├── trainer-profiles/
│   ├── {trainerId1}.jpg
│   ├── {trainerId2}.png
│   └── ...
└── test-uploads/ (for testing)
```

### Code Changes Made

1. **Updated `trainer-account-service.ts`:**
   - Added `uploadProfilePicture()` function
   - Added `uploadTrainerProfilePicture()` function
   - Modified `createTrainerAccount()` to handle profile pictures

2. **Updated `TrainerRegistration.tsx`:**
   - Passes profile picture to account creation service
   - Handles progressive profile picture uploads

3. **Updated Display Components:**
   - **TopBar.tsx**: Checks both `profile_picture_url` and `avatar_url`
   - **Sidebar.tsx**: Checks both `profile_picture_url` and `avatar_url`
   - **TrainerProfilePage.tsx**: Saves to `profile_picture_url`

## Testing

After setting up the bucket, run the test:

```bash
node test-profile-picture-upload.mjs
```

This will verify:
- Bucket exists and is accessible
- File uploads work
- Database schema is correct
- Existing trainer records

## Troubleshooting

### Common Issues

1. **"Bucket not found"**
   - Create the `trainer-bucket` in Supabase Storage
   - Ensure bucket is public

2. **"Upload failed"**
   - Check storage policies
   - Verify bucket permissions
   - Check file size limits

3. **"Image not displaying"**
   - Verify public URL generation
   - Check CORS settings
   - Ensure image format is supported

4. **"Database column missing"**
   - Run the trainer signup migration
   - Verify both `avatar_url` and `profile_picture_url` exist

### Debug Steps

1. Check browser console for upload errors
2. Verify Supabase Storage bucket exists
3. Test file upload manually in Supabase Dashboard
4. Check database for profile picture URLs
5. Verify storage policies are correct

## Security Considerations

1. **File Size Limits**: Consider implementing file size restrictions
2. **File Type Validation**: Only allow image files (jpg, png, etc.)
3. **Virus Scanning**: Consider implementing virus scanning for uploaded files
4. **CDN**: For production, consider using a CDN for better performance

## Performance Optimization

1. **Image Compression**: Implement client-side image compression
2. **Thumbnail Generation**: Generate thumbnails for faster loading
3. **Lazy Loading**: Implement lazy loading for profile pictures
4. **Caching**: Set appropriate cache headers for images 