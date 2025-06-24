"use client"

import React, { useState, useEffect } from 'react'
import { FolderOpen, Star, MoreVertical, Edit2, Trash2, Share2, Calendar, FileText, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { projectService, ProjectFolder } from '@/lib/project-service'
import { useIsMobile } from '@/hooks/use-mobile'

interface ProjectLibraryProps {
  onProjectOpen: (project: ProjectFolder) => void
  onProjectCreated?: () => void
}

export default function ProjectLibrary({ onProjectOpen, onProjectCreated }: ProjectLibraryProps) {
  const isMobile = useIsMobile()
  const [projects, setProjects] = useState<ProjectFolder[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProject, setSelectedProject] = useState<ProjectFolder | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    loadProjects()
  }, [])

  useEffect(() => {
    if (onProjectCreated) {
      loadProjects()
    }
  }, [onProjectCreated])

  const loadProjects = async () => {
    setLoading(true)
    try {
      const userProjects = await projectService.getProjectFolders()
      setProjects(userProjects)
    } catch (error) {
      console.error('Error loading projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStarProject = async (project: ProjectFolder) => {
    const success = await projectService.updateProjectFolder(project.id, {
      is_starred: !project.is_starred
    })
    
    if (success) {
      setProjects(prev => 
        prev.map(p => 
          p.id === project.id 
            ? { ...p, is_starred: !p.is_starred }
            : p
        )
      )
    }
  }

  const handleDeleteProject = async () => {
    if (!selectedProject) return

    setIsDeleting(true)
    try {
      const success = await projectService.deleteProjectFolder(selectedProject.id)
      if (success) {
        setProjects(prev => prev.filter(p => p.id !== selectedProject.id))
        setShowDeleteDialog(false)
        setSelectedProject(null)
        console.log(`Project "${selectedProject.name}" and all its files have been deleted successfully`)
      } else {
        console.error('Failed to delete project')
        alert('Failed to delete project. Please try again.')
      }
    } catch (error) {
      console.error('Error deleting project:', error)
      alert('An error occurred while deleting the project. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const starredProjects = filteredProjects.filter(p => p.is_starred)
  const regularProjects = filteredProjects.filter(p => !p.is_starred)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const ProjectCard = ({ project }: { project: ProjectFolder }) => (
    <div className="group relative bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-750 transition-colors">
      {/* Thumbnail */}
      <div 
        className="aspect-video bg-gray-700 flex items-center justify-center cursor-pointer"
        onClick={() => onProjectOpen(project)}
      >
        {project.thumbnail_url ? (
          <img
            src={project.thumbnail_url}
            alt={project.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <FolderOpen className="w-12 h-12 text-gray-500" />
        )}
      </div>

      {/* Project Info */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 
            className="text-sm font-medium text-white truncate cursor-pointer hover:text-blue-400"
            onClick={() => onProjectOpen(project)}
            title={project.name}
          >
            {project.name}
          </h3>
          
          <div className="flex items-center space-x-1 ml-2">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => handleStarProject(project)}
            >
              <Star 
                className={`w-3 h-3 ${
                  project.is_starred 
                    ? 'text-yellow-500 fill-current' 
                    : 'text-gray-400'
                }`} 
              />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onProjectOpen(project)}>
                  <FolderOpen className="w-4 h-4 mr-2" />
                  Open Project
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStarProject(project)}>
                  <Star className="w-4 h-4 mr-2" />
                  {project.is_starred ? 'Remove Star' : 'Add Star'}
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Project
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-red-400"
                  onClick={() => {
                    setSelectedProject(project)
                    setShowDeleteDialog(true)
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {project.description && (
          <p className="text-xs text-gray-400 mb-2 line-clamp-2">
            {project.description}
          </p>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(project.updated_at)}</span>
          </div>
          
          {project.tags && project.tags.length > 0 && (
            <div className="flex items-center space-x-1">
              {project.tags.slice(0, 2).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs px-1 py-0">
                  {tag}
                </Badge>
              ))}
              {project.tags.length > 2 && (
                <span className="text-gray-500">+{project.tags.length - 2}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Star indicator */}
      {project.is_starred && (
        <div className="absolute top-2 left-2">
          <Star className="w-4 h-4 text-yellow-500 fill-current" />
        </div>
      )}
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading projects...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="flex items-center space-x-4">
        <Input
          placeholder="Search projects..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm bg-gray-800 border-gray-700"
        />
        <Badge variant="secondary">
          {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <FolderOpen className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-300 mb-2">
            {searchTerm ? 'No projects found' : 'No projects yet'}
          </h3>
          <p className="text-gray-500 mb-4">
            {searchTerm 
              ? 'Try adjusting your search terms'
              : 'Create your first project to get started'
            }
          </p>
        </div>
      ) : (
        <>
          {/* Starred Projects */}
          {starredProjects.length > 0 && (
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                <h2 className="text-lg font-medium text-white">Starred Projects</h2>
                <Badge variant="outline">{starredProjects.length}</Badge>
              </div>
              <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'}`}>
                {starredProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </div>
          )}

          {/* Regular Projects */}
          {regularProjects.length > 0 && (
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <FolderOpen className="w-4 h-4 text-gray-400" />
                <h2 className="text-lg font-medium text-white">
                  {starredProjects.length > 0 ? 'Other Projects' : 'All Projects'}
                </h2>
                <Badge variant="outline">{regularProjects.length}</Badge>
              </div>
              <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'}`}>
                {regularProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-300">
              Are you sure you want to delete "{selectedProject?.name}"? This action cannot be undone and will delete all files in the project.
            </p>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false)
                setSelectedProject(null)
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteProject}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Project
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Loading Overlay */}
      {isDeleting && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-gray-900/90 rounded-lg p-6 flex items-center space-x-4">
            <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
            <span className="text-white">Deleting project and associated files...</span>
          </div>
        </div>
      )}
    </div>
  )
} 