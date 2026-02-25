import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FaStar } from 'react-icons/fa';
import useAuth from '../hooks/useAuth';
import { reviewApi, type BackendReview } from '../services/api';
import { getImageUrl } from '../utils/imageUrl';

// Types
interface ReviewStats {
  average: number;
  count: number;
  distribution: { [key: number]: number };
}

function StarRow({
  value,
  onChange,
  readOnly = false,
  size = 'md',
}: {
  value: number;
  onChange?: (next: number) => void;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-xl'
  };

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const active = star <= value;
        const commonClass = active ? 'opacity-100' : 'opacity-30';

        if (readOnly) {
          return (
            <FaStar
              key={star}
              className={`${sizeClasses[size]} ${commonClass}`}
              style={{ color: 'var(--theme-primary)' }}
            />
          );
        }

        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange?.(star)}
            className="transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-300 rounded-full"
            aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
          >
            <FaStar
              className={`${sizeClasses[size]} ${commonClass}`}
              style={{ color: 'var(--theme-primary)' }}
            />
          </button>
        );
      })}
    </div>
  );
}

function ReviewAvatar({ row }: { row: BackendReview }) {
  const [imgError, setImgError] = useState(false);
  const name = row.userName?.trim() || 'Anonymous User';
  const hasImage = Boolean(row.userPhotoURL) && !imgError;

  if (hasImage) {
    return (
      <img
        src={getImageUrl(row.userPhotoURL)}
        alt={name}
        className="h-11 w-11 rounded-full object-cover border-2 border-slate-100"
        onError={() => setImgError(true)}
        loading="lazy"
      />
    );
  }

  // Consistent fallback with fixed dimensions
  return (
    <div
      className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold text-white shadow-sm"
      style={{ backgroundColor: 'var(--theme-primary)' }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function ReviewForm({
  onSubmit,
  isSubmitting,
  error,
  success
}: {
  onSubmit: (rating: number, comment: string) => Promise<void>;
  isSubmitting: boolean;
  error: string;
  success: string;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    // Enhanced validation
    const trimmedComment = comment.trim();
    if (!trimmedComment) {
      setLocalError('Please write a comment');
      return;
    }
    if (trimmedComment.length < 10) {
      setLocalError('Comment must be at least 10 characters');
      return;
    }
    if (trimmedComment.length > 500) {
      setLocalError('Comment must be less than 500 characters');
      return;
    }
    if (rating < 1 || rating > 5) {
      setLocalError('Please select a rating between 1 and 5');
      return;
    }

    await onSubmit(rating, trimmedComment);
    if (!error) {
      setComment('');
      setRating(5);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="mb-2 text-sm font-semibold text-slate-800">Write your review</p>
      <div className="mb-3">
        <StarRow value={rating} onChange={setRating} size="md" />
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share your experience... (minimum 10 characters)"
        rows={3}
        maxLength={500}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200 resize-none"
        disabled={isSubmitting}
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="min-h-[20px] text-xs">
          {localError || error ? (
            <span className="text-red-600" role="alert">{localError || error}</span>
          ) : null}
          {!localError && !error && success ? (
            <span className="text-green-600" role="status">{success}</span>
          ) : null}
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-70 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2"
          style={{ backgroundColor: 'var(--theme-primary)' }}
        >
          {isSubmitting ? 'Posting...' : 'Post Review'}
        </button>
      </div>
    </form>
  );
}

export default function ReviewSection() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<BackendReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const abortControllerRef = useRef<AbortController | null>(null);

  // Load reviews with abort controller
  useEffect(() => {
    const controller = new AbortController();
    abortControllerRef.current = controller;

    async function loadReviews() {
      setLoading(true);
      setError('');

      try {
        const response = await reviewApi.getAll(30, { signal: controller.signal });

        if (response.success && Array.isArray(response.data)) {
          setReviews(response.data);
        } else {
          setError('Failed to load reviews');
        }
      } catch (err: any) {
        if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') {
          return; // Ignore abort errors
        }
        console.error('Error loading reviews:', err);
        setError('Unable to load reviews. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    }

    loadReviews();

    return () => {
      controller.abort();
    };
  }, []);

  // Calculate review statistics
  const reviewStats = useMemo<ReviewStats>(() => {
    if (!reviews.length) {
      return { average: 0, count: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
    }

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let total = 0;

    reviews.forEach(review => {
      const rating = Math.min(5, Math.max(1, Number(review.rating) || 0));
      distribution[rating as keyof typeof distribution]++;
      total += rating;
    });

    return {
      average: total / reviews.length,
      count: reviews.length,
      distribution
    };
  }, [reviews]);

  // Check if current user has already reviewed
  const hasUserReviewed = useMemo(() => {
    if (!user?.uid) return false;
    return reviews.some(review => review.userId === user.uid);
  }, [reviews, user?.uid]);

  // Handle review submission
  const handleReviewSubmit = useCallback(async (rating: number, comment: string) => {
    if (!user?.uid || !user?.email) {
      setError('Please sign in to post your review');
      return;
    }

    if (hasUserReviewed) {
      setError('You have already submitted a review');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await reviewApi.create({
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName || user.email.split('@')[0],
        userPhotoURL: user.photoURL || '',
        rating,
        comment: comment.trim(),
      });

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to submit review');
      }

      // Add new review to the list
      setReviews(prev => [response.data as BackendReview, ...prev]);
      setSuccess('Review posted successfully!');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Review submission error:', err);
      setError(err?.message || 'Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [user, hasUserReviewed]);

  // Animation duration with reasonable limits
  const marqueeDuration = useMemo(() => {
    const baseDuration = Math.min(60, Math.max(24, reviews.length * 3));
    return baseDuration;
  }, [reviews.length]);

  // Limit marquee items to prevent performance issues
  const marqueeReviews = useMemo(() => {
    const maxReviews = 50; // Show max 50 reviews in marquee
    const limitedReviews = reviews.slice(0, maxReviews);
    return [...limitedReviews, ...limitedReviews];
  }, [reviews]);

  // Get review ID safely
  const getReviewId = (review: BackendReview, index: number): string => {
    return review.id || review._id || `review-${index}-${review.userId || ''}`;
  };

  if (loading) {
    return (
      <section className="mx-auto mt-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-lg sm:p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--theme-primary)' }}></div>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto mt-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_18px_40px_-22px_rgba(15,23,42,0.5)] sm:p-6">
      <style>{`
        @keyframes reviewMarquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        
        @media (prefers-reduced-motion: reduce) {
          .marquee-animation {
            animation: none !important;
          }
        }
      `}</style>

      {/* Header with stats */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Customer Reviews</h2>
          <p className="text-sm text-slate-600">Real feedback from our users</p>
        </div>
        <div className="rounded-2xl bg-white px-4 py-2 text-right shadow-sm">
          <p className="text-sm text-slate-500">Average Rating</p>
          <p className="text-lg font-semibold text-slate-900">
            {reviewStats.average ? reviewStats.average.toFixed(1) : '0.0'} / 5
          </p>
          <p className="text-xs text-slate-500">
            {reviewStats.count} {reviewStats.count === 1 ? 'review' : 'reviews'}
          </p>
        </div>
      </div>

      {/* Review form for authenticated users */}
      {user ? (
        hasUserReviewed ? (
          <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            You have already submitted a review. Thank you for your feedback!
          </div>
        ) : (
          <ReviewForm
            onSubmit={handleReviewSubmit}
            isSubmitting={submitting}
            error={error}
            success={success}
          />
        )
      ) : (
        <div className="mb-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <span>Want to share your experience? </span>
          <Link
            to="/login"
            className="font-semibold underline hover:opacity-80 transition-opacity"
            style={{ color: 'var(--theme-primary)' }}
          >
            Sign in to write a review
          </Link>
        </div>
      )}

      {/* Reviews display */}
      {error && !submitting ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-center text-sm text-red-600">
          {error}
          <button
            onClick={() => window.location.reload()}
            className="block mx-auto mt-2 text-xs underline"
          >
            Refresh page
          </button>
        </div>
      ) : reviews.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center text-sm text-slate-600">
          No reviews yet. Be the first one to post!
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/60 p-2 sm:p-3">
          <div
            className="flex w-max gap-3 marquee-animation hover:[animation-play-state:paused]"
            style={{
              animation: marqueeReviews.length > 10 ? `reviewMarquee ${marqueeDuration}s linear infinite` : 'none'
            }}
          >
            {marqueeReviews.map((row, index) => (
              <article
                key={getReviewId(row, index)}
                className="w-[270px] flex-shrink-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:w-[320px]"
              >
                <div className="mb-3 flex items-center gap-3">
                  <ReviewAvatar row={row} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {row.userName || 'Anonymous User'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {row.createdAt ? new Date(row.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      }) : 'Recently'}
                    </p>
                  </div>
                </div>
                <div className="mb-2">
                  <StarRow value={Math.min(5, Math.max(1, Number(row.rating) || 0))} readOnly size="sm" />
                </div>
                <p className="line-clamp-4 text-sm leading-relaxed text-slate-700">
                  {row.comment}
                </p>
              </article>
            ))}
          </div>

          {/* Show total reviews count */}
          {reviews.length > 50 && (
            <p className="text-center text-xs text-slate-500 mt-3">
              Showing 50 of {reviews.length} reviews
            </p>
          )}
        </div>
      )}
    </section>
  );
}