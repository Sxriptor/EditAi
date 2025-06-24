import { createClient } from '@supabase/supabase-js'

// Get Supabase URL and anon key from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Validate environment variables
if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}

if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Auth helper functions
export const auth = {
  // Sign up with email and password
  signUp: async (email: string, password: string, fullName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        }
      }
    })
    return { data, error }
  },

  // Sign in with email and password
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  },

  // Sign in with OAuth provider
  signInWithProvider: async (provider: 'google' | 'github') => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    return { data, error }
  },

  // Sign out
  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // Get current session
  getSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession()
    return { session, error }
  },

  // Get current user
  getUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  },

  // Reset password
  resetPassword: async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    })
    return { data, error }
  },

  // Update password
  updatePassword: async (password: string) => {
    const { data, error } = await supabase.auth.updateUser({
      password
    })
    return { data, error }
  }
}

// Database helper functions for ColorGrade app
export const db = {
  // User profiles
  profiles: {
    // Get user profile
    get: async (userId: string) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      return { data, error }
    },

    // Create or update user profile
    upsert: async (profile: any) => {
      const { data, error } = await supabase
        .from('profiles')
        .upsert(profile)
        .select()
      return { data, error }
    }
  },

  // Projects (color grading projects)
  projects: {
    // Get all projects for a user
    getAll: async (userId: string) => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      return { data, error }
    },

    // Create a new project
    create: async (project: any) => {
      const { data, error } = await supabase
        .from('projects')
        .insert(project)
        .select()
        .single()
      return { data, error }
    },

    // Update a project
    update: async (id: string, updates: any) => {
      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      return { data, error }
    },

    // Delete a project
    delete: async (id: string) => {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)
      return { error }
    }
  },

  // LUT presets
  luts: {
    // Get all public LUTs
    getPublic: async () => {
      const { data, error } = await supabase
        .from('luts')
        .select('*')
        .eq('is_public', true)
        .order('name')
      return { data, error }
    },

    // Get user's custom LUTs
    getUserLuts: async (userId: string) => {
      const { data, error } = await supabase
        .from('luts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      return { data, error }
    },

    // Create a new LUT
    create: async (lut: any) => {
      const { data, error } = await supabase
        .from('luts')
        .insert(lut)
        .select()
        .single()
      return { data, error }
    }
  },

  // AI-related functions
  ai: {
    // User editing preferences
    preferences: {
      // Get user preferences
      get: async (userId: string) => {
        const { data, error } = await supabase
          .from('user_editing_preferences')
          .select('*')
          .eq('user_id', userId)
          .single()
        return { data, error }
      },

      // Create or update user preferences  
      upsert: async (preferences: any) => {
        const { data, error } = await supabase
          .from('user_editing_preferences')
          .upsert(preferences)
          .select()
        return { data, error }
      }
    },

    // AI interactions
    interactions: {
      // Get user's AI interactions
      getAll: async (userId: string, limit: number = 20) => {
        const { data, error } = await supabase
          .from('ai_interactions')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(limit)
        return { data, error }
      },

      // Create a new AI interaction
      create: async (interaction: any) => {
        const { data, error } = await supabase
          .from('ai_interactions')
          .insert(interaction)
          .select()
          .single()
        return { data, error }
      },

      // Update interaction with feedback
      updateFeedback: async (id: string, feedback: 'positive' | 'negative' | 'modified') => {
        const { data, error } = await supabase
          .from('ai_interactions')
          .update({ user_feedback: feedback })
          .eq('id', id)
          .select()
        return { data, error }
      }
    },

    // Prompt templates
    templates: {
      // Get public templates
      getPublic: async () => {
        const { data, error } = await supabase
          .from('prompt_templates')
          .select('*')
          .eq('is_public', true)
          .order('usage_count', { ascending: false })
        return { data, error }
      },

      // Get user's templates
      getUserTemplates: async (userId: string) => {
        const { data, error } = await supabase
          .from('prompt_templates')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
        return { data, error }
      },

      // Create a new template
      create: async (template: any) => {
        const { data, error } = await supabase
          .from('prompt_templates')
          .insert(template)
          .select()
          .single()
        return { data, error }
      }
    }
  },

  // File storage
  storage: {
    // Upload image file
    uploadImage: async (bucket: string, path: string, file: File) => {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false
        })
      return { data, error }
    },

    // Get public URL for a file
    getPublicUrl: (bucket: string, path: string) => {
      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(path)
      return data.publicUrl
    },

    // Delete a file
    deleteFile: async (bucket: string, path: string) => {
      const { data, error } = await supabase.storage
        .from(bucket)
        .remove([path])
      return { data, error }
    }
  }
}

export default supabase 