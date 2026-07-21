"use client";
import { useRef, useState } from "react";
import { Upload, Film, X, Check } from "lucide-react";

const MAX_DURATION_SECONDS = 60;
const MIN_DURATION_SECONDS = 1;
const MAX_FILE_SIZE_MB = 50;
const ALLOWED_FORMATS = ["video/mp4", "video/quicktime", "video/webm", "video/x-m4v"];

interface VideoUploaderProps {
  onVideoSelected: (file: File, duration: number) => void;
  onShowTrimmer?: () => void;
  onPost?: () => void;
}

export function VideoUploader({ onVideoSelected, onShowTrimmer, onPost }: VideoUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [duration, setDuration] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const objectUrlRef = useRef<string | null>(null);

  const validateFile = (file: File): string | null => {
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > MAX_FILE_SIZE_MB) {
      return `File ni kubwa sana. Maksimum ni ${MAX_FILE_SIZE_MB}MB.`;
    }

    if (!ALLOWED_FORMATS.includes(file.type)) {
      return "Format hii ya video haikubaliki. Tumia MP4, MOV, WebM, au M4V.";
    }

    return null;
  };

  const extractDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src);
        const duration = Math.round(video.duration);
        resolve(duration);
      };
      
      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        reject(new Error("Imeshindwa kupata muda wa video."));
      };
      
      video.src = URL.createObjectURL(file);
    });
  };

  async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");
    
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const videoDuration = await extractDuration(file);
      
      if (videoDuration < MIN_DURATION_SECONDS) {
        setError(`Video ni fupi sana. Inahitajika angalau sekunde ${MIN_DURATION_SECONDS}.`);
        return;
      }
      
      if (videoDuration > MAX_DURATION_SECONDS) {
        // Video is too long, will trigger trimmer after selection
      }

      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }

      setSelectedFile(file);
      setDuration(videoDuration);
      const newObjectUrl = URL.createObjectURL(file);
      objectUrlRef.current = newObjectUrl;
      setPreviewUrl(newObjectUrl);
      
      // If video is within limits, proceed normally
      if (videoDuration <= MAX_DURATION_SECONDS) {
        onVideoSelected(file, videoDuration);
      } else {
        // Video is too long, trigger trimmer
        onVideoSelected(file, videoDuration);
        onShowTrimmer?.();
      }
    } catch (e: any) {
      setError(e.message || "Imeshindika kusoma video.");
    }
  }

  function handleReplaceVideo() {
    setSelectedFile(null);
    setDuration(0);
    setError("");
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleUseVideo() {
    if (selectedFile && duration <= MAX_DURATION_SECONDS) {
      onVideoSelected(selectedFile, duration);
    }
  }

  return (
    <div className="flex flex-col bg-black">
      {/* Header */}
      <div className="px-4 sm:px-6 pt-safe pt-10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <Film size={18} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">Create Moment</h1>
        </div>
      </div>

      {/* Preview Card */}
      <div className="px-4 sm:px-6 pb-4">
        <div className="rounded-3xl overflow-hidden bg-black relative max-w-4xl mx-auto" style={{ minHeight: '200px' }}>
          {previewUrl ? (
            <>
              <video 
                src={previewUrl} 
                controls 
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-sm z-10">
                <span className="text-xs font-bold text-white">
                  {duration}s / {MAX_DURATION_SECONDS}s
                </span>
              </div>
            </>
          ) : (
            <div
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-black p-6 cursor-pointer"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <Upload size={30} className="text-white/50" />
            </div>
            <p className="text-white/70 text-base sm:text-lg font-medium mb-3 text-center">Tap to select video</p>
            <p className="text-white/40 text-sm sm:text-base mb-8 text-center">MP4, MOV, WebM, M4V</p>
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-sm text-white/30">
              <span>Max {MAX_FILE_SIZE_MB}MB</span>
              <span className="hidden sm:inline">•</span>
              <span>{MIN_DURATION_SECONDS}-{MAX_DURATION_SECONDS}s</span>
            </div>
          </div>
          )}
        </div>
      </div>

      {/* Duration Warning - Outside video preview */}
      {duration > MAX_DURATION_SECONDS && (
        <div className="px-4 sm:px-6 pb-2">
          <div className="rounded-2xl bg-gradient-to-r from-[var(--warning)]/20 to-[var(--danger)]/20 border border-[var(--warning)]/30 px-4 py-3">
            <p className="text-xs font-bold text-[var(--warning)] text-center">
              Video yako ni sekunde {duration}. Chagua sehemu ya sekunde {MAX_DURATION_SECONDS} utakayoshare.
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="px-4 sm:px-6 py-2">
          <p className="text-xs text-red-400 bg-red-400/10 px-3 py-2 rounded-lg">{error}</p>
        </div>
      )}

      {/* Bottom Actions */}
      <div className="px-4 sm:px-6 py-8 pb-28 space-y-5 max-w-4xl mx-auto w-full">
        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/quicktime,video/webm,video/x-m4v"
          onChange={handleFileSelect}
          className="hidden"
        />

        {!selectedFile ? (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-bold bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-accent)] text-black hover:opacity-90 transition-opacity"
          >
            <Upload size={18} />
            <span>+ Chagua Video</span>
          </button>
        ) : (
          <div className="space-y-3">
            {duration > MAX_DURATION_SECONDS ? (
              <button
                onClick={() => onShowTrimmer?.()}
                className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-bold bg-gradient-to-r from-[var(--warning)] to-[var(--danger)] text-white hover:opacity-90 transition-opacity"
              >
                <Film size={18} />
                <span>✂ Trim Video</span>
              </button>
            ) : (
              onPost && (
                <button
                  onClick={onPost}
                  className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-bold bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-accent)] text-black hover:opacity-90 transition-opacity"
                >
                  <Check size={18} />
                  <span>Post →</span>
                </button>
              )
            )}
            
            <button
              onClick={handleReplaceVideo}
              className="w-full py-3 rounded-2xl flex items-center justify-center gap-2 font-medium bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <X size={18} />
              <span>Badilisha</span>
            </button>
          </div>
        )}

        <p className="text-sm text-center text-white/30">
          Max {MAX_FILE_SIZE_MB}MB • {MIN_DURATION_SECONDS}-{MAX_DURATION_SECONDS}s • MP4, MOV, WebM, M4V
        </p>
      </div>
    </div>
  );
}
