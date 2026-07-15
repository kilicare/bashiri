"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { BashiriButton } from "@/components/ui/Button";
import { getUploadSignature, uploadVideoToCloudinary, createMicReaction } from "@/lib/api/mic";
import { Upload, X } from "lucide-react";
import { MoodSelector } from "@/components/mic/MoodSelector";

const MAX_DURATION_SECONDS = 30;
const MIN_DURATION_SECONDS = 1;
const MAX_FILE_SIZE_MB = 50;
const ALLOWED_FORMATS = ["video/mp4", "video/quicktime", "video/webm", "video/x-m4v"];

export default function MicRecordPage() {
  const router = useRouter();
  const params = useParams();
  const matchId = Number(params.matchId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mood, setMood] = useState("");
  const [teamSide, setTeamSide] = useState<"HOME" | "AWAY" | "NEUTRAL">("NEUTRAL");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [duration, setDuration] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const validateFile = (file: File): string | null => {
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > MAX_FILE_SIZE_MB) {
      return `File ni kubwa sana. Maksimum ni theluthi ${MAX_FILE_SIZE_MB}MB.`;
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
        setError(`Video ni ndefu sana. Maksimum ni sekunde ${MAX_DURATION_SECONDS}.`);
        return;
      }

      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }

      setSelectedFile(file);
      setDuration(videoDuration);
      const newObjectUrl = URL.createObjectURL(file);
      objectUrlRef.current = newObjectUrl;
      setPreviewUrl(newObjectUrl);
    } catch (e: any) {
      setError(e.message || "Imeshindika kusoma video.");
    }
  }

  async function handlePost() {
    if (!selectedFile) return;
    setUploading(true);
    setError("");
    try {
      const sig = await getUploadSignature();
      const { secure_url, duration: uploadedDuration } = await uploadVideoToCloudinary(selectedFile, sig);
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
    <div className="min-h-dvh flex flex-col">
      <div className="relative flex-1 bg-black">
        {previewUrl ? (
          <video src={previewUrl} controls className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: "#111111" }}>
            <div className="text-center px-6">
              <Upload size={48} className="mx-auto mb-4" style={{ color: "rgba(255,255,255,0.3)" }} />
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>Chagua video ya sekunde 1-30</p>
            </div>
          </div>
        )}

        {previewUrl && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full flex items-center gap-2" style={{ background: "rgba(0,0,0,0.7)" }}>
            <span className="text-xs font-bold text-white">{duration}s / {MAX_DURATION_SECONDS}s</span>
          </div>
        )}
      </div>

      {error && <p className="px-6 py-2 text-xs text-bashiri-red">{error}</p>}

      <div className="px-6 py-5 pb-safe space-y-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/quicktime,video/webm,video/x-m4v"
          onChange={handleFileSelect}
          className="hidden"
        />

        {!selectedFile && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-bold"
            style={{ background: "#00FF87", color: "#000" }}
          >
            <Upload size={18} /> Chagua Video
          </button>
        )}

        {selectedFile && (
          <div className="flex gap-3">
            <BashiriButton variant="outline" className="flex-1" onClick={handleReplaceVideo}>
              <X size={18} className="mr-2" /> Badilisha
            </BashiriButton>
            <BashiriButton className="flex-1" loading={uploading} onClick={handlePost}>Post →</BashiriButton>
          </div>
        )}

        <p className="text-xs text-center" style={{ color: "rgba(255,255,255,0.3)" }}>
          Maksimum: {MAX_FILE_SIZE_MB}MB • {MIN_DURATION_SECONDS}-{MAX_DURATION_SECONDS}s • MP4, MOV, WebM, M4V
        </p>
      </div>
    </div>
  );
}