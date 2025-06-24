import React, { useState, useRef, useCallback } from 'react';

interface ModernSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label: string;
  unit?: string;
  gradient?: string;
  disabled?: boolean;
  precision?: number;
}

export default function ModernSlider({
  value,
  onChange,
  min = -100,
  max = 100,
  step = 1,
  label,
  unit = '',
  gradient,
  disabled = false,
  precision = 0
}: ModernSliderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = useCallback((event: React.PointerEvent) => {
    if (disabled) return;
    
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    
    const rect = sliderRef.current?.getBoundingClientRect();
    if (rect) {
      const x = event.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, x / rect.width));
      const newValue = min + (max - min) * percentage;
      const steppedValue = Math.round(newValue / step) * step;
      onChange(Number(steppedValue.toFixed(precision)));
    }
  }, [disabled, min, max, step, onChange, precision]);

  const handlePointerMove = useCallback((event: React.PointerEvent) => {
    if (!isDragging || disabled) return;
    
    const rect = sliderRef.current?.getBoundingClientRect();
    if (rect) {
      const x = event.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, x / rect.width));
      const newValue = min + (max - min) * percentage;
      const steppedValue = Math.round(newValue / step) * step;
      onChange(Number(steppedValue.toFixed(precision)));
    }
  }, [isDragging, disabled, min, max, step, onChange, precision]);

  const handlePointerUp = useCallback((event: React.PointerEvent) => {
    setIsDragging(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
  }, []);

  const handleDoubleClick = useCallback(() => {
    if (!disabled) {
      onChange(0); // Reset to center/default value
    }
  }, [disabled, onChange]);

  const percentage = ((value - min) / (max - min)) * 100;
  const displayValue = precision > 0 ? value.toFixed(precision) : Math.round(value);

  // Generate default gradient based on the adjustment type
  const getDefaultGradient = () => {
    const labelLower = label.toLowerCase();
    
    if (labelLower.includes('temperature')) {
      return 'linear-gradient(to right, #3b82f6, #ffffff, #f59e0b)'; // Blue to white to orange
    } else if (labelLower.includes('exposure') || labelLower.includes('brightness')) {
      return 'linear-gradient(to right, #000000, #808080, #ffffff)'; // Black to gray to white
    } else if (labelLower.includes('saturation') || labelLower.includes('vibrance')) {
      return 'linear-gradient(to right, #808080, #ff0080)'; // Gray to saturated
    } else if (labelLower.includes('contrast')) {
      return 'linear-gradient(to right, #404040, #808080, #ffffff)'; // Low contrast to high contrast
    } else if (labelLower.includes('hue')) {
      return 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)'; // Color wheel
    } else {
      return 'linear-gradient(to right, #374151, #6b7280, #9ca3af)'; // Default gray gradient
    }
  };

  return (
    <div className="space-y-2">
      {/* Label and Value */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-300">{label}</span>
        <div className="flex items-center space-x-1">
          <span 
            className={`text-xs font-mono transition-colors ${
              value === 0 ? 'text-gray-400' : value > 0 ? 'text-emerald-400' : 'text-orange-400'
            }`}
          >
            {value > 0 && '+'}
            {displayValue}
          </span>
          {unit && <span className="text-xs text-gray-500">{unit}</span>}
        </div>
      </div>

      {/* Slider Track */}
      <div className="relative">
        <div
          ref={sliderRef}
          className={`relative h-3 rounded-full border border-gray-600 overflow-hidden transition-all duration-200 ${
            disabled 
              ? 'opacity-50 cursor-not-allowed' 
              : 'cursor-pointer hover:border-gray-500'
          } ${isDragging ? 'scale-y-110' : isHovering ? 'scale-y-105' : 'scale-y-100'}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onDoubleClick={handleDoubleClick}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          {/* Background gradient */}
          <div 
            className="absolute inset-0 rounded-full"
            style={{ background: gradient || getDefaultGradient() }}
          />
          
          {/* Overlay for better contrast */}
          <div className="absolute inset-0 bg-black/20 rounded-full" />
          
          {/* Center line indicator */}
          <div 
            className="absolute top-0 bottom-0 w-px bg-white/30"
            style={{ left: '50%', transform: 'translateX(-50%)' }}
          />
          
          {/* Value indicator */}
          <div
            className={`absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white border-2 border-gray-800 rounded-full shadow-lg transition-all duration-150 ${
              isDragging ? 'scale-125 border-purple-500' : 'scale-100'
            }`}
            style={{ 
              left: `${percentage}%`, 
              marginLeft: '-8px',
              boxShadow: '0 0 0 1px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.3)'
            }}
          />
          
          {/* Active fill */}
          <div
            className="absolute top-0 bottom-0 bg-gradient-to-r from-purple-500/30 to-purple-400/30 rounded-full"
            style={{
              left: value >= 0 ? '50%' : `${percentage}%`,
              width: value >= 0 ? `${percentage - 50}%` : `${50 - percentage}%`
            }}
          />
        </div>

        {/* Scale markers */}
        <div className="flex justify-between mt-1 px-1">
          <span className="text-xs text-gray-600">{min}</span>
          <span className="text-xs text-gray-600">0</span>
          <span className="text-xs text-gray-600">{max}</span>
        </div>
      </div>

      {/* Reset hint */}
      {!disabled && value !== 0 && (
        <div className="text-center">
          <button
            onClick={() => onChange(0)}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            Double-click to reset
          </button>
        </div>
      )}
    </div>
  );
} 