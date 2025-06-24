"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth callback error:', error.message)
          router.push('/auth?error=Authentication failed')
          return
        }

        if (data.session) {
          // Authentication successful, redirect to main app
          router.push('/')
        } else {
          // No session found, redirect back to auth
          router.push('/auth')
        }
      } catch (error) {
        console.error('Unexpected error:', error)
        router.push('/auth?error=Something went wrong')
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500 mx-auto" />
        <h2 className="text-white text-xl">Completing authentication...</h2>
        <p className="text-gray-400">Please wait while we sign you in.</p>
      </div>
    </div>
  )
} 