import React from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface LUTPreset {
  name: string;
  strength: number;
  color: string;
}

interface LUTControlsProps {
  lutStrength: number[];
  setLutStrength: React.Dispatch<React.SetStateAction<number[]>>;
  lutPresets: LUTPreset[];
  selectedPreset: string | null;
  applyLUTPreset: (presetName: string) => void;
  hasMedia: boolean;
}

const LUTControls = ({ 
  lutStrength,
  setLutStrength,
  lutPresets,
  selectedPreset,
  applyLUTPreset,
  hasMedia
}: LUTControlsProps) => {
  return (
    <>
      {/* LUT Strength */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">LUT Strength</span>
          <span className="text-white">{lutStrength[0]}%</span>
        </div>
        <Slider value={lutStrength} onValueChange={setLutStrength} max={100} step={1} className="w-full" />
      </div>

      {/* LUT Presets */}
      {hasMedia && (
        <div className="space-y-2 mb-4">
          <h3 className="text-xs font-medium text-white">LUT Presets</h3>
          <div className="grid grid-cols-1 gap-1">
            {lutPresets.map((preset, index) => (
              <Button
                key={index}
                variant={selectedPreset === preset.name ? "secondary" : "ghost"}
                className={`justify-start h-6 text-xs ${
                  selectedPreset === preset.name
                    ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                    : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                }`}
                onClick={() => applyLUTPreset(preset.name)}
              >
                <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${preset.color} mr-1.5`} />
                {preset.name}
              </Button>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default LUTControls; 