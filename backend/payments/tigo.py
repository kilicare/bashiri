"""
payments/tigo.py

Tigo Pesa API client — Payment Authorization
Sandbox: https://securesandbox.tigo.com/test | Production: https://secure.tigo.com/production
"""
import requests
from django.conf import settings

TIGO_BASE_URL = (
    "https://securesandbox.tigo.com/test" if settings.TIGO_ENV == "sandbox" else "https://secure.tigo.com/production"
)


def get_access_token() -> str:
    """Generate access token for Tigo Pesa API."""
    resp = requests.post(
        f"{TIGO_BASE_URL}/v1/tigo/payment-auth/token",
        auth=(settings.TIGO_CLIENT_ID, settings.TIGO_CLIENT_SECRET),
        headers={"Content-Type": "application/json"},
        timeout=15,
    )
    resp.raise_for_status()
    return resp.json().get("accessToken")


def authorize_payment(
    phone_number: str,
    amount: int,
    first_name: str,
    last_name: str,
    email: str = "",
    transaction_ref_id: str = "",
) -> dict:
    """
    Authorize Tigo Pesa payment. Returns redirect URL for user to complete payment.
    """
    token = get_access_token()
    
    # Format phone number (remove + if present)
    formatted_phone = phone_number.replace("+", "")
    
    payload = {
        "MasterMerchant": {
            "account": settings.TIGO_MERCHANT_ACCOUNT,
            "pin": settings.TIGO_MERCHANT_PIN,
            "id": settings.TIGO_MERCHANT_ID,
        },
        "Subscriber": {
            "account": formatted_phone,
            "countryCode": "255",
            "country": "TZA",
            "firstName": first_name,
            "lastName": last_name,
            "emailId": email,
            "redirectUri": settings.TIGO_REDIRECT_URL,
            "callbackUri": settings.TIGO_CALLBACK_URL,
            "language": "eng",
        },
        "originPayment": {
            "amount": amount,
            "currencyCode": "TZS",
            "tax": 0,
            "fee": 0,
        },
        "LocalPayment": {
            "amount": amount,
            "currencyCode": "TZS",
        },
        "transactionRefId": transaction_ref_id,
    }
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }
    
    resp = requests.post(
        f"{TIGO_BASE_URL}/v1/tigo/payment-auth/authorize",
        json=payload,
        headers=headers,
        timeout=15,
    )
    resp.raise_for_status()
    return resp.json()
