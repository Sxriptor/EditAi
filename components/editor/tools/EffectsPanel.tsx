import React from 'react';
import ModernSlider from './ModernSlider';
import { Switch } from '@/components/ui/switch';

interface EffectsPanelProps {
  bloom: number[];
  halation: number[];
  chromaticAberration: number[];
  onEffectChange: (effect: 'bloom' | 'halation' | 'chromaticAberration', value: number[]) => void;
  disabled?: boolean;
}

const defaultEffectValue = [0];

export default function EffectsPanel({
  bloom = defaultEffectValue,
  halation = defaultEffectValue,
  chromaticAberration = defaultEffectValue,
  onEffectChange,
  disabled = false
}: EffectsPanelProps) {
  const effects = [
    {
      id: 'bloom' as const,
      label: 'Bloom',
      description: 'Soft glow around bright areas',
      value: bloom[0] || 0,
      min: 0,
      max: 100,
      step: 1,
      unit: '%'
    },
    {
      id: 'halation' as const,
      label: 'Halation',
      description: 'Light bleeding effect',
      value: halation[0] || 0,
      min: 0,
      max: 100,
      step: 1,
      unit: '%'
    },
    {
      id: 'chromaticAberration' as const,
      label: 'Chromatic Aberration',
      description: 'Color fringing effect',
      value: chromaticAberration[0] || 0,
      min: 0,
      max: 100,
      step: 1,
      unit: '%'
    }
  ];

  return (
    <div className="space-y-6">
      {effects.map((effect) => (
        <div key={effect.id} className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-300">{effect.label}</div>
              <div className="text-xs text-gray-500">{effect.description}</div>
            </div>
            <Switch
              checked={effect.value > 0}
              onCheckedChange={(checked) => {
                onEffectChange(effect.id, [checked ? 50 : 0]);
              }}
              disabled={disabled}
            />
          </div>

          {effect.value > 0 && (
            <ModernSlider
              label={effect.label}
              value={effect.value}
              onChange={(value) => onEffectChange(effect.id, [value])}
              min={effect.min}
              max={effect.max}
              step={effect.step}
              unit={effect.unit}
              disabled={disabled}
            />
          )}
        </div>
      ))}
    </div>
  );
} 