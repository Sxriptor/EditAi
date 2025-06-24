import React from 'react'

interface HelpHintsProps {
  showHelpHints: boolean
}

export default function HelpHints({ showHelpHints }: HelpHintsProps) {
  if (!showHelpHints) return null

  return (
    <div className="mt-3 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
      <h4 className="text-sm font-medium text-blue-400 mb-2">✨ Quick Tips</h4>
      <div className="space-y-1 text-xs text-blue-300">
        <div>• Try prompts like "cinematic sunset", "moody noir", or "vintage film"</div>
        <div>• Use the sliders to fine-tune any adjustment in real-time</div>
        <div>• Apply LUT presets for instant professional looks</div>
        <div>• Export your settings as .cube files for other software</div>
        <div>• Click the diagonal split to compare before/after</div>
      </div>
    </div>
  )
} 