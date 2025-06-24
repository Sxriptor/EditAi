import React from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Wand2, Sparkles, Filter, User, Clock, TrendingUp, Palette, Target, Settings } from "lucide-react";

interface AIPromptSectionProps {
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
}

const AIPromptSection = ({
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
  setShowMainFocus
}: AIPromptSectionProps) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <div 
      className="border-t border-gray-800 bg-gray-900 flex-shrink-0 transition-all duration-300 ease-in-out"
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Always visible header */}
      <div className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Wand2 className="h-4 w-4 text-purple-400" />
            <span className="text-sm font-medium text-white">AI Assistant</span>
          </div>
          
          {/* Workflow Mode Selector */}
          <div className="flex bg-gray-800 rounded-lg p-0.5">
            <Button
              onClick={() => handleWorkflowModeChange('color-grade')}
              variant={workflowMode === 'color-grade' ? 'default' : 'ghost'}
              size="sm"
              className={`h-6 px-2 text-xs ${
                workflowMode === 'color-grade' 
                  ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <Palette className="h-3 w-3 mr-1" />
              Color
            </Button>
            <Button
              onClick={() => handleWorkflowModeChange('image-repurpose')}
              variant={workflowMode === 'image-repurpose' ? 'default' : 'ghost'}
              size="sm"
              className={`h-6 px-2 text-xs ${
                workflowMode === 'image-repurpose' 
                  ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <Sparkles className="h-3 w-3 mr-1" />
              Repurpose
            </Button>
          </div>
        </div>
      </div>
      
      {/* Expandable content */}
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
        isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="px-3 pb-3 space-y-3">
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
              className="min-h-[60px] bg-gray-800 border-gray-700 text-white text-sm placeholder-gray-400 resize-none pr-12 rounded-lg"
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
            <div className="text-xs text-gray-500 mb-2 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              Trending
            </div>
            <div className="flex flex-wrap gap-1">
              {(workflowMode === 'color-grade' 
                ? [
                    "Cinematic orange & teal",
                    "Vintage film look", 
                    "Moody black & white",
                    "Golden hour warmth"
                  ]
                : [
                    "Standing in a luxury jet",
                    "Sitting by tropical beach",
                    "Walking through cyberpunk city",
                    "In a cozy coffee shop"
                  ]
              ).slice(0, 4).map((trendingPrompt) => (
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
      </div>
    </div>
  );
};

export default AIPromptSection; 