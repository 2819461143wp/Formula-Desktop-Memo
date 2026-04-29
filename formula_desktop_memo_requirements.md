# Formula Desktop Memo 需求规格说明

## 1. 项目概述

Formula Desktop Memo 是一个运行在 Windows 11 上的桌面悬浮记忆卡片工具。它用于从本地 Markdown 文件夹读取数学公式、定义、推导和每日复习内容，并以半透明、可拖动的桌面卡片形式常驻显示。

目标效果类似一个“高级桌面便签”，但它不仅展示文本，还需要支持 Markdown、LaTeX 数学公式、自动轮播、间隔重复复习、文件夹监听刷新、开机自启和窗口个性化设置。

核心价值：

- 把本地 Markdown 知识库变成可持续露出的桌面记忆卡片。
- 让数学公式、定义和推导在桌面上以清晰、优雅的方式展示。
- 通过轻量级间隔重复算法帮助用户进行每日复习。
- 保持本地优先，不依赖云端账号或在线服务。

## 2. 使用场景

### 2.1 日常公式记忆

用户把公式、定义、定理或例题写入本地 `.md` 文件。应用自动读取这些文件，将内容拆分为多个卡片，在桌面上按顺序或随机方式轮播。

### 2.2 每日复习

用户每天打开电脑后，应用自动启动并展示今日到期的复习卡片。用户可以对当前卡片选择“忘记 / 困难 / 熟悉 / 简单”，系统根据选择更新下一次复习时间。

### 2.3 Markdown 即时编辑

用户使用任意编辑器修改本地 Markdown 文件。保存后，应用自动检测变化，重新解析卡片并刷新界面，不需要手动重启应用。

### 2.4 桌面轻量常驻

用户希望卡片像桌面便签一样停留在屏幕边角。窗口支持拖动、调整大小、透明度、置顶、隐藏控制栏等能力，避免干扰主要工作。

## 3. 目标平台

第一阶段只要求支持：

- 操作系统：Windows 11
- 架构：x64
- 运行方式：桌面应用
- 数据来源：本地 Markdown 文件夹
- 数据存储：本地 JSON 文件或等价的轻量本地数据库

暂不要求：

- 移动端
- 浏览器网页版
- 云同步
- 多用户账号
- 在线编辑器
- AI 生成卡片

## 4. 推荐技术栈

建议使用以下技术栈实现：

```text
Electron + Vite + React + TypeScript
```

推荐依赖：

```text
electron
vite
react
react-dom
typescript
electron-builder
chokidar
gray-matter
marked 或 markdown-it
katex
dayjs
zustand
lowdb
concurrently
wait-on
```

各依赖职责：

| 依赖 | 作用 |
| --- | --- |
| Electron | 构建 Windows 桌面应用和悬浮窗口 |
| Vite | 前端开发和构建 |
| React | 渲染卡片、控制栏、设置面板 |
| TypeScript | 提供类型约束，降低后续维护成本 |
| electron-builder | 打包 Windows 安装包或可执行文件 |
| chokidar | 监听 Markdown 文件夹变化 |
| gray-matter | 解析 Markdown frontmatter |
| marked / markdown-it | Markdown 转 HTML |
| KaTeX | 渲染 LaTeX 数学公式 |
| dayjs | 日期处理和复习时间计算 |
| zustand | 管理前端状态 |
| lowdb | 轻量本地 JSON 数据持久化 |

## 5. 功能范围

### 5.1 核心功能

必须实现：

- 常驻桌面悬浮窗口。
- 读取本地 `.md` 文件夹。
- 支持 Markdown 基础语法。
- 支持 LaTeX 行内公式 `$...$`。
- 支持 LaTeX 块级公式 `$$...$$`。
- 支持将 Markdown 拆分为多张记忆卡片。
- 支持上一张、下一张、暂停、继续。
- 支持自动轮播。
- 支持间隔重复复习。
- 支持拖动窗口位置。
- 支持调整窗口透明度。
- 支持保存窗口位置、大小和配置。
- 支持开机自启。
- 支持 Markdown 文件修改后自动刷新。

### 5.2 增强功能

可在后续版本实现：

- 卡片搜索。
- 标签筛选。
- 难度筛选。
- 今日复习列表。
- 随机播放模式。
- 公式渲染错误提示。
- 多主题外观。
- 点击穿透模式。
- 托盘菜单。
- 快捷键控制。
- 导入 / 导出复习记录。

### 5.3 非目标功能

暂不实现：

- Markdown 文件在线同步。
- 多设备同步。
- 复杂知识图谱。
- 富文本编辑器。
- 账号登录。
- 云端备份。
- OCR 识别。

## 6. Markdown 内容规范

### 6.1 文件夹结构

应用默认读取项目或用户配置中的 `notes/` 文件夹。

示例：

```text
notes/
  calculus.md
  linear-algebra.md
  probability.md
```

用户可以在设置中修改 Markdown 文件夹路径。

### 6.2 文件级 frontmatter

每个 Markdown 文件可以包含可选 frontmatter：

```md
---
title: 微积分公式
tags: [math, calculus]
---
```

字段说明：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| title | string | 否 | 文件标题 |
| tags | string[] | 否 | 文件默认标签，会合并到卡片标签中 |

### 6.3 卡片分隔格式

每张卡片使用 `## card` 作为起始标记。卡片标题、难度和标签写在 `## card` 后方的简易元信息区。

推荐格式：

````md
---
title: 微积分公式
tags: [math, calculus]
---

# 微积分公式

## card
title: 幂函数求导
level: easy
tags: [导数, 基础]

$$
\frac{d}{dx}x^n = nx^{n-1}
$$

当 $n$ 为常数时，幂函数求导遵循上式。

---

## card
title: 链式法则
level: medium
tags: [导数, 复合函数]

$$
\frac{d}{dx}f(g(x)) = f'(g(x))g'(x)
$$

链式法则用于处理复合函数求导。
````

### 6.4 卡片字段

| 字段 | 类型 | 必填 | 默认值 | 说明 |
| --- | --- | --- | --- | --- |
| title | string | 否 | Untitled Card | 卡片标题 |
| level | easy / medium / hard | 否 | medium | 卡片难度 |
| tags | string[] | 否 | [] | 卡片标签 |
| due | string | 否 | 空 | 可选的初始到期日期 |

### 6.5 Markdown 和 LaTeX 支持

必须支持：

- 标题
- 段落
- 粗体、斜体、行内代码
- 无序列表、有序列表
- 引用
- 代码块
- 行内公式：`$a^2 + b^2 = c^2$`
- 块级公式：

```md
$$
E = mc^2
$$
```

### 6.6 解析规则

解析流程：

1. 扫描 notes 文件夹下所有 `.md` 文件。
2. 解析文件级 frontmatter。
3. 按 `## card` 拆分卡片。
4. 解析每张卡片的元信息。
5. 将卡片正文从 Markdown 转为 HTML。
6. 使用 KaTeX 渲染行内和块级公式。
7. 生成稳定卡片 ID 和内容 hash。
8. 合并已有复习状态。

卡片 ID 建议：

```ts
id = hash(sourceFile + "::" + title)
contentHash = hash(bodyMarkdown)
```

说明：

- `id` 尽量保持稳定，避免用户修改正文后丢失复习记录。
- `contentHash` 用于判断卡片内容是否发生变化。
- 如果标题变化导致 ID 变化，可以视为新卡片。

## 7. 窗口需求

### 7.1 窗口类型

应用主窗口是无边框透明窗口。

Electron `BrowserWindow` 建议配置：

```ts
const mainWindow = new BrowserWindow({
  width: 420,
  height: 260,
  frame: false,
  transparent: true,
  resizable: true,
  skipTaskbar: false,
  alwaysOnTop: false,
  hasShadow: false,
  webPreferences: {
    preload: path.join(__dirname, "preload.js"),
    contextIsolation: true,
    nodeIntegration: false,
  },
});
```

### 7.2 窗口模式

支持三种窗口模式：

| 模式 | 说明 |
| --- | --- |
| desktop | 默认桌面便签模式，不强制置顶 |
| floating | 悬浮模式，窗口置顶 |
| focus | 专注模式，窗口尺寸更大，用于集中复习 |

### 7.3 拖动和交互区域

窗口需要可拖动。拖动区域使用 CSS：

```css
.drag-region {
  -webkit-app-region: drag;
}

.no-drag {
  -webkit-app-region: no-drag;
}
```

规则：

- 卡片顶部栏或空白区域可拖动。
- 按钮、滑块、菜单等交互元素必须设置为 `no-drag`。
- 拖动和缩放后保存窗口位置与尺寸。

### 7.4 透明度

用户可以调整窗口透明度。

配置字段：

```json
{
  "opacity": 0.82
}
```

要求：

- 透明度范围建议为 `0.3` 到 `1`。
- 默认透明度建议为 `0.82`。
- 透明度调整后应立即生效并保存配置。

### 7.5 开机自启

用户可以在设置中开启或关闭开机自启。

要求：

- 默认关闭。
- 开启后 Windows 登录时自动启动应用。
- 应提供明确的开关状态。
- 开机自启失败时应显示错误提示或记录日志。

## 8. UI 需求

### 8.1 整体风格

目标风格：

- Windows 11 风格。
- 半透明毛玻璃质感。
- 视觉轻量，不遮挡主工作区。
- 数学公式清晰可读。
- 控制元素尽量紧凑。

建议样式：

```css
.memo-card {
  background: rgba(20, 20, 24, 0.72);
  backdrop-filter: blur(18px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
  color: #f5f5f5;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.28);
}
```

### 8.2 主界面元素

主窗口应包含：

- 卡片标题。
- 标签和难度。
- Markdown 渲染内容。
- LaTeX 公式。
- 当前进度，例如 `3 / 42`。
- 上一张按钮。
- 下一张按钮。
- 暂停 / 继续按钮。
- 复习评分按钮。
- 设置入口。

### 8.3 控制栏

控制栏可以常显，也可以在鼠标悬停时显示。

控制栏功能：

- 上一张。
- 下一张。
- 暂停 / 继续轮播。
- 切换随机 / 顺序模式。
- 打开设置。
- 关闭窗口或最小化到托盘。

### 8.4 复习按钮

复习模式下显示四个按钮：

```text
忘记
困难
熟悉
简单
```

快捷键建议：

| 快捷键 | 功能 |
| --- | --- |
| 1 | 忘记 |
| 2 | 困难 |
| 3 | 熟悉 |
| 4 | 简单 |
| Space | 暂停 / 继续 |
| ArrowLeft | 上一张 |
| ArrowRight | 下一张 |
| F | 切换专注模式 |
| Esc | 退出专注模式或关闭设置面板 |

## 9. 自动轮播

### 9.1 基本行为

用户可以开启或关闭自动轮播。

配置字段：

```json
{
  "autoRotate": true,
  "rotateIntervalSeconds": 60,
  "rotateMode": "sequential"
}
```

要求：

- 默认开启自动轮播。
- 默认间隔 60 秒。
- 支持暂停和继续。
- 用户手动切换卡片后，计时器应重新开始计时。

### 9.2 轮播模式

支持：

| 模式 | 说明 |
| --- | --- |
| sequential | 按卡片列表顺序播放 |
| random | 随机播放 |
| dueOnly | 只播放今日到期卡片 |

第一阶段至少实现 `sequential`。

## 10. 间隔重复复习

### 10.1 复习状态

每张卡片维护一条复习状态。

```ts
export type ReviewState = {
  cardId: string;
  ease: number;
  intervalDays: number;
  dueDate: string;
  reviewCount: number;
  lastReviewedAt?: string;
};
```

初始状态：

```json
{
  "ease": 2.5,
  "intervalDays": 0,
  "dueDate": "today",
  "reviewCount": 0
}
```

### 10.2 评分规则

用户评分：

| 评分 | 含义 |
| --- | --- |
| again | 忘记，需要尽快再看 |
| hard | 困难，仍需短期复习 |
| good | 熟悉，正常推进 |
| easy | 简单，延长复习间隔 |

### 10.3 简化算法

建议第一阶段使用简化 SM-2 风格算法：

```ts
again:
  intervalDays = 0
  dueDate = today
  ease = max(1.3, ease - 0.2)

hard:
  intervalDays = max(1, round(currentInterval * 1.2))
  ease = max(1.3, ease - 0.15)

good:
  if reviewCount === 0 -> intervalDays = 1
  else if reviewCount === 1 -> intervalDays = 3
  else intervalDays = round(currentInterval * ease)

easy:
  intervalDays = max(3, round(currentInterval * ease * 1.5))
  ease = ease + 0.15
```

评分后：

1. 更新 `lastReviewedAt`。
2. 更新 `dueDate`。
3. 更新 `intervalDays`。
4. 更新 `ease`。
5. `reviewCount += 1`。
6. 自动进入下一张到期卡片或下一张普通卡片。

### 10.4 今日复习

系统应根据 `dueDate <= today` 判断今日到期卡片。

主界面可展示：

```text
今日到期：5
已复习：2
剩余：3
```

第一阶段可以只实现到期筛选和评分更新，不要求复杂统计图表。

## 11. 文件监听和自动刷新

### 11.1 监听范围

监听用户配置的 notes 文件夹下所有 `.md` 文件。

监听事件：

| 事件 | 行为 |
| --- | --- |
| add | 新增卡片并刷新列表 |
| change | 重新解析文件并刷新列表 |
| unlink | 移除对应卡片 |

### 11.2 防抖

文件变化事件需要防抖，避免编辑器保存时触发多次刷新。

建议：

```ts
debounce(reloadMarkdown, 300)
```

### 11.3 刷新策略

要求：

- 刷新后尽量保持当前卡片位置。
- 如果当前卡片被删除，切换到下一张可用卡片。
- 如果某张卡片正文变更，但 ID 未变，应保留复习记录。
- 如果解析失败，不应导致应用崩溃，应显示错误状态并保留上一次可用内容。

## 12. 数据存储

### 12.1 配置文件

建议路径：

```text
data/settings.json
```

数据结构：

```ts
export type Settings = {
  notesDir: string;
  windowMode: "desktop" | "floating" | "focus";
  opacity: number;
  autoRotate: boolean;
  rotateIntervalSeconds: number;
  rotateMode: "sequential" | "random" | "dueOnly";
  theme: "dark" | "light" | "auto";
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
```

### 12.2 复习记录

建议路径：

```text
data/reviews.json
```

数据结构：

```ts
export type ReviewState = {
  cardId: string;
  ease: number;
  intervalDays: number;
  dueDate: string;
  reviewCount: number;
  lastReviewedAt?: string;
};
```

### 12.3 卡片模型

```ts
export type Card = {
  id: string;
  title: string;
  bodyMarkdown: string;
  bodyHtml: string;
  sourceFile: string;
  tags: string[];
  level?: "easy" | "medium" | "hard";
  createdAt?: string;
  updatedAt?: string;
  contentHash: string;
};
```

## 13. 应用架构

### 13.1 目录结构

建议项目结构：

```text
formula-desktop-memo/
  package.json
  tsconfig.json
  vite.config.ts
  electron/
    main.ts
    preload.ts
    ipc.ts
    tray.ts
    autoLaunch.ts
  src/
    App.tsx
    main.tsx
    styles/
      global.css
    components/
      MemoCard.tsx
      ControlBar.tsx
      SettingsPanel.tsx
      ReviewButtons.tsx
    lib/
      markdown.ts
      scheduler.ts
      cardStore.ts
      settingsStore.ts
      types.ts
  notes/
    sample.md
  data/
    settings.json
    reviews.json
  README.md
```

### 13.2 进程职责

Electron 主进程：

- 创建窗口。
- 管理窗口位置、大小、置顶、透明度。
- 监听本地 Markdown 文件夹。
- 读取和写入本地 JSON 数据。
- 管理开机自启。
- 提供 IPC 接口。

Renderer 前端：

- 渲染卡片。
- 展示控制栏和设置面板。
- 处理用户点击和快捷键。
- 调用 IPC 读取卡片、保存设置、提交复习评分。

Preload：

- 暴露安全的 `window.api`。
- 禁止 renderer 直接访问 Node API。

### 13.3 IPC 接口建议

```ts
window.api.getCards(): Promise<Card[]>
window.api.getSettings(): Promise<Settings>
window.api.updateSettings(partial: Partial<Settings>): Promise<Settings>
window.api.rateCard(cardId: string, rating: "again" | "hard" | "good" | "easy"): Promise<ReviewState>
window.api.selectNotesDir(): Promise<string | null>
window.api.reloadCards(): Promise<Card[]>
window.api.onCardsChanged(callback: (cards: Card[]) => void): Unsubscribe
```

安全要求：

- 开启 `contextIsolation`。
- 禁用 `nodeIntegration`。
- 只在 preload 暴露必要 API。
- Markdown 渲染后的 HTML 需要做安全处理，避免执行脚本。

## 14. 错误处理

必须处理：

- notes 文件夹不存在。
- notes 文件夹为空。
- Markdown 文件解析失败。
- LaTeX 公式渲染失败。
- settings.json 损坏。
- reviews.json 损坏。
- 开机自启设置失败。
- 文件监听异常。

错误展示原则：

- 不应让应用白屏或崩溃。
- 卡片区域展示简短错误信息。
- 控制台或日志记录详细错误。
- 配置文件损坏时可以回退默认配置，并保留损坏文件备份。

## 15. 性能要求

第一阶段目标：

- 100 个 Markdown 文件以内能正常使用。
- 1000 张卡片以内切换流畅。
- 文件保存后 1 秒内刷新。
- 普通卡片切换无明显卡顿。

优化建议：

- Markdown 解析放在主进程或独立模块中统一处理。
- 文件变化后只重新解析变化文件。
- 对公式渲染失败的卡片做局部错误展示。
- 卡片 HTML 可以缓存，但需要根据 `contentHash` 失效。

## 16. 可访问性和易用性

要求：

- 公式字号足够清晰。
- 窗口最小宽度下内容不应严重溢出。
- 控制按钮需要有可识别的 hover 状态。
- 快捷键不应影响用户在其他应用中的输入，只有窗口聚焦时生效。
- 设置项命名清晰。

## 17. 测试要求

### 17.1 单元测试

重点测试：

- Markdown 卡片拆分。
- frontmatter 解析。
- 卡片 ID 生成。
- LaTeX 公式预处理。
- 间隔重复算法。
- 配置默认值合并。

### 17.2 集成测试

重点测试：

- 读取 notes 文件夹。
- 文件变化后刷新卡片。
- 复习评分后写入 reviews.json。
- 设置更新后写入 settings.json。

### 17.3 手动验收

验收步骤：

1. 启动应用。
2. 确认桌面出现无边框悬浮卡片。
3. 确认 `notes/sample.md` 被正确读取。
4. 确认 Markdown 内容正常渲染。
5. 确认 `$...$` 和 `$$...$$` 公式正常渲染。
6. 点击上一张、下一张可以切换卡片。
7. 开启自动轮播后，卡片按间隔自动切换。
8. 拖动窗口后重启应用，位置能恢复。
9. 调整透明度后立即生效并能持久化。
10. 修改 Markdown 文件并保存，应用自动刷新内容。
11. 点击复习评分后，`reviews.json` 正确更新。
12. 开启开机自启后，系统登录时应用自动启动。

## 18. 迭代计划

### Phase 1：基础桌面卡片

目标：先做出能运行的桌面悬浮卡片。

包含：

- Electron + Vite + React + TypeScript 项目初始化。
- Windows 11 无边框透明窗口。
- 基础卡片 UI。
- `notes/sample.md` 示例文件。
- Markdown 文件读取。
- `## card` 卡片拆分。
- Markdown + LaTeX 渲染。
- 上一张 / 下一张。
- 自动轮播。

验收标准：

- `npm run dev` 后能启动 Electron 应用。
- 桌面显示半透明卡片窗口。
- 示例 Markdown 中的公式能正常显示。
- 能手动切换卡片。
- 能按默认间隔自动轮播。

### Phase 2：本地配置和自动刷新

目标：让应用具备长期使用的基本配置能力。

包含：

- 设置面板。
- notes 文件夹选择。
- 文件变化监听。
- 窗口位置和大小保存。
- 透明度设置。
- 置顶设置。
- 托盘菜单。
- 开机自启。

验收标准：

- 修改 Markdown 后无需重启即可刷新。
- 重启后窗口位置和透明度保持不变。
- 可以通过设置修改 notes 文件夹。
- 可以开启或关闭开机自启。

### Phase 3：间隔重复复习

目标：把普通桌面便签升级为复习工具。

包含：

- `reviews.json` 复习记录。
- 今日到期卡片筛选。
- 忘记 / 困难 / 熟悉 / 简单评分。
- 简化间隔重复算法。
- 今日复习数量展示。
- dueOnly 轮播模式。

验收标准：

- 每张卡片有稳定复习状态。
- 评分后复习记录写入本地文件。
- 今日到期卡片可以被筛选展示。
- dueDate 根据评分正确变化。

### Phase 4：体验优化

目标：提升实际使用手感。

可选包含：

- 标签筛选。
- 搜索。
- 随机轮播。
- 快捷键设置。
- 多主题。
- 点击穿透。
- 错误日志页面。
- 打包 Windows 安装程序。

## 19. 示例 Markdown 文件

建议创建 `notes/sample.md`：

````md
---
title: 数学公式记忆
tags: [math]
---

# 数学公式记忆

## card
title: 勾股定理
level: easy
tags: [几何, 基础]

$$
a^2 + b^2 = c^2
$$

直角三角形中，两条直角边平方和等于斜边平方。

---

## card
title: 一元二次方程求根公式
level: medium
tags: [代数, 方程]

对于方程：

$$
ax^2 + bx + c = 0
$$

当 $a \ne 0$ 时：

$$
x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
$$

---

## card
title: 乘积求导法则
level: medium
tags: [微积分, 导数]

$$
(uv)' = u'v + uv'
$$

两个函数乘积的导数等于第一个函数的导数乘第二个函数，加上第一个函数乘第二个函数的导数。

---

## card
title: 欧拉公式
level: hard
tags: [复数, 经典公式]

$$
e^{ix} = \cos x + i\sin x
$$

当 $x = \pi$ 时，可得到：

$$
e^{i\pi} + 1 = 0
$$
````

## 20. 完成定义

当以下条件满足时，可以认为第一个可用版本完成：

- 应用能在 Windows 11 上启动。
- 桌面悬浮窗口能展示 Markdown 卡片。
- 数学公式能正常渲染。
- 能读取本地 Markdown 文件夹。
- Markdown 保存后能自动刷新。
- 能手动切换和自动轮播卡片。
- 能保存窗口位置、大小、透明度和基础设置。
- 能记录复习评分并计算下一次复习日期。
- 能开启和关闭开机自启。
- 有基础示例文件和 README 使用说明。

## 21. 后续实现提示

推荐先按 Phase 1 实现最小可用版本，不要一开始就追求完整设置面板和复杂复习统计。只要第一版能稳定显示 Markdown + LaTeX 卡片，后续的文件监听、设置持久化和复习算法都可以逐步叠加。

实现时优先保证：

- Markdown 解析稳定。
- Electron 安全配置正确。
- 窗口交互不别扭。
- 复习记录不会因为修改正文轻易丢失。
- 用户数据保存在本地且可迁移。
