from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import DeviceToken, Notification, NotificationPreference
from .serializers import DeviceTokenSerializer, NotificationPreferenceSerializer, NotificationSerializer


class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        notifications = Notification.objects.filter(user=request.user)[:50]
        return Response(NotificationSerializer(notifications, many=True).data)


class MarkNotificationReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, notification_id):
        Notification.objects.filter(id=notification_id, user=request.user).update(is_read=True)
        return Response(status=status.HTTP_200_OK)


class RegisterDeviceTokenView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = DeviceTokenSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        DeviceToken.objects.update_or_create(
            token=serializer.validated_data["token"],
            defaults={"user": request.user, "platform": serializer.validated_data.get("platform", "web")},
        )
        return Response(status=status.HTTP_201_CREATED)


class NotificationPreferenceView(APIView):
    """GET/PATCH — mapendeleo ya notification. get_or_create kila wakati (kila user ana rekodi moja tu)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        pref, _ = NotificationPreference.objects.get_or_create(user=request.user)
        return Response(NotificationPreferenceSerializer(pref).data)

    def patch(self, request):
        pref, _ = NotificationPreference.objects.get_or_create(user=request.user)
        serializer = NotificationPreferenceSerializer(pref, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
