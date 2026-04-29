# Formula Desktop Memo

一个运行在 Windows 11 上的桌面悬浮记忆卡片工具，用本地 Markdown 文件展示数学公式、定义、推导和每日复习内容。

## 功能

- Electron 桌面悬浮窗口
- Markdown 卡片解析
- KaTeX 数学公式渲染
- 自动轮播和手动切换
- 忘记 / 困难 / 熟悉 / 简单复习评分
- 简化间隔重复算法
- 本地 `settings.json` 和 `reviews.json`
- 监听 `notes/` 文件夹，保存 Markdown 后自动刷新
- 可调透明度、置顶、点击穿透、开机自启

## 开发运行

```powershell
npm install --registry=https://registry.npmjs.org
npm run dev
```

如果 Electron 下载 GitHub 二进制失败，可以使用镜像：

```powershell
$env:ELECTRON_MIRROR='https://npmmirror.com/mirrors/electron/'
npm install --registry=https://registry.npmjs.org
```

## 常用命令

```powershell
npm run test:unit
npm run typecheck
npm run build
```

## Markdown 卡片格式

卡片使用 `## card` 分隔：

````md
---
title: 微积分公式
tags: [math, calculus]
---

## card
title: 幂函数求导
level: easy
tags: [导数, 基础]

$$
\frac{d}{dx}x^n = nx^{n-1}
$$

当 $n$ 为常数时成立。
````

支持行内公式 `$a^2+b^2=c^2$` 和块级公式 `$$...$$`。
