## 白板

### 文件位置

`UI 模板`: components/rtc/whiteboard/whiteboard.html

`逻辑操作:` components/rtc/whiteboard/whiteboard.js

> props

|  属性名      | 类型     | 说明     |
| :---------- | :------- | :------- |
| display | Object |  当前共享区展示 |

> data

|  属性名      | 类型     | 说明     |
| :---------- | :------- | :------- |
| izZoom | Boolean |  是否已放大 |

> computed

|  属性名      | 类型     | 说明     |
| :---------- | :------- | :------- |
| displayUrl | String |  展示的白板 url |

> methods

#### entryFullScreen

进入全屏

#### cancelFullScreen

取消全屏

#### watchWindowResize

全屏时, 如果窗口尺寸改变, 则取消全屏