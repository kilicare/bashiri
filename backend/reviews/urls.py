from django.urls import path
from .views import ReviewListView, UserReviewListView, AdminReviewListView, AdminReviewDetailView, AdminBulkDeleteView

urlpatterns = [
    path("", ReviewListView.as_view(), name="review-list"),
    path("my-reviews/", UserReviewListView.as_view(), name="user-review-list"),
    path("admin/", AdminReviewListView.as_view(), name="admin-review-list"),
    path("admin/<int:review_id>/", AdminReviewDetailView.as_view(), name="admin-review-detail"),
    path("admin/bulk-delete/", AdminBulkDeleteView.as_view(), name="admin-bulk-delete"),
]
