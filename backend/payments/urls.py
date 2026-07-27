from django.urls import path

from .views import InitiateSubscriptionView, MpesaCallbackView, MyPaymentHistoryView, TransactionStatusView

urlpatterns = [
    path("subscribe/", InitiateSubscriptionView.as_view(), name="initiate-subscription"),
    path("status/<str:checkout_request_id>/", TransactionStatusView.as_view(), name="transaction-status"),
    path("mpesa/callback/", MpesaCallbackView.as_view(), name="mpesa-callback"),
    path("my-history/", MyPaymentHistoryView.as_view(), name="my-payment-history"),
]
