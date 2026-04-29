import dayjs from "dayjs";
import type { Card, ReviewRating, ReviewState } from "./types";

export function createInitialReviewState(cardId: string, today = dayjs().format("YYYY-MM-DD")): ReviewState {
  return {
    cardId,
    ease: 2.5,
    intervalDays: 0,
    dueDate: today,
    reviewCount: 0,
  };
}

export function applyReviewRating(
  previous: ReviewState,
  rating: ReviewRating,
  today = dayjs().format("YYYY-MM-DD"),
): ReviewState {
  const ease = normalizeEase(previous.ease);
  let nextEase = ease;
  let intervalDays = previous.intervalDays;

  if (rating === "again") {
    intervalDays = 0;
    nextEase = Math.max(1.3, roundEase(ease - 0.2));
  }

  if (rating === "hard") {
    intervalDays = Math.max(1, Math.round(previous.intervalDays * 1.2));
    nextEase = Math.max(1.3, roundEase(ease - 0.15));
  }

  if (rating === "good") {
    if (previous.reviewCount === 0) {
      intervalDays = 1;
    } else if (previous.reviewCount === 1) {
      intervalDays = 3;
    } else {
      intervalDays = Math.max(1, Math.round(previous.intervalDays * ease));
    }
  }

  if (rating === "easy") {
    intervalDays = Math.max(3, Math.round(previous.intervalDays * ease * 1.5));
    nextEase = roundEase(ease + 0.15);
  }

  return {
    ...previous,
    ease: nextEase,
    intervalDays,
    dueDate: dayjs(today).add(intervalDays, "day").format("YYYY-MM-DD"),
    reviewCount: previous.reviewCount + 1,
    lastReviewedAt: today,
  };
}

export function getDueCards(cards: Card[], reviews: Record<string, ReviewState>, today = dayjs().format("YYYY-MM-DD")): Card[] {
  return cards.filter((card) => {
    const review = reviews[card.id];
    return !review || dayjs(review.dueDate).isSame(today) || dayjs(review.dueDate).isBefore(today);
  });
}

export function summarizeReviews(
  cards: Card[],
  reviews: Record<string, ReviewState>,
  today = dayjs().format("YYYY-MM-DD"),
) {
  const dueCards = getDueCards(cards, reviews, today);
  const reviewedTodayCount = cards.filter((card) => reviews[card.id]?.lastReviewedAt === today).length;

  return {
    dueCount: dueCards.length,
    reviewedTodayCount,
    remainingCount: Math.max(0, dueCards.length - reviewedTodayCount),
  };
}

function normalizeEase(ease: number): number {
  return Number.isFinite(ease) ? ease : 2.5;
}

function roundEase(ease: number): number {
  return Math.round(ease * 100) / 100;
}
