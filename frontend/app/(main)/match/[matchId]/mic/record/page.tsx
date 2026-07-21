"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { BashiriButton } from "@/components/ui/Button";
import { getUploadSignature, uploadVideoToCloudinary, createMicReaction } from "@/lib/api/mic";
import { Upload, X } from "lucide-react";
import { MoodSelector } from "@/components/mic/MoodSelector";
import { VideoUploader } from "@/components/video/VideoUploader";
import { VideoTrimmer } from "@/components/video/VideoTrimmer";
import { UploadProgress } from "@/components/video/UploadProgress";

const MAX_DURATION_SECONDS = 60;
const MIN_DURATION_SECONDS = 1;
const MAX_FILE_SIZE_MB = 50;

export default function MicRecordPage() {
  console.log('[TRACE] MicRecordPage component called', { matchId: useParams().matchId });
  const router = useRouter();
  const params = useParams();
  const matchId = Number(params.matchId);

  const [mood, setMood] = useState("");
  const [teamSide, setTeamSide] = useState<"HOME" | "AWAY" | "NEUTRAL">("NEUTRAL");
  
  // Video upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [duration, setDuration] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showTrimmer, setShowTrimmer] = useState(false);
  const objectUrlRef = useRef<string | null>(null);
  
  // Upload progress state
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "processing" | "completed" | "error">("idle");
  const [uploadError, setUploadError] = useState("");
  const [trimError, setTrimError] = useState("");

  const handleVideoSelected = (file: File, fileDuration: number) => {
    setSelectedFile(file);
    setDuration(fileDuration);
    
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }
    const newObjectUrl = URL.createObjectURL(file);
    objectUrlRef.current = newObjectUrl;
    setPreviewUrl(newObjectUrl);
  };

  const handleVideoTrimmed = (trimmedFile: File) => {
    setSelectedFile(trimmedFile);
    setShowTrimmer(false);
    
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }
    const newObjectUrl = URL.createObjectURL(trimmedFile);
    objectUrlRef.current = newObjectUrl;
    setPreviewUrl(newObjectUrl);
    setDuration(MAX_DURATION_SECONDS);
  };

  const handleShowTrimmer = () => {
    if (selectedFile && previewUrl) {
      setShowTrimmer(true);
    }
  };

  async function handlePost() {
    if (!selectedFile) return;
    
    setUploadStatus("uploading");
    setUploadProgress(0);
    setUploadError("");
    
    try {
      // Simulate upload progress from 0 to 100
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + 5;
        });
      }, 200);

      const sig = await getUploadSignature();
      
      const { secure_url, duration: uploadedDuration } = await uploadVideoToCloudinary(selectedFile, sig);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadStatus("processing");
      
      await createMicReaction({
        match: matchId,
        video_url: secure_url,
        thumbnail_url: "",
        duration_seconds: uploadedDuration || duration,
        mood,
        team_side: teamSide,
      });
      
      setUploadStatus("completed");
      
      setTimeout(() => {
        router.push(`/match/${matchId}/mic`);
      }, 1500);
    } catch (e: any) {
      setUploadStatus("error");
      setUploadError(e.message || "Imeshindwa kupakia video.");
    }
  }

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  if (!mood) {
    return (
      <div className="min-h-dvh px-6 pt-safe pt-10">
        <h1 className="text-2xl font-black text-white mb-2">Chagua Mood Yako</h1>
        <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.5)" }}>Kabla ya kuongeza video, tuambie unahisije kuhusu mechi hii.</p>
        <MoodSelector selected={mood} onSelect={setMood} />
      </div>
    );
  }

  return (
    <>
      <VideoUploader 
        onVideoSelected={handleVideoSelected}
        onShowTrimmer={handleShowTrimmer}
        onPost={handlePost}
      />
      
      {showTrimmer && selectedFile && previewUrl && (
        <VideoTrimmer
          videoFile={selectedFile}
          videoUrl={previewUrl}
          originalDuration={duration}
          maxDuration={MAX_DURATION_SECONDS}
          onTrimComplete={handleVideoTrimmed}
          onCancel={() => setShowTrimmer(false)}
          onLoadError={(message) => {
            setTrimError(message);
            setShowTrimmer(false);
          }}
          onTrimError={(message) => {
            setTrimError(message);
            setShowTrimmer(false);
          }}
        />
      )}

      <AnimatePresence>
        {trimError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-5"
            onClick={() => setTrimError("")}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-[#111] rounded-3xl p-6 border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Imeshindikana</h2>
                <button
                  onClick={() => setTrimError("")}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-white/10">
                  <span className="text-2xl">⚠️</span>
                </div>
                <p className="text-sm text-white/70">{trimError}</p>
              </div>

              <BashiriButton size="lg" fullWidth onClick={() => setTrimError("")}>Sawa</BashiriButton>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {uploadStatus !== "idle" && (
        <UploadProgress
          progress={uploadProgress}
          status={uploadStatus}
          error={uploadError}
        />
      )}
    </>
  );
}