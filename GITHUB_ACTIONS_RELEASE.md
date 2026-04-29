# GitHub Actions 自动打包发布说明

本项目已配置 GitHub Actions workflow：

```text
.github/workflows/windows-release.yml
```

## 触发方式

### 1. 推送到 main

```powershell
git push origin main
```

GitHub Actions 会自动：

1. 安装依赖。
2. 运行 `npm run typecheck`。
3. 运行 `npm run test:unit`。
4. 运行 `npm run dist`。
5. 上传 Windows 打包产物到 workflow artifacts。

这种方式只生成构建产物，不创建 GitHub Release。

### 2. 手动触发

进入 GitHub 仓库：

```text
Actions -> Windows Build and Release -> Run workflow
```

手动触发后同样会生成 workflow artifact，适合临时验证打包。

### 3. 打 tag 自动发布 Release

正式发布版本时执行：

```powershell
git tag v0.1.0
git push origin v0.1.0
```

当 tag 以 `v` 开头时，GitHub Actions 会：

1. 构建 Windows 安装包和便携版 exe。
2. 上传 workflow artifact。
3. 创建 GitHub Release。
4. 将 `release/*.exe` 和 `release/*.blockmap` 上传到 Release。

如果同名 Release 已存在，会覆盖上传新的构建产物。

## 输出文件

Actions 生成的主要文件：

```text
Formula Desktop Memo-Setup-0.1.0-x64.exe
Formula Desktop Memo-0.1.0-x64.exe
Formula Desktop Memo-Setup-0.1.0-x64.exe.blockmap
```

## 权限说明

workflow 使用：

```yaml
permissions:
  contents: write
```

这个权限用于在 tag 发布时创建 GitHub Release 并上传 exe。

## 注意事项

- 当前安装包未配置代码签名证书，Windows 可能提示“未知发布者”。
- 正式发版前建议先更新 `package.json` 的 `version`。
- `package.json` 的版本号会影响生成的 exe 文件名。
- `npm run dist` 会自动生成 icon、构建前端和 Electron 主进程，然后生成 NSIS 安装包与 portable 版本。
