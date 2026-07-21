from django.urls import path

from .views import PulseSummaryView

urlpatterns = [
    path("summary/", PulseSummaryView.as_view(), name="pulse-summary"),
]
