import type { Review } from "../../types/trip";
import "./TripReviews.css";

interface TripReviewsProps {
  reviews: Review[];
}

export default function TripReviews({ reviews }: TripReviewsProps) {
  if (reviews.length === 0) return null;

  return (
    <div className="trip-reviews">
      <h3>Keliautojų atsiliepimai</h3>
      <div className="trip-reviews-list">
        {reviews.map((review) => (
          <div key={review.id} className="trip-review-card">
            <span className="trip-review-author">{review.authorName}</span>
            <p className="trip-review-comment">{review.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
