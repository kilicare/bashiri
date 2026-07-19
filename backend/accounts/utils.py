"""
accounts/utils.py

═══════════════════════════════════════════════════════════
OTP FLOW — IMESIMAMISHWA KWA MUDA (commented out, si kufutwa)
═══════════════════════════════════════════════════════════
Sababu: Gharama ya SMS gateway (Africa's Talking) haikuwa na chanzo
cha bure cha kutosha kwa sasa. Mfumo umebadilishwa kutumia phone_number
+ password (accounts/views.py: RegisterView, LoginView).

Code ya OTP imehifadhiwa hapa chini KAMA COMMENT — itakaporudishwa
kazini (baada ya kupata bajeti ya SMS gateway), ondoa alama za """ na
uunganishe tena na accounts/urls.py (request-otp/, verify-otp/) na
accounts/views.py (RequestOTPView, VerifyOTPView) ambazo nazo zimewekwa
kama comment kwa muundo ule ule.
"""

"""
import random
import logging
from datetime import timedelta

from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)


def generate_otp_code() -> str:
    length = settings.BASHIRI["OTP_LENGTH"]
    return "".join(random.choices("0123456789", k=length))


def get_otp_expiry():
    minutes = settings.BASHIRI["OTP_EXPIRY_MINUTES"]
    return timezone.now() + timedelta(minutes=minutes)


def send_otp_sms(phone_number: str, code: str) -> bool:
    message = (
        f"Bashiri: Namba yako ya uthibitisho ni {code}. "
        f"Haitumiki tena baada ya dakika {settings.BASHIRI['OTP_EXPIRY_MINUTES']}."
    )

    if settings.DEBUG or not settings.SMS_API_KEY:
        logger.info(f"[DEV OTP] {phone_number} -> {code}")
        print(f"\n{'='*50}\n[DEV MODE] OTP kwa {phone_number}: {code}\n{'='*50}\n")
        return True

    try:
        import africastalking

        africastalking.initialize(settings.SMS_USERNAME, settings.SMS_API_KEY)
        sms = africastalking.SMS
        response = sms.send(message, [phone_number])
        logger.info(f"Africa's Talking response: {response}")
        return True
    except Exception as exc:
        logger.error(f"Imeshindwa kutuma OTP kwa {phone_number}: {exc}")
        return False
"""