import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    // Get auth token from request headers (optional for public presets)
    const authHeader = request.headers.get('authorization')
    let token = null
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    }

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      token ? {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      } : {}
    )

    let user = null
    if (token) {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      user = authUser
    }

    // Load built-in presets (from lut_presets table)
    const { data: builtInPresets, error: builtInError } = await supabase
      .from('lut_presets')
      .select('*')
      .eq('is_default', true)

    if (builtInError) {
      console.error('Error loading built-in presets:', builtInError)
    }

    // Load user's custom LUTs (from luts table)
    let userLuts = []
    if (user) {
      const { data: customLuts, error: customError } = await supabase
        .from('luts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (customError) {
        console.error('Error loading user LUTs:', customError)
      } else {
        userLuts = customLuts || []
      }
    }

    // Format and combine presets
    const formattedBuiltIns = (builtInPresets || []).map(preset => ({
      id: preset.id,
      name: preset.name,
      preview: generatePreviewGradient(preset.color_adjustments),
      category: preset.category || 'built-in',
      strength: calculateStyleStrength(preset.color_adjustments),
      colorAdjustments: preset.color_adjustments,
      isBuiltIn: true
    }))

    const formattedUserLuts = userLuts.map(lut => ({
      id: lut.id,
      name: lut.name,
      preview: generatePreviewGradient(lut.adjustments),
      category: 'custom',
      strength: calculateStyleStrength(lut.adjustments),
      colorAdjustments: lut.adjustments,
      isBuiltIn: false,
      created_at: lut.created_at
    }))

    return NextResponse.json({
      presets: [...formattedBuiltIns, ...formattedUserLuts]
    })

  } catch (error) {
    console.error('Load LUTs error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function calculateStyleStrength(adjustments: any): number {
  if (!adjustments) return 50
  
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
  if (!adjustments) return 'bg-gradient-to-r from-gray-600 to-gray-400'
  
  const temp = adjustments.temperature?.[0] || 0
  const sat = adjustments.saturation?.[0] || 0
  const contrast = adjustments.contrast?.[0] || 0
  const exposure = adjustments.exposure?.[0] || 0
  const vibrance = adjustments.vibrance?.[0] || 0
  
  // Calculate dominant effect
  const effects = {
    warm: temp > 0 ? temp : 0,
    cool: temp < 0 ? -temp : 0,
    saturated: sat > 0 || vibrance > 0 ? Math.max(sat, vibrance) : 0,
    contrast: contrast > 0 ? contrast : 0,
    bright: exposure > 0 ? exposure : 0,
    dark: exposure < 0 ? -exposure : 0
  }

  const dominantEffect = Object.entries(effects).reduce((a, b) => a[1] > b[1] ? a : b)[0]
  
  // Define gradient pairs based on dominant effect
  const gradients: Record<string, { from: string, to: string }> = {
    warm: { from: 'from-orange-500', to: 'to-yellow-400' },
    cool: { from: 'from-blue-500', to: 'to-cyan-400' },
    saturated: { from: 'from-purple-500', to: 'to-pink-500' },
    contrast: { from: 'from-gray-800', to: 'to-gray-200' },
    bright: { from: 'from-yellow-300', to: 'to-orange-300' },
    dark: { from: 'from-gray-900', to: 'to-gray-700' }
  }

  // Get gradient colors
  const { from, to } = gradients[dominantEffect]
  
  return `bg-gradient-to-r ${from} ${to}`
} 