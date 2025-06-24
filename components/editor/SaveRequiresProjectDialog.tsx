import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { FolderPlus, Plus } from 'lucide-react'

interface SaveRequiresProjectDialogProps {
  isOpen: boolean
  onClose: () => void
  onCreateProject: () => void
  onAddToProject: () => void
}

export default function SaveRequiresProjectDialog({
  isOpen,
  onClose,
  onCreateProject,
  onAddToProject
}: SaveRequiresProjectDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-center">
            Save Requires Project
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <p className="text-gray-300 text-center">
            To save your adjustments, you need to either create a new project or add this image to an existing project.
          </p>
          
          <div className="space-y-3">
            <Button
              onClick={() => {
                onCreateProject()
                onClose()
              }}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Create New Project</span>
            </Button>
            
            <Button
              onClick={() => {
                onAddToProject()
                onClose()
              }}
              variant="outline"
              className="w-full border-gray-600 text-gray-300 hover:bg-gray-800 flex items-center justify-center space-x-2"
            >
              <FolderPlus className="h-4 w-4" />
              <span>Add to Existing Project</span>
            </Button>
          </div>
          
          <Button
            onClick={onClose}
            variant="ghost"
            className="w-full text-gray-400 hover:text-white hover:bg-gray-800"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 