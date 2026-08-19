"""
BASHIRI — Django Settings
Settings zote zinasomwa kutoka .env (python-decouple) — hakuna hardcoded secret.
"""
from pathlib import Path
from datetime import timedelta
from decouple import config, Csv
import dj_database_url

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config("DJANGO_SECRET_KEY", default="unsafe-dev-key-badilisha-production")
DEBUG = config("DEBUG", default=True, cast=bool)
ALLOWED_HOSTS = config("ALLOWED_HOSTS", default="localhost,127.0.0.1", cast=Csv())

INSTALLED_APPS = [
    "daphne",
    "channels",

    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    "django_celery_beat",
    "django_celery_results",
    "cloudinary_storage",
    "cloudinary",

    "core",
    "accounts",
    "predictions",
    "feed",
    "payments",
    "chat",
    "notifications",
    "dashboard",
    "matchroom",
    "mic",
    "support",
    "herocarousel",
    "pulse",
    "reviews",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    # Whitenoise removed for ASGI compatibility - using Django's built-in static serving
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

DATABASE_URL = config("DATABASE_URL", default=None)

if DATABASE_URL:
    DATABASES = {
        "default": dj_database_url.parse(
            DATABASE_URL,
            conn_max_age=60,
            ssl_require=True,
        )
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": config("POSTGRES_DB", default="bashiri"),
            "USER": config("POSTGRES_USER", default="bashiri_user"),
            "PASSWORD": config("POSTGRES_PASSWORD", default="changeme"),
            "HOST": config("POSTGRES_HOST", default="db"),
            "PORT": config("POSTGRES_PORT", default="5432"),
            "CONN_MAX_AGE": 60,
        }
    }

AUTH_USER_MODEL = "accounts.User"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator", "OPTIONS": {"min_length": 4}},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "Africa/Dar_es_Salaam"
USE_I18N = True
USE_TZ = True

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_STORAGE = "django.contrib.staticfiles.storage.StaticFilesStorage"

DEFAULT_FILE_STORAGE = "cloudinary_storage.storage.MediaCloudinaryStorage"
CLOUDINARY_STORAGE = {
    "CLOUD_NAME": config("CLOUDINARY_CLOUD_NAME", default=""),
    "API_KEY": config("CLOUDINARY_API_KEY", default=""),
    "API_SECRET": config("CLOUDINARY_API_SECRET", default=""),
}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ============================================================
# CACHES — Redis-based caching for static data
# ============================================================
CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": config("REDIS_URL", default="redis://redis:6379/2"),
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
            "CONNECTION_POOL_KWARGS": {
                "max_connections": 10,
                "retry_on_timeout": True,
            },
        },
        "KEY_PREFIX": "bashiri",
        "TIMEOUT": 3600,  # Default 1 hour
    }
}

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.AllowAny",
    ],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.LimitOffsetPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_THROTTLE_CLASSES": [] if DEBUG else [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "100/hour",
        "user": "1000/hour",
        "otp": "5/minute",  # imehifadhiwa — haitumiki kwa sasa (OTP flow imesimamishwa)
        "content_report": "10/hour",
        "auth_login": "10/minute",
        "auth_register": "5/hour",
        "password_reset": "5/hour",
        "feed": "10000/hour",  # Feed endpoint needs high rate limit for smooth scrolling
    },
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(days=config("JWT_ACCESS_TOKEN_LIFETIME_DAYS", default=7, cast=int)),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=config("JWT_REFRESH_TOKEN_LIFETIME_DAYS", default=90, cast=int)),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
}

CORS_ALLOWED_ORIGINS = config(
    "CORS_ALLOWED_ORIGINS",
    default="http://localhost:3000,http://127.0.0.1:3000",
    cast=Csv(),
)
CORS_ALLOW_CREDENTIALS = True

CELERY_BROKER_URL = config("CELERY_BROKER_URL", default="redis://redis:6379/0")
CELERY_RESULT_BACKEND = config("CELERY_RESULT_BACKEND", default="redis://redis:6379/0")
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = TIME_ZONE
CELERY_BEAT_SCHEDULER = "django_celery_beat.schedulers:DatabaseScheduler"

# Celery broker connection pool settings
CELERY_BROKER_CONNECTION_LIMIT = 10
CELERY_BROKER_POOL_LIMIT = 10

FOOTBALL_DATA_API_KEY = config("FOOTBALL_DATA_API_KEY", default="")
ODDS_API_KEY = config("ODDS_API_KEY", default="")
GROQ_API_KEY = config("GROQ_API_KEY", default="")
GROQ_MODEL = config("GROQ_MODEL", default="openai/gpt-oss-120b")
MPESA_CONSUMER_KEY = config("MPESA_CONSUMER_KEY", default="")
MPESA_CONSUMER_SECRET = config("MPESA_CONSUMER_SECRET", default="")
MPESA_SHORTCODE = config("MPESA_SHORTCODE", default="")
MPESA_PASSKEY = config("MPESA_PASSKEY", default="")
MPESA_ENV = config("MPESA_ENV", default="sandbox")
MPESA_CALLBACK_BASE_URL = config("MPESA_CALLBACK_BASE_URL", default="https://your-production-domain.com")

# Tigo Pesa Payment Gateway
TIGO_CLIENT_ID = config("TIGO_CLIENT_ID", default="")
TIGO_CLIENT_SECRET = config("TIGO_CLIENT_SECRET", default="")
TIGO_MERCHANT_ACCOUNT = config("TIGO_MERCHANT_ACCOUNT", default="")
TIGO_MERCHANT_PIN = config("TIGO_MERCHANT_PIN", default="")
TIGO_MERCHANT_ID = config("TIGO_MERCHANT_ID", default="")
TIGO_ENV = config("TIGO_ENV", default="sandbox")
TIGO_CALLBACK_URL = config("TIGO_CALLBACK_URL", default="http://localhost:8000/api/payments/tigo/callback/")
TIGO_REDIRECT_URL = config("TIGO_REDIRECT_URL", default="http://localhost:3000/payment/complete")

SMS_API_KEY = config("SMS_API_KEY", default="")
SMS_USERNAME = config("SMS_USERNAME", default="sandbox")
FRONTEND_URL = config("FRONTEND_URL", default="http://localhost:3000")
FIREBASE_SERVICE_ACCOUNT_JSON = config("FIREBASE_SERVICE_ACCOUNT_JSON", default="")

# ============================================================
# BASHIRI — Business Logic Config (chanzo kimoja cha ukweli)
# MUHIMU: "LEAGUES" hapa chini LAZIMA iendane EXACTLY na "keys" za
# bashiri_prediction_models.json itakayotoka Google Colab (Phase 1):
# "EPL", "LaLiga", "Bundesliga", "Ligue1" — sio majina mengine.
# ============================================================
BASHIRI = {
    "OTP_EXPIRY_MINUTES": 10,
    "OTP_LENGTH": 6,
    "MIN_AGE_YEARS": 18,
    "GUEST_AI_CHAT_DAILY": 3,
    "FREE_AI_CHAT_DAILY": 8,
    "SUBSCRIBER_AI_CHAT_DAILY": 50,

    # Football Data Sync Configuration (SofaScore-like timeframe)
    "DAILY_SYNC_DAYS_BACK": 30,  # 30 days back (recent finished matches)
    "DAILY_SYNC_DAYS_FORWARD": 30,  # 30 days forward (upcoming fixtures)

    # Masoko 9 kwa jumla: 3 bure + 6 locked
    "FREE_MARKETS": ["1X2", "OVER_UNDER_2_5", "BTTS"],
    "LOCKED_MARKETS": [
        "DOUBLE_CHANCE", "DRAW_NO_BET",
        "OVER_UNDER_0_5", "OVER_UNDER_1_5",
        "OVER_UNDER_3_5", "OVER_UNDER_4_5",
    ],

    "FEED_CARD_SCORES": {
        "AI_PICK": 100,
        "LIVE_MATCH": 90,
        "RESULT_RECAP": 85,
        "AI_WEEKLY_REPORT": 70,
        "DEBATE": 65,
        "STAT": 50,
        "DID_YOU_KNOW": 45,
        "POLL": 40,
        "MILESTONE": 10,
    },

    "SUBSCRIPTION_PRICES": {
        "weekly_tzs": 1500,
        "monthly_tzs": 6000,
    },

    "LEAGUES": {
        "PL": "EPL",
        "PD": "LaLiga",
        "BL1": "Bundesliga",
        "FL1": "Ligue1",
        "WC": "WorldCup",
    },

    "FOOTBALL_DATA_BASE_URL": "https://api.football-data.org/v4",

    # ============================================================
    # Football Data Synchronization Configuration
    # ============================================================
    # Daily sync window - used by sync_daily command (Layer 2)
    # Comprehensive sync like Sofascore: 1 week back, 3 weeks forward
    "DAILY_SYNC_DAYS_BACK": config("DAILY_SYNC_DAYS_BACK", default=7, cast=int),
    "DAILY_SYNC_DAYS_FORWARD": config("DAILY_SYNC_DAYS_FORWARD", default=21, cast=int),

    # Historical sync configuration - used by sync_historical command (Layer 1)
    # Default seasons to import when using --all-available flag
    # Modify based on your API subscription tier
    "HISTORICAL_DEFAULT_SEASONS": config(
        "HISTORICAL_DEFAULT_SEASONS",
        default="2023,2024,2025",
        cast=Csv()
    ),

    "MIC_POSTING_WINDOW_HOURS": 24,
    "MIC_FAN_OF_MATCH_WINDOW_DAYS": 7,
    "MIC_MAX_VIDEO_SECONDS": 60,
    "MIC_MAX_FILE_SIZE_MB": 20,

    "CONTENT_REPORT_AUTO_HIDE_THRESHOLD": 3,

    "HERO_CAROUSEL_MAX_SLIDES": 5,
}

# ============================================================
# CHANNELS (WebSockets — Match Room live chat)
# ============================================================
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [config("CHANNELS_REDIS_URL", default="redis://redis:6379/1")],
            "capacity": 1500,
            "expiry": 10,
        },
    },
}
