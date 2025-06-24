import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { useIsMobile } from '@/hooks/use-mobile'

interface ZoomableImageProps {
  src: string
  alt: string
  className?: string
  isLongPressing?: boolean
  onTouchStart?: () => void
  onTouchEnd?: () => void
  onTouchCancel?: () => void
  maxZoom?: number
  minZoom?: number
}

export default function ZoomableImage({
  src,
  alt,
  className = '',
  isLongPressing = false,
  onTouchStart,
  onTouchEnd,
  onTouchCancel,
  maxZoom = 5,
  minZoom = 1
}: ZoomableImageProps) {
  const isMobile = useIsMobile()
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 })
  
  // Zoom and pan state
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 })
  
  // Mobile pinch-to-zoom state
  const [lastTouchDistance, setLastTouchDistance] = useState(0)
  const [isZooming, setIsZooming] = useState(false)

  // Reset zoom and pan when image changes
  useEffect(() => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
    setImageLoaded(false)
  }, [src])

  // Handle image load to get natural dimensions
  const handleImageLoad = useCallback(() => {
    if (imageRef.current) {
      setNaturalSize({
        width: imageRef.current.naturalWidth,
        height: imageRef.current.naturalHeight
      })
      setImageLoaded(true)
    }
  }, [])

  // Calculate container style based on image dimensions
  const containerStyle = useMemo(() => {
    if (!imageLoaded) return {}
    
    const containerWidth = containerRef.current?.clientWidth || 0
    const containerHeight = containerRef.current?.clientHeight || 0
    const maxHeight = isMobile ? window.innerHeight * 0.4 : window.innerHeight * 0.6
    
    let width = naturalSize.width
    let height = naturalSize.height
    
    // Scale down if image is larger than container
    if (width > containerWidth || height > maxHeight) {
      const scale = Math.min(containerWidth / width, maxHeight / height)
      width *= scale
      height *= scale
    }
    
    return {
      width: `${width}px`,
      height: `${height}px`,
      margin: '0 auto'
    }
  }, [imageLoaded, naturalSize, isMobile])

  // Calculate distance between two touch points
  const getTouchDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return 0
    const touch1 = touches[0]
    const touch2 = touches[1]
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) + 
      Math.pow(touch2.clientY - touch1.clientY, 2)
    )
  }

  // Get center point between two touches
  const getTouchCenter = (touches: React.TouchList) => {
    if (touches.length < 2) return { x: 0, y: 0 }
    const touch1 = touches[0]
    const touch2 = touches[1]
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2
    }
  }

  // Mobile touch handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Two fingers - start zooming
      e.preventDefault()
      setIsZooming(true)
      setLastTouchDistance(getTouchDistance(e.touches))
    } else if (e.touches.length === 1 && zoom > 1) {
      // One finger on zoomed image - start panning
      e.preventDefault()
      setIsDragging(true)
      setLastPanPoint({ x: e.touches[0].clientX, y: e.touches[0].clientY })
    } else if (e.touches.length === 1) {
      // One finger on normal image - trigger long press if available
      onTouchStart?.()
    }
  }, [zoom, onTouchStart])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && isZooming) {
      // Handle pinch-to-zoom
      e.preventDefault()
      const currentDistance = getTouchDistance(e.touches)
      if (lastTouchDistance > 0) {
        const scale = currentDistance / lastTouchDistance
        const newZoom = Math.min(maxZoom, Math.max(minZoom, zoom * scale))
        setZoom(newZoom)
      }
      setLastTouchDistance(currentDistance)
    } else if (e.touches.length === 1 && isDragging && zoom > 1) {
      // Handle panning when zoomed
      e.preventDefault()
      const touch = e.touches[0]
      const deltaX = touch.clientX - lastPanPoint.x
      const deltaY = touch.clientY - lastPanPoint.y
      
      setPan(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }))
      
      setLastPanPoint({ x: touch.clientX, y: touch.clientY })
    }
  }, [isZooming, isDragging, lastTouchDistance, lastPanPoint, zoom, maxZoom, minZoom])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 0) {
      setIsZooming(false)
      setIsDragging(false)
      setLastTouchDistance(0)
      
      // Reset pan if zoomed out completely
      if (zoom <= 1) {
        setPan({ x: 0, y: 0 })
        setZoom(1)
      }
      
      // Trigger touch end for long press if not zooming/panning
      if (!isZooming && !isDragging) {
        onTouchEnd?.()
      }
    } else if (e.touches.length === 1) {
      setIsZooming(false)
      setLastTouchDistance(0)
    }
  }, [isZooming, isDragging, zoom, onTouchEnd])

  // Desktop mouse handlers
  const handleWheel = useCallback((e: WheelEvent) => {
    if (!isMobile && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      const delta = e.deltaY > 0 ? 0.9 : 1.1
      const newZoom = Math.min(maxZoom, Math.max(minZoom, zoom * delta))
      setZoom(newZoom)
      
      if (newZoom <= 1) {
        setPan({ x: 0, y: 0 })
        setZoom(1)
      }
    }
  }, [isMobile, zoom, maxZoom, minZoom])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isMobile && zoom > 1) {
      e.preventDefault()
      setIsDragging(true)
      setLastPanPoint({ x: e.clientX, y: e.clientY })
    }
  }, [isMobile, zoom])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isMobile && isDragging && zoom > 1) {
      e.preventDefault()
      const deltaX = e.clientX - lastPanPoint.x
      const deltaY = e.clientY - lastPanPoint.y
      
      setPan(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }))
      
      setLastPanPoint({ x: e.clientX, y: e.clientY })
    }
  }, [isMobile, isDragging, lastPanPoint, zoom])

  const handleMouseUp = useCallback(() => {
    if (!isMobile) {
      setIsDragging(false)
    }
  }, [isMobile])

  // Add wheel event listener to container
  useEffect(() => {
    const container = containerRef.current
    if (!container || isMobile) return

    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [handleWheel, isMobile])

  // Double tap to zoom on mobile
  const handleDoubleClick = useCallback(() => {
    if (zoom > 1) {
      setZoom(1)
      setPan({ x: 0, y: 0 })
    } else {
      setZoom(2)
    }
  }, [zoom])

  // Calculate bounds to prevent panning too far
  const getBoundedPan = (newPan: { x: number, y: number }) => {
    if (!containerRef.current || !imageRef.current || zoom <= 1) {
      return { x: 0, y: 0 }
    }

    const containerRect = containerRef.current.getBoundingClientRect()
    const imageRect = imageRef.current.getBoundingClientRect()
    
    const scaledWidth = imageRect.width * zoom
    const scaledHeight = imageRect.height * zoom
    
    const maxPanX = Math.max(0, (scaledWidth - containerRect.width) / 2)
    const maxPanY = Math.max(0, (scaledHeight - containerRect.height) / 2)
    
    return {
      x: Math.max(-maxPanX, Math.min(maxPanX, newPan.x)),
      y: Math.max(-maxPanY, Math.min(maxPanY, newPan.y))
    }
  }

  // Apply bounded pan
  useEffect(() => {
    const boundedPan = getBoundedPan(pan)
    if (boundedPan.x !== pan.x || boundedPan.y !== pan.y) {
      setPan(boundedPan)
    }
  }, [pan, zoom])

  return (
    <div 
      ref={containerRef}
      className="relative flex items-center justify-center w-full h-full overflow-hidden"
      style={{
        minHeight: isMobile ? '30vh' : '40vh',
        maxHeight: isMobile ? '40vh' : '60vh'
      }}
    >
      <div
        className="relative"
        style={{
          ...containerStyle,
          transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
          transformOrigin: 'center',
          transition: isDragging || isZooming ? 'none' : 'transform 0.2s'
        }}
      >
        <img
          ref={imageRef}
          src={src}
          alt={alt}
          onLoad={handleImageLoad}
          className={`w-full h-full object-contain ${className}`}
          style={{
            userSelect: 'none',
            WebkitUserSelect: 'none',
            pointerEvents: isDragging ? 'none' : 'auto'
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onDoubleClick={handleDoubleClick}
          draggable={false}
        />
      </div>
      
      {/* Zoom indicator */}
      {zoom > 1 && (
        <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm px-2 py-1 rounded text-xs text-white border border-gray-600">
          {Math.round(zoom * 100)}%
        </div>
      )}
      
      {/* Long press indicator for mobile */}
      {isLongPressing && (
        <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs text-white border border-gray-600">
          Showing Original
        </div>
      )}
      
      {/* Instructions overlay */}
      {zoom === 1 && !isLongPressing && (
        <div className="absolute bottom-2 left-2 right-2 text-center">
          <div className="bg-black/60 backdrop-blur-sm px-3 py-1 rounded text-xs text-gray-300">
            {isMobile ? 'Pinch to zoom • Double tap to reset' : 'Ctrl/Cmd + scroll to zoom • Click & drag to pan'}
          </div>
        </div>
      )}
    </div>
  )
} 