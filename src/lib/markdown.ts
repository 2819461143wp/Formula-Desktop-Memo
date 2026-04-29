import crypto from "node:crypto";
import matter from "gray-matter";
import katex from "katex";
import { marked } from "marked";
import sanitizeHtml from "sanitize-html";
import type { Card, CardLevel } from "./types";

type CardMeta = {
  title: string;
  level: CardLevel;
  tags: string[];
};

const CARD_MARKER = /^##\s+card\s*$/gim;
const VALID_LEVELS = new Set<CardLevel>(["easy", "medium", "hard"]);

export function parseMarkdownFile(sourceFile: string, rawMarkdown: string): Card[] {
  const parsed = matter(rawMarkdown);
  const fileTags = normalizeTags(parsed.data.tags);
  const sections = splitCardSections(parsed.content);

  return sections.map((section, index) => {
    const { meta, bodyMarkdown } = parseCardSection(section);
    const tags = unique([...fileTags, ...meta.tags]);
    const title = meta.title || `Untitled Card${sections.length > 1 ? ` ${index + 1}` : ""}`;

    return {
      id: hash(`${sourceFile}::${title}`),
      title,
      bodyMarkdown,
      bodyHtml: renderMarkdown(bodyMarkdown),
      sourceFile,
      tags,
      level: meta.level,
      contentHash: hash(bodyMarkdown),
    };
  });
}

export function renderMarkdown(markdown: string): string {
  const mathBlocks: string[] = [];
  const withBlockMath = markdown.replace(/\$\$([\s\S]+?)\$\$/g, (_, formula: string) => {
    const token = `@@MATH_BLOCK_${mathBlocks.length}@@`;
    mathBlocks.push(renderKatex(formula, true));
    return token;
  });

  const inlineMath: string[] = [];
  const withInlineMath = withBlockMath.replace(/(?<!\$)\$([^$\n]+?)\$(?!\$)/g, (_, formula: string) => {
    const token = `@@MATH_INLINE_${inlineMath.length}@@`;
    inlineMath.push(renderKatex(formula, false));
    return token;
  });

  let html = marked.parse(withInlineMath, { async: false }) as string;
  mathBlocks.forEach((rendered, index) => {
    html = html.replace(`<p>@@MATH_BLOCK_${index}@@</p>`, rendered).replace(`@@MATH_BLOCK_${index}@@`, rendered);
  });
  inlineMath.forEach((rendered, index) => {
    html = html.replace(`@@MATH_INLINE_${index}@@`, rendered);
  });

  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      "span",
      "svg",
      "path",
      "math",
      "semantics",
      "annotation",
      "mrow",
      "mi",
      "mn",
      "mo",
      "msup",
      "msub",
      "msubsup",
      "mfrac",
      "msqrt",
      "mtable",
      "mtr",
      "mtd",
      "mtext",
      "annotation-xml",
    ]),
    allowedAttributes: {
      "*": ["class", "style", "aria-hidden", "aria-label", "role"],
      a: ["href", "name", "target", "rel"],
      svg: ["width", "height", "viewBox", "viewbox", "preserveAspectRatio", "preserveaspectratio", "xmlns"],
      path: ["d"],
      annotation: ["encoding"],
    },
    allowedSchemes: ["http", "https", "mailto"],
  });
}

function splitCardSections(markdown: string): string[] {
  const matches = [...markdown.matchAll(CARD_MARKER)];
  if (matches.length === 0) {
    const trimmed = markdown.trim();
    return trimmed ? [trimmed] : [];
  }

  return matches
    .map((match, index) => {
      const start = (match.index ?? 0) + match[0].length;
      const end = index + 1 < matches.length ? matches[index + 1].index ?? markdown.length : markdown.length;
      return markdown.slice(start, end).replace(/^---\s*$/gm, "").trim();
    })
    .filter(Boolean);
}

function parseCardSection(section: string): { meta: CardMeta; bodyMarkdown: string } {
  const lines = section.replace(/\r\n/g, "\n").split("\n");
  const metaLines: string[] = [];
  let bodyStart = 0;

  for (const line of lines) {
    if (/^\s*$/.test(line)) {
      bodyStart += 1;
      break;
    }
    if (/^[A-Za-z][A-Za-z0-9_-]*\s*:/.test(line)) {
      metaLines.push(line);
      bodyStart += 1;
      continue;
    }
    break;
  }

  const rawMeta = parseInlineMeta(metaLines);
  const title = typeof rawMeta.title === "string" && rawMeta.title.trim() ? rawMeta.title.trim() : "Untitled Card";
  const level = VALID_LEVELS.has(rawMeta.level as CardLevel) ? (rawMeta.level as CardLevel) : "medium";
  const tags = normalizeTags(rawMeta.tags);

  return {
    meta: { title, level, tags },
    bodyMarkdown: lines.slice(bodyStart).join("\n").trim(),
  };
}

function parseInlineMeta(lines: string[]): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  lines.forEach((line) => {
    const separatorIndex = line.indexOf(":");
    if (separatorIndex === -1) return;

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    result[key] = parseMetaValue(value);
  });

  return result;
}

function parseMetaValue(value: string): unknown {
  if (value.startsWith("[") && value.endsWith("]")) {
    return value
      .slice(1, -1)
      .split(",")
      .map((item) => item.trim().replace(/^["']|["']$/g, ""))
      .filter(Boolean);
  }

  return value.replace(/^["']|["']$/g, "");
}

function renderKatex(formula: string, displayMode: boolean): string {
  try {
    return katex.renderToString(formula.trim(), {
      displayMode,
      throwOnError: false,
      strict: "ignore",
    });
  } catch (error) {
    return `<code class="math-error">${escapeHtml(formula.trim())}</code>`;
  }
}

function normalizeTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];
  return tags.map((tag) => String(tag).trim()).filter(Boolean);
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function hash(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
