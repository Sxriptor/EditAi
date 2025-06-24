import { useState } from 'react';
import { 
  ChevronUp, 
  ChevronDown, 
  Sun, 
  Sliders, 
  CircleDot, 
  Film, 
  Target 
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';

// ColorWheel component extracted from the main page
const ColorWheel = ({ 
  value, 
  onChange, 
  size = 100, 
  title 
}: { 
  value: { h: number, s: number, l: number }, 
  onChange: (newValue: { h: number, s: number, l: number }) => void,
  size?: number,
  title: string
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  
  const handlePointerEvent = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault()
    const rect = event.currentTarget.getBoundingClientRect()
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const x = event.clientX - rect.left - centerX
    const y = event.clientY - rect.top - centerY
    
    const distance = Math.sqrt(x * x + y * y)
    const maxRadius = (size / 2) - 12
    
    if (distance <= maxRadius) {
      const angle = Math.atan2(y, x) * 180 / Math.PI
      const hue = (angle + 360) % 360
      const saturation = Math.min((distance / maxRadius) * 100, 100)
      
      onChange({ h: hue, s: saturation, l: value.l })
    }
  }

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true)
    event.currentTarget.setPointerCapture(event.pointerId)
    handlePointerEvent(event)
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      handlePointerEvent(event)
    }
  }

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false)
    event.currentTarget.releasePointerCapture(event.pointerId)
  }

  // Calculate indicator position
  const angle = value.h * Math.PI / 180
  const radius = (value.s / 100) * ((size / 2) - 12)
  const indicatorX = Math.cos(angle) * radius + size / 2
  const indicatorY = Math.sin(angle) * radius + size / 2

  // Get the current color for the indicator
  const currentColor = `hsl(${value.h}, ${value.s}%, 50%)`
  const currentColorDark = `hsl(${value.h}, ${value.s}%, 30%)`

  return (
    <div className="space-y-2">
      <div className="text-xs text-gray-400 font-medium text-center tracking-wide">
        {title}
      </div>
      
      <div className="flex flex-col items-center space-y-3">
        {/* Color Wheel with CSS Gradients */}
        <div 
          className="relative cursor-crosshair transition-all duration-200"
          style={{ 
            width: size, 
            height: size,
            transform: isDragging ? 'scale(1.02)' : isHovering ? 'scale(1.01)' : 'scale(1)',
            touchAction: 'none'
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          {/* Outer border ring */}
          <div 
            className="absolute inset-0 rounded-full border-2 border-gray-600/50"
            style={{
              background: `conic-gradient(
                from 0deg,
                #ff0000 0deg,
                #ff8000 30deg,
                #ffff00 60deg,
                #80ff00 90deg,
                #00ff00 120deg,
                #00ff80 150deg,
                #00ffff 180deg,
                #0080ff 210deg,
                #0000ff 240deg,
                #8000ff 270deg,
                #ff00ff 300deg,
                #ff0080 330deg,
                #ff0000 360deg
              )`,
              borderRadius: '50%'
            }}
          />
          
          {/* Saturation gradient overlay */}
          <div 
            className="absolute inset-1 rounded-full"
            style={{
              background: `radial-gradient(circle, 
                rgba(255,255,255,1) 0%, 
                rgba(255,255,255,0.8) 20%, 
                rgba(255,255,255,0.3) 50%, 
                rgba(255,255,255,0) 80%
              )`
            }}
          />
          
          {/* Center dot */}
          <div 
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                       w-3 h-3 bg-gray-800 rounded-full border border-gray-500"
          />
          
          {/* Color indicator */}
          <div 
            className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-1/2 
                       transition-all duration-150 z-10"
            style={{
              left: indicatorX,
              top: indicatorY
            }}
          >
            <div className="relative">
              {/* Outer ring */}
              <div 
                className="w-6 h-6 rounded-full border-2 border-white shadow-lg"
                style={{ 
                  backgroundColor: currentColor,
                  transform: isDragging ? 'scale(1.3)' : 'scale(1)',
                  boxShadow: `0 0 0 1px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.5)`
                }}
              />
              {/* Inner ring for better visibility */}
              <div 
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                         w-3 h-3 rounded-full border border-white/80"
                style={{ backgroundColor: currentColorDark }}
              />
            </div>
          </div>
        </div>
        
        {/* Value display with color preview */}
        <div className="w-full space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div 
                className="w-4 h-4 rounded border border-gray-600"
                style={{ backgroundColor: currentColor }}
              />
              <span className="text-xs text-gray-400">H: {Math.round(value.h)}° S: {Math.round(value.s)}%</span>
            </div>
            <div className="text-xs text-gray-500">
              {value.l > 0 ? '+' : ''}{value.l}
            </div>
          </div>
          
          {/* Luminance slider */}
          <div className="relative">
            <div 
              className="absolute inset-0 rounded-full h-2 border border-gray-700"
              style={{
                background: `linear-gradient(to right, 
                  hsl(${value.h}, ${value.s}%, 10%), 
                  hsl(${value.h}, ${value.s}%, 50%), 
                  hsl(${value.h}, ${value.s}%, 90%)
                )`
              }}
            />
            <Slider 
              value={[value.l]} 
              onValueChange={(val) => onChange({ ...value, l: val[0] })}
              min={-100} max={100} step={1} 
              className="relative z-10"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Types for the component
interface ColorAdjustments {
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
  lift: number[];
  gamma: number[];
  gain: number[];
  offset: number[];
  shadowsWheel: { h: number; s: number; l: number };
  midtonesWheel: { h: number; s: number; l: number };
  highlightsWheel: { h: number; s: number; l: number };
  filmGrain: number[];
  vignette: number[];
  bleachBypass: number[];
  orangeTeal: number[];
  highlightDetail: number[];
  shadowDetail: number[];
  colorBalance: number[];
  skinTone: number[];
  luminanceSmoothing: number[];
  colorSmoothing: number[];
}

interface StyleCustomizationAccordionProps {
  colorAdjustments: ColorAdjustments;
  handleColorAdjustment: (key: keyof ColorAdjustments, value: any) => void;
  handleColorWheelChange: (wheelType: 'shadowsWheel' | 'midtonesWheel' | 'highlightsWheel', newValue: { h: number, s: number, l: number }) => void;
  hasMedia: boolean;
}

const StyleCustomizationAccordion = ({
  colorAdjustments,
  handleColorAdjustment,
  handleColorWheelChange,
  hasMedia
}: StyleCustomizationAccordionProps) => {
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    professional: false,
    colorWheels: false,
    filmEmulation: false,
    advanced: false
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (!hasMedia) return null;

  return (
    <div className="space-y-4 mb-6">
      <div className="space-y-2">
        {/* Basic Controls */}
        <div className="border border-gray-700 rounded-lg">
          <button
            onClick={() => toggleSection('basic')}
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-800/50 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <Sun className="h-4 w-4 text-orange-400" />
              <span className="text-sm font-medium text-white">Basic Controls</span>
            </div>
            {expandedSections.basic ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
          </button>
          {expandedSections.basic && (
            <div className="px-4 pb-4 space-y-4">
              {/* Exposure */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Exposure</span>
                  <span className="text-white">{colorAdjustments.exposure[0]}</span>
                </div>
                <Slider 
                  value={colorAdjustments.exposure} 
                  onValueChange={(value) => handleColorAdjustment('exposure', value)}
                  min={-100} max={100} step={1} 
                  className="w-full" 
                />
              </div>

              {/* Contrast */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Contrast</span>
                  <span className="text-white">{colorAdjustments.contrast[0]}</span>
                </div>
                <Slider 
                  value={colorAdjustments.contrast} 
                  onValueChange={(value) => handleColorAdjustment('contrast', value)}
                  min={-100} max={100} step={1} 
                  className="w-full" 
                />
              </div>

              {/* Highlights */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Highlights</span>
                  <span className="text-white">{colorAdjustments.highlights[0]}</span>
                </div>
                <Slider 
                  value={colorAdjustments.highlights} 
                  onValueChange={(value) => handleColorAdjustment('highlights', value)}
                  min={-100} max={100} step={1} 
                  className="w-full" 
                />
              </div>

              {/* Shadows */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Shadows</span>
                  <span className="text-white">{colorAdjustments.shadows[0]}</span>
                </div>
                <Slider 
                  value={colorAdjustments.shadows} 
                  onValueChange={(value) => handleColorAdjustment('shadows', value)}
                  min={-100} max={100} step={1} 
                  className="w-full" 
                />
              </div>

              {/* Saturation */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Saturation</span>
                  <span className="text-white">{colorAdjustments.saturation[0]}</span>
                </div>
                <Slider 
                  value={colorAdjustments.saturation} 
                  onValueChange={(value) => handleColorAdjustment('saturation', value)}
                  min={-100} max={100} step={1} 
                  className="w-full" 
                />
              </div>

              {/* Temperature */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Temperature</span>
                  <span className="text-white">{colorAdjustments.temperature[0]}</span>
                </div>
                <Slider 
                  value={colorAdjustments.temperature} 
                  onValueChange={(value) => handleColorAdjustment('temperature', value)}
                  min={-100} max={100} step={1} 
                  className="w-full" 
                />
              </div>

              {/* Brightness */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Brightness</span>
                  <span className="text-white">{colorAdjustments.brightness[0]}</span>
                </div>
                <Slider 
                  value={colorAdjustments.brightness} 
                  onValueChange={(value) => handleColorAdjustment('brightness', value)}
                  min={-100} max={100} step={1} 
                  className="w-full" 
                />
              </div>

              {/* Vibrance */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Vibrance</span>
                  <span className="text-white">{colorAdjustments.vibrance[0]}</span>
                </div>
                <Slider 
                  value={colorAdjustments.vibrance} 
                  onValueChange={(value) => handleColorAdjustment('vibrance', value)}
                  min={-100} max={100} step={1} 
                  className="w-full" 
                />
              </div>

              {/* Clarity */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Clarity</span>
                  <span className="text-white">{colorAdjustments.clarity[0]}</span>
                </div>
                <Slider 
                  value={colorAdjustments.clarity} 
                  onValueChange={(value) => handleColorAdjustment('clarity', value)}
                  min={-100} max={100} step={1} 
                  className="w-full" 
                />
              </div>

              {/* Hue */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Hue</span>
                  <span className="text-white">{colorAdjustments.hue[0]}</span>
                </div>
                <Slider 
                  value={colorAdjustments.hue} 
                  onValueChange={(value) => handleColorAdjustment('hue', value)}
                  min={-180} max={180} step={1} 
                  className="w-full" 
                />
              </div>
            </div>
          )}
        </div>

        {/* Professional Controls */}
        <div className="border border-gray-700 rounded-lg">
          <button
            onClick={() => toggleSection('professional')}
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-800/50 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <Sliders className="h-4 w-4 text-purple-400" />
              <span className="text-sm font-medium text-white">Professional</span>
            </div>
            {expandedSections.professional ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
          </button>
          {expandedSections.professional && (
            <div className="px-4 pb-4 space-y-4">
              {/* Lift */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Lift (Shadows)</span>
                  <span className="text-white">{colorAdjustments.lift[0]}</span>
                </div>
                <Slider 
                  value={colorAdjustments.lift} 
                  onValueChange={(value) => handleColorAdjustment('lift', value)}
                  min={-50} max={50} step={1} 
                  className="w-full" 
                />
              </div>

              {/* Gamma */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Gamma (Midtones)</span>
                  <span className="text-white">{colorAdjustments.gamma[0].toFixed(2)}</span>
                </div>
                <Slider 
                  value={[colorAdjustments.gamma[0]]} 
                  onValueChange={(value) => handleColorAdjustment('gamma', value)}
                  min={0.5} max={2.0} step={0.01} 
                  className="w-full" 
                />
              </div>

              {/* Gain */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Gain (Highlights)</span>
                  <span className="text-white">{colorAdjustments.gain[0].toFixed(2)}</span>
                </div>
                <Slider 
                  value={[colorAdjustments.gain[0]]} 
                  onValueChange={(value) => handleColorAdjustment('gain', value)}
                  min={0.5} max={2.0} step={0.01} 
                  className="w-full" 
                />
              </div>

              {/* Offset */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Offset</span>
                  <span className="text-white">{colorAdjustments.offset[0]}</span>
                </div>
                <Slider 
                  value={colorAdjustments.offset} 
                  onValueChange={(value) => handleColorAdjustment('offset', value)}
                  min={-50} max={50} step={1} 
                  className="w-full" 
                />
              </div>
            </div>
          )}
        </div>

        {/* Color Wheels */}
        <div className="border border-gray-700 rounded-lg">
          <button
            onClick={() => toggleSection('colorWheels')}
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-800/50 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <CircleDot className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-medium text-white">Color Wheels</span>
            </div>
            {expandedSections.colorWheels ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
          </button>
          {expandedSections.colorWheels && (
            <div className="px-4 pb-4 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <ColorWheel
                  title="Shadows"
                  value={colorAdjustments.shadowsWheel}
                  onChange={(newValue) => handleColorWheelChange('shadowsWheel', newValue)}
                  size={85}
                />
                <ColorWheel
                  title="Highlights"
                  value={colorAdjustments.highlightsWheel}
                  onChange={(newValue) => handleColorWheelChange('highlightsWheel', newValue)}
                  size={85}
                />
              </div>
              
              {/* Secondary Color Wheels */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                <ColorWheel
                  title="Midtones"
                  value={colorAdjustments.midtonesWheel}
                  onChange={(newValue) => handleColorWheelChange('midtonesWheel', newValue)}
                  size={75}
                />
                <div className="space-y-3">
                  <div className="text-xs text-gray-400 font-medium text-center tracking-wide">
                    Master
                  </div>
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Saturation</span>
                        <span className="text-white">{colorAdjustments.saturation[0]}</span>
                      </div>
                      <Slider 
                        value={colorAdjustments.saturation} 
                        onValueChange={(value) => handleColorAdjustment('saturation', value)}
                        min={-100} max={100} step={1} 
                        className="w-full" 
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Vibrance</span>
                        <span className="text-white">{colorAdjustments.vibrance[0]}</span>
                      </div>
                      <Slider 
                        value={colorAdjustments.vibrance} 
                        onValueChange={(value) => handleColorAdjustment('vibrance', value)}
                        min={-100} max={100} step={1} 
                        className="w-full" 
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Temperature</span>
                        <span className="text-white">{colorAdjustments.temperature[0]}</span>
                      </div>
                      <Slider 
                        value={colorAdjustments.temperature} 
                        onValueChange={(value) => handleColorAdjustment('temperature', value)}
                        min={-100} max={100} step={1} 
                        className="w-full" 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Film Emulation */}
        <div className="border border-gray-700 rounded-lg">
          <button
            onClick={() => toggleSection('filmEmulation')}
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-800/50 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <Film className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-medium text-white">Film Emulation</span>
            </div>
            {expandedSections.filmEmulation ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
          </button>
          {expandedSections.filmEmulation && (
            <div className="px-4 pb-4 space-y-4">
              {/* Film Grain */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Film Grain</span>
                  <span className="text-white">{colorAdjustments.filmGrain[0]}%</span>
                </div>
                <Slider 
                  value={colorAdjustments.filmGrain} 
                  onValueChange={(value) => handleColorAdjustment('filmGrain', value)}
                  min={0} max={100} step={1} 
                  className="w-full" 
                />
              </div>

              {/* Vignette */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Vignette</span>
                  <span className="text-white">{colorAdjustments.vignette[0]}%</span>
                </div>
                <Slider 
                  value={colorAdjustments.vignette} 
                  onValueChange={(value) => handleColorAdjustment('vignette', value)}
                  min={0} max={100} step={1} 
                  className="w-full" 
                />
              </div>

              {/* Bleach Bypass */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Bleach Bypass</span>
                  <span className="text-white">{colorAdjustments.bleachBypass[0]}%</span>
                </div>
                <Slider 
                  value={colorAdjustments.bleachBypass} 
                  onValueChange={(value) => handleColorAdjustment('bleachBypass', value)}
                  min={0} max={100} step={1} 
                  className="w-full" 
                />
              </div>

              {/* Orange & Teal */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Orange & Teal</span>
                  <span className="text-white">{colorAdjustments.orangeTeal[0]}%</span>
                </div>
                <Slider 
                  value={colorAdjustments.orangeTeal} 
                  onValueChange={(value) => handleColorAdjustment('orangeTeal', value)}
                  min={0} max={100} step={1} 
                  className="w-full" 
                />
              </div>
            </div>
          )}
        </div>

        {/* Advanced Controls */}
        <div className="border border-gray-700 rounded-lg">
          <button
            onClick={() => toggleSection('advanced')}
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-800/50 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-red-400" />
              <span className="text-sm font-medium text-white">Advanced</span>
            </div>
            {expandedSections.advanced ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
          </button>
          {expandedSections.advanced && (
            <div className="px-4 pb-4 space-y-4">
              {/* Curve Controls */}
              <div className="space-y-3">
                <div className="text-xs text-gray-400 font-medium">Tone Curves</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Highlight Roll</span>
                      <span className="text-white">{colorAdjustments.highlightDetail[0]}</span>
                    </div>
                    <Slider 
                      value={colorAdjustments.highlightDetail} 
                      onValueChange={(value) => handleColorAdjustment('highlightDetail', value)}
                      min={-100} max={100} step={1} 
                      className="w-full" 
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Shadow Roll</span>
                      <span className="text-white">{colorAdjustments.shadowDetail[0]}</span>
                    </div>
                    <Slider 
                      value={colorAdjustments.shadowDetail} 
                      onValueChange={(value) => handleColorAdjustment('shadowDetail', value)}
                      min={-100} max={100} step={1} 
                      className="w-full" 
                    />
                  </div>
                </div>
              </div>

              {/* Color Science */}
              <div className="space-y-3">
                <div className="text-xs text-gray-400 font-medium">Color Science</div>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Color Balance</span>
                      <span className="text-white">{colorAdjustments.colorBalance[0]}</span>
                    </div>
                    <Slider 
                      value={colorAdjustments.colorBalance} 
                      onValueChange={(value) => handleColorAdjustment('colorBalance', value)}
                      min={-100} max={100} step={1} 
                      className="w-full" 
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Skin Tone Protection</span>
                      <span className="text-white">{colorAdjustments.skinTone[0]}</span>
                    </div>
                    <Slider 
                      value={colorAdjustments.skinTone} 
                      onValueChange={(value) => handleColorAdjustment('skinTone', value)}
                      min={0} max={100} step={1} 
                      className="w-full" 
                    />
                  </div>
                </div>
              </div>

              {/* Noise & Detail */}
              <div className="space-y-3">
                <div className="text-xs text-gray-400 font-medium">Noise & Detail</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Luma Smooth</span>
                      <span className="text-white">{colorAdjustments.luminanceSmoothing[0]}</span>
                    </div>
                    <Slider 
                      value={colorAdjustments.luminanceSmoothing} 
                      onValueChange={(value) => handleColorAdjustment('luminanceSmoothing', value)}
                      min={0} max={100} step={1} 
                      className="w-full" 
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Chroma Smooth</span>
                      <span className="text-white">{colorAdjustments.colorSmoothing[0]}</span>
                    </div>
                    <Slider 
                      value={colorAdjustments.colorSmoothing} 
                      onValueChange={(value) => handleColorAdjustment('colorSmoothing', value)}
                      min={0} max={100} step={1} 
                      className="w-full" 
                    />
                  </div>
                </div>
              </div>

              {/* Scopes Toggle */}
              <div className="space-y-2">
                <div className="text-xs text-gray-400 font-medium">Scopes & Analysis</div>
                <div className="grid grid-cols-2 gap-2">
                  <button className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-300 transition-colors">
                    Histogram
                  </button>
                  <button className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-300 transition-colors">
                    Waveform
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { StyleCustomizationAccordion, ColorWheel }; 