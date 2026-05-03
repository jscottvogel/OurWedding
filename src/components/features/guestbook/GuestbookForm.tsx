'use client';

import { useState, useRef } from 'react';
import { Upload, X, Camera, Music, Loader2, BookOpen } from 'lucide-react';
import { uploadData } from 'aws-amplify/storage';
import { toast } from 'sonner';

interface GuestbookFormProps {
  weddingId: string;
  onUploadComplete: (record: { 
    guestName: string; 
    message?: string; 
    songRequest?: string;
    messageType: 'GUESTBOOK' | 'SONG_REQUEST' | 'BOTH';
    mediaKey?: string; 
    mediaType?: string; 
  }) => Promise<void>;
}

export default function GuestbookForm({ weddingId, onUploadComplete }: GuestbookFormProps) {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [songRequest, setSongRequest] = useState('');
  const [file, setFile] = useState<File | null>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]); // Only allow 1 file for guestbook
    }
  };

  const removeFile = () => {
    setFile(null);
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    if (!message.trim() && !songRequest.trim() && !file) return;
    
    setIsUploading(true);
    
    try {
      let mediaKey: string | undefined;
      let mediaType: string | undefined;

      if (file) {
        const timestamp = new Date().getTime();
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        mediaKey = `guestbook/${weddingId}/${timestamp}-${safeName}`;
        mediaType = file.type;
        
        const result = uploadData({
          path: mediaKey,
          data: file,
          options: {
            contentType: file.type,
            onProgress: (progress) => {
              if (progress.totalBytes) {
                setUploadProgress((progress.transferredBytes / progress.totalBytes) * 100);
              }
            }
          }
        });
        
        await result.result;
      }
      
      const hasMessage = message.trim().length > 0;
      const hasSong = songRequest.trim().length > 0;
      let messageType: 'GUESTBOOK' | 'SONG_REQUEST' | 'BOTH' = 'GUESTBOOK';
      
      if (hasMessage && hasSong) messageType = 'BOTH';
      else if (hasSong && !hasMessage) messageType = 'SONG_REQUEST';

      await onUploadComplete({
        guestName: name.trim(),
        message: message.trim() || undefined,
        songRequest: songRequest.trim() || undefined,
        messageType,
        mediaKey,
        mediaType
      });
      
      toast.success('Your message has been added to the guestbook!');
      setName('');
      setMessage('');
      setSongRequest('');
      setFile(null);
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Failed to submit entry. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const isFormValid = name.trim().length > 0 && (message.trim().length > 0 || songRequest.trim().length > 0 || file !== null);

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 max-w-lg w-full mx-auto border border-light-gray">
      <h2 className="text-2xl font-display text-sage mb-6 text-center flex items-center justify-center">
        <BookOpen className="w-6 h-6 mr-2" />
        Sign the Guestbook
      </h2>
      
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-mid-gray mb-1">Your Name *</label>
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Doe"
            className="w-full border border-light-gray rounded-lg p-3 focus:border-sage focus:outline-none"
            disabled={isUploading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-mid-gray mb-1">Message</label>
          <textarea 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Leave your well wishes or advice for the couple..."
            className="w-full border border-light-gray rounded-lg p-3 h-32 resize-none focus:border-sage focus:outline-none"
            disabled={isUploading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-mid-gray mb-1">Song Request</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Music className="h-5 w-5 text-gray-400" />
            </div>
            <input 
              type="text" 
              value={songRequest}
              onChange={(e) => setSongRequest(e.target.value)}
              placeholder="Artist - Title"
              className="w-full border border-light-gray rounded-lg p-3 pl-10 focus:border-sage focus:outline-none"
              disabled={isUploading}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-mid-gray mb-2">Attach a Photo or Video (Optional)</label>
          
          {!file ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-sage/40 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-sage/5 transition-colors bg-ivory"
            >
              <Camera className="w-8 h-8 mb-2 text-sage" />
              <p className="font-medium text-charcoal text-sm">Tap to select media</p>
            </div>
          ) : (
            <div className="border border-light-gray rounded-xl p-3 bg-ivory/50 flex justify-between items-center">
              <span className="truncate max-w-[250px] text-sm text-mid-gray font-medium">{file.name}</span>
              <button 
                onClick={removeFile}
                disabled={isUploading}
                className="text-red-500 hover:bg-red-50 p-2 rounded transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            className="hidden" 
            accept="image/*,video/mp4,video/quicktime"
          />
        </div>

        <button 
          onClick={handleSubmit}
          disabled={isUploading || !isFormValid}
          className="w-full bg-sage text-white py-3 mt-4 rounded-lg font-medium hover:bg-dark-sage transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center relative overflow-hidden"
        >
          {isUploading ? (
            <>
              {file && <div className="absolute left-0 top-0 bottom-0 bg-dark-sage transition-all" style={{ width: `${uploadProgress}%` }}></div>}
              <span className="relative z-10 flex items-center">
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                {file ? `Uploading... ${Math.round(uploadProgress)}%` : 'Submitting...'}
              </span>
            </>
          ) : (
            <>
              <Upload className="w-5 h-5 mr-2" />
              Submit Entry
            </>
          )}
        </button>
      </div>
    </div>
  );
}
