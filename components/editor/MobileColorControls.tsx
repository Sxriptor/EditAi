import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown, Palette, Download, Sun, Contrast, Droplets, Zap, Sliders, Target, Sparkles, Gauge, CircleDot, BarChart3, Layers, Camera, Film, Aperture, Star, Settings, FolderOpen, ChevronRight } from 'lucide-react';

interface MobileColorControlsProps {
  hasMedia: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  colorAdjustments: any;
  handleColorAdjustment: (key: string, value: any) => void;
  handleColorWheelChange: (wheelType: 'shadowsWheel' | 'midtonesWheel' | 'highlightsWheel', newValue: { h: number, s: number, l: number }) => void;
  handleExport: () => void;
  currentProject?: any;
  onSaveToProject?: () => void;
  hasUnsavedChanges?: boolean;
  lutPresets?: any[];
  favoritePresets?: (number | string)[];
  selectedPreset?: string | null;
  onPresetSelect?: (preset: any) => void;
  onPresetUse?: (preset: any) => void;
  onPresetExport?: (preset: any) => void;
  onToggleFavorite?: (presetId: number | string) => void;
  onSaveStyle?: () => void;
}

interface ToolItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adjustment?: string;
  category: 'basic' | 'color' | 'effects' | 'advanced' | 'presets';
}

const toolItems: ToolItem[] = [
  // Basic adjustments
  { id: 'exposure', label: 'Exposure', icon: Sun, adjustment: 'exposure', category: 'basic' },
  { id: 'contrast', label: 'Contrast', icon: Contrast, adjustment: 'contrast', category: 'basic' },
  { id: 'highlights', label: 'Highlights', icon: Sparkles, adjustment: 'highlights', category: 'basic' },
  { id: 'shadows', label: 'Shadows', icon: CircleDot, adjustment: 'shadows', category: 'basic' },
  
  // Color adjustments
  { id: 'saturation', label: 'Saturation', icon: Droplets, adjustment: 'saturation', category: 'color' },
  { id: 'temperature', label: 'Temperature', icon: Zap, adjustment: 'temperature', category: 'color' },
  { id: 'vibrance', label: 'Vibrance', icon: Target, adjustment: 'vibrance', category: 'color' },
  { id: 'hue', label: 'Hue', icon: Palette, adjustment: 'hue', category: 'color' },
  
  // Effects
  { id: 'clarity', label: 'Clarity', icon: Aperture, adjustment: 'clarity', category: 'effects' },
  { id: 'vignette', label: 'Vignette', icon: Camera, adjustment: 'vignette', category: 'effects' },
  { id: 'filmGrain', label: 'Film Grain', icon: Film, adjustment: 'filmGrain', category: 'effects' },
  { id: 'curves', label: 'Curves', icon: BarChart3, category: 'advanced' },
  
  // Advanced
  { id: 'colorWheel', label: 'Color Wheel', icon: Gauge, category: 'advanced' },
  { id: 'histogram', label: 'Histogram', icon: BarChart3, category: 'advanced' },
  { id: 'layers', label: 'Layers', icon: Layers, category: 'advanced' },
  { id: 'blend', label: 'Blend', icon: Sliders, category: 'advanced' },
];

export default function MobileColorControls({
  hasMedia,
  isExpanded,
  onToggle,
  colorAdjustments,
  handleColorAdjustment,
  handleColorWheelChange,
  handleExport,
  currentProject,
  onSaveToProject,
  hasUnsavedChanges = false,
  lutPresets = [],
  favoritePresets = [],
  selectedPreset,
  onPresetSelect,
  onPresetUse,
  onPresetExport,
  onToggleFavorite,
  onSaveStyle
}: MobileColorControlsProps) {
  const [activeCategory, setActiveCategory] = useState<'basic' | 'color' | 'effects' | 'advanced' | 'presets'>('basic');
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    favorites: true,
    myPresets: true,
    presets: true
  });

  if (!hasMedia) return null;

  const categories = [
    { id: 'basic' as const, label: 'BASIC' },
    { id: 'color' as const, label: 'COLOR' },
    { id: 'effects' as const, label: 'EFFECTS' },
    { id: 'presets' as const, label: 'PRESETS' }
  ];

  const currentTools = toolItems.filter(tool => tool.category === activeCategory);

  const handleToolSelect = (tool: ToolItem) => {
    setSelectedTool(selectedTool === tool.id ? null : tool.id);
  };

  const getAdjustmentValue = (adjustment: string) => {
    return colorAdjustments[adjustment]?.[0] || 0;
  };

  const toggleSection = (section: 'favorites' | 'myPresets' | 'presets') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Filter presets by type
  const defaultPresets = lutPresets.filter(preset => preset.isBuiltIn);
  const userPresets = lutPresets.filter(preset => !preset.isBuiltIn);
  const favoritePresetItems = lutPresets.filter(preset => favoritePresets.includes(preset.id));

  return (
    <div className="bg-gray-900 border-t border-gray-800">
      {/* Header - Always visible */}
      <div className="flex items-center justify-between p-3 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800">
        <div className="flex items-center space-x-2">
          <Palette className="h-4 w-4 text-purple-400" />
          <span className="text-sm font-medium text-white">Edit</span>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Export button */}
          <Button
            onClick={handleExport}
            size="sm"
            className="bg-purple-600 hover:bg-purple-700 h-7 text-xs px-3"
          >
            <Download className="h-3 w-3 mr-1" />
            Export
          </Button>
          
          {/* Save Style button */}
          <Button
            onClick={onSaveStyle}
            size="sm"
            variant="outline"
            className="border-purple-500/50 text-purple-300 hover:bg-purple-500/10 h-7 text-xs px-3"
            disabled={!hasMedia}
          >
            <Palette className="h-3 w-3 mr-1" />
            Save Style
          </Button>
          
          {/* Toggle button */}
          <Button
            onClick={onToggle}
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-gray-400 hover:text-white"
          >
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex bg-gray-800 border-b border-gray-700 overflow-x-auto">
        {categories.map((category) => (
          <Button
            key={category.id}
            onClick={() => {
              setActiveCategory(category.id);
              setSelectedTool(null);
            }}
            variant="ghost"
            className={`flex-1 h-10 text-xs font-medium rounded-none border-b-2 transition-colors ${
              activeCategory === category.id
                ? 'text-purple-400 border-purple-400 bg-purple-400/10'
                : 'text-gray-400 border-transparent hover:text-white hover:bg-gray-700/50'
            }`}
          >
            {category.label}
          </Button>
        ))}
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="max-h-[25vh] overflow-y-auto bg-gray-900">
          {/* Project controls */}
          {currentProject && (
            <div className="bg-gray-800/30 p-3 border-b border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400">Project: {currentProject.name}</span>
                {hasUnsavedChanges && (
                  <span className="text-xs text-orange-400">Unsaved</span>
                )}
              </div>
              {onSaveToProject && (
                <Button
                  onClick={onSaveToProject}
                  size="sm"
                  className={`w-full h-7 text-xs ${
                    hasUnsavedChanges 
                      ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                      : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  }`}
                  disabled={!hasUnsavedChanges}
                >
                  Save Changes
                </Button>
              )}
            </div>
          )}

          {/* Tools Grid or Presets */}
          <div className="p-3">
            {activeCategory === 'presets' ? (
              /* LUT Presets Grid */
              <div className="space-y-3">
                {/* Favorites Section */}
                {favoritePresetItems.length > 0 && (
                  <div className="mb-4">
                    <button
                      onClick={() => toggleSection('favorites')}
                      className="w-full flex items-center justify-between text-xs font-medium text-yellow-400 mb-2 hover:text-yellow-300"
                    >
                      <div className="flex items-center">
                        <Star className="w-3 h-3 mr-1 fill-yellow-400" />
                        Favorites ({favoritePresetItems.length})
                      </div>
                      {expandedSections.favorites ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                    {expandedSections.favorites && (
                      <div className="grid grid-cols-3 gap-2">
                        {favoritePresetItems.map((preset) => (
                          <div
                            key={preset.id}
                            className={`relative cursor-pointer rounded-lg overflow-hidden h-16 ${
                              selectedPreset === preset.name ? 'ring-2 ring-blue-500' : ''
                            }`}
                            onClick={() => onPresetSelect?.(preset)}
                          >
                            <div className={`w-full h-full ${preset.preview}`}></div>
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <div className="text-center">
                                <div className="text-white text-xs font-medium">{preset.name.split(' ')[0]}</div>
                                <div className="text-yellow-300 text-xs">★</div>
                              </div>
                            </div>
                            
                            {selectedPreset === preset.name && (
                              <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center">
                                <div className="flex gap-1">
                                  <Button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      onPresetUse?.(preset)
                                    }}
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 h-6"
                                  >
                                    Use
                                  </Button>
                                  <Button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      onPresetExport?.(preset)
                                    }}
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1 h-6"
                                  >
                                    Export
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* My Presets Section */}
                {userPresets.length > 0 && (
                  <div className="mb-4">
                    <button
                      onClick={() => toggleSection('myPresets')}
                      className="w-full flex items-center justify-between text-xs font-medium text-purple-400 mb-2 hover:text-purple-300"
                    >
                      <div className="flex items-center">
                        <FolderOpen className="w-3 h-3 mr-1" />
                        My Presets ({userPresets.length})
                      </div>
                      {expandedSections.myPresets ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                    {expandedSections.myPresets && (
                      <div className="grid grid-cols-3 gap-2">
                        {userPresets.map((preset) => (
                          <div
                            key={preset.id}
                            className={`relative cursor-pointer rounded-lg overflow-hidden h-16 ${
                              selectedPreset === preset.name ? 'ring-2 ring-blue-500' : ''
                            }`}
                            onClick={() => onPresetSelect?.(preset)}
                          >
                            <div className={`w-full h-full ${preset.preview}`}></div>
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <div className="text-center">
                                <div className="text-white text-xs font-medium">{preset.name.split(' ')[0]}</div>
                                <div className="text-gray-300 text-xs">{preset.strength}%</div>
                              </div>
                            </div>
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                onToggleFavorite?.(preset.id)
                              }}
                              className="absolute top-1 right-1 p-1 rounded-full bg-black/50"
                            >
                              <Star 
                                className={`w-3 h-3 ${
                                  favoritePresets.includes(preset.id) 
                                    ? 'text-yellow-400 fill-yellow-400' 
                                    : 'text-white'
                                }`} 
                              />
                            </button>
                            
                            {selectedPreset === preset.name && (
                              <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center">
                                <div className="flex gap-1">
                                  <Button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      onPresetUse?.(preset)
                                    }}
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 h-6"
                                  >
                                    Use
                                  </Button>
                                  <Button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      onPresetExport?.(preset)
                                    }}
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1 h-6"
                                  >
                                    Export
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Default Presets Section */}
                <div>
                  <button
                    onClick={() => toggleSection('presets')}
                    className="w-full flex items-center justify-between text-xs font-medium text-gray-400 mb-2 hover:text-gray-300"
                  >
                    <div className="flex items-center">
                      <Settings className="w-3 h-3 mr-1" />
                      Presets ({defaultPresets.length})
                    </div>
                    {expandedSections.presets ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                  {expandedSections.presets && (
                    <div className="grid grid-cols-3 gap-2">
                      {defaultPresets.map((preset) => (
                        <div
                          key={preset.id}
                          className={`relative cursor-pointer rounded-lg overflow-hidden h-16 ${
                            selectedPreset === preset.name ? 'ring-2 ring-blue-500' : ''
                          }`}
                          onClick={() => onPresetSelect?.(preset)}
                        >
                          <div className={`w-full h-full ${preset.preview}`}></div>
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <div className="text-center">
                              <div className="text-white text-xs font-medium">{preset.name.split(' ')[0]}</div>
                              <div className="text-gray-300 text-xs">{preset.strength}%</div>
                            </div>
                          </div>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onToggleFavorite?.(preset.id)
                            }}
                            className="absolute top-1 right-1 p-1 rounded-full bg-black/50"
                          >
                            <Star 
                              className={`w-3 h-3 ${
                                favoritePresets.includes(preset.id) 
                                  ? 'text-yellow-400 fill-yellow-400' 
                                  : 'text-white'
                              }`} 
                            />
                          </button>
                          
                          {selectedPreset === preset.name && (
                            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center">
                              <div className="flex gap-1">
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onPresetUse?.(preset)
                                  }}
                                  size="sm"
                                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 h-6"
                                >
                                  Use
                                </Button>
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onPresetExport?.(preset)
                                  }}
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1 h-6"
                                >
                                  Export
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Tools Grid */
              <div className="grid grid-cols-4 gap-2">
                {currentTools.map((tool) => (
                  <div key={tool.id} className="flex flex-col items-center">
                    <Button
                      onClick={() => handleToolSelect(tool)}
                      variant="ghost"
                      className={`w-12 h-12 p-0 rounded-lg border transition-all ${
                        selectedTool === tool.id
                          ? 'bg-purple-600 border-purple-500 text-white'
                          : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-white hover:border-gray-600'
                      }`}
                    >
                      <tool.icon className="h-5 w-5" />
                    </Button>
                    <span className="text-xs text-gray-400 mt-0.5 text-center leading-tight">
                      {tool.label}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Compact Adjustment Slider for Selected Tool */}
            {selectedTool && (() => {
              const tool = toolItems.find(t => t.id === selectedTool);
              if (tool?.adjustment) {
                const value = getAdjustmentValue(tool.adjustment);
                return (
                  <div className="mt-3 px-2">
                    <div className="flex items-center space-x-3">
                      <span className="text-xs text-gray-400 w-12 text-right">{value}</span>
                      <input
                        type="range"
                        min="-100"
                        max="100"
                        value={value}
                        onChange={(e) => handleColorAdjustment(tool.adjustment!, [parseInt(e.target.value)])}
                        className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                        style={{
                          background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${((value + 100) / 200) * 100}%, #374151 ${((value + 100) / 200) * 100}%, #374151 100%)`
                        }}
                      />
                      <span className="text-xs text-gray-500 w-8">+</span>
                    </div>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        </div>
      )}
    </div>
  );
} 