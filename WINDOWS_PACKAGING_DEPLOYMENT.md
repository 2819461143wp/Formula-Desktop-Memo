# Formula Desktop Memo Windows 打包与部署流程

本文档记录本项目在 Windows 11 上生成安装程序、便携版可执行文件，以及部署验证的完整操作流程。

## 1. 产物类型

当前项目使用 `electron-builder` 打包 Windows x64 版本，执行 `npm run dist` 后会在 `release/` 目录生成：

| 文件 | 用途 |
| --- | --- |
| `Formula Desktop Memo-Setup-0.1.0-x64.exe` | Windows 安装程序，适合分发给普通用户 |
| `Formula Desktop Memo-0.1.0-x64.exe` | 便携版可执行文件，双击即可运行 |
| `win-unpacked/Formula Desktop Memo.exe` | 解包版程序，主要用于本机调试验证 |
| `Formula Desktop Memo-Setup-0.1.0-x64.exe.blockmap` | 更新差分信息，当前没有自动更新功能时可忽略 |

安装包和便携版默认都没有代码签名证书，因此 Windows 可能提示“未知发布者”。这是未签名 Electron 应用的正常现象。

## 2. 打包前准备

### 2.1 环境要求

建议环境：

- Windows 11
- Node.js 22.x
- npm
- 可以访问 npm registry 和 Electron 镜像站

首次拉取项目后安装依赖：

```powershell
npm install
```

如果 Electron 下载很慢，可以使用项目内已经配置的镜像打包命令，通常不需要额外设置。

### 2.2 确认项目可运行

开发模式运行：

```powershell
npm run dev
```

正常情况下会同时启动：

- Vite renderer：`http://127.0.0.1:5173`
- Electron 桌面窗口

如果开发窗口能正常显示 Markdown、LaTeX 公式和按钮，再进入打包步骤。

## 3. 打包前验证

建议每次正式打包前先跑这两条：

```powershell
npm run typecheck
npm run test:unit
```

预期结果：

- `typecheck` 无 TypeScript 错误
- `test:unit` 全部测试通过

如果 PowerShell 出现类似下面的提示：

```text
无法加载文件 ... WindowsPowerShell\profile.ps1，因为在此系统上禁止运行脚本
```

可以改用不加载 profile 的 PowerShell 执行：

```powershell
C:\windows\System32\WindowsPowerShell\v1.0\powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "npm.cmd run typecheck"
C:\windows\System32\WindowsPowerShell\v1.0\powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "npm.cmd run test:unit"
```

## 4. 关闭正在运行的旧版本

打包前需要关闭正在运行的旧便携版或解包版程序，否则 `electron-builder` 可能无法覆盖 exe，尤其是这个文件：

```text
release\Formula Desktop Memo-0.1.0-x64.exe
```

可以手动关闭窗口，也可以用任务管理器结束进程。

如果只想关闭 `release/` 目录里的旧便携版，可以执行：

```powershell
C:\windows\System32\WindowsPowerShell\v1.0\powershell.exe -NoProfile -Command "Get-Process | Where-Object { `$_.Path -eq 'F:\program\note\release\Formula Desktop Memo-0.1.0-x64.exe' } | Stop-Process -Force"
```

注意：如果用户正在运行安装目录里的版本，例如：

```text
F:\test\Formula Desktop Memo\Formula Desktop Memo.exe
```

这条命令不会关闭它。

## 5. 执行打包

在项目根目录执行：

```powershell
npm run dist
```

当前 `dist` 脚本实际会依次执行：

```text
npm run icons
npm run build
electron-builder --win nsis portable
```

其中：

- `npm run icons`：生成 `build/icon.png` 和 `build/icon.ico`
- `npm run build`：生成前端 `dist/` 和 Electron 主进程 `dist-electron/`
- `electron-builder --win nsis portable`：生成安装包和便携版 exe

如果普通 PowerShell 环境有脚本策略问题，可以使用：

```powershell
C:\windows\System32\WindowsPowerShell\v1.0\powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "npm.cmd run dist"
```

## 6. 打包输出位置

打包成功后检查：

```powershell
Get-ChildItem .\release -File
```

应该能看到：

```text
release\Formula Desktop Memo-Setup-0.1.0-x64.exe
release\Formula Desktop Memo-0.1.0-x64.exe
release\Formula Desktop Memo-Setup-0.1.0-x64.exe.blockmap
release\builder-debug.yml
```

如果只需要分发给别人，一般发送下面两个之一：

- 安装版：`release\Formula Desktop Memo-Setup-0.1.0-x64.exe`
- 便携版：`release\Formula Desktop Memo-0.1.0-x64.exe`

## 7. 安装版部署流程

1. 双击 `Formula Desktop Memo-Setup-0.1.0-x64.exe`。
2. 选择安装目录，例如：

```text
F:\test\Formula Desktop Memo
```

3. 安装完成后运行程序。
4. 程序会创建用户数据目录，用来保存配置、复习记录和默认 notes。

安装目录中的资源示例：

```text
F:\test\Formula Desktop Memo\resources\sample-notes\sample.md
```

这个文件是随包样例资源。应用第一次运行时会把样例复制到用户数据目录下，实际默认读取的 notes 通常不是安装目录里的 `resources/sample-notes`。

## 8. 便携版部署流程

便携版文件为：

```text
release\Formula Desktop Memo-0.1.0-x64.exe
```

使用方式：

1. 将该 exe 复制到目标机器或目标目录。
2. 双击运行。
3. 首次启动时会创建用户数据目录。
4. 如果窗口无内容，先点击设置按钮，检查 Markdown 文件夹路径是否存在。

便携版仍然会使用系统用户数据目录保存设置和复习状态，不是完全绿色免配置软件。

## 9. Markdown 文件夹与样例文件机制

项目里有三类 notes 路径，需要区分：

| 路径 | 作用 |
| --- | --- |
| `notes/sample.md` | 开发环境样例文件 |
| `resources/sample-notes/sample.md` | 打包后随程序携带的只读样例资源 |
| 用户数据目录下的 `data/notes/sample.md` | 应用实际默认读取和监听的 Markdown 文件 |

生产环境首次启动时，主进程会执行：

1. 创建用户数据目录。
2. 创建默认 notes 目录。
3. 从 `resources/sample-notes/sample.md` 复制一份到用户数据目录。
4. 将设置中的 `notesDir` 指向用户数据目录下的 notes。

这样做的原因是安装目录可能没有写入权限，而用户数据目录可以安全保存用户自己的 Markdown。

如果要切换为自己的 Markdown 文件夹：

1. 打开应用设置。
2. 点击 Markdown 文件夹选择按钮。
3. 选择包含 `.md` 文件的本地目录。
4. 修改 `.md` 后，应用会自动刷新。

## 10. 打包配置说明

打包配置在 `package.json` 的 `build` 字段中。

关键配置：

```json
{
  "appId": "com.formula-desktop-memo.app",
  "productName": "Formula Desktop Memo",
  "directories": {
    "output": "release"
  },
  "icon": "build/icon.ico"
}
```

Windows 目标：

```json
"win": {
  "icon": "build/icon.ico",
  "signAndEditExecutable": false,
  "target": [
    {
      "target": "nsis",
      "arch": ["x64"]
    },
    {
      "target": "portable",
      "arch": ["x64"]
    }
  ]
}
```

`signAndEditExecutable: false` 用于避免本机没有符号链接权限时，`winCodeSign` 解压失败的问题。由于当前没有代码签名证书，跳过签名是合理的。

随包资源：

```json
"extraResources": [
  {
    "from": "notes/sample.md",
    "to": "sample-notes/sample.md"
  },
  {
    "from": "build/icon.ico",
    "to": "build/icon.ico"
  }
]
```

这会把样例 Markdown 和运行时 icon 放进安装包资源目录。

## 11. 常见问题

### 11.1 运行打包后的 exe，窗口是空的

优先检查 `vite.config.ts` 是否包含：

```ts
base: "./",
```

Electron 生产环境使用 `file://` 加载页面，如果 Vite 产物里是 `/assets/...` 这种绝对路径，脚本会加载失败，窗口就会是空白。

正确的生产 HTML 应该类似：

```html
<script type="module" crossorigin src="./assets/index-xxx.js"></script>
<link rel="stylesheet" crossorigin href="./assets/index-xxx.css">
```

### 11.2 公式根号不显示

`\sqrt` 需要 KaTeX 生成 SVG 来画根号。`sanitize-html` 必须允许 `svg` 和 `path`，否则根号线会被清掉。

相关逻辑在：

```text
src/lib/markdown.ts
```

相关测试在：

```text
tests/markdown.test.ts
```

### 11.3 打包卡在 portable 或无法覆盖 exe

通常是旧的便携版正在运行。

检查进程：

```powershell
Get-Process | Where-Object { $_.ProcessName -like '*Formula*' } | Select-Object Id,ProcessName,Path
```

关闭旧版后重新执行：

```powershell
npm run dist
```

### 11.4 winCodeSign 解压失败

如果报错类似：

```text
Cannot create symbolic link
客户端没有所需的特权
```

原因是 Windows 当前用户没有创建符号链接权限。当前项目通过：

```json
"signAndEditExecutable": false
```

以及：

```text
CSC_IDENTITY_AUTO_DISCOVERY=false
```

避免代码签名相关流程。

### 11.5 Electron 下载失败或 GitHub 访问失败

当前 `dist` 脚本使用了镜像：

```text
ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/
```

如果仍失败，检查网络或代理后重新执行 `npm run dist`。

## 12. 推荐发布检查清单

每次发布前按顺序检查：

```powershell
npm run typecheck
npm run test:unit
npm run dist
```

然后手动验证：

- 双击便携版 exe 可以打开窗口。
- 安装包可以正常安装。
- 首次启动有默认卡片内容。
- Markdown 文件夹可以切换。
- 修改 `.md` 文件后内容会自动刷新。
- LaTeX 公式正常显示，尤其是 `\sqrt`、`\sum`、`\int`、`\lim`。
- 设置面板、透明度、轮播、复习按钮可用。

## 13. 版本号更新

正式发新版前，修改 `package.json`：

```json
"version": "0.1.1"
```

然后重新执行：

```powershell
npm run dist
```

输出文件名会自动变成：

```text
Formula Desktop Memo-Setup-0.1.1-x64.exe
Formula Desktop Memo-0.1.1-x64.exe
```

## 14. 最短操作流程

如果只是本机快速重新打包，最短流程是：

```powershell
npm run typecheck
npm run test:unit
npm run dist
```

产物位置：

```text
release\Formula Desktop Memo-Setup-0.1.0-x64.exe
release\Formula Desktop Memo-0.1.0-x64.exe
```
