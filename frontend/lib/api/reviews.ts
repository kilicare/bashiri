import { apiClient } from "./client";

export interface Review {
  id: number;
  user: number;
  username: string;
  rating: number;
  review_text: string;
  created_at: string;
  updated_at: string;
}

export function getReviews() {
  return apiClient<Review[]>("/reviews/");
}

export function getUserReviews() {
  return apiClient<Review[]>("/reviews/my-reviews/");
}

export function createReview(rating: number, reviewText: string) {
  return apiClient<Review>("/reviews/", {
    method: "POST",
    body: JSON.stringify({ rating, review_text: reviewText })
  });
}
