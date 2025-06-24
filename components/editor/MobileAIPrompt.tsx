import React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ChevronUp, ChevronDown, Wand2, Sparkles, Filter, Target, Loader2, Palette, Upload } from 'lucide-react';

interface MobileAIPromptProps {
  workflowMode: 'color-grade' | 'image-repurpose';
  handleWorkflowModeChange: (mode: 'color-grade' | 'image-repurpose') => void;
  prompt: string;
  setPrompt: (prompt: string) => void;
  handleGenerateLook: () => void;
  isProcessing: boolean;
  selectedPromptStyles: string[];
  selectedMainFocus: string[];
  setShowPromptStyles: (show: boolean) => void;
  setShowMainFocus: (show: boolean) => void;
  isExpanded: boolean;
  onToggle: () => void;
  isCompact?: boolean; // When color panel is expanded, make this compact
  hasMedia?: boolean;
  handleFileUpload?: () => void;
}

export default function MobileAIPrompt({
  workflowMode,
  handleWorkflowModeChange,
  prompt,
  setPrompt,
  handleGenerateLook,
  isProcessing,
  selectedPromptStyles,
  selectedMainFocus,
  setShowPromptStyles,
  setShowMainFocus,
  isExpanded,
  onToggle,
  isCompact = false,
  hasMedia = false,
  handleFileUpload
}: MobileAIPromptProps) {
  
  return (
    <div className="bg-gray-900 border-t border-gray-800">
      {/* No Media Upload Section */}
      {!hasMedia && handleFileUpload && (
        <div className="p-4 bg-gray-800/30 border-b border-gray-700">
          <Button
            onClick={handleFileUpload}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white h-10"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import Image or Video
          </Button>
        </div>
      )}

      {/* Header - Always visible */}
      <div className="flex items-center justify-between p-3 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800">
        <div className="flex items-center space-x-2">
          <Wand2 className="h-4 w-4 text-purple-400" />
          <span className="text-sm font-medium text-white">AI Assistant</span>
        </div>
        
        <Button
          onClick={onToggle}
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-gray-400 hover:text-white"
        >
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </Button>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="space-y-4 p-4 max-h-[30vh] overflow-y-auto">
          {/* Workflow Mode Selector */}
          <div className="flex bg-gray-800 rounded-lg p-1">
            <Button
              onClick={() => handleWorkflowModeChange('color-grade')}
              variant={workflowMode === 'color-grade' ? 'default' : 'ghost'}
              size="sm"
              className={`flex-1 h-8 text-xs ${
                workflowMode === 'color-grade' 
                  ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <Palette className="h-3 w-3 mr-1" />
              Color Grading
            </Button>
            <Button
              onClick={() => handleWorkflowModeChange('image-repurpose')}
              variant={workflowMode === 'image-repurpose' ? 'default' : 'ghost'}
              size="sm"
              className={`flex-1 h-8 text-xs ${
                workflowMode === 'image-repurpose' 
                  ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <Sparkles className="h-3 w-3 mr-1" />
              Image Repurpose
            </Button>
          </div>

          {/* Style and Focus Buttons */}
          <div className="flex space-x-2">
            <Button
              onClick={() => setShowPromptStyles(true)}
              variant="outline"
              size="sm"
              className={`flex-1 h-7 text-xs border-gray-700 hover:border-gray-500 ${
                selectedPromptStyles.length > 0 
                  ? 'border-purple-500/50 bg-purple-500/10 text-purple-300' 
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <Filter className="h-3 w-3 mr-1" />
              Styles {selectedPromptStyles.length > 0 && `(${selectedPromptStyles.length})`}
            </Button>
            
            {workflowMode === 'image-repurpose' && (
              <Button
                onClick={() => setShowMainFocus(true)}
                variant="outline"
                size="sm"
                className={`flex-1 h-7 text-xs border-gray-700 hover:border-gray-500 ${
                  selectedMainFocus.length > 0 
                    ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300' 
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                <Target className="h-3 w-3 mr-1" />
                Focus {selectedMainFocus.length > 0 && `(${selectedMainFocus.length})`}
              </Button>
            )}
          </div>

          {/* Main Prompt Input */}
          <div className="relative">
            <Textarea
              placeholder={
                workflowMode === 'color-grade'
                  ? "Describe the color grading you want..."
                  : "Describe the new image you want to create..."
              }
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[80px] bg-gray-800 border-gray-700 text-white text-sm placeholder-gray-400 resize-none pr-12 rounded-lg"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleGenerateLook()
                }
              }}
            />
            <Button
              onClick={handleGenerateLook}
              disabled={!prompt.trim() || isProcessing}
              className="absolute bottom-2 right-2 h-8 w-8 p-0 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-md"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          {/* Selected Context Indicators */}
          {(selectedPromptStyles.length > 0 || selectedMainFocus.length > 0) && (
            <div className="flex flex-wrap gap-1">
              {selectedPromptStyles.length > 0 && (
                <div className="flex items-center space-x-1 px-2 py-1 rounded-md text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  <Filter className="h-3 w-3" />
                  <span>{selectedPromptStyles.length} style{selectedPromptStyles.length > 1 ? 's' : ''}</span>
                </div>
              )}
              {selectedMainFocus.length > 0 && workflowMode === 'image-repurpose' && (
                <div className="flex items-center space-x-1 px-2 py-1 rounded-md text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <Target className="h-3 w-3" />
                  <span>{selectedMainFocus.length} focus area{selectedMainFocus.length > 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
          )}
          
          {/* Trending Prompts */}
          <div>
            <div className="text-xs text-gray-500 mb-2">Trending</div>
            <div className="flex flex-wrap gap-1">
              {(workflowMode === 'color-grade' 
                ? [
                    "Cinematic orange & teal",
                    "Vintage film look", 
                    "Moody black & white"
                  ]
                : [
                    "Standing in a luxury jet",
                    "Sitting by tropical beach",
                    "Walking through cyberpunk city"
                  ]
              ).slice(0, 3).map((trendingPrompt) => (
                <Button
                  key={trendingPrompt}
                  variant="outline"
                  size="sm"
                  className="text-xs h-6 px-2 py-0 border-gray-700 bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700"
                  onClick={() => setPrompt(trendingPrompt)}
                >
                  {trendingPrompt}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 