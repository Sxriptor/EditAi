import React from 'react'
import { Button } from "@/components/ui/button"
import { 
  Undo2, 
  Redo2, 
  Save, 
  Download, 
  RotateCcw,
  Settings,
  FileText
} from "lucide-react"

interface MobileTopMenuBarProps {
  hasMedia: boolean
  undoStack: any[]
  redoStack: any[]
  hasUnsavedChanges: boolean
  isExporting: boolean
  onUndo: () => void
  onRedo: () => void
  onSave: () => void
  onExport: () => void
  onReset: () => void
  onShowSettings?: () => void
  onShowMetadata?: () => void
}

export default function MobileTopMenuBar({
  hasMedia,
  undoStack,
  redoStack,
  hasUnsavedChanges,
  isExporting,
  onUndo,
  onRedo,
  onSave,
  onExport,
  onReset,
  onShowSettings,
  onShowMetadata
}: MobileTopMenuBarProps) {
  return (
    <div className="flex items-center justify-between px-3 py-2 bg-black/50 backdrop-blur-sm border-b border-gray-800">
      {/* Left side - History actions */}
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onUndo}
          disabled={!hasMedia || undoStack.length === 0}
          className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-30"
        >
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRedo}
          disabled={!hasMedia || redoStack.length === 0}
          className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-30"
        >
          <Redo2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          disabled={!hasMedia}
          className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-30"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {/* Center - Status indicator */}
      {hasUnsavedChanges && (
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
          <span className="text-xs text-yellow-400">Unsaved</span>
        </div>
      )}

      {/* Right side - Save and export actions */}
      <div className="flex items-center space-x-2">
        {onShowMetadata && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onShowMetadata}
            disabled={!hasMedia}
            className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-30"
          >
            <FileText className="h-4 w-4" />
          </Button>
        )}
        {onShowSettings && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onShowSettings}
            className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-800"
          >
            <Settings className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onSave}
          disabled={!hasMedia || !hasUnsavedChanges}
          className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-30"
        >
          <Save className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onExport}
          disabled={!hasMedia || isExporting}
          className="h-8 w-8 p-0 text-purple-400 hover:text-purple-300 hover:bg-purple-900/20 disabled:opacity-30"
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
} 