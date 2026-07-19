"""
herocarousel/models.py

CustomSlide — matangazo ya admin (mfano feature mpya, sherehe maalum).
Slides za kiotomatiki (Mechi ya Leo, Derby, Track Record, PRO, Fan of
Match, Did You Know) HAZIHIFADHIWI database — zinahesabiwa live kutoka
data iliyopo (herocarousel/services.py).
"""
from django.db import models


class CustomSlide(models.Model):
    title = models.CharField(max_length=150)
    subtitle = models.CharField(max_length=200, blank=True, default="")
    image_url = models.URLField(max_length=500)
    cta_label = models.CharField(max_length=50, blank=True, default="Angalia")
    route = models.CharField(max_length=200, blank=True, default="")
    accent_color = models.CharField(max_length=7, default="#00FF87")
    starts_at = models.DateTimeField(null=True, blank=True)
    ends_at = models.DateTimeField(null=True, blank=True)
    order = models.PositiveSmallIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "herocarousel_customslide"
        ordering = ["order", "-created_at"]

    def __str__(self):
        return self.title
