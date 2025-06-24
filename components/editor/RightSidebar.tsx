import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Settings, Download, Wand2, Palette, Sliders, Star, MoreHorizontal, X, Upload, ImageIcon, Save, Undo, Redo, FolderOpen } from 'lucide-react'
import { StyleCustomizationAccordion } from './StyleCustomizationAccordion'
import FileMetadataPanel from './FileMetadataPanel'
import LUTControls from './LUTControls'
import QuickActions from './QuickActions'
import WorkflowControls from './WorkflowControls'
import AIPromptSection from './AIPromptSection'

interface RightSidebarProps {
  hasMedia: boolean
  mediaType: 'image' | 'video' | null
  handleExport: () => void
  presetViewMode: 'presets' | 'favorites'
  setPresetViewMode: (mode: 'presets' | 'favorites') => void
  defaultPresets: any[]
  loadPresetStyle: (presetName: string) => void
  savedStyles: any[]
  loadStyle: (style: any) => void
  downloadLUT: (style: any) => void
  deleteStyle: (index: number) => void
  colorAdjustments: any
  handleColorAdjustment: (key: string, value: any) => void
  handleColorWheelChange: (wheelType: 'shadowsWheel' | 'midtonesWheel' | 'highlightsWheel', newValue: { h: number, s: number, l: number }) => void
  fileMetadata: any
  lutStrength: number[]
  setLutStrength: React.Dispatch<React.SetStateAction<number[]>>
  lutPresets: any[]
  selectedPreset: string | null
  applyLUTPreset: (presetName: string) => void
  showOriginal: boolean
  setShowOriginal: React.Dispatch<React.SetStateAction<boolean>>
  handleResetAdjustments: () => void
  saveAsTemplate: (name: string) => void
  exportLUT: () => void
  workflowMode: 'color-grade' | 'image-repurpose'
  handleWorkflowModeChange: (mode: 'color-grade' | 'image-repurpose') => void
  showPromptStyles: boolean
  setShowPromptStyles: React.Dispatch<React.SetStateAction<boolean>>
  selectedPromptStyles: string[]
  showMainFocus: boolean
  setShowMainFocus: React.Dispatch<React.SetStateAction<boolean>>
  selectedMainFocus: string[]
  prompt: string
  setPrompt: (prompt: string) => void
  handleGenerateLook: () => void
  isProcessing: boolean
  promptHistory: any[]
  handleFileUpload: () => void
  // Project functionality
  currentProject?: any
  currentProjectFile?: any
  onSaveToProject?: () => void
  onUndo?: () => void
  onRedo?: () => void
  canUndo?: boolean
  canRedo?: boolean
  hasUnsavedChanges?: boolean
}

export default function RightSidebar({
  hasMedia,
  mediaType,
  handleExport,
  presetViewMode,
  setPresetViewMode,
  defaultPresets,
  loadPresetStyle,
  savedStyles,
  loadStyle,
  downloadLUT,
  deleteStyle,
  colorAdjustments,
  handleColorAdjustment,
  handleColorWheelChange,
  fileMetadata,
  lutStrength,
  setLutStrength,
  lutPresets,
  selectedPreset,
  applyLUTPreset,
  showOriginal,
  setShowOriginal,
  handleResetAdjustments,
  saveAsTemplate,
  exportLUT,
  workflowMode,
  handleWorkflowModeChange,
  showPromptStyles,
  setShowPromptStyles,
  selectedPromptStyles,
  showMainFocus,
  setShowMainFocus,
  selectedMainFocus,
  prompt,
  setPrompt,
  handleGenerateLook,
  isProcessing,
  promptHistory,
  handleFileUpload,
  // Project functionality
  currentProject,
  currentProjectFile,
  onSaveToProject,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  hasUnsavedChanges = false
}: RightSidebarProps) {
  return (
    <aside className="w-96 border-l border-gray-800 bg-gray-900 hidden xl:flex flex-col flex-shrink-0 relative">
      {/* No Media Overlay */}
      {!hasMedia && (
        <div className="absolute inset-0 bg-gray-900/95 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-gray-800/50 rounded-full flex items-center justify-center">
              <ImageIcon className="h-8 w-8 text-gray-500" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-white">No Media Loaded</h3>
              <p className="text-sm text-gray-400 max-w-xs">
                Please upload a photo or video to start editing and access all controls
              </p>
            </div>
            <Button 
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
              onClick={handleFileUpload}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Media
            </Button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-2">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-1.5">
            <Settings className="h-3 w-3 text-gray-400" />
            <span className="text-xs font-medium text-white">Controls</span>
          </div>
          <Badge variant="outline" className="text-xs border-gray-700 text-gray-400 px-1 py-0">
            sRGB
          </Badge>
        </div>

        {/* Export Button */}
        {hasMedia && (
          <div className="mb-3">
            <Button 
              onClick={handleExport}
              className="w-full bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 h-7 text-xs"
            >
              <Download className="h-3 w-3 mr-1" />
              Export {mediaType === 'video' ? 'Video' : 'Image'}
            </Button>
          </div>
        )}

        {/* Project Controls */}
        {hasMedia && (
          <div className="mb-3 space-y-2">
            {/* Project Info */}
            {currentProject && (
              <div className="flex items-center space-x-2 text-xs text-gray-400 bg-gray-800/30 rounded-lg p-2">
                <FolderOpen className="h-3 w-3" />
                <span className="truncate">{currentProject.name}</span>
                {hasUnsavedChanges && (
                  <Badge variant="outline" className="text-xs px-1 py-0 text-orange-400 border-orange-400/30">
                    Unsaved
                  </Badge>
                )}
              </div>
            )}
            
            {/* Save and Undo/Redo Controls */}
            <div className="flex space-x-1">
              {onSaveToProject && (
                <Button
                  onClick={onSaveToProject}
                  variant="outline"
                  className={`flex-1 h-7 text-xs ${
                    hasUnsavedChanges 
                      ? 'border-orange-400/50 text-orange-400 hover:bg-orange-400/10' 
                      : 'border-gray-600 text-gray-400'
                  }`}
                  disabled={!hasUnsavedChanges}
                >
                  <Save className="h-3 w-3 mr-1" />
                  Save
                </Button>
              )}
              
              <div className="flex space-x-1">
                <Button
                  onClick={onUndo}
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 p-0 border-gray-600 text-gray-400 hover:text-white"
                  disabled={!canUndo}
                  title="Undo (Ctrl+Z)"
                >
                  <Undo className="h-3 w-3" />
                </Button>
                <Button
                  onClick={onRedo}
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 p-0 border-gray-600 text-gray-400 hover:text-white"
                  disabled={!canRedo}
                  title="Redo (Ctrl+Y)"
                >
                  <Redo className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Tools */}
        <div className="space-y-1 mb-4">
          <Button
            variant="ghost"
            className="w-full justify-start h-6 bg-purple-500/20 text-purple-400 border border-purple-500/30 text-xs"
            onClick={() => {
              // Focus on the prompt input field
              const promptInput = document.querySelector('textarea[placeholder*="prompt"]') as HTMLTextAreaElement
              if (promptInput) {
                promptInput.focus()
                promptInput.scrollIntoView({ behavior: 'smooth', block: 'center' })
              }
            }}
            title="Jump to AI prompt input"
          >
            <Wand2 className="h-3 w-3 mr-2" />
            AI Prompt
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start h-6 text-gray-400 hover:text-white hover:bg-gray-800/50 text-xs"
          >
            <Palette className="h-3 w-3 mr-2" />
            Color Match
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start h-6 text-gray-400 hover:text-white hover:bg-gray-800/50 text-xs"
          >
            <Sliders className="h-3 w-3 mr-2" />
            Balance
          </Button>
        </div>

        {/* Presets & Favorites Container */}
        <div className="space-y-2 mb-4">
          {/* Toggle Header */}
          <div className="flex items-center bg-gray-800/30 rounded-lg p-0.5">
            <Button
              variant={presetViewMode === 'presets' ? 'default' : 'ghost'}
              size="sm"
              className={`flex-1 h-5 text-xs ${
                presetViewMode === 'presets'
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
              onClick={() => setPresetViewMode('presets')}
            >
              <Palette className="h-2 w-2 mr-1" />
              Presets
            </Button>
            <Button
              variant={presetViewMode === 'favorites' ? 'default' : 'ghost'}
              size="sm"
              className={`flex-1 h-5 text-xs ${
                presetViewMode === 'favorites'
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
              onClick={() => setPresetViewMode('favorites')}
            >
              <Star className="h-2 w-2 mr-1" />
              Favorites
            </Button>
          </div>

          {/* Presets Grid */}
          {presetViewMode === 'presets' && (
            <div className="grid grid-cols-4 gap-1">
              {defaultPresets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => loadPresetStyle(preset.name)}
                  className="group bg-gray-800/40 hover:bg-gray-800/70 border border-gray-700 hover:border-gray-600 rounded-lg p-1 transition-all duration-200 hover:scale-105"
                >
                  <div 
                    className="w-full h-4 rounded mb-1 opacity-80 group-hover:opacity-100 transition-opacity"
                    style={{ 
                      background: `linear-gradient(45deg, ${preset.preview}, ${preset.preview}dd)` 
                    }}
                  />
                  <span className="text-xs text-gray-300 group-hover:text-white font-medium block truncate">
                    {preset.name}
                  </span>
                  <span className="text-xs text-gray-500 group-hover:text-gray-400 capitalize">
                    {preset.category}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Favorites (Saved Styles) */}
          {presetViewMode === 'favorites' && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {savedStyles.length > 0 ? (
                savedStyles.map((style, index) => (
                  <div key={index} className="group bg-gray-800/50 rounded-lg p-3 border border-gray-700 hover:border-purple-500/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-white">{style.name}</h4>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-400 hover:text-white">
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-gray-900 border-gray-700">
                          <DropdownMenuItem onClick={() => loadStyle(style)}>
                            <Palette className="h-4 w-4 mr-2" />
                            Apply Style
                          </DropdownMenuItem>
                          {style.lut_data && (
                            <DropdownMenuItem onClick={() => downloadLUT(style)}>
                              <Download className="h-4 w-4 mr-2" />
                              Download LUT
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            onClick={() => deleteStyle(index)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <p className="text-xs text-gray-400 mb-2">{style.description}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full h-7 text-xs bg-purple-600/20 text-purple-400 hover:bg-purple-600/30"
                      onClick={() => loadStyle(style)}
                    >
                      Apply Style
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 space-y-2">
                  <Star className="h-8 w-8 mx-auto text-gray-600" />
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium text-gray-400">No favorites yet</h3>
                    <p className="text-xs text-gray-500">
                      Generate AI looks and save your favorites here
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Color Adjustments - Accordion Style */}
        <StyleCustomizationAccordion 
          colorAdjustments={colorAdjustments}
          handleColorAdjustment={handleColorAdjustment}
          handleColorWheelChange={handleColorWheelChange}
          hasMedia={hasMedia}
        />

        {/* File Metadata */}
        <FileMetadataPanel fileMetadata={fileMetadata} />

        {/* LUT Controls */}
        <LUTControls 
          lutStrength={lutStrength}
          setLutStrength={setLutStrength}
          lutPresets={lutPresets}
          selectedPreset={selectedPreset}
          applyLUTPreset={applyLUTPreset}
          hasMedia={hasMedia}
        />

        {/* Quick Actions */}
        <QuickActions 
          hasMedia={hasMedia}
          showOriginal={showOriginal}
          setShowOriginal={setShowOriginal}
          handleResetAdjustments={handleResetAdjustments}
          saveAsTemplate={saveAsTemplate}
          exportLUT={exportLUT}
          colorAdjustments={colorAdjustments}
        />
      </div>

      {/* Bottom controls section */}
      <div className="flex-shrink-0 p-1">
        {/* Workflow Controls */}
        <WorkflowControls
          workflowMode={workflowMode}
          handleWorkflowModeChange={handleWorkflowModeChange}
          showPromptStyles={showPromptStyles}
          setShowPromptStyles={setShowPromptStyles}
          selectedPromptStyles={selectedPromptStyles}
          showMainFocus={showMainFocus}
          setShowMainFocus={setShowMainFocus}
          selectedMainFocus={selectedMainFocus}
          hasMedia={hasMedia}
        />
        
        {/* AI Prompt Interface */}
        {hasMedia && (
          <AIPromptSection
            workflowMode={workflowMode}
            prompt={prompt}
            setPrompt={setPrompt}
            handleGenerateLook={handleGenerateLook}
            isProcessing={isProcessing}
            selectedPromptStyles={selectedPromptStyles}
            selectedMainFocus={selectedMainFocus}
            promptHistory={promptHistory}
          />
        )}
      </div>
    </aside>
  )
} 