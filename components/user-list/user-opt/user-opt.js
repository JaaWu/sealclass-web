(function (RongClass, dependencies, components) {
  'use strict';
  var win = dependencies.win;

  var common = RongClass.common,
    utils = RongClass.utils,
    emitter = utils.EventEmitter,
    include = utils.include,
    ENUM = RongClass.ENUM,
    Event = ENUM.Event,
    RoleENUM = ENUM.Role,
    RTCTag = ENUM.RTCTag,
    SpeechResultAction = ENUM.SpeechResultAction,
    UpgradeAction = ENUM.UpgradeAction,
    dialog = RongClass.dialog,
    MaxPersonCount = RongClass.setting.class.maxPersonCount,
    server = RongClass.dataModel.server;

  var HasSetAssistantRoles = [ RoleENUM.STUDENT, RoleENUM.TEACHER ],
    HasSetTeacherRoles = [ RoleENUM.STUDENT ],
    HasSetDeviceRoles = [ RoleENUM.STUDENT, RoleENUM.TEACHER ],
    HasDowngradeRoles = [ RoleENUM.TEACHER, RoleENUM.STUDENT ],
    HasUpgradeRoles = [ RoleENUM.AUDIENCE ];

  var RoleMapPrompText = (function () {
    var prompText = {};
    prompText[RoleENUM.ASSISTANT] = {
      confirm: '确定转让老师 ?',
      result: '您已将老师转让给 {userName}'
    };
    prompText[RoleENUM.AUDIENCE] = {
      confirm: '确定降级该成员 ?',
      result: '您已将 {userName} 降级'
    };
    prompText[RoleENUM.TEACHER] = {
      confirm: '确定设置成员为老师 ?',
      result: '您已将 {userName} 设置为老师'
    };
    return prompText;
  })();

  function hasOptAuth(hasAuthRoles, user, self) {
    var optRole = user.role,
      selfRole = self.role,
      isAssistant = selfRole === RoleENUM.ASSISTANT,
      hasAuth = include(hasAuthRoles, optRole);
    return isAssistant && hasAuth;
  }

  function confirmDialog(content) {
    return new win.Promise(function (resolve) {
      dialog.confirm({
        content: content,
        confirmed: resolve
      });
    });
  }

  function alertDialog(content) {
    dialog.alert({
      content: content,
      destroyTimeout: 2000
    });
  }

  function unWatchApplySppechResult(context) {
    emitter.off(Event.USER_APPLY_SPEECH_RESULT, context.onApplySpeechResult);
    emitter.off(Event.USER_RESULT_EXPIRED, context.onApplySpeechTicket);
  }

  function watchApplySpeechResult(context) {
    var toast = function (text) {
      common.toast(text);
      context.isSpeechApplying = false;
      unWatchApplySppechResult(context);
    };
    context.onApplySpeechResult = function (content) {
      var textTpl = '老师{handle}了您的发言请求';
      var isAccept = content.action === SpeechResultAction.ACCEPT;
      var handleText = isAccept ? '通过' : '拒绝';
      var text = utils.tplEngine(textTpl, { handle: handleText });
      toast(text);
    };
    context.onApplySpeechTicket = function () {
      var text = '老师无响应, 请稍后再试';
      toast(text);
    };
    emitter.on(Event.USER_APPLY_SPEECH_RESULT, context.onApplySpeechResult);
    emitter.on(Event.USER_RESULT_EXPIRED, context.onApplySpeechTicket);
  }

  function unWatchInviteUpgradeResult(context) {
    emitter.off(Event.USER_INVITE_UPGRADE_RESULT, context.onInviteUpgradeResult);
    emitter.off(Event.USER_RESULT_EXPIRED, context.onInviteUpgradeTicket);
  }

  function watchInviteUpgradeResult(context) {
    var toast = function (text) {
      common.toast(text);
      context.isUpgradeInviting = false;
      unWatchInviteUpgradeResult(context);
    };
    context.onInviteUpgradeResult = function (content) {
      var textTpl = '{userName} {handle}了您的升级邀请';
      var isApprove = content.action === UpgradeAction.APPROVE;
      var handleText = isApprove ? '通过' : '拒绝';
      var text = utils.tplEngine(textTpl, { 
        handle: handleText,
        userName: content.opUserName
      });
      toast(text);
    };
    context.onInviteUpgradeTicket = function () {
      var text = '对方无响应, 请稍后再试';
      toast(text);
    };
    emitter.on(Event.USER_INVITE_UPGRADE_RESULT, context.onInviteUpgradeResult);
    emitter.on(Event.USER_RESULT_EXPIRED, context.onInviteUpgradeTicket);
  }

  function isCanSetAssistant() {
    return hasOptAuth(HasSetAssistantRoles, this.user, this.loginUser);
  }

  function isCanSetTeacher() {
    return hasOptAuth(HasSetTeacherRoles, this.user, this.loginUser);
  }

  function isCanSetVideoAudio() {
    var user = this.user;
    if (user.isLoading) {
      return false;
    }
    return hasOptAuth(HasSetDeviceRoles, user, this.loginUser);
  }

  function isCanDowngrade() {
    return hasOptAuth(HasDowngradeRoles, this.user, this.loginUser);
  }

  function isCanKick() {
    return this.loginUser.role === RoleENUM.ASSISTANT;
  }

  function isCanUpgrade() {
    var userList = this.userList;
    var validUserList = userList.filter(function (user) {
      return user.role !== RoleENUM.AUDIENCE;
    });
    var isFullPerson = validUserList.length >= MaxPersonCount;
    return !isFullPerson && hasOptAuth(HasUpgradeRoles, this.user, this.loginUser);
  }

  function isVideoClosed() {
    var rtcStream = this.user[RTCTag.RTC] || {};
    return !rtcStream.video;
  }

  function isAudioClosed() {
    var rtcStream = this.user[RTCTag.RTC] || {};
    return !rtcStream.audio;
  }

  function changeRole(role, user) {
    var locale = RongClass.instance.locale;
    var userName = common.getUserName(user),
      userId = common.getUserId(user);
    var promps = RoleMapPrompText[role],
      confirmText = promps.confirm,
      resultText = utils.tplEngine(promps.result, { userName: userName });
    confirmDialog(confirmText).then(function () {
      return server.changeRole(role, userId);
    }).then(function () {
      alertDialog(resultText);
    }).catch(function (error) {
      common.console.error('设置用户权限失败');
      var errorText = locale.errorCode[error.errCode] || error.errDetail;
      dialog.confirm({
        content: errorText
      });
    });
  }

  function setAssistant() {
    changeRole(RoleENUM.ASSISTANT, this.user);
  }

  function setTeacher() {
    changeRole(RoleENUM.TEACHER, this.user);
  }

  function downgrade() {
    changeRole(RoleENUM.AUDIENCE, this.user);
  }

  function setMicro(options) {
    options = options || {};
    var self = this || {};
    var locale = RongClass.instance.locale;
    var enable = self.isAudioClosed || options.enable,
      userId = self.userId || options.userId,
      confirmTextTpl = '确定要{handle}成员的麦克风吗 ?',
      func = enable ? server.inviteOpenMicro : server.closeMicphone;
    var confirmText = utils.tplEngine(confirmTextTpl, {
      handle: enable ? '打开' : '关闭'
    });
    confirmDialog(confirmText).then(function () {
      return func(userId);
    }).catch(function (error) {
      common.console.error('设置用户麦克风失败');
      var errorText = locale.errorCode[error.errCode] || error.errDetail;
      dialog.confirm({
        content: errorText
      });
    });
  }

  function setCamera(options) {
    options = options || {};
    var self = this || {};
    var locale = RongClass.instance.locale;
    var enable = self.isVideoClosed || options.enable,
      userId = self.userId || options.userId,
      confirmTextTpl = '确定要{handle}成员的摄像头吗 ?',
      func = enable ? server.inviteOpenCamera : server.closeCamera;
    var confirmText = utils.tplEngine(confirmTextTpl, {
      handle: enable ? '打开' : '关闭'
    });
    confirmDialog(confirmText).then(function () {
      return func(userId);
    }).catch(function (error) {
      common.console.error('设置用户摄像头失败');
      var errorText = locale.errorCode[error.errCode] || error.errDetail;
      dialog.confirm({
        content: errorText
      });
    });
  }

  function inviteUpgrade() {
    var context = this;
    var userId = context.userId;
    confirmDialog('确定将成员升级为学员吗 ?').then(function () {
      context.isUpgradeInviting = true;
      watchInviteUpgradeResult(context);
      return server.inviteUpgrade(userId);
    }).catch(function (error) {
      if (error.errCode === ENUM.SpecialErrorCode.ERR_OVER_MAX_COUNT) {
        return dialog.confirm({
          content: '当前学员人数已满, 请先降级一名学员后再继续操作',
          confirmName: '我知道了',
          isHideCancel: true
        });
      }
      unWatchInviteUpgradeResult(context);
      common.console.log('邀请升级失败');
      context.isUpgradeInviting = false;
      var errorText = context.locale.errorCode[error.errCode] || error.errDetail;
      dialog.confirm({
        content: errorText
      });
    });
  }

  function applySpeech() {
    var context = this;
    context.isSpeechApplying = true;
    watchApplySpeechResult(context);
    server.applySpeech().then(function () {
      // do nothing
    }).catch(function (error) {
      unWatchApplySppechResult(context);
      context.isSpeechApplying = false;
      common.console.log('申请失败');
      var errorText = context.locale.errorCode[error.errCode] || error.errDetail;
      dialog.confirm({
        content: errorText
      });
    })
  }

  function kick(option) {
    option = option || {};
    var locale = RongClass.instance.locale;
    var userId = this.userId || option.userId,
      userName = this.userName || option.userName;
    confirmDialog('确定要将成员移出课堂 ?').then(function () {
      return server.kickMember(userId);
    }).then(function () {
      var promps = '您已将 {userName} 踢出房间';
      promps = utils.tplEngine(promps, { userName: userName });
      alertDialog(promps);
    }).catch(function (error) {
      common.console.log('踢人失败');
      var errorText = locale.errorCode[error.errCode] || error.errDetail;
      dialog.confirm({
        content: errorText
      });
    });
  }

  function getMethods() {
    return {
      setAssistant: setAssistant,
      setTeacher: setTeacher,
      setMicro: setMicro,
      setCamera: setCamera,
      downgrade: downgrade,
      inviteUpgrade: inviteUpgrade,
      kick: kick,
      applySpeech: applySpeech
    };
  }

  components.userOpt = function (resolve) {
    var options = {
      name: 'user-opt',
      template: '#rong-template-useropt',
      props: ['user', 'userList', 'loginUser'],
      data: function () {
        return {
          isUpgradeInviting: false,
          isSpeechApplying: false
        };
      },
      computed: {
        role: function () {
          return this.user.role;
        },
        isLoginUser: function () {
          return this.userId === common.getUserId(this.loginUser);
        },
        RoleENUM: function () {
          return RoleENUM
        },
        userId: function () {
          return common.getUserId(this.user);
        },
        userName: function () {
          return common.getUserName(this.user);
        },
        isShowUpgrade: function () {
          return this.role === RoleENUM.AUDIENCE;
        },
        isCanSetAssistant: isCanSetAssistant,
        isCanSetTeacher: isCanSetTeacher,
        isCanSetVideoAudio: isCanSetVideoAudio,
        isCanDowngrade: isCanDowngrade,
        isCanUpgrade: isCanUpgrade,
        isCanKick: isCanKick,
        isVideoClosed: isVideoClosed,
        isAudioClosed: isAudioClosed
      },
      components: {
        'user-avatar': components.userAvatar
      },
      destroyed: function () {
        unWatchApplySppechResult(this);
        unWatchInviteUpgradeResult(this);
      },
      mounted: function () {
      },
      methods: getMethods()
    };
    common.component(options, resolve);
  };

  RongClass.operate = {
    setMicro: setMicro,
    setCamera: setCamera,
    kick: kick
  };

})(window.RongClass, {
  Vue: window.Vue,
  win: window
}, window.RongClass.components);