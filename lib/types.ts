export interface ColorChannelAdjustments {
  red: number;
  green: number;
  blue: number;
}

export interface StyleAdjustments {
  // Basic adjustments
  exposure?: number;
  contrast?: number;
  saturation?: number;
  temperature?: number;
  tint?: number;
  gamma?: number;
  
  // Advanced adjustments
  lift?: number;
  gain?: number;
  offset?: number;
  
  // Tone adjustments
  shadows?: number;
  midtones?: number;
  highlights?: number;
  
  // Color wheels
  shadowsHue?: number;
  midtonesHue?: number;
  highlightsHue?: number;
  shadowsLum?: number;
  midtonesLum?: number;
  highlightsLum?: number;
  
  // Effects
  vibrance?: number;
  clarity?: number;
  filmGrain?: number;
  vignette?: number;
  bloom?: number;
  halation?: number;
  chromaticAberration?: number;
  
  // Channel adjustments
  hue?: ColorChannelAdjustments;
  saturationChannels?: ColorChannelAdjustments;
  luminanceChannels?: ColorChannelAdjustments;
}

export type StyleAdjustmentValue = number | ColorChannelAdjustments;

export interface ImportStyleValidation {
  isValid: boolean;
  unsupportedFields: string[];
  adjustments: StyleAdjustments;
} 