"""
mic/services.py

Video metadata extraction and validation services for Mic reactions.
Phase 1: Cloudinary API-based metadata extraction with logging.
"""
import logging
import re
from urllib.parse import urlparse

import cloudinary.api
from django.conf import settings

logger = logging.getLogger(__name__)


def extract_public_id_from_url(video_url):
    """
    Extract Cloudinary public_id from video URL.
    
    Cloudinary URL format:
    https://res.cloudinary.com/{cloud_name}/video/upload/{version}/{public_id}.{ext}
    or
    https://res.cloudinary.com/{cloud_name}/video/upload/{public_id}.{ext}
    """
    try:
        parsed = urlparse(video_url)
        path_parts = parsed.path.split('/')
        
        # Find the public_id (last part before extension)
        # Format: /video/upload/v1234567/folder/video.mp4 or /video/upload/folder/video.mp4
        if 'video' in path_parts and 'upload' in path_parts:
            upload_index = path_parts.index('upload')
            # Everything after 'upload' is the path to the file
            file_path = '/'.join(path_parts[upload_index + 1:])
            
            # Remove version if present (starts with v followed by digits)
            if re.match(r'^v\d+/', file_path):
                file_path = re.sub(r'^v\d+/', '', file_path)
            
            # Remove file extension
            public_id = re.sub(r'\.[^.]+$', '', file_path)
            
            logger.info(f"Extracted public_id from URL: {public_id}")
            return public_id
        
        logger.error(f"Could not extract public_id from URL: {video_url}")
        return None
    except Exception as e:
        logger.error(f"Error extracting public_id from URL: {video_url}, error: {str(e)}")
        return None


def extract_video_metadata(video_url):
    """
    Extract video metadata using Cloudinary API.
    
    Args:
        video_url: Cloudinary video URL
        
    Returns:
        dict: {
            "duration": float (seconds),
            "width": int,
            "height": int,
            "format": str,
            "codec": str,
            "size": int (bytes),
            "public_id": str
        }
        or None if extraction fails
    """
    try:
        public_id = extract_public_id_from_url(video_url)
        if not public_id:
            logger.error(f"Failed to extract public_id from URL: {video_url}")
            return None
        
        # Fetch video resource from Cloudinary
        resource = cloudinary.api.resource(
            public_id,
            resource_type="video",
            invalidate=True
        )
        
        if not resource or resource.get("resource_type") != "video":
            logger.error(f"Resource not found or not a video: {public_id}")
            return None
        
        metadata = {
            "duration": resource.get("duration"),
            "width": resource.get("width"),
            "height": resource.get("height"),
            "format": resource.get("format"),
            "codec": resource.get("codec", "unknown"),  # Cloudinary may not always provide codec
            "size": resource.get("bytes"),
            "public_id": public_id
        }
        
        logger.info(f"[VIDEO METADATA] URL: {video_url}")
        logger.info(f"[VIDEO METADATA] Duration: {metadata['duration']}s")
        logger.info(f"[VIDEO METADATA] Resolution: {metadata['width']}x{metadata['height']}")
        logger.info(f"[VIDEO METADATA] Format: {metadata['format']}")
        logger.info(f"[VIDEO METADATA] Codec: {metadata['codec']}")
        logger.info(f"[VIDEO METADATA] Size: {metadata['size']} bytes")
        
        return metadata
        
    except Exception as e:
        logger.error(f"Failed to extract video metadata from Cloudinary: {video_url}, error: {str(e)}")
        return None


def validate_video_duration(duration, min_seconds=1, max_seconds=60):
    """
    Validate video duration is within acceptable range.
    
    Args:
        duration: Video duration in seconds
        min_seconds: Minimum allowed duration (default: 1)
        max_seconds: Maximum allowed duration (default: 60)
        
    Returns:
        tuple: (is_valid: bool, error_message: str or None)
    """
    if duration is None:
        return False, "Video duration could not be determined."
    
    if duration < min_seconds:
        return False, f"Video ni fupi sana. Inahitajika angalau sekunde {min_seconds}."
    
    if duration > max_seconds:
        return False, f"Video haiwezi kuzidi sekunde {max_seconds}."
    
    return True, None


def validate_video_codec(codec):
    """
    Validate video codec is supported.
    Phase 1: Log codec for observation, don't reject yet.
    
    Args:
        codec: Video codec name
        
    Returns:
        tuple: (is_supported: bool, codec_name: str)
    """
    if not codec or codec == "unknown":
        logger.warning(f"Codec unknown or not provided")
        return True, codec  # Don't reject in Phase 1
    
    # Common supported codecs
    supported_codecs = ["h264", "hevc", "vp8", "vp9", "avc", "mpeg4"]
    codec_lower = codec.lower()
    
    is_supported = codec_lower in supported_codecs
    
    logger.info(f"[VIDEO CODEC] Codec: {codec}, Supported: {is_supported}")
    
    # Phase 1: Don't reject based on codec, just log
    return True, codec
