## SealClass Web

基于 RongRTC、RongIMLib 的在线课堂 Demo

## 快速运行

1、通过[融云官网](https://developer.rongcloud.cn/signup?_blank)注册账号, 获取 AppKey

2、按步骤启动 [SealClass Server](https://github.com/rongcloud/sealclass-server?_blank)

3、将 AppKey、Server 地址 填入 setting.js

4、将 Web 项目放入 nginx、apache 等服务器中

5、服务器开启 ssi 功能, 支持 html 引入

`nginx 配置 ssi 示例:`

```js
server {
  listen 80;
  server_name  www.test.com;
  location / {
    ssi on;
    root /usr/local/sealclass-web;
  }
}
```

6、启动 sealclass-web/index.html

## 基础架构

1、项目使用原生 Vue.js 开发

2、白板: 采用第三方 herewhite , 集成文档[https://developer.netless.link/](https://developer.netless.link/)

注: 未使用 webpack、vue-cli、jQuery 等工具

## 功能模块

`配置文件`

> setting.js

`基础页面`

| 模块名        | 说明     |
| :---------- | :------- |
| [login](./docs/login.md) |  登录页面  |
| [class](./docs/class.md) |  课堂页面  |

`课堂模块`

| 模块名        | 说明     |
| :---------- | :------- |
| [chat](./docs/class/chat.md) |  聊天功能  |
| [rtc](./docs/class/rtc.md) |  音视频功能  |
| [user-list](./docs/class/user-list.md) |  用户列表  |
| [display](./docs/class/display.md) |  共享展示区  |
| [whiteboard](./docs/class/whiteboard.md) |  白板  |
| [class-info](./docs/class/class-info.md) |  课堂信息  |
| [emoji-panel](./docs/class/emoji-panel.md) |  Emoji 选择区  |
| [user-avatar](./docs/class/user-avatar.md) |  用户头像  |

`公共弹框`

| 模块名        | 说明     |
| :---------- | :------- |
| [dialog](./docs/dialog/dialog.md) |  公共弹框  |
| [degrade](./docs/dialog/degrade.md) |  降级弹框  |
| [rtc-window](./docs/dialog/rtc-window.md) |  大屏视频框  |

`数据管理`

| 模块名        | 说明     |
| :---------- | :------- |
| [SealClass](./docs/datamodel/sealClass.md) |  SealClass 相关数据管理、接口调用  |
| [RTC](./docs/datamodel/rtc.md) |  RTC 音视频  |
| [IM](./docs/datamodel/im.md) |  IM 即时通讯  |

## 目录结构

```
├── assets 静态资源
│   ├── css
│   │   ├── common.scss 公共样式
│   │   ├── class.scss 课堂页面样式
│   │   ├── login.scss 登录页面样式
│   │   └── setting.scss 此 scss 为设置项, 不直接引入页面, 而是引入其他 scss
│   ├── img 图片资源
│   ├── js
│   │   ├── RongEmoji-2.2.7.js 表情库
│   │   ├── RongIMLib-2.4.1.js IM SDK
│   │   ├── protobuf-2.3.4.min.js
│   │   ├── RongRTC.3.0.0.js RTC SDK
│   │   ├── media.js 媒体流组件
│   │   ├── screenshare.js 屏幕共享组件
│   │   ├── vue-2.6.7.js Vue
│   │   └── vue-router-3.0.2.js Vue-router
│   └── plugin
│       └── screenshare-addon.zip 屏幕共享插件
├── attach
│   ├── favicon.html 页面图标(base64)
│   └── head-static.html 引入静态资源
├── import-tpl.html 引入 html 模板
├── router
│   └── routes.js 路由配置
├── common
│   ├── utils.js 工具方法
│   ├── common.js SealClass 相关公共方法
│   ├── enum.js 枚举值
│   ├── error-code.js 错误码
│   ├── locale 多语言
│   │   ├── en.js 英文
│   │   └── zh.js 中文
│   └── mixins.js 混入 vue 组件
├── pages 页面
│   ├── login 登录页面
│   │   ├── login.html
│   │   └── login.js
│   ├── class 课堂页面
│   │   ├── class.html
│   │   └── class.js
│   ├── datamodel.js 数据操作, 包括 数据缓存、Http 请求封装等
│   └── main.js
├── components 组件
│   ├── class-info 课堂信息
│   │   ├── class-info.html
│   │   └── class-info.js
│   ├── rtc 音视频
│   │   ├── rtc.html
│   │   ├── rtc.js
│   │   ├── datamodel.js 数据操作, 包括 RTC 初始化、RTC 推流、RTC 取消推流、RTC 事件发送等
│   │   ├── rtc-user 音视频用户展示
│   │   │   ├── rtc-user.html
│   │   │   └── rtc-user.js
│   │   └── self-rtc-operate 登录用户操作
│   │       ├── self-rtc-operate.html
│   │       └── self-rtc-operate.js
│   ├── chat 聊天区
│   │   ├── datamodel.js 数据操作, 包括 IM 初始化、IM 发送封装、IM 获取封装、IM 事件发送等
│   │   ├── chat.html 
│   │   ├── chat.js
│   │   ├── message-input 输入框
│   │   │   ├── message-input.html
│   │   │   └── message-input.js
│   │   └── message-list 消息列表
│   │       ├── message-list.html 
│   │       ├── message-list.js
│   │       ├── text 文字消息
│   │       ├── file 文件消息
│   │       ├── image 图片消息
│   │       ├── assistant-transfer 老师转让消息
│   │       └── role-change 角色变化消息
│   ├── emoji-panel Emoji 选择框
│   │   ├── emoji-panel.html
│   │   └── emoji-panel.js
│   ├── display 展示区
│   │   ├── display.html
│   │   ├── display.js
│   │   └── resource-list 资源库
│   │       ├── resource-list.html
│   │       └── resource-list.js
│   ├── user-avatar 用户头像
│   │   ├── user-avatar.html
│   │   └── user-avatar.js
│   ├── user-list 用户列表
│   │   ├── user-list.html
│   │   ├── user-list.js
│   │   └── user-opt
│   │       ├── user-opt.html
│   │       └── user-opt.js
│   └── whiteboard 白板
│       ├── whiteboard.html
│       └── whiteboard.js
├── dialog 弹框
│   ├── dialog.html
│   ├── dialog.js
│   ├── create-wb 创建白板弹框
│   │   ├── create-wb.html
│   │   └── create-wb.js
│   ├── degrade 降级弹框
│   │   ├── degrade.html
│   │   └── degrade.js
│   └── rtc-window 视频大窗口弹框
│       ├── rtc-window.html
│       └── rtc-window.js
├── new-whiteboard 第三方白板模块
├── setting.js 配置项
└── index.html 首页
```