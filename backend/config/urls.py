"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

async def health_check(request):
    return JsonResponse({"status": "ok", "service": "bashiri-backend"})

urlpatterns = [
    path("", health_check),
    path("admin/", admin.site.urls),
    path("api/", include("core.urls")),
    path("api/auth/", include("accounts.urls")),
    path("api/predictions/", include("predictions.urls")),
    path("api/feed/", include("feed.urls")),
    path("api/payments/", include("payments.urls")),
    path("api/chat/", include("chat.urls")),
    path("api/notifications/", include("notifications.urls")),
    path("api/dashboard/", include("dashboard.urls")),
    path("api/matchroom/", include("matchroom.urls")),
    path("api/mic/", include("mic.urls")),
    path("api/support/", include("support.urls")),
    path("api/hero/", include("herocarousel.urls")),
    path("api/pulse/", include("pulse.urls")),
    path("api/reviews/", include("reviews.urls")),
]
