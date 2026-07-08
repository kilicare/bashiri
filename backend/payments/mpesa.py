"""
payments/mpesa.py

M-Pesa Daraja API client — STK Push (Lipa Na M-Pesa Online).
Sandbox: https://sandbox.safaricom.co.ke | Production: https://api.safaricom.co.ke
"""
import base64
import datetime

import requests
from django.conf import settings

DARAJA_BASE_URL = (
    "https://sandbox.safaricom.co.ke" if settings.MPESA_ENV == "sandbox" else "https://api.safaricom.co.ke"
)


def get_access_token() -> str:
    resp = requests.get(
        f"{DARAJA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials",
        auth=(settings.MPESA_CONSUMER_KEY, settings.MPESA_CONSUMER_SECRET),
        timeout=15,
    )
    resp.raise_for_status()
    return resp.json()["access_token"]


def _generate_password(timestamp: str) -> str:
    raw = f"{settings.MPESA_SHORTCODE}{settings.MPESA_PASSKEY}{timestamp}"
    return base64.b64encode(raw.encode()).decode()


def stk_push(phone_number: str, amount: int, account_reference: str, transaction_desc: str) -> dict:
    """
    Inatuma STK Push kwenye simu ya mtumiaji. Mtumiaji ataona pop-up ya
    kuweka M-Pesa PIN. Matokeo halisi (success/failure) yanakuja BAADAYE
    kupitia callback (webhook) — hii function inarudisha tu uthibitisho
    kwamba push imetumwa, sio matokeo ya mwisho.
    """
    token = get_access_token()
    timestamp = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
    password = _generate_password(timestamp)

    # Safaricom inataka phone bila '+' mwanzoni, mfano 255712345678
    formatted_phone = phone_number.replace("+", "")

    callback_url = f"{settings.MPESA_CALLBACK_BASE_URL}/api/payments/mpesa/callback/"

    payload = {
        "BusinessShortCode": settings.MPESA_SHORTCODE,
        "Password": password,
        "Timestamp": timestamp,
        "TransactionType": "CustomerPayBillOnline",
        "Amount": int(amount),
        "PartyA": formatted_phone,
        "PartyB": settings.MPESA_SHORTCODE,
        "PhoneNumber": formatted_phone,
        "CallBackURL": callback_url,
        "AccountReference": account_reference,
        "TransactionDesc": transaction_desc,
    }
    headers = {"Authorization": f"Bearer {token}"}

    resp = requests.post(
        f"{DARAJA_BASE_URL}/mpesa/stkpush/v1/processrequest",
        json=payload, headers=headers, timeout=15,
    )
    resp.raise_for_status()
    return resp.json()