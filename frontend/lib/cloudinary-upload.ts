/**
 * lib/cloudinary-upload.ts
 *
 * Upload ya video "production-grade" — inatumia CHUNKED UPLOAD ya
 * Cloudinary (vipande vya 6MB), yenye RETRY (mara 3 kwa kila chunk),
 * PROGRESS callback, na TIMEOUT ya busara kwa kila chunk. Hii
 * inashughulikia video kubwa/mtandao wa simu usio imara vizuri zaidi
 * kuliko fetch() moja kubwa — kama chunk moja ikikatika, TUNAJARIBU
 * TENA CHUNK HIYO PEKEE, si video nzima kuanzia mwanzo.
 */

export interface CloudinaryUploadResult {
  secure_url: string;
  duration: number;
  bytes: number;
}

export interface UploadSignature {
  signature: string;
  timestamp: number;
  api_key: string;
  cloud_name: string;
  folder: string;
}

const CHUNK_SIZE = 6 * 1024 * 1024; // 6MB — kiwango cha Cloudinary
const MAX_RETRIES_PER_CHUNK = 3;
const CHUNK_TIMEOUT_MS = 30000;

function generateUploadId(): string {
  return `bashiri-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function uploadChunk(
  url: string,
  chunk: Blob,
  start: number,
  end: number,
  totalSize: number,
  uploadId: string,
  sig: UploadSignature,
  onBytesSent: (bytes: number) => void
): Promise<{ success: boolean; bytes_sent: number }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("X-Unique-Upload-Id", uploadId);
    xhr.setRequestHeader("Content-Range", `bytes ${start}-${end - 1}/${totalSize}`);
    xhr.timeout = CHUNK_TIMEOUT_MS;

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onBytesSent(start + e.loaded);
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          reject(new Error("Jibu la Cloudinary halikueleweka."));
        }
      } else {
        reject(new Error(`Cloudinary error ${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error("Hitilafu ya mtandao."));
    xhr.ontimeout = () => reject(new Error("Muda wa kupakia chunk umeisha."));

    const formData = new FormData();
    formData.append("file", chunk);
    formData.append("api_key", sig.api_key);
    formData.append("timestamp", String(sig.timestamp));
    formData.append("signature", sig.signature);
    formData.append("folder", sig.folder);
    xhr.send(formData);
  });
}

/**
 * uploadVideoResilient — badala ya uploadVideoToCloudinary ya awali.
 * onProgress inaita na asilimia (0-100) ya kupakiwa, kwa UI ya progress bar.
 */
export async function uploadVideoResilient(
  file: File,
  sig: UploadSignature,
  onProgress?: (percent: number) => void
): Promise<CloudinaryUploadResult> {
  const url = `https://api.cloudinary.com/v1_1/${sig.cloud_name}/video/upload`;
  const totalSize = file.size;
  const uploadId = generateUploadId();

  let start = 0;
  let lastResponse: { success: boolean; bytes_sent: number; secure_url?: string; duration?: number; bytes?: number } | null = null;

  while (start < totalSize) {
    const end = Math.min(start + CHUNK_SIZE, totalSize);
    const chunk = file.slice(start, end);

    let attempt = 0;
    let success = false;
    let lastError: Error | null = null;

    while (attempt < MAX_RETRIES_PER_CHUNK && !success) {
      try {
        lastResponse = await uploadChunk(url, chunk, start, end, totalSize, uploadId, sig, (sent) => {
          onProgress?.(Math.min(99, Math.round((sent / totalSize) * 100)));
        });
        success = true;
      } catch (err) {
        lastError = err as Error;
        attempt += 1;
        if (attempt < MAX_RETRIES_PER_CHUNK) {
          await new Promise((r) => setTimeout(r, 1500 * attempt)); // backoff
        }
      }
    }

    if (!success) {
      throw new Error(
        `Imeshindwa kupakia video baada ya majaribio ${MAX_RETRIES_PER_CHUNK}. ` +
        `Angalia mtandao wako na ujaribu tena. (${lastError?.message || ""})` 
      );
    }

    start = end;
  }

  onProgress?.(100);

  if (!lastResponse?.secure_url) {
    throw new Error("Cloudinary haikutoa jibu kamili baada ya upload.");
  }

  return {
    secure_url: lastResponse.secure_url,
    duration: Math.round(lastResponse.duration || 0),
    bytes: lastResponse.bytes || totalSize,
  };
}
