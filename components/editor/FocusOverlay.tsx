import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, User } from 'lucide-react';

interface FocusOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  mainFocusOptions: string[];
  selectedMainFocus: string[];
  toggleMainFocus: (focus: string) => void;
}

const FocusOverlay: React.FC<FocusOverlayProps> = ({
  isOpen,
  onClose,
  mainFocusOptions,
  selectedMainFocus,
  toggleMainFocus
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
      <div className="bg-gray-900 border border-emerald-500/30 rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-emerald-500/20 bg-emerald-900/10">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-600/20 flex items-center justify-center">
              <User className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Main Focus</h2>
              <p className="text-sm text-gray-400">What should stay the same in your image? (Select up to 3)</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-4">
            <div className="text-sm text-gray-300 mb-4">
              Select what part of your image should be preserved or emphasized in the new generated image:
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {mainFocusOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => toggleMainFocus(option)}
                  className={`px-4 py-3 text-sm rounded-lg border transition-all hover:scale-105 ${
                    selectedMainFocus.includes(option)
                      ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow-lg shadow-emerald-500/20'
                      : selectedMainFocus.length >= 3
                      ? 'bg-gray-800/30 border-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-800/50 border-gray-600 text-gray-300 hover:text-white hover:border-gray-500 hover:bg-gray-700/70'
                  }`}
                  disabled={selectedMainFocus.length >= 3 && !selectedMainFocus.includes(option)}
                >
                  <div className="capitalize font-medium">{option}</div>
                </button>
              ))}
            </div>
            
            {selectedMainFocus.length > 0 && (
              <div className="mt-4 p-3 bg-emerald-900/20 border border-emerald-500/30 rounded-lg">
                <div className="text-sm text-emerald-400 mb-1">
                  Selected Focus ({selectedMainFocus.length}/3):
                </div>
                <div className="text-sm text-emerald-200 capitalize font-medium">
                  {selectedMainFocus.join(', ')}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-700/50 bg-gray-800/30">
          <div className="text-sm text-gray-400">
            This helps AI understand what to preserve from your original image
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
              onClick={onClose}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <User className="h-4 w-4 mr-2" />
              Set Focus
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FocusOverlay; 