import React from 'react';
import { Button } from '@/components/ui/button';
import { Eye, Share2, RotateCcw, Star, Download } from 'lucide-react';

interface QuickActionsProps {
  hasMedia: boolean;
  showOriginal: boolean;
  setShowOriginal: React.Dispatch<React.SetStateAction<boolean>>;
  handleResetAdjustments: () => void;
  saveAsTemplate: (name: string) => void;
  exportLUT: () => void;
  colorAdjustments: any;
}

const QuickActions = ({
  hasMedia,
  showOriginal,
  setShowOriginal,
  handleResetAdjustments,
  saveAsTemplate,
  exportLUT,
  colorAdjustments
}: QuickActionsProps) => {
  return (
    <div className="space-y-1">
      <div className="flex space-x-1">
        <Button
          size="sm"
          variant={showOriginal ? "secondary" : "outline"}
          onClick={() => setShowOriginal(!showOriginal)}
          className="flex-1 border-gray-600 h-6 text-xs"
        >
          <Eye className="h-2 w-2 mr-0.5" />
          {showOriginal ? "Hide" : "Show"}
        </Button>
        <Button size="sm" variant="outline" className="border-gray-600 h-6 w-6 p-0">
          <Share2 className="h-2 w-2" />
        </Button>
      </div>
      
      {/* Reset and Copy Controls */}
      {hasMedia && (
        <>
          <div className="flex space-x-1">
            <Button
              size="sm"
              variant="outline"
              onClick={handleResetAdjustments}
              className="flex-1 border-gray-600 h-6 text-xs"
            >
              <RotateCcw className="h-2 w-2 mr-0.5" />
              Reset
            </Button>

            {/* Save Template Button */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const templateName = window.prompt('Enter template name:')
                if (templateName) {
                  saveAsTemplate(templateName.trim())
                }
              }}
              className="flex-1 border-gray-600 h-6 text-xs"
            >
              <Star className="h-2 w-2 mr-0.5" />
              Save
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="flex-1 border-gray-600 h-6 text-xs"
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(colorAdjustments))
                console.log('Adjustments copied to clipboard')
              }}
            >
              Copy
            </Button>
          </div>
          
          {/* LUT Export */}
          <div className="flex space-x-1">
            <Button
              size="sm"
              variant="outline"
              onClick={exportLUT}
              className="flex-1 border-gray-600 h-6 text-xs"
            >
              <Download className="h-2 w-2 mr-0.5" />
              Export LUT
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default QuickActions; 