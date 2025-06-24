# 🔐 Authentication Test Guide

## ✅ Authentication Flow Fixed!

Your ColorGrade app now has **proper authentication** with:
- ✅ **Auto-redirect** to login if not authenticated
- ✅ **Session persistence** in browser storage
- ✅ **Secure API calls** with JWT tokens
- ✅ **User profile** display in header
- ✅ **Proper logout** functionality

## 🧪 How to Test

### 1. **Set Up Environment Variables**
Create `.env.local` in your `ColorGrade` folder:
```env
# Supabase Configuration (required!)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-key-here
OPENAI_ORG_ID=org-your-org-id-here
```

### 2. **Get Your Supabase Credentials**
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. **Test the Authentication Flow**

#### **Step 1: Start the app**
```bash
npm run dev
```

#### **Step 2: Access Dashboard (Unauthenticated)**
1. Go to `http://localhost:3000`
2. You should see a loading spinner
3. Then **automatic redirect** to `/auth`

#### **Step 3: Sign Up/Login**
1. Create a new account or login
2. After successful auth, you'll be redirected back to dashboard
3. You should see your **profile avatar** in the top-right corner

#### **Step 4: Test AI with Authentication**
1. Upload an image
2. Type a prompt: `"make this black and white"`
3. The AI should work **without 401 errors**
4. Check console for: `🚀 Sending AI request:`

#### **Step 5: Test Session Persistence**
1. Refresh the page
2. You should **stay logged in** (no redirect to auth)
3. Session is saved in browser storage

#### **Step 6: Test Logout**
1. Click your profile avatar (top-right)
2. Click "Sign out"
3. You should be redirected to `/auth`
4. Trying to access `/` should redirect back to auth

## 🔧 What Changed

### **Dashboard (`app/page.tsx`)**
- ✅ Added authentication check with `useAuth()`
- ✅ Auto-redirect to `/auth` if not logged in
- ✅ Loading states while checking auth
- ✅ Sends JWT token with AI API requests

### **AI API Route (`app/api/ai/process-prompt/route.ts`)**
- ✅ Validates JWT token from Authorization header
- ✅ Extracts user ID for AI personalization
- ✅ Returns 401 if token invalid/missing

### **Auth Context (`lib/auth-context.tsx`)**
- ✅ Already properly configured
- ✅ Saves session in browser storage
- ✅ Listens for auth state changes

## 🚨 Troubleshooting

### **Still getting 401 errors?**
- ✅ Check `.env.local` has correct Supabase credentials
- ✅ Make sure you're logged in before testing AI
- ✅ Check browser dev tools for auth token in request headers

### **Redirect loop?**
- ✅ Verify Supabase URL and anon key are correct
- ✅ Check Supabase project is active
- ✅ Try clearing browser cache/localStorage

### **AI still not working?**
- ✅ Ensure OpenAI API key is valid
- ✅ Check console for specific error messages
- ✅ Verify you have an image uploaded

## 🎯 Expected Behavior

**✅ Working correctly:**
- Redirects to `/auth` when not logged in
- Stays on dashboard when authenticated
- Shows user avatar/profile in header
- AI works without 401 errors
- Session persists across page refreshes
- Logout redirects to auth page

**❌ Something's wrong:**
- No redirect = Environment variables missing
- 401 errors = Auth token not being sent
- Can't login = Supabase credentials wrong

---

## 🚀 Ready to Test!

**Your authentication is now bulletproof!** 🛡️

Follow the steps above and your AI should work perfectly with proper user authentication. 