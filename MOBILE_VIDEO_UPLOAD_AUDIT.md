# Mobile Video Upload Audit Report

## Tarehe: Jul 25, 2026

## Matatizo Yaliyogunduliwa

### 1. "Imeshindwa kupata muda wa video" Error

**Chanzo:** `frontend/components/video/VideoUploader.tsx` line 50

**Sababu:**
- Tumia `video.onloadedmetadata` event kupata muda wa video
- Kwenye mobile browsers (hasa Safari iOS na Chrome Android), hii event inaweza kushindwa kufanya kazi kwa:
  - Video formats zisizosaidiwa vizuri
  - Video kubwa sana (zaidi ya 50MB)
  - Memory issues kwenye simu
  - Network issues wakati wa kusoma metadata

**Code Problem:**
```typescript
video.onloadedmetadata = () => {
  URL.revokeObjectURL(video.src);
  const duration = Math.round(video.duration);
  resolve(duration);
};

video.onerror = () => {
  URL.revokeObjectURL(video.src);
  reject(new Error("Imeshindwa kupata muda wa video."));
};
```

### 2. 50MB File Size Restriction

**Chanzo:** `frontend/components/video/VideoUploader.tsx` line 7

**Sababu:**
- `MAX_FILE_SIZE_MB = 50` inaweza kuwa kubwa sana kwa mobile devices
- Simu nyingi zina memory ndogo na zinaweza kushindwa kushughulikia video kubwa
- Hii inasababisha:
  - Slow loading
  - App crashes
  - Memory overflow

### 3. FFmpeg Trimmer hai-fanyi kazi kwenye Mobile

**Chanzo:** `frontend/components/video/VideoTrimmer.tsx` line 3-4

**Sababu:**
- FFmpeg.js inatumia WebAssembly (WASM)
- WASM inaweza kushindwa kwenye mobile browsers kwa sababu:
  - SharedArrayBuffer inahitaji specific headers (COOP/COEP)
  - Memory limits kwenye simu
  - Processing power ndogo
  - Battery optimization inaweza ku-kill process

**Code Problem:**
```typescript
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
```

### 4. Trimming Page haionekani kwa Video > 50MB

**Chanzo:** `frontend/components/video/VideoUploader.tsx` line 26-27

**Sababu:**
- Kwanza kuna validation ya file size kabla ya kujaribu kupata duration
- Ikiwa file > 50MB, inarudisha error na hata hujajaribu kupata duration
- Hivyo trimming page haionekani

**Code Problem:**
```typescript
const validateFile = (file: File): string | null => {
  const fileSizeMB = file.size / (1024 * 1024);
  if (fileSizeMB > MAX_FILE_SIZE_MB) {
    return `File ni kubwa sana. Maksimum ni ${MAX_FILE_SIZE_MB}MB.`;
  }
  // ...
};
```

## Suluhisho Zilizopendekezwa

### 1. Improved Video Duration Detection

**Badilisha `extractDuration` function:**

```typescript
const extractDuration = (file: File): Promise<number> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true; // Add this for mobile compatibility
    video.playsInline = true; // Add this for iOS
    video.crossOrigin = "anonymous"; // Add for CORS issues
    
    let timeoutId: NodeJS.Timeout;
    
    // Add timeout for mobile
    timeoutId = setTimeout(() => {
      URL.revokeObjectURL(video.src);
      reject(new Error("Imeshindwa kupata muda wa video. Jaribu video ndogo zaidi."));
    }, 15000); // 15 second timeout
    
    video.onloadedmetadata = () => {
      clearTimeout(timeoutId);
      URL.revokeObjectURL(video.src);
      const duration = Math.round(video.duration);
      if (isNaN(duration) || duration === 0) {
        reject(new Error("Imeshindwa kupata muda wa video."));
      } else {
        resolve(duration);
      }
    };
    
    video.onerror = () => {
      clearTimeout(timeoutId);
      URL.revokeObjectURL(video.src);
      reject(new Error("Imeshindwa kupata muda wa video."));
    };
    
    video.src = URL.createObjectURL(file);
  });
};
```

### 2. Punguza Max File Size kwa Mobile

**Badilisha constants:**

```typescript
// Detect if mobile
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

const MAX_FILE_SIZE_MB = isMobile ? 20 : 50; // 20MB for mobile, 50MB for desktop
const MAX_DURATION_SECONDS = 60;
const MIN_DURATION_SECONDS = 1;
```

### 3. Alternative Trimming Solution kwa Mobile

**Chagua moja ya hizi:**

**Option A: Server-side Trimming**
- Tuma video kwenye server kwa trimming
- Server inatumia FFmpeg (stable)
- Return trimmed video

**Option B: Simplified Mobile Trimmer**
- Tumia basic video slicing bila FFmpeg
- Use MediaRecorder API kwa recording portion
- Less processing power required

**Option C: Disable Trimming kwa Mobile**
- Onyesha error message kwa mobile users
- Waahimie kutumia video fupi zaidi
- Provide link kwa desktop version

### 4. Better Error Handling kwa Mobile

**Ongeza mobile-specific error messages:**

```typescript
const validateFile = (file: File): string | null => {
  const fileSizeMB = file.size / (1024 * 1024);
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const maxSize = isMobile ? 20 : 50;
  
  if (fileSizeMB > maxSize) {
    if (isMobile) {
      return `File ni kubwa sana kwa simu. Maksimum ni ${maxSize}MB. Tumia video ndogo zaidi au kompyuta.`;
    }
    return `File ni kubwa sana. Maksimum ni ${maxSize}MB.`;
  }

  if (!ALLOWED_FORMATS.includes(file.type)) {
    return "Format hii ya video haikubaliki. Tumia MP4, MOV, WebM, au M4V.";
  }

  return null;
};
```

## Priority Fixes

### High Priority (Immediate)
1. **Punguza max file size kwa mobile** - 20MB instead of 50MB
2. **Ongeza timeout kwa duration detection** - 15 second timeout
3. **Better error messages kwa mobile users**

### Medium Priority (Short-term)
1. **Alternative trimming solution kwa mobile** - Server-side or simplified
2. **Add mobile detection logic**
3. **Test on actual mobile devices**

### Low Priority (Long-term)
1. **Progressive loading kwa large videos**
2. **Video compression kabla ya upload**
3. **Better mobile UI feedback**

## Files Zinahitaji Badiliko

1. `frontend/components/video/VideoUploader.tsx`
   - Line 7: Change MAX_FILE_SIZE_MB logic
   - Line 37-55: Improve extractDuration function
   - Line 24-35: Update validateFile function

2. `frontend/components/video/VideoTrimmer.tsx`
   - Line 49-103: Add mobile detection and alternative loading
   - Consider server-side fallback

3. `frontend/app/(main)/match/[matchId]/mic/record/page.tsx`
   - Line 15: Update MAX_FILE_SIZE_MB constant
   - Add mobile-specific logic

## Testing Recommendations

1. **Test on actual mobile devices:**
   - iPhone (Safari)
   - Android (Chrome)
   - Low-end Android devices

2. **Test scenarios:**
   - Video < 20MB
   - Video > 20MB but < 50MB
   - Video > 50MB
   - Different formats (MP4, MOV, WebM)
   - Slow network conditions

3. **Monitor:**
   - Memory usage
   - Battery impact
   - Loading times
   - Error rates

## Conclusion

Matatizo makuu ni:
1. **FFmpeg.js haifanyi kazi vizuri kwenye mobile** - WebAssembly issues
2. **50MB ni kubwa sana kwa mobile devices** - Memory limits
3. **Duration detection inaweza kushindwa kwenye mobile** - Browser compatibility

Suluhisho bora ni:
- Punguza file size limit kwa mobile (20MB)
- Tumia server-side trimming kwa mobile
- Better error handling na user feedback
