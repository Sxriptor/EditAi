import React, { useMemo } from 'react';

interface HistogramProps {
  imageData?: ImageData | null;
  width?: number;
  height?: number;
  showChannels?: boolean;
}

export default function Histogram({ 
  imageData, 
  width = 280, 
  height = 120,
  showChannels = true 
}: HistogramProps) {
  
  const histogramData = useMemo(() => {
    if (!imageData) return null;

    const redChannel = new Array(256).fill(0);
    const greenChannel = new Array(256).fill(0);
    const blueChannel = new Array(256).fill(0);
    const luminanceChannel = new Array(256).fill(0);

    const data = imageData.data;
    const pixelCount = data.length / 4;

    // Calculate histogram for each channel
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      redChannel[r]++;
      greenChannel[g]++;
      blueChannel[b]++;
      
      // Calculate luminance using standard formula
      const luminance = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      luminanceChannel[luminance]++;
    }

    // Normalize values to fit in the display height
    const maxRed = Math.max(...redChannel);
    const maxGreen = Math.max(...greenChannel);
    const maxBlue = Math.max(...blueChannel);
    const maxLuminance = Math.max(...luminanceChannel);
    const maxOverall = Math.max(maxRed, maxGreen, maxBlue, maxLuminance);

    return {
      red: redChannel.map(val => (val / maxOverall) * (height - 20)),
      green: greenChannel.map(val => (val / maxOverall) * (height - 20)),
      blue: blueChannel.map(val => (val / maxOverall) * (height - 20)),
      luminance: luminanceChannel.map(val => (val / maxOverall) * (height - 20)),
      pixelCount,
      maxValue: maxOverall
    };
  }, [imageData, height]);

  const createChannelPath = (channelData: number[]): string => {
    if (!channelData.length) return '';

    const barWidth = width / 256;
    let path = `M 0 ${height}`;

    channelData.forEach((value, index) => {
      const x = index * barWidth;
      const y = height - value;
      path += ` L ${x} ${y}`;
    });

    path += ` L ${width} ${height} Z`;
    return path;
  };

  if (!histogramData) {
    return (
      <div className="flex flex-col space-y-3">
        <div className="text-xs font-medium text-gray-300 uppercase tracking-wider text-center">
          Histogram
        </div>
        <div 
          className="border border-gray-600 rounded-lg bg-gray-900 flex items-center justify-center"
          style={{ width, height }}
        >
          <div className="text-xs text-gray-500">No image data</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-3">
      {/* Title */}
      <div className="text-xs font-medium text-gray-300 uppercase tracking-wider text-center">
        Histogram
      </div>

      {/* Histogram Display */}
      <div 
        className="relative border border-gray-600 rounded-lg bg-gray-900 overflow-hidden"
        style={{ width, height }}
      >
        <svg
          width={width}
          height={height}
          className="absolute inset-0"
        >
          {/* Background grid */}
          <defs>
            <pattern id="histogram-grid" width="32" height="24" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 24" fill="none" stroke="rgba(156, 163, 175, 0.05)" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#histogram-grid)" />

          {showChannels ? (
            <>
              {/* Red Channel */}
              <path
                d={createChannelPath(histogramData.red)}
                fill="rgba(239, 68, 68, 0.6)"
                stroke="rgba(239, 68, 68, 0.8)"
                strokeWidth="0.5"
              />

              {/* Green Channel */}
              <path
                d={createChannelPath(histogramData.green)}
                fill="rgba(34, 197, 94, 0.6)"
                stroke="rgba(34, 197, 94, 0.8)"
                strokeWidth="0.5"
              />

              {/* Blue Channel */}
              <path
                d={createChannelPath(histogramData.blue)}
                fill="rgba(59, 130, 246, 0.6)"
                stroke="rgba(59, 130, 246, 0.8)"
                strokeWidth="0.5"
              />
            </>
          ) : (
            /* Luminance Channel */
            <path
              d={createChannelPath(histogramData.luminance)}
              fill="rgba(255, 255, 255, 0.7)"
              stroke="rgba(255, 255, 255, 0.9)"
              strokeWidth="1"
            />
          )}

          {/* Shadow/Highlight indicators */}
          <line x1="0" y1="0" x2="0" y2={height} stroke="rgba(156, 163, 175, 0.5)" strokeWidth="1" />
          <line x1={width * 0.25} y1="0" x2={width * 0.25} y2={height} stroke="rgba(156, 163, 175, 0.2)" strokeWidth="1" strokeDasharray="2,2" />
          <line x1={width * 0.5} y1="0" x2={width * 0.5} y2={height} stroke="rgba(156, 163, 175, 0.2)" strokeWidth="1" strokeDasharray="2,2" />
          <line x1={width * 0.75} y1="0" x2={width * 0.75} y2={height} stroke="rgba(156, 163, 175, 0.2)" strokeWidth="1" strokeDasharray="2,2" />
          <line x1={width} y1="0" x2={width} y2={height} stroke="rgba(156, 163, 175, 0.5)" strokeWidth="1" />
        </svg>

        {/* Labels */}
        <div className="absolute bottom-1 left-1 text-xs text-gray-500">0</div>
        <div className="absolute bottom-1 right-1 text-xs text-gray-500">255</div>
        <div className="absolute top-1 left-1 text-xs text-gray-500">
          {Math.round(histogramData.pixelCount / 1000)}K px
        </div>
      </div>

      {/* Channel toggles */}
      <div className="flex items-center justify-center space-x-4">
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-red-500 rounded-full opacity-60" />
          <span className="text-xs text-gray-400">R</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-green-500 rounded-full opacity-60" />
          <span className="text-xs text-gray-400">G</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full opacity-60" />
          <span className="text-xs text-gray-400">B</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-gray-300 rounded-full opacity-60" />
          <span className="text-xs text-gray-400">L</span>
        </div>
      </div>
    </div>
  );
}
