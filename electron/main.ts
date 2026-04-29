import { app, BrowserWindow, dialog, globalShortcut, ipcMain, Menu, nativeImage, screen, Tray } from "electron";
import chokidar, { type FSWatcher } from "chokidar";
import fs from "node:fs";
import path from "node:path";
import { parseMarkdownFile } from "../src/lib/markdown";
import { applyReviewRating, createInitialReviewState, getDueCards, summarizeReviews } from "../src/lib/scheduler";
import type { Card, ReviewRating, ReviewState, Settings } from "../src/lib/types";
import { ensureWindowBoundsVisible } from "../src/lib/windowBounds";
import { createMemoWindowOptions } from "../src/lib/windowOptions";
import { CLICK_THROUGH_TOGGLE_ACCELERATOR } from "../src/lib/settingsSafety";

const isDev = Boolean(process.env.VITE_DEV_SERVER_URL);
const projectRoot = process.cwd();

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let watcher: FSWatcher | null = null;
let cards: Card[] = [];
let settings: Settings;
let reviews: Record<string, ReviewState> = {};
let reloadTimer: NodeJS.Timeout | null = null;

const dataDir = isDev ? path.join(projectRoot, "data") : path.join(app.getPath("userData"), "data");
const settingsPath = path.join(dataDir, "settings.json");
const reviewsPath = path.join(dataDir, "reviews.json");
const defaultNotesDir = isDev ? path.join(projectRoot, "notes") : path.join(dataDir, "notes");

const defaultSettings: Settings = {
  notesDir: defaultNotesDir,
  windowMode: "desktop",
  opacity: 0.82,
  autoRotate: true,
  rotateIntervalSeconds: 60,
  rotateMode: "sequential",
  theme: "dark",
  alwaysOnTop: false,
  clickThrough: false,
  launchAtStartup: false,
  position: {
    x: 80,
    y: 80,
  },
  size: {
    width: 420,
    height: 260,
  },
};

app.whenReady().then(() => {
  ensureDataFiles();
  settings = readJson(settingsPath, defaultSettings);
  reviews = readJson(reviewsPath, {});
  createWindow();
  createTray();
  registerShortcuts();
  setupIpc();
  reloadCards();
  startWatcher(settings.notesDir);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("before-quit", () => {
  globalShortcut.unregisterAll();
  saveWindowBounds();
  watcher?.close();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

function createWindow() {
  const safeBounds = ensureWindowBoundsVisible(
    {
      x: settings.position.x,
      y: settings.position.y,
      width: settings.size.width,
      height: settings.size.height,
    },
    screen.getAllDisplays().map((display) => display.workArea),
  );

  settings = {
    ...settings,
    position: {
      x: safeBounds.x,
      y: safeBounds.y,
    },
    size: {
      width: safeBounds.width,
      height: safeBounds.height,
    },
  };
  writeJson(settingsPath, settings);

  mainWindow = new BrowserWindow({
    ...createMemoWindowOptions(settings, safeBounds),
    icon: getAppIconPath(),
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
    mainWindow?.focus();
  });

  mainWindow.on("moved", saveWindowBounds);
  mainWindow.on("resized", saveWindowBounds);

  if (isDev) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL!);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

function createTray() {
  const icon = nativeImage.createFromPath(getAppIconPath());
  tray = new Tray(icon);
  tray.setToolTip("Formula Desktop Memo");
  updateTrayMenu();
}

function getAppIconPath() {
  return isDev ? path.join(projectRoot, "build", "icon.ico") : path.join(process.resourcesPath, "build", "icon.ico");
}

function updateTrayMenu() {
  if (!tray) return;
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: "显示窗口", click: showWindowForInteraction },
      { label: "隐藏窗口", click: () => mainWindow?.hide() },
      {
        label: settings.clickThrough ? "关闭卡片正文穿透" : "开启卡片正文穿透",
        click: () => updateSettings({ clickThrough: !settings.clickThrough }),
      },
      {
        label: `快捷键：${CLICK_THROUGH_TOGGLE_ACCELERATOR}`,
        enabled: false,
      },
      { type: "separator" },
      { label: "退出", click: () => app.quit() },
    ]),
  );
}

function registerShortcuts() {
  globalShortcut.register(CLICK_THROUGH_TOGGLE_ACCELERATOR, () => {
    updateSettings({ clickThrough: !settings.clickThrough });
    if (!settings.clickThrough) {
      showWindowForInteraction();
    }
  });
}

function setupIpc() {
  ipcMain.handle("cards:get", () => cards);
  ipcMain.handle("cards:reload", () => reloadCards());
  ipcMain.handle("settings:get", () => settings);
  ipcMain.handle("settings:update", (_, partial: Partial<Settings>) => updateSettings(partial));
  ipcMain.handle("reviews:get", () => reviews);
  ipcMain.handle("reviews:summary", () => summarizeReviews(cards, reviews));
  ipcMain.handle("reviews:rate", (_, cardId: string, rating: ReviewRating) => rateCard(cardId, rating));
  ipcMain.handle("notes:select-dir", selectNotesDir);
  ipcMain.handle("window:close", () => mainWindow?.hide());
  ipcMain.on("window:set-content-click-through", (event, enabled: boolean) => {
    const sourceWindow = BrowserWindow.fromWebContents(event.sender);
    sourceWindow?.setIgnoreMouseEvents(enabled, enabled ? { forward: true } : undefined);
  });
}

function updateSettings(partial: Partial<Settings>): Settings {
  const previousNotesDir = settings.notesDir;
  settings = {
    ...settings,
    ...partial,
    position: { ...settings.position, ...partial.position },
    size: { ...settings.size, ...partial.size },
  };

  writeJson(settingsPath, settings);
  applyWindowSettings();
  updateTrayMenu();
  syncAutoLaunch();

  if (previousNotesDir !== settings.notesDir) {
    startWatcher(settings.notesDir);
    reloadCards();
  }

  mainWindow?.webContents.send("settings:changed", settings);
  return settings;
}

function applyWindowSettings() {
  if (!mainWindow) return;
  mainWindow.setOpacity(settings.opacity);
  mainWindow.setAlwaysOnTop(settings.alwaysOnTop || settings.windowMode === "floating");

  if (settings.windowMode === "focus") {
    mainWindow.setSize(Math.max(settings.size.width, 720), Math.max(settings.size.height, 460));
    mainWindow.center();
  }
}

function showWindowForInteraction() {
  if (settings.clickThrough) {
    updateSettings({ clickThrough: false });
  }
  mainWindow?.show();
  mainWindow?.focus();
}

function syncAutoLaunch() {
  app.setLoginItemSettings({
    openAtLogin: settings.launchAtStartup,
    path: process.execPath,
  });
}

function saveWindowBounds() {
  if (!mainWindow || !settings) return;
  const bounds = mainWindow.getBounds();
  settings = {
    ...settings,
    position: {
      x: bounds.x,
      y: bounds.y,
    },
    size: {
      width: bounds.width,
      height: bounds.height,
    },
  };
  writeJson(settingsPath, settings);
}

function startWatcher(notesDir: string) {
  watcher?.close();
  if (!fs.existsSync(notesDir)) return;

  watcher = chokidar.watch(path.join(notesDir, "**/*.md"), {
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 250,
      pollInterval: 50,
    },
  });

  watcher.on("add", queueReload);
  watcher.on("change", queueReload);
  watcher.on("unlink", queueReload);
}

function queueReload() {
  if (reloadTimer) clearTimeout(reloadTimer);
  reloadTimer = setTimeout(() => {
    reloadCards();
  }, 300);
}

function reloadCards(): Card[] {
  cards = readCardsFromDirectory(settings.notesDir);
  mainWindow?.webContents.send("cards:changed", cards);
  mainWindow?.webContents.send("reviews:summary-changed", summarizeReviews(cards, reviews));
  return cards;
}

function readCardsFromDirectory(notesDir: string): Card[] {
  if (!fs.existsSync(notesDir)) return [];

  return walkMarkdownFiles(notesDir).flatMap((filePath) => {
    try {
      const raw = fs.readFileSync(filePath, "utf8");
      const relativePath = path.relative(notesDir, filePath).replaceAll("\\", "/");
      return parseMarkdownFile(relativePath, raw);
    } catch (error) {
      console.error(`Failed to parse markdown file: ${filePath}`, error);
      return [];
    }
  });
}

function walkMarkdownFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walkMarkdownFiles(fullPath);
    return entry.isFile() && entry.name.toLowerCase().endsWith(".md") ? [fullPath] : [];
  });
}

function rateCard(cardId: string, rating: ReviewRating): ReviewState {
  const previous = reviews[cardId] ?? createInitialReviewState(cardId);
  const next = applyReviewRating(previous, rating);
  reviews = { ...reviews, [cardId]: next };
  writeJson(reviewsPath, reviews);
  mainWindow?.webContents.send("reviews:changed", reviews);
  mainWindow?.webContents.send("reviews:summary-changed", summarizeReviews(cards, reviews));

  const dueCards = getDueCards(cards, reviews);
  mainWindow?.webContents.send("cards:due-changed", dueCards.map((card) => card.id));
  return next;
}

async function selectNotesDir(): Promise<string | null> {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    title: "选择 Markdown 文件夹",
    properties: ["openDirectory"],
    defaultPath: settings.notesDir,
  });

  if (result.canceled || result.filePaths.length === 0) return null;
  updateSettings({ notesDir: result.filePaths[0] });
  return result.filePaths[0];
}

function ensureDataFiles() {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.mkdirSync(defaultNotesDir, { recursive: true });
  ensureSampleNote();
  if (!fs.existsSync(settingsPath)) writeJson(settingsPath, defaultSettings);
  if (!fs.existsSync(reviewsPath)) writeJson(reviewsPath, {});
}

function ensureSampleNote() {
  const targetPath = path.join(defaultNotesDir, "sample.md");
  if (fs.existsSync(targetPath)) return;

  const bundledSamplePath = isDev
    ? path.join(projectRoot, "notes", "sample.md")
    : path.join(process.resourcesPath, "sample-notes", "sample.md");

  if (fs.existsSync(bundledSamplePath)) {
    fs.copyFileSync(bundledSamplePath, targetPath);
    return;
  }

  fs.writeFileSync(
    targetPath,
    `---
title: 数学公式记忆
tags: [math]
---

## card
title: 勾股定理
level: easy
tags: [几何, 基础]

$$
a^2 + b^2 = c^2
$$

直角三角形中，两条直角边平方和等于斜边平方。
`,
    "utf8",
  );
}

function readJson<T>(filePath: string, fallback: T): T {
  try {
    return {
      ...fallback,
      ...JSON.parse(fs.readFileSync(filePath, "utf8")),
    };
  } catch {
    return fallback;
  }
}

function writeJson(filePath: string, value: unknown) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}
