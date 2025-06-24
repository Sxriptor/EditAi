"use client"

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Upload, Plus, FolderPlus } from 'lucide-react';
import { projectService } from '@/lib/project-service';

interface NewProjectButtonProps {
  handleFileUpload: () => void;
  createNewProject?: () => void;
  onProjectCreated?: (projectId: string) => void;
  size?: 'default' | 'large';
}

export default function NewProjectButton({ 
  handleFileUpload, 
  createNewProject, 
  onProjectCreated,
  size = 'default' 
}: NewProjectButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const [creating, setCreating] = useState(false)

  const handleCreateProject = async () => {
    if (!projectName.trim()) return

    setCreating(true)
    try {
      const project = await projectService.createProjectFolder(
        projectName.trim(),
        projectDescription.trim() || undefined
      )
      
      if (project) {
        setIsDialogOpen(false)
        setProjectName('')
        setProjectDescription('')
        onProjectCreated?.(project.id)
      }
    } catch (error) {
      console.error('Error creating project:', error)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className={`flex ${size === 'large' ? 'flex-col' : 'flex-row'} gap-3 mt-4`}>
      <Button
        onClick={handleFileUpload}
        className={`${size === 'large' ? 'w-full' : 'flex-1'} bg-gradient-to-r from-purple-600 to-emerald-500 hover:from-purple-700 hover:to-emerald-600`}
      >
        <Upload className="h-4 w-4 mr-2" />
        Browse Files
      </Button>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
      <Button
        variant="outline"
        className={`${size === 'large' ? 'w-full' : 'flex-1'} border-gray-600`}
      >
            <FolderPlus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </DialogTrigger>
        
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="project-name" className="text-sm font-medium">
                Project Name *
              </label>
              <Input
                id="project-name"
                placeholder="Enter project name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="project-description" className="text-sm font-medium">
                Description (optional)
              </label>
              <Textarea
                id="project-description"
                placeholder="Enter project description"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                className="w-full resize-none"
                rows={3}
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false)
                setProjectName('')
                setProjectDescription('')
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateProject}
              disabled={!projectName.trim() || creating}
            >
              {creating ? 'Creating...' : 'Create Project'}
      </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 