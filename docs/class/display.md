## 共享展示区

![image](../image/display.png)

### 文件位置

`UI 模板`: components/display/display.html

`逻辑操作:` components/display/display.js

> props

|  属性名      | 类型     | 说明     |
| :---------- | :------- | :------- |
| loginUser | Object |  登录用户 |
| userList |  Array | 房间人员列表 |
| assistant |  Object | 助教 |
| teacher |  Object | 老师  |

> data

|  属性名      | 类型     | 说明     |
| :---------- | :------- | :------- |
| display | Object |  展示信息 |
| whiteboardList |  Array | 白板列表 |
| isShowResourceList |  Boolean | 是否展示资源库列表 |
| isScreenSharePublished |  Boolean | 是否已发布屏幕共享流  |

> computed

|  属性名      | 类型     | 说明     |
| :---------- | :------- | :------- |
| hasOptPermission | Boolean |  是否有操作(打开资源库、屏幕共享、新建白板)权限 |
| hasDisplayAuth |  Boolean | 是否有展示权限 |

> methods

#### displayRecent

展示

|  属性名      | 类型     | 说明     |
| :---------- | :------- | :------- |
| displayParams | Object |  展示信息 |

#### createWhiteboard

创建白板

#### displayScreenShare

展示屏幕共享

#### getUserById

根据 id 获取用户详情