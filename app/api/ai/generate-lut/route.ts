import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { preset, adjustments } = await request.json()

    if (!preset || !adjustments) {
      return NextResponse.json(
        { error: 'Preset and adjustments are required' },
        { status: 400 }
      )
    }

    // Generate .cube LUT file content
    const lutContent = generateCubeLUT(adjustments, preset.name)

    // Return the .cube file as a blob
    return new NextResponse(lutContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="${preset.name.toLowerCase().replace(/\s+/g, '-')}-lut.cube"`,
      },
    })
  } catch (error) {
    console.error('LUT generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate LUT' },
      { status: 500 }
    )
  }
}

function generateCubeLUT(adjustments: any, presetName: string): string {
  const lutSize = 64 // Standard LUT size
  const title = presetName || 'Amenta LUT'
  
  let lutContent = `TITLE "${title}"\n`
  lutContent += `LUT_3D_SIZE ${lutSize}\n`
  lutContent += `DOMAIN_MIN 0.0 0.0 0.0\n`
  lutContent += `DOMAIN_MAX 1.0 1.0 1.0\n\n`

  // Generate the 3D lookup table
  for (let b = 0; b < lutSize; b++) {
    for (let g = 0; g < lutSize; g++) {
      for (let r = 0; r < lutSize; r++) {
        // Normalize RGB values to 0-1 range
        const normalizedR = r / (lutSize - 1)
        const normalizedG = g / (lutSize - 1)
        const normalizedB = b / (lutSize - 1)

        // Apply color adjustments to get the transformed color
        const transformedColor = applyColorTransforms(
          normalizedR,
          normalizedG,
          normalizedB,
          adjustments
        )

        // Write the transformed RGB values
        lutContent += `${transformedColor.r.toFixed(6)} ${transformedColor.g.toFixed(6)} ${transformedColor.b.toFixed(6)}\n`
      }
    }
  }

  return lutContent
}

function applyColorTransforms(r: number, g: number, b: number, adjustments: any) {
  // Convert RGB to working space
  let red = r
  let green = g
  let blue = b

  // Apply exposure adjustment
  if (adjustments.exposure && adjustments.exposure[0] !== 0) {
    const exposureMultiplier = Math.pow(2, adjustments.exposure[0] / 100)
    red *= exposureMultiplier
    green *= exposureMultiplier
    blue *= exposureMultiplier
  }

  // Apply contrast adjustment
  if (adjustments.contrast && adjustments.contrast[0] !== 0) {
    const contrastFactor = (adjustments.contrast[0] / 100) * 0.5 + 1
    red = ((red - 0.5) * contrastFactor) + 0.5
    green = ((green - 0.5) * contrastFactor) + 0.5
    blue = ((blue - 0.5) * contrastFactor) + 0.5
  }

  // Apply brightness adjustment
  if (adjustments.brightness && adjustments.brightness[0] !== 0) {
    const brightnessFactor = adjustments.brightness[0] / 100
    red += brightnessFactor
    green += brightnessFactor
    blue += brightnessFactor
  }

  // Apply saturation adjustment
  if (adjustments.saturation && adjustments.saturation[0] !== 0) {
    const luminance = 0.299 * red + 0.587 * green + 0.114 * blue
    const saturationFactor = (adjustments.saturation[0] / 100) + 1
    red = luminance + (red - luminance) * saturationFactor
    green = luminance + (green - luminance) * saturationFactor
    blue = luminance + (blue - luminance) * saturationFactor
  }

  // Apply temperature adjustment (simplified)
  if (adjustments.temperature && adjustments.temperature[0] !== 0) {
    const tempFactor = adjustments.temperature[0] / 100
    if (tempFactor > 0) {
      // Warmer (more red/yellow)
      red += tempFactor * 0.1
      green += tempFactor * 0.05
    } else {
      // Cooler (more blue)
      blue += Math.abs(tempFactor) * 0.1
    }
  }

  // Apply gamma correction
  if (adjustments.gamma && adjustments.gamma[0] !== 1.0) {
    const gamma = adjustments.gamma[0]
    red = Math.pow(red, 1 / gamma)
    green = Math.pow(green, 1 / gamma)
    blue = Math.pow(blue, 1 / gamma)
  }

  // Apply highlights adjustment
  if (adjustments.highlights && adjustments.highlights[0] !== 0) {
    const highlightFactor = adjustments.highlights[0] / 100
    const highlightMask = Math.max(0, Math.min(1, (Math.max(red, green, blue) - 0.5) * 2))
    red += highlightFactor * highlightMask * 0.3
    green += highlightFactor * highlightMask * 0.3
    blue += highlightFactor * highlightMask * 0.3
  }

  // Apply shadows adjustment
  if (adjustments.shadows && adjustments.shadows[0] !== 0) {
    const shadowFactor = adjustments.shadows[0] / 100
    const shadowMask = Math.max(0, Math.min(1, (0.5 - Math.min(red, green, blue)) * 2))
    red += shadowFactor * shadowMask * 0.3
    green += shadowFactor * shadowMask * 0.3
    blue += shadowFactor * shadowMask * 0.3
  }

  // Apply vibrance (more selective saturation)
  if (adjustments.vibrance && adjustments.vibrance[0] !== 0) {
    const luminance = 0.299 * red + 0.587 * green + 0.114 * blue
    const maxChannel = Math.max(red, green, blue)
    const vibrance = adjustments.vibrance[0] / 100
    const vibranceMask = 1 - Math.abs(maxChannel - luminance)
    const vibranceFactor = 1 + vibrance * vibranceMask
    red = luminance + (red - luminance) * vibranceFactor
    green = luminance + (green - luminance) * vibranceFactor
    blue = luminance + (blue - luminance) * vibranceFactor
  }

  // Apply hue shift
  if (adjustments.hue && adjustments.hue[0] !== 0) {
    const hueShift = (adjustments.hue[0] / 100) * Math.PI / 3 // Convert to radians
    const cos_hue = Math.cos(hueShift)
    const sin_hue = Math.sin(hueShift)
    
    // RGB to YIQ color space rotation for hue shift
    const y = 0.299 * red + 0.587 * green + 0.114 * blue
    const i = 0.596 * red - 0.275 * green - 0.321 * blue
    const q = 0.212 * red - 0.523 * green + 0.311 * blue
    
    const i_new = i * cos_hue - q * sin_hue
    const q_new = i * sin_hue + q * cos_hue
    
    red = y + 0.956 * i_new + 0.621 * q_new
    green = y - 0.272 * i_new - 0.647 * q_new
    blue = y - 1.106 * i_new + 1.703 * q_new
  }

  // Clamp values to valid range
  red = Math.max(0, Math.min(1, red))
  green = Math.max(0, Math.min(1, green))
  blue = Math.max(0, Math.min(1, blue))

  return { r: red, g: green, b: blue }
} 