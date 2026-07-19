"""
notifications/fcm.py

Push notification delivery HALISI kupitia Firebase Cloud Messaging.
Inatumia Notification DB record kama chanzo cha ujumbe, inatuma kwa
DeviceToken ZOTE za mtumiaji husika. Token zisizo halali (zilizofutwa
na mtumiaji, app iliyoondolewa) zinaondolewa kiotomatiki.
"""
import json
import logging

logger = logging.getLogger(__name__)

_firebase_app = None


def _get_firebase_app():
    global _firebase_app
    if _firebase_app is not None:
        return _firebase_app

    from django.conf import settings

    if not settings.FIREBASE_SERVICE_ACCOUNT_JSON:
        logger.warning("FIREBASE_SERVICE_ACCOUNT_JSON haijawekwa — push haiwezi kutumwa.")
        return None

    import firebase_admin
    from firebase_admin import credentials

    try:
        cred_dict = json.loads(settings.FIREBASE_SERVICE_ACCOUNT_JSON)
        cred = credentials.Certificate(cred_dict)
        _firebase_app = firebase_admin.initialize_app(cred)
        return _firebase_app
    except Exception as exc:
        logger.error(f"Imeshindwa kuanzisha Firebase: {exc}")
        return None


def send_push_to_user(user, title: str, body: str, data: dict = None, click_action: str = "/home"):
    """Inatuma push kwa DeviceToken ZOTE za mtumiaji, inaondoa token zisizo halali."""
    app = _get_firebase_app()
    if app is None:
        return 0

    from .models import DeviceToken

    tokens = list(DeviceToken.objects.filter(user=user).values_list("token", flat=True))
    if not tokens:
        return 0

    from firebase_admin import messaging

    sent_count = 0
    invalid_tokens = []

    payload_data = {str(k): str(v) for k, v in (data or {}).items()}
    payload_data["click_action"] = click_action

    for token in tokens:
        message = messaging.Message(
            notification=messaging.Notification(title=title, body=body),
            data=payload_data,
            token=token,
        )
        try:
            messaging.send(message)
            sent_count += 1
        except messaging.UnregisteredError:
            invalid_tokens.append(token)
        except Exception as exc:
            logger.warning(f"Push imeshindwa kwa token {token[:12]}...: {exc}")

    if invalid_tokens:
        DeviceToken.objects.filter(token__in=invalid_tokens).delete()

    return sent_count
