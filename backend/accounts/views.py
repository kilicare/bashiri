"""
accounts/views.py

Flow: request-otp -> verify-otp (JWT) -> complete-profile -> me/logout
Hii NDIO endpoint moja inayotumika Login NA Register.
"""
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken, TokenError

from .models import OTPCode, User
from .serializers import (
    CompleteProfileSerializer,
    OnboardingSerializer,
    RequestOTPSerializer,
    UpdateAvatarSerializer,
    UserSerializer,
    VerifyOTPSerializer,
)
from .utils import generate_otp_code, get_otp_expiry, send_otp_sms


class RequestOTPView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "otp"

    def post(self, request):
        serializer = RequestOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        phone_number = serializer.validated_data["phone_number"]

        OTPCode.objects.filter(phone_number=phone_number, is_used=False).update(is_used=True)

        code = generate_otp_code()
        OTPCode.objects.create(phone_number=phone_number, code=code, expires_at=get_otp_expiry())

        if not send_otp_sms(phone_number, code):
            return Response(
                {"detail": "Imeshindwa kutuma OTP. Jaribu tena baadaye."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        return Response({"detail": "OTP imetumwa.", "phone_number": phone_number})


class VerifyOTPView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "otp"

    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        phone_number = serializer.validated_data["phone_number"]
        code = serializer.validated_data["code"]

        otp = (
            OTPCode.objects.filter(phone_number=phone_number, is_used=False)
            .order_by("-created_at").first()
        )

        if otp is None or not otp.is_valid:
            return Response(
                {"detail": "OTP haipo au imekwisha muda wake. Omba mpya."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if otp.code != code:
            otp.attempts += 1
            otp.save(update_fields=["attempts"])
            return Response({"detail": "OTP si sahihi."}, status=status.HTTP_400_BAD_REQUEST)

        otp.is_used = True
        otp.save(update_fields=["is_used"])

        # get_or_create: kama phone_number ni mpya -> Register; ikiwa ipo -> Login
        user, _created = User.objects.get_or_create(phone_number=phone_number)

        # Check if user is banned
        if not user.is_active:
            return Response(
                {"detail": "Akaunti yako imesimamishwa. Wasiliana na usaidizi kwa maelezo zaidi."},
                status=status.HTTP_403_FORBIDDEN,
            )

        refresh = RefreshToken.for_user(user)
        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "profile_complete": user.profile_complete,
            "user": UserSerializer(user).data,
        })


class CompleteProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CompleteProfileSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        user = request.user
        user.username = serializer.validated_data["username"]
        user.date_of_birth = serializer.validated_data["date_of_birth"]
        user.save(update_fields=["username", "date_of_birth"])

        return Response(UserSerializer(user).data)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response({"detail": "refresh token inahitajika."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            RefreshToken(refresh_token).blacklist()
        except TokenError:
            return Response(
                {"detail": "Token si sahihi au tayari imebatilishwa."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response({"detail": "Umetoka kikamilifu."})


class OnboardingView(APIView):
    """Save user's favorite leagues during onboarding"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = OnboardingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        league_ids = serializer.validated_data["favorite_leagues"]

        from predictions.models import League
        leagues = League.objects.filter(id__in=league_ids)

        user.favorite_leagues.set(leagues)

        return Response(UserSerializer(user).data)


class SettingsView(APIView):
    """Get and update user settings"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            "favorite_leagues": list(request.user.favorite_leagues.values_list('code', flat=True)),
            "notifications_enabled": True,  # Default for now
        })

    def patch(self, request):
        """Update user settings (favorite_leagues, notifications, etc.)"""
        favorite_leagues = request.data.get("favorite_leagues")
        
        if favorite_leagues is not None:
            from predictions.models import League
            leagues = League.objects.filter(code__in=favorite_leagues)
            request.user.favorite_leagues.set(leagues)
        
        return Response(UserSerializer(request.user).data)


class UpdateAvatarView(APIView):
    """Upload and update user profile picture"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Check if file is in request
        if 'avatar' not in request.FILES:
            return Response(
                {"detail": "Picha haijapokelewa. Tafadhali chagua picha."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = UpdateAvatarSerializer(data=request.FILES)
        serializer.is_valid(raise_exception=True)
        
        avatar = serializer.validated_data["avatar"]
        
        # Upload to Cloudinary
        try:
            from cloudinary.uploader import upload
            result = upload(
                avatar,
                folder="bashiri/avatars",
                transformation=[
                    {"width": 200, "height": 200, "crop": "fill", "gravity": "face"},
                    {"quality": "auto"}
                ],
                resource_type="image"
            )
            
            # Update user avatar_url
            request.user.avatar_url = result["secure_url"]
            request.user.save(update_fields=["avatar_url"])
            
            return Response(UserSerializer(request.user).data)
        
        except Exception as e:
            print(f"Cloudinary upload error: {e}")
            return Response(
                {"detail": "Imeshindwa ku-upload picha. Jaribu tena."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class FavoriteTeamsView(APIView):
    """GET: orodha ya team_ids za sasa. PUT: badilisha orodha nzima."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({"team_ids": list(request.user.favorite_teams.values_list("id", flat=True))})

    def put(self, request):
        from predictions.models import Team

        team_ids = request.data.get("team_ids", [])
        teams = Team.objects.filter(id__in=team_ids)
        request.user.favorite_teams.set(teams)
        return Response({"team_ids": list(request.user.favorite_teams.values_list("id", flat=True))})


class FavoriteLeaguesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({"league_ids": list(request.user.favorite_leagues.values_list("id", flat=True))})

    def put(self, request):
        from predictions.models import League

        league_ids = request.data.get("league_ids", [])
        leagues = League.objects.filter(id__in=league_ids)
        request.user.favorite_leagues.set(leagues)
        return Response({"league_ids": list(request.user.favorite_leagues.values_list("id", flat=True))})


class UpdateSettingsView(APIView):
    """PATCH — kwa sasa: preferred_language pekee (SW/EN)."""
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        lang = request.data.get("preferred_language")
        if lang not in ("sw", "en"):
            return Response({"detail": "preferred_language lazima iwe 'sw' au 'en'."}, status=status.HTTP_400_BAD_REQUEST)
        request.user.preferred_language = lang
        request.user.save(update_fields=["preferred_language"])
        return Response(UserSerializer(request.user).data)
