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
    
    // Create Supabase client with service role for server-side operations
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
    
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, colorAdjustments, category, isUpdate, existingId } = await request.json()

    if (!name || !colorAdjustments) {
      return NextResponse.json(
        { error: 'Name and color adjustments are required' },
        { status: 400 }
      )
    }

    // Calculate preview gradient and strength
    const strength = calculateStyleStrength(colorAdjustments)
    const previewGradient = generatePreviewGradient(colorAdjustments)

    if (isUpdate && existingId) {
      // Update existing LUT
      const { data, error } = await supabase
        .from('luts')
        .update({
          name,
          adjustments: colorAdjustments,
          description: `Custom style preset - ${strength}% strength`,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingId)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        console.error('Update LUT error:', error)
        return NextResponse.json({ error: 'Failed to update LUT' }, { status: 500 })
      }

      return NextResponse.json({ 
        message: 'LUT updated successfully',
        lut: {
          ...data,
          preview: previewGradient,
          strength
        }
      })
    } else {
      // Create new LUT
      const { data, error } = await supabase
        .from('luts')
        .insert({
          user_id: user.id,
          name,
          description: `Custom style preset - ${strength}% strength`,
          adjustments: colorAdjustments,
          is_public: false,
          is_preset: false,
          tags: [category || 'custom', 'user-created']
        })
        .select()
        .single()

      if (error) {
        console.error('Create LUT error:', error)
        return NextResponse.json({ error: 'Failed to create LUT' }, { status: 500 })
      }

      return NextResponse.json({ 
        message: 'LUT saved successfully',
        lut: {
          ...data,
          preview: previewGradient,
          strength
        }
      })
    }
  } catch (error) {
    console.error('Save LUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function calculateStyleStrength(adjustments: any): number {
  let totalChange = 0
  let adjustmentCount = 0
  
  Object.entries(adjustments).forEach(([key, value]: [string, any]) => {
    if (Array.isArray(value) && value.length > 0) {
      totalChange += Math.abs(value[0])
      adjustmentCount++
    }
  })
  
  return adjustmentCount > 0 ? Math.min(100, Math.round(totalChange / adjustmentCount)) : 50
}

function generatePreviewGradient(adjustments: any): string {
  const temp = adjustments.temperature?.[0] || 0
  const saturation = adjustments.saturation?.[0] || 0
  const contrast = adjustments.contrast?.[0] || 0
  
  let fromColor = 'from-gray-600'
  let toColor = 'to-gray-400'
  
  if (temp > 0) {
    fromColor = 'from-orange-500'
    toColor = saturation > 0 ? 'to-red-600' : 'to-orange-400'
  } else if (temp < 0) {
    fromColor = 'from-blue-500'
    toColor = saturation > 0 ? 'to-cyan-600' : 'to-blue-400'
  } else if (saturation > 0) {
    fromColor = 'from-purple-500'
    toColor = 'to-pink-500'
  } else if (contrast > 0) {
    fromColor = 'from-gray-800'
    toColor = 'to-gray-200'
  }
  
  return `bg-gradient-to-r ${fromColor} ${toColor}`
} 