"""core/cloudinary_utils.py — helper ya kujenga Cloudinary URL bila SDK nzito."""
import logging

import cloudinary.api
from django.conf import settings

logger = logging.getLogger(__name__)


def cloudinary_url(public_id: str, transforms: str = "f_auto,q_auto,w_auto") -> str:
    cloud_name = settings.CLOUDINARY_STORAGE["CLOUD_NAME"]
    return f"https://res.cloudinary.com/{cloud_name}/image/upload/{transforms}/{public_id}"


def delete_video_from_cloudinary(public_id):
    """
    Delete a video from Cloudinary by public_id.
    Used for cleanup when validation fails or for orphaned file cleanup.
    
    Args:
        public_id: Cloudinary public_id of the video to delete
        
    Returns:
        bool: True if deletion succeeded, False otherwise
    """
    try:
        result = cloudinary.uploader.destroy(
            public_id,
            resource_type="video",
            invalidate=True
        )
        
        if result.get("result") == "ok":
            logger.info(f"[CLOUDINARY CLEANUP] Deleted video: {public_id}")
            return True
        else:
            logger.error(f"[CLOUDINARY CLEANUP] Failed to delete video: {public_id}, result: {result}")
            return False
            
    except Exception as e:
        logger.error(f"[CLOUDINARY CLEANUP] Error deleting video {public_id}: {str(e)}")
        return False
