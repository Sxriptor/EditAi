import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    // Get auth token from request headers
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const token = authHeader.substring(7)

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    )

    // Get user ID
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Load user's favorites
    const { data: favorites, error: favoritesError } = await supabase
      .from('preset_favorites')
      .select('preset_id')
      .eq('user_id', user.id)

    if (favoritesError) {
      console.error('Error loading favorites:', favoritesError)
      return NextResponse.json({ error: 'Failed to load favorites' }, { status: 500 })
    }

    return NextResponse.json({
      favorites: favorites.map(f => f.preset_id)
    })

  } catch (error) {
    console.error('Load favorites error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 