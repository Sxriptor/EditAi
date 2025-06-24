# EditAI 🎨

A professional AI-powered color grading application built with Next.js 15, Supabase, and TypeScript. Transform your images and videos with intelligent color correction, professional LUT presets, and advanced editing tools.

![EditAI](./public/placeholder-logo.svg)

## ✨ Features

### 🔐 Authentication & User Management
- **Supabase Authentication**: Secure signup/signin with email and password
- **OAuth Integration**: Google and GitHub social authentication
- **User Profiles**: Automatic profile creation with avatar support
- **Session Management**: Persistent authentication state

### 🎨 AI-Powered Color Grading
- **Natural Language Processing**: Describe your desired look in plain English
- **Intelligent Color Adjustment**: AI parses prompts like "make it warmer and more cinematic"
- **Real-time Preview**: Instant visual feedback as you adjust parameters
- **Professional Controls**: Fine-tune brightness, contrast, saturation, and more

### 🎬 Professional LUT Presets
- **Cinematic Gold**: Warm, film-like color grading
- **Cyberpunk Neon**: Futuristic, high-contrast look
- **Vintage Film**: Classic analog film aesthetic
- **Moody Blue**: Cool, atmospheric color palette

### 📹 Advanced Video Processing
- **4K Video Support**: Handle high-resolution videos up to 1GB
- **Multiple Formats**: Support for MP4, WebM, QuickTime, and more
- **Thumbnail Generation**: Automatic timeline thumbnails for frame navigation
- **Video Metadata**: Extract duration, resolution, and aspect ratio information

### 🛠️ Project Management
- **Save & Load Projects**: Persistent project storage with Supabase
- **Project Duplication**: Clone existing projects with one click
- **Template System**: Save and reuse your favorite color grading setups
- **Export Queue**: Batch processing with status tracking

### 🔄 Batch Processing
- **Multiple File Support**: Process several images/videos simultaneously
- **Progress Tracking**: Real-time progress indicators for each item
- **Queue Management**: Add, remove, and prioritize processing jobs

### 🎯 Advanced Features
- **Color Palette Extraction**: Automatically detect dominant colors
- **Diagonal Comparison**: Before/after split view
- **Export Options**: Multiple quality and format options
- **Responsive Design**: Optimized for desktop and mobile devices

## 🚀 Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI, Lucide Icons
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Deployment**: Vercel-ready
- **Development**: ESLint, Prettier, Git

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/sxriptor/EditAI.git
   cd EditAI
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up Supabase database**
   - Follow the detailed instructions in `SUPABASE_SETUP.md`
   - Run the SQL migrations in `database-schema.sql`

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open in browser**
   Navigate to `http://localhost:3000`

## 🗄️ Database Schema

The application uses a comprehensive database schema with:

- **profiles**: User profile information
- **projects**: Color grading projects
- **luts**: Look-Up Tables for color grading
- **project_shares**: Collaborative project sharing
- **Storage buckets**: Images, videos, LUTs, thumbnails

See `database-schema.sql` for the complete schema and `SUPABASE_SETUP.md` for setup instructions.

## 🔧 Configuration

### Supabase Setup
1. Create a new Supabase project
2. Configure authentication providers (Google, GitHub)
3. Set up Row Level Security policies
4. Create storage buckets
5. Run database migrations

### OAuth Configuration
- **Google**: Set up OAuth in Google Cloud Console
- **GitHub**: Configure OAuth app in GitHub Developer Settings

Detailed setup instructions are available in `SUPABASE_SETUP.md`.

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy with automatic builds

### Other Platforms
The app is compatible with any Node.js hosting platform:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 📖 Usage

1. **Sign up/Sign in**: Create an account or use social authentication
2. **Upload Media**: Drag and drop images or videos
3. **Apply Color Grading**: Use AI prompts or manual controls
4. **Save Projects**: Store your work for later editing
5. **Export Results**: Download your enhanced media

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Database by [Supabase](https://supabase.com/)
- UI components from [Radix UI](https://www.radix-ui.com/)
- Icons by [Lucide](https://lucide.dev/)

## 📞 Support

For support, email support@editai.com or join our Discord community.

---

**EditAI** - Transform your media with AI-powered color grading ✨ 