import { StyleAdjustments, ImportStyleValidation, ColorChannelAdjustments } from './types';

/**
 * Validates and transforms an imported style JSON object
 * @param importedJson The raw imported JSON object
 * @returns Validation result with supported adjustments and list of unsupported fields
 */
export function validateImportedStyle(importedJson: Record<string, any>): ImportStyleValidation {
  const supportedFields = new Set([
    'exposure', 'contrast', 'saturation', 'temperature', 'tint', 'gamma',
    'lift', 'gain', 'offset',
    'shadows', 'midtones', 'highlights',
    'shadowsHue', 'midtonesHue', 'highlightsHue',
    'shadowsLum', 'midtonesLum', 'highlightsLum',
    'vibrance', 'clarity', 'filmGrain', 'vignette',
    'bloom', 'halation', 'chromaticAberration',
    'hue', 'saturationChannels', 'luminanceChannels'
  ]);

  const channelFields = new Set(['hue', 'saturationChannels', 'luminanceChannels']);
  const unsupportedFields: string[] = [];
  const adjustments: StyleAdjustments = {};

  // Validate and transform fields
  Object.entries(importedJson).forEach(([key, value]) => {
    if (!supportedFields.has(key)) {
      unsupportedFields.push(key);
      return;
    }

    // Handle channel adjustments (hue, saturation, luminance)
    if (channelFields.has(key)) {
      if (typeof value === 'object' && value !== null) {
        const channelValue = value as Partial<ColorChannelAdjustments>;
        const channels: ColorChannelAdjustments = {
          red: Number(channelValue.red) || 0,
          green: Number(channelValue.green) || 0,
          blue: Number(channelValue.blue) || 0
        };
        adjustments[key as keyof Pick<StyleAdjustments, 'hue' | 'saturationChannels' | 'luminanceChannels'>] = channels;
      }
    } 
    // Handle numeric values
    else if (typeof value === 'number' || typeof value === 'string') {
      const numValue = Number(value);
      if (!isNaN(numValue)) {
        adjustments[key as keyof Omit<StyleAdjustments, 'hue' | 'saturationChannels' | 'luminanceChannels'>] = numValue;
      }
    }
  });

  return {
    isValid: unsupportedFields.length === 0,
    unsupportedFields,
    adjustments
  };
}

/**
 * Transforms the adjustments into the format expected by the UI
 */
export function transformAdjustmentsForUI(adjustments: StyleAdjustments): Record<string, number[]> {
  const result: Record<string, number[]> = {};
  
  Object.entries(adjustments).forEach(([key, value]) => {
    // Skip channel adjustments as they're handled separately
    if (typeof value === 'object') return;
    
    // Convert single numbers to array format expected by UI
    if (typeof value === 'number') {
      result[key] = [value];
    }
  });
  
  return result;
} 