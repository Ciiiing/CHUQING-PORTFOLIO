# Chu Qing Portfolio

褚清个人作品集网站，使用 React、Vite、GSAP、Motion 和 OGL 构建。

## 本地运行

```bash
pnpm install
pnpm dev
```

生产构建：

```bash
pnpm build
pnpm preview
```

## 目录说明

- `src/`：React 页面与交互组件
- `public/assets/`：页面实际使用的图片、书册内页和首页背景素材
- `package.json` / `pnpm-lock.yaml`：依赖与锁定版本

视频作品在网页中使用封面图展示，播放入口跳转至 YouTube；上传副本不包含视频作品本地 MP4，仅保留首页背景视频 `hero-fish.mp4`。

## GitHub 发布

本目录是可直接初始化 Git 仓库的干净上传副本，Vite 已配置为相对基路径，可部署到 GitHub Pages 的项目子路径。

书册封面与内页已统一转为 JPEG：保持原始宽高比例，上传副本中的书册图像宽、高均不低于 1600 像素，并以质量压缩降低体积。原始 PNG 未放入上传副本。

首次发布需要你手动完成以下步骤：

1. 配置 Git 身份：`git config --global user.name "Your Name"` 与 `git config --global user.email "your@email.com"`
2. 登录 GitHub CLI：`gh auth login`
3. 在 GitHub 创建仓库并决定仓库名称与公开/私有状态。
4. 在本目录添加远程地址，提交并推送 `main` 分支。
5. 如使用 GitHub Pages，在仓库 Settings → Pages 中选择 GitHub Actions；仓库收到 `main` 推送后会运行 `.github/workflows/deploy.yml`。

这些账号登录、仓库创建和远程推送动作不会由本地整理流程自动执行。
