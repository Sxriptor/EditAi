import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { validateImportedStyle, transformAdjustmentsForUI } from '@/lib/style-utils';
import { ImportStyleValidation, StyleAdjustments } from '@/lib/types';
import { Upload, X, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

interface ImportStyleButtonProps {
  onImport: (adjustments: StyleAdjustments) => void;
}

export function ImportStyleButton({ onImport }: ImportStyleButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [validation, setValidation] = useState<ImportStyleValidation | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImport = () => {
    try {
      // Parse JSON
      const importedJson = JSON.parse(jsonInput);
      
      // Validate and transform
      const result = validateImportedStyle(importedJson);
      setValidation(result);
      setError(null);
      
      // If completely valid, import immediately
      if (result.isValid) {
        const uiAdjustments = transformAdjustmentsForUI(result.adjustments);
        onImport(uiAdjustments);
        setIsOpen(false);
        setJsonInput('');
        setValidation(null);
      }
    } catch (e) {
      setError('Invalid JSON format. Please check your input.');
      setValidation(null);
    }
  };

  const handleContinueWithSupported = () => {
    if (validation && Object.keys(validation.adjustments).length > 0) {
      const uiAdjustments = transformAdjustmentsForUI(validation.adjustments);
      onImport(uiAdjustments);
      setIsOpen(false);
      setJsonInput('');
      setValidation(null);
    }
  };

  const resetDialog = () => {
    setIsOpen(false);
    setJsonInput('');
    setValidation(null);
    setError(null);
  };

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-2 text-gray-400 hover:text-white"
      >
        <Upload className="h-4 w-4" />
        <span>Import Style</span>
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-lg bg-gray-800 flex items-center justify-center">
              <Upload className="h-4 w-4 text-gray-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">Import Style</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetDialog}
            className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Paste your style JSON:</label>
            <textarea
              value={jsonInput}
              onChange={(e) => {
                setJsonInput(e.target.value);
                setError(null);
                setValidation(null);
              }}
              className="w-full h-48 bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm text-gray-300 font-mono"
              placeholder={"{\n  \"exposure\": 15,\n  \"contrast\": 25,\n  \"saturation\": 10,\n  \"temperature\": -5,\n  \"hueChannels\": {\n    \"red\": 5,\n    \"green\": -2,\n    \"blue\": 3\n  }\n}"}
            />
          </div>

          {/* Validation Messages */}
          {error && (
            <div className="flex items-start space-x-2 text-red-400 bg-red-950/50 p-3 rounded-lg border border-red-800/30">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {validation && validation.unsupportedFields.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-start space-x-2 text-yellow-400 bg-yellow-950/50 p-3 rounded-lg border border-yellow-800/30">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Some fields are not supported</p>
                  <p className="text-xs text-yellow-300">
                    The following fields will be ignored: <span className="font-mono">{validation.unsupportedFields.join(', ')}</span>
                  </p>
                  {Object.keys(validation.adjustments).length > 0 && (
                    <p className="text-xs text-green-300">
                      {Object.keys(validation.adjustments).length} supported adjustment{Object.keys(validation.adjustments).length !== 1 ? 's' : ''} found and ready to import.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {validation && validation.isValid && (
            <div className="flex items-start space-x-2 text-green-400 bg-green-950/50 p-3 rounded-lg border border-green-800/30">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">Style is valid and ready to import!</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 flex justify-end space-x-3">
          <Button
            variant="ghost"
            onClick={resetDialog}
          >
            Cancel
          </Button>
          
          {validation && validation.unsupportedFields.length > 0 && Object.keys(validation.adjustments).length > 0 ? (
            <Button
              onClick={handleContinueWithSupported}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Continue with Supported
            </Button>
          ) : (
            <Button
              onClick={handleImport}
              disabled={!jsonInput.trim()}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
            >
              Import Style
            </Button>
          )}
        </div>
      </div>
    </div>
  );
} 