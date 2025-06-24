import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sliders, Sparkles, Filter, User, ChevronUp, ChevronDown } from 'lucide-react';

interface WorkflowControlsProps {
  workflowMode: 'color-grade' | 'image-repurpose';
  handleWorkflowModeChange: (mode: 'color-grade' | 'image-repurpose') => void;
  showPromptStyles: boolean;
  setShowPromptStyles: React.Dispatch<React.SetStateAction<boolean>>;
  selectedPromptStyles: string[];
  showMainFocus: boolean;
  setShowMainFocus: React.Dispatch<React.SetStateAction<boolean>>;
  selectedMainFocus: string[];
  hasMedia: boolean;
}

const WorkflowControls = ({
  workflowMode,
  handleWorkflowModeChange,
  showPromptStyles,
  setShowPromptStyles,
  selectedPromptStyles,
  showMainFocus,
  setShowMainFocus,
  selectedMainFocus,
  hasMedia
}: WorkflowControlsProps) => {
  return (
    <div className="flex-shrink-0">
              {/* Workflow Mode Toggle */}
      <div className="p-1 pb-0">
        <div className="flex rounded-lg overflow-hidden bg-gray-900 border border-gray-800">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleWorkflowModeChange('color-grade')}
            className={`flex-1 h-6 px-2 text-xs font-medium rounded-none ${
              workflowMode === 'color-grade'
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <Sliders className="h-2.5 w-2.5 mr-1" />
            Color Grade
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleWorkflowModeChange('image-repurpose')}
            className={`flex-1 h-6 px-2 text-xs font-medium rounded-none ${
              workflowMode === 'image-repurpose'
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <Sparkles className="h-2.5 w-2.5 mr-1" />
            Image Repurpose
          </Button>
        </div>
      </div>

              {/* Styles and Focus Buttons */}
      {hasMedia && (
        <div className="px-1 pb-0">
          <div className="flex rounded-lg overflow-hidden bg-gray-900 border border-gray-800">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowPromptStyles(!showPromptStyles)}
              className={`flex-1 h-5 px-2 text-xs font-medium rounded-none ${
                showPromptStyles || selectedPromptStyles.length > 0
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Filter className="h-2 w-2 mr-1" />
              Styles
              {selectedPromptStyles.length > 0 && (
                <Badge className="ml-0.5 bg-gray-700 text-white text-xs h-3 w-3 flex items-center justify-center">
                  {selectedPromptStyles.length}
                </Badge>
              )}
              <ChevronDown className="h-2 w-2 ml-auto" />
            </Button>
            
            {workflowMode === 'image-repurpose' && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowMainFocus(!showMainFocus)}
                className={`flex-1 h-5 px-2 text-xs font-medium rounded-none ${
                  showMainFocus || selectedMainFocus.length > 0
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <User className="h-2 w-2 mr-1" />
                Focus
                {selectedMainFocus.length > 0 && (
                  <Badge className="ml-0.5 bg-gray-700 text-white text-xs h-3 w-3 flex items-center justify-center">
                    {selectedMainFocus.length}
                  </Badge>
                )}
                <ChevronDown className="h-2 w-2 ml-auto" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowControls; 