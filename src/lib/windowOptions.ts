import type { Settings } from "./types";
import type { Rectangle } from "./windowBounds";

export type MemoWindowOptions = {
  width: number;
  height: number;
  x: number;
  y: number;
  frame: boolean;
  transparent: boolean;
  show: boolean;
  resizable: boolean;
  skipTaskbar: boolean;
  alwaysOnTop: boolean;
  hasShadow: boolean;
  opacity: number;
  backgroundColor: string;
};

export function createMemoWindowOptions(settings: Settings, bounds = settingsToBounds(settings)): MemoWindowOptions {
  return {
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y,
    frame: false,
    transparent: false,
    show: true,
    resizable: true,
    skipTaskbar: false,
    alwaysOnTop: settings.alwaysOnTop || settings.windowMode === "floating",
    hasShadow: true,
    opacity: settings.opacity,
    backgroundColor: "#1f232b",
  };
}

function settingsToBounds(settings: Settings): Rectangle {
  return {
    x: settings.position.x,
    y: settings.position.y,
    width: settings.size.width,
    height: settings.size.height,
  };
}
