import type { Card, ReviewRating, ReviewState, ReviewSummary, Settings } from "./lib/types";

declare global {
  interface Window {
    formulaMemo: {
      getCards: () => Promise<Card[]>;
      reloadCards: () => Promise<Card[]>;
      getSettings: () => Promise<Settings>;
      updateSettings: (partial: Partial<Settings>) => Promise<Settings>;
      getReviews: () => Promise<Record<string, ReviewState>>;
      getReviewSummary: () => Promise<ReviewSummary>;
      rateCard: (cardId: string, rating: ReviewRating) => Promise<ReviewState>;
      selectNotesDir: () => Promise<string | null>;
      closeWindow: () => Promise<void>;
      setContentClickThrough: (enabled: boolean) => void;
      onCardsChanged: (callback: (cards: Card[]) => void) => () => void;
      onSettingsChanged: (callback: (settings: Settings) => void) => () => void;
      onReviewsChanged: (callback: (reviews: Record<string, ReviewState>) => void) => () => void;
      onReviewSummaryChanged: (callback: (summary: ReviewSummary) => void) => () => void;
    };
  }
}

export {};
