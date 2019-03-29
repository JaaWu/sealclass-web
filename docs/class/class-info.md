## 课堂信息

![image](../image/class-info.png)

### 文件位置

`UI 模板`: components/class-info/class-info.html

`逻辑操作:` components/class-info/class-info.js

> data

|  属性名      | 类型     | 说明     |
| :---------- | :------- | :------- |
| roomId |  String | 房间号 |
| timer |  Object | 倒计时 |
| timer.time |  Number | 倒计时时间 |

> computed

|  属性名      | 类型     | 说明     |
| :---------- | :------- | :------- |
| formatedTime |  String | 格式化后的时间, 格式如: 02:09:29 |