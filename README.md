# DSH History Tree 插件 (Codex-style 对话轮次时间线)

为 DeepSeek Harness (DSH) Web 界面提供与 Codex 1:1 一致的**对话轮次时间线点阵**与**悬浮历史概览卡片**。

[![npm version](https://img.shields.io/npm/v/dsh-history-tree.svg)](https://www.npmjs.com/package/dsh-history-tree)
[![npm downloads](https://img.shields.io/npm/dm/dsh-history-tree.svg)](https://www.npmjs.com/package/dsh-history-tree)

---

## 🌟 核心特性

1. **左侧固定垂直居中时间线点阵（Timeline Rail）**：
   - 紧贴工作区/侧边栏右分界线，固定在视口垂直居中位置，不随消息滚动位移；
   - 严格按**右侧真实用户提问**生成横向刻度点（排除产物、工具执行与系统占位节点）；
   - 支持对话轮次过多时的自适应最大高度限制（`max-height`）与鼠标滚轮平滑滚动。
2. **经典鱼眼波浪放大动效（Fish-eye Magnification）**：
   - 鼠标滑过时呈现丝滑的阶梯波浪扩散放大（26px / 19px / 14px / 10px / 8px）。
3. **极简毛玻璃悬浮概览卡片（Hover Overview Card）**：
   - **第一行**：用户提问纯文本（无冗余时间标签）；
   - **第二行**：模型最终回复与说明正文（严格过滤 Think 思考过程、Bash 工具执行与文件产物）；
   - **底部元数据**：发送时间 · 用时 · Token/吞吐率单行展示；
   - **点击精准直达**：点击任意刻度点或悬浮卡片，平滑滚动至对应对话轮次。
4. **顶部自动拉取（Auto Load Older）**：
   - 鼠标悬停在顶部刻度或向上滚轮触顶时，自动触发「加载更早」历史会话，动态向上延长刻度点阵。

---

## 📦 如何安装与配置到 DSH

DSH 采用 Cordis 模块化微内核架构，你可以通过以下方式安装该插件：

### 方法一：通过 NPM 线上源安装（推荐）

#### 1. 使用 DSH 官方 CLI 命令一键安装

```bash
dsh plugin --profile web add -w dsh-history-tree
```

#### 2. 或者在 Web Profile 目录下通过 npm/pnpm 安装

```bash
cd ~/.dsh/profiles/web
npm i dsh-history-tree
# 或使用 pnpm
pnpm add -w dsh-history-tree
```

安装完成后，请确认 `~/.dsh/profiles/web/package.json` 中的 `dsh.profile.bundles` 数组已包含 `dsh-history-tree`：

```json
{
  "name": "dsh-profile-web",
  "private": true,
  "dependencies": {
    "dsh-history-tree": "^1.0.0"
  },
  "dsh": {
    "profile": {
      "bundles": [
        "@deepseek-ai/dsh-base",
        "@deepseek-ai/dsh-web-app",
        "dsh-history-tree"
      ]
    }
  }
}
```

---

### 方法二：通过本地源码目录（Link 方式）安装

如果你在本地开发该插件，可以使用本地链接方式安装：

```bash
# 将本地插件目录以 link 方式添加至 web profile 的依赖中
dsh plugin --profile web add -w "link:/path/to/dsh/plugin/dsh-history-tree"
```

> **注意**：如果执行 `add` 后启动报错提示子包重复声明，请检查 `~/.dsh/profiles/web/package.json` 中的 `dsh.profile.bundles` 数组，确保其中仅包含根包（如 `dsh-history-tree`、`@linxin666/dsh-web-ui-all` 等），避免包含子组件包。

---

## 🚀 启动与体验

启动 DSH Web 服务：

```bash
dsh --profile web
# 或者
dsh web
```

打开浏览器访问 [http://127.0.0.1:3080/](http://127.0.0.1:3080/)，打开任意包含多轮问答的对话，即可在左侧看到垂直居中的时间线点阵。

---

## 📂 项目结构

```text
dsh-history-tree/
├── cordis.patch.yml   # Cordis 插件 Profile 声明补丁
├── package.json       # 模块清单与 client 端 inject 依赖
├── README.md          # 插件说明文档
└── lib/
    ├── index.js       # Host 端（服务端）入口
    └── client.js      # Client 端（前端鱼眼动效、DOM提取、卡片渲染逻辑）
```
