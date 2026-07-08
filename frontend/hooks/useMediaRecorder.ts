"use client";
import { useState, useCallback, useRef } from "react";

const MAX_DURATION_SECONDS = 30;
const MIN_DURATION_SECONDS = 1;
const MAX_FILE_SIZE_MB = 50;
const ALLOWED_FORMATS = ["video/mp4", "video/quicktime", "video/webm", "video/x-m4v"];

export function useMediaRecorder() {
  const [mode, setMode] = useState<"record" | "upload" | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const videoElRef = useRef<HTMLVideoElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const startPreview = useCallback(async (videoEl: HTMLVideoElement) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: true });
      streamRef.current = stream;
      videoEl.srcObject = stream;
      videoElRef.current = videoEl;
      await videoEl.play();
    } catch {
      setError("Imeshindwa kufikia kamera/mic. Ruhusu ufikiaji kwenye browser.");
    }
  }, []);

  const startRecording = useCallback(() => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    setDuration(0);

    const recorder = new MediaRecorder(streamRef.current, { mimeType: "video/webm;codecs=vp8,opus" });
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      setVideoBlob(blob);
      setPreviewUrl(URL.createObjectURL(blob));
    };

    recorder.start();
    setIsRecording(true);

    let elapsed = 0;
    timerRef.current = setInterval(() => {
      elapsed += 1;
      setDuration(elapsed);
      if (elapsed >= MAX_DURATION_SECONDS) {
        stopRecording();
      }
    }, 1000);
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
  }, []);

  const validateFile = useCallback((file: File): string | null => {
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > MAX_FILE_SIZE_MB) {
      return `File ni kubwa sana. Maksimum ni theluthi ${MAX_FILE_SIZE_MB}MB.`;
    }

    if (!ALLOWED_FORMATS.includes(file.type)) {
      return "Format hii ya video haikubaliki. Tumia MP4, MOV, WebM, au M4V.";
    }

    return null;
  }, []);

  const extractDuration = useCallback((file: File): Promise<number> => {
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
  }, []);

  const selectFile = useCallback(async (file: File) => {
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
  }, [validateFile, extractDuration]);

  const reset = useCallback(() => {
    setMode(null);
    setIsRecording(false);
    setSelectedFile(null);
    setVideoBlob(null);
    setDuration(0);
    setError("");
    chunksRef.current = [];
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setPreviewUrl(null);
  }, []);

  const cleanup = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    if (timerRef.current) clearInterval(timerRef.current);
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  const getVideoSource = useCallback((): File | Blob | null => {
    return mode === "upload" ? selectedFile : videoBlob;
  }, [mode, selectedFile, videoBlob]);

  return {
    mode,
    setMode,
    isRecording,
    selectedFile,
    videoBlob,
    duration,
    error,
    previewUrl,
    startPreview,
    startRecording,
    stopRecording,
    selectFile,
    reset,
    cleanup,
    getVideoSource,
    maxDuration: MAX_DURATION_SECONDS,
    minDuration: MIN_DURATION_SECONDS,
    maxFileSizeMB: MAX_FILE_SIZE_MB,
  };
}