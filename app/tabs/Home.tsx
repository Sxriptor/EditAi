import React from 'react';
import { Progress } from "@/components/ui/progress";
import { ImageIcon, Upload, Plus, Loader2, FileImage, FileVideo } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

interface HomeProps {
  uploadProgress: number;
  isConverting: boolean;
  isDragging: boolean;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
  handleFileUpload: () => void;
  setShowProjectsModal: (show: boolean) => void;
}

export function Home({
  uploadProgress,
  isConverting,
  isDragging,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleFileUpload,
  setShowProjectsModal
}: HomeProps) {
  const isMobile = useIsMobile();
  
  return (
    <div 
      className="flex-1 flex items-center justify-center"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className={`text-center ${isMobile ? 'space-y-6 max-w-sm px-4' : 'space-y-8 max-w-md'}`}>
        {uploadProgress > 0 && uploadProgress < 100 ? (
          /* Upload Progress */
          <div className="space-y-4">
            <div className="h-32 w-32 mx-auto rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center border border-gray-700">
              <Loader2 className="h-16 w-16 text-purple-400 animate-spin" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-white">Uploading...</h2>
              <Progress value={uploadProgress} className="w-full" />
              <p className="text-sm text-gray-400">{uploadProgress}% complete</p>
            </div>
          </div>
        ) : isConverting ? (
          /* HEIC Conversion Progress */
          <div className="space-y-4">
            <div className="h-32 w-32 mx-auto rounded-2xl bg-gradient-to-br from-emerald-800 to-emerald-900 flex items-center justify-center border border-emerald-700">
              <Loader2 className="h-16 w-16 text-emerald-400 animate-spin" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-white">Converting HEIC...</h2>
              <p className="text-sm text-gray-400">Please wait while we convert your image</p>
            </div>
          </div>
        ) : (
          /* Drag & Drop Interface */
          <div className={`border-2 border-dashed rounded-3xl ${isMobile ? 'p-8' : 'p-12'} transition-all duration-200 ${
            isDragging 
              ? 'border-purple-400 bg-purple-500/10 scale-105' 
              : 'border-gray-600 hover:border-gray-500'
          }`}>
            <div className="relative">
              <div className="h-32 w-32 mx-auto rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center border border-gray-700">
                {isDragging ? (
                  <Upload className="h-16 w-16 text-purple-400" />
                ) : (
                  <ImageIcon className="h-16 w-16 text-gray-400" />
                )}
              </div>
              <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-emerald-400 flex items-center justify-center">
                <Plus className="h-4 w-4 text-white" />
              </div>
            </div>
            
            <div className="space-y-3">
              <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-semibold text-white`}>
                {isDragging ? 'Drop to Upload' : 'Start Creating'}
              </h2>
              <p className="text-gray-400 leading-relaxed">
                {isDragging 
                  ? 'Release to upload your media file'
                  : 'Drag & drop files here or click to browse'
                }
              </p>
              <div className="text-xs text-gray-500">
                Supports: JPG, PNG, WebP, HEIC, MP4, MOV • Max 100MB
              </div>
            </div>
            
            {!isDragging && (
              <div className="flex flex-col gap-3 mt-4">
                <Button
                  onClick={handleFileUpload}
                  className="w-full bg-gradient-to-r from-purple-600 to-emerald-500 hover:from-purple-700 hover:to-emerald-600"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Browse Files
                </Button>
                <Button
                  onClick={() => setShowProjectsModal(true)}
                  variant="outline"
                  className="w-full border-gray-600"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New
                </Button>
              </div>
            )}
            
            <div className="flex items-center justify-center space-x-6 pt-4 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <FileImage className="h-4 w-4" />
                <span>Photos</span>
              </div>
              <div className="flex items-center space-x-2">
                <FileVideo className="h-4 w-4" />
                <span>Videos</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 