from django.urls import path
from .views import ChatView, FeedbackView

urlpatterns = [
    path("", ChatView.as_view(), name="chat"),
    path("feedback/", FeedbackView.as_view(), name="feedback"),
]
