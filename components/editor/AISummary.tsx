import React from 'react'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface AISummaryProps {
  aiSummary: string
  setAiSummary: (summary: string) => void
}

export default function AISummary({ aiSummary, setAiSummary }: AISummaryProps) {
  if (!aiSummary) return null

  return (
    <div className="border-t border-gray-800 p-3 bg-green-900/20 border-green-500/30">
      <div className="flex items-start space-x-2">
        <div className="flex-shrink-0 mt-0.5">
          <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
        </div>
        <div className="flex-1">
          <div className="text-xs font-medium text-green-400 mb-1">AI Analysis Complete</div>
          <div className="text-sm text-green-200">{aiSummary}</div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0 text-green-400 hover:text-green-300"
          onClick={() => setAiSummary('')}
          title="Dismiss"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
} 