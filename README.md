# ichat-app

基于 WebRTC 的音视频聊天应用。

[ichat-go 后端项目地址](https://github.com/laishere/ichat-go)

[在线体验地址](https://chat.laishere.cn/)

## 演示

[录屏链接](/screenshots/demo.mp4)

**动图**

![演示GIF](/screenshots/demo.gif)

## 主要功能

- 基本用户登录注册
- 添加联系人
- 创建群组
- 聊天：文字、图片
- 聊天消息撤回
- 音视频通话：双人、多人；摄像头、麦克风、共享屏幕

## 架构

- React 框架
- Redux 状态管理
- React-Router 处理简单的路由
- antd UI 组件
- axios 处理 api 请求
- 业务逻辑

### 目录结构

| -              | 说明                   |
| -------------- | ---------------------- |
| src/           | 源代码目录             |
| src/assets     | 资源文件               |
| src/components | 可复用组件             |
| src/icons      | 简单地 SVG 图标封装    |
| src/lib/       | 主要业务逻辑目录       |
| src/pages      | 页面相关逻辑           |
| src/App.tsx    | App 组件模块，延迟加载 |
| src/main.tsx   | 入口组件               |
| src/routes.tsx | 页面路由               |

## 主要业务逻辑

### 业务状态

目录: src/lib/store

- **用户信息状态**: users.ts
  负责用户信息获取、查询
- **联系人状态**: contacts.ts
  负责联系人信息加载、插入、查询，维护当前选中的联系人
- **消息状态**: messages.ts
  - 负责聊天消息同步：历史消息加载、实时通知消息同步、实时通知会话重建后丢失消息同步。
  - 消息查询
  - 消息发送
  - 消息图片延迟上传
  - 消息撤回
- **StoreProvider**: StoreProvder.tsx
  负责维护、提供业务状态实例
- **其它**
  群组状态: groups.ts
  设置状态: settings.ts

### 实时通知

目录: src/lib/notification

- **通知客户端**: client.ts
  - ws 会话建立、维护
  - ws 消息接收处理
  - 心跳
  - 通知事件注册和分发
- **通知消费者**: consumers.tsx
  - 默认消费者：新消息、新联系人、新联系人请求
  - 同步消费者：监听会话建立，根据建立的会话 id 决定是否主动同步丢失的消息、联系人、联系人请求
- **通知 hook**: hook.ts
  - 当前只有一个 hook: useNotificationState，方便监听通知状态变化
- **NotificationProvider**: index.tsx
  - 提供 notification client
  - 根据登录用户变化维护 client 连接

### 通话

目录: src/lib/call

- **信令会话**: signaling.ts
  - ws 会话建立、维护
  - ws 消息接收处理
  - ws 消息发送接口
  - 心跳
- **WebRTC 会话**: session.ts
  - 为指定用户建立 WebRTC P2P 连接会话
  - SDP 协商
  - ICE Candidate 交换
  - 媒体流变更同步
  - 监听对方媒体流变化
- **通话客户端**： client.ts
  - 通话加入
  - 信令会话初始化
  - 信令心跳
  - 信令消息处理
  - 通话状态更新
  - 通话成员状态更新、WebRTC 会话维护
  - 本地媒体流维护
  - 回调：通话开始、结束、成员状态更新

## 开发

1. 启动后端
2. 初始化`npm install`
3. 启动开发`npm run dev`

## 打包

```sh
docker build . -t ichat-app:version
```

## 部署

1. 复制 docker/deploy 目录到目标机器
2. 进入该目录
3. 复制`config.yml.template`为`config.yml`，按需修改里面的参数
4. 使用 docker compose 部署：

```sh
docker compose up --pull always -d
```

> 注：config.yml 是后端配置文件，init.sql 是后端数据库表结构初始化定义，后端可能更改，可以到后端仓库复制最新的文件。
> 部署使用的是已经打包好的前后端镜像，也可以自己打包

### 其它注意事项

WebRTC 要求使用安全域名才能开启摄像头等媒体捕获。

1. 本地使用 localhost 域名
2. 配置服务器的 https 环境，前端镜像的 nginx 不包含 https 配置，可以加一层专门负责 https 的 nginx 代理服务器，注意配置 ws 代理（参考 docker/nginx/app.conf.template）
3. 打开`chrome://flags/#unsafely-treat-insecure-origin-as-secure`，强制 Chrome 信任目标域名，注意保存并重启
