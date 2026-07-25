"use client";
import { useState, useRef, useEffect } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { Film, Scissors, Loader2, AlertCircle } from "lucide-react";

// Mobile detection
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

interface VideoTrimmerProps {
  videoFile: File;
  videoUrl: string;
  originalDuration: number;
  maxDuration: number;
  onTrimComplete: (trimmedFile: File) => void;
  onCancel: () => void;
  onLoadError?: (message: string) => void;
  onTrimError?: (message: string) => void;
}

export function VideoTrimmer({
  videoFile,
  videoUrl,
  originalDuration,
  maxDuration,
  onTrimComplete,
  onCancel,
  onLoadError,
  onTrimError,
}: VideoTrimmerProps) {
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(Math.min(maxDuration, originalDuration));
  const [isTrimming, setIsTrimming] = useState(false);
  const [trimProgress, setTrimProgress] = useState(0);
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
  const [loadingFfmpeg, setLoadingFfmpeg] = useState(false);
  const [previewTime, setPreviewTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Don't load FFmpeg on mobile devices
    if (!isMobile) {
      loadFFmpeg();
    } else {
      // On mobile, immediately show error
      onLoadError?.("Video editing haifanyi kazi kwenye simu. Tumia video fupi zaidi (chini ya sekunde 60) au kompyuta.");
    }
    return () => {
      if (ffmpegRef.current) {
        ffmpegRef.current.terminate();
      }
    };
  }, []);

  const loadFFmpeg = async () => {
    try {
      setLoadingFfmpeg(true);
      const ffmpeg = new FFmpeg();
      
      ffmpeg.on("log", ({ message }) => {
        console.log("[FFmpeg]", message);
      });

      ffmpeg.on("progress", ({ progress }) => {
        setTrimProgress(Math.round(progress * 100));
      });

      // Try multiple CDN sources with different versions
      const cdnURLs = [
        "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm",
        "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm",
        "https://unpkg.com/@ffmpeg/core@0.11.0/dist/esm",
        "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.11.0/dist/esm",
      ];
      
      let loaded = false;
      let lastError: Error | null = null;
      
      for (const baseURL of cdnURLs) {
        try {
          console.log(`Attempting to load FFmpeg from: ${baseURL}`);
          await ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
          });
          loaded = true;
          console.log(`Successfully loaded FFmpeg from: ${baseURL}`);
          break;
        } catch (e) {
          console.warn(`Failed to load FFmpeg from ${baseURL}:`, e);
          lastError = e as Error;
          continue;
        }
      }
      
      if (!loaded) {
        throw new Error(`Failed to load FFmpeg from all CDN sources. Last error: ${lastError?.message}`);
      }

      ffmpegRef.current = ffmpeg;
      setFfmpegLoaded(true);
    } catch (error) {
      console.error("Failed to load FFmpeg:", error);
      setFfmpegLoaded(false);
      onLoadError?.("Imeshindika kupakia video editor. Tafadhali jaribu tena au tumia video fupi zaidi.");
    } finally {
      setLoadingFfmpeg(false);
    }
  };

  const handleTrim = async () => {
    if (!ffmpegRef.current || !ffmpegLoaded) {
      console.error("FFmpeg not loaded");
      return;
    }

    try {
      setIsTrimming(true);
      setTrimProgress(0);

      const ffmpeg = ffmpegRef.current;
      
      // Write input file
      await ffmpeg.writeFile("input.mp4", await fetchFile(videoFile));

      // Trim video using ffmpeg
      const duration = endTime - startTime;
      await ffmpeg.exec([
        "-i",
        "input.mp4",
        "-ss",
        startTime.toString(),
        "-t",
        duration.toString(),
        "-c",
        "copy",
        "output.mp4",
      ]);

      // Read output file
      const data = await ffmpeg.readFile("output.mp4");
      
      // Create blob from data - handle FileData type conversion
      const uint8Array = new Uint8Array(data as any);
      const blob = new Blob([uint8Array], { type: "video/mp4" });
      const trimmedFile = new File([blob], videoFile.name, { type: "video/mp4" });

      // Clean up
      await ffmpeg.deleteFile("input.mp4");
      await ffmpeg.deleteFile("output.mp4");

      onTrimComplete(trimmedFile);
    } catch (error) {
      console.error("Trim failed:", error);
      onTrimError?.("Imeshindwa kukata video. Tafadhali jaribu tena au tumia video fupi zaidi.");
    } finally {
      setIsTrimming(false);
    }
  };

  const handleTimelineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    const newStartTime = Math.max(0, value - maxDuration / 2);
    const newEndTime = Math.min(originalDuration, newStartTime + maxDuration);
    
    setStartTime(Math.max(0, newStartTime));
    setEndTime(newEndTime);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setPreviewTime(videoRef.current.currentTime);
      
      // Auto-pause if we reach the end time
      if (videoRef.current.currentTime >= endTime) {
        videoRef.current.pause();
        setIsPlaying(false);
        videoRef.current.currentTime = startTime;
      }
    }
  };

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setPreviewTime(time);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="bg-gray-900 rounded-3xl p-4 sm:p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/10 flex items-center justify-center">
              <Scissors size={18} className="text-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">Trim Video</h3>
              <p className="text-xs text-white/50">Chagua sehemu ya sekunde {maxDuration}</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Video Preview */}
        <div className="rounded-2xl overflow-hidden bg-black aspect-video mb-4 relative">
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-cover"
            onTimeUpdate={handleTimeUpdate}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
          
          {/* Play/Pause Overlay */}
          <button
            onClick={handlePlayPause}
            className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
          >
            {isPlaying ? (
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <div className="w-0 h-0 border-t-8 border-b-8 border-l-12 border-transparent border-l-white ml-1" />
              </div>
            ) : (
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Film size={30} className="text-white" />
              </div>
            )}
          </button>

          {/* Time Display */}
          <div className="absolute bottom-3 left-3 right-3 flex justify-between">
            <span className="text-xs font-bold text-white bg-black/50 px-2 py-1 rounded">
              {formatTime(previewTime)}
            </span>
            <span className="text-xs font-bold text-white bg-black/50 px-2 py-1 rounded">
              {formatTime(originalDuration)}
            </span>
          </div>
        </div>

        {/* Timeline */}
        <div className="mb-4 sm:mb-6">
          <div className="flex justify-between text-xs text-white/70 mb-2">
            <span>Start: {formatTime(startTime)}</span>
            <span>End: {formatTime(endTime)}</span>
          </div>
          
          <div className="relative h-2 bg-white/10 rounded-full mb-4">
            {/* Full timeline */}
            <div className="absolute inset-0 bg-white/20 rounded-full" />
            
            {/* Selected region */}
            <div
              className="absolute h-full bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-accent)] rounded-full"
              style={{
                left: `${(startTime / originalDuration) * 100}%`,
                width: `${((endTime - startTime) / originalDuration) * 100}%`,
              }}
            />
            
            {/* Start handle */}
            <div
              className="absolute w-4 h-4 bg-white rounded-full -top-1 cursor-pointer shadow-lg"
              style={{ left: `${(startTime / originalDuration) * 100}%` }}
              draggable
              onDrag={(e) => {
                const rect = e.currentTarget.parentElement?.getBoundingClientRect();
                if (rect) {
                  const percent = (e.clientX - rect.left) / rect.width;
                  const newTime = Math.max(0, percent * originalDuration);
                  setStartTime(Math.min(newTime, endTime - 1));
                }
              }}
            />
            
            {/* End handle */}
            <div
              className="absolute w-4 h-4 bg-white rounded-full -top-1 cursor-pointer shadow-lg"
              style={{ left: `${(endTime / originalDuration) * 100}%` }}
              draggable
              onDrag={(e) => {
                const rect = e.currentTarget.parentElement?.getBoundingClientRect();
                if (rect) {
                  const percent = (e.clientX - rect.left) / rect.width;
                  const newTime = Math.min(originalDuration, percent * originalDuration);
                  setEndTime(Math.max(newTime, startTime + 1));
                }
              }}
            />
          </div>

          {/* Quick seek buttons */}
          <div className="flex justify-center gap-2">
            <button
              onClick={() => handleSeek(startTime)}
              className="px-2 sm:px-3 py-1.5 rounded-lg bg-white/10 text-white text-xs hover:bg-white/20 transition-colors"
            >
              Jump to Start
            </button>
            <button
              onClick={() => handleSeek(endTime)}
              className="px-2 sm:px-3 py-1.5 rounded-lg bg-white/10 text-white text-xs hover:bg-white/20 transition-colors"
            >
              Jump to End
            </button>
          </div>
        </div>

        {/* Duration Warning */}
        {endTime - startTime > maxDuration && (
          <div className="mb-4 p-3 rounded-xl bg-orange-500/20 border border-orange-500/30">
            <p className="text-xs text-orange-400 text-center">
              Selected duration is {Math.round(endTime - startTime)}s. Maximum is {maxDuration}s.
            </p>
          </div>
        )}

        {/* Loading FFmpeg */}
        {loadingFfmpeg && (
          <div className="mb-4 p-4 rounded-xl bg-white/5">
            <div className="flex items-center justify-center gap-3 mb-3">
              <Loader2 size={20} className="text-white animate-spin" />
              <span className="text-sm text-white/70">Loading video editor...</span>
            </div>
            <p className="text-xs text-center text-white/40">
              Inapakia tools za kuhariri video. Hii inaweza kuchukua sekunde chache...
            </p>
          </div>
        )}

        {/* FFmpeg Load Error */}
        {!ffmpegLoaded && !loadingFfmpeg && (
          <div className="mb-4 p-4 rounded-xl bg-[var(--danger)]/20 border border-[var(--danger)]/30">
            <div className="flex items-center justify-center gap-2 mb-3">
              <AlertCircle size={16} className="text-[var(--danger)]" />
              <p className="text-xs text-[var(--danger)] text-center">
                {isMobile 
                  ? "Video editing haifanyi kazi kwenye simu. Tumia video fupi zaidi (chini ya sekunde 60) au kompyuta."
                  : "Imeshindika kupakia video editor. Tumia video fupi zaidi (chini ya sekunde 20)."
                }
              </p>
            </div>
            {!isMobile && (
              <button
                onClick={loadFFmpeg}
                className="w-full py-2 rounded-lg bg-[var(--danger)]/20 text-[var(--danger)] text-xs font-medium hover:bg-[var(--danger)]/30 transition-colors"
              >
                Jaribu Tena
              </button>
            )}
          </div>
        )}

        {/* Trim Progress */}
        {isTrimming && (
          <div className="mb-4 p-4 rounded-xl bg-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-white/70">Trimming video...</span>
              <span className="text-sm font-bold text-white">{trimProgress}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-300"
                style={{ width: `${trimProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleTrim}
            disabled={!ffmpegLoaded || isTrimming || endTime - startTime > maxDuration}
            className="w-full py-3 sm:py-4 rounded-2xl flex items-center justify-center gap-2 font-bold bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-accent)] text-black disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity text-sm sm:text-base"
          >
            {isTrimming ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Trimming...</span>
              </>
            ) : (
              <>
                <Scissors size={18} />
                <span>Trim & Continue</span>
              </>
            )}
          </button>
          
          <button
            onClick={onCancel}
            disabled={isTrimming}
            className="w-full py-3 rounded-2xl font-medium bg-white/10 text-white hover:bg-white/20 transition-colors disabled:opacity-50 text-sm sm:text-base"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
