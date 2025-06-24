import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    // Get auth token from request headers
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const token = authHeader.substring(7)

    // Get preset ID and isBuiltIn flag from request body
    const body = await request.json()
    const presetId = body.presetId
    const isBuiltIn = body.isBuiltIn ?? false // Default to false if not provided

    if (!presetId) {
      return NextResponse.json({ error: 'Preset ID is required' }, { status: 400 })
    }

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

    // Check if favorite exists
    const { data: existingFavorite, error: checkError } = await supabase
      .from('preset_favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('preset_id', presetId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 means no rows returned
      console.error('Error checking favorite:', checkError)
      return NextResponse.json({ error: 'Failed to check favorite status' }, { status: 500 })
    }

    let result
    if (existingFavorite) {
      // Remove favorite
      result = await supabase
        .from('preset_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('preset_id', presetId)
    } else {
      // Add favorite
      result = await supabase
        .from('preset_favorites')
        .insert({
          user_id: user.id,
          preset_id: presetId,
          is_built_in: isBuiltIn
        })
    }

    if (result.error) {
      console.error('Error toggling favorite:', result.error)
      return NextResponse.json({ error: 'Failed to toggle favorite' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      isFavorite: !existingFavorite
    })

  } catch (error) {
    console.error('Toggle favorite error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 