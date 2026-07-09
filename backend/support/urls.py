from django.urls import path

from .views import ContentReportCreateView, SupportTicketDetailView, SupportTicketListCreateView, SupportTicketReplyView

urlpatterns = [
    path("tickets/", SupportTicketListCreateView.as_view(), name="support-tickets"),
    path("tickets/<int:ticket_id>/", SupportTicketDetailView.as_view(), name="support-ticket-detail"),
    path("tickets/<int:ticket_id>/reply/", SupportTicketReplyView.as_view(), name="support-ticket-reply"),
    path("reports/", ContentReportCreateView.as_view(), name="content-report-create"),
]
