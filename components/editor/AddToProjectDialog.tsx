"use client"

import React, { useState, useEffect } from 'react'
import { FolderPlus, Plus, Loader2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent } from '@/components/ui/card'
import { projectService, ProjectFolder } from '@/lib/project-service'

interface AddToProjectDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (projectId: string) => void
  file: File | null
  fileName?: string
  colorAdjustments?: any
  aiPromptUsed?: string
}

export default function AddToProjectDialog({
  isOpen,
  onClose,
  onSuccess,
  file,
  fileName,
  colorAdjustments,
  aiPromptUsed
}: AddToProjectDialogProps) {
  const [projects, setProjects] = useState<ProjectFolder[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedOption, setSelectedOption] = useState<'existing' | 'new'>('existing')
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDescription, setNewProjectDescription] = useState('')

  useEffect(() => {
    if (isOpen) {
      loadProjects()
    }
  }, [isOpen])

  const loadProjects = async () => {
    setLoading(true)
    try {
      const userProjects = await projectService.getProjectFolders()
      setProjects(userProjects)
      
      // Auto-select first project if available
      if (userProjects.length > 0) {
        setSelectedProjectId(userProjects[0].id)
      } else {
        // If no projects exist, default to creating new
        setSelectedOption('new')
      }
    } catch (error) {
      console.error('Error loading projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!file) return

    setSaving(true)
    try {
      let targetProjectId = selectedProjectId

      // Create new project if selected
      if (selectedOption === 'new') {
        if (!newProjectName.trim()) {
          alert('Please enter a project name')
          setSaving(false)
          return
        }

        const newProject = await projectService.createProjectFolder(
          newProjectName.trim(),
          newProjectDescription.trim() || undefined
        )

        if (!newProject) {
          alert('Failed to create project')
          setSaving(false)
          return
        }

        targetProjectId = newProject.id
      }

      // Add file to project
      const projectFile = await projectService.addFileToProject(
        targetProjectId,
        file,
        fileName,
        colorAdjustments,
        aiPromptUsed
      )

      if (projectFile) {
        onSuccess(targetProjectId)
        onClose()
      } else {
        alert('Failed to add file to project')
      }
    } catch (error) {
      console.error('Error saving to project:', error)
      alert('An error occurred while saving to project')
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    if (!saving) {
      onClose()
      // Reset form
      setSelectedOption('existing')
      setSelectedProjectId('')
      setNewProjectName('')
      setNewProjectDescription('')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderPlus className="h-5 w-5" />
            Add to Project
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {file && (
            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Adding: <span className="font-medium">{fileName || file.name}</span>
              </p>
              <p className="text-xs text-gray-500">
                {(file.size / (1024 * 1024)).toFixed(1)} MB
              </p>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading projects...</span>
            </div>
          ) : (
            <RadioGroup value={selectedOption} onValueChange={(value) => setSelectedOption(value as 'existing' | 'new')}>
              {/* Existing Project Option */}
              {projects.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="existing" id="existing" />
                    <Label htmlFor="existing">Add to existing project</Label>
                  </div>
                  
                  {selectedOption === 'existing' && (
                    <ScrollArea className="h-48 border rounded-lg p-2">
                      <div className="space-y-2">
                        {projects.map((project) => (
                          <Card 
                            key={project.id}
                            className={`cursor-pointer transition-colors ${
                              selectedProjectId === project.id 
                                ? 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800' 
                                : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                            onClick={() => setSelectedProjectId(project.id)}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-medium text-sm">{project.name}</h4>
                                  {project.description && (
                                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                      {project.description}
                                    </p>
                                  )}
                                </div>
                                {selectedProjectId === project.id && (
                                  <Check className="h-4 w-4 text-blue-600" />
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              )}

              {/* New Project Option */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="new" id="new" />
                  <Label htmlFor="new">Create new project</Label>
                </div>
                
                {selectedOption === 'new' && (
                  <div className="space-y-3 pl-6">
                    <div>
                      <Label htmlFor="projectName" className="text-sm font-medium">
                        Project Name *
                      </Label>
                      <Input
                        id="projectName"
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        placeholder="Enter project name"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="projectDescription" className="text-sm font-medium">
                        Description (optional)
                      </Label>
                      <Textarea
                        id="projectDescription"
                        value={newProjectDescription}
                        onChange={(e) => setNewProjectDescription(e.target.value)}
                        placeholder="Enter project description"
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                  </div>
                )}
              </div>
            </RadioGroup>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saving || loading || (!selectedProjectId && selectedOption === 'existing') || (selectedOption === 'new' && !newProjectName.trim())}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Add to Project
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 