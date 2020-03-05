(function (RongClass) {
  'use strict';

  var Event = {
    /* 用户加入 */
    USER_JOINED: 'user_joined',
    /* 用户离开 */
    USER_LEFT: 'user_left',
    /* 流已新增 */
    STREAM_ADDED: 'add_stream',
    /* 流已移除 */
    STREAM_REMOVED: 'remove_stream',
    /* 视频关闭 */
    VIDEO_DISABLED: 'video_disabled',
    /* 视频打开 */
    VIDEO_ENABLED: 'video_enabled',
    /* 静音 */
    AUDIO_MUTED: 'audio_muted',
    /* 关闭静音 */
    AUDIO_UNMUTED: 'audio_unmuted',
    /* 音视频断开 */
    RTC_ERRORED: 'rtc_errored',

    /* 接收消息 */
    MESSAGE_RECEIVED: 'message_received',
    /* 网络断开 */
    NETWORK_UNAVAILABLE: 'network_unavailable',
    /* 其他设备登录 */
    KICKED_OFFLINE_BY_OTHER_CLIENT: 'KICKED_OFFLINE_BY_OTHER_CLIENT',

    /* 用户列表改变 */
    USER_LIST_CHANGED: 'user_list_changed',
    /* 用户角色改变 */
    USER_ROLE_CHANGED: 'user_role_changed',
    /* 自己角色改变 */
    SELF_USER_ROLE_CHANGED: 'self_user_role_changed',
    /* 当前用户被踢 */
    SELF_USER_KICKED: 'self_user_kicked',
    /* 用户申请发言 */
    USER_APPLY_SPEECH: 'user_apply_speech',
    USER_APPLY_SPEECH_RESULT: 'user_apply_result',
    USER_RESULT_EXPIRED: 'user_apply_result_expired',
    /* 升级邀请 */
    USER_INVITE_UPGRADE: 'user_invite_upgrade',
    USER_INVITE_UPGRADE_RESULT: 'user_invite_upgrade_result',
    /* 开启设备邀请 */
    USER_INVITE_CONTROL_DEVICE: 'user_invite_control_device',
    USER_INVITE_CONTROL_DEVICE_RESULT: 'user_invite_control_device_result',

    /* 被要求转换摄像头 */
    USER_CLAIM_CAMERA_CHANGE: 'user_claim_camera_change',
    /* 被要求转换麦克风 */
    USER_CLAIM_MIC_CHANGE: 'user_claim_mic_change',
    /* 被要求共享区显示某类型 */
    USER_CLAIM_DISPLAY: 'user_claim_display',
    /* 白板被创建 */
    WHITEBOARD_CREATED: 'whiteboard_created',
    /* 白板被删除 */
    WHITEBOARD_DELETED: 'whiteboard_deleted',

    /* 房间销毁 */
    ROOM_DESTROY: 'room_destroy'
  };

  var SpecialErrorCode = {
    ERR_OVER_MAX_COUNT: 31
  };

  var RTCTag = {
    RTC: 'RongCloudRTC',
    SCREENSHARE: 'screenshare'
  };

  var RoomAction = {
    JOIN: 1,
    LEAVE: 2,
    KICK: 3,
    DESTROY: 4
  };

  var UpgradeAction = {
    INVITE: 1,
    REJECT: 2,
    APPROVE: 3
  };

  // var UpgradeActionMapEvent = (function () {
  //   var events = {};
  //   events[UpgradeAction.INVITE] = Event.USER_INVITE_UPGRADE;
  //   events[UpgradeAction.REJECT] = Event.USER_REJECT_UPGRADE;
  //   events[UpgradeAction.APPROVE] = Event.USER_APPROVE_UPGRADE;
  //   return events;
  // })();

  var DeviceResourceType = {
    MIC: 0,
    CAMERA: 1
  };

  var DevicePlatformType = {
    ANDROID: 1,
    IOS: 2,
    WEB: 3
  };

  var DisplayType = {
    ASSISTANT: 0,
    TEACHER: 1,
    WHITEBOARD: 2,
    SCREEN: 3,
    NONE: 4
  };

  // var Role = {
  //   ASSISTANT: 1,
  //   TEACHER: 2,
  //   STUDENT: 3,
  //   AUDIENCE: 4,
  //   1: 'teacher',
  //   2: 'student',
  //   3: 'student',
  //   20: 'student'
  // };

  var Role = {
    ASSISTANT: 10,
    TEACHER: 10,
    STUDENT: 20,
    AUDIENCE: 30,
    10: 'teacher',
    20: 'student'
  };

  var RolePriority = [Role.ASSISTANT, Role.STUDENT, Role.AUDIENCE ];

  var WhiteboardAction = {
    CREATE: 1,
    DELETE: 2
  };

  var StorageKey = {
    ROOM_ID: 'sroom',
    USER_NAME: 'student',
    COMPANY_ID: 'school'
  };

  var SpeechResultAction = {
    ACCEPT: 1,
    REJECT: 2
  };

  var DeviceControlAction = {
    INVITE: 1,
    REJECT: 2,
    APPROVE: 3
  };

  var DeviceControlType = {
    MICRO: 0,
    CAMERA: 1
  };

  var DialogType = {
    CONFIRM: 'confirm',
    CALL: 'call',
    ALERT: 'alert',
    LOADING: 'loading',
    TOAST: 'toast',
    APPLY: 'down_grade',
    BUTTONS: {
      CONFIRM: 'confirm',
      CANCEL: 'cancel',
      ACCEPT: 'accept',
      REJECT: 'reject'
    }
  };

  var Displays = {
    TEACHER: {
      ChooseResolution: false,
      CloseClass: true,
      InputEmoji: false,
      LoginAsAudience: false,
      OperateUser: true,
      CreateWhiteboard: true,
      CreateScreenShare: true,
      DisplaySelf: true,
      ShowChatAndUserListTab: false,
      MuteAllLocalMedia: false
    },
    STUDENT: {
      ChooseResolution: false,
      CloseClass: false,
      InputEmoji: false,
      LoginAsAudience: false,
      OperateUser: false,
      CreateWhiteboard: false,
      CreateScreenShare: false,
      DisplaySelf: false,
      ShowChatAndUserListTab: false,
      MuteAllLocalMedia: false
    }
  };

  RongClass = RongClass || {};
  RongClass.ENUM = {
    Event: Event,
    RTCTag: RTCTag,
    RoomAction: RoomAction,
    DevicePlatformType: DevicePlatformType,
    DeviceResourceType: DeviceResourceType,
    DisplayType: DisplayType,
    Role: Role,
    StorageKey: StorageKey,
    SpeechResultAction: SpeechResultAction,
    SpecialErrorCode: SpecialErrorCode,
    WhiteboardAction: WhiteboardAction,
    DialogType: DialogType,
    RolePriority: RolePriority,
    UpgradeAction: UpgradeAction,
    DeviceControlAction: DeviceControlAction,
    DeviceControlType: DeviceControlType,
    Displays: Displays
  };

})(window.RongClass);