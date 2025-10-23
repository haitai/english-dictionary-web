# 🚀 快速开始指南

## 📋 前置要求

- Node.js 16+ 
- npm 或 yarn
- Git
- GitHub 账号
- Supabase 账号（可选，用于用户数据同步）

## 🎯 快速部署（5 分钟）

### 1. 克隆项目

```bash
git clone https://github.com/TICKurt/english-dictionary-web.git
cd english-dictionary-web
```

### 2. 安装依赖

```bash
npm install
```

### 3. 准备词典数据

将词典 JSON 文件放到 `public/dictionary/` 目录：

```
public/
  └── dictionary/
      ├── hello.json
      ├── world.json
      ├── love.json
      └── ... (你的词典文件)
```

### 4. 构建索引

```bash
npm run build-index
```

这将生成 `public/dictionary/index.json`（约 3.4 MB），支持按需加载单词详情。

### 5. 本地运行

```bash
npm run dev
```

访问 `http://localhost:5173`

## 🔧 配置 Supabase（可选）

如果需要跨设备同步用户数据：

### 1. 创建 Supabase 项目

访问 [supabase.com](https://supabase.com) 创建免费项目。

### 2. 创建数据表

在 Supabase SQL Editor 中执行：

```sql
-- 用户收藏表
CREATE TABLE user_collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, word)
);

-- 学习进度表
CREATE TABLE user_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  ease_factor DECIMAL(3,2) DEFAULT 2.5,
  interval INTEGER DEFAULT 0,
  repetitions INTEGER DEFAULT 0,
  next_review TIMESTAMPTZ DEFAULT NOW(),
  last_reviewed TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, word)
);

-- 创建索引
CREATE INDEX idx_user_collections ON user_collections(user_id);
CREATE INDEX idx_user_progress ON user_progress(user_id);
CREATE INDEX idx_next_review ON user_progress(user_id, next_review);

-- 启用 RLS
ALTER TABLE user_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- RLS 策略
CREATE POLICY "Users can manage their collections" 
  ON user_collections FOR ALL 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their progress" 
  ON user_progress FOR ALL 
  USING (auth.uid() = user_id);
```

### 3. 配置环境变量

复制 `.env.example` 为 `.env`：

```bash
cp .env.example .env
```

编辑 `.env`，填入 Supabase 配置：

```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. 关闭邮箱验证（开发环境）

Supabase 控制台 → Authentication → Settings：
- 找到 "Confirm email" 选项
- 取消勾选（开发测试用）
- 生产环境建议开启并配置 SMTP

## 🚀 部署到 GitHub Pages

### 1. 更新 `vite.config.js`

确保 `base` 配置正确：

```javascript
export default defineConfig({
  // ...
  base: process.env.NODE_ENV === 'production' 
    ? '/your-repo-name/'  // 改成你的仓库名
    : '/'
})
```

### 2. 推送到 GitHub

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 3. 启用 GitHub Actions

项目已包含 `.github/workflows/deploy.yml`，会自动部署。

### 4. 配置 GitHub Pages

GitHub 仓库 → Settings → Pages：
- Source: `gh-pages`
- 等待部署完成（2-3 分钟）

### 5. 访问网站

`https://TICKurt.github.io/english-dictionary-web/`

## 📖 目录结构

```
english-dictionary-web/
├── public/
│   └── dictionary/           # 词典数据目录
│       ├── index.json        # 自动生成的索引
│       ├── hello.json        # 单词详情
│       └── ...
├── src/
│   ├── components/           # Vue 组件
│   ├── stores/               # Pinia 状态管理
│   ├── utils/                # 工具函数
│   ├── views/                # 页面组件
│   ├── router/               # 路由配置
│   ├── assets/               # 静态资源
│   ├── App.vue               # 根组件
│   └── main.js               # 入口文件
├── scripts/
│   ├── build-index.js        # 构建轻量级索引脚本
│   └── process-dictionary.js # 词典处理脚本（已弃用）
├── .github/
│   └── workflows/
│       └── deploy.yml        # GitHub Actions 配置
├── .env.example              # 环境变量模板
├── vite.config.js            # Vite 配置
├── tailwind.config.js        # Tailwind 配置
├── package.json              # 项目配置
└── README.md                 # 项目说明
```

## 🎮 基本使用

### 开发模式

```bash
npm run dev              # 启动开发服务器
npm run build-index      # 重新构建索引
```

### 生产构建

```bash
npm run build            # 构建生产版本（自动构建索引）
npm run preview          # 预览生产版本
```

## 🔍 功能说明

### 词典功能
- ✅ 搜索单词（基于轻量级索引）
- ✅ 查看详情（按需加载，2-5KB）
- ✅ 随机单词学习
- ✅ 离线缓存（IndexedDB + 内存）

### 学习功能（需 Supabase）
- ✅ 用户注册/登录
- ✅ 收藏单词
- ✅ 学习进度
- ✅ 记忆曲线（SM-2）
- ✅ 跨设备同步

## 📊 性能特性

- ⚡ 首次加载：只下载 3.4MB 索引（vs 旧方案 50-100MB）
- 🎯 按需加载：单词详情仅 2-5KB，按需下载
- 💾 三层缓存：内存 + IndexedDB + HTTP 缓存
- 📱 离线支持：已查看单词永久离线可用
- 🚀 极速搜索：索引内搜索，0 网络延迟
- 📈 流量节省：相比旧方案节省 65%+ 流量

## 🐛 常见问题

### 1. 索引构建失败

**错误**：`Error: ENOENT: no such file or directory, scandir`

**解决**：
- 确认词典文件在 `public/dictionary/` 目录
- 检查文件权限
- 确保文件名格式正确（`[word].json`）

### 2. 单词加载失败

**错误**：`Failed to fetch`

**解决**：
- 检查网络连接
- 确认文件存在
- 清除浏览器缓存

### 3. Supabase 连接失败

**错误**：`Invalid API key`

**解决**：
- 检查 `.env` 文件配置
- 确认 Supabase URL 和 Key 正确
- 重启开发服务器

### 4. GitHub Pages 404

**原因**：`base` 路径配置错误

**解决**：
- 检查 `vite.config.js` 中的 `base` 配置
- 确保与仓库名一致
- 重新构建并部署

## 🔐 安全提示

1. **不要提交 `.env` 文件**
   - 已在 `.gitignore` 中忽略
   - 使用 GitHub Secrets 存储密钥

2. **Supabase RLS**
   - 已配置行级安全策略
   - 用户只能访问自己的数据

3. **API Key 保护**
   - `ANON_KEY` 可以公开（有 RLS 保护）
   - `SERVICE_KEY` 绝不能暴露

## 📚 进阶配置

### 自定义主题

编辑 `tailwind.config.js`：

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          // 自定义主色调
          600: '#your-color'
        }
      }
    }
  }
}
```

### 预加载策略

编辑 `src/utils/dictionary.js`：

```javascript
export function preloadCommonWords() {
  const commonWords = ['your', 'custom', 'words']
  // ...
}
```

### 缓存配置

编辑 `src/utils/dictionary.js`：

```javascript
const MAX_MEMORY_CACHE = 200  // 调整内存缓存大小
```

## 🤝 获取帮助

- 📖 查看 [完整文档](README.md)
- 🐛 提交 [Issue](https://github.com/TICKurt/english-dictionary-web/issues)
- 💬 参与 [讨论](https://github.com/TICKurt/english-dictionary-web/discussions)
- 📧 发送邮件：your-email@example.com

## 📝 下一步

1. ✅ 本地运行成功
2. ✅ 配置 Supabase（可选）
3. ✅ 部署到 GitHub Pages
4. 📱 分享给朋友使用
5. ⭐ 给项目点个 Star

---

🎉 恭喜！你已经成功部署了自己的单词学习网站！
