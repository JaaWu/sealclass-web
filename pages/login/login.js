(function (RongClass, dependencies, components) {
  'use strict';
  var win = dependencies.win,
    Promise = win.Promise;

  var utils = RongClass.utils,
    common = RongClass.common,
    dialog = RongClass.dialog,
    dataModel = RongClass.dataModel,
    server = dataModel.server,
    storage = common.storage;

  var EntryCode = 13;

  var StorageKey = RongClass.ENUM.StorageKey,
    SpecialErrorCode = RongClass.ENUM.SpecialErrorCode;
  
  var resolutionSetting = RongClass.setting.rtc.resolution;

  function toClassPage(data) {
    var instance = RongClass.instance;
    instance.$router.push({
      name: 'class',
      params: data
    });
  }

  function setRoomStorage(room, user) {
    storage.set(StorageKey.ROOM_ID, room);
    storage.set(StorageKey.USER_NAME, user);
  }

  function getIMParams(token) {
    var imSetting = RongClass.setting.im;
    return {
      appKey: imSetting.appKey,
      navi: imSetting.navi,
      api: imSetting.api,
      protobuf: imSetting.protobuf,
      token: token
    };
  }

  function getRTCParams(roomId, userId, token) {
    return {
      userId: userId,
      token: token,
      roomId: roomId
    };
  }

  function initRoom(userName, roomId, isAudience) {
    var roomInfo;
    return server.joinClassRoom(roomId, userName, isAudience).then(function (info) {
      roomInfo = info;
      RongClass.instance.auth = roomInfo;
      var imParams = getIMParams(roomInfo.imToken);
      return dataModel.chat.init(imParams);
    }).then(function (userId) {
      common.console.info({ selfId: userId });
      roomInfo.userId = userId;
      var rtcParams = getRTCParams(roomId, userId, roomInfo.imToken);
      return dataModel.rtc.init(rtcParams);
    }).then(function () {
      roomInfo.loginUser = common.getLoginUser(roomInfo.members, roomInfo.userId);
      return Promise.resolve(roomInfo)
    });
  }

  function confirmEntryWithAudience(context) {
    dialog.confirm({
      content: '课堂学员人数已满，是否以旁听人身份加入？',
      position: utils.getCenterPosition(),
      confirmed: function () {
        context.isAudience = true;
        context.entryClass();
      }
    });
  }

  function entryClass(context) {
    context.isLoading = true;
    var roomId = context.roomId,
      userName = context.userName,
      isAudience = context.isAudience;
    initRoom(userName, roomId, isAudience).then(function (roomInfo) {
      context.isLoading = false;
      var loginData = utils.extend(context.$data, { videoEnable: context.videoEnable });
      loginData = utils.extend(loginData, roomInfo);
      RongClass.instance.auth = roomInfo;
      setRoomStorage(roomId, userName);
      toClassPage(loginData);
    }).catch(function (error) {
      context.isLoading = false;
      if (error.errCode === SpecialErrorCode.ERR_OVER_MAX_COUNT) {
        return confirmEntryWithAudience(context);
      }
      var errorText = context.locale.errorCode[error.errCode] || error.errDetail;
      dialog.confirm({
        content: errorText,
        position: utils.getCenterPosition()
      });
    });
  }

  function filterValueSpace(context, key) {
    var value = context[key];

    var isHeaderSpace = value[0] === ' ';
    if (isHeaderSpace) {
      context[key] = value.substring(1);
      value = context[key];
    }

    var valueLength = value.length,
      isFooterSpace = value[valueLength - 1] === ' ';
    if (isFooterSpace) {
      context[key] = value.substring(0, valueLength - 1);
    }
  }

  function getMethods() {
    return {
      keydown: function (e) {
        var currKey = e.keyCode || e.which || e.charCode;
        if (EntryCode === currKey) {
          this.entryClass();
        }
      },
      entryClass: function () {
        var context = this;
        if (context.checkValid()) {
          entryClass(context);
        }
      },
      isResolutionSelected: function (resol) {
        var resolution = this.resolution;
        return resol.width === resolution.width
           && resol.height === resolution.height;
      },
      filterRoomId: function () {
        filterValueSpace(this, 'roomId');
      },
      filterUserName: function () {
        filterValueSpace(this, 'userName');
      }
    };
  }

  components.login = function (resolve) {
    var options = {
      name: 'login',
      isIgnoreAuth: true,
      template: '#rong-template-login',
      data: function () {
        return {
          isLoading: false,
          roomId: storage.get(StorageKey.ROOM_ID),
          userName: storage.get(StorageKey.USER_NAME),
          isAudience: false,
          isVideoClosed: false,
          resolution: resolutionSetting.default
        };
      },
      computed: {
        videoEnable: function () {
          return !this.isVideoClosed;
        },
        resolutionList: function () {
          return resolutionSetting.list;
        }
      },
      mixins: [
        RongClass.mixins.validate
      ],
      methods: getMethods()
    };
    common.component(options, resolve);
  };
  
})(window.RongClass, {
  Vue: window.Vue,
  win: window
}, window.RongClass.components);