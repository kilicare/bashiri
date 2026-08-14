from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from .models import Review
from .serializers import ReviewSerializer

class ReviewListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        reviews = Review.objects.all().select_related('user')
        serializer = ReviewSerializer(reviews, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = ReviewSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserReviewListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        reviews = Review.objects.filter(user=request.user)
        serializer = ReviewSerializer(reviews, many=True)
        return Response(serializer.data)

class AdminReviewListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        reviews = Review.objects.all().select_related('user')
        serializer = ReviewSerializer(reviews, many=True)
        return Response(serializer.data)

class AdminReviewDetailView(APIView):
    permission_classes = [IsAdminUser]

    def delete(self, request, review_id):
        try:
            review = Review.objects.get(id=review_id)
            review.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Review.DoesNotExist:
            return Response({"error": "Review not found"}, status=status.HTTP_404_NOT_FOUND)

class AdminBulkDeleteView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request):
        review_ids = request.data.get("review_ids", [])
        if not review_ids:
            return Response({"error": "No review IDs provided"}, status=status.HTTP_400_BAD_REQUEST)

        deleted_count = Review.objects.filter(id__in=review_ids).delete()[0]
        return Response({"deleted_count": deleted_count}, status=status.HTTP_200_OK)
