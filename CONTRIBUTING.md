# 贡献指南

感谢你对英汉词典项目的关注！我们欢迎任何形式的贡献。

## 🤝 如何贡献

### 报告 Bug

如果你发现了 Bug，请：

1. 检查 [Issues](https://github.com/TICKurt/english-dictionary-web/issues) 确认是否已有人报告
2. 如果没有，创建新 Issue，包含：
   - Bug 的详细描述
   - 复现步骤
   - 预期行为
   - 实际行为
   - 截图（如果适用）
   - 浏览器和操作系统信息

### 提议新功能

如果你有好的想法：

1. 在 Issues 中创建 Feature Request
2. 描述功能的用途和价值
3. 如果可能，提供设计草图或实现思路

### 提交代码

#### 开发流程

1. **Fork 仓库**
   ```bash
   # 在 GitHub 上点击 Fork 按钮
   ```

2. **克隆你的 Fork**
   ```bash
   git clone https://github.com/TICKurt/english-dictionary-web.git
   cd english-dictionary-web
   ```

3. **创建特性分支**
   ```bash
   git checkout -b feature/your-feature-name
   # 或
   git checkout -b fix/your-bug-fix
   ```

4. **安装依赖**
   ```bash
   npm install
   ```

5. **开发和测试**
   ```bash
   npm run dev
   ```

6. **提交更改**
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```

   提交信息规范（遵循 [Conventional Commits](https://www.conventionalcommits.org/)）：
   - `feat:` 新功能
   - `fix:` Bug 修复
   - `docs:` 文档更新
   - `style:` 代码格式（不影响功能）
   - `refactor:` 代码重构
   - `test:` 测试相关
   - `chore:` 构建/工具链更新

7. **推送到你的 Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

8. **创建 Pull Request**
   - 访问你的 Fork 在 GitHub 上的页面
   - 点击 "Pull Request" 按钮
   - 填写 PR 描述，说明：
     - 这个 PR 做了什么
     - 为什么需要这个更改
     - 如何测试

#### 代码规范

- 使用有意义的变量和函数名
- 添加必要的注释
- 保持代码整洁和可读
- 遵循现有的代码风格
- Vue 组件使用 Composition API
- 优先使用 `const`，必要时使用 `let`，避免 `var`

#### Pull Request 检查清单

- [ ] 代码能够正常运行
- [ ] 没有引入新的错误或警告
- [ ] 遵循项目的代码风格
- [ ] 添加了必要的文档
- [ ] 提交信息清晰且符合规范
- [ ] PR 描述详细

## 📖 开发指南

### 项目结构

```
src/
├── components/     # 可复用组件
├── views/          # 页面组件
├── stores/         # Pinia 状态管理
├── utils/          # 工具函数
├── router/         # 路由配置
└── assets/         # 静态资源
```

### 添加新功能

1. **新增页面**：在 `src/views/` 创建 Vue 组件
2. **新增组件**：在 `src/components/` 创建可复用组件
3. **新增路由**：在 `src/router/index.js` 添加路由配置
4. **新增状态**：在 `src/stores/` 创建或更新 store

### 测试

目前项目还没有配置自动化测试。在提交前请：

1. 手动测试所有受影响的功能
2. 在不同浏览器中测试（Chrome、Firefox、Safari）
3. 测试响应式布局（手机、平板、桌面）
4. 测试深色/浅色主题

## 🎨 设计规范

### 颜色

- Primary: `#3b82f6` (blue-500)
- Success: `#10b981` (green-500)
- Warning: `#f59e0b` (yellow-500)
- Error: `#ef4444` (red-500)

### 间距

使用 Tailwind 的间距系统：`p-4`, `m-2`, `gap-6` 等

### 组件

遵循现有组件的设计模式，保持一致性

## 📝 文档

如果你的贡献涉及到用户可见的变化，请：

1. 更新 `README.md`
2. 如果是新功能，在 `DEPLOY.md` 中添加说明
3. 添加代码注释

## 🐛 Bug 修复流程

1. 在 Issues 中找到或创建相关 Bug
2. 在本地复现 Bug
3. 创建修复分支：`fix/issue-number-description`
4. 修复 Bug 并测试
5. 提交 PR，引用对应的 Issue

## ⚖️ 许可证

提交代码即表示你同意你的贡献以 MIT 许可证发布。

## 💬 交流

- 在 Issues 中讨论问题和想法
- 保持友好和专业
- 尊重其他贡献者

## 🙏 感谢

每一个贡献都很重要，感谢你让这个项目变得更好！

---

如有问题，欢迎在 Issues 中提问。

