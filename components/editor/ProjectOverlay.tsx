"use client"

import React, { useState, useEffect, useRef } from 'react'
import { X, Upload, Image, Video, FileText, Star, MoreVertical, Trash2, Edit2, Download, Play, CheckSquare, Square, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { projectService, ProjectFolder, ProjectFile } from '@/lib/project-service'

interface ProjectOverlayProps {
  isOpen: boolean
  onClose: () => void
  projectFolder: ProjectFolder | null
  onFileSelect: (file: ProjectFile) => void
  onProjectUpdate?: () => void
}

export default function ProjectOverlay({ 
  isOpen, 
  onClose, 
  projectFolder, 
  onFileSelect,
  onProjectUpdate 
}: ProjectOverlayProps) {
  const [files, setFiles] = useState<ProjectFile[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [editingProject, setEditingProject] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deletingFileIds, setDeletingFileIds] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [totalFiles, setTotalFiles] = useState(0)
  const PAGE_SIZE = 10
  const fileInputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (projectFolder) {
      setProjectName(projectFolder.name)
      setProjectDescription(projectFolder.description || '')
      // Reset pagination when project changes
      setFiles([])
      setCurrentPage(1)
      setHasMore(true)
      loadFiles(1, true)
    }
  }, [projectFolder])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0]
        if (firstEntry.isIntersecting && hasMore && !loading) {
          loadMore()
        }
      },
      { threshold: 0.5 }
    )

    observer.observe(container)
    return () => observer.disconnect()
  }, [hasMore, loading])

  const loadFiles = async (page: number, reset: boolean = false) => {
    if (!projectFolder) return
    
    setLoading(true)
    try {
      const result = await projectService.getProjectFiles(projectFolder.id, page, PAGE_SIZE)
      // Always set totalFiles to 20 for new projects
      if (page === 1 && reset) {
        setTotalFiles(20)
      } else {
        setTotalFiles(Math.max(result.total, 20))
      }
      setFiles(prev => reset ? result.files : [...prev, ...result.files])
      setHasMore(result.files.length === PAGE_SIZE && (page * PAGE_SIZE) < result.total)
      setCurrentPage(page)
    } catch (error) {
      console.error('Error loading project files:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMore = () => {
    if (!loading && hasMore) {
      loadFiles(currentPage + 1)
    }
  }

  const validateFiles = (uploadFiles: File[]): File[] => {
    const maxSize = 100 * 1024 * 1024 // 100MB
    const validTypes = ['image/', 'video/']
    
    // Check if adding these files would exceed the limit
    const remainingSlots = 20 - files.length
    if (uploadFiles.length > remainingSlots) {
      setUploadError(`Cannot add ${uploadFiles.length} files. Project limit is 20 files (${remainingSlots} remaining).`)
      return []
    }

    // Create a Set of existing filenames in the project
    const existingFilenames = new Set(files.map(f => f.name.toLowerCase()))
    
    return uploadFiles.filter(file => {
      // Check file size
      if (file.size > maxSize) {
        setUploadError(`File "${file.name}" is too large. Maximum size is 100MB.`)
        return false
      }
      
      // Check for duplicates in the current project
      const filename = file.name.toLowerCase()
      if (existingFilenames.has(filename)) {
        setUploadError(`File "${file.name}" already exists in the project.`)
        return false
      }
      
      // Check file type
      if (!validTypes.some(type => file.type.startsWith(type)) && 
          !file.name.toLowerCase().endsWith('.heic') && 
          !file.name.toLowerCase().endsWith('.heif')) {
        setUploadError(`File "${file.name}" is not a supported image or video type.`)
        return false
      }
      
      return true
    })
  }

  const handleFileUpload = async (uploadFiles: File[]) => {
    if (!projectFolder) return
    
    setUploadError(null)
    
    // Check project file limit
    if (files.length >= 20) {
      setUploadError('Project has reached the maximum limit of 20 files.')
      return
    }
    
    const validFiles = validateFiles(uploadFiles)
    if (validFiles.length === 0) return
    
    setUploading(true)
    try {
      const uploadPromises = validFiles.map(async file => {
        try {
          return await projectService.addFileToProject(projectFolder.id, file)
        } catch (error) {
          console.error('Error uploading file:', error)
          return null
        }
      })
      
      const results = await Promise.all(uploadPromises)
      const newFiles = results.filter(Boolean) as ProjectFile[]
      
      if (newFiles.length > 0) {
        setFiles(prev => [...prev, ...newFiles])
        onProjectUpdate?.()
      } else {
        setUploadError('Failed to upload files. Please try again.')
      }
    } catch (error) {
      console.error('Error uploading files:', error)
      setUploadError('An error occurred while uploading files. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    setUploadError(null)
    
    const droppedFiles = Array.from(e.dataTransfer.files)
    await handleFileUpload(droppedFiles)
  }

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    if (selectedFiles.length > 0) {
      await handleFileUpload(selectedFiles)
    }
    // Reset input value to allow uploading the same file again
    e.target.value = ''
  }

  const handleDeleteFile = async (fileId: string) => {
    if (confirm('Are you sure you want to delete this file? This will also delete all its versions and auto-saves.')) {
      setDeletingFileIds(prev => [...prev, fileId])
      try {
        const success = await projectService.deleteProjectFile(fileId)
        if (success) {
          setFiles(prev => prev.filter(f => f.id !== fileId))
          onProjectUpdate?.()
          console.log('File and all its associated data have been deleted successfully')
        } else {
          console.error('Failed to delete file')
          alert('Failed to delete file. Please try again.')
        }
      } catch (error) {
        console.error('Error deleting file:', error)
        alert('An error occurred while deleting the file. Please try again.')
      } finally {
        setDeletingFileIds(prev => prev.filter(id => id !== fileId))
      }
    }
  }

  const handleUpdateProject = async () => {
    if (!projectFolder) return

    const success = await projectService.updateProjectFolder(projectFolder.id, {
      name: projectName,
      description: projectDescription
    })

    if (success) {
      setEditingProject(false)
      onProjectUpdate?.()
    }
  }

  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    )
  }

  const getFileIcon = (fileType: string) => {
    if (fileType === 'image') return <Image className="w-4 h-4" />
    if (fileType === 'video') return <Video className="w-4 h-4" />
    return <FileText className="w-4 h-4" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getDisplayFileName = (file: ProjectFile) => {
    // Check if this was originally a HEIC file that was converted to JPEG
    const wasOriginallyHeic = file.file_metadata?.originalType === 'image/heic' || 
                              file.file_metadata?.originalType === 'image/heif' ||
                              file.original_filename?.toLowerCase().endsWith('.heic') ||
                              file.original_filename?.toLowerCase().endsWith('.heif')
    
    // If it was originally HEIC and is now stored as JPEG, show .jpg extension
    if (wasOriginallyHeic) {
      return file.name.replace(/\.(heic|heif)$/i, '.jpg')
    }
    
    return file.name
  }

  const handleDeleteSelected = async () => {
    if (selectedFiles.length === 0) return
    
    if (confirm(`Are you sure you want to delete ${selectedFiles.length} selected file${selectedFiles.length > 1 ? 's' : ''}? This will also delete all their versions and auto-saves.`)) {
      setIsDeleting(true)
      try {
        const deletePromises = selectedFiles.map(fileId => 
          projectService.deleteProjectFile(fileId)
        )
        
        await Promise.all(deletePromises)
        
        // Remove deleted files from the list
        setFiles(prev => prev.filter(f => !selectedFiles.includes(f.id)))
        setSelectedFiles([])
        onProjectUpdate?.()
      } catch (error) {
        console.error('Error deleting files:', error)
        alert('An error occurred while deleting files. Please try again.')
      } finally {
        setIsDeleting(false)
      }
    }
  }

  const handleSelectAll = () => {
    if (selectedFiles.length === files.length) {
      // If all files are selected, unselect all
      setSelectedFiles([])
    } else {
      // Otherwise, select all files
      setSelectedFiles(files.map(f => f.id))
    }
  }

  if (!isOpen || !projectFolder) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header - Fixed height */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800 shrink-0">
          <div className="flex items-center space-x-4">
            {editingProject ? (
              <div className="flex items-center space-x-2">
                <Input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="bg-gray-800 border-gray-700"
                  placeholder="Project name"
                />
                <Button size="sm" onClick={handleUpdateProject}>Save</Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingProject(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg font-semibold text-white">{projectFolder.name}</h2>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingProject(true)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  {projectFolder.is_starred && (
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  )}
                </div>
                {projectFolder.description && (
                  <p className="text-gray-400 text-sm mt-1">{projectFolder.description}</p>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant="secondary">
              {files.length}/{totalFiles} files
            </Badge>
            <Button size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {/* Upload Area - Fixed height */}
          {(files.length === 0 || files.length < totalFiles) && (
            <div
              className={`m-4 p-6 border-2 border-dashed rounded-xl transition-all ${
                dragOver 
                  ? 'border-blue-500 bg-blue-500/10 scale-[1.02]' 
                  : uploadError 
                    ? 'border-red-500 bg-red-500/5'
                    : 'border-gray-700 hover:border-gray-600'
              }`}
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
            >
              <div className="text-center space-y-3">
                {uploading ? (
                  <div className="space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-xl bg-gray-800 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
                    </div>
                    <p className="text-gray-400">
                      Uploading files...
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 mx-auto rounded-xl bg-gray-800 flex items-center justify-center">
                      <Upload className={`w-6 h-6 ${uploadError ? 'text-red-400' : 'text-gray-400'}`} />
                    </div>
                    <div>
                      <p className="text-gray-300 text-base mb-1">
                        {dragOver ? 'Drop to upload' : 'Upload your files'}
                      </p>
                      <p className="text-gray-400 text-sm mb-3">
                        {uploadError || 'Drag and drop files here or click to browse'}
                      </p>
                      <div className="flex items-center justify-center gap-4 mb-3">
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <Image className="w-4 h-4" />
                          <span>Images</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <Video className="w-4 h-4" />
                          <span>Videos</span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setUploadError(null)
                          fileInputRef.current?.click()
                        }}
                        className="bg-gray-800 border-gray-700 hover:bg-gray-750"
                        size="sm"
                      >
                        Choose Files
                      </Button>
                    </div>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={handleFileInputChange}
                />
              </div>
            </div>
          )}

          {/* Files Grid - Scrollable */}
          <div className="px-4 pb-4">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-gray-400">Loading files...</div>
              </div>
            ) : files.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-gray-400">No files in this project yet</div>
              </div>
            ) : (
              <>
                {/* Bulk Actions Bar */}
                <div className="flex items-center justify-between mb-4 sticky top-0 bg-gray-900 py-2 z-10">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-white"
                      onClick={handleSelectAll}
                    >
                      {selectedFiles.length === files.length ? (
                        <CheckSquare className="w-4 h-4 mr-2" />
                      ) : (
                        <Square className="w-4 h-4 mr-2" />
                      )}
                      {selectedFiles.length === files.length ? 'Unselect All' : 'Select All'}
                    </Button>
                  </div>
                  
                  {selectedFiles.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-400">
                        {selectedFiles.length} selected
                      </span>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDeleteSelected}
                        disabled={isDeleting}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {isDeleting ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4 mr-2" />
                        )}
                        Delete Selected
                      </Button>
                    </div>
                  )}
                </div>

                {/* Files Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className={`group relative bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:bg-gray-750 transition-colors ${
                        selectedFiles.includes(file.id) ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => toggleFileSelection(file.id)}
                    >
                      {/* Thumbnail */}
                      <div className="aspect-square bg-gray-700 flex items-center justify-center relative">
                        {file.file_type === 'image' ? (
                          <img
                            src={file.original_file_url}
                            alt={getDisplayFileName(file)}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                              const iconEl = e.currentTarget.parentNode as HTMLElement
                              if (iconEl) {
                                const icon = document.createElement('div')
                                icon.className = 'w-8 h-8 text-gray-500 flex items-center justify-center'
                                icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-8 h-8"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>'
                                iconEl.appendChild(icon)
                              }
                            }}
                          />
                        ) : file.file_type === 'video' ? (
                          <>
                            {file.thumbnail_url ? (
                              <img
                                src={file.thumbnail_url}
                                alt={getDisplayFileName(file)}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Video className="w-8 h-8 text-gray-500" />
                            )}
                            <div className="absolute bottom-1 right-1 bg-black/60 rounded-full p-1">
                              <Play className="w-3 h-3 text-white" />
                            </div>
                          </>
                        ) : (
                          <FileText className="w-8 h-8 text-gray-500" />
                        )}

                        {/* Delete Loading Overlay */}
                        {deletingFileIds.includes(file.id) && (
                          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                            <div className="flex flex-col items-center space-y-2">
                              <Loader2 className="w-6 h-6 animate-spin text-white" />
                              <span className="text-xs text-white font-medium">Deleting...</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* File Info */}
                      <div className="p-2">
                        <h3 className="text-xs font-medium text-white truncate" title={getDisplayFileName(file)}>
                          {getDisplayFileName(file)}
                        </h3>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[10px] text-gray-400">
                            {file.file_size ? formatFileSize(file.file_size) : 'Unknown size'}
                          </span>
                          <Badge variant="outline" className="text-[10px] px-1 py-0">
                            {file.file_type}
                          </Badge>
                        </div>
                      </div>

                      {/* Actions */}
                      {!deletingFileIds.includes(file.id) && (
                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                                <MoreVertical className="w-3 h-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => onFileSelect(file)}>
                                <Edit2 className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Download className="w-4 h-4 mr-2" />
                                Download
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-red-400"
                                onClick={() => handleDeleteFile(file.id)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}

                      {/* Selection indicator */}
                      {selectedFiles.includes(file.id) && (
                        <div className="absolute top-2 left-2 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Loading indicator at the bottom */}
                <div ref={containerRef} className="col-span-full flex justify-center p-4">
                  {loading && (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Loading more files...</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer - Fixed height */}
        {selectedFiles.length > 0 && (
          <div className="border-t border-gray-800 p-3 shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">
                {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
              </span>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedFiles([])}
                >
                  Clear Selection
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    const selectedFile = files.find(f => f.id === selectedFiles[0])
                    if (selectedFile) {
                      onFileSelect(selectedFile)
                      onClose()
                    }
                  }}
                  disabled={selectedFiles.length !== 1}
                >
                  Edit Selected
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Project Dialog */}
      <Dialog open={editingProject} onOpenChange={setEditingProject}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Project Name</label>
              <Input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Enter project name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <Textarea
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="Enter project description"
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setEditingProject(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateProject}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 