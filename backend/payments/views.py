"""
payments/views.py

Flow: InitiateSubscriptionView (frontend inaita hii) -> STK Push inatumwa
-> mtumiaji anaweka PIN kwenye simu -> Safaricom inaita MpesaCallbackView
(webhook, si frontend) -> Subscription inaamshwa.

Frontend inatumia TransactionStatusView ku-poll (kila sekunde chache)
kuona kama malipo yamekamilika, kwa sababu STK Push ni ASYNC.
"""
import logging
from datetime import timedelta

from django.conf import settings
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Subscription, Transaction
from .mpesa import stk_push
from .serializers import SubscriptionSerializer, TransactionSerializer

logger = logging.getLogger(__name__)


class InitiateSubscriptionView(APIView):
    """POST /api/payments/subscribe/ — body: {"plan": "weekly"|"monthly"}"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        plan = request.data.get("plan")
        if plan not in ("weekly", "monthly"):
            return Response({"detail": "plan lazima iwe 'weekly' au 'monthly'."}, status=status.HTTP_400_BAD_REQUEST)

        amount = settings.BASHIRI["SUBSCRIPTION_PRICES"][f"{plan}_tzs"]
        phone_number = request.user.phone_number

        transaction = Transaction.objects.create(
            user=request.user, plan=plan, amount_tzs=amount, phone_number=phone_number,
        )

        try:
            mpesa_response = stk_push(
                phone_number=phone_number, amount=amount,
                account_reference=f"BASHIRI-{transaction.id}",
                transaction_desc=f"Bashiri {plan} subscription",
            )
        except Exception as exc:
            logger.error(f"STK Push imeshindwa: {exc}")
            transaction.status = "FAILED"
            transaction.result_desc = str(exc)
            transaction.save(update_fields=["status", "result_desc"])
            return Response(
                {"detail": "Imeshindwa kutuma ombi la malipo. Jaribu tena."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        transaction.merchant_request_id = mpesa_response.get("MerchantRequestID", "")
        transaction.checkout_request_id = mpesa_response.get("CheckoutRequestID")
        transaction.save(update_fields=["merchant_request_id", "checkout_request_id"])

        return Response({
            "checkout_request_id": transaction.checkout_request_id,
            "detail": "Angalia simu yako, weka M-Pesa PIN kukamilisha malipo.",
        })


class TransactionStatusView(APIView):
    """GET /api/payments/status/{checkout_request_id}/ — frontend inapiga poll hapa."""
    permission_classes = [IsAuthenticated]

    def get(self, request, checkout_request_id):
        try:
            txn = Transaction.objects.get(checkout_request_id=checkout_request_id, user=request.user)
        except Transaction.DoesNotExist:
            return Response({"detail": "Transaction haipo."}, status=status.HTTP_404_NOT_FOUND)

        return Response(TransactionSerializer(txn).data)


class MpesaCallbackView(APIView):
    """
    POST /api/payments/mpesa/callback/ — Safaricom pekee ndio inayoita hii
    (webhook, hakuna JWT kwa sababu Safaricom haitumii JWT yetu).
    """
    permission_classes = [AllowAny]

    def post(self, request):
        body = request.data.get("Body", {}).get("stkCallback", {})
        checkout_request_id = body.get("CheckoutRequestID")
        result_code = body.get("ResultCode")
        result_desc = body.get("ResultDesc", "")

        if not checkout_request_id:
            return Response({"ResultCode": 0, "ResultDesc": "Ignored - no CheckoutRequestID"})

        try:
            txn = Transaction.objects.get(checkout_request_id=checkout_request_id)
        except Transaction.DoesNotExist:
            logger.warning(f"Callback kwa transaction isiyojulikana: {checkout_request_id}")
            return Response({"ResultCode": 0, "ResultDesc": "Ignored - unknown transaction"})

        # Idempotency: kama tayari imeshughulikiwa, usifanye tena (Safaricom
        # wakati mwingine inatuma callback zaidi ya mara moja)
        if txn.status != "PENDING":
            return Response({"ResultCode": 0, "ResultDesc": "Already processed"})

        if result_code == 0:
            metadata_items = body.get("CallbackMetadata", {}).get("Item", [])
            metadata = {item["Name"]: item.get("Value") for item in metadata_items}

            txn.status = "SUCCESS"
            txn.mpesa_receipt_number = metadata.get("MpesaReceiptNumber", "")
            txn.result_desc = result_desc
            txn.save(update_fields=["status", "mpesa_receipt_number", "result_desc"])

            _activate_subscription(txn)
        else:
            txn.status = "FAILED"
            txn.result_desc = result_desc
            txn.save(update_fields=["status", "result_desc"])

        return Response({"ResultCode": 0, "ResultDesc": "Accepted"})


def _activate_subscription(txn: Transaction):
    """Inaunda Subscription record na kuupdate User.is_subscriber/subscription_expires_at."""
    user = txn.user
    now = timezone.now()

    # Kama tayari ana subscription active, ongeza muda (stacking) badala ya
    # kuanza upya — mtumiaji halipotezi siku alizolipia.
    base_start = (
        user.subscription_expires_at
        if (user.is_subscriber and user.subscription_expires_at and user.subscription_expires_at > now)
        else now
    )
    duration = timedelta(days=7) if txn.plan == "weekly" else timedelta(days=30)
    ends_at = base_start + duration

    subscription = Subscription.objects.create(
        user=user, plan=txn.plan, amount_tzs=txn.amount_tzs,
        starts_at=base_start, ends_at=ends_at, is_active=True,
    )
    txn.subscription = subscription
    txn.save(update_fields=["subscription"])

    user.is_subscriber = True
    user.subscription_expires_at = ends_at
    user.save(update_fields=["is_subscriber", "subscription_expires_at"])

    logger.info(f"Subscription imeamshwa kwa {user}: {txn.plan} hadi {ends_at}")


class MyPaymentHistoryView(APIView):
    """GET /api/payments/my-history/ — historia ya malipo/subscriptions za mtumiaji mwenyewe."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        transactions = Transaction.objects.filter(user=request.user).order_by("-created_at")[:50]
        subscriptions = Subscription.objects.filter(user=request.user).order_by("-created_at")[:50]

        return Response({
            "transactions": TransactionSerializer(transactions, many=True).data,
            "subscriptions": SubscriptionSerializer(subscriptions, many=True).data,
        })
