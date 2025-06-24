import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Play, Pause } from 'lucide-react'

interface VideoPlayerProps {
  mediaUrl: string | null
  isPlaying: boolean
  setIsPlaying: (playing: boolean) => void
  setVideoCurrentTime: (time: number) => void
  setVideoDuration: (duration: number) => void
  setVideoFrameRate: (frameRate: number) => void
  videoCurrentTime: number
  videoDuration: number
  videoResolution?: { width: number; height: number } | null
  videoThumbnails: string[]
}

export default function VideoPlayer({
  mediaUrl,
  isPlaying,
  setIsPlaying,
  setVideoCurrentTime,
  setVideoDuration,
  setVideoFrameRate,
  videoCurrentTime,
  videoDuration,
  videoResolution,
  videoThumbnails
}: VideoPlayerProps) {
  return (
    <div className="relative max-w-full max-h-[60vh]">
      <video
        src={mediaUrl || "data:image/svg+xml;base64," + btoa(`
          <svg width="480" height="320" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="#1F2937"/>
            <text x="50%" y="45%" text-anchor="middle" fill="#9CA3AF" font-family="Arial" font-size="16">Video Preview</text>
            <text x="50%" y="55%" text-anchor="middle" fill="#6B7280" font-family="Arial" font-size="12">Upload a video to see it here</text>
          </svg>
        `)}
        className="max-w-full max-h-full object-contain"
        controls={false}
        autoPlay={false}
        onTimeUpdate={(e) => setVideoCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => {
          setVideoDuration(e.currentTarget.duration)
          setVideoFrameRate(30) // Default, could be extracted from metadata
        }}
      />
      
      {/* Enhanced Video Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
        <div className="flex items-center space-x-2 text-white">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              const video = document.querySelector('video')
              if (video) {
                if (isPlaying) {
                  video.pause()
                } else {
                  video.play()
                }
                setIsPlaying(!isPlaying)
              }
            }}
            className="text-white hover:bg-white/20 h-6 w-6 p-0"
          >
            {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          </Button>
          
          <div className="flex-1 flex items-center space-x-1">
            <span className="text-xs text-gray-300 min-w-[30px]">
              {Math.floor(videoCurrentTime / 60)}:{(Math.floor(videoCurrentTime % 60)).toString().padStart(2, '0')}
            </span>
            
            <div className="flex-1 bg-gray-600 rounded-full h-0.5">
              <div 
                className="bg-purple-500 h-0.5 rounded-full transition-all"
                style={{ width: `${(videoCurrentTime / videoDuration) * 100}%` }}
              />
            </div>
            
            <span className="text-xs text-gray-300 min-w-[30px]">
              {Math.floor(videoDuration / 60)}:{(Math.floor(videoDuration % 60)).toString().padStart(2, '0')}
            </span>
          </div>
          
          {videoResolution && (
            <Badge className="bg-black/60 text-white border-gray-600 text-xs px-1 py-0">
              {videoResolution.width}x{videoResolution.height}
            </Badge>
          )}
        </div>
        
        {/* Video Thumbnails Timeline */}
        {videoThumbnails.length > 0 && (
          <div className="flex space-x-0.5 mt-1 overflow-x-auto">
            {videoThumbnails.map((thumbnail, index) => (
              <img
                key={index}
                src={thumbnail}
                alt={`Frame ${index}`}
                className="w-12 h-7 object-cover rounded border border-gray-600 cursor-pointer hover:border-purple-400 transition-colors"
                onClick={() => {
                  const video = document.querySelector('video')
                  if (video) {
                    video.currentTime = (videoDuration / videoThumbnails.length) * index
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 