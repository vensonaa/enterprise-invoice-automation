import React, { useState, useCallback } from 'react';
import { DocumentArrowUpIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import type { UploadProgress } from '../types';

interface UploadAreaProps {
  onFileUpload: (file: File) => void;
  isUploading: boolean;
  uploadProgress: UploadProgress | null;
}

const UploadArea: React.FC<UploadAreaProps> = ({ onFileUpload, isUploading, uploadProgress }) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const pdfFile = files.find(file => file.type === 'application/pdf');
    
    if (pdfFile) {
      onFileUpload(pdfFile);
    }
  }, [onFileUpload]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      onFileUpload(file);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'uploading':
        return 'text-blue-600';
      case 'processing':
        return 'text-yellow-600';
      case 'completed':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploading':
        return 'animate-pulse';
      case 'processing':
        return 'animate-spin';
      case 'completed':
        return '';
      case 'failed':
        return '';
      default:
        return '';
    }
  };

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center">
        <DocumentArrowUpIcon className="w-6 h-6 mr-2" />
        Upload Invoice
      </h2>

      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
          isDragOver
            ? 'border-primary-400 bg-primary-50'
            : 'border-gray-300 hover:border-primary-400'
        } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileSelect}
          disabled={isUploading}
          className="hidden"
          id="file-upload"
        />
        
        <label htmlFor="file-upload" className="cursor-pointer">
          <div className="text-6xl text-gray-400 mb-4">
            <DocumentTextIcon className="w-24 h-24 mx-auto" />
          </div>
          <div className="text-xl font-semibold text-gray-700 mb-2">
            {isUploading ? 'Processing...' : 'Drop your PDF invoice here'}
          </div>
          <div className="text-gray-500">
            {isUploading ? 'AI is extracting data...' : 'or click to browse'}
          </div>
        </label>

        {/* Progress Bar */}
        {uploadProgress && (
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className={`font-medium ${getStatusColor(uploadProgress.status)}`}>
                {uploadProgress.message}
              </span>
              <span className="text-gray-600">
                {uploadProgress.percentage}%
              </span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${getStatusIcon(uploadProgress.status)} ${
                  uploadProgress.status === 'completed'
                    ? 'bg-green-500'
                    : uploadProgress.status === 'failed'
                    ? 'bg-red-500'
                    : uploadProgress.status === 'processing'
                    ? 'bg-yellow-500'
                    : 'bg-blue-500'
                }`}
                style={{ width: `${uploadProgress.percentage}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Upload Tips */}
      {!isUploading && (
        <div className="mt-4 text-sm text-gray-600">
          <p className="text-center">
            Supported format: PDF • Maximum file size: 10MB
          </p>
        </div>
      )}
    </div>
  );
};

export default UploadArea;
