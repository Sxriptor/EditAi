import React from 'react';
import { Button } from '@/components/ui/button';
import { X, HelpCircle, Eye, Palette, Split } from 'lucide-react';

interface BottomControlsProps {
  hasMedia: boolean;
  showOriginal: boolean;
  setShowOriginal: React.Dispatch<React.SetStateAction<boolean>>;
  handleCloseImage: () => void;
  setShowColorPalette: React.Dispatch<React.SetStateAction<boolean>>;
  showDiagonalSplit: boolean;
  setShowDiagonalSplit: React.Dispatch<React.SetStateAction<boolean>>;
  handleExtractColors: () => void;
  showColorPalette: boolean;
  showHelpHints: boolean;
  setShowHelpHints: React.Dispatch<React.SetStateAction<boolean>>;
}

const BottomControls = ({
  hasMedia,
  showOriginal,
  setShowOriginal,
  handleCloseImage,
  setShowColorPalette,
  showDiagonalSplit,
  setShowDiagonalSplit,
  handleExtractColors,
  showColorPalette,
  showHelpHints,
  setShowHelpHints
}: BottomControlsProps) => {
  return (
    <div className="border-t border-gray-800 p-2 bg-gray-900/50 flex-shrink-0">
      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleCloseImage}
            className="h-8 w-8 p-0 border-gray-600 hover:border-red-500 text-gray-400 hover:text-red-400"
            title="Close image"
          >
            <X className="h-4 w-4" />
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowHelpHints(!showHelpHints)}
            className={`h-8 w-8 p-0 border-gray-600 hover:border-blue-500 ${
              showHelpHints ? 'text-blue-400 border-blue-500' : 'text-gray-400 hover:text-blue-400'
            }`}
            title="Toggle help hints"
          >
            <HelpCircle className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowOriginal(!showOriginal)}
            className={`h-8 w-8 p-0 border-gray-600 hover:border-purple-500 ${
              showOriginal ? 'text-purple-400 border-purple-500' : 'text-gray-400 hover:text-purple-400'
            }`}
            title={showOriginal ? "Hide original" : "Show before/after"}
          >
            <Eye className="h-4 w-4" />
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowDiagonalSplit(!showDiagonalSplit)}
            className={`h-8 w-8 p-0 border-gray-600 hover:border-purple-500 ${
              showDiagonalSplit ? 'text-purple-400 border-purple-500' : 'text-gray-400 hover:text-purple-400'
            }`}
            title="Toggle diagonal before/after split"
          >
            <Split className="h-4 w-4" />
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={handleExtractColors}
            className={`h-8 w-8 p-0 border-gray-600 hover:border-green-500 ${
              showColorPalette ? 'text-green-400 border-green-500' : 'text-gray-400 hover:text-green-400'
            }`}
            disabled={!hasMedia}
            title="Extract color palette from image"
          >
            <Palette className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BottomControls; 