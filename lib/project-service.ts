import { supabase } from './supabase'

export interface ProjectFolder {
  id: string
  created_at: string
  updated_at: string
  user_id: string
  name: string
  description?: string
  thumbnail_url?: string
  is_starred: boolean
  is_public: boolean
  tags: string[]
  folder_settings: any
}

export interface ProjectFile {
  id: string
  created_at: string
  updated_at: string
  project_folder_id: string
  user_id: string
  name: string
  original_filename: string
  file_type: 'image' | 'video'
  original_file_url: string
  processed_file_url?: string
  thumbnail_url?: string
  file_size?: number
  file_metadata: any
  processing_status: 'uploaded' | 'processing' | 'processed' | 'error'
  is_current_edit: boolean
  order_index: number
  color_adjustments: any
  applied_luts: string[]
  ai_prompt_used?: string
}

class ProjectService {
  private sessionId: string

  constructor() {
    // Generate unique session ID for this browser session
    this.sessionId = this.generateSessionId()
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Project Folder Management
  async createProjectFolder(name: string, description?: string): Promise<ProjectFolder | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('project_folders')
        .insert({
          user_id: user.id,
          name,
          description,
          is_starred: false,
          is_public: false,
          tags: [],
          folder_settings: {}
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating project folder:', error)
      return null
    }
  }

  async getProjectFolders(): Promise<ProjectFolder[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data, error } = await supabase
        .from('project_folders')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching project folders:', error)
      return []
    }
  }

  async getProjectFolder(id: string): Promise<ProjectFolder | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data, error } = await supabase
        .from('project_folders')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching project folder:', error)
      return null
    }
  }

  async updateProjectFolder(id: string, updates: Partial<ProjectFolder>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('project_folders')
        .update(updates)
        .eq('id', id)

      return !error
    } catch (error) {
      console.error('Error updating project folder:', error)
      return false
    }
  }

  async deleteProjectFolder(id: string): Promise<boolean> {
    try {
      // First, get all files in this project to delete their storage files
      const { data: files } = await supabase
        .from('project_files')
        .select('id, original_file_url, processed_file_url, thumbnail_url')
        .eq('project_folder_id', id)

      // Delete files from storage
      if (files && files.length > 0) {
        for (const file of files) {
          // Extract file paths from URLs and delete from storage
          const filesToDelete: string[] = []
          
          if (file.original_file_url) {
            const fileName = this.extractFileNameFromUrl(file.original_file_url)
            if (fileName) filesToDelete.push(fileName)
          }
          
          if (file.processed_file_url) {
            const fileName = this.extractFileNameFromUrl(file.processed_file_url)
            if (fileName) filesToDelete.push(fileName)
          }
          
          if (file.thumbnail_url) {
            const fileName = this.extractFileNameFromUrl(file.thumbnail_url)
            if (fileName) filesToDelete.push(fileName)
          }

          if (filesToDelete.length > 0) {
            await supabase.storage.from('project-files').remove(filesToDelete)
          }

          // Delete project versions for this file
          await supabase
            .from('project_versions')
            .delete()
            .eq('project_file_id', file.id)

          // Delete auto-saves for this file
          await supabase
            .from('project_auto_saves')
            .delete()
            .eq('project_file_id', file.id)
        }

        // Delete all project files
        await supabase
          .from('project_files')
          .delete()
          .eq('project_folder_id', id)
      }

      // Finally, delete the project folder
      const { error } = await supabase
        .from('project_folders')
        .delete()
        .eq('id', id)

      return !error
    } catch (error) {
      console.error('Error deleting project folder:', error)
      return false
    }
  }

  private extractFileNameFromUrl(url: string): string | null {
    try {
      // Extract the file path from the Supabase storage URL
      // URL format: https://[project].supabase.co/storage/v1/object/public/project-files/[path]
      const urlParts = url.split('/project-files/')
      return urlParts.length > 1 ? urlParts[1] : null
    } catch {
      return null
    }
  }

  // Project File Management
  async addFileToProject(
    projectFolderId: string,
    file: File,
    name?: string,
    colorAdjustments?: any,
    aiPromptUsed?: string
  ): Promise<ProjectFile | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      let fileToUpload = file;
      let fileType = file.type;

      // Convert HEIC/HEIF to JPEG during upload if needed
      if (file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
        try {
          const heic2any = (await import('heic2any')).default;
          const jpegBlob = await heic2any({
            blob: file,
            toType: 'image/jpeg',
            quality: 0.8
          }) as Blob;
          
          // Create a new File object from the converted blob
          fileToUpload = new File([jpegBlob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), {
            type: 'image/jpeg'
          });
          fileType = 'image/jpeg';
        } catch (error) {
          console.error('Error converting HEIC/HEIF:', error);
          // Continue with original file if conversion fails
        }
      }

      // Upload file to storage
      const fileExt = fileToUpload.name.split('.').pop()
      const fileName = `${projectFolderId}/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('project-files')
        .upload(fileName, fileToUpload)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('project-files')
        .getPublicUrl(fileName)

      // Create project file record
      const { data, error } = await supabase
        .from('project_files')
        .insert({
          project_folder_id: projectFolderId,
          user_id: user.id,
          name: name || file.name,
          original_filename: file.name,
          file_type: fileType.startsWith('image/') ? 'image' : 'video',
          original_file_url: publicUrl,
          file_size: fileToUpload.size,
          file_metadata: {
            type: fileType,
            lastModified: file.lastModified,
            originalType: file.type
          },
          processing_status: 'uploaded',
          is_current_edit: true,
          order_index: 0,
          color_adjustments: colorAdjustments || {},
          applied_luts: [],
          ai_prompt_used: aiPromptUsed
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error adding file to project:', error)
      return null
    }
  }

  async getProjectFiles(projectFolderId: string, page: number = 1, pageSize: number = 10): Promise<{
    files: ProjectFile[],
    total: number
  }> {
    try {
      // First get total count
      const { count } = await supabase
        .from('project_files')
        .select('*', { count: 'exact', head: true })
        .eq('project_folder_id', projectFolderId)

      // Then get paginated data
      const { data, error } = await supabase
        .from('project_files')
        .select('*')
        .eq('project_folder_id', projectFolderId)
        .order('order_index', { ascending: true })
        .range((page - 1) * pageSize, page * pageSize - 1)

      if (error) throw error
      return {
        files: data || [],
        total: count || 0
      }
    } catch (error) {
      console.error('Error fetching project files:', error)
      return { files: [], total: 0 }
    }
  }

  async updateProjectFile(id: string, updates: Partial<ProjectFile>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('project_files')
        .update(updates)
        .eq('id', id)

      return !error
    } catch (error) {
      console.error('Error updating project file:', error)
      return false
    }
  }

  async deleteProjectFile(fileId: string): Promise<boolean> {
    try {
      const { data: file } = await supabase
        .from('project_files')
        .select('*')
        .eq('id', fileId)
        .single()

      if (!file) return false

      // Delete the file from storage first
      const fileUrl = new URL(file.original_file_url)
      const storagePath = fileUrl.pathname.split('/').slice(-2).join('/')
      
      const { error: storageError } = await supabase.storage
        .from('project-files')
        .remove([storagePath])

      if (storageError) {
        console.error('Error deleting file from storage:', storageError)
      }

      // Delete the file record from the database
      const { error: dbError } = await supabase
        .from('project_files')
        .delete()
        .eq('id', fileId)

      if (dbError) throw dbError

      return true
    } catch (error) {
      console.error('Error deleting project file:', error)
      return false
    }
  }

  // Simplified save - just update the project file directly
  async saveColorAdjustments(
    projectFileId: string,
    colorAdjustments: any,
    appliedLuts: string[] = [],
    aiPromptUsed?: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('project_files')
        .update({
          color_adjustments: colorAdjustments,
          applied_luts: appliedLuts,
          ai_prompt_used: aiPromptUsed,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectFileId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error saving color adjustments:', error)
      return false
    }
  }

  // Get color adjustments for a project file
  async getColorAdjustments(projectFileId: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('project_files')
        .select('color_adjustments, applied_luts, ai_prompt_used')
        .eq('id', projectFileId)
        .single()

      if (error) throw error
      return data?.color_adjustments || null
    } catch (error) {
      console.error('Error fetching color adjustments:', error)
      return null
    }
  }

  // Utility methods
  async getProjectFolderWithFiles(projectFolderId: string): Promise<{
    folder: ProjectFolder | null
    files: ProjectFile[]
  }> {
    try {
      const [folderData, filesData] = await Promise.all([
        supabase
          .from('project_folders')
          .select('*')
          .eq('id', projectFolderId)
          .single(),
        supabase
          .from('project_files')
          .select('*')
          .eq('project_folder_id', projectFolderId)
          .order('order_index', { ascending: true })
      ])

      return {
        folder: folderData.data || null,
        files: filesData.data || []
      }
    } catch (error) {
      console.error('Error fetching project folder with files:', error)
      return { folder: null, files: [] }
    }
  }

  // Add this method to cleanup old versions
  async cleanupOldVersions(projectFileId: string, maxVersions: number = 10): Promise<boolean> {
    try {
      // Get all versions for this file
      const { data: versions, error: fetchError } = await supabase
        .from('project_versions')
        .select('id')
        .eq('project_file_id', projectFileId)
        .order('version_number', { ascending: false })
      
      if (fetchError) throw fetchError
      
      // If we have more than maxVersions, delete the oldest ones
      if (versions && versions.length > maxVersions) {
        const versionsToDelete = versions.slice(maxVersions)
        const idsToDelete = versionsToDelete.map(v => v.id)
        
        const { error: deleteError } = await supabase
          .from('project_versions')
          .delete()
          .in('id', idsToDelete)
        
        if (deleteError) throw deleteError
        console.log(`Cleaned up ${versionsToDelete.length} old versions`)
      }
      
      return true
    } catch (error) {
      console.error('Error cleaning up old versions:', error)
      return false
    }
  }
}

export const projectService = new ProjectService() 