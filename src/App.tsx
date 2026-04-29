import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight, CirclePause, CirclePlay, FolderOpen, RefreshCw, SettingsIcon, X } from "lucide-react";
import { getDueCards } from "./lib/scheduler";
import type { Card, ReviewRating, ReviewState, ReviewSummary, Settings } from "./lib/types";

const fallbackSummary: ReviewSummary = {
  dueCount: 0,
  reviewedTodayCount: 0,
  remainingCount: 0,
};

export function App() {
  const [cards, setCards] = useState<Card[]>([]);
  const [reviews, setReviews] = useState<Record<string, ReviewState>>({});
  const [settings, setSettings] = useState<Settings | null>(null);
  const [summary, setSummary] = useState<ReviewSummary>(fallbackSummary);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const [nextCards, nextSettings, nextReviews, nextSummary] = await Promise.all([
          window.formulaMemo.getCards(),
          window.formulaMemo.getSettings(),
          window.formulaMemo.getReviews(),
          window.formulaMemo.getReviewSummary(),
        ]);

        if (!alive) return;
        setCards(nextCards);
        setSettings(nextSettings);
        setReviews(nextReviews);
        setSummary(nextSummary);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "应用初始化失败");
      }
    }

    if (!window.formulaMemo) {
      setError("Electron preload 未加载，无法读取本地卡片。请重启 npm run dev。");
      return;
    }

    const unsubscribeCards = window.formulaMemo.onCardsChanged((nextCards) => {
      setCards(nextCards);
      setCurrentIndex((index) => Math.min(index, Math.max(0, nextCards.length - 1)));
    });
    const unsubscribeSettings = window.formulaMemo.onSettingsChanged(setSettings);
    const unsubscribeReviews = window.formulaMemo.onReviewsChanged(setReviews);
    const unsubscribeSummary = window.formulaMemo.onReviewSummaryChanged(setSummary);

    load();

    return () => {
      alive = false;
      unsubscribeCards();
      unsubscribeSettings();
      unsubscribeReviews();
      unsubscribeSummary();
    };
  }, []);

  const visibleCards = useMemo(() => {
    if (!settings || settings.rotateMode !== "dueOnly") return cards;
    return getDueCards(cards, reviews);
  }, [cards, reviews, settings]);

  const currentCard = visibleCards[currentIndex] ?? visibleCards[0];

  useEffect(() => {
    setCurrentIndex((index) => Math.min(index, Math.max(0, visibleCards.length - 1)));
  }, [visibleCards.length]);

  useEffect(() => {
    if (!settings?.autoRotate || paused || visibleCards.length <= 1) return;

    const timer = window.setInterval(() => {
      setCurrentIndex((index) => nextIndex(index, visibleCards.length, settings.rotateMode === "random"));
    }, Math.max(5, settings.rotateIntervalSeconds) * 1000);

    return () => window.clearInterval(timer);
  }, [paused, settings?.autoRotate, settings?.rotateIntervalSeconds, settings?.rotateMode, visibleCards.length]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowRight") goNext();
      if (event.key === "ArrowLeft") goPrevious();
      if (event.key === " ") {
        event.preventDefault();
        setPaused((value) => !value);
      }
      if (event.key === "Escape") setShowSettings(false);
      if (event.key.toLowerCase() === "f" && settings) {
        updateSettings({ windowMode: settings.windowMode === "focus" ? "desktop" : "focus" });
      }
      if (["1", "2", "3", "4"].includes(event.key) && currentCard) {
        const ratings: ReviewRating[] = ["again", "hard", "good", "easy"];
        rateCurrentCard(ratings[Number(event.key) - 1]);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  async function updateSettings(partial: Partial<Settings>) {
    const nextSettings = await window.formulaMemo.updateSettings(partial);
    setSettings(nextSettings);
  }

  function goPrevious() {
    setCurrentIndex((index) => (visibleCards.length ? (index - 1 + visibleCards.length) % visibleCards.length : 0));
  }

  function goNext() {
    setCurrentIndex((index) => nextIndex(index, visibleCards.length, settings?.rotateMode === "random"));
  }

  async function reload() {
    setCards(await window.formulaMemo.reloadCards());
  }

  async function rateCurrentCard(rating: ReviewRating) {
    if (!currentCard) return;
    const nextReview = await window.formulaMemo.rateCard(currentCard.id, rating);
    setReviews((value) => ({ ...value, [currentCard.id]: nextReview }));
    goNext();
  }

  function enableContentClickThrough() {
    if (settings?.clickThrough) {
      window.formulaMemo.setContentClickThrough(true);
    }
  }

  function disableContentClickThrough() {
    window.formulaMemo.setContentClickThrough(false);
  }

  async function chooseNotesDir() {
    const selected = await window.formulaMemo.selectNotesDir();
    if (selected) setSettings((value) => (value ? { ...value, notesDir: selected } : value));
  }

  useEffect(() => {
    if (!settings?.clickThrough) {
      window.formulaMemo?.setContentClickThrough(false);
    }

    return () => {
      window.formulaMemo?.setContentClickThrough(false);
    };
  }, [settings?.clickThrough]);

  if (error) {
    return <Shell><div className="empty-state">{error}</div></Shell>;
  }

  if (!settings) {
    return <Shell><div className="empty-state">正在读取卡片...</div></Shell>;
  }

  return (
    <Shell>
      <div className="memo-card" style={{ opacity: settings.opacity }}>
        <header className="card-header drag-region">
          <div className="title-group">
            <span className="eyebrow">{settings.rotateMode === "dueOnly" ? "今日复习" : "Formula Memo"}</span>
            <h1>{currentCard?.title ?? "还没有卡片"}</h1>
          </div>
          <div className="header-actions no-drag">
            <IconButton label="刷新" onClick={reload}><RefreshCw size={16} /></IconButton>
            <IconButton label="设置" onClick={() => setShowSettings((value) => !value)}><SettingsIcon size={16} /></IconButton>
            <IconButton label="隐藏" onClick={() => window.formulaMemo.closeWindow()}><X size={16} /></IconButton>
          </div>
        </header>

        {currentCard ? (
          <>
            <div className="meta-row">
              <span className={`level level-${currentCard.level}`}>{levelLabel(currentCard.level)}</span>
              {currentCard.tags.slice(0, 4).map((tag) => <span className="tag" key={tag}>{tag}</span>)}
              <span className="progress">{currentIndex + 1} / {visibleCards.length}</span>
            </div>

            <main
              className="card-body"
              onMouseEnter={enableContentClickThrough}
              onMouseLeave={disableContentClickThrough}
              dangerouslySetInnerHTML={{ __html: currentCard.bodyHtml }}
            />

            <ReviewButtons onRate={rateCurrentCard} />
          </>
        ) : (
          <div className="empty-state">
            <p>当前文件夹没有可显示的 Markdown 卡片。</p>
            <button className="text-button" onClick={chooseNotesDir}><FolderOpen size={16} />选择文件夹</button>
          </div>
        )}

        <footer className="control-bar no-drag">
          <IconButton label="上一张" onClick={goPrevious}><ChevronLeft size={18} /></IconButton>
          <IconButton label={paused ? "继续" : "暂停"} onClick={() => setPaused((value) => !value)}>
            {paused ? <CirclePlay size={18} /> : <CirclePause size={18} />}
          </IconButton>
          <IconButton label="下一张" onClick={goNext}><ChevronRight size={18} /></IconButton>
          <div className="review-summary">
            <span>到期 {summary.dueCount}</span>
            <span>已复习 {summary.reviewedTodayCount}</span>
            <span>剩余 {summary.remainingCount}</span>
          </div>
        </footer>
      </div>

      {showSettings && (
        <SettingsPanel
          settings={settings}
          onChange={updateSettings}
          onChooseNotesDir={chooseNotesDir}
          onClose={() => setShowSettings(false)}
        />
      )}
    </Shell>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return <div className="app-shell">{children}</div>;
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button className="icon-button" type="button" aria-label={label} title={label} onClick={onClick}>
      {children}
    </button>
  );
}

function ReviewButtons({ onRate }: { onRate: (rating: ReviewRating) => void }) {
  return (
    <div className="review-buttons no-drag" aria-label="复习评分">
      <button type="button" onClick={() => onRate("again")}>忘记</button>
      <button type="button" onClick={() => onRate("hard")}>困难</button>
      <button type="button" onClick={() => onRate("good")}>熟悉</button>
      <button type="button" onClick={() => onRate("easy")}>简单</button>
    </div>
  );
}

function SettingsPanel({
  settings,
  onChange,
  onChooseNotesDir,
  onClose,
}: {
  settings: Settings;
  onChange: (partial: Partial<Settings>) => void;
  onChooseNotesDir: () => void;
  onClose: () => void;
}) {
  return (
    <aside className="settings-panel no-drag" role="dialog" aria-label="设置" onMouseEnter={() => window.formulaMemo.setContentClickThrough(false)}>
      <div className="settings-header">
        <h2>设置</h2>
        <IconButton label="关闭设置" onClick={onClose}><X size={16} /></IconButton>
      </div>

      <label>
        Markdown 文件夹
        <button className="path-button" type="button" onClick={onChooseNotesDir}>
          <FolderOpen size={16} />
          <span>{settings.notesDir}</span>
        </button>
      </label>

      <label>
        透明度
        <input
          type="range"
          min="0.3"
          max="1"
          step="0.01"
          value={settings.opacity}
          onChange={(event) => onChange({ opacity: Number(event.target.value) })}
        />
      </label>

      <label>
        轮播间隔（秒）
        <input
          type="number"
          min="5"
          max="3600"
          value={settings.rotateIntervalSeconds}
          onChange={(event) => onChange({ rotateIntervalSeconds: Number(event.target.value) })}
        />
      </label>

      <label>
        轮播模式
        <select value={settings.rotateMode} onChange={(event) => onChange({ rotateMode: event.target.value as Settings["rotateMode"] })}>
          <option value="sequential">顺序</option>
          <option value="random">随机</option>
          <option value="dueOnly">只看今日到期</option>
        </select>
      </label>

      <div className="toggle-grid">
        <Toggle label="自动轮播" checked={settings.autoRotate} onChange={(autoRotate) => onChange({ autoRotate })} />
        <Toggle label="窗口置顶" checked={settings.alwaysOnTop} onChange={(alwaysOnTop) => onChange({ alwaysOnTop })} />
        <Toggle label="正文穿透" checked={settings.clickThrough} onChange={(clickThrough) => onChange({ clickThrough })} />
        <Toggle label="开机自启" checked={settings.launchAtStartup} onChange={(launchAtStartup) => onChange({ launchAtStartup })} />
      </div>
      <p className="settings-note">正文穿透只作用于卡片正文区域，顶部按钮、复习按钮和设置面板仍可点击。</p>
    </aside>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

function nextIndex(current: number, length: number, random = false) {
  if (length <= 1) return 0;
  if (!random) return (current + 1) % length;
  const next = Math.floor(Math.random() * length);
  return next === current ? (next + 1) % length : next;
}

function levelLabel(level: string) {
  if (level === "easy") return "简单";
  if (level === "hard") return "困难";
  return "中等";
}
