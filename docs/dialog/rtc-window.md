## 视频大窗口

![image](../image/rtc-window.png)

### 文件位置

`UI 模板`: dialog/dialog/rtc-window.html

`逻辑操作:` dialog/dialog/rtc-window.js

> data

|  属性名      | 类型     | 说明     |
| :---------- | :------- | :------- |
| user | Object |  用户 |

> computed

|  属性名      | 类型     | 说明     |
| :---------- | :------- | :------- |
| displayUserName | String |  展示名字 |
| isVideoOpened | Boolean |  是否已开启摄像头 |
| isAudience | Boolean |  是否为旁听者 |