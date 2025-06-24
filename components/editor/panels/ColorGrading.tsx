import React from 'react';
import ColorWheel from '../tools/ColorWheel';
import ToneCurve from '../tools/ToneCurve';

interface ColorGradingProps {
  colorAdjustments: {
    shadowsWheel: { h: number; s: number; l: number };
    midtonesWheel: { h: number; s: number; l: number };
    highlightsWheel: { h: number; s: number; l: number };
    toneCurve?: { x: number; y: number }[];
  };
  handleColorWheelChange: (
    wheelType: 'shadowsWheel' | 'midtonesWheel' | 'highlightsWheel',
    newValue: { h: number; s: number; l: number }
  ) => void;
  handleToneCurveChange?: (points: { x: number; y: number }[]) => void;
  disabled?: boolean;
}

export default function ColorGrading({ 
  colorAdjustments, 
  handleColorWheelChange,
  handleToneCurveChange,
  disabled = false 
}: ColorGradingProps) {
  
  const colorWheels = [
    {
      type: 'shadowsWheel' as const,
      title: 'Shadows',
      value: colorAdjustments.shadowsWheel
    },
    {
      type: 'midtonesWheel' as const,
      title: 'Midtones',
      value: colorAdjustments.midtonesWheel
    },
    {
      type: 'highlightsWheel' as const,
      title: 'Highlights',
      value: colorAdjustments.highlightsWheel
    }
  ];

  return (
    <div className="space-y-4">
      {/* Color Wheels Section */}
      <div className="space-y-3">
        <div className="text-xs font-medium text-gray-300 text-center uppercase tracking-wider">
          Color Wheels
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          {colorWheels.map((wheel) => (
            <div key={wheel.type} className="flex justify-center">
                              <ColorWheel
                  title={wheel.title}
                  value={wheel.value}
                  onChange={(newValue) => handleColorWheelChange(wheel.type, newValue)}
                  size={90}
                  disabled={disabled}
                />
            </div>
          ))}
        </div>
      </div>

      {/* Tone Curve Section */}
      {handleToneCurveChange && (
        <div className="space-y-4">
          <div className="text-sm font-medium text-gray-200 text-center">
            Tone Curve
          </div>
          
          <div className="flex justify-center">
            <ToneCurve
              title="RGB Curve"
              value={colorAdjustments.toneCurve || []}
              onChange={handleToneCurveChange}
              width={260}
              height={180}
              disabled={disabled}
            />
          </div>
        </div>
      )}

      {/* Reset All Button */}
      {!disabled && (
        <div className="flex justify-center pt-4">
          <button
            onClick={() => {
              handleColorWheelChange('shadowsWheel', { h: 0, s: 0, l: 0 });
              handleColorWheelChange('midtonesWheel', { h: 0, s: 0, l: 0 });
              handleColorWheelChange('highlightsWheel', { h: 0, s: 0, l: 0 });
              if (handleToneCurveChange) {
                handleToneCurveChange([
                  { x: 0, y: 0 },
                  { x: 0.25, y: 0.25 },
                  { x: 0.5, y: 0.5 },
                  { x: 0.75, y: 0.75 },
                  { x: 1, y: 1 }
                ]);
              }
            }}
            className="px-4 py-2 text-xs text-gray-400 hover:text-white border border-gray-600 hover:border-gray-500 rounded-lg transition-colors"
          >
            Reset Color Grading
          </button>
        </div>
      )}
    </div>
  );
}
