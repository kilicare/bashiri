from django.urls import path

from .views import HeroSlidesView

urlpatterns = [
    path("slides/", HeroSlidesView.as_view(), name="hero-slides"),
]
