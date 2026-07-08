"use client";
import { useRef, useState, useCallback } from "react";

const MAX_DURATION_SECONDS = 20;

export function useMediaRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const videoElRef = useRef<HTMLVideoElement | null>(null);

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

  const reset = useCallback(() => {
    setVideoBlob(null);
    setPreviewUrl(null);
    setDuration(0);
    chunksRef.current = [];
  }, []);

  const cleanup = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  return {
    isRecording, videoBlob, duration, error, previewUrl,
    startPreview, startRecording, stopRecording, reset, cleanup,
    maxDuration: MAX_DURATION_SECONDS,
  };
}