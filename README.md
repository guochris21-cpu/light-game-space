# 轻游空间（网页小游戏站）

## 你现在得到的功能
- 类似小游戏大厅：点击卡片即可进入游戏
- 内置 3 个可直接玩的游戏：贪吃蛇、跳跃小方块、2048
- 手机/平板/电脑都可用（触屏 + 键盘）
- 支持离线缓存（首次加载后，弱网或断网可继续玩）
- 自动检测网络状态，弱网进入省流模式

## 本地运行（推荐）
> 注意：不要双击 `index.html` 直接打开，Service Worker 需要 HTTP 环境。

### 方式 1：Python（最通用）
在 `game-site` 目录运行：

```powershell
python -m http.server 8080
```

浏览器访问：
- http://localhost:8080

### 方式 2：Node（如果你有）
```powershell
npx serve .
```

## 对外访问（不同网络、任意设备）
把 `game-site` 目录部署到任意静态托管平台即可：
- Cloudflare Pages
- Netlify
- Vercel
- GitHub Pages

部署后会得到一个公网 HTTPS 地址，任何网络下只要能上网都能直接玩。

## 文件说明
- `index.html`：站点页面结构
- `styles.css`：响应式和视觉样式
- `app.js`：游戏大厅逻辑 + 三个内置游戏
- `sw.js`：离线缓存逻辑
- `manifest.json`：PWA 基础配置
