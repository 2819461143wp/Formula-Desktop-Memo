export type CardLevel = "easy" | "medium" | "hard";

export type ReviewRating = "again" | "hard" | "good" | "easy";

export type RotateMode = "sequential" | "random" | "dueOnly";

export type WindowMode = "desktop" | "floating" | "focus";

export type ThemeMode = "dark" | "light" | "auto";

export type Card = {
  id: string;
  title: string;
  bodyMarkdown: string;
  bodyHtml: string;
  sourceFile: string;
  tags: string[];
  level: CardLevel;
  createdAt?: string;
  updatedAt?: string;
  contentHash: string;
};

export type ReviewState = {
  cardId: string;
  ease: number;
  intervalDays: number;
  dueDate: string;
  reviewCount: number;
  lastReviewedAt?: string;
};

export type Settings = {
  notesDir: string;
  windowMode: WindowMode;
  opacity: number;
  autoRotate: boolean;
  rotateIntervalSeconds: number;
  rotateMode: RotateMode;
  theme: ThemeMode;
  alwaysOnTop: boolean;
  clickThrough: boolean;
  launchAtStartup: boolean;
  position: {
    x: number;
    y: number;
  };
  size: {
    width: number;
    height: number;
  };
};

export type ReviewSummary = {
  dueCount: number;
  reviewedTodayCount: number;
  remainingCount: number;
};
