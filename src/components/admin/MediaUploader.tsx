import React, { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon, Video, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { optimizeImageFile, optimizeVideoFile } from '../../lib/mediaUtils';

interface MediaUploaderProps {
  label: string;
  sublabel?: string;
  accept?: 'image' | 'video' | 'both';
  currentValue?: string;
  onValueChange: (value: string) => void;
  maxDimensions?: { width?: number; height?: number };
  aspectRatioLabel?: string;
}

export const MediaUploader: React.FC<MediaUploaderProps> = ({
  label,
  sublabel,
  accept = 'image',
  currentValue,
  onValueChange,
  maxDimensions,
  aspectRatioLabel,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isVideo = currentValue?.startsWith('data:video/') || 
                  currentValue?.endsWith('.mp4') || 
                  currentValue?.endsWith('.webm') || 
                  currentValue?.includes('video');

  const handleFileProcess = async (file: File) => {
    setError(null);
    setSuccess(false);
    setIsProcessing(true);

    try {
      if (file.type.startsWith('video/')) {
        if (accept === 'image') {
          throw new Error('Only image files (JPEG, PNG, WEBP) are accepted for this field');
        }
        if (file.size > 20 * 1024 * 1024) {
          throw new Error('Video file size exceeds 20MB limit for fast mobile loading');
        }
        const videoDataUrl = await optimizeVideoFile(file);
        onValueChange(videoDataUrl);
        setSuccess(true);
      } else if (file.type.startsWith('image/')) {
        if (accept === 'video') {
          throw new Error('Only video files (MP4, WEBM) are accepted for this field');
        }
        // Optimize from PC to WebP
        const optimizedDataUrl = await optimizeImageFile(file, {
          maxWidth: maxDimensions?.width || 1920,
          maxHeight: maxDimensions?.height || 1200,
          quality: 0.86,
        });
        onValueChange(optimizedDataUrl);
        setSuccess(true);
      } else {
        throw new Error('Unsupported file format. Please upload JPG, PNG, WEBP or MP4.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to process file';
      setError(message);
    } finally {
      setIsProcessing(false);
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onValueChange('');
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const acceptMime = accept === 'video' 
    ? 'video/mp4,video/webm' 
    : accept === 'image' 
    ? 'image/jpeg,image/png,image/webp,image/avif' 
    : 'image/*,video/*';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#FAF6F0]">
            {label}
          </label>
          {sublabel && (
            <p className="text-[11px] text-[#A69584] mt-0.5">{sublabel}</p>
          )}
        </div>
        {aspectRatioLabel && (
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#352E2A] text-[#C4913A] border border-[#C4913A]/30">
            {aspectRatioLabel}
          </span>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptMime}
        onChange={handleChange}
        className="hidden"
      />

      {/* Preview or Drop Area */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative group rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer overflow-hidden ${
          isDragging
            ? 'border-[#C4913A] bg-[#C4913A]/10'
            : currentValue
            ? 'border-[#C4913A]/40 bg-[#1E1916]'
            : 'border-white/15 bg-[#1E1916]/60 hover:border-[#C4913A]/60 hover:bg-[#1E1916]'
        }`}
      >
        {currentValue ? (
          <div className="relative aspect-video sm:aspect-21/9 min-h-[160px] w-full flex items-center justify-center bg-black/40">
            {isVideo ? (
              <video
                src={currentValue}
                muted
                playsInline
                autoPlay
                loop
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={currentValue}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            )}

            {/* Overlay actions on hover */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-xs">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="px-3.5 py-1.5 rounded-full bg-[#C4913A] text-white text-xs font-medium flex items-center gap-1.5 shadow-md hover:bg-[#D4A34D] transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Replace from PC</span>
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="p-1.5 rounded-full bg-red-600/80 text-white hover:bg-red-600 transition-colors shadow-md"
                title="Remove media"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Media type badge */}
            <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded bg-black/70 backdrop-blur-xs border border-white/10 text-[10px] text-white flex items-center gap-1 font-mono">
              {isVideo ? <Video className="w-3 h-3 text-[#C4913A]" /> : <ImageIcon className="w-3 h-3 text-[#C4913A]" />}
              <span>{isVideo ? 'Video' : 'Optimized Image'}</span>
            </div>
          </div>
        ) : (
          <div className="py-8 px-4 flex flex-col items-center justify-center text-center space-y-2">
            <div className="w-11 h-11 rounded-full bg-[#352E2A] text-[#C4913A] flex items-center justify-center border border-[#C4913A]/30 group-hover:scale-105 transition-transform">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-[#FAF6F0]">
                <span className="text-[#C4913A] underline underline-offset-2">Click to browse PC</span> or drag &amp; drop
              </p>
              <p className="text-[11px] text-[#8A7A6A] mt-0.5">
                {accept === 'video' 
                  ? 'MP4 or WebM video file' 
                  : accept === 'image' 
                  ? 'JPEG, PNG, WEBP auto-compressed for lightning speed' 
                  : 'Image or Video files'}
              </p>
            </div>
          </div>
        )}

        {/* Loading spinner overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-20 space-y-2">
            <div className="w-7 h-7 border-2 border-[#C4913A] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-[#FAF6F0] font-medium">Optimizing &amp; reading file...</p>
          </div>
        )}
      </div>

      {/* Direct URL input fallback */}
      <div className="flex items-center gap-2 pt-1">
        <span className="text-[10px] text-[#8A7A6A] uppercase tracking-wider shrink-0">Or URL:</span>
        <input
          type="text"
          value={currentValue?.startsWith('data:') ? '' : currentValue || ''}
          placeholder={currentValue?.startsWith('data:') ? '(Uploaded from PC - saved in Firestore)' : 'https://example.com/media.jpg'}
          onChange={(e) => onValueChange(e.target.value)}
          className="w-full text-xs px-2.5 py-1.5 rounded bg-[#1E1916] border border-white/10 text-[#FAF6F0] placeholder:text-white/20 focus:outline-none focus:border-[#C4913A]"
        />
      </div>

      {/* Status Messages */}
      {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-400 bg-red-950/40 p-2 rounded border border-red-800/40">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/40 p-2 rounded border border-emerald-800/40">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>Media loaded &amp; ready to save!</span>
        </div>
      )}
    </div>
  );
};
