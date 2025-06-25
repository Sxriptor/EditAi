import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Download, 
  ImageIcon, 
  Upload, 
  Save, 
  Undo, 
  Redo, 
  FolderOpen,
  ChevronDown,
  ChevronUp,
  Sun,
  Contrast,
  Palette,
  Sparkles,
  BarChart3,
  Sliders,
  Target,
  Gauge,
  Droplets,
  Zap,
  CircleDot,
  Layers,
  Film,
  Star,
  ChevronRight
} from 'lucide-react';
import BasicAdjustments from './panels/BasicAdjustments';
import ColorGrading from './panels/ColorGrading';
import Histogram from './tools/Histogram';
import ModernSlider from './tools/ModernSlider';
import ColorWheel from './tools/ColorWheel';
import ToneCurve from './tools/ToneCurve';
import AIPromptSection from './AIPromptSection';
import { ImportStyleButton } from './ImportStyleButton';

interface ModernRightSidebarProps {
  hasMedia: boolean;
  mediaType: 'image' | 'video' | null;
  handleExport: () => void;
  colorAdjustments: any;
  handleColorAdjustment: (key: string, value: any) => void;
  handleColorWheelChange: (wheelType: 'shadowsWheel' | 'midtonesWheel' | 'highlightsWheel', newValue: { h: number, s: number, l: number }) => void;
  handleFileUpload: () => void;
  // AI Prompt functionality
  workflowMode: 'color-grade' | 'image-repurpose';
  handleWorkflowModeChange: (mode: 'color-grade' | 'image-repurpose') => void;
  prompt: string;
  setPrompt: (prompt: string) => void;
  handleGenerateLook: () => void;
  isProcessing: boolean;
  selectedPromptStyles: string[];
  selectedMainFocus: string[];
  promptHistory: string[];
  setShowPromptStyles: (show: boolean) => void;
  setShowMainFocus: (show: boolean) => void;
  enhancedAnalysis?: boolean;
  setEnhancedAnalysis?: (enabled: boolean) => void;
  // Project functionality
  currentProject?: any;
  onSaveToProject?: () => void;
  hasUnsavedChanges?: boolean;
  // Image data for histogram
  imageData?: ImageData | null;
  // LUT Presets functionality
  lutPresets?: any[];
  favoritePresets?: (number | string)[];
  selectedPreset?: string | null;
  onPresetSelect?: (preset: any) => void;
  onPresetUse?: (preset: any) => void;
  onPresetExport?: (preset: any) => void;
  onToggleFavorite?: (presetId: number | string) => void;
  onSaveStyle?: () => void;
}

export default function ModernRightSidebar({
  hasMedia,
  // mediaType,
  handleExport,
  colorAdjustments,
  handleColorAdjustment,
  handleColorWheelChange,
  handleFileUpload,
  // AI Prompt functionality
  workflowMode,
  handleWorkflowModeChange,
  prompt,
  setPrompt,
  handleGenerateLook,
  isProcessing,
  selectedPromptStyles,
  selectedMainFocus,
  promptHistory,
  setShowPromptStyles,
  setShowMainFocus,
  enhancedAnalysis,
  setEnhancedAnalysis,
  currentProject,
  onSaveToProject,
  hasUnsavedChanges = false,
  imageData,
  // LUT Presets functionality
  lutPresets = [],
  favoritePresets = [],
  selectedPreset,
  onPresetSelect,
  onPresetUse,
  onPresetExport,
  onToggleFavorite,
  onSaveStyle
}: ModernRightSidebarProps) {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    favorites: true,
    myPresets: true,
    presets: true
  });

  const toggleItem = (item: string) => {
    setExpandedItem(expandedItem === item ? null : item);
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

  // Define all adjustment items with their icons and control types
  const adjustmentItems = [
    {
      id: 'lutPresets',
      label: 'LUT Presets',
      icon: Palette,
      color: 'text-purple-400',
      type: 'presets' as const
    },
    {
      id: 'histogram',
      label: 'Histogram',
      icon: BarChart3,
      color: 'text-emerald-400',
      type: 'histogram' as const
    },
    {
      id: 'exposure',
      label: 'Exposure',
      icon: Sun,
      color: 'text-yellow-400',
      type: 'slider' as const,
      key: 'exposure',
      min: -200,
      max: 200,
      step: 1
    },
    {
      id: 'exposureCurve',
      label: 'Exposure Curve',
      icon: Sun,
      color: 'text-yellow-400',
      type: 'curve' as const
    },
    {
      id: 'contrast',
      label: 'Contrast',
      icon: Contrast,
      color: 'text-purple-400',
      type: 'slider' as const,
      key: 'contrast',
      min: -200,
      max: 200,
      step: 1
    },
    {
      id: 'contrastCurve',
      label: 'Contrast Curve',
      icon: Contrast,
      color: 'text-purple-400',
      type: 'curve' as const
    },
    {
      id: 'highlights',
      label: 'Highlights',
      icon: Sparkles,
      color: 'text-orange-400',
      type: 'slider' as const,
      key: 'highlights',
      min: -200,
      max: 200,
      step: 1
    },
    {
      id: 'shadows',
      label: 'Shadows',
      icon: CircleDot,
      color: 'text-indigo-400',
      type: 'slider' as const,
      key: 'shadows',
      min: -200,
      max: 200,
      step: 1
    },
    {
      id: 'hue',
      label: 'Hue',
      icon: Palette,
      color: 'text-pink-400',
      type: 'slider' as const,
      key: 'hue',
      min: -180,
      max: 180,
      step: 1
    },
    {
      id: 'gamma',
      label: 'Gamma',
      icon: Sliders,
      color: 'text-orange-400',
      type: 'slider' as const,
      key: 'gamma',
      min: 0.1,
      max: 2.0,
      step: 0.1
    },
    {
      id: 'brightness',
      label: 'Brightness',
      icon: Sun,
      color: 'text-yellow-300',
      type: 'slider' as const,
      key: 'brightness',
      min: -200,
      max: 200,
      step: 1
    },
    {
      id: 'saturation',
      label: 'Saturation',
      icon: Droplets,
      color: 'text-pink-400',
      type: 'slider' as const,
      key: 'saturation',
      min: -200,
      max: 200,
      step: 1
    },
    {
      id: 'saturationCurve',
      label: 'Saturation Curve',
      icon: Droplets,
      color: 'text-pink-400',
      type: 'curve' as const
    },
    {
      id: 'temperature',
      label: 'Temperature',
      icon: Zap,
      color: 'text-cyan-400',
      type: 'slider' as const,
      key: 'temperature',
      min: -200,
      max: 200,
      step: 1
    },
    {
      id: 'vibrance',
      label: 'Vibrance',
      icon: Layers,
      color: 'text-emerald-400',
      type: 'slider' as const,
      key: 'vibrance',
      min: -200,
      max: 200,
      step: 1
    },
    {
      id: 'clarity',
      label: 'Clarity',
      icon: Target,
      color: 'text-blue-300',
      type: 'slider' as const,
      key: 'clarity',
      min: -200,
      max: 200,
      step: 1
    },
    {
      id: 'shadowsWheel',
      label: 'Shadow Highlight',
      icon: Target,
      color: 'text-gray-400',
      type: 'colorwheel' as const,
      wheelType: 'shadowsWheel' as const
    },
    {
      id: 'midtonesWheel',
      label: 'Midtones',
      icon: Target,
      color: 'text-gray-300',
      type: 'colorwheel' as const,
      wheelType: 'midtonesWheel' as const
    },
    {
      id: 'highlightsWheel',
      label: 'Highlights',
      icon: Target,
      color: 'text-white',
      type: 'colorwheel' as const,
      wheelType: 'highlightsWheel' as const
    }
  ];

  const renderControl = (item: any) => {
    switch (item.type) {
      case 'presets':
        return (
          <div className="px-4 pb-4 space-y-3">
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
                  <div className="grid grid-cols-4 gap-2">
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
                            <div className="flex flex-col gap-1">
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onPresetUse?.(preset)
                                }}
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 h-5"
                              >
                                Use
                              </Button>
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onPresetExport?.(preset)
                                }}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1 h-5"
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
                  <div className="grid grid-cols-4 gap-2">
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
                          className="absolute top-1 right-1 p-1 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
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
                            <div className="flex flex-col gap-1">
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onPresetUse?.(preset)
                                }}
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 h-5"
                              >
                                Use
                              </Button>
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onPresetExport?.(preset)
                                }}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1 h-5"
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
                <div className="grid grid-cols-4 gap-2">
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
                        className="absolute top-1 right-1 p-1 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
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
                          <div className="flex flex-col gap-1">
                            <Button
                              onClick={(e) => {
                                e.stopPropagation()
                                onPresetUse?.(preset)
                              }}
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 h-5"
                            >
                              Use
                            </Button>
                            <Button
                              onClick={(e) => {
                                e.stopPropagation()
                                onPresetExport?.(preset)
                              }}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1 h-5"
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
        );
      
      case 'histogram':
        return (
          <div className="px-4 pb-4">
            <Histogram imageData={imageData} width={280} height={120} />
          </div>
        );
      
             case 'slider':
         return (
           <div className="px-4 pb-4">
             <ModernSlider
               label={item.label}
               value={Array.isArray(colorAdjustments[item.key]) ? colorAdjustments[item.key][0] : (colorAdjustments[item.key] || 0)}
               onChange={(value) => handleColorAdjustment(item.key, [value])}
               min={item.min}
               max={item.max}
               step={item.step}
               disabled={!hasMedia}
             />
           </div>
         );
      
             case 'curve':
         return (
           <div className="px-4 pb-4">
             <ToneCurve
               width={280}
               height={180}
               title={item.label}
               value={colorAdjustments[`${item.id}Points`] || [
                 { x: 0, y: 0 },
                 { x: 0.25, y: 0.25 },
                 { x: 0.5, y: 0.5 },
                 { x: 0.75, y: 0.75 },
                 { x: 1, y: 1 }
               ]}
               onChange={(points) => {
                 handleColorAdjustment(`${item.id}Points`, points);
               }}
               disabled={!hasMedia}
             />
           </div>
         );
      
             case 'colorwheel':
         return (
           <div className="px-4 pb-4">
             <ColorWheel
               title={item.label}
               value={colorAdjustments[item.wheelType] || { h: 0, s: 0, l: 0 }}
               onChange={(value) => handleColorWheelChange(item.wheelType, value)}
               size={120}
               disabled={!hasMedia}
             />
           </div>
         );
      
      default:
        return null;
    }
  };

  return (
    <aside className="w-96 border-l border-gray-800 bg-gradient-to-b from-gray-900 to-gray-950 hidden xl:flex flex-col flex-shrink-0 relative">
      {/* No Media Overlay */}
      {!hasMedia && (
        <div className="absolute inset-0 bg-gray-900/95 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-600/20 to-emerald-600/20 rounded-full flex items-center justify-center border border-gray-700">
              <ImageIcon className="h-8 w-8 text-gray-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-white">No Media Loaded</h3>
              <p className="text-sm text-gray-400 max-w-xs">
                Upload a photo or video to start editing and access professional color grading tools
              </p>
            </div>
            <Button 
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg"
              onClick={handleFileUpload}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Media
            </Button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700 p-4 z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Settings className="h-4 w-4 text-purple-400" />
            <span className="text-sm font-semibold text-white">Color Studio</span>
          </div>
          <Badge variant="outline" className="text-xs border-purple-500/30 text-purple-300 bg-purple-500/10">
            sRGB
          </Badge>
        </div>

        {/* Project Controls */}
        {hasMedia && (
          <div className="space-y-3">
            {/* Project Info */}
            {currentProject && (
              <div className="flex items-center space-x-2 text-xs text-gray-300 bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                <FolderOpen className="h-3 w-3 text-purple-400" />
                <span className="truncate font-medium">{currentProject.name}</span>
                {hasUnsavedChanges && (
                  <Badge variant="outline" className="text-xs px-2 py-0 text-orange-300 border-orange-400/30 bg-orange-400/10">
                    Unsaved
                  </Badge>
                )}
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <Button 
                onClick={handleExport}
                className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white h-8 text-xs shadow-md"
              >
                <Download className="h-3 w-3 mr-1" />
                Export
              </Button>
              
              {onSaveToProject && (
                <Button
                  onClick={onSaveToProject}
                  variant="outline"
                  className={`h-8 text-xs border-gray-600 hover:border-gray-500 ${
                    hasUnsavedChanges 
                      ? 'border-orange-400/50 text-orange-300 hover:bg-orange-400/10' 
                      : 'text-gray-300'
                  }`}
                  disabled={!hasUnsavedChanges}
                >
                  <Save className="h-3 w-3 mr-1" />
                  Save
                </Button>
              )}
            </div>

            {/* Save/Import Style Buttons */}
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Button
                onClick={onSaveStyle}
                variant="outline"
                className="h-8 text-xs border-purple-500/50 text-purple-300 hover:bg-purple-500/10 hover:border-purple-400"
                disabled={!hasMedia}
              >
                <Palette className="h-3 w-3 mr-1" />
                Save Style
              </Button>

              {hasMedia && (
                <ImportStyleButton
                  onImport={(adjustments: Record<string, number[]>) => {
                    Object.entries(adjustments).forEach(([key, value]) => {
                      handleColorAdjustment(key, value);
                    });
                  }}
                />
              )}
            </div>

          </div>
        )}
      </div>

      {/* Individual Adjustment Accordions - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3 space-y-1">
          {adjustmentItems.map((item) => (
            <div key={item.id} className="bg-gray-800/30 rounded-lg border border-gray-700/50 overflow-hidden">
              <button
                onClick={() => toggleItem(item.id)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <item.icon className={`h-4 w-4 ${item.color}`} />
                  <span className="text-sm font-medium text-white">{item.label}</span>
                </div>
                {expandedItem === item.id ? 
                  <ChevronUp className="h-4 w-4 text-gray-400" /> : 
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                }
              </button>
              {expandedItem === item.id && renderControl(item)}
            </div>
          ))}
        </div>
      </div>

      {/* AI Prompt Section - Fixed at Bottom */}
      {hasMedia && (
        <div className="border-t border-gray-700 bg-gray-900/50 backdrop-blur-sm">
          <AIPromptSection
            workflowMode={workflowMode}
            handleWorkflowModeChange={handleWorkflowModeChange}
            prompt={prompt}
            setPrompt={setPrompt}
            handleGenerateLook={handleGenerateLook}
            isProcessing={isProcessing}
            selectedPromptStyles={selectedPromptStyles}
            selectedMainFocus={selectedMainFocus}
            promptHistory={promptHistory}
            setShowPromptStyles={setShowPromptStyles}
            setShowMainFocus={setShowMainFocus}
            enhancedAnalysis={enhancedAnalysis}
            setEnhancedAnalysis={setEnhancedAnalysis}
            hasMedia={hasMedia}
          />
        </div>
      )}
    </aside>
  );
}