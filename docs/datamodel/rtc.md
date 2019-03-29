## RTC

### 文件位置

components/rtc/dataModel.js

> RTC 接口封装

#### init

连接 RTC, 包含: 初始化、监听房间人员变化、监听流变化、加入房间

#### leave

离开房间

#### publishSelf

推送自己的音视频流

|  属性名      | 类型     | 说明     |
| :---------- | :------- | :------- |
| resolution | Object |  分辨率 |
| videoEnable |  Boolean | 是否开启视频 |
| audioEnable |  Boolean | 是否开启音频 |

#### unPublishSelf

取消推送自己的音视频流

#### openVideo

开启视频

|  属性名      | 类型     | 说明     |
| :---------- | :------- | :------- |
| user | Object |  用户 |

#### openAudio

开启音频

|  属性名      | 类型     | 说明     |
| :---------- | :------- | :------- |
| user | Object |  用户 |

#### closeVideo

关闭视频

|  属性名      | 类型     | 说明     |
| :---------- | :------- | :------- |
| user | Object |  用户 |

#### closeAudio

关闭音频

|  属性名      | 类型     | 说明     |
| :---------- | :------- | :------- |
| user | Object |  用户 |

#### publishScreenShare

推送屏幕共享流

#### unPublishScreenShare

取消推送屏幕共享流