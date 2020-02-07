(function (RongClass, dependencies) {
  'use strict';
  var utils = RongClass.utils,
    common = RongClass.common,
    RongIMLib = dependencies.RongIMLib,
    RongIMClient = RongIMLib.RongIMClient,
    win = dependencies.win,
    emitter = utils.EventEmitter,
    UploadUrl = RongClass.setting.upload.url,
    server = RongClass.dataModel.server;

  var ErrorCode = RongClass.ErrorCode,
    ENUM = RongClass.ENUM,
    RoomAction = ENUM.RoomAction,
    DisplayType = ENUM.DisplayType,
    RoleENUM = ENUM.Role,
    DeviceResourceType = ENUM.DeviceResourceType,
    Event = ENUM.Event,
    UpgradeAction = ENUM.UpgradeAction,
    DeviceControlAction = ENUM.DeviceControlAction;

  var RoomConversationType = RongIMLib.ConversationType.GROUP;

  var handleRoomMemberChangeMessage = function (message) {
    var server = RongClass.dataModel.server;
    // 区分 joined || leave || kick
    // emit 相关事件
    var content = message.content,
      action = content.action,
      userId = content.userId;
    switch(action) {
    case RoomAction.JOIN:
      emitter.emit(Event.USER_JOINED, content);
      break;
    case RoomAction.LEAVE:
      emitter.emit(Event.USER_LEFT, content);
      break;
    case RoomAction.KICK:
      var loginUser = server.getLoginUser(),
        loginUserId = common.getUserId(loginUser);
      if (loginUserId === userId) {
        emitter.emit(Event.SELF_USER_KICKED, content);
      }
      emitter.emit(Event.USER_LEFT, content);
      break;
    }
  };

  var MessageHandler = {
    RoomMemberChangeMessage: handleRoomMemberChangeMessage,
    RoleChangedMessage: function (message) {
      var users = message.content.users;
      users.forEach(function (user) { // 兼容 server 不下发 userName
        var oldUser = server.getUserById(user.userId);
        user.userName = oldUser.userName;
      });
      emitter.emit(Event.USER_ROLE_CHANGED, users);
    },
    DeviceResourceMessage: function (message) {
      var selfUser = server.getLoginUser(),
        selfUserId = common.getUserId(selfUser);
      // 区分 mic || camera
      var content = message.content,
        fromUserId = message.content.userId,
        isMic = content.type === DeviceResourceType.MIC,
        eventName = isMic ? Event.USER_CLAIM_MIC_CHANGE : Event.USER_CLAIM_CAMERA_CHANGE;
      if (selfUserId === fromUserId) {
        emitter.emit(eventName, content.enable);
      }
    },
    DisplayMessage: function (message) {
      var display = message.content.display,
        displayParams;
      if (display) {
        displayParams = common.formatDisplayString(display);
      } else {
        displayParams = { type: DisplayType.NONE, whiteboardId: null, userId: '' };
      }
      displayParams.userId = displayParams.userId || message.senderUserId;
      emitter.emit(Event.USER_CLAIM_DISPLAY, displayParams);
      common.console.log(message.content);
    },
    WhiteboardMessage: function (message) {
      var WhiteboardAction = ENUM.WhiteboardAction;
      var content = message.content,
        action = content.action;
      var eventName = action === WhiteboardAction.CREATE ? Event.WHITEBOARD_CREATED : Event.WHITEBOARD_DELETED;
      emitter.emit(eventName, content);
    },
    ApplyForSpeechMessage: function (message) {
      var server = RongClass.dataModel.server;
      var content = message.content,
        userId = content.reqUserId,
        userName = content.reqUserName || server.getUserById(userId).userName;
      var reqUser = common.generateUser(userId, userName);
      content.reqUser = reqUser;
      emitter.emit(Event.USER_APPLY_SPEECH, content);
    },
    SpeechResultMessage: function (message) {
      var content = message.content;
      emitter.emit(Event.USER_APPLY_SPEECH_RESULT, content);
    },
    TicketExpiredMessage: function (message) {
      var server = RongClass.dataModel.server;
      var content = message.content,
        fromUserId = content.fromUserId;
      if (fromUserId === server.getLoginUserId()) {
        var toUserId = content.toUserId;
        var user = server.getUserById(toUserId);
        emitter.emit(Event.USER_RESULT_EXPIRED, user);
      }
    },
    AssistantTransferMessage: function (message) {
      var content = message.content,
        opUserId = content.opUserId,
        toUserId = content.toUserId;
      var upgradeUser = { userId: toUserId, role: RoleENUM.ASSISTANT };
      var downgradeUser = { userId: opUserId, role: RoleENUM.STUDENT };
      emitter.emit(Event.USER_ROLE_CHANGED, [upgradeUser, downgradeUser]);
    },
    UpgradeRoleMessage: function (message) {
      var content = message.content,
        action = content.action,
        user = common.generateUser(content.opUserId, content.opUserName);
      content.opUser = user;
      if (action === UpgradeAction.INVITE) {
        return emitter.emit(Event.USER_INVITE_UPGRADE, content);
      }
      emitter.emit(Event.USER_INVITE_UPGRADE_RESULT, content);
    },
    ControlDeviceNotifyMessage: function (message) {
      var content = message.content,
        action = content.action;
      content.opUser = common.generateUser(content.opUserId, content.opUserName);
      if (action === DeviceControlAction.INVITE) {
        return emitter.emit(Event.USER_INVITE_CONTROL_DEVICE, content);
      }
      emitter.emit(Event.USER_INVITE_CONTROL_DEVICE_RESULT, content);
    }
  };

  /**
   * 设置状态监听器
   */
  function setStatusListener() {
    RongIMClient.setConnectionStatusListener({
      onChanged: function (status) {
        switch (status) {
        case RongIMLib.ConnectionStatus.CONNECTION_CLOSED:
        case RongIMLib.ConnectionStatus.NETWORK_UNAVAILABLE:
          emitter.emit(Event.NETWORK_UNAVAILABLE);
          break;
        case RongIMLib.ConnectionStatus.KICKED_OFFLINE_BY_OTHER_CLIENT:
          emitter.emit(Event.KICKED_OFFLINE_BY_OTHER_CLIENT);
          break;
        }
        common.console.log('connect change:' + status);
      }
    });
  }

  function isRoomMessage(message) {
    var conversationType = message.conversationType,
      targetId = message.targetId;
    var instance = RongClass.instance || {},
      auth = instance.auth || {},
      roomId = auth.roomId;
    return conversationType === RoomConversationType && roomId === targetId;
  }

  /**
   * 设置消息监听器
   */
  function setMessageListener() {
    RongIMClient.setOnReceiveMessageListener({
      onReceived: function (message) {
        common.console.warn({ receiveMsg: message, isHandle: isRoomMessage(message) });
        if (isRoomMessage(message)) {
          var event = MessageHandler[message.messageType] || utils.noop;
          event(message);
          emitter.emit(Event.MESSAGE_RECEIVED, message);
        }
      }
    });
  }

  /**
   * 注册自定义消息
   */
  function registerMessages() {

    /* 计数存储消息注册 */
    var isCounted = true;
    var isPersited = true;

    // 角色改变消息
    var messageName = 'RoleChangedMessage';
    var objectName = 'SC:RCMsg';
    var messageTag = new RongIMLib.MessageTag(isCounted, isPersited);
    var prototypes = ['users', 'opUserId'];
    RongIMClient.registerMessageType(messageName, objectName, messageTag, prototypes);    

    /* 不计数不存储消息注册 */
    isCounted = false;
    isPersited = false;

    // 房间用户改变消息
    messageName = 'RoomMemberChangeMessage';
    objectName = 'SC:RMCMsg';
    messageTag = new RongIMLib.MessageTag(isCounted, isPersited);
    prototypes = ['userId', 'action', 'role', 'userName', 'timestamp'];
    RongIMClient.registerMessageType(messageName, objectName, messageTag, prototypes);
    
    // 白板改变消息
    messageName = 'WhiteboardMessage';
    objectName = 'SC:WBMsg';
    messageTag = new RongIMLib.MessageTag(isCounted, isPersited);
    prototypes = ['action', 'whiteboardId', 'whiteboardName'];
    RongIMClient.registerMessageType(messageName, objectName, messageTag, prototypes);

    // 被要求资源改变消息
    messageName = 'DeviceResourceMessage';
    objectName = 'SC:DRMsg';
    messageTag = new RongIMLib.MessageTag(isCounted, isPersited);
    prototypes = ['enable', 'type', 'userId'];
    RongIMClient.registerMessageType(messageName, objectName, messageTag, prototypes);

    // 共享展示消息
    messageName = 'DisplayMessage';
    objectName = 'SC:DisplayMsg';
    messageTag = new RongIMLib.MessageTag(isCounted, isPersited);
    prototypes = ['display'];
    RongIMClient.registerMessageType(messageName, objectName, messageTag, prototypes);

    // 请求发言消息
    messageName = 'ApplyForSpeechMessage';
    objectName = 'SC:RSMsg';
    messageTag = new RongIMLib.MessageTag(isCounted, isPersited);
    prototypes = ['reqUserId', 'reqUserName', 'ticket'];
    RongIMClient.registerMessageType(messageName, objectName, messageTag, prototypes);

    // 请求发言回应消息
    messageName = 'SpeechResultMessage';
    objectName = 'SC:SRMsg';
    messageTag = new RongIMLib.MessageTag(isCounted, isPersited);
    prototypes = ['opUserId', 'opUserName', 'action', 'reqUserId', 'reqUserName'];
    RongIMClient.registerMessageType(messageName, objectName, messageTag, prototypes);

    // 请求发言回应超时
    messageName = 'TicketExpiredMessage';
    objectName = 'SC:TEMsg';
    messageTag = new RongIMLib.MessageTag(isCounted, isPersited);
    prototypes = ['ticket', 'fromUserId', 'toUserId'];
    RongIMClient.registerMessageType(messageName, objectName, messageTag, prototypes);

    // 转让助教消息
    messageName = 'AssistantTransferMessage';
    objectName = 'SC:ATMsg';
    messageTag = new RongIMLib.MessageTag(isCounted, isPersited);
    prototypes = ['opUserId', 'toUserId'];
    RongIMClient.registerMessageType(messageName, objectName, messageTag, prototypes);

    // 定向消息, 旁观者升级消息
    messageName = 'UpgradeRoleMessage';
    objectName = 'SC:IURMsg';
    messageTag = new RongIMLib.MessageTag(isCounted, isPersited);
    prototypes = ['opUserId', 'opUserName', 'action', 'role', 'ticket'];
    RongIMClient.registerMessageType(messageName, objectName, messageTag, prototypes);

    // 定向消息, 助教邀请成员变更设备状态
    messageName = 'ControlDeviceNotifyMessage';
    objectName = 'SC:CDNMsg';
    messageTag = new RongIMLib.MessageTag(isCounted, isPersited);
    prototypes = ['action', 'type', 'opUserId', 'opUserName', 'ticket'];
    RongIMClient.registerMessageType(messageName, objectName, messageTag, prototypes);
  }

  /**
   * 初始化 IM
   * @param {object} params 
   * @param {String} params.appKey
   * @param {String} params.navi
   * @param {String} params.api
   * @param {String} params.protobuf
   * @param {String} params.token
   */
  function init(params) {
    params = params || {};
    
    var config = {};

    if (params.navi) {
      config.navi = params.navi;
    }
    if (params.protobuf) {
      config.protobuf = params.protobuf;
    }
    if (params.api) {
      config.api = params.api;
    }

    try {
      RongIMClient.getInstance().disconnect();
    } catch(e) {
      // do nothing
    }

    RongIMClient.init(params.appKey, null, config);
    registerMessages();
    setStatusListener();
    setMessageListener();
    return new win.Promise(function (resolve, reject) {
      RongIMClient.connect(params.token, {
        onSuccess: function (userId) {
          resolve(userId);
        },
        onTokenIncorrect: function () {
          common.console.error('token 无效');
          reject({ errCode: ErrorCode.IM_TOKEN_ERROR });
        },
        onError: function (error) {
          common.console.error('连接失败' + error);
          reject({ errCode: ErrorCode.IM_CONNECT_ERROR });
        }
      });
    });
  }

  function reconnect(callbacks) {
    callbacks = callbacks || utils.noop;
    var rates = [], reconnectTime = 1000, reconnectCount = 15;
    for (var i = 0; i < reconnectCount; i++) {
      rates.push(reconnectTime);
    }
    var config = {
      // 默认 false, true 启用自动重连，启用则为必选参数
      auto: true,
      // 网络嗅探地址 [http(s)://]cdn.ronghub.com/RongIMLib-2.2.6.min.js 可选
      url: RongClass.setting.im.reconnectUrl,
      // 重试频率 [100, 1000, 3000, 6000, 10000, 18000] 单位为毫秒，可选
      rate: rates
    };
    RongIMClient.reconnect(callbacks, config);
  }

  /**
   * 发消息, type 固定为 GROUP
   * @param {String} targetId 目标 id
   * @param {object} msg 消息
   * @param {object} callbacks 回调对象
   * @param {Function} callbacks.onBefore 发送前
   * @param {Function} callbacks.onSuccess 发送成功
   * @param {Function} callbacks.onSuccess 发送失败
   */
  function sendClassMessage(msg, callbacks) {
    callbacks = callbacks || {};
    callbacks.onSuccess = callbacks.onSuccess || utils.noop;
    var auth = RongClass.instance.auth || {};
    var targetId = auth.roomId;
    var conversationType = RoomConversationType;
    RongIMClient.getInstance().sendMessage(conversationType, targetId, msg, {
      onBefore: function () {
        // callbacks.onSuccess(message); // TODO 需加入
      },
      onSuccess: function (message) {
        callbacks.onSuccess(message);
        emitter.emit(Event.MESSAGE_ADDED, message);
      },
      onError: callbacks.onError
    });
  }

  /**
   * 发送文字消息
   * @param {String} targetId 发送图片消息
   * @param {String} content 文字内容
   * @param {object} callbacks 回调函数对象
   */
  function sendTextMessage(content, callbacks) {
    var instance = RongClass.instance || {},
      auth = instance.auth || {},
      loginUser = auth.loginUser || {};
    var msg = new RongIMLib.TextMessage({
      content: content,
      user: {
        id: loginUser.userId,
        name: loginUser.userName
      }
    });
    sendClassMessage(msg, callbacks);
  }

  /**
   * 发送图片消息
   * @param {String} targetId 发送图片消息
   * @param {String} base64 图片 base64
   * @param {String} uri 图片 url
   * @param {object} callbacks 回调函数对象
   */
  function sendImageMessage(base64, uri, callbacks) {
    var msg = new RongIMLib.ImageMessage({
      content: base64,
      uri: uri
    });
    sendClassMessage(msg, callbacks);
  }

  /**
   * 发送文件消息
   * @param {object} fileContent  文件信息
   * @param {object} fileContent.name  文件名
   * @param {object} fileContent.size  文件大小
   * @param {object} fileContent.type  文件类型
   * @param {object} fileContent.fileUrl  文件 url
   * @param {object} callbacks 回调函数对象
   */
  function sendFileMessage(fileContent, callbacks) {
    var msg = new RongIMLib.FileMessage(fileContent);
    sendClassMessage(msg, callbacks);
  }  

  /**
   * 
   * @param {String} targetId 目标 id
   * @param {Number} timestamp 时间
   * @param {object} callbacks 回调对象
   * @param {object} callbacks.onSuccess 获取成功
   * @param {object} callbacks.onError 获取失败
   */
  function getHistoryMessages(timestamp, callbacks) {
    var conversationType = RoomConversationType;
    var auth = RongClass.instance.auth || {};
    var targetId = auth.roomId;
    var count = 20;
    var instance = RongIMClient.getInstance();
    instance.getHistoryMessages(conversationType, targetId, timestamp, count, callbacks);
  }

  function upload(type, file, callbacks) {
    var onLoadStart = callbacks.onLoadStart || utils.noop,
      onError = callbacks.onError || utils.noop,
      onProgress = callbacks.onProgress || utils.noop,
      onComplete = callbacks.onComplete || utils.noop;
    var instance = RongIMClient.getInstance();

    var getFileUrl = function (fileName, oriName) {
      instance.getFileUrl(type, fileName, oriName, {
        onSuccess: onComplete,
        onError: onError
      });
    };

    var uploadSuccsss = function (content) {
      var target = content.target,
        response = target.response;
      response = JSON.parse(response);
      var hash = response.hash,
        name = response.name;
      getFileUrl(hash, name);
    };

    instance.getFileToken(type, {
      onSuccess: function (result) {
        utils.uploadFile(UploadUrl, file, result.token, {
          onLoadStart: onLoadStart,
          onError: onError,
          onProgress: onProgress,
          onComplete: uploadSuccsss
        });
      },
      onError: onError
    });
  }

  function uploadImage(file, callbacks) {
    var type = RongIMLib.FileType.IMAGE;
    upload(type, file, callbacks);
  }

  function uploadFile(file, callbacks) {
    var type = RongIMLib.FileType.FILE;
    upload(type, file, callbacks);
  }

  function logout() {
    var instance = RongIMClient.getInstance();
    instance.disconnect();
    instance.logout();
  }
  
  var chat = {
    init: init,
    reconnect: reconnect,
    sendTextMessage: sendTextMessage,
    sendImageMessage: sendImageMessage,
    sendFileMessage: sendFileMessage,
    getHistoryMessages: getHistoryMessages,

    uploadImage: uploadImage,
    uploadFile: uploadFile,

    logout: logout
  };

  RongClass.dataModel = RongClass.dataModel || {};
  utils.extend(RongClass.dataModel, {
    chat: chat
  });

})(window.RongClass, {
  RongIMLib: window.RongIMLib,
  win: window
});