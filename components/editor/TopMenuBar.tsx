"use client"

import React, { useState } from 'react'
import { ChevronDown, FileText, Edit3, FolderOpen, Plus, Eye, Download, Save, Undo2, Redo2, FolderPlus, X, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ProjectFolder } from '@/lib/project-service'

interface TopMenuBarProps {
  currentProject: ProjectFolder | null
  onViewCurrentProject: () => void
  onAddToProject?: () => void
  onExport: () => void
  onSave: () => void
  onUndo: () => void
  onRedo: () => void
  onClose: () => void
  onSavePreset: () => void
  onReset: () => void
  canUndo: boolean
  canRedo: boolean
  hasUnsavedChanges: boolean
}

export default function TopMenuBar({
  currentProject,
  onViewCurrentProject,
  onAddToProject,
  onExport,
  onSave,
  onUndo,
  onRedo,
  onClose,
  onSavePreset,
  onReset,
  canUndo,
  canRedo,
  hasUnsavedChanges
}: TopMenuBarProps) {
  const [openMenus, setOpenMenus] = useState<{[key: string]: boolean}>({
    project: false,
    file: false,
    edit: false
  })

  const handleMouseEnter = (menu: string) => {
    setOpenMenus(prev => ({ ...prev, [menu]: true }))
  }

  const handleMouseLeave = (menu: string) => {
    setOpenMenus(prev => ({ ...prev, [menu]: false }))
  }

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-gray-900/50 border-b border-gray-700">
      <div className="flex items-center space-x-1">
        {/* Project Menu */}
        <div 
          onMouseEnter={() => handleMouseEnter('project')}
          onMouseLeave={() => handleMouseLeave('project')}
          className="relative py-2"
        >
          <DropdownMenu open={openMenus.project}>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-gray-300 hover:text-white hover:bg-gray-700/50"
              >
                {currentProject ? currentProject.name : 'Project'}
                <ChevronDown className="ml-1 h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="start" 
              className="bg-gray-800 border-gray-700 mt-0"
              sideOffset={0}
            >
              {!currentProject && onAddToProject && (
                <DropdownMenuItem 
                  onClick={onAddToProject}
                  className="text-gray-300 hover:text-white hover:bg-gray-700"
                >
                  <FolderPlus className="mr-2 h-4 w-4" />
                  Create / Add to Project
                </DropdownMenuItem>
              )}
              {currentProject && (
                <DropdownMenuItem 
                  onClick={onViewCurrentProject}
                  className="text-gray-300 hover:text-white hover:bg-gray-700"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View Current Project
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* File Menu */}
        <div 
          onMouseEnter={() => handleMouseEnter('file')}
          onMouseLeave={() => handleMouseLeave('file')}
          className="relative py-2"
        >
          <DropdownMenu open={openMenus.file}>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-gray-300 hover:text-white hover:bg-gray-700/50"
              >
                <FileText className="mr-1 h-3 w-3" />
                File
                <ChevronDown className="ml-1 h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="start" 
              className="bg-gray-800 border-gray-700 mt-0"
              sideOffset={0}
            >
              <DropdownMenuItem 
                onClick={onSave}
                className="text-gray-300 hover:text-white hover:bg-gray-700"
              >
                <Save className="mr-2 h-4 w-4" />
                Save
                {hasUnsavedChanges && (
                  <span className="ml-2 text-xs text-orange-400">•</span>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={onSavePreset}
                className="text-gray-300 hover:text-white hover:bg-gray-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Save Preset
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={onExport}
                className="text-gray-300 hover:text-white hover:bg-gray-700"
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-700" />
              <DropdownMenuItem 
                onClick={onClose}
                className="text-gray-300 hover:text-white hover:bg-gray-700"
              >
                <X className="mr-2 h-4 w-4" />
                Close
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Edit Menu */}
        <div 
          onMouseEnter={() => handleMouseEnter('edit')}
          onMouseLeave={() => handleMouseLeave('edit')}
          className="relative py-2"
        >
          <DropdownMenu open={openMenus.edit}>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-gray-300 hover:text-white hover:bg-gray-700/50"
              >
                <Edit3 className="mr-1 h-3 w-3" />
                Edit
                <ChevronDown className="ml-1 h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="start" 
              className="bg-gray-800 border-gray-700 mt-0"
              sideOffset={0}
            >
              <DropdownMenuItem 
                onClick={onUndo}
                disabled={!canUndo}
                className="text-gray-300 hover:text-white hover:bg-gray-700 disabled:text-gray-500 disabled:hover:bg-transparent"
              >
                <Undo2 className="mr-2 h-4 w-4" />
                Undo
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={onRedo}
                disabled={!canRedo}
                className="text-gray-300 hover:text-white hover:bg-gray-700 disabled:text-gray-500 disabled:hover:bg-transparent"
              >
                <Redo2 className="mr-2 h-4 w-4" />
                Redo
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-700" />
              <DropdownMenuItem 
                onClick={onReset}
                className="text-gray-300 hover:text-white hover:bg-gray-700"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Right side - Project info */}
      <div className="flex items-center space-x-2 text-sm text-gray-400">
        {currentProject ? (
          <div className="flex items-center space-x-2">
            <FolderOpen className="h-3 w-3" />
            <span className="truncate max-w-48">{currentProject.name}</span>
            {hasUnsavedChanges && (
              <span className="text-orange-400 text-xs">• Unsaved</span>
            )}
          </div>
        ) : (
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <span>No project selected</span>
          </div>
        )}
      </div>
    </div>
  )
} 