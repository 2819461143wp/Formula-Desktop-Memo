import { contextBridge, ipcRenderer } from "electron";
import type { Card, ReviewRating, ReviewState, ReviewSummary, Settings } from "../src/lib/types";

const api = {
  getCards: (): Promise<Card[]> => ipcRenderer.invoke("cards:get"),
  reloadCards: (): Promise<Card[]> => ipcRenderer.invoke("cards:reload"),
  getSettings: (): Promise<Settings> => ipcRenderer.invoke("settings:get"),
  updateSettings: (partial: Partial<Settings>): Promise<Settings> => ipcRenderer.invoke("settings:update", partial),
  getReviews: (): Promise<Record<string, ReviewState>> => ipcRenderer.invoke("reviews:get"),
  getReviewSummary: (): Promise<ReviewSummary> => ipcRenderer.invoke("reviews:summary"),
  rateCard: (cardId: string, rating: ReviewRating): Promise<ReviewState> =>
    ipcRenderer.invoke("reviews:rate", cardId, rating),
  selectNotesDir: (): Promise<string | null> => ipcRenderer.invoke("notes:select-dir"),
  closeWindow: (): Promise<void> => ipcRenderer.invoke("window:close"),
  setContentClickThrough: (enabled: boolean): void =>
    ipcRenderer.send("window:set-content-click-through", enabled),
  onCardsChanged: (callback: (cards: Card[]) => void) => subscribe("cards:changed", callback),
  onSettingsChanged: (callback: (settings: Settings) => void) => subscribe("settings:changed", callback),
  onReviewsChanged: (callback: (reviews: Record<string, ReviewState>) => void) => subscribe("reviews:changed", callback),
  onReviewSummaryChanged: (callback: (summary: ReviewSummary) => void) => subscribe("reviews:summary-changed", callback),
};

contextBridge.exposeInMainWorld("formulaMemo", api);

function subscribe<T>(channel: string, callback: (payload: T) => void) {
  const listener = (_event: Electron.IpcRendererEvent, payload: T) => callback(payload);
  ipcRenderer.on(channel, listener);
  return () => ipcRenderer.off(channel, listener);
}
