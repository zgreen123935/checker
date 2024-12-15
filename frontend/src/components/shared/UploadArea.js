import React, { useRef } from 'react';
import { ImagePlus } from 'lucide-react';
import './UploadArea.css';

export const UploadArea = ({ onFileSelect }) => {
  const fileInputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onFileSelect(files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  return (
    <div
      className="upload-area"
      onClick={() => fileInputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <ImagePlus className="upload-icon" />
      <div className="upload-text">
        <span className="primary-text">
          Drag and drop your image here, or click to select
        </span>
        <span className="secondary-text">
          Supported formats: JPG, PNG, HEIC (max 5MB)
        </span>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => onFileSelect(e.target.files)}
        accept="image/jpeg,image/png,image/heic"
        className="file-input"
        hidden
      />
    </div>
  );
};
