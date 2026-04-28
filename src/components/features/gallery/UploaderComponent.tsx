'use client';

import { useState, useRef } from 'react';
import { Upload, X, Camera, Image as ImageIcon, Loader2 } from 'lucide-react';
import { uploadData } from 'aws-amplify/storage';
import { toast } from 'sonner';

interface UploaderComponentProps {
  weddingId: string;
  onUploadComplete: (record: { uploaderName: string; fileKey: string; fileType: string; fileSizeBytes: number }) => Promise<void>;
}

export default function UploaderComponent({ weddingId, onUploadComplete }: UploaderComponentProps) {
  const [name, setName] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (!name.trim() || files.length === 0) return;
    
    setIsUploading(true);
    let completed = 0;
    
    try {
      for (const file of files) {
        // Generate a unique key for the file
        const timestamp = new Date().getTime();
        const extension = file.name.split('.').pop();
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileKey = `gallery/${weddingId}/${timestamp}-${safeName}`;
        
        // Upload to S3 via Amplify Storage
        const result = uploadData({
          path: fileKey,
          data: file,
          options: {
            contentType: file.type,
            onProgress: (progress) => {
              if (progress.totalBytes) {
                // Approximate overall progress
                const fileProgress = progress.transferredBytes / progress.totalBytes;
                setUploadProgress(((completed + fileProgress) / files.length) * 100);
              }
            }
          }
        });
        
        await result.result;
        
        // Create database record
        await onUploadComplete({
          uploaderName: name,
          fileKey: fileKey,
          fileType: file.type,
          fileSizeBytes: file.size
        });
        
        completed++;
        setUploadProgress((completed / files.length) * 100);
      }
      
      toast.success('Photos uploaded successfully! Thank you.');
      setFiles([]);
      // Keep the name so they can upload more easily
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload some photos. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 max-w-md w-full mx-auto border border-light-gray">
      <h2 className="text-2xl font-display text-sage mb-6 text-center">Share Your Memories</h2>
      
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-mid-gray mb-1">Your Name</label>
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="How the couple knows you"
            className="w-full border border-light-gray rounded-lg p-3 focus:border-sage focus:outline-none"
            disabled={isUploading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-mid-gray mb-2">Photos & Videos</label>
          
          {files.length === 0 ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-sage/40 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-sage/5 transition-colors bg-ivory"
            >
              <div className="flex space-x-4 mb-4 text-sage">
                <Camera className="w-8 h-8" />
                <ImageIcon className="w-8 h-8" />
              </div>
              <p className="font-medium text-charcoal">Tap to select photos</p>
              <p className="text-xs text-mid-gray mt-2">High quality JPEGs, PNGs, and MP4s</p>
            </div>
          ) : (
            <div className="border border-light-gray rounded-xl p-4 max-h-60 overflow-y-auto bg-ivory/50">
              <div className="flex justify-between items-center mb-3 pb-2 border-b border-light-gray">
                <span className="text-sm font-medium text-charcoal">{files.length} files selected</span>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-sage hover:underline font-medium"
                  disabled={isUploading}
                >
                  Add more
                </button>
              </div>
              <ul className="space-y-2">
                {files.map((file, idx) => (
                  <li key={idx} className="flex justify-between items-center text-sm bg-white p-2 rounded border border-light-gray">
                    <span className="truncate max-w-[200px] text-mid-gray">{file.name}</span>
                    <button 
                      onClick={() => removeFile(idx)}
                      disabled={isUploading}
                      className="text-red-500 hover:bg-red-50 p-1 rounded transition-colors disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            className="hidden" 
            multiple 
            accept="image/*,video/mp4,video/quicktime"
          />
        </div>

        <button 
          onClick={handleUpload}
          disabled={isUploading || !name.trim() || files.length === 0}
          className="w-full bg-sage text-white py-3 rounded-lg font-medium hover:bg-dark-sage transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center relative overflow-hidden"
        >
          {isUploading ? (
            <>
              <div className="absolute left-0 top-0 bottom-0 bg-dark-sage transition-all" style={{ width: `${uploadProgress}%` }}></div>
              <span className="relative z-10 flex items-center">
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Uploading... {Math.round(uploadProgress)}%
              </span>
            </>
          ) : (
            <>
              <Upload className="w-5 h-5 mr-2" />
              Upload to Gallery
            </>
          )}
        </button>
      </div>
    </div>
  );
}
