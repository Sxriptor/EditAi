// Channel adjustment types
export interface ColorChannelAdjustments {
  red: number[];
  green: number[];
  blue: number[];
}

// Color wheel adjustment type
export interface ColorWheelAdjustment {
  h: number;
  s: number;
  l: number;
}

// Main color grading types
export interface ColorAdjustments {
  // Basic Tone Controls
  exposure: number[];
  contrast: number[];
  saturation: number[];
  temperature: number[];
  tint: number[];
  
  // Tone Region Controls
  shadows: number[];
  midtones: number[];
  highlights: number[];
  gamma: number[];
  lift: number[];
  gain: number[];
  offset: number[];
  
  // Creative Controls
  vibrance: number[];
  clarity: number[];
  filmGrain: number[];
  vignette: number[];

  // Color Wheels
  shadowsWheel: ColorWheelAdjustment;
  midtonesWheel: ColorWheelAdjustment;
  highlightsWheel: ColorWheelAdjustment;
  shadowsLum: number[];
  midtonesLum: number[];
  highlightsLum: number[];

  // Channel Mixers
  hueChannels: ColorChannelAdjustments;
  saturationChannels: ColorChannelAdjustments;
  luminanceChannels: ColorChannelAdjustments;

  // Special Effects
  bloom: number[];
  halation: number[];
  chromaticAberration: number[];
}

// Type for importing/exporting styles
export type StyleAdjustments = Partial<ColorAdjustments>;

// Validation types for style import/export
export interface ImportStyleValidation {
  isValid: boolean;
  unsupportedFields: string[];
  adjustments: StyleAdjustments;
}

// Parameter ranges for validation and UI
export const ADJUSTMENT_RANGES = {
  // Basic Tone Controls
  exposure: { min: -100, max: 100, default: 0 },
  contrast: { min: -100, max: 100, default: 0 },
  saturation: { min: -100, max: 100, default: 0 },
  temperature: { min: -100, max: 100, default: 0 },
  tint: { min: -100, max: 100, default: 0 },
  
  // Tone Region Controls
  shadows: { min: -100, max: 100, default: 0 },
  midtones: { min: -100, max: 100, default: 0 },
  highlights: { min: -100, max: 100, default: 0 },
  gamma: { min: 0.1, max: 3.0, default: 1.0 },
  lift: { min: 0.1, max: 3.0, default: 1.0 },
  gain: { min: 0.1, max: 3.0, default: 1.0 },
  offset: { min: 0.1, max: 3.0, default: 1.0 },
  
  // Creative Controls
  vibrance: { min: -100, max: 100, default: 0 },
  clarity: { min: -100, max: 100, default: 0 },
  filmGrain: { min: 0, max: 100, default: 0 },
  vignette: { min: -100, max: 100, default: 0 },

  // Luminance Controls
  shadowsLum: { min: -100, max: 100, default: 0 },
  midtonesLum: { min: -100, max: 100, default: 0 },
  highlightsLum: { min: -100, max: 100, default: 0 },

  // Channel Controls
  hueChannel: { min: -180, max: 180, default: 0 },
  saturationChannel: { min: -100, max: 100, default: 0 },
  luminanceChannel: { min: -100, max: 100, default: 0 },

  // Special Effects
  bloom: { min: 0, max: 100, default: 0 },
  halation: { min: 0, max: 100, default: 0 },
  chromaticAberration: { min: 0, max: 100, default: 0 }
} as const;

// Grouping structure for UI organization
export const ADJUSTMENT_GROUPS = {
  tone: {
    label: 'Tone',
    controls: ['exposure', 'contrast', 'shadows', 'midtones', 'highlights', 'gamma']
  },
  color: {
    label: 'Color',
    controls: ['saturation', 'temperature', 'tint', 'vibrance']
  },
  creative: {
    label: 'Creative',
    controls: ['clarity', 'filmGrain', 'vignette']
  },
  colorWheels: {
    label: '3-Way Color',
    controls: ['shadowsWheel', 'midtonesWheel', 'highlightsWheel']
  },
  channels: {
    label: 'Channel Mixer',
    controls: ['hueChannels', 'saturationChannels', 'luminanceChannels']
  },
  effects: {
    label: 'Effects',
    controls: ['bloom', 'halation', 'chromaticAberration']
  }
} as const; 