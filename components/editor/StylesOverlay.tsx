import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  Filter, 
  PaletteIcon, 
  Film, 
  Droplets, 
  Camera as CameraIcon, 
  Star, 
  Clock, 
  Lightbulb, 
  Aperture, 
  Cloud, 
  Zap as EffectIcon, 
  Sparkles
} from 'lucide-react';

interface StylesOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  workflowMode: 'color-grade' | 'image-repurpose';
  stylesData: Record<string, string[]>;
  selectedStyles: string[];
  onToggleStyle: (style: string) => void;
  onClearStyles: () => void;
  onApplyStyles: () => void;
}

const StylesOverlay: React.FC<StylesOverlayProps> = ({
  isOpen,
  onClose,
  workflowMode,
  stylesData,
  selectedStyles,
  onToggleStyle,
  onClearStyles,
  onApplyStyles,
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className={`bg-gray-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col ${
        workflowMode === 'color-grade' 
          ? 'border border-purple-500/30' 
          : 'border border-emerald-500/30'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          workflowMode === 'color-grade'
            ? 'border-purple-500/20 bg-purple-900/10'
            : 'border-emerald-500/20 bg-emerald-900/10'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
              workflowMode === 'color-grade' 
                ? 'bg-purple-600/20' 
                : 'bg-emerald-600/20'
            }`}>
              <Filter className={`h-5 w-5 ${
                workflowMode === 'color-grade' 
                  ? 'text-purple-400' 
                  : 'text-emerald-400'
              }`} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                {workflowMode === 'color-grade' ? 'Color Grade Styles' : 'Image Styles'}
              </h2>
              <p className="text-sm text-gray-400">
                {workflowMode === 'color-grade' 
                  ? 'Choose color grading styles for your prompt (1 per category)' 
                  : 'Choose styles to enhance your prompt (1 per category)'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {selectedStyles.length > 0 && (
              <Badge className={`${
                workflowMode === 'color-grade' ? 'bg-purple-600' : 'bg-emerald-600'
              } text-white px-3 py-1`}>
                {selectedStyles.length} selected
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.entries(stylesData).map(([category, styles]) => (
              <div key={category} className="space-y-3">
                <div className="flex items-center space-x-2 pb-2 border-b border-gray-700/50">
                  <div className="flex items-center space-x-2">
                    {/* Color Grade Mode Icons */}
                    {workflowMode === 'color-grade' && category === 'look' && <PaletteIcon className="h-4 w-4 text-purple-400" />}
                    {workflowMode === 'color-grade' && category === 'film' && <Film className="h-4 w-4 text-orange-400" />}
                    {workflowMode === 'color-grade' && category === 'color' && <Droplets className="h-4 w-4 text-blue-400" />}
                    {workflowMode === 'color-grade' && category === 'style' && <CameraIcon className="h-4 w-4 text-green-400" />}
                    {workflowMode === 'color-grade' && category === 'mood' && <Star className="h-4 w-4 text-yellow-400" />}
                    {workflowMode === 'color-grade' && category === 'era' && <Clock className="h-4 w-4 text-cyan-400" />}
                    
                    {/* Image Repurpose Mode Icons */}
                    {workflowMode === 'image-repurpose' && category === 'lighting' && <Lightbulb className="h-4 w-4 text-yellow-400" />}
                    {workflowMode === 'image-repurpose' && category === 'camera' && <CameraIcon className="h-4 w-4 text-blue-400" />}
                    {workflowMode === 'image-repurpose' && category === 'lens' && <Aperture className="h-4 w-4 text-purple-400" />}
                    {workflowMode === 'image-repurpose' && category === 'weather' && <Cloud className="h-4 w-4 text-cyan-400" />}
                    {workflowMode === 'image-repurpose' && category === 'effects' && <EffectIcon className="h-4 w-4 text-pink-400" />}
                    {workflowMode === 'image-repurpose' && category === 'style' && <PaletteIcon className="h-4 w-4 text-green-400" />}
                    {workflowMode === 'image-repurpose' && category === 'mood' && <Star className="h-4 w-4 text-orange-400" />}
                    <span className="text-sm font-medium text-white capitalize">{category}</span>
                  </div>
                  <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">
                    {styles.length} options
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {styles.map((style) => (
                    <button
                      key={style}
                      onClick={() => onToggleStyle(style)}
                      className={`px-3 py-1.5 text-sm rounded-lg border transition-all hover:scale-105 ${
                        selectedStyles.includes(style)
                          ? workflowMode === 'color-grade'
                            ? 'bg-purple-600/20 border-purple-500 text-purple-300 shadow-lg shadow-purple-500/20'
                            : 'bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow-lg shadow-emerald-500/20'
                          : 'bg-gray-800/50 border-gray-600 text-gray-300 hover:text-white hover:border-gray-500 hover:bg-gray-700/70'
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Styles Preview */}
        {selectedStyles.length > 0 && (
          <div className={`px-6 py-4 border-t ${
            workflowMode === 'color-grade'
              ? 'border-purple-500/20 bg-purple-900/10'
              : 'border-emerald-500/20 bg-emerald-900/10'
          } flex-shrink-0`}>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${
                  workflowMode === 'color-grade' ? 'text-purple-400' : 'text-emerald-400'
                }`}>Selected Styles:</span>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onClearStyles}
                    className="h-6 px-2 text-xs border-gray-600 text-gray-400 hover:text-white hover:border-red-500"
                  >
                    Clear All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onClose}
                    className={`h-6 px-3 text-xs ${
                      workflowMode === 'color-grade'
                        ? 'border-purple-600 text-purple-400 hover:border-purple-500'
                        : 'border-emerald-600 text-emerald-400 hover:border-emerald-500'
                    } hover:text-white`}
                  >
                    Continue
                  </Button>
                </div>
              </div>
              <div className={`text-sm ${
                workflowMode === 'color-grade'
                  ? 'text-purple-200 bg-purple-900/30'
                  : 'text-emerald-200 bg-emerald-900/30'
              } rounded-lg px-3 py-2 max-h-20 overflow-y-auto`}>
                {selectedStyles.join(', ')}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-700/50 bg-gray-800/30 flex-shrink-0">
          <div className="text-sm text-gray-400">
            Click styles to add them to your prompt
          </div>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-gray-600 text-gray-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={onApplyStyles}
              disabled={selectedStyles.length === 0}
              className={`${
                workflowMode === 'color-grade'
                  ? 'bg-purple-600 hover:bg-purple-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Apply Styles ({selectedStyles.length})
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StylesOverlay; 