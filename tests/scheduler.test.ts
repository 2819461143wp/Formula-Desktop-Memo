import { describe, expect, it } from "vitest";
import { applyReviewRating, getDueCards } from "../src/lib/scheduler";
import type { Card, ReviewState } from "../src/lib/types";

describe("applyReviewRating", () => {
  const today = "2026-04-26";

  it("keeps forgotten cards due today and lowers ease", () => {
    const result = applyReviewRating(
      { cardId: "a", ease: 2.5, intervalDays: 10, dueDate: today, reviewCount: 4 },
      "again",
      today,
    );

    expect(result).toMatchObject({
      cardId: "a",
      ease: 2.3,
      intervalDays: 0,
      dueDate: today,
      reviewCount: 5,
      lastReviewedAt: today,
    });
  });

  it("schedules first and second good reviews to 1 and 3 days", () => {
    const first = applyReviewRating(
      { cardId: "a", ease: 2.5, intervalDays: 0, dueDate: today, reviewCount: 0 },
      "good",
      today,
    );
    const second = applyReviewRating(first, "good", today);

    expect(first.intervalDays).toBe(1);
    expect(first.dueDate).toBe("2026-04-27");
    expect(second.intervalDays).toBe(3);
    expect(second.dueDate).toBe("2026-04-29");
  });

  it("returns cards whose due date is today or earlier", () => {
    const cards: Card[] = [
      makeCard("due-yesterday"),
      makeCard("due-today"),
      makeCard("future"),
      makeCard("new-card"),
    ];
    const reviews: Record<string, ReviewState> = {
      "due-yesterday": makeReview("due-yesterday", "2026-04-25"),
      "due-today": makeReview("due-today", "2026-04-26"),
      future: makeReview("future", "2026-04-27"),
    };

    expect(getDueCards(cards, reviews, today).map((card) => card.id)).toEqual([
      "due-yesterday",
      "due-today",
      "new-card",
    ]);
  });
});

function makeCard(id: string): Card {
  return {
    id,
    title: id,
    bodyMarkdown: "body",
    bodyHtml: "<p>body</p>",
    sourceFile: "sample.md",
    tags: [],
    level: "medium",
    contentHash: id.padEnd(64, "0"),
  };
}

function makeReview(cardId: string, dueDate: string): ReviewState {
  return {
    cardId,
    ease: 2.5,
    intervalDays: 1,
    dueDate,
    reviewCount: 1,
  };
}
