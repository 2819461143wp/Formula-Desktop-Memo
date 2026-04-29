export type Rectangle = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const DEFAULT_MARGIN = 32;

export function ensureWindowBoundsVisible(
  bounds: Rectangle,
  workAreas: Rectangle[],
  margin = DEFAULT_MARGIN,
): Rectangle {
  const targetArea = chooseWorkArea(bounds, workAreas);
  if (!targetArea) return bounds;

  const width = Math.min(bounds.width, Math.max(240, targetArea.width - margin * 2));
  const height = Math.min(bounds.height, Math.max(180, targetArea.height - margin * 2));

  const minX = targetArea.x + margin;
  const minY = targetArea.y + margin;
  const maxX = targetArea.x + targetArea.width - width - margin;
  const maxY = targetArea.y + targetArea.height - height - margin;

  return {
    x: clamp(bounds.x, minX, Math.max(minX, maxX)),
    y: clamp(bounds.y, minY, Math.max(minY, maxY)),
    width,
    height,
  };
}

function chooseWorkArea(bounds: Rectangle, workAreas: Rectangle[]): Rectangle | null {
  if (workAreas.length === 0) return null;

  return workAreas
    .map((area) => ({
      area,
      overlap: overlapArea(bounds, area),
    }))
    .sort((a, b) => b.overlap - a.overlap)[0].area;
}

function overlapArea(a: Rectangle, b: Rectangle): number {
  const left = Math.max(a.x, b.x);
  const right = Math.min(a.x + a.width, b.x + b.width);
  const top = Math.max(a.y, b.y);
  const bottom = Math.min(a.y + a.height, b.y + b.height);

  return Math.max(0, right - left) * Math.max(0, bottom - top);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
