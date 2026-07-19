"use client";
import { CloudUpload, Loader2, CheckCircle, XCircle } from "lucide-react";

interface UploadProgressProps {
  progress: number;
  status: "uploading" | "processing" | "completed" | "error";
  error?: string;
}

export function UploadProgress({ progress, status, error }: UploadProgressProps) {
  const getStatusMessage = () => {
    switch (status) {
      case "uploading":
        return "Inapakia video...";
      case "processing":
        return "Inashughulikia video...";
      case "completed":
        return "Imefanikiwa!";
      case "error":
        return "Imeshindwa";
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "uploading":
      case "processing":
        return "from-[var(--brand-primary)] to-[var(--brand-accent)]";
      case "completed":
        return "from-[var(--success)] to-[var(--success)]";
      case "error":
        return "from-[var(--danger)] to-[var(--danger)]";
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "uploading":
      case "processing":
        return <Loader2 size={24} className="text-white animate-spin" />;
      case "completed":
        return <CheckCircle size={24} className="text-white" />;
      case "error":
        return <XCircle size={24} className="text-white" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="bg-gray-900 rounded-3xl p-6 sm:p-8 w-full max-w-sm">
        {/* Icon */}
        <div className="flex justify-center mb-4 sm:mb-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/10 flex items-center justify-center">
            {status === "uploading" || status === "processing" ? (
              <CloudUpload size={30} className="text-white/50" />
            ) : (
              getStatusIcon()
            )}
          </div>
        </div>

        {/* Status Message */}
        <div className="text-center mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl font-bold text-white mb-2">{getStatusMessage()}</h3>
          {error && (
            <p className="text-xs sm:text-sm text-red-400">{error}</p>
          )}
        </div>

        {/* Progress Bar */}
        {(status === "uploading" || status === "processing") && (
          <div className="mb-4">
            <div className="flex justify-between text-xs sm:text-sm mb-2">
              <span className="text-white/70">Progress</span>
              <span className="text-white font-bold">{progress}%</span>
            </div>
            <div className="h-2 sm:h-3 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${getStatusColor()} transition-all duration-300`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Additional Info */}
        {status === "uploading" && (
          <p className="text-xs text-center text-white/40">
            Tafadhali subiri, usifunge programu...
          </p>
        )}

        {status === "processing" && (
          <p className="text-xs text-center text-white/40">
            Inashughulikia video yako...
          </p>
        )}

        {status === "completed" && (
          <p className="text-xs text-center text-white/40">
            Video yako imeshapakiwa kikamilifu!
          </p>
        )}
      </div>
    </div>
  );
}
