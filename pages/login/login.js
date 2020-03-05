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

  function setRoomStorage(roomId, userId, schoolId) {
    storage.set(StorageKey.ROOM_ID, roomId);
    storage.set(StorageKey.USER_NAME, userId);
    storage.set(StorageKey.COMPANY_ID, schoolId);
  }

  function getIMParams(roomInfo) {
    roomInfo = roomInfo || {};
    var imSetting = RongClass.setting.im;
    return {
      appKey: roomInfo.appkey || imSetting.appKey,
      navi: imSetting.navi,
      api: imSetting.api,
      protobuf: imSetting.protobuf,
      token: roomInfo.imToken
    };
  }

  function getRTCParams(roomId, userId, token) {
    return {
      userId: userId,
      token: token,
      roomId: roomId
    };
  }

  function initRoom(userName, roomId, isAudience, context) {
    var roomInfo;
    return server.joinClassRoom(roomId, userName, isAudience, context).then(function (info) {
      roomInfo = info;
      RongClass.instance.auth = roomInfo;
      var imParams = getIMParams(roomInfo);
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

  function getEntryClassOption(context) {
    var role = common.getRole();
    var disableCamera = context.isTeacher ? false : true;
    return {
      disableCamera: disableCamera,
      role: role,
      phone: context.userName,
      password: context.password,
      schoolId: context.schoolId
    };
  }

  function entryClass(context) {
    context.isLoading = true;
    var roomId = context.roomId,
      userName = context.userName,
      schoolId = context.schoolId,
      isAudience = context.isAudience,
      option = getEntryClassOption(context);
    initRoom(userName, roomId, isAudience, option).then(function (roomInfo) {
      context.isLoading = false;
      var loginData = utils.extend(context.$data, { videoEnable: context.videoEnable });
      loginData = utils.extend(loginData, roomInfo);
      RongClass.instance.auth = roomInfo;
      setRoomStorage(roomId, userName, schoolId);
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
    var value = context[key] || '';

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
      checkDevices: function () {
        return utils.getDevices().then(function (devices) {
          var hasVideoInput = devices.videoInputs.length,
            hasAudioInput = devices.audioInputs.length,
            hasAudioOutput = devices.audioOutputs.length;
          var isError = !(hasVideoInput && hasAudioInput && hasAudioOutput);
          var errorMsg = '';
          if (!hasVideoInput) {
            errorMsg = '未找到摄像头或摄像头已损坏';
          }
          if (!hasAudioInput) {
            errorMsg = '未找到麦克风或麦克风已损坏';
          }
          if (!hasAudioOutput) {
            errorMsg = '未找到音频输出设备';
          }
          return isError ? Promise.reject(errorMsg) : Promise.resolve();
        });
      },
      keydown: function (e) {
        var currKey = e.keyCode || e.which || e.charCode;
        if (EntryCode === currKey) {
          this.entryClass();
        }
      },
      entryClass: function () {
        var context = this;
        context.checkDevices().catch(function () {
          return utils.requestDevices(); // 若是因为还未申请麦克风摄像头则先申请
        }).catch(function () {
          return context.checkDevices(); // 申请失败则再获取设备一次, 获取到具体是哪个设备有问题
        }).then(function () {
          context.checkValid() && entryClass(context);
        }).catch(function (errorMsg) {
          return dialog.confirm({
            content: errorMsg,
            position: utils.getCenterPosition()
          });
        });
      },
      isResolutionSelected: function (resol) {
        var resolution = this.resolution;
        return resol.width === resolution.width
           && resol.height === resolution.height;
      },
      isVideoInputSelected: function (val) {
        return val === this.videoInput;
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
          schoolId: storage.get(StorageKey.COMPANY_ID) || 'emlZvv',
          password: '123456',
          isAudience: false,
          isVideoClosed: false,
          resolution: resolutionSetting.default,
          videoInput: null,
          devices: {}
        };
      },
      computed: {
        videoEnable: function () {
          return !this.isVideoClosed;
        },
        resolutionList: function () {
          return resolutionSetting.list;
        },
        videoInputs: function () {
          return this.devices.videoInputs || [];
        }
      },
      mixins: [
        RongClass.mixins.validate
      ],
      methods: getMethods(),
      mounted: function () {
        var self = this;
        utils.getDevices().then(function (devices) {
          self.devices = devices;
          var videoInputs = devices.videoInputs;
          if (videoInputs.length) {
            self.videoInput = videoInputs[0];
          }
        });
      }
    };
    common.component(options, resolve);
  };
  
})(window.RongClass, {
  Vue: window.Vue,
  win: window
}, window.RongClass.components);