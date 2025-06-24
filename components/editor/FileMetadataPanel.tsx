import React from 'react';

interface FileMetadata {
  name: string;
  size: number;
  type: string;
  dimensions?: {
    width: number;
    height: number;
  };
}

interface FileMetadataPanelProps {
  fileMetadata: FileMetadata | null;
}

const FileMetadataPanel = ({ fileMetadata }: FileMetadataPanelProps) => {
  if (!fileMetadata) return null;
  
  return (
    <div className="space-y-2 mb-4">
      <h3 className="text-xs font-medium text-white">File Info</h3>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-400">Name</span>
          <span className="text-white truncate ml-1 max-w-24" title={fileMetadata.name}>
            {fileMetadata.name}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Size</span>
          <span className="text-white">
            {(fileMetadata.size / (1024 * 1024)).toFixed(1)} MB
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Type</span>
          <span className="text-white uppercase">
            {fileMetadata.type.split('/')[1]}
          </span>
        </div>
        {fileMetadata.dimensions && (
          <div className="flex justify-between">
            <span className="text-gray-400">Dimensions</span>
            <span className="text-white">
              {fileMetadata.dimensions.width} × {fileMetadata.dimensions.height}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileMetadataPanel; 