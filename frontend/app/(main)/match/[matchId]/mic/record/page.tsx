"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useMediaRecorder } from "@/hooks/useMediaRecorder";
import { BashiriButton } from "@/components/ui/Button";
import { getUploadSignature, uploadVideoToCloudinary, createMicReaction } from "@/lib/api/mic";
import { Upload, Video, X, Camera } from "lucide-react";

const MoodSelector = dynamic(() => import("@/components/mic/MoodSelector"), { ssr: false });

export default function MicRecordPage() {
  const router = useRouter();
  const params = useParams();
  const matchId = Number(params.matchId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [mood, setMood] = useState("");
  const [teamSide, setTeamSide] = useState<"HOME" | "AWAY" | "NEUTRAL">("NEUTRAL");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const {
    mode, setMode, isRecording, selectedFile, videoBlob, duration, error: recError, previewUrl,
    startPreview, startRecording, stopRecording, selectFile, reset, cleanup, getVideoSource,
    maxDuration, minDuration, maxFileSizeMB,
  } = useMediaRecorder();

  useEffect(() => {
    if (mode === "record" && videoRef.current && mood) {
      startPreview(videoRef.current);
    }
    return () => cleanup();
  }, [mode, mood, startPreview, cleanup]);

  async function handlePost() {
    const videoSource = getVideoSource();
    if (!videoSource) return;
    setUploading(true);
    setError("");
    try {
      const sig = await getUploadSignature();
      const { secure_url, duration: uploadedDuration } = await uploadVideoToCloudinary(videoSource, sig);
      await createMicReaction({
        match: matchId,
        video_url: secure_url,
        thumbnail_url: "",
        duration_seconds: uploadedDuration || duration,
        mood,
        team_side: teamSide,
      });
      router.push(`/match/${matchId}/mic`);
    } catch (e: any) {
      setError(e.message || "Imeshindwa kupakia video.");
    } finally {
      setUploading(false);
    }
  }

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      selectFile(file);
    }
  }

  function handleReplaceVideo() {
    reset();
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  if (!mood) {
    return (
      <div className="min-h-dvh px-6 pt-safe pt-10">
        <h1 className="text-2xl font-black text-white mb-2">Chagua Mood Yako</h1>
        <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.5)" }}>Kabla ya kuongeza video, tuambie unahisije kuhusu mechi hii.</p>
        <MoodSelector selected={mood} onSelect={setMood} />
      </div>
    );
  }

  if (!mode) {
    return (
      <div className="min-h-dvh px-6 pt-safe pt-10 flex flex-col">
        <h1 className="text-2xl font-black text-white mb-2">Jinsi ya Kuongeza Video</h1>
        <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.5)" }}>Chagua njia unayopenda kushiriki reaction yako.</p>
        
        <div className="flex-1 flex flex-col gap-4">
          <button
            onClick={() => setMode("record")}
            className="flex-1 rounded-3xl p-6 text-left"
            style={{ background: "#111111", border: "2px solid rgba(255,255,255,0.08)" }}
          >
            <Camera size={32} className="mb-3" style={{ color: "#00FF87" }} />
            <h2 className="text-lg font-black text-white mb-1">🎥 Rekodi Video</h2>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>Rekodi moja kwa moja kwenye browser yako kwa kutumia kamera.</p>
          </button>

          <button
            onClick={() => setMode("upload")}
            className="flex-1 rounded-3xl p-6 text-left"
            style={{ background: "#111111", border: "2px solid rgba(255,255,255,0.08)" }}
          >
            <Upload size={32} className="mb-3" style={{ color: "#00FF87" }} />
            <h2 className="text-lg font-black text-white mb-1">📁 Pakia Video</h2>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>Chagua video kutoka kwenye device yako tayari kurekodiwa.</p>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col">
      <div className="relative flex-1 bg-black">
        {previewUrl ? (
          <video src={previewUrl} controls className="w-full h-full object-cover" />
        ) : mode === "record" ? (
          <video ref={videoRef} muted playsInline className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: "#111111" }}>
            <div className="text-center px-6">
              <Upload size={48} className="mx-auto mb-4" style={{ color: "rgba(255,255,255,0.3)" }} />
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>Chagua video ya sekunde 1-30</p>
            </div>
          </div>
        )}

        {(isRecording || previewUrl) && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full flex items-center gap-2" style={{ background: isRecording ? "rgba(255,71,87,0.9)" : "rgba(0,0,0,0.7)" }}>
            {isRecording && <span className="live-dot" />}
            <span className="text-xs font-bold text-white">{duration}s / {maxDuration}s</span>
          </div>
        )}
      </div>

      {(recError || error) && <p className="px-6 py-2 text-xs text-bashiri-red">{recError || error}</p>}

      <div className="px-6 py-5 pb-safe space-y-3">
        {mode === "upload" && (
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/quicktime,video/webm,video/x-m4v"
            onChange={handleFileSelect}
            className="hidden"
          />
        )}

        {mode === "record" && !isRecording && !videoBlob && (
          <button
            onClick={startRecording}
            className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-bold"
            style={{ background: "#FF4757", color: "#fff" }}
          >
            <Camera size={18} /> Anza Kurekodi
          </button>
        )}

        {mode === "record" && isRecording && (
          <button
            onClick={stopRecording}
            className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-bold"
            style={{ background: "#111111", border: "2px solid #FF4757", color: "#fff" }}
          >
            <Video size={18} /> Simamisha
          </button>
        )}

        {mode === "upload" && !selectedFile && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-bold"
            style={{ background: "#00FF87", color: "#000" }}
          >
            <Upload size={18} /> Chagua Video
          </button>
        )}

        {(videoBlob || selectedFile) && (
          <div className="flex gap-3">
            <BashiriButton variant="outline" className="flex-1" onClick={handleReplaceVideo}>
              <X size={18} className="mr-2" /> Badilisha
            </BashiriButton>
            <BashiriButton className="flex-1" loading={uploading} onClick={handlePost}>Post →</BashiriButton>
          </div>
        )}

        <p className="text-xs text-center" style={{ color: "rgba(255,255,255,0.3)" }}>
          {mode === "record" ? "Rekodi moja kwa moja kwenye browser" : `Maksimum: ${maxFileSizeMB}MB • ${minDuration}-${maxDuration}s • MP4, MOV, WebM, M4V`}
        </p>
      </div>
    </div>
  );
}