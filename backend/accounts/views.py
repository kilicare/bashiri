"""
accounts/views.py

Flow mpya: register (phone+password+username+dob, hatua moja) ->
login (phone+password) -> me/logout. OTP views zimewekwa chini kama
COMMENT.
"""
from django.contrib.auth import authenticate
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken, TokenError

from .models import User
from .serializers import (
    CompleteProfileSerializer,
    LoginSerializer,
    OnboardingSerializer,
    RegisterSerializer,
    RequestPasswordResetSerializer,
    UpdateAvatarSerializer,
    UserSerializer,
)


# ============================================================
# REGISTER / LOGIN — ACTIVE
# ============================================================
class RegisterView(APIView):
    """POST /api/auth/register/ — hatua MOJA: phone+password+username+dob."""
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth_register"

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        user = User.objects.create_user(
            phone_number=data["phone_number"],
            password=data["password"],
            username=data["username"],
            date_of_birth=data["date_of_birth"],
        )

        refresh = RefreshToken.for_user(user)
        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "profile_complete": user.profile_complete,
            "user": UserSerializer(user).data,
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    """POST /api/auth/login/ — phone_number + password."""
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth_login"

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        phone_number = serializer.validated_data["phone_number"]
        password = serializer.validated_data["password"]

        user = authenticate(request, phone_number=phone_number, password=password)

        if user is None:
            return Response(
                {"detail": "Namba ya simu au password si sahihi."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not user.is_active:
            return Response(
                {"detail": "Akaunti hii imezuiwa. Wasiliana na Msaada."},
                status=status.HTTP_403_FORBIDDEN,
            )

        refresh = RefreshToken.for_user(user)
        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "profile_complete": user.profile_complete,
            "user": UserSerializer(user).data,
        })


class RequestPasswordResetView(APIView):
    """
    POST /api/auth/request-password-reset/ — body: {"phone_number": "..."}

    Kwa vile hatuna SMS/Email ya bure kwa sasa, hii HAILETI OTP wala
    link ya moja kwa moja — inaunda SupportTicket (type=ACCOUNT_ISSUE)
    ambayo admin ataishughulikia KWA MKONO (kupitia WhatsApp/simu,
    baada ya kuthibitisha utambulisho wa mtumiaji), kisha kutumia
    AdminResetUserPasswordView (dashboard app) kuweka password mpya.

    Kwa faragha (kuzuia account enumeration), response ni ILE ILE
    bila kujali kama namba ipo kwenye database au la.
    """
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "password_reset"

    def post(self, request):
        serializer = RequestPasswordResetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        phone_number = serializer.validated_data["phone_number"]
        message = serializer.validated_data.get("message", "")

        user = User.objects.filter(phone_number=phone_number).first()

        if user:
            from support.models import SupportMessage, SupportTicket

            ticket = SupportTicket.objects.create(
                user=user,
                guest_phone=phone_number,
                type="ACCOUNT_ISSUE",
                subject="Ombi la Kubadilisha Password",
                status="OPEN",
            )
            SupportMessage.objects.create(
                ticket=ticket, sender_type="USER", sender=user,
                content=message or "Nimesahau password yangu, naomba msaada wa kubadilisha.",
            )

        return Response({
            "detail": (
                "Ombi limepokewa. Timu yetu itawasiliana nawe kupitia namba yako ya "
                "simu ndani ya muda mfupi kukusaidia kubadilisha password."
            )
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
    """Save user's favorite leagues and optionally favorite teams during onboarding."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = OnboardingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        league_ids = serializer.validated_data["favorite_leagues"]
        favorite_teams = serializer.validated_data.get("favorite_teams", [])

        from predictions.models import League, Team
        leagues = League.objects.filter(id__in=league_ids)
        user.favorite_leagues.set(leagues)

        teams = Team.objects.filter(id__in=favorite_teams)
        user.favorite_teams.set(teams)

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


# ============================================================
# OTP FLOW — IMESIMAMISHWA (commented out, si kufutwa)
# ============================================================
"""
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

        user, _created = User.objects.get_or_create(phone_number=phone_number)

        refresh = RefreshToken.for_user(user)
        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "profile_complete": user.profile_complete,
            "user": UserSerializer(user).data,
        })
"""
