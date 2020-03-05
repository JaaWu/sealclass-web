(function (RongClass, dependencies) {
  'use strict';
  var Setting = RongClass.setting,
    win = dependencies.win,
    utils = RongClass.utils,
    common = RongClass.common,
    emitter = utils.EventEmitter,
    storage = common.storage;
  
  var ENUM = RongClass.ENUM,
    DisplayType = ENUM.DisplayType,
    Event = ENUM.Event,
    RTCKey = ENUM.RTCTag.RTC,
    ScreenShareKey = ENUM.RTCTag.SCREENSHARE,
    RoleEnum = ENUM.Role,
    RoomAction = ENUM.RoomAction;

  var DefaultUser = {
    video: false, audio: false, mediaStream: {}
  };

  var AuthorizationStorageHandler = {
    key: 'authorization',
    set: function (userId, auth) {
      var auths = storage.get(AuthorizationStorageHandler.key) || {};
      auths[userId] = auth;
      storage.set(AuthorizationStorageHandler.key, auths);
    },
    get: function (userId) {
      var auths = storage.get(AuthorizationStorageHandler.key) || {};
      return auths[userId];
    },
    remove: function (userId) {
      var auths = storage.get(AuthorizationStorageHandler.key) || {};
      delete auths[userId];
      storage.set(AuthorizationStorageHandler.key, auths);
    }
  };

  /*
  {
    id: '',
    role: '',
    RTC: '',
    SCREENSHARE: ''
  }
   */
  var _Cache = {
    roles: {
      userRoles: {},
      set: function (user) {
        var userId = user.userId || user.id;
        var role = user.role;
        if (!utils.isUndefined(role)) {
          _Cache.roles.userRoles[userId] = role;
        }
      },
      get: function (user) {
        var userId = user.userId || user.id;
        return _Cache.roles.userRoles[userId];
      }
    },
    users: {
      userList: [],
      addUser: function (user) {
        var userId = user.userId || user.id,
          oldUser = _Cache.users.getUserById(userId) || {};
        if (!oldUser[RTCKey]) {
          user[RTCKey] = DefaultUser; // 设置音视频流默认值
        }
        if (!oldUser[ScreenShareKey]) {
          user[ScreenShareKey] = DefaultUser; // 设置屏幕共享默认值
        }
        var userList = _Cache.users.userList;
        _Cache.users.userList = common.addArrayById(userList, user);
        _Cache.roles.set(user);
        emitter.emit(Event.USER_LIST_CHANGED, _Cache.users.userList);
      },
      removeUser: function (user) {
        var userList = _Cache.users.userList;
        _Cache.users.userList = common.removeArrayById(userList, user);
        emitter.emit(Event.USER_LIST_CHANGED, _Cache.users.userList);
      },
      /* 将收到的 user 转化成 _Cache 需要的 user 格式, 主要为区分音视频和屏幕共享流 */
      addStream: function (user) {
        var userId = common.getUserId(user),
          oldUser = _Cache.users.getUserById(userId);
        if (!oldUser) {
          return;
        }
        var tag = user.stream.tag;
        user[tag] = user.stream;
        _Cache.users.addUser(user);
      },
      removeStream: function (user) {
        var tag = user.stream.tag;
        delete user[tag];
        _Cache.users.addUser(user);
      },
      getUserList: function (isParse) {
        var userList = _Cache.users.userList;
        return isParse ? userList.slice(0) : userList;
      },
      getUserById: function (id, isParse) {
        var userList = _Cache.users.getUserList(isParse);
        var user = {
          userId: id
        };
        userList.forEach(function (item) {
          if (item.userId === id || item.id === id) {
            user = item;
          }
        });
        return user;
      }
    }
  };
  
  var request = function (url, method, data, queryStrings, isSync, headers) {
    var fullUrl = utils.tplEngine('{server}{url}', {
      server: Setting.server,
      url: url
    });
    var instance = RongClass.instance || {};
    var auth = instance.auth || {};
    var authorization = auth.authorization;
    var options = {
      url: fullUrl,
      method: method,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8'
      },
      queryStrings: queryStrings,
      body: JSON.stringify(data),
      isSync: isSync
    };
    if (authorization) {
      options.headers = utils.extend(options.headers, {
        'Authorization': authorization
      });
      options.headers = utils.extend(options.headers, headers);
    }
    
    return new win.Promise(function (resolve, reject) {
      var onFaild = function () {
        reject({ errCode: RongClass.ErrorCode.NETWORK_UNAVAILABLE });
      };
      options.success = function (result) {
        result = JSON.parse(result);
        var errorCode = result.errCode;
        if (errorCode === 0) {
          resolve(result.data.result);
        } else {
          reject(result);
        }
      };
      options.fail = onFaild;
      utils.ajax(options);
    });
  };

  var Http = {
    get: function (url, data, isSync) {
      return request(url, 'GET', null, data, isSync);
    },
    post: function (url, data, isSync, headers) {
      return request(url, 'POST', data, null, isSync, headers);
    }
  };

  function getEnteredRoomId() {
    var auth = RongClass.instance.auth || {};
    return auth.roomId;
  }

  function getLoginUser() {
    var instance = RongClass.instance || {};
    var auth = instance.auth || {};
    return auth;
  }

  function getLoginUserId() {
    var loginUser = getLoginUser();
    return loginUser.userId || loginUser.id;
  }

  function getUserList() {
    return _Cache.users.getUserList(true);
  }

  function getUserById(id) {
    return _Cache.users.getUserById(id, true);
  }

  function getLoginUserDetail() {
    var loginUserId = RongClass.instance.auth.userId;
    var userList = getUserList();
    var selfUser = userList.filter(function (user) {
      return user.id === loginUserId;
    })[0];
    return selfUser;
  }

  function syncCameraStatus(enable) {
    var roomId = getEnteredRoomId();
    var url = '/room/device/sync';
    return Http.post(url, {
      roomId: roomId,
      cameraOn: enable
    });
  }

  function syncMicroStatus(enable) {
    var roomId = getEnteredRoomId();
    var url = '/room/device/sync';
    return Http.post(url, {
      roomId: roomId,
      microphoneOn: enable
    });
  }

  function setMediaEnable(isMic, enable, isNotSync) {
    var rtcServer = RongClass.dataModel.rtc,
      loginUser = getLoginUserDetail();

    var event, syncEvent;

    loginUser.stream = loginUser[RTCKey];

    if (isMic) {
      syncEvent = syncMicroStatus;
      event = enable ? rtcServer.openAudio : rtcServer.closeAudio;
    } else {
      syncEvent = syncCameraStatus;
      event = enable ? rtcServer.openVideo: rtcServer.closeVideo;
    }
    event(loginUser).catch(function () {
      common.console.error('操作流失败');
    });
    !isNotSync && syncEvent(enable).catch(function () {
      common.console.error('同步设备状态失败');
    });
  }

  function setListener() {

    // ------- 用户相关事件 -------

    /* 监听用户加入 */
    emitter.on(Event.USER_JOINED, function (user) {
      user.isLoading = true;
      _Cache.users.addUser(user);
    });
    /* 监听用户离开 */
    emitter.on(Event.USER_LEFT, function (user) {
      _Cache.users.removeUser(user);
    });
    /* 监听用户角色改变 */
    emitter.on(Event.USER_ROLE_CHANGED, function (users) {
      if (utils.isObject(users)) {
        users = [ users ];
      }
      users.forEach(function (user) {
        _Cache.users.addUser(user);
        var auth = RongClass.instance.auth || {};
        var selfUserId = auth.userId;
        if (user.userId === selfUserId) {
          emitter.emit(Event.SELF_USER_ROLE_CHANGED, user);
        }
      });
    });
    /* 监听 老师要求登录用户打开/关闭摄像头 */
    emitter.on(Event.USER_CLAIM_CAMERA_CHANGE, function (enable) {
      setMediaEnable(false, enable, true);
    });
    /* 监听 老师要求登录用户打开/关闭麦克风 */
    emitter.on(Event.USER_CLAIM_MIC_CHANGE, function (enable) {
      setMediaEnable(true, enable, true);
    });

    // ------- 音视频相关事件 -------

    /* 监听收到用户的流 */
    emitter.on(Event.STREAM_ADDED, function (user) {
      var rtcModel = RongClass.dataModel.rtc;
      var rtcSwitch = rtcModel.getStreamSwitch(user.stream.type); /* 将 type 转化为 { video: boolean, audio: boolean } */
      user.stream = utils.extend(user.stream, rtcSwitch);
      user.isLoading = false;
      _Cache.users.addStream(user);
    });
    /* 监听移除用户的流 */
    emitter.on(Event.STREAM_REMOVED, function (user) {
      _Cache.users.removeStream(user);
    });
    /* 监听用户关闭视频 */
    emitter.on(Event.VIDEO_DISABLED, function (user) {
      user.stream.video = false;
      _Cache.users.addStream(user);
    });
    /* 监听用户打开视频 */
    emitter.on(Event.VIDEO_ENABLED, function (user) {
      user.stream.video = true;
      _Cache.users.addStream(user);
    });
    /* 监听用户静音 */
    emitter.on(Event.AUDIO_MUTED, function (user) {
      user.stream.audio = false;
      _Cache.users.addStream(user);
    });
    /* 监听用户取消静音 */
    emitter.on(Event.AUDIO_UNMUTED, function (user) {
      user.stream.audio = true;
      _Cache.users.addStream(user);
    });
  }

  /**
   * 接口设计文档
   * https://gitlab2.rongcloud.net/tools-team/sealclass-server/blob/master/tools/%E8%AE%BE%E8%AE%A1%E6%96%87%E6%A1%A3.md
   */

  /**
   * 加入房间
   * @param {String} roomId 房间 id
   * @param {String} userId 用户 id
   * @param {Boolean} isAudience 是否为旁听者
   */
  function joinClassRoom(roomId, userName, isAudience, options) {
    options = options || {};
    var url = '/room/join';
    var auth = AuthorizationStorageHandler.get(userName);
    return Http.post(url, utils.extend({
      roomId: roomId,
      audience: isAudience,
      userName: userName,
      deviceId: utils.getUUID()
    }, options), null, {
      Authorization: auth
    }).then(function (roomInfo) {
      var authorization = roomInfo.authorization;
      AuthorizationStorageHandler.set(userName, authorization);
      setListener();
      var members = roomInfo.members;
      members.forEach(function (member) {
        emitter.emit(Event.USER_JOINED, member);
      });
      return win.Promise.resolve(roomInfo);
    });
  }

  function destroyClassRoom(roomId) {
    roomId = roomId || getEnteredRoomId();
    var selfUser = RongClass.instance.auth,
      selfUserId = selfUser.userId;
    var userInfo = selfUser.userInfo || {};
    var url = '/room/destroy';
    return Http.post(url, {
      roomId: roomId,
      schoolId: userInfo.schoolId
    }, true).then(function () {
      AuthorizationStorageHandler.remove(selfUserId);
      return win.Promise.resolve();
    });
  }

  function leaveClassRoom(roomId) {
    roomId = roomId || getEnteredRoomId();
    var selfUser = RongClass.instance.auth,
      selfUserId = selfUser.userId;
    var userInfo = selfUser.userInfo || {};
    var url = '/room/leave';
    return Http.post(url, {
      roomId: roomId,
      schoolId: userInfo.schoolId
    }, true).then(function () {
      AuthorizationStorageHandler.remove(selfUserId);
      return win.Promise.resolve();
    });
  }

  function kickMember(userId) {
    var roomId = getEnteredRoomId();
    var url = '/room/kick';
    return Http.post(url, {
      roomId: roomId,
      userId: userId
    }).then(function (result) {
      var user = getUserById(userId);
      user.action = RoomAction.KICK;
      emitter.emit(Event.USER_LEFT, user);
      var rtcWindowHandler = RongClass.dialog.rtcWindow.Handler;
      rtcWindowHandler.destory(userId);
      return win.Promise.resolve(result);
    });
  }

  function getWhiteBoardList() {
    var roomId = getEnteredRoomId();
    var url = '/room/whiteboard/list';
    return Http.get(url, {
      roomId: roomId
    });
  }

  function createWhiteboard() {
    var roomId = getEnteredRoomId();
    var url = '/room/whiteboard/create';
    return Http.post(url, {
      roomId: roomId
    });
  }

  function deleteWhiteboard(whiteboardId) {
    var roomId = getEnteredRoomId();
    var url = '/room/whiteboard/delete';
    return Http.post(url, {
      roomId: roomId,
      whiteboardId: whiteboardId
    });
  }

  function turnWhiteBoardPage(whiteBoardId, page) {
    var roomId = getEnteredRoomId();
    var url = '/whiteboard/turn-page';
    return Http.post(url, {
      roomId: roomId,
      whiteBoardId: whiteBoardId,
      page: page
    });
  }

  function setCamera(userId, enable) {
    var roomId = getEnteredRoomId();
    var url = '/room/device/control';
    return Http.post(url, {
      roomId: roomId,
      cameraOn: enable,
      userId: userId
    }).then(function () {
      var eventName = enable ? Event.VIDEO_ENABLED : Event.VIDEO_DISABLED;
      var user = getUserById(userId);
      user.stream = user[RTCKey];
      emitter.emit(eventName, user);
      return win.Promise.resolve(user);
    });
  }

  function inviteOpenDevice(userId, isCamera) {
    var roomId = getEnteredRoomId();
    var url = '/room/device/control';
    var body = {
      roomId: roomId,
      userId: userId
    };
    if (isCamera) {
      body.cameraOn = true;
    } else {
      body.microphoneOn = true;
    }
    return Http.post(url, body);
  }

  function inviteOpenCamera(userId) {
    return inviteOpenDevice(userId, true);
  }

  function inviteOpenMicro(userId) {
    return inviteOpenDevice(userId, false);
  }
  
  function approveOpenDevice(ticket) {
    var roomId = getEnteredRoomId();
    var url = '/room/device/approve';
    return Http.post(url, {
      roomId: roomId,
      ticket: ticket
    });
  }

  function rejectOpenDevice(ticket) {
    var roomId = getEnteredRoomId();
    var url = '/room/device/reject';
    return Http.post(url, {
      roomId: roomId,
      ticket: ticket
    });
  }

  // function openCamera(userId) {
  //   return setCamera(userId, true);
  // }

  function closeCamera(userId) {
    return setCamera(userId, false);
  }

  function setMicphone(userId, enable) {
    var roomId = getEnteredRoomId();
    var url = '/room/device/control';
    return Http.post(url, {
      roomId: roomId,
      microphoneOn: enable,
      userId: userId
    }).then(function () {
      var user = getUserById(userId);
      var eventName = enable ? Event.AUDIO_UNMUTED : Event.AUDIO_MUTED;
      user.stream = user[RTCKey];
      emitter.emit(eventName, user);
      return win.Promise.resolve(user);
    });
  }

  // function openMicphone(userId) {
  //   return setMicphone(userId, true);
  // }

  function closeMicphone(userId) {
    return setMicphone(userId, false);
  }

  function downgrade(users) {
    var roomId = getEnteredRoomId();
    var url = '/room/downgrade';
    return Http.post(url, {
      roomId: roomId,
      users: users
    }).then(function () {
      emitter.emit(Event.USER_ROLE_CHANGED, users);
      return win.Promise.resolve(users);
    });
  }

  /* type, userId, uri */
  function display(displayParams) {
    var roomId = getEnteredRoomId();
    var url = '/room/display';
    var userId = displayParams.userId,
      uri = displayParams.uri;
    var body = {
      roomId: roomId,
      type: displayParams.type
    };
    if (userId) {
      body.userId = userId;
    }
    if (uri) {
      body.uri = uri;
    }
    return Http.post(url, body).then(function () {
      emitter.emit(Event.USER_CLAIM_DISPLAY, body);
      return win.Promise.resolve(body);
    });
  }

  function displayWhiteboard(userId, uri) {
    var roomId = getEnteredRoomId();
    var type = DisplayType.WHITEBOARD;
    return display({
      roomId: roomId,
      userId: userId,
      type: type,
      uri: uri
    });
  }
  function displayTeacher(userId) {
    var roomId = getEnteredRoomId();
    var type = DisplayType.TEACHER;
    return display({
      roomId: roomId,
      userId: userId,
      type: type
    });
  }
  function displayAssistant(userId) {
    var roomId = getEnteredRoomId();
    var type = DisplayType.ASSISTANT;
    return display({
      roomId: roomId,
      userId: userId,
      type: type
    });
  }

  /* 转让老师给其他人 */
  function transfer(userId) {
    var roomId = getEnteredRoomId();
    var url = '/room/transfer';
    return Http.post(url, {
      roomId: roomId,
      userId: userId
    }).then(function () {
      var loginUser = getLoginUser();
      loginUser.role = RoleEnum.STUDENT;
      var changeUser = getUserById(userId);
      changeUser.role = RoleEnum.ASSISTANT;
      emitter.emit(Event.USER_ROLE_CHANGED, [ loginUser, changeUser ]);
      return win.Promise.resolve(changeUser);
    });
  }

  function setTeacher(userId) {
    var roomId = getEnteredRoomId();
    var url = '/room/change-role';
    var role = RoleEnum.TEACHER;
    return Http.post(url, {
      roomId: roomId,
      userId: userId,
      role: role
    }).then(function () {
      var changeUser = getUserById(userId);
      changeUser.role = role;
      emitter.emit(Event.USER_ROLE_CHANGED, changeUser);
      // displayTeacher(userId);
    });
  }

  function changeRole(role, userId) {
    if (role === RoleEnum.AUDIENCE) {
      return downgrade([ { userId: userId, role: role } ]);
    }
    if (role === RoleEnum.ASSISTANT) {
      return transfer(userId);
    }
    if (role === RoleEnum.TEACHER) {
      return setTeacher(userId);
    }

    var roomId = getEnteredRoomId();
    var url = '/room/assign';
    return Http.post(url, {
      roomId: roomId,
      userId: userId,
      role: role
    }).then(function () {
      var user = getUserById(userId);
      user.role = role;
      emitter.emit(Event.USER_ROLE_CHANGED, user);
    });
  }

  /* 申请发言 */
  function applySpeech() {
    var roomId = getEnteredRoomId();
    var url = '/room/speech/apply';
    return Http.post(url, {
      roomId: roomId
    });
  }

  /* 同意发言 */
  function approveSpeech(ticket) {
    var roomId = getEnteredRoomId();
    var url = '/room/speech/approve';
    return Http.post(url, {
      roomId: roomId,
      ticket: ticket
    });
  }

  /* 拒绝发言 */
  function rejectSpeech(ticket) {
    var roomId = getEnteredRoomId();
    var url = '/room/speech/reject';
    return Http.post(url, {
      roomId: roomId,
      ticket: ticket
    });
  }

  /* 邀请升级 */
  function inviteUpgrade(userId, role) {
    var roomId = getEnteredRoomId();
    role = role || RoleEnum.STUDENT;
    var url = '/room/upgrade/invite';
    return Http.post(url, {
      roomId: roomId,
      userId: userId,
      role: role
    });
  }

  /* 同意升级 */
  function approveUpgrade(ticket) {
    var roomId = getEnteredRoomId();
    var url = '/room/upgrade/approve';
    return Http.post(url, {
      roomId: roomId,
      ticket: ticket
    });
  }

  /* 拒绝升级 */
  function rejectUpgrade(ticket) {
    var roomId = getEnteredRoomId();
    var url = '/room/upgrade/reject';
    return Http.post(url, {
      roomId: roomId,
      ticket: ticket
    });
  }

  function checkAuth() {
    var instance = RongClass.instance;
    return instance && instance.auth;
  }

  function logout(option) {
    option = option || {};
    var isDestroy = option.isDestroy,
      isKeepInRoom = option.isKeepInRoom;
    var rtcServer = RongClass.dataModel.rtc,
      chatServer = RongClass.dataModel.chat,
      rtcWindowHandler = RongClass.dialog.rtcWindow.Handler;
    rtcWindowHandler.clear();
    emitter.clear();
    _Cache.users.userList = [];
    RongClass.instance.isMuted = false;
    window.onRTCClose = utils.noop;
    var logoutEvent = isDestroy ? destroyClassRoom : leaveClassRoom;
    if (isKeepInRoom) {
      logoutEvent = utils.deferNoop;
    }
    common.stopAllTrack();
    return win.Promise.all([logoutEvent(), rtcServer.leave()]).then(function () {
      chatServer.logout();
      RongClass.instance.auth = null;  
    });
  }

  var dataModel = {
    _Cache: _Cache,
    server: {
      joinClassRoom: joinClassRoom,
      leaveClassRoom: leaveClassRoom,
      destroyClassRoom: destroyClassRoom,

      getWhiteBoardList: getWhiteBoardList,
      createWhiteboard: createWhiteboard,
      deleteWhiteboard: deleteWhiteboard,
      turnWhiteBoardPage: turnWhiteBoardPage,

      display: display,
      displayWhiteboard: displayWhiteboard,
      displayTeacher: displayTeacher,
      displayAssistant: displayAssistant,

      closeCamera: closeCamera,
      closeMicphone: closeMicphone,
      inviteOpenCamera: inviteOpenCamera,
      inviteOpenMicro: inviteOpenMicro,
      approveOpenDevice: approveOpenDevice,
      rejectOpenDevice: rejectOpenDevice,

      syncCameraStatus: syncCameraStatus,
      syncMicroStatus: syncMicroStatus,

      changeRole: changeRole,
      kickMember: kickMember,
      downgrade: downgrade,
      // transfer: transfer,
      
      applySpeech: applySpeech,
      approveSpeech: approveSpeech,
      rejectSpeech: rejectSpeech,
      
      inviteUpgrade: inviteUpgrade,
      approveUpgrade: approveUpgrade,
      rejectUpgrade: rejectUpgrade,

      getLoginUser: getLoginUser,
      getLoginUserId: getLoginUserId,
      getUserList: getUserList,
      getUserById: getUserById,
      getRoleByUser: _Cache.roles.get,
      checkAuth: checkAuth,
      logout: logout
    }
  };

  RongClass.dataModel = RongClass.dataModel || {};
  utils.extend(RongClass.dataModel, dataModel);

})(window.RongClass, {
  win: window
});