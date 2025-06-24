import React, { useState, useRef, useCallback } from 'react';

interface Point {
  x: number;
  y: number;
}

interface ToneCurveProps {
  value: Point[];
  onChange: (points: Point[]) => void;
  width?: number;
  height?: number;
  title: string;
  disabled?: boolean;
}

export default function ToneCurve({ 
  value, 
  onChange, 
  width = 280, 
  height = 200, 
  title,
  disabled = false 
}: ToneCurveProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragIndex, setDragIndex] = useState(-1);
  const [hoveredIndex, setHoveredIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Default curve points if none provided
  const defaultPoints: Point[] = [
    { x: 0, y: 0 },
    { x: 0.25, y: 0.25 },
    { x: 0.5, y: 0.5 },
    { x: 0.75, y: 0.75 },
    { x: 1, y: 1 }
  ];

  const points = value.length > 0 ? value : defaultPoints;

  // Convert canvas coordinates to curve coordinates
  const canvasToPoint = useCallback((canvasX: number, canvasY: number): Point => {
    return {
      x: Math.max(0, Math.min(1, canvasX / width)),
      y: Math.max(0, Math.min(1, 1 - (canvasY / height)))
    };
  }, [width, height]);

  // Convert curve coordinates to canvas coordinates
  const pointToCanvas = useCallback((point: Point): { x: number; y: number } => {
    return {
      x: point.x * width,
      y: (1 - point.y) * height
    };
  }, [width, height]);

  // Create smooth curve through points using cubic interpolation
  const createCurve = useCallback((points: Point[]): string => {
    if (points.length < 2) return '';

    const sortedPoints = [...points].sort((a, b) => a.x - b.x);
    let path = '';

    for (let i = 0; i < sortedPoints.length; i++) {
      const point = pointToCanvas(sortedPoints[i]);
      
      if (i === 0) {
        path += `M ${point.x} ${point.y}`;
      } else {
        const prevPoint = pointToCanvas(sortedPoints[i - 1]);
        const cp1x = prevPoint.x + (point.x - prevPoint.x) * 0.3;
        const cp1y = prevPoint.y;
        const cp2x = point.x - (point.x - prevPoint.x) * 0.3;
        const cp2y = point.y;
        
        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${point.x} ${point.y}`;
      }
    }

    return path;
  }, [pointToCanvas]);

  // Handle mouse/touch events
  const handlePointerDown = useCallback((event: React.PointerEvent) => {
    if (disabled) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const canvasX = event.clientX - rect.left;
    const canvasY = event.clientY - rect.top;

    // Check if clicking on existing point
    let clickedIndex = -1;
    const clickThreshold = 12;

    points.forEach((point, index) => {
      const canvasPoint = pointToCanvas(point);
      const distance = Math.sqrt(
        Math.pow(canvasX - canvasPoint.x, 2) + Math.pow(canvasY - canvasPoint.y, 2)
      );
      
      if (distance <= clickThreshold) {
        clickedIndex = index;
      }
    });

    if (clickedIndex !== -1) {
      // Dragging existing point
      setDragIndex(clickedIndex);
      setIsDragging(true);
      event.currentTarget.setPointerCapture(event.pointerId);
    } else {
      // Add new point (except for first and last points which are fixed)
      const newPoint = canvasToPoint(canvasX, canvasY);
      if (newPoint.x > 0.05 && newPoint.x < 0.95) {
        const newPoints = [...points, newPoint].sort((a, b) => a.x - b.x);
        onChange(newPoints);
        
        // Start dragging the new point
        const newIndex = newPoints.findIndex(p => p === newPoint);
        setDragIndex(newIndex);
        setIsDragging(true);
        event.currentTarget.setPointerCapture(event.pointerId);
      }
    }
  }, [disabled, points, pointToCanvas, canvasToPoint, onChange]);

  const handlePointerMove = useCallback((event: React.PointerEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const canvasX = event.clientX - rect.left;
    const canvasY = event.clientY - rect.top;

    if (isDragging && dragIndex !== -1) {
      const newPoint = canvasToPoint(canvasX, canvasY);
      
      // Don't allow moving first and last points horizontally
      if (dragIndex === 0) {
        newPoint.x = 0;
      } else if (dragIndex === points.length - 1) {
        newPoint.x = 1;
      }

      const newPoints = [...points];
      newPoints[dragIndex] = newPoint;
      onChange(newPoints);
    } else {
      // Update hovered point for visual feedback
      let hoveredIndex = -1;
      const hoverThreshold = 12;

      points.forEach((point, index) => {
        const canvasPoint = pointToCanvas(point);
        const distance = Math.sqrt(
          Math.pow(canvasX - canvasPoint.x, 2) + Math.pow(canvasY - canvasPoint.y, 2)
        );
        
        if (distance <= hoverThreshold) {
          hoveredIndex = index;
        }
      });

      setHoveredIndex(hoveredIndex);
    }
  }, [isDragging, dragIndex, points, canvasToPoint, pointToCanvas, onChange]);

  const handlePointerUp = useCallback((event: React.PointerEvent) => {
    setIsDragging(false);
    setDragIndex(-1);
    event.currentTarget.releasePointerCapture(event.pointerId);
  }, []);

  // Double-click to remove point (except first and last)
  const handleDoubleClick = useCallback((event: React.MouseEvent) => {
    if (disabled) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const canvasX = event.clientX - rect.left;
    const canvasY = event.clientY - rect.top;
    const clickThreshold = 12;

    points.forEach((point, index) => {
      if (index === 0 || index === points.length - 1) return; // Can't remove first/last

      const canvasPoint = pointToCanvas(point);
      const distance = Math.sqrt(
        Math.pow(canvasX - canvasPoint.x, 2) + Math.pow(canvasY - canvasPoint.y, 2)
      );
      
      if (distance <= clickThreshold) {
        const newPoints = points.filter((_, i) => i !== index);
        onChange(newPoints);
      }
    });
  }, [disabled, points, pointToCanvas, onChange]);

  return (
    <div className="flex flex-col space-y-3">
      {/* Title */}
      <div className="text-xs font-medium text-gray-300 uppercase tracking-wider text-center">
        {title}
      </div>

      {/* Curve Canvas */}
      <div 
        ref={containerRef}
        className={`relative border border-gray-600 rounded-lg bg-gray-900 ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-crosshair'
        }`}
        style={{ width, height }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onDoubleClick={handleDoubleClick}
      >
        <svg
          width={width}
          height={height}
          className="absolute inset-0"
        >
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(156, 163, 175, 0.1)" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Diagonal reference line */}
          <line 
            x1="0" 
            y1={height} 
            x2={width} 
            y2="0" 
            stroke="rgba(156, 163, 175, 0.3)" 
            strokeWidth="1"
            strokeDasharray="4,4"
          />

          {/* Curve path */}
          <path
            d={createCurve(points)}
            fill="none"
            stroke="rgb(168, 85, 247)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Control points */}
          {points.map((point, index) => {
            const canvasPoint = pointToCanvas(point);
            const isHovered = hoveredIndex === index;
            const isDraggingThis = isDragging && dragIndex === index;
            const isFixed = index === 0 || index === points.length - 1;

            return (
              <g key={index}>
                {/* Point shadow */}
                <circle
                  cx={canvasPoint.x}
                  cy={canvasPoint.y}
                  r={isDraggingThis ? 8 : isHovered ? 7 : 6}
                  fill="rgba(0, 0, 0, 0.3)"
                  transform="translate(1, 1)"
                />
                {/* Point */}
                <circle
                  cx={canvasPoint.x}
                  cy={canvasPoint.y}
                  r={isDraggingThis ? 8 : isHovered ? 7 : 6}
                  fill={isFixed ? "rgb(156, 163, 175)" : "rgb(168, 85, 247)"}
                  stroke="white"
                  strokeWidth="2"
                  className={`transition-all duration-150 ${disabled ? '' : 'cursor-pointer'}`}
                />
                {/* Point coordinates on hover */}
                {isHovered && !disabled && (
                  <text
                    x={canvasPoint.x}
                    y={canvasPoint.y - 15}
                    textAnchor="middle"
                    className="text-xs fill-gray-300 pointer-events-none"
                    style={{ fontSize: '10px' }}
                  >
                    {`${Math.round(point.x * 100)}, ${Math.round(point.y * 100)}`}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Instructions overlay */}
        {!disabled && (
          <div className="absolute bottom-2 left-2 text-xs text-gray-500 pointer-events-none">
            Click to add • Drag to move • Double-click to remove
          </div>
        )}
      </div>

      {/* Reset button */}
      {!disabled && (
        <button
          onClick={() => onChange(defaultPoints)}
          className="text-xs text-gray-400 hover:text-white transition-colors"
        >
          Reset Curve
        </button>
      )}
    </div>
  );
}
