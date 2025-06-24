import React from 'react';
import ModernSlider from '../tools/ModernSlider';

interface BasicAdjustmentsProps {
  colorAdjustments: {
    exposure: number[];
    contrast: number[];
    highlights: number[];
    shadows: number[];
    saturation: number[];
    temperature: number[];
    brightness: number[];
    vibrance: number[];
    clarity: number[];
    hue: number[];
  };
  handleColorAdjustment: (key: string, value: number[]) => void;
  disabled?: boolean;
}

export default function BasicAdjustments({ 
  colorAdjustments, 
  handleColorAdjustment, 
  disabled = false 
}: BasicAdjustmentsProps) {
  
  const adjustments = [
    {
      key: 'exposure',
      label: 'Exposure',
      value: colorAdjustments.exposure[0],
      min: -200,
      max: 200,
      step: 5,
      unit: 'EV'
    },
    {
      key: 'contrast',
      label: 'Contrast',
      value: colorAdjustments.contrast[0],
      min: -100,
      max: 100,
      step: 1
    },
    {
      key: 'highlights',
      label: 'Highlights',
      value: colorAdjustments.highlights[0],
      min: -100,
      max: 100,
      step: 1
    },
    {
      key: 'shadows',
      label: 'Shadows',
      value: colorAdjustments.shadows[0],
      min: -100,
      max: 100,
      step: 1
    },
    {
      key: 'brightness',
      label: 'Brightness',
      value: colorAdjustments.brightness[0],
      min: -100,
      max: 100,
      step: 1
    },
    {
      key: 'saturation',
      label: 'Saturation',
      value: colorAdjustments.saturation[0],
      min: -100,
      max: 100,
      step: 1,
      unit: '%'
    },
    {
      key: 'vibrance',
      label: 'Vibrance',
      value: colorAdjustments.vibrance[0],
      min: -100,
      max: 100,
      step: 1,
      unit: '%'
    },
    {
      key: 'temperature',
      label: 'Temperature',
      value: colorAdjustments.temperature[0],
      min: -100,
      max: 100,
      step: 1,
      unit: 'K'
    },
    {
      key: 'clarity',
      label: 'Clarity',
      value: colorAdjustments.clarity[0],
      min: -100,
      max: 100,
      step: 1,
      unit: '%'
    },
    {
      key: 'hue',
      label: 'Hue',
      value: colorAdjustments.hue[0],
      min: -180,
      max: 180,
      step: 1,
      unit: '°'
    }
  ];

  return (
    <div className="space-y-3">
      {adjustments.map((adjustment) => (
        <ModernSlider
          key={adjustment.key}
          label={adjustment.label}
          value={adjustment.value}
          onChange={(value) => handleColorAdjustment(adjustment.key, [value])}
          min={adjustment.min}
          max={adjustment.max}
          step={adjustment.step}
          unit={adjustment.unit}
          disabled={disabled}
        />
      ))}
    </div>
  );
}
