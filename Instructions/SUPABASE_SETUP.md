# Supabase Setup for ColorGrade.io

This guide will help you set up Supabase authentication and database for your ColorGrade application.

## Prerequisites

- A Supabase account (sign up at [supabase.com](https://supabase.com))
- Your existing Supabase database

## Step 1: Environment Variables

Create a `.env.local` file in your project root with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Optional: Service Role Key (for admin operations - keep this secret!)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### Getting Your Supabase Credentials

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Settings** > **API**
4. Copy the **Project URL** to `NEXT_PUBLIC_SUPABASE_URL`
5. Copy the **anon public** key to `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. (Optional) Copy the **service_role** key to `SUPABASE_SERVICE_ROLE_KEY`

## Step 2: Database Schema

Run the SQL commands from `database-schema.sql` in your Supabase SQL Editor:

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy and paste the contents of `database-schema.sql`
5. Run the query

This will create:
- **Tables**: `profiles`, `projects`, `luts`, `project_shares`
- **Storage buckets**: `images`, `videos`, `luts`, `thumbnails`
- **Row Level Security policies**
- **Triggers** for automatic profile creation and timestamp updates
- **Preset LUTs** (Cinematic Gold, Cyberpunk Neon, Vintage Film, Moody Blue)

## Step 3: Authentication Settings

### Email Configuration
1. Go to **Authentication** > **Settings**
2. Configure your **SMTP settings** for email verification
3. Customize your **email templates** if needed

### OAuth Providers (Optional)
To enable Google and GitHub login:

#### Google OAuth
1. Go to **Authentication** > **Providers**
2. Enable **Google**
3. Add your Google OAuth credentials:
   - Client ID
   - Client Secret
4. Add your domain to authorized redirect URIs

#### GitHub OAuth
1. Go to **Authentication** > **Providers**
2. Enable **GitHub**
3. Add your GitHub OAuth credentials:
   - Client ID
   - Client Secret

### Redirect URLs
Add these URLs to your **Authentication** > **URL Configuration**:
- Site URL: `http://localhost:3000` (development) / `https://your-domain.com` (production)
- Redirect URLs: 
  - `http://localhost:3000/auth/callback`
  - `https://your-domain.com/auth/callback`

## Step 4: Storage Configuration

1. Go to **Storage** > **Policies**
2. Verify the storage policies were created correctly
3. Adjust CORS settings if needed for file uploads

## Step 5: Test the Integration

1. Start your development server: `npm run dev`
2. Navigate to `/auth` in your browser
3. Try creating an account or signing in
4. Check that:
   - User profiles are created automatically
   - Authentication redirects work properly
   - File uploads work (if testing)

## Features Included

### 🔐 **Authentication**
- Email/password signup and login
- OAuth with Google and GitHub
- Automatic profile creation
- Session management
- Protected routes

### 🗄️ **Database Tables**
- **Profiles**: User profile information
- **Projects**: Color grading projects with metadata
- **LUTs**: Lookup tables (both preset and user-created)
- **Project Shares**: Sharing functionality for projects

### 📁 **File Storage**
- **Images**: Original and processed images
- **Videos**: Video files
- **LUTs**: .cube LUT files
- **Thumbnails**: Project thumbnails

### 🔒 **Security**
- Row Level Security on all tables
- User-based access control
- Secure file uploads
- Protected storage buckets

## Troubleshooting

### Common Issues

1. **"Invalid JWT" errors**: Check your environment variables
2. **CORS errors**: Verify your redirect URLs in Supabase settings
3. **Storage upload fails**: Check storage policies and bucket permissions
4. **OAuth not working**: Verify provider configuration and redirect URLs

### Development vs Production

Make sure to update your environment variables and Supabase settings when deploying to production:
- Update site URL and redirect URLs
- Use production domain instead of localhost
- Keep service role key secure

## Next Steps

With Supabase set up, your ColorGrade app now has:
- ✅ User authentication and profiles
- ✅ Database for storing projects and LUTs
- ✅ File storage for images and videos
- ✅ Real-time capabilities (if needed)
- ✅ Row-level security

You can now extend the app with features like:
- Project sharing between users
- Public LUT marketplace
- Real-time collaboration
- Advanced analytics

For more advanced features, check the [Supabase documentation](https://supabase.com/docs). 