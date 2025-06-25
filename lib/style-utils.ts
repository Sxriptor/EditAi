import { StyleAdjustments, ImportStyleValidation, ColorChannelAdjustments } from './types';

/**
 * Validates and transforms an imported style JSON object
 * @param importedJson The raw imported JSON object
 * @returns Validation result with supported adjustments and list of unsupported fields
 */
export function validateImportedStyle(importedJson: Record<string, any>): ImportStyleValidation {
  const supportedFields = new Set([
    // Basic adjustments
    'exposure', 'contrast', 'saturation', 'temperature', 'tint', 'gamma',
    'lift', 'gain', 'offset',
    'shadows', 'midtones', 'highlights',
    'vibrance', 'clarity', 'filmGrain', 'vignette',
    'bloom', 'halation', 'chromaticAberration',
    // Color wheels
    'shadowsWheel', 'midtonesWheel', 'highlightsWheel',
    'shadowsLum', 'midtonesLum', 'highlightsLum',
    // Channel adjustments
    'hueChannels', 'saturationChannels', 'luminanceChannels'
  ]);

  const channelFields = new Set(['hueChannels', 'saturationChannels', 'luminanceChannels']);
  const colorWheelFields = new Set(['shadowsWheel', 'midtonesWheel', 'highlightsWheel']);
  const unsupportedFields: string[] = [];
  const adjustments: StyleAdjustments = {};

  // Validate and transform fields
  Object.entries(importedJson).forEach(([key, value]) => {
    if (!supportedFields.has(key)) {
      unsupportedFields.push(key);
      return;
    }

    // Handle channel adjustments (hueChannels, saturationChannels, luminanceChannels)
    if (channelFields.has(key)) {
      if (typeof value === 'object' && value !== null) {
        const channelValue = value as Partial<ColorChannelAdjustments>;
        const channels: ColorChannelAdjustments = {
          red: Array.isArray(channelValue.red) ? channelValue.red : [Number(channelValue.red) || 0],
          green: Array.isArray(channelValue.green) ? channelValue.green : [Number(channelValue.green) || 0],
          blue: Array.isArray(channelValue.blue) ? channelValue.blue : [Number(channelValue.blue) || 0]
        };
        adjustments[key as keyof StyleAdjustments] = channels;
      }
    }
    // Handle color wheels
    else if (colorWheelFields.has(key)) {
      if (typeof value === 'object' && value !== null) {
        const wheelValue = value as { h?: number; s?: number; l?: number };
        adjustments[key as keyof StyleAdjustments] = {
          h: Number(wheelValue.h) || 0,
          s: Number(wheelValue.s) || 0,
          l: Number(wheelValue.l) || 0
        };
      }
    }
    // Handle numeric values (convert to array format)
    else if (typeof value === 'number' || typeof value === 'string') {
      const numValue = Number(value);
      if (!isNaN(numValue)) {
        adjustments[key as keyof StyleAdjustments] = [numValue];
      }
    }
    // Handle arrays (already in correct format)
    else if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'number') {
      adjustments[key as keyof StyleAdjustments] = value;
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
export function transformAdjustmentsForUI(adjustments: StyleAdjustments): Record<string, any> {
  const result: Record<string, any> = {};
  
  Object.entries(adjustments).forEach(([key, value]) => {
    // Pass through all values as-is since we now handle proper types
    result[key] = value;
  });
  
  return result;
} 