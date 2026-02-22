import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaStar } from 'react-icons/fa';
import useAuth from '../hooks/useAuth';
import { reviewApi, type BackendReview } from '../services/api';

function StarRow({
  value,
  onChange,
  readOnly = false,
}: {
  value: number;
  onChange?: (next: number) => void;
  readOnly?: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const active = star <= value;
        const commonClass = active ? 'opacity-100' : 'opacity-30';
        if (readOnly) {
          return (
            <FaStar
              key={star}
              className={`text-sm ${commonClass}`}
              style={{ color: 'var(--theme-primary)' }}
            />
          );
        }
        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange?.(star)}
            className="transition-transform hover:scale-110"
            aria-label={`Set rating ${star}`}
          >
            <FaStar
              className={`text-lg ${commonClass}`}
              style={{ color: 'var(--theme-primary)' }}
            />
          </button>
        );
      })}
    </div>
  );
}

function ReviewAvatar({ row }: { row: BackendReview }) {
  const name = row.userName || 'User';
  const hasImage = Boolean(row.userPhotoURL);
  if (hasImage) {
    return (
      <img
        src={row.userPhotoURL}
        alt={name}
        className="h-11 w-11 rounded-full object-cover border border-slate-200"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
    );
  }

  return (
    <div
      className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold text-white"
      style={{ backgroundColor: 'var(--theme-primary)' }}
    >
      {name.trim().charAt(0).toUpperCase() || 'U'}
    </div>
  );
}

export default function ReviewSection() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<BackendReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [successText, setSuccessText] = useState('');

  useEffect(() => {
    let ignore = false;

    async function loadReviews() {
      setLoading(true);
      try {
        const response = await reviewApi.getAll(30);
        if (!ignore && response.success && Array.isArray(response.data)) {
          setReviews(response.data);
        }
      } catch (_error) {
        if (!ignore) {
          setErrorText('Failed to load reviews right now.');
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadReviews();
    return () => {
      ignore = true;
    };
  }, []);

  const reviewStats = useMemo(() => {
    if (!reviews.length) return { average: 0, count: 0 };
    const total = reviews.reduce((sum, item) => sum + (Number(item.rating) || 0), 0);
    return {
      average: total / reviews.length,
      count: reviews.length,
    };
  }, [reviews]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorText('');
    setSuccessText('');

    if (!user?.uid || !user?.email) {
      setErrorText('Please sign in to post your review.');
      return;
    }

    const trimmedComment = comment.trim();
    if (!trimmedComment) {
      setErrorText('Please write a short comment before submit.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await reviewApi.create({
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName || user.email.split('@')[0],
        userPhotoURL: user.photoURL || '',
        rating,
        comment: trimmedComment,
      });

      if (!response.success || !response.data) {
        setErrorText(response.message || 'Failed to submit review.');
        return;
      }

      setReviews((prev) => [response.data as BackendReview, ...prev]);
      setComment('');
      setRating(5);
      setSuccessText('Review posted successfully.');
    } catch (error: any) {
      setErrorText(error?.message || 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mx-auto mt-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_18px_40px_-22px_rgba(15,23,42,0.5)] sm:p-6">
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
          <p className="text-xs text-slate-500">{reviewStats.count} review(s)</p>
        </div>
      </div>

      {user ? (
        <form onSubmit={handleSubmit} className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="mb-2 text-sm font-semibold text-slate-800">Write your review</p>
          <div className="mb-3">
            <StarRow value={rating} onChange={setRating} />
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience..."
            rows={3}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <div className="min-h-[20px] text-xs">
              {errorText ? <span className="text-red-600">{errorText}</span> : null}
              {!errorText && successText ? <span style={{ color: 'var(--theme-primary)' }}>{successText}</span> : null}
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-70"
              style={{ backgroundColor: 'var(--theme-primary)' }}
            >
              {submitting ? 'Posting...' : 'Post Review'}
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <span>Want to share your experience? </span>
          <Link to="/login" className="font-semibold underline" style={{ color: 'var(--theme-primary)' }}>
            Sign in to write a review
          </Link>
        </div>
      )}

      {loading ? (
        <div className="py-4 text-sm text-slate-500">Loading reviews...</div>
      ) : reviews.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center text-sm text-slate-600">
          No reviews yet. Be the first one to post.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {reviews.map((row) => (
            <article key={row.id || row._id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-3">
                <ReviewAvatar row={row} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{row.userName || 'User'}</p>
                  <p className="text-xs text-slate-500">
                    {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : 'Today'}
                  </p>
                </div>
              </div>
              <div className="mb-2">
                <StarRow value={Number(row.rating) || 0} readOnly />
              </div>
              <p className="text-sm leading-relaxed text-slate-700">{row.comment}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

