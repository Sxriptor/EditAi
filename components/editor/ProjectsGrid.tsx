import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Camera, Clock, MoreHorizontal, Star, Trash, Copy, Video } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export interface Project {
  id: number;
  name: string;
  type: 'image' | 'video';
  thumbnail: string;
  lastModified: string;
  isStarred?: boolean;
}

interface ProjectsGridProps {
  projects: Project[];
  onProjectClick: (projectId: number) => void;
  onDuplicateProject: (projectId: number) => void;
  onDeleteProject: (projectId: number) => void;
}

const ProjectsGrid: React.FC<ProjectsGridProps> = ({ 
  projects, 
  onProjectClick,
  onDuplicateProject,
  onDeleteProject
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <Card
          key={project.id}
          className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 cursor-pointer transition-all duration-200 hover:scale-[1.02]"
        >
          <div 
            className="relative aspect-video bg-gray-700 rounded-t-lg overflow-hidden"
            onClick={() => onProjectClick(project.id)}
          >
            <img 
              src={project.thumbnail}
              alt={project.name}
              className="w-full h-full object-cover"
            />
            
            <div className="absolute top-2 left-2">
              <Badge className="bg-black/80 text-white border-gray-600 text-xs px-1.5 py-0.5">
                {project.type === 'video' ? (
                  <Video className="h-2.5 w-2.5 mr-0.5" />
                ) : (
                  <Camera className="h-2.5 w-2.5 mr-0.5" />
                )}
                {project.type}
              </Badge>
            </div>
            
            {project.isStarred && (
              <div className="absolute top-2 right-2">
                <Star className="h-3 w-3 text-yellow-400 fill-current" />
              </div>
            )}

            <div className="absolute top-2 right-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-400 hover:text-white">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-gray-900 border-gray-700">
                  <DropdownMenuItem onClick={() => onDuplicateProject(project.id)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onDeleteProject(project.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          <CardContent className="p-3 space-y-2" onClick={() => onProjectClick(project.id)}>
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-white truncate text-sm">{project.name}</h3>
            </div>
            <div className="flex items-center space-x-1 text-xs text-gray-400">
              <Clock className="h-2.5 w-2.5" />
              <span>{project.lastModified}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ProjectsGrid; 