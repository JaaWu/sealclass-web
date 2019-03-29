## 公共弹框

### 文件位置

`UI 模板`: dialog/dialog.html

`逻辑操作:` dialog/dialog.js

> confirm

`提示框`

![image](../image/confirm.png)

|  属性名      | 类型     | 说明     |
| :---------- | :------- | :------- |
| title | String | 标题 |
| content |  String | 提示内容 |
| confirmed |  Function | 确定后的回调 |
| canceled |  Function | 取消后的回调  |

> call

`呼叫框`

![image](../image/call.png)

|  属性名      | 类型     | 说明     |
| :---------- | :------- | :------- |
| user | Object | 用户 |
| accpeted |  Function | 确定后的回调 |
| rejected |  Function | 拒绝后的回调  |

> apply

`降级请求框`

![image](../image/apply.png)

|  属性名      | 类型     | 说明     |
| :---------- | :------- | :------- |
| user | Object | 用户 |
| content |  String | 提示内容 |
| rejected |  Function | 点击拒绝后的回调 |
| degraded |  Function | 点击降级后的回调  |

> alert

`确定提示框`

![image](../image/alert.png)

|  属性名      | 类型     | 说明     |
| :---------- | :------- | :------- |
| content |  String | 提示内容 |
| destroyTimeout |  Number | 销毁时间 |

> toast

`提示框`

![image](../image/toast.png)

|  属性名      | 类型     | 说明     |
| :---------- | :------- | :------- |
| content |  String | 提示内容 |
| destroyTimeout |  Number | 销毁时间 |