import React, { useState, useRef, useCallback } from 'react';

interface ColorWheelProps {
  value: { h: number; s: number; l: number };
  onChange: (value: { h: number; s: number; l: number }) => void;
  size?: number;
  title: string;
  disabled?: boolean;
}

export default function ColorWheel({ 
  value, 
  onChange, 
  size = 120, 
  title, 
  disabled = false 
}: ColorWheelProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const wheelRef = useRef<HTMLDivElement>(null);

  const handlePointerEvent = useCallback((event: PointerEvent | React.PointerEvent) => {
    if (!wheelRef.current || disabled) return;

    const rect = wheelRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const x = event.clientX - rect.left - centerX;
    const y = event.clientY - rect.top - centerY;
    
    const distance = Math.sqrt(x * x + y * y);
    const maxRadius = (size / 2) - 8;
    
    if (distance <= maxRadius) {
      // Calculate hue from angle
      let angle = Math.atan2(y, x) * 180 / Math.PI;
      if (angle < 0) angle += 360;
      
      // Calculate saturation from distance
      const saturation = Math.min((distance / maxRadius) * 100, 100);
      
      onChange({ 
        h: Math.round(angle), 
        s: Math.round(saturation), 
        l: value.l 
      });
    }
  }, [onChange, value.l, size, disabled]);

  const handlePointerDown = useCallback((event: React.PointerEvent) => {
    if (disabled) return;
    
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    handlePointerEvent(event);
  }, [handlePointerEvent, disabled]);

  const handlePointerMove = useCallback((event: React.PointerEvent) => {
    if (isDragging && !disabled) {
      handlePointerEvent(event);
    }
  }, [isDragging, handlePointerEvent, disabled]);

  const handlePointerUp = useCallback((event: React.PointerEvent) => {
    setIsDragging(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
  }, []);

  // Calculate indicator position
  const angle = (value.h * Math.PI) / 180;
  const radius = (value.s / 100) * ((size / 2) - 8);
  const indicatorX = Math.cos(angle) * radius + size / 2;
  const indicatorY = Math.sin(angle) * radius + size / 2;

  const currentColor = `hsl(${value.h}, ${value.s}%, 50%)`;
  const lightness = value.l;

  return (
    <div className="flex flex-col items-center space-y-3">
      {/* Title */}
      <div className="text-xs font-medium text-gray-300 uppercase tracking-wider">
        {title}
      </div>

      {/* Color Wheel */}
      <div className="relative">
        <div
          ref={wheelRef}
          className={`relative rounded-full border-2 transition-all duration-200 ${
            disabled 
              ? 'border-gray-700 opacity-50 cursor-not-allowed' 
              : 'border-gray-600 cursor-crosshair hover:border-gray-500'
          }`}
          style={{ 
            width: size, 
            height: size,
            transform: isDragging ? 'scale(1.02)' : isHovering ? 'scale(1.01)' : 'scale(1)',
            background: `conic-gradient(
              from 0deg,
              hsl(0, 100%, 50%) 0deg,
              hsl(30, 100%, 50%) 30deg,
              hsl(60, 100%, 50%) 60deg,
              hsl(90, 100%, 50%) 90deg,
              hsl(120, 100%, 50%) 120deg,
              hsl(150, 100%, 50%) 150deg,
              hsl(180, 100%, 50%) 180deg,
              hsl(210, 100%, 50%) 210deg,
              hsl(240, 100%, 50%) 240deg,
              hsl(270, 100%, 50%) 270deg,
              hsl(300, 100%, 50%) 300deg,
              hsl(330, 100%, 50%) 330deg,
              hsl(360, 100%, 50%) 360deg
            )`
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          {/* Saturation gradient overlay */}
          <div 
            className="absolute inset-1 rounded-full"
            style={{
              background: `radial-gradient(circle, 
                rgba(255,255,255,1) 0%, 
                rgba(255,255,255,0.9) 10%, 
                rgba(255,255,255,0.5) 40%, 
                rgba(255,255,255,0) 70%
              )`
            }}
          />

          {/* Center neutral point */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-gray-400 rounded-full border border-gray-600" />

          {/* Color indicator */}
          {!disabled && (
            <div
              className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-1/2 z-10"
              style={{ left: indicatorX, top: indicatorY }}
            >
              <div className="relative">
                <div
                  className={`w-4 h-4 rounded-full border-2 border-white shadow-lg transition-transform duration-150 ${
                    isDragging ? 'scale-125' : 'scale-100'
                  }`}
                  style={{ 
                    backgroundColor: currentColor,
                    boxShadow: '0 0 0 1px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.3)'
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Value displays and lightness control */}
      <div className="w-full max-w-[140px] space-y-2">
        {/* Color preview and values */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div 
              className="w-5 h-5 rounded border border-gray-600 shadow-inner"
              style={{ backgroundColor: `hsl(${value.h}, ${value.s}%, ${50 + lightness/2}%)` }}
            />
            <div className="text-xs text-gray-400">
              <div>H: {value.h}°</div>
              <div>S: {value.s}%</div>
            </div>
          </div>
          <div className="text-xs text-gray-400">
            L: {lightness > 0 ? '+' : ''}{lightness}
          </div>
        </div>

        {/* Lightness slider */}
        <div className="relative">
          <div 
            className="h-2 rounded-full border border-gray-700"
            style={{
              background: `linear-gradient(to right, 
                hsl(${value.h}, ${value.s}%, 20%), 
                hsl(${value.h}, ${value.s}%, 50%), 
                hsl(${value.h}, ${value.s}%, 80%)
              )`
            }}
          />
          <input
            type="range"
            min={-50}
            max={50}
            value={lightness}
            onChange={(e) => onChange({ ...value, l: parseInt(e.target.value) })}
            disabled={disabled}
            className="absolute inset-0 w-full h-2 opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />
          <div
            className="absolute top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white border border-gray-400 rounded-full shadow-md pointer-events-none"
            style={{ left: `${((lightness + 50) / 100) * 100}%`, marginLeft: '-6px' }}
          />
        </div>
      </div>
    </div>
  );
}
