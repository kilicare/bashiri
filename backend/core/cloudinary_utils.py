"""core/cloudinary_utils.py — helper ya kujenga Cloudinary URL bila SDK nzito."""
from django.conf import settings


def cloudinary_url(public_id: str, transforms: str = "f_auto,q_auto,w_auto") -> str:
    cloud_name = settings.CLOUDINARY_STORAGE["CLOUD_NAME"]
    return f"https://res.cloudinary.com/{cloud_name}/image/upload/{transforms}/{public_id}"
