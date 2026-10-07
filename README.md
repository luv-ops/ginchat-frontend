# gin-chat-react

QQ 风格的即时通讯应用前端，使用 **React 19 + TypeScript + Vite** 构建

后端为 Go + Gin 实现的 [GinChat](../GinChat)，提供 HTTP 接口与 WebSocket 长连接。

## 技术栈

| 分类 | 技术 | 说明 |
|------|------|------|
| 视图框架 | React 19 | 函数组件 + Hooks |
| 开发语言 | TypeScript | 严格模式（`noUnusedLocals` / `verbatimModuleSyntax`） |
| 构建工具 | Vite 8 | 路由级懒加载分包 |
| 路由 | react-router-dom 7 | `HashRouter`（hash 模式） |
| 状态管理 | Zustand 5 | 替代 Vue 版的 Pinia |
| HTTP | axios | 统一实例 + 拦截器 |
| 工具库 | lodash | 使用 `debounce` 处理滚动分页 |
| 代码检查 | oxlint | `react` / `typescript` 插件 |

## 功能

- 账号注册、登录 / 退出（JWT，token 24 小时有效期）
- 单聊与群聊，文字 / 图片 / 音频消息发送
- 聊天页面引入高性能虚拟列表
- WebSocket 实时消息推送：心跳保活（ping/pong）、断线指数退避重连、网络状态与页面可见性监听
- 会话列表、未读数统计与清零
- 历史消息分页加载（上滑加载更早消息，滚动位置自动补偿）
- 好友：搜索添加、好友请求审批（含未读数字徽标）、好友资料
- 群组：创建群聊、群详情、邀请好友入群、群成员分页
- 个人资料编辑、动态页（静态展示）
- 底部 TabBar（消息 / 联系人 / 动态 / 我），联系人 tab 好友请求未读徽标

## 快速开始

### 环境要求

- Node.js 18+
- 后端服务 [GinChat](../GinChat) 运行在 `http://127.0.0.1:8080`

### 安装与运行

```bash
npm install
npm run dev
```

启动后访问终端提示的地址（默认 `http://127.0.0.1:5173`）。

### 其他命令

```bash
npm run build     # 类型检查 + 生产构建，输出到 dist/
npm run preview   # 本地预览生产构建
npm run lint      # oxlint 代码检查
```

## 后端连接配置

前端当前**直连**后端，地址写死在以下两个文件，如后端端口或部署地址变化需同步修改：

- HTTP 基础地址：[src/utils/request.ts](src/utils/request.ts) 中的 `baseURL: 'http://127.0.0.1:8080'`
- WebSocket 地址：[src/utils/websocket.ts](src/utils/websocket.ts) 中的 `ws://127.0.0.1:8080/ws/${token}`

说明：

- 登录成功后后端返回的 token 本身带 `Bearer ` 前缀，前端原样存储；WebSocket 鉴权时将其拼在 URL path 上（`/ws/Bearer%20<jwt>`），由后端中间件解析。
- 后端 CORS 允许跨域，因此开发环境无需配置 Vite 代理。

## 目录结构

```
src/
├── api/                 # 接口封装
│   ├── user.ts          # 用户、好友、会话相关接口
│   └── message.ts       # 历史消息接口
├── components/          # 通用组件
│   ├── TabBar.tsx       # 底部导航（含好友请求未读徽标）
│   ├── EmojiPicker.tsx  # 表情选择
│   └── AddFriendModal.tsx
├── router/              # 路由
│   ├── index.tsx        # 路由表（懒加载）
│   └── guards.tsx       # RequireAuth / RedirectIfLoggedIn 守卫
├── store/
│   └── chat.ts          # Zustand 全局状态（会话/联系人/消息/好友请求）
├── types/
│   └── index.ts         # 全局 TypeScript 类型
├── utils/
│   ├── request.ts       # axios 实例与拦截器
│   ├── websocket.ts     # WebSocket 客户端（心跳/重连）
│   ├── formatTime.ts    # 时间格式化
│   └── error.ts         # 错误信息提取
├── views/               # 页面（每个页面配套 .module.css）
├── App.tsx              # 应用外壳：Router + WS 生命周期 + TabBar
└── main.tsx             # 入口
```

## 路由表

| 路径 | 页面 | 是否需要登录 |
|------|------|:---:|
| `/login` | 登录 | 否（已登录重定向到 `/message`） |
| `/register` | 注册 | 否 |
| `/message` | 消息列表 | 是 |
| `/chat/:id` | 聊天窗口 | 是 |
| `/contact` | 联系人 | 是 |
| `/friend-requests` | 好友请求 | 是 |
| `/friend-detail/:id` | 好友详情 | 是 |
| `/dynamic` | 动态 | 是 |
| `/profile` | 个人资料 | 是 |
| `/create-group` | 创建群聊 | 是 |
| `/group-detail/:id` | 群详情 | 是 |
| `/group-members/:id` | 群成员 | 是 |

聊天、群详情、群成员页面不显示底部 TabBar。


