import { describe, expect, it } from "vitest";
import { parseMarkdownFile, renderMarkdown } from "../src/lib/markdown";

describe("parseMarkdownFile", () => {
  it("splits a markdown file into stable math cards with merged tags", () => {
    const cards = parseMarkdownFile(
      "calculus.md",
      `---
title: 微积分
tags: [math, calculus]
---

# 微积分

## card
title: 幂函数求导
level: easy
tags: [导数, 基础]

$$
\\frac{d}{dx}x^n = nx^{n-1}
$$

当 $n$ 为常数时成立。

---

## card
title: 链式法则
level: medium
tags: [导数, 复合函数]

$$
\\frac{d}{dx}f(g(x)) = f'(g(x))g'(x)
$$
`,
    );

    expect(cards).toHaveLength(2);
    expect(cards[0]).toMatchObject({
      title: "幂函数求导",
      level: "easy",
      sourceFile: "calculus.md",
      tags: ["math", "calculus", "导数", "基础"],
    });
    expect(cards[0].id).toBe(cards[0].id);
    expect(cards[0].contentHash).toHaveLength(64);
    expect(cards[0].bodyHtml).toContain("katex");
    expect(cards[0].bodyHtml).toContain("当");
    expect(cards[1].title).toBe("链式法则");
  });

  it("uses a fallback title and medium level when metadata is missing", () => {
    const cards = parseMarkdownFile(
      "plain.md",
      `## card

只有正文和 $a^2+b^2=c^2$。
`,
    );

    expect(cards).toHaveLength(1);
    expect(cards[0].title).toBe("Untitled Card");
    expect(cards[0].level).toBe("medium");
    expect(cards[0].tags).toEqual([]);
    expect(cards[0].bodyHtml).toContain("katex");
  });

  it("preserves KaTeX sqrt drawing markup after sanitizing rendered math", () => {
    const html = renderMarkdown(`
$$
x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}
$$
`);

    expect(html).toContain("sqrt");
    expect(html).toContain("<svg");
    expect(html).toContain("<path");
  });
});
