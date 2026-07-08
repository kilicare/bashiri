"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMediaRecorder } from "@/hooks/useMediaRecorder";
import { MoodSelector } from "@/components/mic/MoodSelector";
import { BashiriButton } from "@/components/ui/Button";
import { getUploadSignature, uploadVideoToCloudinary, createMicReaction } from "@/lib/api/mic";
import { Circle, Square } from "lucide-react";

export default function MicRecordPage() {
  const router = useRouter();
  const params = useParams();
  const matchId = Number(params.matchId);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [mood, setMood] = useState("");
  const [teamSide, setTeamSide] = useState<"HOME" | "AWAY" | "NEUTRAL">("NEUTRAL");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const {
    isRecording, videoBlob, duration, error: recError, previewUrl,
    startPreview, startRecording, stopRecording, reset, cleanup, maxDuration,
  } = useMediaRecorder();

  useEffect(() => {
    if (mood && videoRef.current) startPreview(videoRef.current);
    return () => cleanup();
  }, [mood]);

  async function handlePost() {
    if (!videoBlob) return;
    setUploading(true);
    setError("");
    try {
      const sig = await getUploadSignature();
      const { secure_url, duration: uploadedDuration } = await uploadVideoToCloudinary(videoBlob, sig);
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

  if (!mood) {
    return (
      <div className="min-h-dvh px-6 pt-safe pt-10">
        <h1 className="text-2xl font-black text-white mb-2">Chagua Mood Yako</h1>
        <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.5)" }}>Kabla ya kurekodi, tuambie unahisije kuhusu mechi hii.</p>
        <MoodSelector selected={mood} onSelect={setMood} />
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col">
      <div className="relative flex-1 bg-black">
        {previewUrl ? (
          <video src={previewUrl} controls className="w-full h-full object-cover" />
        ) : (
          <video ref={videoRef} muted playsInline className="w-full h-full object-cover" />
        )}

        {isRecording && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full flex items-center gap-2" style={{ background: "rgba(255,71,87,0.9)" }}>
            <span className="live-dot" />
            <span className="text-xs font-bold text-white">{duration}s / {maxDuration}s</span>
          </div>
        )}
      </div>

      {(recError || error) && <p className="px-6 py-2 text-xs text-bashiri-red">{recError || error}</p>}

      <div className="px-6 py-5 pb-safe space-y-3">
        {!videoBlob && !isRecording && (
          <button
            onClick={startRecording}
            className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-bold"
            style={{ background: "#FF4757", color: "#fff" }}
          >
            <Circle size={18} fill="#fff" /> Anza Kurekodi
          </button>
        )}

        {isRecording && (
          <button
            onClick={stopRecording}
            className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-bold"
            style={{ background: "#111111", border: "2px solid #FF4757", color: "#fff" }}
          >
            <Square size={18} fill="#FF4757" /> Simamisha
          </button>
        )}

        {videoBlob && !isRecording && (
          <div className="flex gap-3">
            <BashiriButton variant="outline" className="flex-1" onClick={reset}>Rekodi Tena</BashiriButton>
            <BashiriButton className="flex-1" loading={uploading} onClick={handlePost}>Post →</BashiriButton>
          </div>
        )}
      </div>
    </div>
  );
}