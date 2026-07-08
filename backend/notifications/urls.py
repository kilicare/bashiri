from django.urls import path

from .views import (
    MarkNotificationReadView, NotificationListView,
    NotificationPreferenceView, RegisterDeviceTokenView,
)

urlpatterns = [
    path("", NotificationListView.as_view(), name="notification-list"),
    path("<int:notification_id>/read/", MarkNotificationReadView.as_view(), name="notification-read"),
    path("device-token/", RegisterDeviceTokenView.as_view(), name="register-device-token"),
    path("preferences/", NotificationPreferenceView.as_view(), name="notification-preferences"),
]
