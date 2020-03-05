## SeaLClass

### 文件位置

pages/dataModel.js

注: 所有用户数据存储于内存中, 存储变量: _Cache.userList

> SealClass Server 接口封装

#### joinClassRoom

加入房间

|  属性名      | 类型     | 说明     |
| :---------- | :------- | :------- |
| roomId | String |  房间号 |
| userName |  String | 用户名 |
| isAudience |  Boolean | 是否旁观者 |

#### leaveClassRoom

离开房间

|  属性名      | 类型     | 说明     |
| :---------- | :------- | :------- |
| roomId | String |  房间号 |

#### kickMember

踢人

|  属性名      | 类型     | 说明     |
| :---------- | :------- | :------- |
| userId | String |  被踢者用户 id |

#### createWhiteboard

创建白板

#### deleteWhiteboard

删除白板

|  属性名      | 类型     | 说明     |
| :---------- | :------- | :------- |
| whiteboardId | String |  白板 id |

#### closeCamera

关闭用户摄像头

|  属性名      | 类型     | 说明     |
| :---------- | :------- | :------- |
| userId | String |  被关闭者用户 id |

#### closeMicphone

关闭用户麦克风

|  属性名      | 类型     | 说明     |
| :---------- | :------- | :------- |
| userId | String |  被关闭者用户 id |

#### inviteOpenCamera

邀请用户开启摄像头

|  属性名      | 类型     | 说明     |
| :---------- | :------- | :------- |
| userId | String |  被邀请者 id |

#### inviteOpenMicro

邀请用户开启麦克风

|  属性名      | 类型     | 说明     |
| :---------- | :------- | :------- |
| userId | String |  被邀请者 id |

#### approveOpenDevice

同意开启设备

|  属性名      | 类型     | 说明     |
| :---------- | :------- | :------- |
| ticket | String |  令牌, 在被邀请的消息中获取 |

#### rejectOpenDevice

拒绝开启设备

|  属性名      | 类型     | 说明     |
| :---------- | :------- | :------- |
| ticket | String |  令牌, 在被邀请的消息中获取 |

#### downgrade

降级

|  属性名      | 类型     | 说明     |
| :---------- | :------- | :------- |
| users | Array |  用户列表 |

#### display

展示共享区

|  属性名      | 类型     | 说明     |
| :---------- | :------- | :------- |
| displayParams | Object |  展示内容 |
| displayParams.userId | String |  展示的用户 id |
| displayParams.type | String |  展示的类型, 分为: 视频、屏幕共享、白板 |
| displayParams.uri | String |  展示的白板 uri |

#### transfer

转让老师

|  属性名      | 类型     | 说明     |
| :---------- | :------- | :------- |
| userId | String |  用户 id |

#### setTeacher

设置老师

|  属性名      | 类型     | 说明     |
| :---------- | :------- | :------- |
| userId | String |  用户 id |

#### applySpeech

申请发言

#### approveSpeech

同意旁观者的发言

|  属性名      | 类型     | 说明     |
| :---------- | :------- | :------- |
| ticket | String |  令牌, 在申请的消息中获取 |

#### rejectSpeech

拒绝旁观者的发言

|  属性名      | 类型     | 说明     |
| :---------- | :------- | :------- |
| ticket | String |  令牌, 在申请的消息中获取 |

#### inviteUpgrade

邀请升级

|  属性名      | 类型     | 说明     |
| :---------- | :------- | :------- |
| userId | String |  用户 id |
| role | Number |  角色, 默认为学员 |

#### approveUpgrade

同意升级, 同意后自己变为学员

|  属性名      | 类型     | 说明     |
| :---------- | :------- | :------- |
| ticket | String |  令牌, 在被邀请的消息中获取 |

#### rejectUpgrade

拒绝升级

|  属性名      | 类型     | 说明     |
| :---------- | :------- | :------- |
| ticket | String |  令牌, 在被邀请的消息中获取 |