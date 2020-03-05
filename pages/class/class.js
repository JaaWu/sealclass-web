(function (RongClass, dependencies, components) {
  'use strict';
  var win = dependencies.win;

  var common = RongClass.common,
    utils = RongClass.utils,
    emitter = utils.EventEmitter,
    dataModel = RongClass.dataModel,
    server = dataModel.server,
    dialog = RongClass.dialog;

  var ENUM = RongClass.ENUM,
    Event = ENUM.Event,
    RoleENUM = ENUM.Role;

  var loading, confirmDialog;

  function toast(content) {
    common.toast(content);
  }

  function destoryLoading() {
    loading && loading.destroy();
  }

  function createLoading(text) {
    destoryLoading();
    loading = dialog.loading({
      content: text
    });
  }

  function toLoginPage() {
    var instance = RongClass.instance;
    instance.$router.push({ name: 'login' });
  }

  function hungup(isJump, options) {
    options = options || {};
    let isHideLoading = options.isHideLoading;
    !isHideLoading && createLoading('正在退出 ...');
    server.logout(options).then(function () {
      destoryLoading();
      isJump && toLoginPage();
    }).catch(function (err) {
      destoryLoading();
      common.console.log({'退出失败': err});
      toLoginPage();
    });
  }

  function closeClass(isJump) {
    createLoading('正在退出 ...');
    server.logout({
      isDestroy: true
    }).then(function () {
      destoryLoading();
      isJump && toLoginPage();
    }).catch(function (err) {
      destoryLoading();
      common.console.log({ '退出失败': err });
      toLoginPage();
    });
  }

  function confirmHungup(text, options) {
    options = options || {};
    var isConnected = RongClass.instance.auth;
    confirmDialog && confirmDialog.destroy();
    hungup(options.isJump, options);
    if (isConnected) {
      confirmDialog = dialog.confirm({
        content: text,
        confirmed: toLoginPage,
        canceled: toLoginPage
      });
    }
  }

  function hungupWhenBeforeUnload(context) {
    context.beforeunload = function (e) {
      e.preventDefault();
      e.returnValue = '';
      delete e['returnValue'];
    };
    context.unload = hungup;
    win.addEventListener('beforeunload', context.beforeunload);
    win.addEventListener('unload', context.unload);
  }

  function hungupWhenKickByOther() {
    emitter.on(Event.KICKED_OFFLINE_BY_OTHER_CLIENT, function (options) {
      confirmHungup('您已在其他设备登录', options);
    });
  }

  function hungupWhenRTCError() {
    emitter.on(Event.RTC_ERRORED, function () {
      confirmHungup('网络已断开, 确保网络正常后, 进入房间');
    });
  }

  var isReconnecting = false;
  function reconnect() {
    if (isReconnecting) {
      return;
    }
    isReconnecting = true;
    var chatServer = RongClass.dataModel.chat;
    var onError = function (error) {
      isReconnecting = false;
      common.console.error({ '重连失败': error });
      confirmHungup('网络已断开, 确保网络正常后, 再进入房间');
    };
    chatServer.reconnect({
      onSuccess: function () {
        isReconnecting = false;
        destoryLoading();
      },
      onTokenIncorrect: onError,
      onError: onError
    });
  }

  function reconnectWhenNetworkUnavailable() {
    var chatServer = RongClass.dataModel.chat;
    emitter.on(Event.NETWORK_UNAVAILABLE, function () {
      createLoading('网络已断开, 正在重连 ...');
      reconnect();
    });
  }

  function hungupWhenClassKicked() {
    emitter.on(Event.SELF_USER_KICKED, function (options) {
      dialog.confirm({ content: '您已被老师踢出课堂' });
      hungup(true, options);
    });
  }

  function hungupWhenClassDestroy() {
    emitter.on(Event.ROOM_DESTROY, function () {
      dialog.confirm({ content: '课堂已结束' });
      hungup(true);
    });
  }
  
  function toastWhenSelfRoleChanged() {
    emitter.on(Event.SELF_USER_ROLE_CHANGED, function (user) {
      var role = user.role;
      if (role === RoleENUM.AUDIENCE) {
        toast('你已被降级为旁听人，别人看/听不见你');
      }
    });
  }

  function toastWhenDeviceChanged() {
    emitter.on(Event.USER_CLAIM_MIC_CHANGE, function (enable) {
      !enable && toast('老师关闭了你的麦克风');
    });
    emitter.on(Event.USER_CLAIM_CAMERA_CHANGE, function (enable) {
      !enable && toast('老师关闭了你的摄像头');
    });
  }

  function toastMemberStatus() {
    var auth = RongClass.instance.auth,
      members = auth.members,
      role = auth.loginUser.role;
    if (role === RoleENUM.AUDIENCE) {
      toast('你当前身份是旁听人, 其它人看/听不见你');
    }
    if (members.length === 1) {
      toast('当前课堂只有你一人, 你可以等待或离开');
    }
  }

  function getMethods() {
    return {
      selectTab: function (tab) {
        this.selectedTab = tab;
      },
      hungup: hungup,
      closeClass: closeClass
    }
  }
  var tabList = [
    { name: '课堂消息', tag: 'chat' },
    { name: '在线人员', tag: 'user-list' }
  ];

  components.class = function (resolve) {
    var options = {
      name: 'class',
      template: '#rong-template-class',
      data: function () {
        return {
          tabList: tabList,
          selectedTab: tabList[0],
          userList: []
        };
      },
      computed: {
        loginUser: function () {
          return common.getLoginUser(this.userList);
        },
        assistant: function () {
          var role = RoleENUM.ASSISTANT;
          return common.getUserByRole(this.userList, role);
        },
        teacher: function () {
          var role = RoleENUM.TEACHER;
          return common.getUserByRole(this.userList, role);
        }
      },
      components: {
        'class-info': components.classInfo,
        'display': components.display,
        'rong-rtc': components.rtc,
        'chat': components.chat,
        'user-list': components.userList
      },
      methods: getMethods(),
      destroyed: function () {
        win.removeEventListener('beforeunload', this.beforeunload);
        win.removeEventListener('unload', this.unload);
      },
      mounted: function () {
        var context = this;
        context.userList = server.getUserList();
        emitter.on(Event.USER_LIST_CHANGED, function (list) {
          context.userList = list.filter(function (user) {
            return !!user.role;
          });
        });
        
        toastMemberStatus();

        hungupWhenBeforeUnload(context);
        hungupWhenClassKicked();
        hungupWhenClassDestroy();
        hungupWhenKickByOther();
        hungupWhenRTCError();
        toastWhenSelfRoleChanged();
        toastWhenDeviceChanged();
        reconnectWhenNetworkUnavailable();

        // 关闭笔记本盖子的临时解决方案
        window.onRTCClose = function () {
          var reload = function () {
            win.removeEventListener('beforeunload', context.beforeunload);
            win.removeEventListener('unload', context.unload);
            window.location.reload();
          };
          dialog.confirm({
            content: '网络异常, 请确保网络稳定后重新加载页面',
            confirmed: reload,
            canceled: reload
          });
        };
      }
    };
    common.component(options, resolve);
  };

})(window.RongClass, {
  Vue: window.Vue,
  win: window
}, window.RongClass.components);